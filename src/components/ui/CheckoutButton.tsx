'use client';

import { useState, useRef } from 'react';
import { Loader2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@/lib/hooks/useUser';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Props {
  plan: 'pro_monthly' | 'pro_yearly';
  label?: string;
  className?: string;
  onSuccess?: () => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutButton({ plan, label, className, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const { profile } = useUser();
  const planRef = useRef(plan);
  planRef.current = plan;

  const handleCheckout = async () => {
    setLoading(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Could not load payment module. Please check your connection.');
      setLoading(false);
      return;
    }

    // Create order on backend
    let orderData: any;
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      // Parse defensively: the endpoint may return an empty body or an HTML
      // error page (e.g. if the API worker is unreachable), which would make a
      // bare res.json() throw an opaque "Unexpected end of JSON input".
      const raw = await res.text();
      let parsed: any = null;
      if (raw) {
        try { parsed = JSON.parse(raw); } catch { /* non-JSON response */ }
      }

      if (!res.ok) {
        if (res.status === 401) throw new Error('Please sign in again to upgrade.');
        throw new Error(parsed?.error || `Payment service error (${res.status}). Please try again later.`);
      }
      if (!parsed?.order_id) {
        throw new Error('Payment service is temporarily unavailable. Please try again later.');
      }
      orderData = parsed;
    } catch (e: any) {
      toast.error(e.message || 'Could not start checkout. Please try again.');
      setLoading(false);
      return;
    }

    if (!orderData?.key_id) {
      toast.error('Payment is not configured. Please contact support.');
      setLoading(false);
      return;
    }

    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'ClassOrbit',
      description: orderData.description,
      image: `${window.location.origin}/logo_transparent.png`,
      order_id: orderData.order_id,
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planRef.current,
            }),
          });

          if (verifyRes.ok) {
            toast.success('🎉 You\'re now on Pro! All limits removed.', { duration: 5000 });
            onSuccess?.();
            // Reload to refresh plan state across all components
            setTimeout(() => window.location.reload(), 1500);
          } else {
            toast.error('Payment verification failed. Contact support with your payment ID: ' + response.razorpay_payment_id);
          }
        } catch {
          toast.error('Verification error. Please contact support.');
        }
        setLoading(false);
      },
      prefill: {
        name: profile?.name ?? '',
        email: profile?.email ?? '',
      },
      theme: { color: '#F59E0B' },
      modal: {
        ondismiss: () => setLoading(false),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      toast.error(`Payment failed: ${response.error?.description ?? 'Please try again.'}`);
      setLoading(false);
    });
    rzp.open();
  };

  return (
    <div className="w-full space-y-2">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={className ?? 'w-full py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-hover transition-all active:scale-[0.98] shadow-glow disabled:opacity-60'}
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Processing...</>
        ) : (
          <><Zap size={18} fill="currentColor" /> {label ?? 'Upgrade to Pro'}</>
        )}
      </button>
    </div>
  );
}
