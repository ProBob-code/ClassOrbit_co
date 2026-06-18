'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Rocket, PenTool, Zap } from 'lucide-react';
import Image from 'next/image';
import { useTools, type SystemTool } from '@/context/ToolsContext';

const STORAGE_KEY = 'classorbit_dismissed_new_tools';

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function dismiss(toolId: string) {
  const dismissed = getDismissed();
  if (!dismissed.includes(toolId)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed, toolId]));
  }
}

function buildSteps(tool: SystemTool) {
  if (tool.walkthrough_steps && tool.walkthrough_steps.length > 0) {
    return tool.walkthrough_steps;
  }
  return [
    {
      title: `🎉 New Tool: ${tool.tool_name}!`,
      body: tool.description || `${tool.tool_name} is now available on ClassOrbit. Try it on your next prompt!`,
    },
    {
      title: 'Use it in the Prompt Builder',
      body: `When building a prompt, find ${tool.tool_name} in the "Send to AI Platforms" section and select it. Your prompt will be automatically optimized for ${tool.tool_name}'s specific format.`,
    },
    {
      title: 'Launch from your Launchpad',
      body: `Go to the Launchpad page to open ${tool.tool_name} directly. Your Google session is synced - just click "Launch Integration" and you're in.`,
    },
    {
      title: `You're all set! 🚀`,
      body: `${tool.tool_name} is ready to use. Select it in the Builder, generate your prompt, and click "Open in ${tool.tool_name}" to launch with your prompt pre-loaded.`,
    },
  ];
}

const STEP_ICONS = [Zap, PenTool, Rocket, Zap];

export default function NewToolWalkthrough() {
  const { newTools } = useTools();
  const [activeTool, setActiveTool] = useState<SystemTool | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (newTools.length === 0) return;
    const dismissed = getDismissed();
    const undismissed = newTools.find(t => !dismissed.includes(t.id));
    if (undismissed) {
      // Small delay so the page settles before showing the walkthrough
      const t = setTimeout(() => setActiveTool(undismissed), 2000);
      return () => clearTimeout(t);
    }
  }, [newTools]);

  const handleDismiss = () => {
    if (activeTool) {
      dismiss(activeTool.id);
      setActiveTool(null);
      setStep(0);
    }
  };

  const handleNext = () => {
    if (!activeTool) return;
    const steps = buildSteps(activeTool);
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      handleDismiss();
    }
  };

  if (!activeTool) return null;
  const steps = buildSteps(activeTool);
  const current = steps[step];
  const Icon = STEP_ICONS[step % STEP_ICONS.length];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="bg-surface border border-border rounded-[24px] w-full max-w-[420px] p-7 shadow-2xl relative"
        >
          {/* Close */}
          <button onClick={handleDismiss} className="absolute top-5 right-5 text-text-subtle hover:text-text-main transition-colors">
            <X size={18} />
          </button>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'bg-primary w-8' : i < step ? 'bg-primary/40 w-4' : 'bg-white/10 w-4'}`}
              />
            ))}
          </div>

          {/* Tool badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center p-1.5 shrink-0">
              <Image
                src={activeTool.tool_logo || `https://www.google.com/s2/favicons?sz=64&domain=${new URL(activeTool.tool_url.startsWith('http') ? activeTool.tool_url : 'https://' + activeTool.tool_url).hostname}`}
                alt={activeTool.tool_name}
                width={40}
                height={40}
                unoptimized
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                New Tool
              </span>
              <p className="text-[13px] font-semibold text-text-main mt-0.5">{activeTool.tool_name}</p>
            </div>
          </div>

          {/* Step content */}
          <div className="mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Icon size={20} className="text-primary" />
            </div>
            <h3 className="font-display text-[20px] font-bold text-white mb-2 leading-snug">{current.title}</h3>
            <p className="text-[14px] text-text-muted leading-relaxed">{current.body}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button onClick={handleDismiss} className="text-[13px] text-text-subtle hover:text-text-muted font-medium transition-colors">
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-primary-hover transition-all shadow-sm"
            >
              {step < steps.length - 1 ? 'Next' : 'Got it!'}
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
