import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';
import SiteFooter from '@/components/layout/SiteFooter';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import {
  Sparkles,
  Clock,
  BookOpen,
  Palette,
  Users,
  CheckCircle2,
  Cpu,
  GraduationCap,
  Orbit,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'The story of ClassOrbit: why we built an AI teaching partner made specifically for educators, and the founder behind it.',
};

const differentiators = [
  {
    icon: Sparkles,
    title: 'Built for education',
    body: 'Understands curricula, learning objectives, and classroom realities, not just text generation.',
    wide: true,
  },
  {
    icon: Clock,
    title: 'Hours back every week',
    body: 'Lesson plans, worksheets, assessments, and presentations in minutes, not evenings.',
    wide: true,
  },
  {
    icon: BookOpen,
    title: 'Curriculum aligned',
    body: 'CBSE, ICSE, IGCSE, Cambridge, IB, and more.',
    wide: false,
  },
  {
    icon: Palette,
    title: 'Beautiful by design',
    body: 'Materials that capture students’ attention.',
    wide: false,
  },
  {
    icon: Users,
    title: 'For every educator',
    body: 'Teachers, tutors, coordinators, institutions.',
    wide: false,
  },
];

const visionLines = [
  'Every classroom has world-class teaching resources.',
  'Creativity replaces routine.',
  'Technology amplifies teachers instead of replacing them.',
  'Every student benefits, because their teachers have more time.',
];

const promises = [
  'Teacher-first',
  'Student-focused',
  'Curriculum-aware',
  'Easy to use',
  'Trusted by educators',
];

export default function AboutPage() {
  return (
    <>
      <Topbar />
      <main className="pt-20 pb-20 galaxy-bg min-h-screen font-body text-white relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="aurora" />
          <div className="nebula" />
          <div className="milky-way" />
          <div className="starfield" />
          <div className="starfield starfield-far" />
          <div className="shooting-star top-[10%] right-[8%]" />
        </div>

        {/* ── HERO ── */}
        <section className="px-margin-mobile md:px-margin-page pt-14 pb-20 relative z-10">
          <div className="max-w-[1000px] mx-auto relative">
            {/* Orbit ring decoration behind the headline */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] max-w-[95vw] aspect-square pointer-events-none opacity-60">
              <div className="absolute inset-0 rounded-full border border-secondary/15" />
              <div className="absolute inset-[14%] rounded-full border border-white/[0.06]" />
              <div className="absolute inset-0 animate-rotate-slow">
                <span className="absolute top-1/2 left-0 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_14px_5px_rgba(245,158,11,0.5)]" />
              </div>
              <div className="absolute inset-[14%] animate-rotate-reverse">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-secondary shadow-[0_0_12px_4px_rgba(139,92,246,0.55)]" />
              </div>
            </div>

            <AnimatedContainer className="relative text-center">
              <span className="inline-flex items-center gap-2 text-[12px] font-bold text-primary tracking-[0.2em] uppercase mb-6 border border-primary/25 bg-primary-light rounded-full px-4 py-1.5">
                <Orbit size={13} />
                About ClassOrbit
              </span>
              <h1 className="font-display text-[42px] md:text-[64px] text-white font-extrabold leading-[1.05] tracking-tight mb-6">
                Where great teachers
                <br />
                <span className="text-shimmer italic font-serif pr-2">find their orbit.</span>
              </h1>
              <p className="text-[18px] md:text-[19px] text-text-muted leading-relaxed max-w-2xl mx-auto">
                Teachers shouldn&apos;t lose their evenings to worksheets, lesson plans, and
                formatting. ClassOrbit is the AI teaching partner that gives educators their
                time back, so it goes where it matters most: <strong className="text-white font-semibold">inspiring students.</strong>
              </p>
            </AnimatedContainer>
          </div>
        </section>

        {/* ── MISSION ── */}
        <section className="px-margin-mobile md:px-margin-page py-20 galaxy-band border-y border-white/5 relative z-10">
          <div className="dot-grid" />
          <AnimatedContainer className="max-w-[880px] mx-auto text-center relative">
            <span className="text-[13px] font-bold text-primary tracking-[0.2em] uppercase mb-6 block">Our Mission</span>
            <p className="font-display text-[28px] md:text-[42px] text-white font-extrabold leading-[1.2] tracking-tight">
              Empower every educator with intelligent tools that make teaching more{' '}
              <span className="text-shimmer">creative, efficient, and impactful.</span>
            </p>
          </AnimatedContainer>
        </section>

        {/* ── WHAT MAKES CLASSORBIT DIFFERENT (bento grid) ── */}
        <section className="px-margin-mobile md:px-margin-page py-24 relative z-10">
          <div className="max-w-[1300px] mx-auto">
            <AnimatedContainer className="text-center mb-12">
              <span className="text-[13px] font-bold text-primary tracking-[0.2em] uppercase mb-3 block">Why ClassOrbit</span>
              <h2 className="font-display text-[32px] md:text-[46px] text-white font-extrabold leading-tight tracking-tight">
                Not another AI tool.
              </h2>
            </AnimatedContainer>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
              {differentiators.map(({ icon: Icon, title, body, wide }, i) => (
                <AnimatedContainer
                  key={title}
                  delay={i * 0.08}
                  className={wide ? 'md:col-span-3' : 'md:col-span-2'}
                >
                  <div className="glass-card tilt-card rounded-[28px] p-8 h-full flex flex-col items-start relative overflow-hidden">
                    <span
                      aria-hidden
                      className="absolute -top-3 right-4 font-display text-[88px] font-extrabold text-white/[0.05] leading-none select-none pointer-events-none"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 relative z-10">
                      <Icon size={22} />
                    </div>
                    <h3 className="font-display text-[20px] font-bold text-white mb-2 relative z-10">{title}</h3>
                    <p className="text-[14.5px] text-text-muted leading-relaxed relative z-10">{body}</p>
                  </div>
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </section>

        {/* ── VISION (constellation list) ── */}
        <section className="px-margin-mobile md:px-margin-page py-20 galaxy-band border-y border-white/5 relative z-10">
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedContainer>
              <span className="text-[13px] font-bold text-primary tracking-[0.2em] uppercase mb-3 block">Our Vision</span>
              <h2 className="font-display text-[32px] md:text-[44px] text-white font-extrabold leading-tight tracking-tight">
                We dream of a world where&hellip;
              </h2>
            </AnimatedContainer>

            <div className="relative pl-2">
              <div className="absolute left-[13px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/60 via-secondary/40 to-transparent" />
              <div className="space-y-7">
                {visionLines.map((line, i) => (
                  <AnimatedContainer key={line} delay={0.1 + i * 0.08} direction="left">
                    <div className="flex items-start gap-5">
                      <span className="relative mt-1 shrink-0">
                        <span className="block w-[23px] h-[23px] rounded-full border border-primary/30 bg-[#0E0724]" />
                        <span className="absolute inset-[7px] rounded-full bg-primary shadow-[0_0_12px_3px_rgba(245,158,11,0.45)]" />
                      </span>
                      <p className="font-display text-[18px] md:text-[21px] text-white font-bold leading-snug pt-0.5">
                        {line}
                      </p>
                    </div>
                  </AnimatedContainer>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── OUR STORY (short and sharp) ── */}
        <section className="px-margin-mobile md:px-margin-page py-24 relative z-10">
          <div className="max-w-[820px] mx-auto">
            <AnimatedContainer className="text-center mb-12">
              <span className="text-[13px] font-bold text-primary tracking-[0.2em] uppercase mb-3 block">Our Story</span>
              <h2 className="font-display text-[32px] md:text-[46px] text-white font-extrabold leading-tight tracking-tight">
                It started with a problem that
                <br className="hidden md:block" /> <span className="text-shimmer">refused to be ignored.</span>
              </h2>
            </AnimatedContainer>

            {/* Two worlds */}
            <AnimatedContainer delay={0.1} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch gap-4 mb-10">
              <div className="glass-card rounded-[24px] p-6 text-center">
                <div className="w-11 h-11 mx-auto rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center mb-3">
                  <Cpu size={20} />
                </div>
                <p className="font-display text-[17px] font-bold text-white">Technology</p>
                <p className="text-[13px] text-text-muted mt-1 leading-snug">Building AI systems and intelligent products</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="font-display text-[26px] font-extrabold text-primary select-none" aria-hidden>×</span>
              </div>
              <div className="glass-card rounded-[24px] p-6 text-center">
                <div className="w-11 h-11 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-3">
                  <GraduationCap size={20} />
                </div>
                <p className="font-display text-[17px] font-bold text-white">Education</p>
                <p className="text-[13px] text-text-muted mt-1 leading-snug">Teaching, mentoring, and designing resources</p>
              </div>
            </AnimatedContainer>

            <AnimatedContainer delay={0.15} className="space-y-5 text-center">
              <p className="text-[16px] text-text-muted leading-relaxed max-w-2xl mx-auto">
                Working between both worlds, our founder kept seeing the same thing: passionate
                teachers losing their evenings, and time with family, to lesson plans,
                worksheets, and formatting. AI was advancing fast, yet almost none of it was built
                for educators.
              </p>
            </AnimatedContainer>

            {/* Pull quote */}
            <AnimatedContainer className="my-14 text-center relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[220px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
              <p className="font-serif italic text-[28px] md:text-[38px] text-white font-bold leading-snug relative">
                What if AI didn&apos;t replace teachers&hellip;
                <br />
                <span className="text-shimmer">but empowered them?</span>
              </p>
            </AnimatedContainer>

            <AnimatedContainer className="text-center">
              <p className="text-[16px] text-text-muted leading-relaxed max-w-2xl mx-auto">
                That question became ClassOrbit: an intelligent teaching ecosystem that understands
                curricula, creates high-quality resources, and gives teachers back the one thing
                they can never make more of: <strong className="text-white font-semibold">time.</strong>
              </p>
              <p className="font-display text-[24px] md:text-[30px] text-white font-extrabold leading-snug tracking-tight mt-10">
                When teachers are empowered, <span className="text-shimmer">students thrive.</span>
              </p>
            </AnimatedContainer>
          </div>
        </section>

        {/* ── A NOTE FROM OUR FOUNDER ── */}
        <section className="px-margin-mobile md:px-margin-page py-20 relative z-10">
          <AnimatedContainer className="max-w-[1020px] mx-auto">
            <div className="border-beam">
              <div className="border-beam-inner overflow-hidden grid grid-cols-1 md:grid-cols-5 relative">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="md:col-span-2 relative min-h-[380px] md:min-h-full overflow-hidden">
                  <Image
                    src="/assets/founder_bobin.jpg"
                    alt="Bobin Abraham Jacob, Founder of ClassOrbit"
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    unoptimized
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E0724] via-transparent to-transparent md:bg-gradient-to-r" />
                  <div className="absolute left-4 bottom-20 glass-chip rounded-2xl px-4 py-2.5 flex items-center gap-2 animate-levitate">
                    <span className="text-[15px]">🧑‍💻</span>
                    <p className="text-[12px] font-bold text-white leading-tight">AI Engineer</p>
                  </div>
                  <div className="absolute right-4 bottom-6 glass-chip rounded-2xl px-4 py-2.5 flex items-center gap-2 animate-levitate" style={{ animationDelay: '2.6s' }}>
                    <span className="text-[15px]">🎓</span>
                    <p className="text-[12px] font-bold text-white leading-tight">Educator &amp; Mentor</p>
                  </div>
                </div>
                <div className="md:col-span-3 p-8 md:p-14 flex flex-col justify-center relative z-10">
                  <span className="text-[13px] font-bold text-primary tracking-[0.2em] uppercase mb-6 block">A Note From Our Founder</span>
                  <p className="font-serif italic text-[18px] md:text-[21px] text-white/90 leading-relaxed">
                    &ldquo;Teachers are the most powerful force for change in the world.
                    Technology should never diminish that role. It should amplify it.
                    <br /><br />
                    This is more than a company. It&apos;s our contribution to the future of
                    education. Welcome to ClassOrbit.&rdquo;
                  </p>
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="font-display font-extrabold text-white text-[18px]">Bobin Abraham Jacob</p>
                    <p className="text-[13px] text-primary font-semibold mt-0.5">Founder, ClassOrbit</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContainer>
        </section>

        {/* ── CTA ── */}
        <section className="px-margin-mobile md:px-margin-page pb-24 pt-4 relative z-10">
          <AnimatedContainer className="relative max-w-[1100px] mx-auto text-center glass-panel rounded-[40px] p-10 md:p-16 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />
            <div className="dot-grid" />
            <h2 className="font-display text-[30px] md:text-[44px] font-extrabold text-white mb-4 tracking-tight leading-tight relative z-10">
              The future of education isn&apos;t about replacing teachers.
              <br />
              It&apos;s about giving them <span className="text-shimmer">superpowers.</span>
            </h2>

            <div className="flex flex-wrap justify-center gap-2.5 my-8 max-w-2xl mx-auto relative z-10">
              {promises.map((p) => (
                <span key={p} className="glass-card rounded-full px-4 py-2 flex items-center gap-1.5 text-[13px] font-semibold text-white/90">
                  <CheckCircle2 size={14} className="text-primary" />
                  {p}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <Link href="/login?next=/builder" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-full text-[16px] font-bold shadow-glow active:scale-95 transition-all">
                Try ClassOrbit Free →
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center glass-card text-white px-8 py-4 rounded-full text-[16px] font-bold hover:bg-white/10 transition-all">
                View pricing
              </Link>
            </div>
            <p className="text-[13px] text-text-muted font-medium mt-6 relative z-10">
              Empowering Educators. Inspiring Learners. Shaping the Future.
            </p>
          </AnimatedContainer>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
