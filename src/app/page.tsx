'use client';

import Link from 'next/link';
import { useState } from 'react';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import Topbar from '@/components/layout/Topbar';

// Suggestion topics for interactive sandbox
const presets = [
  { topic: '🍎 Photosynthesis & Plant Cells', subject: 'Science', grade: 'Grade 5', type: 'quiz' },
  { topic: '📐 Pythagorean Theorem Calculations', subject: 'Math', grade: 'Grade 8', type: 'lesson_plan' },
  { topic: '📜 Catalysts of Industrial Revolution', subject: 'History', grade: 'Grade 10', type: 'ppt' }
];

export default function LandingPage() {
  const [sandboxTopic, setSandboxTopic] = useState('🍎 Photosynthesis & Plant Cells');
  const [sandboxSubject, setSandboxSubject] = useState('Science');
  const [sandboxGrade, setSandboxGrade] = useState('Grade 5');
  const [sandboxType, setSandboxType] = useState('quiz');

  return (
    <>
      <Topbar />
      <main className="pt-20 bg-mesh-gradient min-h-screen relative overflow-hidden font-body text-text-main">
        {/* Galaxy / Orbit Stars Background Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48Zz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIwLjUiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuOCIvPjxjaXJjbGUgY3g9IjI1MCIgY3k9IjE1MCIgcj0iMSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzUwIiBjeT0iMzAwIiByPSIwLjUiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuNiIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjM1MCIgcj0iMS41IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjMiLz48L2c+PC9zdmc+')] opacity-40 mix-blend-screen" />
          <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 blur-[150px] rounded-full mix-blend-screen animate-pulse-glow" />
          <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full mix-blend-screen animate-pulse" />
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-pink-500/10 blur-[120px] rounded-full mix-blend-screen animate-float" />
          
          {/* Orbital Rings Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] max-w-[1400px] aspect-square rounded-full border border-white/5 opacity-50 shadow-[0_0_100px_rgba(139,92,246,0.1)_inset] animate-spin-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] max-w-[1100px] aspect-square rounded-full border border-white/5 opacity-30 shadow-[0_0_80px_rgba(245,158,11,0.05)_inset] animate-spin-reverse-slow" />
        </div>

        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-page py-12 z-10">
          
          <AnimatedContainer className="max-w-[900px] relative z-10 space-y-6 flex flex-col items-center">
            {/* Glowing Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-border-glow mb-2 hover:border-primary/50 transition-colors cursor-default">
              <span className="text-[14px]">✨</span>
              <span className="text-label-sm font-bold text-white tracking-widest uppercase">
                Built for Educators, by Educators
              </span>
            </div>
            
            <h1 className="font-display text-[42px] sm:text-[56px] md:text-[72px] font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-2xl">
              Build Perfect Prompts. <br />
              <span className="text-gradient-gold italic font-serif leading-none pr-2">Launch to Any AI Platform.</span>
            </h1>
            
            <p className="text-[18px] md:text-[20px] text-text-muted max-w-2xl mx-auto leading-relaxed mt-4">
              ClassOrbit helps teachers craft optimized prompts effortlessly — then sends you straight to ChatGPT, Claude, Gamma, Canva, or any AI tool. <strong className="text-white font-medium">Zero prompt engineering required.</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 w-full sm:w-auto">
              <Link
                href="/login?next=/builder"
                className="w-full sm:w-auto relative inline-flex h-14 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-primary active:scale-95 transition-all shadow-glow hover:shadow-[0_0_60px_-10px_rgba(245,158,11,0.6)] group"
              >
                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F59E0B_0%,#F97316_50%,#F59E0B_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-surface px-8 py-1 text-[16px] font-bold text-white backdrop-blur-3xl group-hover:bg-surface/80 transition-colors gap-2">
                  Get Started Free
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto glass-card text-white px-8 py-4 rounded-full text-[16px] font-bold transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-white/10"
              >
                See How It Works
              </Link>
            </div>
          </AnimatedContainer>

          {/* Interactive Lined Notepad Sandbox Preview */}
          <AnimatedContainer delay={0.2} className="mt-16 w-full max-w-[900px] relative z-20">
            
            <div className="bg-[#FEFCF4] text-[#222] rounded-r-3xl rounded-l-md shadow-[20px_20px_60px_rgba(0,0,0,0.4)] relative text-left overflow-hidden border-2 border-[#e5e5e5] flex flex-col group transform rotate-[1deg] hover:rotate-0 transition-transform duration-500">
              {/* Notebook Title Bar / Header */}
              <div className="h-16 border-b-[3px] border-red-400/60 flex items-center px-8 gap-2 w-full bg-[#FEFCF4]">
                <div className="flex-1">
                  <span className="text-[16px] font-bold text-red-500/80 tracking-[0.2em] uppercase font-mono">My Lesson Plan</span>
                </div>
              </div>

              <div 
                className="p-8 sm:p-12 relative flex-1 min-h-[350px]"
                style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 46px, #93c5fd 47px, #93c5fd 48px)',
                  backgroundSize: '100% 48px',
                  backgroundPosition: '0 -2px'
                }}
              >
                {/* Vertical Margin Line */}
                <div className="absolute left-10 sm:left-14 top-0 bottom-0 w-[3px] bg-red-400/50 pointer-events-none" />

                <div className="pl-8 sm:pl-12 relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                    <div>
                      <h3 className="font-serif text-[32px] font-bold text-[#1a1a1a] flex items-center gap-3">
                        <span className="text-3xl filter drop-shadow-sm">📝</span>
                        Try It Out
                      </h3>
                    </div>
                    <div className="flex bg-[#f1f1f1] p-1.5 rounded-xl border border-[#ddd] shadow-inner">
                      {presets.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSandboxTopic(p.topic);
                            setSandboxSubject(p.subject);
                            setSandboxGrade(p.grade);
                            setSandboxType(p.type);
                          }}
                          className={`text-[14px] px-5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                            sandboxTopic === p.topic 
                              ? 'bg-white text-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-[#ccc]' 
                              : 'text-[#666] hover:text-[#1a1a1a] hover:bg-white/50'
                          }`}
                        >
                          Preset {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mad Libs Lined Paper Blank Card */}
                  <div className="text-[24px] text-[#333] font-serif mt-10 leading-[48px] max-w-3xl">
                    Please generate a{' '}
                    <span className="bg-[#FFF8E7] text-amber-700 font-bold px-3 py-1 rounded-md border-b-2 border-amber-500 mx-1 font-sans text-[20px] shadow-sm transform -rotate-1 inline-block">
                      {sandboxType.toUpperCase()}
                    </span>{' '}
                    for my{' '}
                    <span className="bg-emerald-50/80 text-emerald-700 font-bold px-3 py-1 rounded-md border-b-2 border-emerald-500 mx-1 font-sans text-[20px] shadow-sm transform rotate-1 inline-block">
                      {sandboxGrade}
                    </span>{' '}
                    <span className="bg-purple-50/80 text-purple-700 font-bold px-3 py-1 rounded-md border-b-2 border-purple-500 mx-1 font-sans text-[20px] shadow-sm inline-block">
                      {sandboxSubject}
                    </span>{' '}
                    class. The primary learning objective is:{' '}
                    <span className="border-b-2 border-dashed border-[#888] font-bold px-3 py-1 text-[#111] bg-white rounded-t-md ml-1 font-sans text-[20px] shadow-sm inline-block mt-2 sm:mt-0">
                      "{sandboxTopic.replace(/[🍎📐📜]/g, '').trim()}"
                    </span>.
                  </div>

                  <div className="mt-16 pt-6 flex justify-end">
                    <Link
                      href={`/login?next=${encodeURIComponent(`/builder?topic=${sandboxTopic}&subject=${sandboxSubject}&grade=${sandboxGrade}&type=${sandboxType}`)}`}
                      className="group relative inline-flex items-center justify-center gap-3 bg-[#111] text-white px-8 py-4 rounded-xl font-bold text-[16px] hover:bg-[#333] transition-all cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Build This Prompt
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContainer>
        </section>

        {/* ===== TOOL CLOUD SECTION ===== */}
        <section className="py-12 bg-white/[0.02] backdrop-blur-2xl border-y border-white/5">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-page text-center">
            <p className="text-[14px] text-text-muted font-bold uppercase tracking-[0.2em] mb-8">
              Build prompts optimized for your favorite platforms
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {['OpenAI ChatGPT', 'Anthropic Claude', 'Canva', 'Gamma Presentations', 'Google NotebookLM'].map((tool) => (
                <div key={tool} className="flex items-center gap-2 font-bold text-[20px] font-display text-white">
                  <div className="w-2 h-2 rounded-full bg-primary/80" />
                  {tool}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="how-it-works" className="py-24 px-margin-mobile md:px-margin-page relative">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 blur-[200px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedContainer className="text-center mb-16">
              <span className="text-[14px] font-bold text-primary tracking-[0.2em] uppercase mb-4 block">
                How It Works
              </span>
              <h2 className="font-display text-[40px] md:text-[56px] text-white font-extrabold leading-[1.1] tracking-tight">
                Three Steps to <br className="hidden md:block" /> Better Teaching
              </h2>
              <p className="text-[18px] text-text-muted max-w-2xl mx-auto mt-4 leading-relaxed">
                Your teaching ideas orbit seamlessly between AI platforms — we handle the prompt engineering so you don't have to.
              </p>
            </AnimatedContainer>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
              {/* Card 1 — Tell Us What You Need */}
              <AnimatedContainer delay={0.1}>
                <div className="glass-card p-10 rounded-[32px] h-full flex flex-col items-start relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-colors" />
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-8 shadow-inner relative z-10 text-primary">
                    ✍️
                  </div>
                  <h3 className="font-display text-[24px] font-bold mb-3 text-white relative z-10">Tell Us What You Need</h3>
                  <p className="text-[16px] text-text-muted leading-relaxed relative z-10">
                    Type freely or use our guided builder — describe your lesson plan, quiz, worksheet, or any teaching resource. No prompt skills needed.
                  </p>
                </div>
              </AnimatedContainer>

              {/* Card 2 — We Build Your Prompt (spans 2 cols) */}
              <AnimatedContainer delay={0.2} className="md:col-span-2">
                <div className="glass-card p-10 rounded-[32px] h-full flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -mr-20 -mb-20 group-hover:bg-secondary/20 transition-colors" />
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                    <div className="flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-8 shadow-inner text-secondary-hover">
                        ⚡
                      </div>
                      <h3 className="font-display text-[28px] font-bold mb-3 text-white">We Build Your Prompt</h3>
                      <p className="text-[16px] text-text-muted leading-relaxed max-w-md">
                        Our engine transforms your input into platform-optimized prompts — structured, formatted, and ready for each AI tool. No guesswork required.
                      </p>
                    </div>
                    {/* Abstract illustration block */}
                    <div className="w-full md:w-[280px] h-[180px] rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-center p-6 gap-3 shadow-inner overflow-hidden relative">
                       <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                       <div className="w-3/4 h-3 rounded-full bg-white/10 animate-pulse" />
                       <div className="w-full h-3 rounded-full bg-white/5" />
                       <div className="w-5/6 h-3 rounded-full bg-white/5" />
                       <div className="w-1/2 h-3 rounded-full bg-primary/20 mt-4" />
                    </div>
                  </div>
                </div>
              </AnimatedContainer>

              {/* Card 3 — Launch to Your AI Tool (spans 2 cols) */}
              <AnimatedContainer delay={0.3} className="md:col-span-2">
                <div className="glass-card p-10 rounded-[32px] h-full flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -ml-20 -mt-20 group-hover:bg-pink-500/20 transition-colors" />
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                    <div className="w-full md:w-[280px] h-[180px] rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center shadow-inner overflow-hidden relative">
                       <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 to-transparent" />
                       {/* Platform icons representation */}
                       <div className="flex gap-3">
                         {['ChatGPT', 'Claude', 'Canva'].map((name, i) => (
                           <div key={name} className={`w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center text-[11px] font-bold text-white/60 transform ${i === 1 ? '-rotate-3 -translate-y-2' : i === 2 ? 'rotate-6 translate-y-1' : 'rotate-2'} shadow-lg border border-white/5`}>
                             {name}
                           </div>
                         ))}
                       </div>
                    </div>
                    <div className="flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-8 shadow-inner text-pink-400">
                        🚀
                      </div>
                      <h3 className="font-display text-[28px] font-bold mb-3 text-white">Launch to Your AI Tool</h3>
                      <p className="text-[16px] text-text-muted leading-relaxed">
                        One click copies your prompt and opens ChatGPT, Claude, Gamma, Canva, or any supported platform. Start generating immediately — no more copy-pasting or formatting.
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedContainer>

              {/* Card 4 — Save & Reuse */}
              <AnimatedContainer delay={0.4}>
                <div className="glass-card p-10 rounded-[32px] h-full flex flex-col items-start relative overflow-hidden group">
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mb-10 group-hover:bg-emerald-500/20 transition-colors" />
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-8 shadow-inner text-emerald-400">
                    📚
                  </div>
                  <h3 className="font-display text-[24px] font-bold mb-3 text-white relative z-10">Save & Reuse</h3>
                  <p className="text-[16px] text-text-muted leading-relaxed relative z-10">
                    Keep your best prompts in your library. Organize in folders, export as a package, and reuse anytime across different classes and terms.
                  </p>
                </div>
              </AnimatedContainer>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA SECTION ===== */}
        <section className="py-24 px-margin-mobile md:px-margin-page relative overflow-hidden border-t border-white/5">
          <AnimatedContainer className="relative z-10 max-w-5xl mx-auto text-center py-16 glass-panel rounded-[40px] p-8 md:p-16 border-t border-white/10 shadow-2xl">
            {/* Glowing Orb Behind CTA */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
            
            <span className="text-[56px] mb-6 block select-none filter drop-shadow relative z-10">🚀</span>
            <h2 className="font-display text-[40px] md:text-[56px] font-extrabold text-white mb-6 tracking-tight relative z-10">
              Ready to simplify your AI workflow?
            </h2>
            <p className="text-body-md text-text-muted mb-6 max-w-xl mx-auto">
              Join thousands of educators building smarter prompts and launching to their favorite AI platforms in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login?next=/builder"
                className="bg-primary text-white px-8 py-4 rounded-full text-body-md font-bold shadow-md hover:scale-[1.03] transition-all active:scale-98 shadow-glow"
              >
                Get Started Free
              </Link>
            </div>
            <p className="text-[12px] text-text-muted font-bold mt-3">Free to use • Set up in under a minute</p>
          </AnimatedContainer>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="w-full py-12 px-margin-mobile md:px-margin-page bg-surface border-t border-border text-left">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo_transparent.png" alt="ClassOrbit Logo" className="w-8 h-8 object-contain" />
            <span className="text-2xl font-extrabold tracking-tight text-text-main">
              Class<span className="text-primary">Orbit</span>
            </span>
          </div>
          <p className="text-label-sm text-text-muted font-bold">
            © 2026 ClassOrbit.co. The AI Prompt Studio for Educators.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-text-muted hover:text-text-main font-label-sm font-bold transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-text-muted hover:text-text-main font-label-sm font-bold transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
