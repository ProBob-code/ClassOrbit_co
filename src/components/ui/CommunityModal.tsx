'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Users, ArrowUpRight } from 'lucide-react';
import { WHATSAPP_COMMUNITY_URL, COMMUNITY_BENEFITS, POPUP_KEYS } from '@/lib/community';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000; // gap between asks — leaves days free for the feedback prompt
const MAX_SHOWS = 3;                          // stop asking after this many ignored invites

/** Official WhatsApp glyph (lucide has no brand icons). */
export function WhatsAppIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0 0 20.465 3.488" />
    </svg>
  );
}

export default function CommunityModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Already joined → never nag again.
    if (localStorage.getItem(POPUP_KEYS.communityJoined) === 'true') return;

    // Give up after a few ignored invites so this never becomes noise.
    const shows = parseInt(localStorage.getItem(POPUP_KEYS.communityShowCount) ?? '0', 10) || 0;
    if (shows >= MAX_SHOWS) return;

    // Backed off for a week after an explicit dismissal, and a couple of days
    // after any showing — the quiet days are when feedback gets asked instead.
    const lastDismissed = localStorage.getItem(POPUP_KEYS.communityDismissed);
    if (lastDismissed && Date.now() - parseInt(lastDismissed) < SEVEN_DAYS_MS) return;
    const lastShown = localStorage.getItem(POPUP_KEYS.communityLastShown);
    if (lastShown && Date.now() - parseInt(lastShown) < COOLDOWN_MS) return;

    // Fires before the feedback prompt (6s), which then stands down for today.
    const timer = setTimeout(() => {
      setOpen(true);
      localStorage.setItem(POPUP_KEYS.communityLastShown, Date.now().toString());
      localStorage.setItem(POPUP_KEYS.communityShowCount, String(shows + 1));
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(POPUP_KEYS.communityDismissed, Date.now().toString());
    setOpen(false);
  };

  const handleJoin = () => {
    localStorage.setItem(POPUP_KEYS.communityJoined, 'true');
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="relative bg-surface border border-border rounded-[32px] w-full max-w-md p-7 md:p-8 shadow-2xl z-10 overflow-hidden text-center"
          >
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={handleDismiss}
              className="absolute top-5 right-5 text-text-subtle hover:text-text-main transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* WhatsApp badge with orbit rings, echoing the feedback popup */}
            <div className="relative flex items-center justify-center mb-5 h-24">
              <div className="absolute w-26 h-26 border border-dashed border-emerald-500/40 rounded-full animate-spin-slow pointer-events-none" />
              <div className="absolute w-[84px] h-[84px] border border-dotted border-emerald-400/30 rounded-full animate-spin-reverse-slow pointer-events-none" />
              <div className="w-20 h-20 rounded-full drop-shadow-[0_0_10px_rgba(16,185,129,0.35)] relative z-10 flex items-center justify-center bg-[#25D366] text-white">
                <WhatsAppIcon size={40} />
              </div>
            </div>

            <div className="mb-5">
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1 mb-2">
                <Users size={10} /> Teacher Community
              </span>
              <h2 className="font-display text-[20px] font-extrabold tracking-tight text-white mb-2 leading-tight">
                Join the ClassOrbit teacher community
              </h2>
              <p className="text-[13px] text-text-muted leading-relaxed max-w-xs mx-auto">
                A free WhatsApp group where teachers share what actually works with AI in the classroom.
              </p>
            </div>

            <ul className="space-y-2.5 text-left mb-6">
              {COMMUNITY_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[13px] text-text-main">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} className="text-emerald-400" strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleDismiss}
                className="text-[13px] text-text-subtle hover:text-text-muted font-semibold transition-colors cursor-pointer py-1"
              >
                Maybe later
              </button>
              <a
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank"
                rel="noreferrer"
                onClick={handleJoin}
                className="bg-[#25D366] hover:bg-[#1eb855] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <WhatsAppIcon size={15} />
                Join the community
                <ArrowUpRight size={14} />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
