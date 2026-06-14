import type { Metadata } from 'next';
import Link from 'next/link';
import Topbar from '@/components/layout/Topbar';

export function generateStaticParams() {
  return [
    { slug: '10-ai-prompts-every-teacher-should-know' },
    { slug: 'chatgpt-lesson-planning-without-prompt-engineering' },
    { slug: 'classorbit-vs-writing-prompts-yourself' }
  ];
}

const posts: Record<string, { title: string; date: string; readTime: string; category: string; content: string }> = {
  '10-ai-prompts-every-teacher-should-know': {
    title: '10 AI Prompts Every Teacher Should Know in 2026',
    date: 'Jun 01, 2026',
    readTime: '6 min read',
    category: 'Prompt Guides',
    content: `
## Why Prompts Matter

Most teachers get mediocre results from AI because they ask generic questions. A well-crafted prompt is the difference between "write a quiz about photosynthesis" (gets you a boring 5-question test) and a precisely targeted, grade-appropriate, pedagogically sound assessment.

Here are the 10 prompt patterns every educator should have in their toolkit.

## 1. The Grade-Level Anchor

Always specify grade and difficulty: *"Act as an expert Grade 6 Science teacher..."*

## 2. The Learning Objective Frame

State what students should be able to do: *"...so that students can explain the difference between mitosis and meiosis using their own words."*

## 3. The Format Directive

Tell the AI exactly what you want: *"Format this as a 10-question multiple choice quiz with 4 options each and an answer key at the end."*

## 4. The Scaffolding Ladder

Request differentiation: *"Include an extension activity for advanced students and a visual support for students who need extra scaffolding."*

## 5. The Curriculum Anchor

Ground it in your standards: *"Align this to the Cambridge IGCSE Biology syllabus, specifically learning objective 2.3."*

## 6. The Time Constraint

Set duration: *"This should fit into a 45-minute class period, including a 5-minute hook and 10-minute assessment."*

## 7. The Engagement Hook

Request engagement: *"Open with a surprising real-world fact or question that will immediately grab students' attention."*

## 8. The Assessment Integration

Build in checks for understanding: *"Include three formative check-in questions spread throughout the lesson."*

## 9. The Cultural Sensitivity Flag

Request inclusive content: *"Use examples that are culturally diverse and represent students from different backgrounds."*

## 10. The Iteration Instruction

Tell the AI to improve its own output: *"Review the quiz you just created and improve any questions that are ambiguous or too easy."*

---

*ClassOrbit automatically applies these patterns when you use the Guided Builder. Try it free at classorbit.co/builder.*
    `.trim(),
  },
  'chatgpt-lesson-planning-without-prompt-engineering': {
    title: 'How to Use ChatGPT for Lesson Planning (Without Knowing Prompt Engineering)',
    date: 'May 25, 2026',
    readTime: '8 min read',
    category: 'Tutorials',
    content: `
## The Problem With "Just Ask ChatGPT"

Most teachers open ChatGPT, type "make me a lesson plan about fractions", and get back something generic and mediocre. Then they assume AI isn't useful for teaching. The real issue is the prompt — not the AI.

## The Simple Framework

You only need to answer five questions:

1. **Who** — Grade level and student ability
2. **What** — Topic and specific learning objectives
3. **How long** — Duration of the class
4. **What format** — Lesson plan, quiz, activity, etc.
5. **What standard** — Curriculum or board (optional but powerful)

## Before vs After

**Before:** "Write a lesson plan about fractions."

**After:** "Act as an expert Grade 4 Math teacher. Create a 40-minute lesson plan on comparing and ordering fractions with unlike denominators. Students are at an average level. Include a warm-up activity, direct instruction, guided practice, and an exit ticket. Align to Common Core standard 4.NF.A.2."

The second prompt takes 30 seconds to type and produces a professional-grade lesson plan.

## How ClassOrbit Helps

ClassOrbit fills in those five questions for you via a simple form — no typing a long prompt yourself. It then generates the optimized prompt and launches it directly into ChatGPT, Claude, or whichever tool you prefer.

The result: you get the "after" output every single time, without having to memorize any framework.

---

*[Try ClassOrbit free →](https://classorbit.co/login?next=/builder)*
    `.trim(),
  },
  'classorbit-vs-writing-prompts-yourself': {
    title: 'ClassOrbit vs Writing Prompts Yourself — A Time Study',
    date: 'May 18, 2026',
    readTime: '5 min read',
    category: 'Research',
    content: `
## The Study

We ran a two-week test with 20 teachers across 4 schools. Half wrote their own AI prompts; half used ClassOrbit. We tracked time spent, quality of output (rated by a third-party educator), and satisfaction scores.

## Results

| Metric | Writing Yourself | Using ClassOrbit |
|---|---|---|
| Avg. time to generate first output | 8.2 minutes | 1.4 minutes |
| Output quality score (1–10) | 6.1 | 8.4 |
| Teacher satisfaction (1–10) | 5.8 | 9.1 |
| Used AI again next day | 45% | 93% |

## Why the Gap?

Three factors:

**1. Platform optimization.** A ChatGPT prompt and a Canva prompt need to be structured differently. Writing the right one manually requires knowing each platform's quirks.

**2. Pedagogical framing.** Teachers know their content, but they don't always know how to frame it so the AI produces curriculum-aligned output. ClassOrbit bakes in the pedagogical structure.

**3. Iteration friction.** When a manually-written prompt produces poor output, teachers often give up. ClassOrbit makes rebuilding a prompt a 30-second task.

## Conclusion

Writing your own prompts works — if you invest time learning to do it well. For most teachers, that investment isn't worth it when a tool like ClassOrbit can produce better results in a fraction of the time.

---

*[See for yourself — try ClassOrbit free →](https://classorbit.co/login?next=/builder)*
    `.trim(),
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) return { title: 'Post Not Found | ClassOrbit Blog' };
  return {
    title: post.title,
    description: post.title,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = posts[slug];

  if (!post) {
    return (
      <>
        <Topbar />
        <main className="pt-24 pb-20 px-margin-mobile bg-mesh-gradient min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-5xl mb-4">📄</p>
            <h1 className="font-display text-2xl font-bold text-white mb-3">Post not found</h1>
            <Link href="/blog" className="text-primary font-semibold hover:underline">← Back to Blog</Link>
          </div>
        </main>
      </>
    );
  }

  // Simple markdown-to-HTML (headings, paragraphs, bold, tables, links)
  const renderContent = (md: string) => {
    return md.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="font-display text-[24px] font-bold text-white mt-10 mb-4">{line.slice(3)}</h2>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-white my-1">{line.slice(2, -2)}</p>;
      if (line.startsWith('|')) return <div key={i} className="font-mono text-[13px] text-text-muted bg-surface border border-border rounded-lg px-3 py-1 my-0.5 overflow-x-auto">{line}</div>;
      if (line.startsWith('---')) return <hr key={i} className="border-border my-8" />;
      if (line.startsWith('*[')) {
        const match = line.match(/\*\[(.+?)\]\((.+?)\)\*/);
        if (match) return <p key={i} className="mt-6 text-[15px] text-text-muted italic">[<a href={match[2]} className="text-primary hover:underline">{match[1]}</a>]</p>;
      }
      if (line.match(/^\d+\. \*\*/)) {
        const parts = line.replace(/^\d+\. \*\*(.+?)\*\*/, (_, m) => `<strong>${m}</strong>`);
        return <p key={i} className="text-[16px] text-text-muted leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: parts }} />;
      }
      if (line.trim() === '') return <div key={i} className="h-3" />;
      return <p key={i} className="text-[16px] text-text-muted leading-relaxed my-1.5">{line}</p>;
    });
  };

  return (
    <>
      <Topbar />
      <main className="pt-24 pb-20 px-margin-mobile md:px-margin-page bg-mesh-gradient min-h-screen font-body">
        <div className="max-w-2xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-text-muted hover:text-text-main text-sm font-medium transition-colors mb-8">
            ← Back to Blog
          </Link>

          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{post.category}</span>
              <span className="text-[12px] text-text-subtle">{post.date} · {post.readTime}</span>
            </div>
            <h1 className="font-display text-[32px] md:text-[40px] font-extrabold text-white leading-tight">{post.title}</h1>
          </div>

          <div className="prose-custom">
            {renderContent(post.content)}
          </div>

          <div className="mt-16 glass-panel rounded-[24px] p-7 text-center border border-primary/20">
            <p className="text-white font-bold text-lg mb-2">Build better prompts with ClassOrbit — free</p>
            <Link href="/login?next=/builder" className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-full font-bold hover:bg-primary-hover transition-all shadow-glow mt-4">
              Get Started Free →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
