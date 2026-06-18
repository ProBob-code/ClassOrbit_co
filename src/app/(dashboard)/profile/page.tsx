'use client';

import { useUser } from '@/lib/hooks/useUser';
import { usePlan } from '@/lib/hooks/usePlan';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Calendar, Sparkles, Star, LogOut, Shield, Crown, Zap, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import CheckoutButton from '@/components/ui/CheckoutButton';

export default function ProfilePage() {
  const { profile, loading: userLoading, signOut } = useUser();
  const plan = usePlan();
  const [stats, setStats] = useState({ prompts: 0, favorites: 0, loading: true });
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelPlan = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch('/api/me/cancel-plan', { method: 'POST' });
      if (res.ok) {
        plan.refetch();
        setIsCancelModalOpen(false);
      } else {
        const err = (await res.json()) as any;
        alert(err.error || 'Failed to cancel plan');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/prompts');
        if (res.ok) {
          const data = (await res.json()) as any;
          const promptsList = data.prompts ?? [];
          setStats({
            prompts: promptsList.length,
            favorites: promptsList.filter((p: any) => p.is_favorite === true || p.is_favorite === 1).length,
            loading: false,
          });
          return;
        }
      } catch (e) {
        console.error("Failed to fetch prompts from API, falling back to local storage", e);
      }

      // Fallback to local storage
      const savedPrompts = localStorage.getItem('classorbit_prompts');
      if (savedPrompts) {
        const prompts = JSON.parse(savedPrompts);
        setStats({
          prompts: prompts.length,
          favorites: prompts.filter((p: any) => p.isFavorite || p.is_favorite).length,
          loading: false,
        });
      } else {
        setStats({ prompts: 0, favorites: 0, loading: false });
      }
    };
    loadStats();
  }, []);

  const loading = userLoading || stats.loading;

  if (loading) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface/50 rounded-xl" />
          <div className="h-44 bg-surface/50 rounded-[28px]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-24 bg-surface/50 rounded-2xl" />
            <div className="h-24 bg-surface/50 rounded-2xl" />
          </div>
          <div className="h-32 bg-surface/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0 relative min-h-screen">
      {/* Background ambient light */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[250px] h-[250px] bg-primary opacity-5 blur-[80px] rounded-full" />
        <div className="absolute bottom-[30%] right-[10%] w-[300px] h-[300px] bg-secondary opacity-5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center gap-1.5">
            <User size={14} className="text-primary" /> Teacher profile
          </span>
          <h1 className="font-display text-display-lg-mobile md:text-[40px] text-text-main font-bold tracking-tight">
            My Profile
          </h1>
          <p className="text-body-md text-text-muted max-w-xl mt-1.5">
            Manage your ClassOrbit account credentials and active workspace subscriptions.
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel border border-border rounded-[28px] p-8 relative overflow-hidden shadow-soft"
        >
          {/* Subtle logo bg reflection */}
          <div className="absolute -right-16 -bottom-16 w-48 h-48 opacity-[0.02] pointer-events-none">
            <Image src="/logo_transparent.png" alt="" width={192} height={192} className="w-full h-full object-contain" />
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar with spinning cosmic orbits */}
            <div className="relative shrink-0 flex items-center justify-center h-28 w-28">
              {/* Spinning Outer Orbit Ring */}
              <div className="absolute w-28 h-28 border border-dashed border-primary/40 rounded-full animate-spin-slow pointer-events-none" />
              {/* Spinning Inner Reverse Orbit Ring */}
              <div className="absolute w-[94px] h-[94px] border border-dotted border-secondary/30 rounded-full animate-spin-reverse-slow pointer-events-none" />
              
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name || 'User'}
                  width={80}
                  height={80}
                  unoptimized
                  className="w-20 h-20 rounded-full border-2 border-white/10 object-cover shadow-glow relative z-10 bg-background"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-3xl relative z-10 shadow-glow">
                  {(profile?.name || profile?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
                <h2 className="font-display text-[26px] font-extrabold text-text-main">
                  {profile?.name || 'Teacher'}
                </h2>
                {plan.is_pro ? (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit mx-auto sm:mx-0 shadow-sm shadow-amber-500/5">
                    <Crown size={12} className="fill-amber-400" /> Pro Member
                  </span>
                ) : (
                  <span className="text-[10px] bg-white/5 text-text-muted border border-border px-3 py-1 rounded-full font-bold uppercase tracking-wider w-fit mx-auto sm:mx-0">
                    Free Member
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center justify-center sm:justify-start gap-2.5 text-text-muted text-[14px]">
                  <Mail size={15} className="text-text-subtle" />
                  <span>{profile?.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2.5 text-text-muted text-[14px]">
                  <Shield size={15} className="text-text-subtle" />
                  <span>Signed in with Google Secure SSO</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="glass-card border border-border rounded-2xl p-6 flex items-center gap-4 hover:border-primary/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-sm">
              <Sparkles size={22} className="group-hover:animate-float" />
            </div>
            <div>
              <span className="text-label-sm text-text-muted font-bold uppercase tracking-wider block mb-1">Prompts Created</span>
              <p className="font-display text-[32px] text-text-main font-extrabold leading-none">{stats.prompts}</p>
            </div>
          </div>

          <div className="glass-card border border-border rounded-2xl p-6 flex items-center gap-4 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-sm">
              <Star size={22} fill="currentColor" className="group-hover:animate-pulse" />
            </div>
            <div>
              <span className="text-label-sm text-text-muted font-bold uppercase tracking-wider block mb-1">Favorites Saved</span>
              <p className="font-display text-[32px] text-text-main font-extrabold leading-none">{stats.favorites}</p>
            </div>
          </div>
        </motion.div>

        {/* Plan / Subscription Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`glass-panel border rounded-3xl p-6 md:p-7 relative overflow-hidden shadow-soft ${
            plan.is_pro ? 'border-primary/30 bg-gradient-to-br from-primary/10 to-primary/2' : 'border-border'
          }`}
        >
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 mb-6">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
              plan.is_pro ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-muted'
            }`}>
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="font-display text-[18px] font-bold text-text-main">Plan & Billing</h3>
              <p className="text-[12px] text-text-muted mt-0.5">Configure billing details and limits</p>
            </div>
          </div>

          {plan.is_pro ? (
            /* PRO SUBSCRIPTION DETAILS */
            <div className="space-y-5">
              <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Crown size={18} fill="currentColor" />
                </div>
                <div className="flex-1">
                  <p className="font-display font-extrabold text-white text-[16px]">ClassOrbit Pro Membership</p>
                  <p className="text-[12px] text-primary font-medium">Unlimited prompts · Premium tools unlocked</p>
                </div>
                {plan.subscription_status === 'cancelled' ? (
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    Cancelled
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-white bg-primary px-3 py-1 rounded-full uppercase tracking-wider shadow-sm shadow-primary/20">
                    Active
                  </span>
                )}
              </div>

              {plan.plan_expires_at && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white/[0.01] border border-border/40 rounded-2xl px-4 py-3 w-full">
                  <div className="flex items-center gap-2.5 text-[13.5px] text-text-muted">
                    <Calendar size={15} className="text-primary" />
                    <span>
                      {plan.subscription_status === 'cancelled' ? 'Expires on: ' : 'Next billing date: '}
                      <strong className="text-text-main">
                        {new Date(plan.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </strong>
                    </span>
                  </div>
                  {plan.subscription_status !== 'cancelled' && (
                    <div className="text-[12.5px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit sm:ml-auto">
                      ✓ Cancel plan anytime
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {plan.subscription_status === 'cancelled' ? (
                  <p className="text-[13px] text-text-muted leading-relaxed">
                    Your plan has been cancelled and will not renew. You will retain Pro access until the expiration date.
                  </p>
                ) : (
                  <>
                    <p className="text-[13px] text-text-muted leading-relaxed">
                      Need to cancel or make changes? Reach out via the support chat at the bottom right.
                    </p>
                    <button
                      onClick={() => setIsCancelModalOpen(true)}
                      className="px-4 py-2 text-[12px] font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel Plan
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* FREE SUBSCRIPTION DETAILS */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-border/50 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-text-muted shrink-0">
                    <Zap size={18} />
                  </div>
                  <div>
                    <p className="font-display font-bold text-white text-[15px]">ClassOrbit Free Plan</p>
                    <p className="text-[12px] text-text-muted">25 prompts/month · 5 Content Types</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-text-muted bg-white/5 border border-border px-3 py-1 rounded-full uppercase tracking-wider w-fit">
                  Free
                </span>
              </div>

              {/* Usage bar */}
              <div className="bg-background/40 border border-border/60 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-primary" /> Prompt quota usage
                  </span>
                  <span className="text-[12px] font-bold text-primary">{plan.prompts_used} / {plan.prompt_limit ?? 25} prompts</span>
                </div>
                <div className="h-2 bg-background border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-primary shadow-glow"
                    style={{ width: `${Math.min(((plan.prompts_used) / (plan.prompt_limit ?? 25)) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-text-subtle mt-2">Quota refreshes automatically on the 1st of each month.</p>
              </div>

              {/* Checkout buttons */}
              <div className="pt-4 border-t border-border space-y-4">
                <p className="text-[14px] text-text-muted font-bold">Upgrade to Premium:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CheckoutButton 
                    plan="pro_monthly" 
                    label="Upgrade to Pro - ₹199/month" 
                    className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white transition-all active:scale-[0.98] shadow-glow cursor-pointer"
                    onSuccess={() => plan.refetch()} 
                  />
                  <CheckoutButton
                    plan="pro_yearly"
                    label="Yearly Plan - ₹179/mo (billed yearly)"
                    className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary/10 transition-all active:scale-[0.98] cursor-pointer"
                    onSuccess={() => plan.refetch()}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Actions Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card border border-border rounded-2xl p-6"
        >
          <h3 className="font-display text-[16px] font-bold text-text-main mb-4">Account Administration</h3>
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 font-bold text-[13px] transition-all cursor-pointer active:scale-95"
          >
            <LogOut size={16} />
            Sign Out of ClassOrbit
          </button>
        </motion.div>
      </div>

      {/* Cancel Plan Modal */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel border border-border rounded-3xl p-8 max-w-md w-full relative overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-5 shadow-glow">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="font-display text-[22px] font-bold text-text-main mb-3">Cancel Pro Membership?</h3>
                <p className="text-[14px] text-text-muted mb-8 leading-relaxed">
                  Are you sure you want to cancel your plan? You will lose access to unlimited prompts and premium features at the end of your billing cycle.
                </p>
                
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setIsCancelModalOpen(false)}
                    disabled={isCancelling}
                    className="flex-1 py-3.5 rounded-xl border border-border text-[14px] text-text-muted hover:text-text-main hover:bg-white/5 font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Keep Plan
                  </button>
                  <button
                    onClick={handleCancelPlan}
                    disabled={isCancelling}
                    className="flex-1 py-3.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 font-bold text-[14px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-glow cursor-pointer"
                  >
                    {isCancelling ? (
                      <span className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      'Cancel Plan'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
