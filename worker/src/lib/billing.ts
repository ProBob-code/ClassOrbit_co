// Shared, pure billing helpers used by the payment routes, the Razorpay webhook,
// and the unit tests. Keeping the crypto + plan math here (instead of inline in a
// route) is what makes it unit-testable without a Worker runtime.

export type BillingCycle = 'monthly' | 'yearly';

export const PLANS = {
  pro_monthly: { amount: 19900, description: 'ClassOrbit Pro: Monthly', cycle: 'monthly' as BillingCycle },
  pro_yearly: { amount: 214800, description: 'ClassOrbit Pro: Yearly (₹179/mo)', cycle: 'yearly' as BillingCycle },
} as const;

export type PlanId = keyof typeof PLANS;

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && value in PLANS;
}

/** HMAC-SHA256 of `message` with `secret`, hex-encoded (Razorpay's signature format). */
export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Length-independent constant-time string compare to avoid signature timing leaks. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/** Verify the checkout callback signature: HMAC(`order_id|payment_id`, key_secret). */
export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string,
): Promise<boolean> {
  const expected = await hmacSha256Hex(keySecret, `${orderId}|${paymentId}`);
  return timingSafeEqual(expected, signature);
}

/** Verify a Razorpay webhook: HMAC(rawBody, webhook_secret) vs the X-Razorpay-Signature header. */
export async function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): Promise<boolean> {
  if (!signature) return false;
  const expected = await hmacSha256Hex(webhookSecret, rawBody);
  return timingSafeEqual(expected, signature);
}

/** Expiry for a plan from a start date: +30 days (monthly) or +1 year (yearly). */
export function computePlanExpiry(cycle: BillingCycle, from: Date = new Date()): Date {
  const d = new Date(from);
  if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setDate(d.getDate() + 30);
  return d;
}
