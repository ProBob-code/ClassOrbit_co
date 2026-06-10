'use client';

import { usePlan } from '@/lib/hooks/usePlan';
import { ShieldAlert } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';

export default function BlockedShield() {
  const { is_blocked, loading: planLoading } = usePlan();
  const { signOut } = useUser();

  if (planLoading || !is_blocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#06040F] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <ShieldAlert size={48} className="text-red-500" />
      </div>
      <h1 className="text-3xl font-display font-bold text-text-main mb-3">Account Suspended</h1>
      <p className="text-text-muted max-w-md mb-8">
        Your access to ClassOrbit has been restricted due to a violation of our terms or suspicious activity. 
        Please contact support for more information.
      </p>
      <button 
        onClick={signOut}
        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-border rounded-xl font-bold text-text-main transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
