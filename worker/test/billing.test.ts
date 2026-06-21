import { describe, it, expect } from 'vitest';
import {
  PLANS,
  isPlanId,
  hmacSha256Hex,
  timingSafeEqual,
  verifyPaymentSignature,
  verifyWebhookSignature,
  computePlanExpiry,
} from '../src/lib/billing';

describe('hmacSha256Hex', () => {
  it('matches the well-known RFC HMAC-SHA256 test vector', async () => {
    // HMAC-SHA256(key="key", "The quick brown fox jumps over the lazy dog")
    const out = await hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog');
    expect(out).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
  });
});

describe('timingSafeEqual', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
  });
  it('returns false for different strings of equal length', () => {
    expect(timingSafeEqual('abc123', 'abc124')).toBe(false);
  });
  it('returns false for different lengths', () => {
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('isPlanId', () => {
  it('accepts known plans and rejects everything else', () => {
    expect(isPlanId('pro_monthly')).toBe(true);
    expect(isPlanId('pro_yearly')).toBe(true);
    expect(isPlanId('free')).toBe(false);
    expect(isPlanId(undefined)).toBe(false);
    expect(isPlanId({})).toBe(false);
  });
});

describe('verifyPaymentSignature', () => {
  const secret = 'test_secret';
  const orderId = 'order_ABC';
  const paymentId = 'pay_XYZ';

  it('accepts a correctly computed signature', async () => {
    const sig = await hmacSha256Hex(secret, `${orderId}|${paymentId}`);
    expect(await verifyPaymentSignature(orderId, paymentId, sig, secret)).toBe(true);
  });

  it('rejects a tampered signature', async () => {
    const sig = await hmacSha256Hex(secret, `${orderId}|${paymentId}`);
    const bad = sig.slice(0, -1) + (sig.endsWith('a') ? 'b' : 'a');
    expect(await verifyPaymentSignature(orderId, paymentId, bad, secret)).toBe(false);
  });

  it('rejects when the secret differs', async () => {
    const sig = await hmacSha256Hex(secret, `${orderId}|${paymentId}`);
    expect(await verifyPaymentSignature(orderId, paymentId, sig, 'wrong_secret')).toBe(false);
  });
});

describe('verifyWebhookSignature', () => {
  const secret = 'whsec';
  const body = JSON.stringify({ event: 'order.paid', id: 'evt_1' });

  it('accepts the correct signature over the raw body', async () => {
    const sig = await hmacSha256Hex(secret, body);
    expect(await verifyWebhookSignature(body, sig, secret)).toBe(true);
  });

  it('rejects an empty signature', async () => {
    expect(await verifyWebhookSignature(body, '', secret)).toBe(false);
  });

  it('rejects when the body is mutated', async () => {
    const sig = await hmacSha256Hex(secret, body);
    expect(await verifyWebhookSignature(body + ' ', sig, secret)).toBe(false);
  });
});

describe('computePlanExpiry', () => {
  it('adds 30 days for monthly', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    expect(computePlanExpiry('monthly', from).toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });

  it('adds one year for yearly', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    expect(computePlanExpiry('yearly', from).toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('does not mutate the input date', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    computePlanExpiry('yearly', from);
    expect(from.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('maps each plan to a sane amount + cycle', () => {
    expect(PLANS.pro_monthly.cycle).toBe('monthly');
    expect(PLANS.pro_yearly.cycle).toBe('yearly');
    expect(PLANS.pro_monthly.amount).toBeGreaterThan(0);
    expect(PLANS.pro_yearly.amount).toBeGreaterThan(PLANS.pro_monthly.amount);
  });
});
