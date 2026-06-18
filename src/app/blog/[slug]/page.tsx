import type { Metadata } from 'next';
import Link from 'next/link';
import Topbar from '@/components/layout/Topbar';
import { getApiBaseUrl } from '@/lib/api-base';
import BlogContent from '@/components/blog/BlogContent';

export const runtime = 'edge';

async function getBlogBySlug(slug: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/blogs/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.blog;
  } catch {
    return null;
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return { title: 'Post Not Found | ClassOrbit Blog' };
  return {
    title: post.title,
    description: post.title,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);

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
              <span className="text-[12px] text-text-subtle">
                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="font-display text-[32px] md:text-[40px] font-extrabold text-white leading-tight">{post.title}</h1>
          </div>

          <BlogContent content={post.content} />

          <div className="mt-16 glass-panel rounded-[24px] p-7 text-center border border-primary/20">
            <p className="text-white font-bold text-lg mb-2">Build better prompts with ClassOrbit, free to use</p>
            <Link href="/login?next=/builder" className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-full font-bold hover:bg-primary-hover transition-all shadow-glow mt-4">
              Get Started Free →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
