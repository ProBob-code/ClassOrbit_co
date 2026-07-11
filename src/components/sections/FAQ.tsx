'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Is ClassOrbit free to use?',
    a: "Yes. The Free plan gives you 25 prompts per month, 5 workspace folders with 25 saves each, up to 10 document uploads, 5 content types, and ZIP export. No credit card needed. Upgrade to Pro at ₹199/month for unlimited everything.",
  },
  {
    q: 'Do I need to know how to write AI prompts?',
    a: "Not at all, that's the whole point. The Guided Builder asks simple questions (grade, subject, topic, difficulty) and builds a fully optimized, platform-specific prompt for you. Even first-time AI users get professional-quality output immediately.",
  },
  {
    q: 'Which AI tools does ClassOrbit support?',
    a: "We support ChatGPT, Claude, Canva, Gamma, Google NotebookLM, Suno (AI music), ElevenLabs (AI voice), and Ideogram (AI images): 8 platforms, each getting a uniquely tailored prompt. You can also add any custom AI tool to your launchpad with just a URL.",
  },
  {
    q: 'Can I attach my own documents, like a syllabus or textbook?',
    a: "Yes. Free plan users can upload up to 10 documents per month (PDF, Word .docx, or plain text). Pro users have unlimited uploads. ClassOrbit reads the file and uses it as reference material so every prompt is grounded in your exact curriculum.",
  },
  {
    q: 'Does my data sync across devices?',
    a: "Yes. Your workspace, saved prompts, and custom tools are stored in Cloudflare D1 and sync instantly across every device you sign in on. We use Google Sign-In, no separate password to manage.",
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
    <section className="py-24 px-margin-mobile md:px-margin-page relative z-10">
      <div className="max-w-[1500px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16 items-start">
        {/* Left rail — sticky intro + contact card */}
        <div className="lg:sticky lg:top-28 text-center lg:text-left">
          <span className="text-[13px] font-bold text-primary tracking-[0.2em] uppercase mb-3 block">FAQ</span>
          <h2 className="font-display text-[34px] md:text-[46px] text-white font-extrabold leading-tight tracking-tight">
            Common questions
          </h2>
          <p className="text-[16px] text-text-muted mt-4 leading-relaxed max-w-md mx-auto lg:mx-0">
            Everything you need to know about ClassOrbit, plans, and how it fits into your classroom.
          </p>
          <div className="glass-card rounded-[24px] p-6 mt-8 text-left hidden lg:block">
            <p className="text-[15px] font-bold text-white mb-1.5">Still have a question?</p>
            <p className="text-[13px] text-text-muted leading-relaxed mb-4">
              We answer every email from educators, usually within a day.
            </p>
            <a
              href="mailto:hello@classorbit.co"
              className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:text-primary-hover transition-colors"
            >
              hello@classorbit.co →
            </a>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`bg-white/[0.03] backdrop-blur-xl border rounded-2xl overflow-hidden transition-all ${open === i ? 'border-primary/40 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]' : 'border-white/10'}`}
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
                      <div className="border-t border-white/10 pt-4">
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
