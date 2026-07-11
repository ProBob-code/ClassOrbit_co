import type { Metadata } from 'next';
import Link from 'next/link';
import Topbar from '@/components/layout/Topbar';
import SiteFooter from '@/components/layout/SiteFooter';
import { getApiBaseUrl } from '@/lib/api-base';
import BlogContent, { extractHeadings } from '@/components/blog/BlogContent';
import TocNav from '@/components/blog/TocNav';

export const runtime = 'edge';

async function getBlogBySlug(slug: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/blogs/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.blog;
  } catch {
    return null;
  }
}

interface RelatedPost {
  slug: string;
  title: string;
  cover_image_url?: string;
  created_at: string;
}

async function getRelatedPosts(currentSlug: string): Promise<RelatedPost[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/blogs`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return ((data.blogs || []) as RelatedPost[]).filter((p) => p.slug !== currentSlug).slice(0, 3);
  } catch {
    return [];
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
    description: post.excerpt || post.title,
    openGraph: post.cover_image_url ? { images: [post.cover_image_url] } : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, related] = await Promise.all([getBlogBySlug(slug), getRelatedPosts(slug)]);

  if (!post) {
    return (
      <>
        <Topbar />
        <main className="pt-24 pb-20 px-margin-mobile galaxy-bg min-h-screen flex items-center justify-center">
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
      <main className="pt-24 pb-20 px-margin-mobile md:px-margin-page galaxy-bg min-h-screen font-body text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="nebula" />
          <div className="starfield" />
          <div className="starfield starfield-far" />
        </div>
        <div className="max-w-[1400px] mx-auto relative z-10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-text-muted hover:text-white text-sm font-medium transition-colors mb-8">
            ← Back to Blog
          </Link>

          <div className="mb-8 text-center max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <span className="text-[13px] text-text-subtle">
                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {post.author ? ` · ${post.author}` : ''}
              </span>
            </div>
            <h1 className="font-display text-[32px] md:text-[44px] font-extrabold text-white leading-tight tracking-tight">{post.title}</h1>
            {post.excerpt && (
              <p className="mt-4 text-[17px] text-text-muted leading-relaxed max-w-2xl mx-auto">{post.excerpt}</p>
            )}
          </div>

          {post.cover_image_url && (
            <div className="mb-10 max-w-4xl mx-auto rounded-[24px] overflow-hidden border border-border shadow-2xl relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-auto block"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0620]/40 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* Desktop: sticky table of contents (left) + article (center) + CTA & related (right)
              so wide screens are used instead of leaving empty gutters. */}
          <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)_290px] lg:gap-12 xl:gap-16 lg:items-start">
            <aside className="hidden lg:block sticky top-28">
              <TocNav headings={extractHeadings(post.content)} />
            </aside>

            <article className="min-w-0 max-w-3xl mx-auto lg:max-w-none">
              <BlogContent content={post.content} />
            </article>

            <aside className="hidden lg:block sticky top-28 space-y-5">
              <div className="glass-panel rounded-[20px] p-5 border border-primary/30">
                <p className="text-white font-bold text-[15px] leading-snug mb-1.5">Build better prompts with ClassOrbit</p>
                <p className="text-[13px] text-text-muted leading-relaxed mb-4">Free to use, made for teachers.</p>
                <Link href="/login?next=/builder" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full font-bold text-[13px] hover:bg-primary-hover transition-all shadow-glow">
                  Get Started Free →
                </Link>
              </div>

              {related.length > 0 && (
                <div className="glass-panel rounded-[20px] p-5">
                  <p className="text-[11px] font-bold text-text-subtle uppercase tracking-[0.18em] mb-4">More from the blog</p>
                  <div className="space-y-4">
                    {related.map((p) => (
                      <Link key={p.slug} href={`/blog/${p.slug}`} className="flex items-start gap-3 group">
                        {p.cover_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.cover_image_url} alt="" className="w-16 h-12 shrink-0 rounded-lg object-cover border border-border" loading="lazy" />
                        ) : (
                          <div className="w-16 h-12 shrink-0 rounded-lg border border-border bg-gradient-to-br from-secondary/20 via-[#160D33] to-primary/10 flex items-center justify-center text-lg">📄</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">{p.title}</p>
                          <p className="text-[11px] text-text-subtle mt-1">
                            {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          <div className="mt-16 max-w-3xl mx-auto glass-panel rounded-[24px] p-7 text-center border border-primary/30 lg:hidden">
            <p className="text-white font-bold text-lg mb-2">Build better prompts with ClassOrbit, free to use</p>
            <Link href="/login?next=/builder" className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-full font-bold hover:bg-primary-hover transition-all shadow-glow mt-4">
              Get Started Free →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
