'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Zap } from 'lucide-react';
import CheckoutButton from './CheckoutButton';

const STORAGE_KEY = 'classorbit_last_pro_reminder';
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000; // 4 days

const PRO_PERKS = [
  'Unlimited prompts every month',
  'Unlock premium engines (Suno, ElevenLabs, Ideogram & more)',
  'Attach reference documents (Syllabus, notes, PDFs)',
  'Unlock all 14 classroom content types',
  'Unlimited workspace folders & saved files',
  'Register custom AI tools for the launchpad',
];

export default function ProReminderNotification() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkReminder = async () => {
      try {
        const res = await fetch('/api/me/plan');
        if (!res.ok) return;
        const plan = (await res.json()) as any;
        
        // If user is already pro or school, never remind them
        if (plan.is_pro || plan.plan_type === 'school') return;

        const lastReminder = localStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        if (!lastReminder || now - parseInt(lastReminder) >= FOUR_DAYS_MS) {
          // Trigger the reminder modal after a small initial load delay
          const timer = setTimeout(() => setOpen(true), 3000);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error('Failed checking pro reminder criteria', err);
      }
    };
    checkReminder();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setOpen(false);
  };

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
            onClick={handleDismiss}
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
            <button onClick={handleDismiss} className="absolute top-5 right-5 text-text-subtle hover:text-text-main transition-colors cursor-pointer">
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
            <div className="mb-6">
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5 mb-3">
                <Zap size={10} fill="currentColor" /> Premium Features Ready
              </span>
              <h2 className="font-display text-[22px] font-extrabold tracking-tight text-white mb-2 leading-tight">
                Unlock ClassOrbit <span className="text-gradient-gold">PRO</span>
              </h2>
              <p className="text-[14px] text-text-muted leading-relaxed max-w-xs mx-auto">
                Supercharge your teaching. Build and launch premium educational resources with unlimited AI capability.
              </p>
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
                label="Upgrade to Pro — ₹199/mo" 
                className="w-full py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white transition-all active:scale-[0.98] shadow-glow cursor-pointer"
                onSuccess={handleDismiss} 
              />
              <button 
                onClick={handleDismiss} 
                className="w-full text-center text-[13px] text-text-subtle hover:text-text-muted transition-colors py-1 cursor-pointer font-semibold"
              >
                Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
