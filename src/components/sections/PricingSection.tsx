'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, Zap, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/useUser';
import CheckoutButton from '@/components/ui/CheckoutButton';

const FREE_FEATURES = [
  '25 prompts per month',

  'Free Type + Guided Builder',
  '5 workspace folders · 25 saves per folder',
  '5 content types (Lesson Plan, Quiz, Worksheet, Flashcards, Homework)',
  'Up to 10 document uploads per month',
  'ZIP export of your workspace',
];

const PRO_FEATURES = [
  'Unlimited prompts per month',
  'All available AI platforms per prompt',
  'All 14 content types unlocked',
  'Unlimited workspace folders & saved files',
  'Unlimited document uploads (PDF, DOCX, TXT)',
  'Custom AI tool registry',
  'Public prompt sharing with link',
  'Priority generation speed',
  'Early access to new features',
];

const SCHOOL_FEATURES = [
  'Everything in Pro, for every teacher',
  'Per-faculty volume pricing (10+ seats)',
  'Shared school workspace & prompt library',
  'Admin dashboard with usage analytics',
  'Invoice & PO billing accepted',
  'Dedicated onboarding & training session',
  'Priority phone & email support',
  'Custom curriculum & board integration',
  'Google Workspace SSO for all staff',
];

interface PricingCardProps {
  icon: React.ReactNode;
  tier: string;
  badge?: string;
  price: string;
  priceNote: string;
  yearlyPrice?: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlight?: boolean;
  isYearly: boolean;
  ctaVariant?: 'primary' | 'outline' | 'ghost';
  customCta?: React.ReactNode;
}

function PricingCard({ icon, tier, badge, price, priceNote, yearlyPrice, features, cta, ctaHref, highlight, isYearly, ctaVariant = 'outline', customCta }: PricingCardProps) {
  const displayPrice = isYearly && yearlyPrice ? yearlyPrice : price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative rounded-[28px] p-7 flex flex-col ${
        highlight
          ? 'bg-gradient-to-b from-primary/15 to-primary/5 border-2 border-primary shadow-[0_0_60px_-15px_rgba(245,158,11,0.4)]'
          : 'glass-card'
      }`}
    >
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-glow whitespace-nowrap uppercase tracking-wider">
          {badge}
        </div>
      )}

      <div className="mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${highlight ? 'bg-primary/20 text-primary' : 'bg-white/5 border border-white/10 text-text-muted'}`}>
          {icon}
        </div>
        <h3 className="font-display text-[22px] font-bold text-white mb-1">{tier}</h3>
        <div className="flex items-end gap-1.5">
          <span className="font-display text-[40px] font-extrabold text-white leading-none">{displayPrice}</span>
          <span className="text-text-muted text-[14px] pb-1.5">{priceNote}</span>
        </div>
        {isYearly && yearlyPrice && yearlyPrice !== price && (
          <p className="text-[12px] text-emerald-400 font-semibold mt-1">Save 10% vs monthly</p>
        )}
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${highlight ? 'text-primary' : 'text-emerald-500'}`} />
            <span className="text-[14px] text-text-muted leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      {customCta ?? (
        <Link
          href={ctaHref}
          className={`w-full py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            ctaVariant === 'primary'
              ? 'bg-primary text-white hover:bg-primary-hover shadow-glow'
              : ctaVariant === 'outline'
              ? 'border-2 border-primary text-primary hover:bg-primary/10'
              : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
          }`}
        >
          {cta}
        </Link>
      )}
    </motion.div>
  );
}

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const { user } = useUser();

  return (
    <section id="pricing" className="py-24 px-margin-mobile md:px-margin-page relative border-t border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 blur-[180px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="text-[14px] font-bold text-primary tracking-[0.2em] uppercase mb-4 block">Pricing</span>
          <h2 className="font-display text-[40px] md:text-[52px] text-white font-extrabold leading-[1.1] tracking-tight">
            Simple, honest pricing
          </h2>
          <p className="text-[18px] text-text-muted max-w-xl mx-auto mt-4">
            Start free. Upgrade when you love it. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 mt-8 bg-surface border border-border rounded-full px-2 py-2">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all ${!isYearly ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all flex items-center gap-1.5 ${isYearly ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}
            >
              Yearly
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">−10%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <PricingCard
            icon={<Sparkles size={22} />}
            tier="Free"
            price="₹0"
            priceNote="/ forever"
            features={FREE_FEATURES}
            cta="Get Started Free"
            ctaHref="/login?next=/builder"
            ctaVariant="ghost"
            isYearly={isYearly}
          />
          <PricingCard
            icon={<Zap size={22} />}
            tier="Pro"
            badge="Most Popular"
            price="₹199"
            priceNote="/ month"
            yearlyPrice="₹179"
            features={PRO_FEATURES}
            cta="Upgrade to Pro"
            ctaHref={`/login?next=/pricing`}
            ctaVariant="primary"
            highlight
            isYearly={isYearly}
            customCta={
              user ? (
                <CheckoutButton
                  plan={isYearly ? 'pro_yearly' : 'pro_monthly'}
                  label={isYearly ? 'Upgrade: ₹179/mo (yearly)' : 'Upgrade to Pro: ₹199/mo'}
                />
              ) : undefined
            }
          />
          <PricingCard
            icon={<Building2 size={22} />}
            tier="School"
            price="Custom"
            priceNote="per faculty / mo"
            features={SCHOOL_FEATURES}
            cta="Contact Us"
            ctaHref="mailto:hello@classorbit.co"
            ctaVariant="outline"
            isYearly={isYearly}
          />
        </div>

        <p className="text-center text-[13px] text-text-subtle mt-8 font-medium">
          All plans include Google SSO · No credit card required to start · Cancel anytime
        </p>
      </div>
    </section>
  );
}
