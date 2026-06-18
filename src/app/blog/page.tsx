import type { Metadata } from 'next';
import Link from 'next/link';
import Topbar from '@/components/layout/Topbar';
import { getApiBaseUrl } from '@/lib/api-base';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Practical AI guides and prompt strategies for educators, from the ClassOrbit team.',
};

export const runtime = 'edge';

interface BlogPost {
  slug: string;
  created_at: string;
  cover_image_url?: string;
  title: string;
  excerpt?: string;
}

async function getBlogs() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/blogs`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.blogs || [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogs();
  return (
    <>
      <Topbar />
      <main className="pt-24 pb-20 px-margin-mobile md:px-margin-page bg-mesh-gradient min-h-screen font-body">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <span className="text-[14px] font-bold text-primary tracking-[0.2em] uppercase mb-3 block">ClassOrbit Blog</span>
            <h1 className="font-display text-[40px] md:text-[52px] text-white font-extrabold leading-[1.1] tracking-tight mb-4">
              AI for Educators
            </h1>
            <p className="text-[18px] text-text-muted max-w-2xl leading-relaxed">
              Practical guides, prompt strategies, and research from the ClassOrbit team.
            </p>
          </div>

          <div className="space-y-5">
            {posts.map((post: BlogPost) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="glass-card rounded-[24px] p-7 flex flex-col sm:flex-row items-start gap-6 hover:border-primary/40 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl shrink-0">
                  📄
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[12px] text-text-subtle">
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="font-display text-[20px] font-bold text-white group-hover:text-primary transition-colors leading-snug mb-2">
                    {post.title}
                  </h2>
                  <p className="text-[15px] text-text-muted leading-relaxed">{post.excerpt}</p>
                </div>
                <div className="text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 self-center">→</div>
              </Link>
            ))}
          </div>

          <div className="mt-16 text-center glass-panel rounded-[24px] p-8">
            <p className="text-white font-bold text-lg mb-2">More articles coming soon</p>
            <p className="text-text-muted text-sm mb-5">We publish weekly guides on using AI effectively in the classroom.</p>
            <Link href="/login?next=/builder" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-primary-hover transition-all shadow-glow">
              Try ClassOrbit Free →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
