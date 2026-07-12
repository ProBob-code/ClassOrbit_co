import type { Metadata } from 'next';
import Link from 'next/link';
import Topbar from '@/components/layout/Topbar';
import BlogShowcase, { type BlogPost } from '@/components/blog/BlogShowcase';
import SiteFooter from '@/components/layout/SiteFooter';
import { getApiBaseUrl } from '@/lib/api-base';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Practical AI guides and prompt strategies for educators, from the ClassOrbit team.',
};

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

async function getBlogs(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/blogs`);
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
      <main className="pt-24 pb-20 px-margin-mobile md:px-margin-page galaxy-bg min-h-screen font-body text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="aurora" />
          <div className="nebula" />
          <div className="starfield" />
          <div className="starfield starfield-far" />
          <div className="shooting-star top-[12%] right-[10%]" />
        </div>
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="mb-14 text-center blog-rise">
            <span className="inline-flex items-center gap-2 text-[12px] font-bold text-primary tracking-[0.2em] uppercase mb-4 border border-primary/25 bg-primary-light rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              ClassOrbit Blog
            </span>
            <h1 className="font-display text-[40px] md:text-[56px] text-white font-extrabold leading-[1.08] tracking-tight mb-4">
              AI for <span className="text-shimmer">Educators</span>
            </h1>
            <p className="text-[18px] text-text-muted max-w-2xl mx-auto leading-relaxed">
              Practical guides, prompt strategies, and research from the ClassOrbit team — published weekly.
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="glass-panel rounded-[28px] p-14 text-center max-w-2xl mx-auto blog-rise">
              <div className="text-6xl mb-5">🔭</div>
              <p className="font-display text-2xl font-bold text-white mb-2">Nothing on the radar yet</p>
              <p className="text-text-muted">
                Our first guides are in orbit and landing soon. Check back shortly.
              </p>
            </div>
          ) : (
            <BlogShowcase posts={posts} />
          )}

          <div className="mt-20 text-center featured-card rounded-[28px] p-10 max-w-3xl mx-auto relative overflow-hidden">
            <div className="absolute -top-10 -right-10 text-[120px] opacity-[0.07] rotate-12 pointer-events-none select-none" aria-hidden>
              🚀
            </div>
            <p className="font-display text-white font-extrabold text-2xl mb-2">Put these guides to work</p>
            <p className="text-text-muted text-[15px] mb-6 max-w-md mx-auto">
              Turn any strategy you read here into a ready-to-use lesson, worksheet, or prompt in minutes.
            </p>
            <Link
              href="/login?next=/builder"
              className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3 rounded-full font-bold text-sm hover:bg-primary-hover transition-all shadow-glow"
            >
              Try ClassOrbit Free →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
