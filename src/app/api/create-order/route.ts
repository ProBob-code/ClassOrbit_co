import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

const PLANS = {
  pro_monthly: { amount: 19900, description: 'ClassOrbit Pro — Monthly' },
  pro_yearly:  { amount: 214800, description: 'ClassOrbit Pro — Yearly (₹179/mo)' },
} as const;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const plan = body.plan as keyof typeof PLANS;

  if (!PLANS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const { amount, description } = PLANS[plan];
  const receipt = `co_${user.id.slice(0, 8)}_${Date.now()}`;

  const keyId     = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
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
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  const order = await rzpRes.json();
  return NextResponse.json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    description,
    plan,
  });
}
