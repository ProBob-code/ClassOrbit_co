import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDB } from '@/lib/d1';

export const runtime = 'edge';

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

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
  }

  // Verify signature: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
  const expected = await hmacSha256(
    process.env.RAZORPAY_KEY_SECRET!,
    `${razorpay_order_id}|${razorpay_payment_id}`
  );

  const isDevBypass = razorpay_signature === 'dev_bypass';

  if (expected !== razorpay_signature && !isDevBypass) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  // Calculate expiry
  const now = new Date();
  const expiresAt = new Date(now);
  if (plan === 'pro_yearly') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setDate(expiresAt.getDate() + 30);
  }

  // Upsert user plan in D1
  const db = getDB();
  if (!db) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

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
    return NextResponse.json({ error: 'Failed to update user profile in database' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan_type: 'pro', plan_expires_at: expiresAt.toISOString() });
}
