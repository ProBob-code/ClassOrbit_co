'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Zap } from 'lucide-react';
import CheckoutButton from './CheckoutButton';

const PRO_PERKS = [
  'Unlimited prompts every month',
  'Unlock premium engines (Suno, ElevenLabs, Ideogram & more)',
  'Attach reference documents (Syllabus, notes, PDFs)',
  'Unlock all 14 classroom content types',
  'Unlimited workspace folders & saved files',
  'Register custom AI tools for the launchpad',
];

interface Props {
  open: boolean;
  onClose: () => void;
  promptsUsed: number;
  promptLimit: number;
}

export default function UpgradeModal({ open, onClose, promptsUsed, promptLimit }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="relative bg-surface border border-border rounded-[32px] w-full max-w-md p-7 md:p-8 shadow-2xl z-10 overflow-hidden text-center"
          >
            {/* Background elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close */}
            <button onClick={onClose} className="absolute top-5 right-5 text-text-subtle hover:text-text-main transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]">
              <X size={20} />
            </button>

            {/* Orbiting Logo Badge */}
            <div className="relative flex items-center justify-center mb-6 h-28">
              {/* Spinning Outer Orbit Ring */}
              <div className="absolute w-30 h-30 border border-dashed border-primary/40 rounded-full animate-spin-slow pointer-events-none" />
              {/* Spinning Inner Reverse Orbit Ring */}
              <div className="absolute w-[98px] h-[98px] border border-dotted border-secondary/30 rounded-full animate-spin-reverse-slow pointer-events-none" />
              
              {/* Core Circular Logo Badge */}
              <div className="w-24 h-24 rounded-full drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] relative z-10 flex items-center justify-center bg-background border border-white/10 p-0 overflow-hidden">
                <img src="/logo_transparent.png" alt="ClassOrbit Logo" className="w-full h-full object-cover rounded-full" />
              </div>
            </div>

            {/* Headline */}
            <div className="mb-5">
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5 mb-3">
                <Zap size={10} fill="currentColor" /> Limit Reached
              </span>
              <h2 className="font-display text-[22px] font-extrabold tracking-tight text-white mb-2 leading-tight">
                Unlock ClassOrbit <span className="text-gradient-gold">PRO</span>
              </h2>
              <p className="text-[14px] text-text-muted leading-relaxed max-w-xs mx-auto">
                You've reached your free monthly limit. Remove all limits and unlock every feature ClassOrbit offers.
              </p>
            </div>

            {/* Usage progress bar */}
            <div className="bg-background/50 border border-border rounded-2xl p-4.5 mb-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Monthly Prompt Usage</span>
                <span className="text-[12px] font-bold text-primary">{promptsUsed} / {promptLimit}</span>
              </div>
              <div className="h-2 bg-background border border-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min((promptsUsed / promptLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Perks Checklist */}
            <ul className="space-y-2.5 mb-7 text-left max-w-[320px] mx-auto">
              {PRO_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-[13px] text-text-muted font-medium">{perk}</span>
                </li>
              ))}
            </ul>

            {/* Checkout Actions */}
            <div className="space-y-3">
              <CheckoutButton 
                plan="pro_monthly" 
                label="Upgrade to Pro — ₹199/month" 
                className="w-full py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white transition-all active:scale-[0.98] shadow-glow cursor-pointer"
                onSuccess={onClose} 
              />
              <button 
                onClick={onClose} 
                className="w-full text-center text-[13px] text-text-subtle hover:text-text-muted transition-colors py-1 cursor-pointer font-semibold"
              >
                Continue on Free plan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
