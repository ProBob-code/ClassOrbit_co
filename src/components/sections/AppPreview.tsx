'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Sparkles, CheckCircle2, ExternalLink, FolderOpen, FileText, BookOpen, PenTool } from 'lucide-react';

const tabs = [
  {
    id: 'builder',
    label: 'Build Your Prompt',
    icon: PenTool,
    blurb: 'Answer a few guided questions — grade, subject, topic — and watch the prompt assemble itself.',
  },
  {
    id: 'ready',
    label: 'Prompt Ready',
    icon: CheckCircle2,
    blurb: 'Get a platform-tuned prompt for each AI tool, ready to launch with a single click.',
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: FolderOpen,
    blurb: 'Every prompt, file, and folder saved and synced — organized like a teacher actually works.',
  },
];

function BuilderPreview() {
  return (
    <div className="p-5 sm:p-7 space-y-5 text-left">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 w-fit">
        <div className="px-4 py-1.5 rounded-lg bg-primary text-white text-[12px] font-bold">Guided Builder</div>
        <div className="px-4 py-1.5 rounded-lg text-slate-500 text-[12px] font-semibold">Free Type</div>
      </div>
      {/* Step 1 */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest">1: What are we making?</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '📋', label: 'Lesson Plan', sel: true },
            { icon: '✏️', label: 'Quiz', sel: false },
            { icon: '📊', label: 'PPT Slides', sel: false },
          ].map(item => (
            <div key={item.label} className={`rounded-xl p-3 flex flex-col items-center gap-1.5 border text-center ${item.sel ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-slate-200 bg-white'}`}>
              <span className="text-[18px]">{item.icon}</span>
              <span className={`text-[11px] font-semibold ${item.sel ? 'text-primary' : 'text-slate-500'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Step 2 */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest">2: Who is it for?</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <BookOpen size={14} className="text-slate-400" />
            <span className="text-[12px] text-slate-900 font-medium">Science</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-[12px] text-slate-900 font-medium">Grade 8</span>
          </div>
        </div>
      </div>
      {/* Step 3 */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest">3 - What&apos;s the topic?</p>
        <div className="bg-white border border-primary/40 rounded-xl px-3 py-2.5 text-[12px] text-slate-900 font-medium ring-2 ring-primary/10">
          Photosynthesis & the role of chlorophyll in energy conversion
        </div>
      </div>
      {/* Tools */}
      <div className="flex flex-wrap gap-2">
        {['ChatGPT', 'Claude', 'Gamma'].map((t, i) => (
          <div key={t} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 ${i < 2 ? 'border-primary text-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 text-slate-500 bg-white'}`}>
            <Image src={`https://www.google.com/s2/favicons?sz=32&domain=${t === 'ChatGPT' ? 'chat.openai.com' : t === 'Claude' ? 'claude.ai' : 'gamma.app'}`} width={14} height={14} unoptimized className="w-3.5 h-3.5 rounded-sm" alt={t} />
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
          <CheckCircle2 size={22} className="text-emerald-500" />
        </div>
        <h3 className="font-display font-extrabold text-[18px] text-slate-900">Your Prompt is <span className="text-primary">Ready!</span></h3>
      </div>
      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        {['ChatGPT', 'Claude'].map((t, i) => (
          <div key={t} className={`px-4 py-2 text-[12px] font-semibold border-b-2 flex items-center gap-1.5 ${i === 0 ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}>
            <Image src={`https://www.google.com/s2/favicons?sz=32&domain=${i === 0 ? 'chat.openai.com' : 'claude.ai'}`} width={14} height={14} unoptimized className="w-3.5 h-3.5 rounded-sm" alt={t} />
            {t}
          </div>
        ))}
      </div>
      {/* Prompt box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 max-h-[120px] overflow-hidden relative">
        <p className="text-[11px] font-mono text-slate-500 leading-relaxed line-clamp-5">
          Act as an expert Grade 8 Science teacher. Create a comprehensive lesson plan on <strong className="text-slate-900">Photosynthesis</strong> covering chlorophyll&apos;s role in light energy conversion. Include a 5-minute hook activity, direct instruction with diagrams, guided practice with a concept map, and an exit ticket assessment...
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent" />
      </div>
      {/* Launch buttons */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { name: 'ChatGPT', domain: 'chat.openai.com' },
          { name: 'Claude', domain: 'claude.ai' },
        ].map(tool => (
          <div key={tool.name} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2.5 cursor-pointer hover:border-primary/50 transition-all">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
              <Image src={`https://www.google.com/s2/favicons?sz=64&domain=${tool.domain}`} width={32} height={32} unoptimized className="w-full h-full object-contain" alt={tool.name} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-900">Open in {tool.name}</p>
              <p className="text-[10px] text-slate-500">Copies & opens</p>
            </div>
            <ExternalLink size={12} className="text-slate-400 shrink-0" />
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
            <div key={f.name} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2.5 w-[calc(33%-4px)]">
              <div className={`w-8 h-8 rounded-lg ${f.color} flex items-center justify-center text-[16px]`}>{f.sticker}</div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-900 truncate">{f.name}</p>
                <p className="text-[10px] text-slate-500">{f.count} files</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2 border-t border-slate-200 pt-3">
          <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Documents</p>
          <span className="text-[10px] text-slate-500">{files.length} items</span>
        </div>
        <div className="space-y-1.5">
          {files.map(f => (
            <div key={f.name} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <FileText size={14} className={f.type === 'prompt' ? 'text-primary' : f.type === 'pdf' ? 'text-red-400' : 'text-orange-400'} />
              <span className="flex-1 text-[11px] text-slate-900 font-medium truncate">{f.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">{f.date}</span>
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
    <section className="py-24 px-margin-mobile md:px-margin-page relative overflow-hidden z-10">
      <div className="absolute bottom-0 right-[10%] w-[500px] h-[500px] bg-secondary/8 blur-[160px] rounded-full pointer-events-none" />
      <div className="max-w-[1500px] mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="text-[13px] font-bold text-primary tracking-[0.2em] uppercase mb-3 block">See it in action</span>
          <h2 className="font-display text-[34px] md:text-[46px] text-white font-extrabold leading-tight tracking-tight">
            Built for how teachers <br className="hidden md:block" /> actually work
          </h2>
          <p className="text-[17px] text-text-muted max-w-2xl mx-auto mt-3 leading-relaxed">
            Every screen is designed to save time, not create more work.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-center">
        {/* Browser frame */}
        <div className="w-full max-w-[960px] mx-auto lg:mx-0 lg:ml-auto rounded-2xl shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
          {/* Browser chrome */}
          <div className="bg-[#160D33] border border-white/10 rounded-t-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500/70 shrink-0" />
              <span className="text-[12px] text-text-muted font-mono truncate">classorbit.co/{active === 'workspace' ? 'workspace' : 'builder'}</span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="bg-[#10082A] border-x border-white/10 flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                    active === tab.id
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-transparent text-text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Preview content */}
          <div className="bg-white border border-white/10 border-t-0 rounded-b-2xl overflow-hidden min-h-[480px]">
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

        {/* Feature rail — drives the preview, fills the right column */}
        <div className="flex flex-col gap-4">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`text-left rounded-[24px] p-6 border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 border-primary/50 shadow-[0_10px_40px_-12px_rgba(245,158,11,0.35)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-white' : 'bg-white/5 text-text-muted'}`}>
                    <Icon size={18} />
                  </div>
                  <p className={`font-display text-[16px] font-bold ${isActive ? 'text-white' : 'text-white/80'}`}>{tab.label}</p>
                </div>
                <p className="text-[13px] text-text-muted leading-relaxed">{tab.blurb}</p>
              </motion.button>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}
