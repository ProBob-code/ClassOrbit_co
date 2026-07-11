'use client';

// Sticky "On this page" navigation for blog posts. Highlights the section
// currently in view and smooth-scrolls to headings rendered by BlogContent.

import { useEffect, useState } from 'react';
import type { BlogHeading } from './BlogContent';

export default function TocNav({ headings }: { headings: BlogHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      // Treat a heading as "active" while it sits in the upper part of the viewport.
      { rootMargin: '-15% 0px -70% 0px' }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents">
      <p className="text-[11px] font-bold text-text-subtle uppercase tracking-[0.18em] mb-4">On this page</p>
      <ul className="space-y-1 border-l border-border">
        {headings.map((h) => {
          const active = h.id === activeId;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`block py-1.5 pr-2 text-[13px] leading-snug border-l-2 -ml-px transition-colors ${
                  h.level === 3 ? 'pl-7' : 'pl-4'
                } ${
                  active
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-text-muted hover:text-white hover:border-border'
                }`}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
