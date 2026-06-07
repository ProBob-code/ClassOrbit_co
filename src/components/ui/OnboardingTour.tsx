'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'classorbit_onboarding_done';

const steps = [
  {
    title: 'Welcome to ClassOrbit! 🚀',
    body: 'You\'re in the Prompt Builder. Choose between Guided Builder (step-by-step form) or Free Type (just describe what you need).',
    target: 'mode-toggle',
  },
  {
    title: 'Pick your content type',
    body: 'Tell us what you\'re making — a Lesson Plan, Quiz, Worksheet, PPT Slides, and more. Each type generates a purpose-built prompt.',
    target: 'content-type',
  },
  {
    title: 'Choose your AI platforms',
    body: 'Select one or more tools — ChatGPT, Claude, Gamma, Canva, and more. Each platform gets its own optimized prompt.',
    target: 'tools-select',
  },
  {
    title: 'Hit Build My Prompt!',
    body: 'ClassOrbit generates your prompt and lets you launch directly into any AI tool with one click. Your data syncs across devices automatically.',
    target: 'build-button',
  },
];

export default function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the page finishes loading before showing
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = steps[step];

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] pointer-events-none"
          />

          {/* Tour card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-32px)] max-w-sm bg-surface border border-border rounded-[20px] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'bg-primary w-6' : 'bg-white/10 w-3'}`} />
                ))}
              </div>
              <button onClick={dismiss} className="text-text-subtle hover:text-text-main transition-colors -mt-0.5">
                <X size={18} />
              </button>
            </div>

            <h3 className="font-display text-[17px] font-bold text-white mb-2">{current.title}</h3>
            <p className="text-[14px] text-text-muted leading-relaxed mb-5">{current.body}</p>

            <div className="flex items-center justify-between">
              <button onClick={dismiss} className="text-[13px] text-text-subtle hover:text-text-muted font-medium transition-colors">
                Skip tour
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-primary-hover transition-all shadow-sm"
              >
                {step < steps.length - 1 ? 'Next' : 'Get Started'}
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
