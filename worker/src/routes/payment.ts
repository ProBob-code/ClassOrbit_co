import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/d1';
import { getSupabase } from '../lib/supabase';

const router = new Hono<AppEnv>();

const PLANS = {
  pro_monthly: { amount: 19900, description: 'ClassOrbit Pro: Monthly' },
  pro_yearly: { amount: 214800, description: 'ClassOrbit Pro: Yearly (₹179/mo)' },
} as const;

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

router.post('/create-order', async (c) => {
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const plan = body.plan as keyof typeof PLANS;

  if (!PLANS[plan]) {
    return c.json({ error: 'Invalid plan' }, 400);
  }

  const { amount, description } = PLANS[plan];
  const receipt = `co_${user.id.slice(0, 8)}_${Date.now()}`;

  const keyId = c.env.RAZORPAY_KEY_ID;
  const keySecret = c.env.RAZORPAY_KEY_SECRET;
  const auth = btoa(`${keyId}:${keySecret}`);

  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency: 'INR', receipt }),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.text();
    console.error('Razorpay create-order error:', err);
    return c.json({ error: 'Failed to create order' }, 500);
  }

  const order = await rzpRes.json() as any;
  return c.json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    description,
    plan,
  });
});

router.post('/verify-payment', async (c) => {
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await c.req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return c.json({ error: 'Missing payment fields' }, 400);
  }

  const expected = await hmacSha256(
    c.env.RAZORPAY_KEY_SECRET,
    `${razorpay_order_id}|${razorpay_payment_id}`
  );

  if (expected !== razorpay_signature) {
    return c.json({ error: 'Invalid payment signature' }, 400);
  }

  const now = new Date();
  const expiresAt = new Date(now);
  if (plan === 'pro_yearly') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setDate(expiresAt.getDate() + 30);
  }

  const db = getDB(c);

  try {
    await db.prepare(`
      INSERT INTO user_profiles (user_id, plan_type, razorpay_order_id, razorpay_payment_id, subscription_status, plan_expires_at, updated_at)
      VALUES (?, 'pro', ?, ?, 'active', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        plan_type = 'pro',
        razorpay_order_id = excluded.razorpay_order_id,
        razorpay_payment_id = excluded.razorpay_payment_id,
        subscription_status = 'active',
        plan_expires_at = excluded.plan_expires_at,
        updated_at = CURRENT_TIMESTAMP
    `).bind(user.id, razorpay_order_id, razorpay_payment_id, expiresAt.toISOString()).run();
  } catch (err: any) {
    console.error('Payment verification DB error:', err);
    return c.json({ error: 'Failed to update user profile in database' }, 500);
  }

  return c.json({ ok: true, plan_type: 'pro', plan_expires_at: expiresAt.toISOString() });
});

export default router;
