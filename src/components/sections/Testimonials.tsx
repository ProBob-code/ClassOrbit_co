'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Star } from 'lucide-react';

// Replace these with real testimonials from beta users before launching
const testimonials = [
  {
    name: 'Anjali Desai',
    role: 'Grade 7 Science Teacher',
    school: 'Ryan International School, Mumbai',
    avatar: 'AD',
    color: 'bg-emerald-500',
    quote:
      "I used to spend 20 minutes just writing a decent prompt for ChatGPT. ClassOrbit does it in seconds, and it actually knows what Grade 7 science needs. My lesson prep time has been cut in half.",
    stars: 5,
  },
  {
    name: 'Rahul Verma',
    role: 'High School History Teacher',
    school: 'Delhi Public School, R.K. Puram, New Delhi',
    avatar: 'RV',
    color: 'bg-blue-500',
    quote:
      "The fact that it optimizes for each platform separately is what sold me. My Gamma prompt looks completely different from my ChatGPT one, and both are better than anything I'd write myself.",
    stars: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Curriculum Coordinator',
    school: 'DPS International, Bangalore',
    avatar: 'PS',
    color: 'bg-purple-500',
    quote:
      "We rolled this out to 40 teachers across our school. The guided builder means even our least tech-comfortable staff can generate AI content confidently. It's been transformative.",
    stars: 5,
  },
  {
    name: 'Sneha Patel',
    role: 'Elementary School Teacher',
    school: 'The Shri Ram School, Gurugram',
    avatar: 'SP',
    color: 'bg-rose-500',
    quote:
      "I attached my whole unit syllabus and asked it to build a quiz. It actually read the document and built questions from my exact curriculum. That feature alone is worth it.",
    stars: 5,
  },
  {
    name: 'Vikram Nair',
    role: 'Grade 9 Math Teacher',
    school: 'Kendriya Vidyalaya, Kochi',
    avatar: 'VN',
    color: 'bg-amber-500',
    quote:
      "Sunday evenings used to be worksheet-making marathons. Now I build a week's worth of practice sets in one sitting and spend the time actually reviewing where my students struggle.",
    stars: 5,
  },
  {
    name: 'Meera Iyer',
    role: 'Kindergarten Teacher',
    school: 'Bombay Scottish School, Mumbai',
    avatar: 'MI',
    color: 'bg-cyan-500',
    quote:
      "I'm not a tech person at all, and I still got a full storytime activity plan on my first try. The guided steps feel like a colleague walking me through it.",
    stars: 5,
  },
  {
    name: 'Arjun Singh',
    role: 'Physics Teacher',
    school: 'The Doon School, Dehradun',
    avatar: 'AS',
    color: 'bg-indigo-500',
    quote:
      "Sending a prompt straight into NotebookLM and getting a revision podcast for my students blew my mind. They listen on the bus ride home — engagement has genuinely gone up.",
    stars: 5,
  },
  {
    name: 'Fatima Khan',
    role: 'English Teacher',
    school: 'City Montessori School, Lucknow',
    avatar: 'FK',
    color: 'bg-teal-500',
    quote:
      "Differentiation used to mean triple the prep. Now I generate the same lesson at three reading levels in minutes, and every student gets material that actually fits them.",
    stars: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="text-primary fill-primary" />
      ))}
    </div>
  );
}

function TestimonialCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <div className="glass-card rounded-[28px] p-7 flex flex-col gap-4 w-[340px] sm:w-[420px] shrink-0 whitespace-normal">
      <StarRating count={t.stars} />
      <p className="text-[15px] text-text-muted leading-relaxed italic">&quot;{t.quote}&quot;</p>
      <div className="flex items-center gap-3 pt-3 border-t border-white/10 mt-auto">
        <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-[13px] shrink-0`}>
          {t.avatar}
        </div>
        <div>
          <p className="font-semibold text-white text-[14px]">{t.name}</p>
          <p className="text-[12px] text-text-muted">{t.role} · {t.school}</p>
        </div>
      </div>
    </div>
  );
}

/* One full-bleed marquee row — the clone copy exists only for the seamless loop,
   so it's hidden from screen readers and removed entirely under reduced motion.
   The row holds all testimonials so the track is wider than any viewport and the
   clone never appears on screen at the same time as its original. */
function MarqueeRow({ items }: { items: typeof testimonials }) {
  return (
    <div className="marquee-viewport relative overflow-hidden">
      <div className="flex w-max gap-5 pr-5 animate-marquee-slow">
        {items.map((t) => (
          <TestimonialCard key={t.name} t={t} />
        ))}
        <div className="marquee-clone" aria-hidden="true">
          {items.map((t) => (
            <TestimonialCard key={`clone-${t.name}`} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-24 relative z-10 galaxy-band border-y border-white/5 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-12 px-margin-mobile md:px-margin-page"
      >
        <span className="text-[13px] font-bold text-primary tracking-[0.2em] uppercase mb-3 block">What teachers say</span>
        <h2 className="font-display text-[34px] md:text-[46px] text-white font-extrabold leading-tight tracking-tight">
          Loved by educators <br className="hidden md:block" /> around the world
        </h2>
      </motion.div>

      {/* Cinematic full-width classroom banner — padded wrapper keeps the side
          margins at every breakpoint (mx-auto alone would drop them once the
          viewport nears the max width) */}
      <div className="px-margin-mobile md:px-margin-page mb-14">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[32px] overflow-hidden border border-white/10 h-[280px] md:h-[440px] max-w-[1500px] mx-auto"
      >
        <Image
          src={`${process.env.NEXT_PUBLIC_ASSETS_BASE_URL}/site/teacher_students.webp`}
          alt="A teacher and her students exploring ClassOrbit together"
          fill
          sizes="(max-width: 1500px) 100vw, 1500px"
          unoptimized
          className="object-cover object-[50%_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0620]/90 via-[#0D0620]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="font-display text-[24px] md:text-[32px] font-extrabold text-white leading-snug">
              Built with teachers, <span className="text-shimmer">for teachers</span>
            </p>
            <p className="text-[14px] md:text-[15px] text-white/70 mt-1">Real classrooms. Real time saved.</p>
          </div>
          <div className="flex items-center gap-2 glass-chip rounded-full px-5 py-2.5 w-fit">
            <Star size={16} className="text-primary fill-primary" />
            <span className="text-[14px] font-bold text-white">4.8 average rating</span>
          </div>
        </div>
      </motion.div>
      </div>

      {/* Full-bleed marquee — uses the entire viewport width */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-r from-[#080314] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-l from-[#080314] to-transparent z-10 pointer-events-none" />
        <MarqueeRow items={testimonials} />
      </motion.div>
    </section>
  );
}
