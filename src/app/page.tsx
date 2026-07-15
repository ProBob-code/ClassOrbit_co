'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import Topbar from '@/components/layout/Topbar';
import SiteFooter from '@/components/layout/SiteFooter';
import { useUser } from '@/lib/hooks/useUser';
import AppPreview from '@/components/sections/AppPreview';
import PricingSection from '@/components/sections/PricingSection';
import Testimonials from '@/components/sections/Testimonials';
import FAQ from '@/components/sections/FAQ';
import { subjects } from '@/data/subjects';
import { Star, Mail, ArrowRight, Loader2, Sparkles, Wand2, Rocket, ChevronDown, ShieldCheck, CreditCard, Ban, BookOpen, BarChart3, Users } from 'lucide-react';

const presets = [
  { topic: '🍎 Photosynthesis & Plant Cells', subject: 'Science', grade: 'Grade 5', type: 'quiz' },
  { topic: '📐 Pythagorean Theorem Calculations', subject: 'Math', grade: 'Grade 8', type: 'lesson_plan' },
  { topic: '📜 Catalysts of Industrial Revolution', subject: 'History', grade: 'Grade 10', type: 'ppt' },
];

const subjectEmoji: Record<string, string> = {
  math: '📐',
  science: '🔬',
  english: '📖',
  biology: '🧬',
  physics: '🚀',
  chemistry: '⚗️',
  history: '📜',
  geography: '🌍',
  commerce: '💼',
  computer_science: '💻',
};

const trustStats = [
  { value: '4.8', label: 'Avg. teacher rating', icon: true },
  { value: '8', label: 'AI platforms supported' },
  { value: '14', label: 'Content formats' },
  { value: '10k+', label: 'Prompts built' },
];

const aiTools = [
  { name: 'ChatGPT', domain: 'chat.openai.com' },
  { name: 'Claude', domain: 'claude.ai' },
  { name: 'Canva', domain: 'canva.com' },
  { name: 'Gamma', domain: 'gamma.app' },
  { name: 'NotebookLM', domain: 'notebooklm.google.com' },
  { name: 'Suno', domain: 'suno.com' },
  { name: 'ElevenLabs', domain: 'elevenlabs.io' },
  { name: 'Ideogram', domain: 'ideogram.ai' },
];

const steps = [
  {
    icon: Sparkles,
    title: 'Pick your class & topic',
    body: 'Tell ClassOrbit the grade, subject, and what you want to make — a quiz, lesson plan, worksheet, and more. No prompt-writing skills needed.',
  },
  {
    icon: Wand2,
    title: 'We build the perfect prompt',
    body: 'ClassOrbit engineers a fully optimized, platform-specific prompt tuned to your classroom — grounded in your own syllabus if you upload one.',
  },
  {
    icon: Rocket,
    title: 'Launch to your AI tools',
    body: 'Send it straight to ChatGPT, Claude, Gamma, Canva, or NotebookLM in one click. Start generating instantly — no copy-pasting or reformatting.',
  },
];

/* Animated count-up for trust stats — runs once when scrolled into view */
function StatValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const match = value.match(/^([\d.]+)(.*)$/);
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : '';
  const decimals = match && match[1].includes('.') ? 1 : 0;

  useEffect(() => {
    if (!inView || !match) return;
    const node = ref.current;
    const controls = animate(0, target, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (node) node.textContent = v.toFixed(decimals) + suffix;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return <span ref={ref}>{value}</span>;
}

export default function LandingPage() {
  const [sandboxTopic, setSandboxTopic] = useState('🍎 Photosynthesis & Plant Cells');
  const [sandboxSubject, setSandboxSubject] = useState('Science');
  const [sandboxGrade, setSandboxGrade] = useState('Grade 5');
  const [sandboxType, setSandboxType] = useState('quiz');
  const [showAllSubjects, setShowAllSubjects] = useState(false);

  const { user } = useUser();

  // Waitlist count
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/waitlist/count')
      .then(r => r.json())
      .then(d => setWaitlistCount(d.count ?? null))
      .catch(() => {});
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail.trim() }),
      });
      if (res.ok) {
        setWaitlistStatus('done');
        setWaitlistCount(c => (c ?? 0) + 1);
      } else {
        setWaitlistStatus('error');
      }
    } catch {
      setWaitlistStatus('error');
    }
  };

  const visibleSubjects = showAllSubjects ? subjects : subjects.slice(0, 8);

  return (
    <>
      <Topbar />
      <main className="pt-20 galaxy-bg min-h-screen relative overflow-hidden font-body text-white">

        {/* ── Galaxy backdrop: aurora, nebula, milky way, layered stars, shooting stars ──
            Fixed to the viewport: as an absolute layer it spans the full page height and
            its animated layers force constant full-page repaints while scrolling */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="aurora" />
          <div className="nebula" />
          <div className="milky-way" />
          <div className="starfield" />
          <div className="starfield starfield-far" />
          <div className="starfield starfield-near" />
          <div className="shooting-star top-[8%] right-[4%]" />
          <div className="shooting-star top-[38%] right-[30%]" style={{ animationDelay: '5.5s', animationDuration: '13s' }} />
        </div>

        {/* ── HERO ── */}
        <section className="relative px-margin-mobile md:px-margin-page pt-10 pb-14 md:pt-14 z-10">
          <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <AnimatedContainer className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
                <span className="text-[13px]">✨</span>
                <span className="text-[12px] font-bold text-white tracking-widest uppercase">Built for educators, by educators</span>
              </div>

              <h1 className="font-display text-[40px] sm:text-[52px] md:text-[62px] xl:text-[68px] font-extrabold leading-[1.06] tracking-tight text-white drop-shadow-2xl">
                Meet the CEO of every classroom. <br />
                <span className="text-shimmer italic font-serif leading-none pr-2">The Teacher.</span>
              </h1>

              <p className="text-[17px] md:text-[19px] text-text-muted max-w-xl leading-relaxed mt-6">
                ClassOrbit is your AI-powered classroom command center — plan lessons, create resources,
                and launch straight to ChatGPT, Claude, Canva, Gamma & more.{' '}
                <strong className="text-white font-semibold">Zero prompt engineering required.</strong>
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 w-full sm:w-auto">
                <Link
                  href={user ? '/builder' : '/login?next=/builder'}
                  className="w-full sm:w-auto relative inline-flex h-14 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-primary active:scale-95 transition-all animate-cta-pulse hover:shadow-[0_0_60px_-10px_rgba(245,158,11,0.6)] group"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F59E0B_0%,#8B5CF6_50%,#F59E0B_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-surface px-8 py-1 text-[16px] font-bold text-white backdrop-blur-3xl group-hover:bg-surface/80 transition-colors gap-2">
                    🚀 Launch My Command Center
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </Link>
                <Link
                  href="#how-it-works"
                  className="w-full sm:w-auto glass-card text-white px-8 py-4 rounded-full text-[16px] font-bold transition-all active:scale-95 flex items-center justify-center hover:bg-white/10"
                >
                  See how it works
                </Link>
              </div>

              <p className="text-[14px] text-text-muted font-medium mt-4">Free to use · No credit card required</p>

              {/* Trust stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-10 w-full max-w-xl">
                {trustStats.map((s) => (
                  <div key={s.label} className="flex flex-col items-center lg:items-start">
                    <div className="flex items-center gap-1 font-display text-[26px] md:text-[30px] font-extrabold text-white">
                      {s.icon && <Star size={20} className="text-primary fill-primary" />}
                      <StatValue value={s.value} />
                    </div>
                    <span className="text-[12px] text-text-muted font-medium mt-0.5">{s.label}</span>
                  </div>
                ))}
              </div>
            </AnimatedContainer>

            {/* Right: cosmic visual with orbit rings */}
            <AnimatedContainer delay={0.15} className="relative flex items-center justify-center">
              {/* Rings around the artwork */}
              <div className="absolute w-[115%] aspect-square max-w-none pointer-events-none opacity-80">
                <div className="absolute inset-0 rounded-full border border-secondary/15" />
                <div className="absolute inset-[9%] rounded-full border border-white/[0.07]" />
                <div className="absolute inset-0 animate-rotate-slow">
                  <span className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_16px_6px_rgba(245,158,11,0.5)]" />
                </div>
                <div className="absolute inset-[9%] animate-rotate-reverse">
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_14px_5px_rgba(139,92,246,0.55)]" />
                  <span className="absolute bottom-[12%] right-[12%] w-2 h-2 rounded-full bg-white/90 shadow-[0_0_10px_4px_rgba(255,255,255,0.35)]" />
                </div>
              </div>
              {/* Glow behind */}
              <div className="absolute w-[70%] aspect-square bg-secondary/20 blur-[100px] rounded-full animate-pulse-glow pointer-events-none" />
              {/* Artwork */}
              <div className="relative w-full max-w-[560px] animate-float">
                <Image
                  src={`${process.env.NEXT_PUBLIC_ASSETS_BASE_URL}/site/home_hero_cosmic.webp`}
                  alt="A confident teacher standing in her classroom, students raising their hands"
                  width={1536}
                  height={1024}
                  sizes="(max-width: 1024px) 100vw, 560px"
                  preload
                  unoptimized
                  className="w-full h-auto rounded-[36px] border border-white/10 shadow-[0_40px_120px_-30px_rgba(88,28,135,0.7)]"
                />
                {/* Soft edge fade into space */}
                <div className="absolute inset-0 rounded-[36px] shadow-[inset_0_0_60px_18px_rgba(8,3,20,0.4)] pointer-events-none" />

                {/* Levitating proof chips */}
                <div className="absolute -left-4 sm:-left-10 top-[14%] glass-chip rounded-2xl px-4 py-3 flex items-center gap-2.5 animate-levitate">
                  <span className="text-[18px]">📋</span>
                  <div>
                    <p className="text-[12px] font-bold text-white leading-tight">Lesson plan ready</p>
                    <p className="text-[10px] text-text-muted">in 28 seconds</p>
                  </div>
                </div>
                <div className="absolute -right-3 sm:-right-8 top-[52%] glass-chip rounded-2xl px-4 py-3 flex items-center gap-2.5 animate-levitate" style={{ animationDelay: '2.4s' }}>
                  <span className="text-[18px]">⚡</span>
                  <div>
                    <p className="text-[12px] font-bold text-white leading-tight">Launched to ChatGPT</p>
                    <p className="text-[10px] text-text-muted">one click, zero prompts</p>
                  </div>
                </div>
                <div className="absolute left-[8%] -bottom-4 glass-chip rounded-2xl px-4 py-3 flex items-center gap-2.5 animate-levitate" style={{ animationDelay: '4.2s' }}>
                  <span className="text-[18px]">⭐</span>
                  <div>
                    <p className="text-[12px] font-bold text-white leading-tight">4.8 teacher rating</p>
                    <p className="text-[10px] text-text-muted">loved by educators</p>
                  </div>
                </div>
              </div>
            </AnimatedContainer>
          </div>

          {/* Interactive Sandbox — the "paper" stays light, like a real worksheet on a dark desk */}
          <AnimatedContainer delay={0.2} className="mt-20 w-full max-w-[1240px] mx-auto relative z-10">
            <div className="bg-[#FEFCF4] text-[#222] rounded-r-3xl rounded-l-md shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] relative text-left overflow-hidden border border-white/10 flex flex-col group transform rotate-[1deg] hover:rotate-0 transition-transform duration-500">
              <div className="h-16 border-b-[3px] border-red-400/60 flex items-center px-8 gap-2 w-full bg-[#FEFCF4]">
                <span className="text-[16px] font-bold text-red-500/80 tracking-[0.2em] uppercase font-mono">My Lesson Plan</span>
              </div>
              <div className="p-8 sm:p-12 relative flex-1 min-h-[350px]" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 46px, #93c5fd 47px, #93c5fd 48px)', backgroundSize: '100% 48px', backgroundPosition: '0 -2px' }}>
                <div className="absolute left-10 sm:left-14 top-0 bottom-0 w-[3px] bg-red-400/50 pointer-events-none" />
                <div className="pl-8 sm:pl-12 relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                    <h3 className="font-serif text-[32px] font-bold text-[#1a1a1a] flex items-center gap-3">
                      <span className="text-3xl filter drop-shadow-sm">📝</span> Try It Out
                    </h3>
                    <div className="flex bg-[#f1f1f1] p-1.5 rounded-xl border border-[#ddd] shadow-inner">
                      {presets.map((p, idx) => (
                        <button key={idx} onClick={() => { setSandboxTopic(p.topic); setSandboxSubject(p.subject); setSandboxGrade(p.grade); setSandboxType(p.type); }} className={`text-[14px] px-5 py-2 rounded-lg font-bold transition-all cursor-pointer ${sandboxTopic === p.topic ? 'bg-white text-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-[#ccc]' : 'text-[#666] hover:text-[#1a1a1a] hover:bg-white/50'}`}>
                          Preset {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-[24px] text-[#333] font-serif mt-10 leading-[48px] max-w-3xl">
                    Please generate a{' '}
                    <span className="bg-[#FFF8E7] text-amber-700 font-bold px-3 py-1 rounded-md border-b-2 border-amber-500 mx-1 font-sans text-[20px] shadow-sm transform -rotate-1 inline-block">{sandboxType.toUpperCase()}</span>{' '}
                    for my{' '}
                    <span className="bg-emerald-50/80 text-emerald-700 font-bold px-3 py-1 rounded-md border-b-2 border-emerald-500 mx-1 font-sans text-[20px] shadow-sm transform rotate-1 inline-block">{sandboxGrade}</span>{' '}
                    <span className="bg-purple-50/80 text-purple-700 font-bold px-3 py-1 rounded-md border-b-2 border-purple-500 mx-1 font-sans text-[20px] shadow-sm inline-block">{sandboxSubject}</span>{' '}
                    class. The primary learning objective is:{' '}
                    <span className="border-b-2 border-dashed border-[#888] font-bold px-3 py-1 text-[#111] bg-white rounded-t-md ml-1 font-sans text-[20px] shadow-sm inline-block mt-2 sm:mt-0">
                      &quot;{sandboxTopic.replace(/[🍎📐📜]/g, '').trim()}&quot;
                    </span>.
                  </div>
                  <div className="mt-16 pt-6 flex justify-end">
                    <Link
                      href={user ? `/builder?topic=${sandboxTopic}&subject=${sandboxSubject}&grade=${sandboxGrade}&type=${sandboxType}` : `/login?next=${encodeURIComponent(`/builder?topic=${sandboxTopic}&subject=${sandboxSubject}&grade=${sandboxGrade}&type=${sandboxType}`)}`}
                      className="group relative inline-flex items-center justify-center gap-3 bg-[#111] text-white px-8 py-4 rounded-xl font-bold text-[16px] hover:bg-[#333] transition-all cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                    >
                      Build This Prompt <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContainer>
        </section>

        {/* ── TOOL MARQUEE ── */}
        <section className="py-8 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm relative z-10 overflow-hidden">
          <p className="text-center text-[12px] text-text-muted font-bold uppercase tracking-[0.25em] mb-6">
            Launches prompts into your favorite AI platforms
          </p>
          <div className="relative">
            {/* Edge fades */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#080314] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#080314] to-transparent z-10 pointer-events-none" />
            <div className="flex w-max animate-marquee gap-14 pr-14">
              {[...aiTools, ...aiTools].map((tool, i) => (
                <div key={`${tool.name}-${i}`} className="flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 rounded-xl glass-card flex items-center justify-center p-1.5">
                    <Image src={`https://www.google.com/s2/favicons?sz=64&domain=${tool.domain}`} width={28} height={28} unoptimized className="w-full h-full object-contain" alt={tool.name} />
                  </div>
                  <span className="font-display font-bold text-[17px] text-white/80">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EMPOWERING EDUCATORS (brand panel) ── */}
        <section className="py-20 px-margin-mobile md:px-margin-page relative z-10">
          <AnimatedContainer className="max-w-[1500px] mx-auto">
            <div className="glass-panel rounded-[36px] overflow-hidden grid grid-cols-1 md:grid-cols-2">
              {/* Teacher portrait — confident educator, matches the brand posters */}
              <div className="relative min-h-[300px] md:min-h-[460px] overflow-hidden">
                <Image
                  src={`${process.env.NEXT_PUBLIC_ASSETS_BASE_URL}/site/teacher_portrait.webp`}
                  alt="A confident teacher in his classroom — inspire, lead, make a difference"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0620]/70 via-transparent to-transparent md:bg-gradient-to-r" />
              </div>
              <div className="p-8 md:p-14 flex flex-col justify-center relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <h2 className="font-display text-[32px] md:text-[44px] font-extrabold leading-tight tracking-tight relative z-10">
                  <span className="text-white">Empowering </span>
                  <span className="text-secondary">Educators.</span>
                  <br />
                  <span className="text-white">Elevating </span>
                  <span className="text-primary">Education.</span>
                </h2>
                <p className="text-[17px] text-text-muted leading-relaxed mt-4 relative z-10">
                  All-in-one platform to manage, teach, and inspire — together.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-8 relative z-10">
                  {[
                    { icon: BookOpen, label: 'Teach', body: 'Deliver engaging lessons' },
                    { icon: BarChart3, label: 'Manage', body: 'Simplify classroom prep' },
                    { icon: Users, label: 'Grow', body: 'Continuously learn & grow' },
                  ].map(({ icon: Icon, label, body }) => (
                    <div key={label} className="glass-card rounded-2xl p-4 text-center">
                      <div className="w-10 h-10 mx-auto rounded-full bg-secondary/20 text-secondary flex items-center justify-center mb-2">
                        <Icon size={18} />
                      </div>
                      <p className="text-[14px] font-bold text-white">{label}</p>
                      <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{body}</p>
                    </div>
                  ))}
                </div>
                <p className="font-serif italic text-primary/90 text-[16px] mt-8 relative z-10">
                  Better tools. Brighter futures.
                </p>
              </div>
            </div>
          </AnimatedContainer>
        </section>

        {/* ── SUBJECTS GRID ── */}
        <section id="subjects" className="py-20 px-margin-mobile md:px-margin-page galaxy-band border-y border-white/5 relative z-10">
          <div className="dot-grid" />
          <div className="max-w-[1500px] mx-auto relative">
            <AnimatedContainer className="text-center mb-12">
              <span className="text-[13px] font-bold text-primary tracking-[0.2em] uppercase mb-3 block">Every subject, every grade</span>
              <h2 className="font-display text-[34px] md:text-[46px] text-white font-extrabold leading-tight tracking-tight">
                Built for what you teach
              </h2>
              <p className="text-[17px] text-text-muted max-w-xl mx-auto mt-3">
                Pick your subject and get classroom-ready resources in seconds.
              </p>
            </AnimatedContainer>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleSubjects.map((s) => (
                <Link
                  key={s.id}
                  href={user ? `/builder?subject=${s.label}` : `/login?next=${encodeURIComponent(`/builder?subject=${s.label}`)}`}
                  className="glass-card tilt-card rounded-3xl p-5 flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0 group-hover:bg-primary/20 transition-colors">
                    {subjectEmoji[s.id] ?? '📚'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-[16px] truncate">{s.label}</p>
                    <p className="text-[13px] text-text-muted">K–12 · 14 formats</p>
                  </div>
                  <ArrowRight size={18} className="ml-auto text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              ))}
            </div>

            {subjects.length > 8 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAllSubjects(v => !v)}
                  className="inline-flex items-center gap-2 text-[15px] font-bold text-primary hover:text-primary-hover transition-colors"
                >
                  {showAllSubjects ? 'Show less' : `Show all ${subjects.length} subjects`}
                  <ChevronDown size={18} className={`transition-transform ${showAllSubjects ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-24 px-margin-mobile md:px-margin-page relative z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-secondary/5 blur-[180px] rounded-full pointer-events-none" />
          <div className="max-w-[1500px] mx-auto relative">
            <AnimatedContainer className="text-center mb-16">
              <span className="text-[13px] font-bold text-primary tracking-[0.2em] uppercase mb-3 block">How ClassOrbit works</span>
              <h2 className="font-display text-[34px] md:text-[46px] text-white font-extrabold leading-tight tracking-tight">
                Three steps to a ready lesson
              </h2>
              <p className="text-[17px] text-text-muted max-w-xl mx-auto mt-3">
                From a blank page to classroom-ready in under a minute.
              </p>
            </AnimatedContainer>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <AnimatedContainer key={step.title} delay={i * 0.1}>
                    <div className="glass-card tilt-card rounded-[28px] p-8 h-full flex flex-col items-start">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <Icon size={22} />
                        </div>
                        <span className="font-display text-[15px] font-bold text-primary bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">{i + 1}</span>
                      </div>
                      <h3 className="font-display text-[20px] font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-[15px] text-text-muted leading-relaxed">{step.body}</p>
                    </div>
                  </AnimatedContainer>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── APP PREVIEW ── */}
        <AppPreview />

        {/* ── TRUST BAND ── */}
        <section className="py-8 px-margin-mobile md:px-margin-page galaxy-band border-y border-white/5 relative z-10">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
            {[
              { icon: CreditCard, label: 'Free to start' },
              { icon: Ban, label: 'No credit card required' },
              { icon: ShieldCheck, label: 'Cancel anytime' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-white/80 font-semibold text-[15px]">
                <Icon size={18} className="text-primary" />
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING ── */}
        <PricingSection />

        {/* ── FOR SCHOOLS & DISTRICTS ── */}
        <section id="for-schools" className="py-24 px-margin-mobile md:px-margin-page relative z-10">
          <AnimatedContainer className="max-w-[1500px] mx-auto">
            <div className="rounded-[36px] bg-gradient-to-br from-[#1E1145] to-[#120A2A] border border-white/10 overflow-hidden relative grid grid-cols-1 md:grid-cols-5">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/15 blur-[130px] rounded-full pointer-events-none" />
              {/* Whole-class photo — "Together we learn, together we grow" */}
              <div className="md:col-span-2 relative min-h-[260px] md:min-h-full overflow-hidden">
                <Image
                  src={`${process.env.NEXT_PUBLIC_ASSETS_BASE_URL}/site/teacher_class.webp`}
                  alt="A teacher engaging her whole class — together we learn, together we grow"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120A2A]/80 via-transparent to-transparent md:bg-gradient-to-l" />
              </div>
              <div className="md:col-span-3 p-8 md:p-14 text-center md:text-left relative z-10">
                <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] mb-3 block">For Schools &amp; Districts</span>
                <h2 className="font-display text-[30px] md:text-[42px] font-extrabold text-white leading-tight tracking-tight mb-4">
                  Bring ClassOrbit to your whole faculty
                </h2>
                <p className="text-[16px] text-text-muted mb-8 leading-relaxed">
                  Get early access to shared school workspaces, admin dashboards, usage analytics, and
                  volume pricing for your teachers.
                </p>

                {waitlistStatus !== 'done' && (
                  <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start max-w-lg">
                    <div className="relative flex-1 w-full">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle" />
                      <input
                        type="email"
                        placeholder="your@school.edu"
                        value={waitlistEmail}
                        onChange={e => setWaitlistEmail(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-full pl-11 pr-4 py-3.5 text-[15px] text-white placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <button type="submit" disabled={waitlistStatus === 'loading'} className="shrink-0 bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-full font-bold text-[15px] transition-all flex items-center gap-2 disabled:opacity-60 whitespace-nowrap">
                      {waitlistStatus === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                      Join early access
                    </button>
                  </form>
                )}

                {waitlistStatus === 'done' && (
                  <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-full font-semibold text-[15px]">
                    ✓ You&apos;re on the list! We&apos;ll be in touch.
                  </div>
                )}

                {waitlistCount !== null && waitlistCount > 0 && (
                  <p className="text-[13px] text-text-subtle mt-4">
                    Join <strong className="text-white">{waitlistCount.toLocaleString()}+</strong> educators and schools already on the list.
                  </p>
                )}
              </div>
            </div>
          </AnimatedContainer>
        </section>

        {/* ── TESTIMONIALS ── */}
        <Testimonials />

        {/* ── FAQ ── */}
        <FAQ />

        {/* ── FINAL CTA ── */}
        <section className="py-24 px-margin-mobile md:px-margin-page relative z-10">
          <AnimatedContainer className="relative max-w-[1200px] mx-auto text-center glass-panel rounded-[40px] p-10 md:p-16 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />
            <div className="dot-grid" />
            <span className="text-[48px] mb-4 block select-none relative z-10">🚀</span>
            <h2 className="font-display text-[34px] md:text-[48px] font-extrabold text-white mb-4 tracking-tight leading-tight relative z-10">
              Ready to take command of your classroom?
            </h2>
            <p className="text-[18px] text-text-muted mb-8 max-w-xl mx-auto relative z-10">
              Join the teachers planning, creating, and launching in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <Link href={user ? '/builder' : '/login?next=/builder'} className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-full text-[16px] font-bold shadow-glow active:scale-95 transition-all">
                Get started free →
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center glass-card text-white px-8 py-4 rounded-full text-[16px] font-bold hover:bg-white/10 transition-all">
                View pricing
              </Link>
            </div>
            <p className="text-[13px] text-text-muted font-medium mt-4 relative z-10">Free to use · Set up in under a minute · No credit card required</p>
          </AnimatedContainer>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
