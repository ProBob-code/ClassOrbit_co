'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Copy, ExternalLink, FolderOpen, FileText, Rocket, BookOpen, PenTool, Presentation } from 'lucide-react';

const tabs = [
  { id: 'builder', label: 'Build Your Prompt', icon: PenTool },
  { id: 'ready', label: 'Prompt Ready', icon: CheckCircle2 },
  { id: 'workspace', label: 'Workspace', icon: FolderOpen },
];

function BuilderPreview() {
  return (
    <div className="p-5 sm:p-7 space-y-5 text-left">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1 w-fit">
        <div className="px-4 py-1.5 rounded-lg bg-primary text-white text-[12px] font-bold">Guided Builder</div>
        <div className="px-4 py-1.5 rounded-lg text-text-muted text-[12px] font-semibold">Free Type</div>
      </div>
      {/* Step 1 */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest">1 — What are we making?</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '📋', label: 'Lesson Plan', sel: true },
            { icon: '✏️', label: 'Quiz', sel: false },
            { icon: '📊', label: 'PPT Slides', sel: false },
          ].map(item => (
            <div key={item.label} className={`rounded-xl p-3 flex flex-col items-center gap-1.5 border text-center ${item.sel ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border bg-surface'}`}>
              <span className="text-[18px]">{item.icon}</span>
              <span className={`text-[11px] font-semibold ${item.sel ? 'text-primary' : 'text-text-muted'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Step 2 */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest">2 — Who is it for?</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface border border-border rounded-xl px-3 py-2 flex items-center gap-2">
            <BookOpen size={14} className="text-text-subtle" />
            <span className="text-[12px] text-text-main font-medium">Science</span>
          </div>
          <div className="bg-surface border border-border rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-[12px] text-text-main font-medium">Grade 8</span>
          </div>
        </div>
      </div>
      {/* Step 3 */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest">3 — What's the topic?</p>
        <div className="bg-surface border border-primary/40 rounded-xl px-3 py-2.5 text-[12px] text-text-main font-medium ring-2 ring-primary/10">
          Photosynthesis & the role of chlorophyll in energy conversion
        </div>
      </div>
      {/* Tools */}
      <div className="flex flex-wrap gap-2">
        {['ChatGPT', 'Claude', 'Gamma'].map((t, i) => (
          <div key={t} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 ${i < 2 ? 'border-primary text-primary bg-primary/5 ring-1 ring-primary' : 'border-border text-text-muted bg-surface'}`}>
            <img src={`https://www.google.com/s2/favicons?sz=32&domain=${t === 'ChatGPT' ? 'chat.openai.com' : t === 'Claude' ? 'claude.ai' : 'gamma.app'}`} className="w-3.5 h-3.5 rounded-sm" alt={t} />
            {t}
          </div>
        ))}
      </div>
      {/* CTA */}
      <div className="w-full bg-gradient-to-r from-primary to-orange-500 text-white py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2">
        <Sparkles size={14} /> Build My Prompt
      </div>
    </div>
  );
}

function ReadyPreview() {
  return (
    <div className="p-5 sm:p-7 space-y-5 text-left">
      {/* Header */}
      <div className="text-center space-y-2 pb-2">
        <div className="w-12 h-12 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
          <CheckCircle2 size={22} className="text-emerald-400" />
        </div>
        <h3 className="font-display font-extrabold text-[18px] text-text-main">Your Prompt is <span className="text-primary">Ready!</span></h3>
      </div>
      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {['ChatGPT', 'Claude'].map((t, i) => (
          <div key={t} className={`px-4 py-2 text-[12px] font-semibold border-b-2 flex items-center gap-1.5 ${i === 0 ? 'border-primary text-primary' : 'border-transparent text-text-muted'}`}>
            <img src={`https://www.google.com/s2/favicons?sz=32&domain=${i === 0 ? 'chat.openai.com' : 'claude.ai'}`} className="w-3.5 h-3.5 rounded-sm" alt={t} />
            {t}
          </div>
        ))}
      </div>
      {/* Prompt box */}
      <div className="bg-surface border border-border rounded-xl p-3.5 max-h-[120px] overflow-hidden relative">
        <p className="text-[11px] font-mono text-text-muted leading-relaxed line-clamp-5">
          Act as an expert Grade 8 Science teacher. Create a comprehensive lesson plan on <strong className="text-text-main">Photosynthesis</strong> covering chlorophyll's role in light energy conversion. Include a 5-minute hook activity, direct instruction with diagrams, guided practice with a concept map, and an exit ticket assessment...
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface to-transparent" />
      </div>
      {/* Launch buttons */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { name: 'ChatGPT', domain: 'chat.openai.com' },
          { name: 'Claude', domain: 'claude.ai' },
        ].map(tool => (
          <div key={tool.name} className="glass-card rounded-xl p-3 flex items-center gap-2.5 cursor-pointer hover:border-primary/50 transition-all">
            <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center p-1.5 shrink-0">
              <img src={`https://www.google.com/s2/favicons?sz=64&domain=${tool.domain}`} className="w-full h-full object-contain" alt={tool.name} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-text-main">Open in {tool.name}</p>
              <p className="text-[10px] text-text-muted">Copies & opens</p>
            </div>
            <ExternalLink size={12} className="text-text-muted shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkspacePreview() {
  const folders = [
    { name: 'My Lessons', sticker: '📚', color: 'bg-primary', count: 7 },
    { name: 'Science Lab', sticker: '🔬', color: 'bg-emerald-500', count: 4 },
    { name: 'English Lit', sticker: '📝', color: 'bg-blue-500', count: 3 },
  ];
  const files = [
    { name: 'Photosynthesis Lesson Plan.prompt', type: 'prompt', date: 'Jun 05' },
    { name: 'Cell Division Quiz.prompt', type: 'prompt', date: 'Jun 04' },
    { name: 'Industrial Revolution PPT.pptx', type: 'pptx', date: 'Jun 03' },
    { name: 'Shakespeare Sonnets Notes.pdf', type: 'pdf', date: 'Jun 02' },
  ];
  return (
    <div className="p-5 sm:p-7 space-y-4 text-left">
      <div>
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3">Directories</p>
        <div className="flex gap-2 flex-wrap">
          {folders.map(f => (
            <div key={f.name} className="glass-card rounded-xl p-3 flex items-center gap-2.5 w-[calc(33%-4px)]">
              <div className={`w-8 h-8 rounded-lg ${f.color} flex items-center justify-center text-[16px]`}>{f.sticker}</div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-text-main truncate">{f.name}</p>
                <p className="text-[10px] text-text-muted">{f.count} files</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2 border-t border-border pt-3">
          <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Documents</p>
          <span className="text-[10px] text-text-muted">{files.length} items</span>
        </div>
        <div className="space-y-1.5">
          {files.map(f => (
            <div key={f.name} className="glass-card rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <FileText size={14} className={f.type === 'prompt' ? 'text-primary' : f.type === 'pdf' ? 'text-red-400' : 'text-orange-400'} />
              <span className="flex-1 text-[11px] text-text-main font-medium truncate">{f.name}</span>
              <span className="text-[10px] text-text-subtle shrink-0">{f.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppPreview() {
  const [active, setActive] = useState('builder');

  const previews: Record<string, React.ReactNode> = {
    builder: <BuilderPreview />,
    ready: <ReadyPreview />,
    workspace: <WorkspacePreview />,
  };

  return (
    <section className="py-24 px-margin-mobile md:px-margin-page relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="text-[14px] font-bold text-primary tracking-[0.2em] uppercase mb-4 block">See It in Action</span>
          <h2 className="font-display text-[40px] md:text-[52px] text-white font-extrabold leading-[1.1] tracking-tight">
            Built for how teachers <br className="hidden md:block" /> actually work
          </h2>
          <p className="text-[18px] text-text-muted max-w-2xl mx-auto mt-4 leading-relaxed">
            Every screen is designed to save time, not create more work.
          </p>
        </div>

        {/* Browser frame */}
        <div className="max-w-[860px] mx-auto">
          {/* Browser chrome */}
          <div className="bg-surface border border-border rounded-t-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 bg-background border border-border rounded-lg px-3 py-1 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500/60 shrink-0" />
              <span className="text-[12px] text-text-subtle font-mono truncate">classorbit.co/{active === 'workspace' ? 'workspace' : 'builder'}</span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="bg-surface/70 border-x border-border flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                    active === tab.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-text-muted hover:text-text-main hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Preview content */}
          <div className="bg-surface/40 border border-border border-t-0 rounded-b-2xl overflow-hidden min-h-[480px] backdrop-blur-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {previews[active]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
