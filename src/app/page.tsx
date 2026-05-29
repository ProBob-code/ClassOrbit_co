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

export default function CozyLandingPage() {
  const [sandboxTopic, setSandboxTopic] = useState('🍎 Photosynthesis & Plant Cells');
  const [sandboxSubject, setSandboxSubject] = useState('Science');
  const [sandboxGrade, setSandboxGrade] = useState('Grade 5');
  const [sandboxType, setSandboxType] = useState('quiz');

  return (
    <>
      <Topbar />
      <main className="pt-16 bg-[#faf7f0] min-h-screen relative overflow-hidden font-body text-on-surface">
        {/* Cozy light background embellishments */}
        <div className="absolute top-[10%] left-[-10%] w-[380px] h-[380px] bg-primary-fixed glowing-orb -z-10" />
        <div className="absolute bottom-[10%] right-[-10%] w-[380px] h-[380px] bg-secondary-fixed glowing-orb -z-10" />

        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-page py-12">
          
          <AnimatedContainer className="max-w-[850px] relative z-10 space-y-4">
            <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-1 block handwritten text-[20px]">
              🏫 Built for Educators, by Educators
            </span>
            <h1 className="font-display text-[34px] sm:text-[48px] md:text-[56px] text-on-background font-bold leading-tight tracking-tight">
              The Cozy AI Planning Desk <br />
              <span className="text-primary italic font-serif leading-none pr-1">designed for real teachers.</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed pt-2">
              Reclaim 10+ hours a week. Draft lesson worksheets, quizzes, and slide outlines on a warm notebook page. Zero prompt engineering required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/builder"
                className="bg-primary text-white px-8 py-4.5 rounded-full text-body-md font-bold shadow-lg hover:scale-[1.03] transition-all active:scale-98 cursor-pointer"
              >
                Open My Planning Notepad
              </Link>
              <Link
                href="#how-it-works"
                className="border-2 border-[#e3dec3] bg-white hover:bg-tertiary-fixed text-on-surface-variant px-8 py-4 rounded-full text-body-md font-bold transition-all active:scale-98 cursor-pointer"
              >
                Tour the Desk Cabinet
              </Link>
            </div>
          </AnimatedContainer>

          {/* Interactive Lined Notepad Sandbox Preview */}
          <AnimatedContainer delay={0.2} className="mt-12 w-full max-w-[900px] relative z-20">
            {/* Lined notebook spiral ring decorations */}
            <div className="absolute left-[-20px] top-6 bottom-6 w-4 z-20 flex flex-col justify-between opacity-80 pointer-events-none hidden sm:flex">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-8 h-2.5 rounded-full bg-slate-300 border border-slate-400/80 shadow-sm" />
              ))}
            </div>

            <div className="notebook-paper rounded-2xl p-6 pl-12 sm:pl-16 shadow-xl border border-[#e3dec3] relative text-left">
              {/* Lined paper margins indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-amber-500/25 ml-12 sm:ml-16 pointer-events-none" />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#e3dec3]/80 pb-4 mb-4">
                <div>
                  <span className="text-label-sm text-primary font-bold uppercase tracking-wider handwritten text-[18px]">
                    📝 Try the Notepad Sandbox
                  </span>
                  <h3 className="font-display text-headline-md font-bold text-on-surface">
                    Natural Classroom Formulator
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSandboxTopic(p.topic);
                        setSandboxSubject(p.subject);
                        setSandboxGrade(p.grade);
                        setSandboxType(p.type);
                      }}
                      className={`text-label-sm px-3 py-1.5 rounded-lg border font-bold transition-all active:scale-95 cursor-pointer ${
                        sandboxTopic === p.topic ? 'bg-primary-fixed border-primary text-primary' : 'bg-white border-outline-variant hover:bg-surface-container'
                      }`}
                    >
                      Preset {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mad Libs Lined Paper Blank Card */}
              <div className="text-body-lg text-on-surface leading-loose font-body">
                Today, I want to create an{' '}
                <span className="bg-primary-fixed text-primary font-bold px-3 py-1 rounded-lg border border-primary/20">
                  {sandboxType.toUpperCase()}
                </span>{' '}
                for my{' '}
                <span className="bg-secondary-fixed text-on-secondary-fixed-variant font-bold px-3 py-1 rounded-lg border border-secondary/20">
                  {sandboxSubject}
                </span>{' '}
                class, tailored for{' '}
                <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold px-3 py-1 rounded-lg border border-tertiary/20">
                  {sandboxGrade}
                </span>{' '}
                students, specifically on the objective:{' '}
                <span className="border-b-2 border-dashed border-amber-500 font-bold px-2 py-0.5 text-primary">
                  "{sandboxTopic.replace(/[🍎📐📜]/g, '').trim()}"
                </span>.
              </div>

              <div className="mt-8 pt-4 border-t border-[#e3dec3]/60 flex justify-end">
                <Link
                  href="/builder"
                  className="bg-primary text-white px-6 py-3 rounded-full font-bold text-label-sm flex items-center gap-1.5 hover:shadow-lg transition-all"
                >
                  Configure My Real Lesson
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </AnimatedContainer>
        </section>

        {/* ===== TOOL CLOUD SECTION ===== */}
        <section className="py-10 bg-white border-y border-[#e3dec3]/60">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-page text-center">
            <p className="font-label-md text-on-surface-variant font-bold uppercase tracking-wider mb-6 handwritten text-[17px]">
              📎 Pre-formats Prompts for Your Daily Tools
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 opacity-75">
              {['OpenAI ChatGPT', 'Anthropic Claude', 'Canva Layouts', 'Gamma Presentation', 'Google NotebookLM'].map((tool) => (
                <div key={tool} className="flex items-center gap-1.5 font-bold text-headline-sm font-display text-on-surface">
                  <span className="text-[18px]">✨</span>
                  {tool}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS NOTEPAD DRAWERS ===== */}
        <section id="how-it-works" className="py-16 px-margin-mobile md:px-margin-page">
          <div className="max-w-7xl mx-auto">
            <AnimatedContainer className="text-center mb-12">
              <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-1 block handwritten text-[20px]">
                📂 Filing Mechanics
              </span>
              <h2 className="font-display text-[32px] md:text-[40px] text-on-background font-bold leading-tight">
                Designed to Match Your Desk
              </h2>
              <p className="text-body-md text-on-surface-variant max-w-xl mx-auto leading-relaxed mt-1">
                No complex prompt engineering lessons required. The Cozy Desk replicates how you already teach.
              </p>
            </AnimatedContainer>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: '✍️',
                  title: '1. Write the Notepad',
                  desc: 'Formulate classroom objectives naturally inside our lined notebook Mad-libs blanks.',
                },
                {
                  icon: '📌',
                  title: '2. Pin Your index Cards',
                  desc: 'AI templates produce optimized drafts on sticky-notes. Pin them to your teaching drawer instantly.',
                },
                {
                  icon: '📦',
                  title: '3. Pack Bundle ZIP',
                  desc: 'Bundle your homework outlines and study blueprints into a cozy ZIP package to download.',
                }
              ].map((step, i) => (
                <AnimatedContainer key={step.title} delay={i * 0.15}>
                  <div className="bg-white border border-[#e3dec3] p-8 rounded-2xl cozy-shadow hover:shadow-md hover:border-primary/60 transition-all text-left relative overflow-hidden h-full flex flex-col justify-between">
                    <div>
                      <div className="text-[34px] mb-4 filter drop-shadow select-none">{step.icon}</div>
                      <h3 className="font-display text-headline-md font-bold mb-2 text-on-surface">{step.title}</h3>
                      <p className="text-label-sm text-on-surface-variant leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </section>

        {/* ===== COZY BENEFITS FILE CABINET ===== */}
        <section id="benefits" className="py-16 px-margin-mobile md:px-margin-page bg-white border-t border-[#e3dec3]">
          <div className="max-w-6xl mx-auto">
            <AnimatedContainer className="text-center mb-12">
              <h2 className="font-display text-[32px] md:text-[40px] text-on-background font-bold tracking-tight">
                Why Cozy Classrooms Love Us
              </h2>
            </AnimatedContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {[
                {
                  sticker: '🍎',
                  title: '0% Prompt Jargon',
                  desc: "We've embedded state-of-the-art pedagogical frameworks directly into the stationery. Simply write your topic; we write the complex parameter code."
                },
                {
                  sticker: '📐',
                  title: 'Universal Scaffolding',
                  desc: "Instantly adjust student difficulty from weak students to advanced extension challenges with single-click desk buttons."
                },
                {
                  sticker: '📚',
                  title: 'Tabbed Filing Organizers',
                  desc: "Filing folders are cataloged like cardboard folders, stamped with emoji stickers. Never lose a lesson template map again."
                },
                {
                  sticker: '🎨',
                  title: 'Classroom Launchpad',
                  desc: "Daily Launchpad categorizes tools by prep time, visual presentation, or student study phases, fitting cleanly into your daily timetable."
                }
              ].map((item, i) => (
                <AnimatedContainer key={item.title} delay={i * 0.1}>
                  <div className="bg-[#faf7f0]/60 border border-[#e3dec3] p-6 rounded-2xl flex gap-4 items-start cozy-shadow">
                    <div className="text-[28px] filter drop-shadow select-none shrink-0">{item.sticker}</div>
                    <div>
                      <h3 className="font-display font-bold text-headline-sm text-on-surface mb-1">{item.title}</h3>
                      <p className="text-label-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA SECTION ===== */}
        <section className="py-16 px-margin-mobile md:px-margin-page relative overflow-hidden border-t border-[#e3dec3]">
          <AnimatedContainer className="relative z-10 max-w-4xl mx-auto text-center py-12 bg-white border border-[#e3dec3] rounded-2xl cozy-shadow p-6">
            <span className="text-[44px] mb-3 block select-none filter drop-shadow">🎁</span>
            <h2 className="font-display text-display-lg-mobile md:text-[38px] font-bold text-on-surface mb-4">
              Ready to pack your daily drawer?
            </h2>
            <p className="text-body-md text-on-surface-variant mb-6 max-w-xl mx-auto">
              Join thousands of educators who are planning lessons, quizzes, and classroom outline guides in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/builder"
                className="bg-primary text-white px-8 py-4 rounded-full text-body-md font-bold shadow-md hover:scale-[1.03] transition-all active:scale-98"
              >
                Start Doodling Free
              </Link>
            </div>
            <p className="text-[12px] text-on-surface-variant font-bold mt-3">Free 14-day trial • Classroom setup ready in 1 minute</p>
          </AnimatedContainer>
        </section>
      </main>

      {/* ===== COZY FOOTER ===== */}
      <footer className="w-full py-12 px-margin-mobile md:px-margin-page bg-surface-container-highest border-t border-[#e3dec3] text-left">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[22px]">🏫</span>
            <span className="text-headline-md font-display font-bold text-primary">ClassOrbit</span>
          </div>
          <p className="text-label-sm text-on-surface-variant font-bold">
            © 2026 ClassOrbit. Cozy Planning Desks for Teachers Globally.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-on-surface-variant hover:text-on-surface font-label-sm font-bold transition-colors">
              Privacy Slate
            </Link>
            <Link href="#" className="text-on-surface-variant hover:text-on-surface font-label-sm font-bold transition-colors">
              Desk Terms
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
