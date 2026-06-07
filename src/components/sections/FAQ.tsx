'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Is ClassOrbit free to use?',
    a: "Yes — the Free plan gives you 25 prompts per month, 5 workspace folders with 25 saves each, up to 10 document uploads, 5 content types, and ZIP export. No credit card needed. Upgrade to Pro at ₹199/month for unlimited everything.",
  },
  {
    q: 'Do I need to know how to write AI prompts?',
    a: "Not at all — that's the whole point. The Guided Builder asks simple questions (grade, subject, topic, difficulty) and builds a fully optimized, platform-specific prompt for you. Even first-time AI users get professional-quality output immediately.",
  },
  {
    q: 'Which AI tools does ClassOrbit support?',
    a: "We support ChatGPT, Claude, Canva, Gamma, Google NotebookLM, Suno (AI music), ElevenLabs (AI voice), and Ideogram (AI images) — 8 platforms, each getting a uniquely tailored prompt. You can also add any custom AI tool to your launchpad with just a URL.",
  },
  {
    q: 'Can I attach my own documents — like a syllabus or textbook?',
    a: "Yes. Free plan users can upload up to 10 documents per month (PDF, Word .docx, or plain text). Pro users have unlimited uploads. ClassOrbit reads the file and uses it as reference material so every prompt is grounded in your exact curriculum.",
  },
  {
    q: 'Does my data sync across devices?',
    a: "Yes. Your workspace, saved prompts, and custom tools are stored in Cloudflare D1 and sync instantly across every device you sign in on. We use Google Sign-In — no separate password to manage.",
  },
  {
    q: "What's the difference between Free and Pro?",
    a: "Free: 25 prompts/month, 5 content types, 10 document uploads, 5 folders. Pro (₹199/mo): unlimited prompts, all available AI platforms, all 14 content types, unlimited uploads, unlimited workspace, custom AI tools, and public prompt sharing. Yearly plan is ₹179/mo.",
  },
  {
    q: 'How does School pricing work?',
    a: "School pricing is per-faculty with volume discounts for 10+ seats. You get everything in Pro for every teacher, plus a shared school workspace, admin dashboard, usage analytics, Google Workspace SSO, dedicated onboarding, and invoice/PO billing. Email hello@classorbit.co for a custom quote.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24 px-margin-mobile md:px-margin-page relative border-t border-white/5">
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="text-[14px] font-bold text-primary tracking-[0.2em] uppercase mb-4 block">FAQ</span>
          <h2 className="font-display text-[40px] md:text-[52px] text-white font-extrabold leading-[1.1] tracking-tight">
            Common questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`glass-card rounded-2xl overflow-hidden transition-all ${open === i ? 'border-primary/30' : ''}`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-6 text-left"
              >
                <span className="font-semibold text-[16px] text-white leading-snug">{faq.q}</span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 text-text-muted"
                >
                  <ChevronDown size={20} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="px-6 pb-6">
                      <div className="border-t border-white/5 pt-4">
                        <p className="text-[15px] text-text-muted leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
