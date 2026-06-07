'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Heart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_SUBMITTED = 'classorbit_feedback_submitted';
const STORAGE_DISMISSED = 'classorbit_feedback_last_dismissed';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export default function FeedbackModal() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkFeedbackStatus = () => {
      // 1. If already submitted feedback, never ask again
      const submitted = localStorage.getItem(STORAGE_SUBMITTED);
      if (submitted === 'true') return;

      // 2. Check 3 days interval of last dismissal
      const lastDismissed = localStorage.getItem(STORAGE_DISMISSED);
      const now = Date.now();

      if (lastDismissed && now - parseInt(lastDismissed) < THREE_DAYS_MS) {
        return;
      }

      // 3. Check if shown today already (once in a day rule)
      const todayStr = new Date().toDateString();
      const lastShownToday = localStorage.getItem('classorbit_feedback_last_shown_today');
      if (lastShownToday === todayStr) {
        return;
      }

      // Show rating reminder after initial loading delay
      const timer = setTimeout(() => {
        setOpen(true);
        localStorage.setItem('classorbit_feedback_last_shown_today', todayStr);
      }, 6000); // 6 seconds delay (shows after onboarding/pro reminders settle)
      return () => clearTimeout(timer);
    };
    checkFeedbackStatus();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_DISMISSED, Date.now().toString());
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback: review }),
      });

      if (res.ok) {
        localStorage.setItem(STORAGE_SUBMITTED, 'true');
        toast.success('Thank you for your valuable feedback! ❤️');
        setOpen(false);
      } else {
        toast.error('Could not save feedback. Please try again.');
      }
    } catch {
      toast.error('Could not save feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
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
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close */}
            <button onClick={handleDismiss} className="absolute top-5 right-5 text-text-subtle hover:text-text-main transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]">
              <X size={18} />
            </button>

            {/* Orbiting Logo Badge */}
            <div className="relative flex items-center justify-center mb-5 h-24">
              {/* Spinning Outer Orbit Ring */}
              <div className="absolute w-26 h-26 border border-dashed border-secondary/40 rounded-full animate-spin-slow pointer-events-none" />
              {/* Spinning Inner Reverse Orbit Ring */}
              <div className="absolute w-[84px] h-[84px] border border-dotted border-primary/30 rounded-full animate-spin-reverse-slow pointer-events-none" />
              
              {/* Core Circular Logo Badge */}
              <div className="w-20 h-20 rounded-full drop-shadow-[0_0_10px_rgba(139,92,246,0.3)] relative z-10 flex items-center justify-center bg-background border border-white/10 p-0 overflow-hidden">
                <img src="/logo_transparent.png" alt="ClassOrbit Logo" className="w-full h-full object-cover rounded-full" />
              </div>
            </div>

            {/* Headline */}
            <div className="mb-5">
              <span className="text-[10px] font-bold text-secondary bg-secondary-light border border-secondary/20 px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1 mb-2">
                <Heart size={10} className="text-secondary fill-secondary" /> We Value Your Voice
              </span>
              <h2 className="font-display text-[20px] font-extrabold tracking-tight text-white mb-2 leading-tight">
                How is your ClassOrbit experience?
              </h2>
              <p className="text-[13px] text-text-muted leading-relaxed max-w-xs mx-auto">
                Help us craft the ultimate AI assistant for teachers by leaving a rating and constructive feedback.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Star Rating Selectors */}
              <div className="flex items-center justify-center gap-1.5 mb-5 mt-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-text-subtle hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer p-0.5"
                    >
                      <Star
                        size={28}
                        className={`${
                          active
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                            : 'text-text-subtle'
                        } transition-colors`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Constructive review comments */}
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                  Constructive Review & Feedback
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share what you like or how we can improve..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[13px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary-light transition-all resize-none"
                />
              </div>

              {/* Submit / Skip buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-[13px] text-text-subtle hover:text-text-muted font-semibold transition-colors cursor-pointer py-1"
                >
                  Later
                </button>
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="bg-secondary hover:bg-secondary-hover text-white px-5 py-2.5 rounded-xl font-bold text-[13px] transition-colors shadow-glow-purple flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Submit Feedback
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
