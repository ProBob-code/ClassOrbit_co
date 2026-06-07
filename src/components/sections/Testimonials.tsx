'use client';

import { motion } from 'framer-motion';
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
      "I used to spend 20 minutes just writing a decent prompt for ChatGPT. ClassOrbit does it in seconds — and it actually knows what Grade 7 science needs. My lesson prep time has been cut in half.",
    stars: 5,
  },
  {
    name: 'Rahul Verma',
    role: 'High School History Teacher',
    school: 'Delhi Public School, R.K. Puram, New Delhi',
    avatar: 'RV',
    color: 'bg-blue-500',
    quote:
      "The fact that it optimizes for each platform separately is what sold me. My Gamma prompt looks completely different from my ChatGPT one — and both are better than anything I'd write myself.",
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

export default function Testimonials() {
  return (
    <section className="py-24 px-margin-mobile md:px-margin-page relative border-t border-white/5">
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <span className="text-[14px] font-bold text-primary tracking-[0.2em] uppercase mb-4 block">What Teachers Say</span>
          <h2 className="font-display text-[40px] md:text-[52px] text-white font-extrabold leading-[1.1] tracking-tight">
            Loved by educators <br className="hidden md:block" /> around the world
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-7 rounded-[24px] flex flex-col gap-5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10" />

              <StarRating count={t.stars} />

              <p className="text-[16px] text-text-muted leading-relaxed italic relative z-10">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3 pt-2 border-t border-white/5 relative z-10">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-[13px] shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-text-main text-[14px]">{t.name}</p>
                  <p className="text-[12px] text-text-muted">{t.role} · {t.school}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
