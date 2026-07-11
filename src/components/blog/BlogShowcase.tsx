'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BlogRail from './BlogRail';

export interface BlogPost {
  slug: string;
  created_at: string;
  cover_image_url?: string;
  title: string;
  excerpt?: string;
  author?: string;
  content_length?: number;
}

/** How long each post stays featured before the next one floats in */
const ROTATE_MS = 10_000;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ~200 wpm at ~5.5 chars per word ≈ 1100 chars per minute
function readMinutes(len?: number) {
  return len ? Math.max(1, Math.round(len / 1100)) : null;
}

function isFresh(iso: string) {
  return Date.now() - new Date(iso).getTime() < 14 * 24 * 60 * 60 * 1000;
}

function MetaRow({ post, className = '' }: { post: BlogPost; className?: string }) {
  const mins = readMinutes(post.content_length);
  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-text-subtle ${className}`}>
      <span className="text-text-muted font-medium">{post.author || 'ClassOrbit Team'}</span>
      <span aria-hidden>·</span>
      <span>{formatDate(post.created_at)}</span>
      {mins && (
        <>
          <span aria-hidden>·</span>
          <span>{mins} min read</span>
        </>
      )}
    </div>
  );
}

function CoverImage({ post, className = '' }: { post: BlogPost; className?: string }) {
  return post.cover_image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={post.cover_image_url}
      alt={post.title}
      draggable={false}
      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${className}`}
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-secondary/25 via-[#160D33] to-primary/10 flex items-center justify-center text-6xl">
      🪐
    </div>
  );
}

function FeaturedPost({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="featured-card blog-rise rounded-[28px] overflow-hidden grid md:grid-cols-[1.15fr_1fr] group backdrop-blur-[8px]"
    >
      <div className="relative h-56 sm:h-72 md:h-auto md:min-h-[380px] overflow-hidden">
        <CoverImage post={post} />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0D0620]/50 via-transparent to-transparent" />
      </div>
      <div className="p-7 sm:p-10 flex flex-col justify-center">
        {isFresh(post.created_at) && (
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-secondary bg-secondary-light border border-secondary/30 rounded-full px-3 py-1">
              New
            </span>
          </div>
        )}
        <h2 className="font-display text-[26px] sm:text-[32px] font-extrabold text-white leading-[1.15] tracking-tight mb-4 group-hover:text-primary transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-[16px] text-text-muted leading-relaxed mb-6 line-clamp-3">{post.excerpt}</p>
        )}
        <MetaRow post={post} className="mb-7" />
        <span className="inline-flex items-center gap-2 self-start bg-primary text-white text-[14px] font-bold px-5 py-2.5 rounded-full group-hover:bg-primary-hover transition-all shadow-glow">
          Read the guide
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}

function PostCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="glass-card tilt-card blog-rise rounded-[24px] overflow-hidden flex flex-col group shrink-0 snap-start w-[78vw] max-w-[340px] sm:w-[340px]"
      style={{ '--rise-delay': `${Math.min(index, 8) * 90 + 120}ms` } as React.CSSProperties}
    >
      <div className="relative h-44 w-full overflow-hidden">
        <CoverImage post={post} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0620]/60 to-transparent" />
        {isFresh(post.created_at) && (
          <span className="absolute top-3 right-3 glass-chip text-[10.5px] font-bold tracking-[0.14em] uppercase text-primary rounded-full px-2.5 py-1">
            New
          </span>
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <MetaRow post={post} className="mb-3" />
        <h2 className="font-display text-[19px] font-bold text-white group-hover:text-primary transition-colors leading-snug mb-2">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-[14.5px] text-text-muted leading-relaxed flex-1 line-clamp-3">{post.excerpt}</p>
        )}
        <span className="mt-4 text-[14px] font-bold text-primary opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all">
          Read article →
        </span>
      </div>
    </Link>
  );
}

/**
 * Rotating blog showcase: the hero floats through every post one after
 * another (30s each, paused while hovered), and "More from the orbit"
 * always shows the rest. Clicking the hero opens that post.
 */
export default function BlogShowcase({ posts }: { posts: BlogPost[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || posts.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % posts.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, posts.length]);

  if (posts.length === 0) return null;

  const featured = posts[index % posts.length];
  const rest = posts.filter((_, i) => i !== index % posts.length);

  return (
    <>
      <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {/* key remount replays the rise animation, so each post floats in */}
        <div key={featured.slug}>
          <FeaturedPost post={featured} />
        </div>
        {posts.length > 1 && (
          <div className="flex justify-center gap-2 mt-5" role="tablist" aria-label="Featured article">
            {posts.map((p, i) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Feature: ${p.title}`}
                aria-current={i === index % posts.length}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index % posts.length
                    ? 'w-7 bg-primary'
                    : 'w-2 bg-white/20 hover:bg-white/45'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {rest.length > 0 && (
        <BlogRail count={rest.length}>
          {rest.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} />
          ))}
        </BlogRail>
      )}
    </>
  );
}
