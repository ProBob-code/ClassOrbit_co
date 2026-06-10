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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create order');
      }
      orderData = await res.json();
    } catch (e: any) {
      toast.error(e.message || 'Could not start checkout. Please try again.');
      setLoading(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
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

  const isDev = process.env.NODE_ENV === 'development';

  const handleDevBypass = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: `dev_order_${Math.random().toString(36).slice(2)}`,
          razorpay_payment_id: `dev_pay_${Math.random().toString(36).slice(2)}`,
          razorpay_signature: 'dev_bypass',
          plan: planRef.current,
        }),
      });

      if (res.ok) {
        toast.success('🎉 Dev Bypass Success! Plan set to Pro.', { duration: 5000 });
        onSuccess?.();
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error('Dev bypass verification failed.');
      }
    } catch {
      toast.error('Dev bypass verification failed.');
    } finally {
      setLoading(false);
    }
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
      {isDev && (
        <button
          type="button"
          onClick={handleDevBypass}
          disabled={loading}
          className="w-full py-2 rounded-lg font-semibold text-[12px] flex items-center justify-center gap-1.5 border border-dashed border-primary/40 text-primary/80 hover:bg-primary/5 transition-all cursor-pointer"
        >
          ⚡ Dev Bypass Payment (Success)
        </button>
      )}
    </div>
  );
}
