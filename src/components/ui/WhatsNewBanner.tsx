'use client';

import { useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { isNewContentLive } from '@/data/content-types';

/**
 * Bump this when the next release wants the banner back — dismissals are keyed
 * on it, so a new id re-shows the banner to everyone who dismissed the old one.
 */
const RELEASE_ID = 'paper-suite-2026-08';
const STORAGE_KEY = 'classorbit_dismissed_whats_new';

// The dismissal lives in localStorage, which the server cannot read. Reading it
// through useSyncExternalStore keeps SSR honest — the server snapshot says
// "already dismissed", so the banner never flashes at someone who closed it —
// and React swaps in the real value after hydration. Nothing writes to the key
// outside this component, so `subscribe` has nothing to listen for.
const subscribe = () => () => {};
const getStoredRelease = () => localStorage.getItem(STORAGE_KEY);
const getServerRelease = () => RELEASE_ID;

export default function WhatsNewBanner({ onTry }: { onTry: () => void }) {
  const storedRelease = useSyncExternalStore(subscribe, getStoredRelease, getServerRelease);
  const [justDismissed, setJustDismissed] = useState(false);

  const visible = !justDismissed && storedRelease !== RELEASE_ID && isNewContentLive();

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, RELEASE_ID);
    setJustDismissed(true);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.07] p-5 text-left"
        >
          <button
            onClick={dismiss}
            aria-label="Dismiss what's new"
            className="absolute top-3 right-3 text-text-subtle hover:text-text-main transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  New
                </span>
                <h4 className="text-label-md font-bold text-text-main">
                  New feature added
                </h4>
              </div>
              <p className="text-body-sm text-text-muted leading-relaxed">
                Upload an old question paper and get a new one back in the same format.
                In Maths and Science, the questions stay and the numbers change.
                In English, the questions are new but test the same skills.
                We have also added <strong className="text-text-main">Answer Key</strong>.
                Uploading a sample is optional.
              </p>
              <button
                onClick={() => { dismiss(); onTry(); }}
                className="inline-flex items-center gap-1.5 text-label-sm font-bold text-primary hover:gap-2.5 transition-all"
              >
                Try it now
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
