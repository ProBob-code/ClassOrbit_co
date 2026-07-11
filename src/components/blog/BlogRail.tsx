'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Horizontal snap-scroll rail for blog cards. Cards are server-rendered and
 * passed in as children; this component only owns the scroll chrome
 * (arrows, edge fades, drag-to-scroll, progress thumb).
 */
export default function BlogRail({ count, children }: { count: number; children: React.ReactNode }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  // Mini-scrollbar geometry, as fractions of the track
  const [thumb, setThumb] = useState({ size: 1, offset: 0 });

  const update = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft > max - 8);
    const size = el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1;
    const progress = max > 0 ? el.scrollLeft / max : 0;
    setThumb({ size, offset: progress * (1 - size) });
  }, []);

  useEffect(() => {
    update();
    const el = railRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const nudge = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: 'smooth' });
  };

  // Drag-to-scroll for mouse users; touch devices scroll natively.
  const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = railRef.current;
    if (!el) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = railRef.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 6) d.moved = true;
    if (d.moved) el.scrollLeft = d.startLeft - dx;
  };

  const onPointerUp = () => {
    drag.current.active = false;
  };

  // A drag that moved should not also fire the card's link
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <section aria-label="More articles">
      <div className="flex items-center gap-4 mt-16 mb-8 blog-rise" style={{ '--rise-delay': '150ms' } as React.CSSProperties}>
        <h2 className="font-display text-[22px] font-bold text-white whitespace-nowrap">More from the orbit</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/40 via-border to-transparent" />
        <span className="hidden sm:inline text-[13px] text-text-subtle whitespace-nowrap">
          {count} {count === 1 ? 'article' : 'articles'}
        </span>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={atStart}
            aria-label="Scroll articles left"
            className="w-9 h-9 rounded-full glass-chip flex items-center justify-center text-white transition-all hover:border-primary/60 hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            disabled={atEnd}
            aria-label="Scroll articles right"
            className="w-9 h-9 rounded-full glass-chip flex items-center justify-center text-white transition-all hover:border-primary/60 hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
          >
            →
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          onScroll={update}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onClickCapture={onClickCapture}
          onDragStart={(e) => e.preventDefault()}
          className="blog-rail flex gap-5 overflow-x-auto snap-x snap-proximity pt-3 -mt-3 px-1 -mx-1 pb-4 cursor-grab active:cursor-grabbing select-none"
        >
          {children}
        </div>
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 -left-1 w-14 bg-gradient-to-r from-[#080314]/85 to-transparent transition-opacity duration-300 ${atStart ? 'opacity-0' : 'opacity-100'}`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 -right-1 w-14 bg-gradient-to-l from-[#080314]/85 to-transparent transition-opacity duration-300 ${atEnd ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>

      {thumb.size < 0.999 && (
        <div className="mt-6 mx-auto h-1 w-44 rounded-full bg-white/10" aria-hidden>
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-hover"
            style={{ width: `${thumb.size * 100}%`, marginLeft: `${thumb.offset * 100}%` }}
          />
        </div>
      )}
    </section>
  );
}
