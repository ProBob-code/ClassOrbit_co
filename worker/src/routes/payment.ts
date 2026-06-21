import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/d1';
import { getSupabase } from '../lib/supabase';
import { alertAdmin } from '../lib/alert';
import {
  PLANS,
  isPlanId,
  computePlanExpiry,
  verifyPaymentSignature,
  verifyWebhookSignature,
  type PlanId,
} from '../lib/billing';

const router = new Hono<AppEnv>();

/**
 * Upserts a user to Pro and records the payment. Idempotent — safe to call from
 * both the checkout callback and the webhook for the same order.
 */
async function markPaid(
  db: D1Database,
  args: { userId: string; plan: PlanId; orderId: string; paymentId: string },
) {
  const expiresAt = computePlanExpiry(PLANS[args.plan].cycle).toISOString();

  await db
    .prepare(
      `INSERT INTO user_profiles (user_id, plan_type, razorpay_order_id, razorpay_payment_id, subscription_status, plan_expires_at, updated_at)
       VALUES (?, 'pro', ?, ?, 'active', ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         plan_type = 'pro',
         razorpay_order_id = excluded.razorpay_order_id,
         razorpay_payment_id = excluded.razorpay_payment_id,
         subscription_status = 'active',
         plan_expires_at = excluded.plan_expires_at,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(args.userId, args.orderId, args.paymentId, expiresAt)
    .run();

  // Best-effort: mark the order row paid (table may not exist on very old DBs).
  try {
    await db
      .prepare(
        "UPDATE payment_orders SET status = 'paid', razorpay_payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?",
      )
      .bind(args.paymentId, args.orderId)
      .run();
  } catch (err) {
    console.error('[payment] could not update payment_orders for', args.orderId, err);
  }

  return { plan_type: 'pro' as const, plan_expires_at: expiresAt };
}

router.post('/create-order', async (c) => {
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const plan = body.plan;
  if (!isPlanId(plan)) {
    return c.json({ error: 'Invalid plan' }, 400);
  }

  const { amount, description } = PLANS[plan];
  const receipt = `co_${user.id.slice(0, 8)}_${Date.now()}`;

  const auth = btoa(`${c.env.RAZORPAY_KEY_ID}:${c.env.RAZORPAY_KEY_SECRET}`);
  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    // notes ride along to the webhook, giving it the user + plan without a session.
    body: JSON.stringify({ amount, currency: 'INR', receipt, notes: { user_id: user.id, plan } }),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.text();
    console.error('Razorpay create-order error:', err);
    return c.json({ error: 'Failed to create order' }, 500);
  }

  const order = await rzpRes.json() as any;

  // Persist the order->user mapping so the webhook can grant Pro even if the user
  // closes the tab before the in-browser verify call runs.
  try {
    await getDB(c)
      .prepare(
        `INSERT INTO payment_orders (order_id, user_id, plan, amount, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'created', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(order_id) DO NOTHING`,
      )
      .bind(order.id, user.id, plan, amount)
      .run();
  } catch (err) {
    console.error('[payment] could not record payment_orders for', order.id, err);
  }

  return c.json({ order_id: order.id, amount: order.amount, currency: order.currency, description, plan });
});

router.post('/verify-payment', async (c) => {
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await c.req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return c.json({ error: 'Missing payment fields' }, 400);
  }
  if (!isPlanId(plan)) {
    return c.json({ error: 'Invalid plan' }, 400);
  }

  const valid = await verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    c.env.RAZORPAY_KEY_SECRET,
  );
  if (!valid) {
    return c.json({ error: 'Invalid payment signature' }, 400);
  }

  try {
    const result = await markPaid(getDB(c), {
      userId: user.id,
      plan,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
    return c.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('Payment verification DB error:', err);
    await alertAdmin(c.env, 'payment-verify-db', 'Payment verify DB write failed', `user=${user.id} order=${razorpay_order_id}: ${err?.message || err}`);
    return c.json({ error: 'Failed to update user profile in database' }, 500);
  }
});

/**
 * Razorpay webhook — the server-side safety net. Fires even if the user never
 * returns to the browser callback. Authenticated by signature, not session.
 * Configure in Razorpay Dashboard → Webhooks: URL https://classorbit.co/api/razorpay-webhook,
 * events order.paid + payment.captured, secret = RAZORPAY_WEBHOOK_SECRET.
 */
router.post('/razorpay-webhook', async (c) => {
  const raw = await c.req.text();
  const signature = c.req.header('x-razorpay-signature') || '';

  const valid = await verifyWebhookSignature(raw, signature, c.env.RAZORPAY_WEBHOOK_SECRET);
  if (!valid) {
    console.error('[webhook] invalid signature');
    return c.json({ error: 'Invalid signature' }, 400);
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return c.json({ error: 'Invalid payload' }, 400);
  }

  // Only act on successful-payment events; ack everything else so Razorpay stops retrying.
  if (event.event !== 'order.paid' && event.event !== 'payment.captured') {
    return c.json({ ok: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity;
  const order = event.payload?.order?.entity;
  const orderId: string | undefined = order?.id || payment?.order_id;
  const paymentId: string | undefined = payment?.id;
  const notes = order?.notes || payment?.notes || {};

  if (!orderId || !paymentId) {
    await alertAdmin(c.env, 'webhook-missing-ids', 'Webhook missing order/payment id', raw.slice(0, 500));
    return c.json({ ok: true }); // ack; nothing we can do
  }

  try {
    const db = getDB(c);
    // Prefer the stored mapping; fall back to the order notes.
    const mapped = await db
      .prepare('SELECT user_id, plan FROM payment_orders WHERE order_id = ?')
      .bind(orderId)
      .first<{ user_id: string; plan: string }>()
      .catch(() => null);

    const userId: string | undefined = mapped?.user_id || notes.user_id;
    const planRaw = mapped?.plan || notes.plan;

    if (!userId || !isPlanId(planRaw)) {
      await alertAdmin(c.env, 'webhook-unmapped-order', 'Webhook could not map order to a user', `order=${orderId} notes=${JSON.stringify(notes)}`);
      return c.json({ ok: true }); // ack to stop retries; surfaced via alert
    }

    await markPaid(db, { userId, plan: planRaw, orderId, paymentId });
    return c.json({ ok: true });
  } catch (err: any) {
    console.error('[webhook] processing error', err);
    await alertAdmin(c.env, 'webhook-process-error', 'Webhook processing failed', `order=${orderId}: ${err?.message || err}`);
    // 500 → Razorpay will retry later, which is what we want for a transient DB error.
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

export default router;
