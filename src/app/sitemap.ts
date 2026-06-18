import type { MetadataRoute } from 'next';

const BASE_URL = 'https://classorbit.co';

const blogPosts = [
  { slug: 'chatgpt-vs-claude-for-teachers', date: '2026-06-14' },
  { slug: 'ai-worksheet-generator-for-teachers', date: '2026-06-12' },
  { slug: 'differentiated-instruction-ai-prompts', date: '2026-06-10' },
  { slug: 'gamma-ai-slides-for-teachers', date: '2026-06-08' },
  { slug: 'ai-flashcards-quiz-prep', date: '2026-06-05' },
  { slug: 'ai-report-card-comments-prompts', date: '2026-06-03' },
  { slug: '10-ai-prompts-every-teacher-should-know', date: '2026-06-01' },
  { slug: 'chatgpt-lesson-planning-without-prompt-engineering', date: '2026-05-25' },
  { slug: 'classorbit-vs-writing-prompts-yourself', date: '2026-05-18' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...blogPosts.map(({ slug, date }) => ({
      url: `${BASE_URL}/blog/${slug}`,
      lastModified: new Date(date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];
}
