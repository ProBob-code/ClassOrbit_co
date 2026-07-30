'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// First-party analytics beacon (feeds the /monitoring page — no third-party
// script, no cookies). Sends a page view on every route change and a heartbeat
// every 60s while the tab is visible so the worker can keep the session's
// last_seen fresh ("active now" + time-spent stats).

const HEARTBEAT_MS = 60_000;

function visitorId(): string {
  try {
    let vid = localStorage.getItem('co_vid');
    if (!vid || !/^[A-Za-z0-9_-]{8,64}$/.test(vid)) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      vid = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('co_vid', vid);
    }
    return vid;
  } catch {
    return ''; // storage blocked — skip tracking rather than inflate visitor counts
  }
}

function externalReferrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const host = new URL(document.referrer).hostname;
    return host && host !== location.hostname ? host : null;
  } catch {
    return null;
  }
}

function send(body: { vid: string; path: string; ref?: string | null; beat?: boolean }) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

export default function AnalyticsBeacon() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    // Never count the operator's own admin/monitoring visits.
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/monitoring')) return;
    const vid = visitorId();
    if (!vid) return;

    if (lastTracked.current !== pathname) {
      lastTracked.current = pathname;
      send({ vid, path: pathname, ref: externalReferrerHost() });
    }

    const beat = () => {
      if (document.visibilityState === 'visible') send({ vid, path: pathname, beat: true });
    };
    const interval = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
