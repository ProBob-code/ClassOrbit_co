'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CheckoutButton from '@/components/ui/CheckoutButton';
import { usePlan } from '@/lib/hooks/usePlan';

const PRO_PERKS = [
  { icon: '∞', label: 'Unlimited prompts per month', sub: 'No cap - build as many prompts as you need' },
  { icon: '🤖', label: 'All available AI platforms', sub: 'ChatGPT, Claude, Canva, Gamma, Suno, ElevenLabs, Ideogram & more' },
  { icon: '📎', label: 'Unlimited document uploads', sub: 'Attach your syllabus, textbook, or notes as context - no cap' },
  { icon: '📋', label: 'All 14 content types', sub: 'Quiz, PPT, Debate, Rubric, Video Script, Study Guide & more' },
  { icon: '🗂️', label: 'Unlimited Workspace', sub: 'Unlimited folders and saved files, across all devices' },
  { icon: '🔧', label: 'Custom AI tools', sub: 'Register any AI tool to your personal launchpad' },
  { icon: '🔗', label: 'Public prompt sharing', sub: 'Share prompts with colleagues via a link' },
  { icon: '⚡', label: 'Priority generation speed', sub: 'Your prompts are processed first, always' },
];

export default function UpgradePage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const plan = usePlan();

  if (!plan.loading && plan.is_pro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-[32px] p-12 max-w-md">
          <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-5">
            <Zap size={28} className="text-primary" fill="currentColor" />
          </div>
          <h1 className="font-display text-[28px] font-extrabold text-white mb-3">You&apos;re already on Pro!</h1>
          <p className="text-text-muted text-[15px] mb-8">All features are unlocked. Go build something great.</p>
          <Link href="/builder" className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl font-bold hover:bg-primary-hover transition-all shadow-glow">
            <Sparkles size={18} /> Open Prompt Builder
          </Link>
        </motion.div>
      </div>
    );
  }

  const monthlyPrice = 199;
  const yearlyMonthlyPrice = 179;
  const yearlySaving = Math.round((1 - yearlyMonthlyPrice / monthlyPrice) * 100);

  return (
    <div className="w-full max-w-[960px] mx-auto px-margin-mobile md:px-margin-page py-10 mt-16 md:mt-0 min-h-screen">

      {/* Back */}
      <Link href="/builder" className="inline-flex items-center gap-2 text-text-muted hover:text-text-main text-sm font-medium transition-colors mb-8">
        <ArrowLeft size={16} /> Back to Builder
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* LEFT - Perks */}
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-widest mb-5">
              <Zap size={12} fill="currentColor" /> ClassOrbit Pro
            </div>
            <h1 className="font-display text-[36px] md:text-[44px] font-extrabold text-white leading-[1.1] tracking-tight mb-4">
              Unlock everything.<br />
              <span className="text-gradient-gold">No limits.</span>
            </h1>
            <p className="text-[17px] text-text-muted leading-relaxed mb-8">
              Everything a teacher needs to prep faster, teach better, and use AI like a pro - for less than a coffee a week.
            </p>
          </motion.div>

          <div className="space-y-3">
            {PRO_PERKS.map((perk, i) => (
              <motion.div
                key={perk.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-center gap-4 glass-card rounded-2xl px-5 py-4"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-[18px] shrink-0">
                  {perk.icon}
                </div>
                <div>
                  <p className="font-semibold text-white text-[14px] leading-snug">{perk.label}</p>
                  <p className="text-[12px] text-text-muted">{perk.sub}</p>
                </div>
                <CheckCircle2 size={16} className="text-primary shrink-0 ml-auto" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT - Checkout card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:sticky lg:top-24"
        >
          <div className="glass-panel rounded-[28px] p-7 border border-primary/20 shadow-[0_0_60px_-20px_rgba(245,158,11,0.3)]">

            {/* Billing toggle */}
            <div className="flex gap-1 bg-background border border-border rounded-xl p-1 mb-6">
              <button
                onClick={() => setBilling('monthly')}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all ${billing === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${billing === 'yearly' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Yearly
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide transition-all ${billing === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  -{yearlySaving}%
                </span>
              </button>
            </div>

            {/* Price display */}
            <div className="text-center mb-6 pb-6 border-b border-border">
              <div className="flex items-end justify-center gap-1.5">
                <span className="font-display text-[52px] font-extrabold text-white leading-none">
                  ₹{billing === 'monthly' ? monthlyPrice : yearlyMonthlyPrice}
                </span>
                <span className="text-text-muted text-[15px] mb-2.5">/ month</span>
              </div>
              {billing === 'yearly' && (
                <p className="text-[12px] text-emerald-400 font-semibold mt-1.5">
                  Billed as ₹{(yearlyMonthlyPrice * 12).toLocaleString('en-IN')}/year · Save ₹{((monthlyPrice - yearlyMonthlyPrice) * 12).toLocaleString('en-IN')}
                </p>
              )}
              {billing === 'monthly' && (
                <p className="text-[12px] text-text-subtle mt-1.5">Switch to yearly to save ₹{((monthlyPrice - yearlyMonthlyPrice) * 12).toLocaleString('en-IN')}/year</p>
              )}
            </div>

            {/* Usage status */}
            {!plan.loading && (
              <div className="mb-5">
                <div className="flex justify-between text-[12px] font-bold mb-1.5">
                  <span className="text-text-muted">This month&apos;s usage</span>
                  <span className="text-primary">{plan.prompts_used}/{plan.prompt_limit} prompts</span>
                </div>
                <div className="h-2 bg-background border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(((plan.prompts_used) / (plan.prompt_limit ?? 25)) * 100, 100)}%`,
                      background: (plan.prompts_used / (plan.prompt_limit ?? 25)) >= 0.8 ? '#F97316' : '#F59E0B',
                    }}
                  />
                </div>
              </div>
            )}

            {/* CTA */}
            <CheckoutButton
              plan={billing === 'monthly' ? 'pro_monthly' : 'pro_yearly'}
              label={billing === 'monthly' ? 'Upgrade to Pro - ₹199/month' : 'Upgrade to Pro - ₹179/month'}
            />

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-4 text-[12px] text-text-subtle">
                <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-500" /> No contracts</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-500" /> Cancel anytime</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-500" /> Instant access</span>
              </div>
              <p className="text-center text-[11px] text-text-subtle">
                Secured by Razorpay · UPI, Cards & NetBanking accepted
              </p>
            </div>
          </div>

          {/* School plan callout */}
          <div className="mt-4 glass-card rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-[18px] shrink-0">🏫</div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white">School or institution?</p>
              <p className="text-[11px] text-text-muted">Volume pricing for 10+ teachers - email us</p>
            </div>
            <a href="mailto:hello@classorbit.co" className="text-primary text-[12px] font-bold hover:underline shrink-0">
              Contact →
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
