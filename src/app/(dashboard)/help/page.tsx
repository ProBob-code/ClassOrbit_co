'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  LifeBuoy, Sparkles, BookOpen, Rocket, MessageSquare,
  ChevronRight, Mail, HelpCircle
} from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is ClassOrbit?',
    answer: 'ClassOrbit is a prompt-building and platform-navigation system for teachers. We help you craft optimized AI prompts effortlessly and launch them directly into tools like ChatGPT, Claude, Gamma, Canva, and more. We don\'t compete with AI platforms - we make them easier to use.',
  },
  {
    question: 'How does the Prompt Builder work?',
    answer: 'You have two options: use the Guided Builder (step-by-step form where you select content type, grade, subject, and topic) or Free Type (write your own description). Either way, ClassOrbit transforms your input into an optimized, platform-ready prompt that you can copy or launch directly into your preferred AI tool.',
  },
  {
    question: 'Which AI platforms does ClassOrbit support?',
    answer: 'Currently we support ChatGPT (OpenAI), Claude (Anthropic), Canva, Gamma (presentations), Google NotebookLM, Suno (audio), ElevenLabs (voice), and Ideogram (images). We\'re constantly adding more platforms based on educator feedback.',
  },
  {
    question: 'Is ClassOrbit free to use?',
    answer: 'Yes! ClassOrbit itself is free to use. You sign in with your Google account and can start building prompts immediately. The AI tools you launch into (like ChatGPT or Claude) may have their own pricing - ClassOrbit simply helps you get the most out of them.',
  },
  {
    question: 'Do I need to know prompt engineering?',
    answer: 'Absolutely not. That\'s the whole point of ClassOrbit! Our Guided Builder walks you through what you need step-by-step, and our prompt engine handles all the optimization. You just describe what you want to teach, and we handle the rest.',
  },
  {
    question: 'Can I save and reuse my prompts?',
    answer: 'Yes! All your generated prompts are saved in the Saved Prompts section. You can favorite them, search through your history, copy them again, and even organize your materials in the Workspace.',
  },
  {
    question: 'How is my data handled?',
    answer: 'Your prompts and workspace files are stored locally in your browser. We use Google OAuth for secure authentication via Supabase. We don\'t sell or share your data with third parties.',
  },
];

const guides = [
  {
    icon: Sparkles,
    title: 'Building Your First Prompt',
    description: 'Learn how to use both Free Type and Guided Builder modes to create the perfect teaching prompt.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Rocket,
    title: 'Launching to AI Platforms',
    description: 'Understand how ClassOrbit copies your prompt and opens it in ChatGPT, Claude, and other tools.',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    icon: BookOpen,
    title: 'Organizing Your Workspace',
    description: 'Manage folders, files, and exported packages to keep your teaching materials organized.',
    color: 'bg-emerald-500/10 text-emerald-500',
  },
];

export default function HelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  return (
    <div className="w-full max-w-[900px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0 relative min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center gap-1.5">
          <LifeBuoy size={16} /> Support
        </span>
        <h1 className="font-display text-display-lg-mobile md:text-[40px] text-text-main font-bold tracking-tight">
          Help Center
        </h1>
        <p className="text-body-md text-text-muted max-w-xl mt-2">
          Everything you need to know about using ClassOrbit to build better prompts.
        </p>
      </motion.div>

      {/* Quick Start Guides */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="font-display text-headline-md font-bold text-text-main mb-6 flex items-center gap-2">
          <BookOpen size={22} className="text-primary" />
          Quick Start Guides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guides.map((guide, i) => {
            const Icon = guide.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="glass-card rounded-2xl p-6 flex flex-col gap-4 group"
              >
                <div className={`w-12 h-12 rounded-xl ${guide.color} flex items-center justify-center`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-display font-bold text-text-main text-[16px]">{guide.title}</h3>
                <p className="text-label-sm text-text-muted leading-relaxed flex-1">{guide.description}</p>
                <Link 
                  href="/builder" 
                  className="text-label-sm text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Try it now <ChevronRight size={16} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="font-display text-headline-md font-bold text-text-main mb-6 flex items-center gap-2">
          <HelpCircle size={22} className="text-primary" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.03 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer group"
              >
                <span className="font-display font-bold text-text-main text-[16px] pr-4 group-hover:text-primary transition-colors">
                  {faq.question}
                </span>
                <ChevronRight 
                  size={20} 
                  className={`text-text-muted shrink-0 transition-transform duration-200 ${
                    openFAQ === i ? 'rotate-90' : ''
                  }`} 
                />
              </button>
              {openFAQ === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="px-5 pb-5"
                >
                  <p className="text-body-md text-text-muted leading-relaxed border-t border-border pt-4">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-[24px] p-8 text-center mb-8"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
          <MessageSquare size={32} />
        </div>
        <h3 className="font-display text-headline-md font-bold text-text-main mb-3">
          Still have questions?
        </h3>
        <p className="text-body-md text-text-muted mb-6 max-w-md mx-auto">
          We&apos;d love to hear from you. Reach out and we&apos;ll help you get the most out of ClassOrbit.
        </p>
        <a
          href="mailto:support@classorbit.co"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-md active:scale-95"
        >
          <Mail size={18} />
          Contact Support
        </a>
      </motion.div>
    </div>
  );
}
