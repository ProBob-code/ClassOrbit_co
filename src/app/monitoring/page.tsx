'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Loader2, RefreshCw, Lock, Eye, EyeOff, Users, Globe, Clock,
  MousePointerClick, UserPlus, LogIn, Radio, FileText, BookOpen,
  Monitor, Smartphone, Tablet, Crown, ArrowUpRight, LayoutGrid,
  Activity, Repeat, TrendingDown, Filter, Sparkles,
} from 'lucide-react';

/* ─── Types (shape of POST /api/analytics/stats) ─── */
interface Range { today: number; d7: number; d30: number; total: number }
interface ActiveSession {
  current_path: string; device: string; country: string | null;
  started_at: string; last_seen: string; pageviews: number;
  email: string | null; name: string | null;
}
interface AnalyticsData {
  generated_at: string;
  active_now: number;
  active_sessions: ActiveSession[];
  visitors: Range;
  pageviews: Range;
  sessions_30d: number;
  avg_session_seconds: number;
  total_time_seconds_30d: number;
  avg_pages_per_session: number;
  signups: Range;
  logins: Range;
  google_users: Range;
  google_accounts: { name: string | null; email: string | null; created_at: string; last_login_at: string | null }[];
  bounce_rate_30d: number;
  returning_share_30d: number;
  hourly_24h: { hour: string; views: number; visitors: number }[];
  prompts_daily: { day: string; count: number }[];
  entry_pages: { path: string; sessions: number }[];
  pro_users: number;
  recent_logins: { email: string | null; name: string | null; is_new_user: number; country: string | null; created_at: string }[];
  traffic_daily: { day: string; views: number; visitors: number }[];
  signups_daily: { day: string; count: number }[];
  logins_daily: { day: string; count: number }[];
  top_pages: { path: string; views: number; visitors: number }[];
  blog_views: { title: string; slug: string; views: number; readers: number }[];
  referrers: { referrer: string; views: number }[];
  countries: { country: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  interactions_30d: { prompts: number; tool_launches: number; logins: number };
}

const REFRESH_SECS = 5;

/* ─── Chart palette: validated for CVD + contrast on the dark surface ─── */
const SERIES_AMBER = '#D97706';
const SERIES_SKY = '#0284C7';

/* ─── Formatting helpers ─── */
const num = (n: number) => n.toLocaleString('en-US');

function fmtDuration(sec: number): string {
  if (!sec || sec < 1) return '0s';
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
}

// D1 timestamps are UTC "YYYY-MM-DD HH:MM:SS" without a zone marker.
function parseUTC(ts: string): Date {
  return new Date(ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z');
}

function fmtAgo(ts: string): string {
  const s = Math.max(0, (Date.now() - parseUTC(ts).getTime()) / 1000);
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtWhen(ts: string): string {
  return parseUTC(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function dayLabel(day: string): string {
  return new Date(day + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function hourLabel(hourKey: string): string {
  // hourKey is "YYYY-MM-DDTHH" in UTC; render in the viewer's local time.
  return new Date(hourKey + ':00:00Z').toLocaleTimeString('en-US', { hour: 'numeric' });
}

/** Last `n` UTC dates as YYYY-MM-DD, oldest first (matches SQLite date()). */
function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * 86400_000).toISOString().slice(0, 10));
}

/** Last `n` UTC hour buckets as YYYY-MM-DDTHH, oldest first. */
function lastNHours(n: number): string[] {
  return Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * 3600_000).toISOString().slice(0, 13));
}

function niceMax(v: number): number {
  if (v <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 4, 5, 10]) {
    if (m * pow >= v) return m * pow;
  }
  return 10 * pow;
}

const deviceIcon = (d: string) =>
  d === 'mobile' ? <Smartphone size={13} /> : d === 'tablet' ? <Tablet size={13} /> : <Monitor size={13} />;

/* ─── Stat tile ─── */
function StatTile({ icon, label, value, sub, color = 'amber', live = false }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string; live?: boolean;
}) {
  const colors: Record<string, string> = {
    amber: 'from-amber-500/10 to-amber-500/2 border-amber-500/20 text-amber-400',
    sky: 'from-sky-500/10 to-sky-500/2 border-sky-500/20 text-sky-400',
    emerald: 'from-emerald-500/10 to-emerald-500/2 border-emerald-500/20 text-emerald-400',
    violet: 'from-violet-500/10 to-violet-500/2 border-violet-500/20 text-violet-400',
    rose: 'from-rose-500/10 to-rose-500/2 border-rose-500/20 text-rose-400',
  };
  const cls = colors[color] ?? colors.amber;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${cls.split(' ').slice(0, 3).join(' ')} border rounded-2xl p-4 sm:p-5`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${cls.split(' ')[3]}`}>{icon}</div>
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-tight">{label}</span>
        {live && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-auto shrink-0" />}
      </div>
      <p className="text-[24px] sm:text-[28px] font-extrabold text-text-main leading-none font-display tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-text-muted mt-1.5">{sub}</p>}
    </motion.div>
  );
}

/* ─── Card shell ─── */
// min-w-0 is load-bearing: as a grid child the card defaults to min-width:auto,
// so a wide table inside would stretch the whole page instead of scrolling.
function Card({ title, icon, children, action, className = '' }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-surface/40 border border-border rounded-2xl p-4 sm:p-5 backdrop-blur-md min-w-0 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <h3 className="text-[13px] font-bold text-text-main flex items-center gap-2 min-w-0">
          <span className="text-primary shrink-0">{icon}</span><span className="truncate">{title}</span>
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─── Two-series line chart with crosshair tooltip + data table ─── */
function LineChart({ days, series }: {
  days: string[];
  series: { label: string; color: string; values: number[] }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 760, H = 240, L = 44, R = 100, T = 14, B = 26;
  const iw = W - L - R, ih = H - T - B;
  const n = days.length;
  const max = niceMax(Math.max(1, ...series.flatMap(s => s.values)));
  const x = (i: number) => L + (n <= 1 ? iw / 2 : (i * iw) / (n - 1));
  const y = (v: number) => T + ih - (v / max) * ih;

  const onMove = (e: React.MouseEvent) => {
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - L) / iw) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const ticks = [0.25, 0.5, 0.75, 1].map(f => Math.round(max * f));

  return (
    <div>
      {/* Legend (identity never by color alone: labels sit next to marks) */}
      <div className="flex items-center gap-4 mb-2">
        {series.map(s => (
          <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-text-muted font-semibold">
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.label}
          </span>
        ))}
      </div>
      <div className="relative">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none"
          onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {/* Recessive grid */}
          {ticks.map(t => (
            <g key={t}>
              <line x1={L} y1={y(t)} x2={L + iw} y2={y(t)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={L - 8} y={y(t) + 3} textAnchor="end" className="fill-text-muted" fontSize={10}>{num(t)}</text>
            </g>
          ))}
          <line x1={L} y1={T + ih} x2={L + iw} y2={T + ih} stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
          {/* X labels roughly weekly */}
          {days.map((d, i) => (i % Math.ceil(n / 6) === 0 ? (
            <text key={d} x={x(i)} y={H - 8} textAnchor="middle" className="fill-text-muted" fontSize={10}>{dayLabel(d)}</text>
          ) : null))}
          {/* Crosshair */}
          {hover !== null && (
            <line x1={x(hover)} y1={T} x2={x(hover)} y2={T + ih} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
          )}
          {/* Lines */}
          {series.map(s => (
            <path key={s.label}
              d={s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
              fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {/* Hover markers with a surface ring */}
          {hover !== null && series.map(s => (
            <circle key={s.label} cx={x(hover)} cy={y(s.values[hover])} r={4}
              fill={s.color} stroke="#0B0916" strokeWidth={2} />
          ))}
          {/* Direct labels at line ends (ink text + colored mark) */}
          {series.map((s, si) => (
            <g key={s.label}>
              <circle cx={x(n - 1) + 8} cy={y(s.values[n - 1]) + (si === 0 ? -4 : 4) * (series.length > 1 ? 1 : 0)} r={3} fill={s.color} />
              <text x={x(n - 1) + 15} y={y(s.values[n - 1]) + 3 + (si === 0 ? -4 : 4) * (series.length > 1 ? 1 : 0)}
                className="fill-text-muted" fontSize={10} fontWeight={600}>{s.label}</text>
            </g>
          ))}
        </svg>
        {hover !== null && (
          <div className="absolute pointer-events-none bg-[#161226] border border-border rounded-lg px-3 py-2 text-[11px] shadow-xl z-10"
            style={{ left: `${(x(hover) / W) * 100}%`, top: 0, transform: `translateX(${hover > n * 0.7 ? '-110%' : '10%'})` }}>
            <p className="font-bold text-text-main mb-1">{dayLabel(days[hover])}</p>
            {series.map(s => (
              <p key={s.label} className="flex items-center gap-1.5 text-text-muted">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.label}: <span className="text-text-main font-semibold">{num(s.values[hover])}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      {/* Accessible table view of the same data */}
      <details className="mt-2">
        <summary className="text-[11px] text-text-muted cursor-pointer hover:text-text-main">View data table</summary>
        <div className="overflow-x-auto mt-2 max-h-48 overflow-y-auto">
          <table className="text-[11px] text-text-muted w-full">
            <thead><tr className="text-left">
              <th className="pr-4 py-1 font-semibold">Date</th>
              {series.map(s => <th key={s.label} className="pr-4 py-1 font-semibold">{s.label}</th>)}
            </tr></thead>
            <tbody>
              {days.map((d, i) => (
                <tr key={d} className="border-t border-border/50">
                  <td className="pr-4 py-1">{dayLabel(d)}</td>
                  {series.map(s => <td key={s.label} className="pr-4 py-1">{num(s.values[i])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* ─── Single-series bar chart (small multiple) ─── */
function MiniBars({ labels, values, color, title, wide = false }: {
  labels: string[]; values: number[]; color: string; title: string; wide?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = wide ? 760 : 360, H = wide ? 190 : 150, L = 30, T = 10, B = 22;
  const iw = W - L - 8, ih = H - T - B;
  const n = labels.length;
  const max = niceMax(Math.max(1, ...values));
  const slot = iw / n;
  const bw = Math.max(3, slot - 2); // ≥2px surface gap between bars
  const y = (v: number) => T + ih - (v / max) * ih;

  return (
    <div className="relative">
      <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" onMouseLeave={() => setHover(null)}>
        {[0.5, 1].map(f => (
          <g key={f}>
            <line x1={L} y1={y(max * f)} x2={L + iw} y2={y(max * f)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <text x={L - 6} y={y(max * f) + 3} textAnchor="end" className="fill-text-muted" fontSize={9}>{num(Math.round(max * f))}</text>
          </g>
        ))}
        <line x1={L} y1={T + ih} x2={L + iw} y2={T + ih} stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
        {labels.map((lb, i) => (i % Math.ceil(n / (wide ? 8 : 4)) === 0 ? (
          <text key={i} x={L + i * slot + bw / 2} y={H - 6} textAnchor="middle" className="fill-text-muted" fontSize={9}>{lb}</text>
        ) : null))}
        {values.map((v, i) => (
          <g key={i}>
            {v > 0 && (
              <rect x={L + i * slot} y={y(v)} width={bw} height={Math.max(2, T + ih - y(v))}
                rx={2} fill={color} opacity={hover === null || hover === i ? 1 : 0.45} />
            )}
            {/* full-height hit target, larger than the mark */}
            <rect x={L + i * slot - 1} y={T} width={slot + 2} height={ih} fill="transparent"
              onMouseEnter={() => setHover(i)} />
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="absolute pointer-events-none bg-[#161226] border border-border rounded-lg px-2.5 py-1.5 text-[11px] shadow-xl z-10"
          style={{ left: `${((L + hover * slot) / W) * 100}%`, top: 14, transform: `translateX(${hover > n * 0.6 ? '-110%' : '8%'})` }}>
          <span className="text-text-muted">{labels[hover]}: </span>
          <span className="text-text-main font-semibold">{num(values[hover])}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Ranked list with proportion bars ─── */
function RankList({ rows, unit }: { rows: { label: string; value: number; href?: string }[]; unit: string }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  if (rows.length === 0) return <p className="text-[12px] text-text-muted">No data yet.</p>;
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.label} className="relative rounded-lg overflow-hidden bg-white/[0.02]">
          <div className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${(r.value / max) * 100}%` }} />
          <div className="relative flex items-center justify-between px-3 py-1.5 text-[12px]">
            {r.href ? (
              <a href={r.href} target="_blank" rel="noreferrer" className="text-text-main truncate mr-3 hover:text-primary flex items-center gap-1">
                {r.label}<ArrowUpRight size={11} className="shrink-0 opacity-50" />
              </a>
            ) : (
              <span className="text-text-main truncate mr-3">{r.label}</span>
            )}
            <span className="text-text-muted font-semibold shrink-0">{num(r.value)} {unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Conversion funnel ─── */
function Funnel({ steps }: { steps: { label: string; value: number; icon: React.ReactNode }[] }) {
  const base = Math.max(1, steps[0]?.value ?? 1);
  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const pct = Math.min(100, (s.value / base) * 100);
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between text-[12px] mb-1">
              <span className="flex items-center gap-1.5 text-text-main font-semibold">
                <span className="text-primary">{s.icon}</span>{s.label}
              </span>
              <span className="text-text-muted">
                <span className="text-text-main font-bold">{num(s.value)}</span>
                {i > 0 && <span className="ml-1.5">({base ? ((s.value * 100) / base).toFixed(1) : 0}%)</span>}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-500" style={{ width: `${Math.max(pct, s.value > 0 ? 3 : 0)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Page ─── */
export default function MonitoringPage() {
  // Same admin session as /admin: verify the cookie on mount; if absent show
  // the admin login form (posts to /api/admin/login, which sets the cookie).
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [gateError, setGateError] = useState('');

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [nextIn, setNextIn] = useState(REFRESH_SECS);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/analytics/stats', { method: 'POST' });
      if (res.status === 401) {
        setAuthed(false); // session expired — back to the login form
        return;
      }
      if (!res.ok) throw new Error();
      setData((await res.json()) as AnalyticsData);
    } catch {
      toast.error('Failed to refresh stats');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/admin/verify')
      .then(r => r.json() as Promise<{ valid?: boolean }>)
      .then(d => setAuthed(!!d.valid))
      .catch(() => setAuthed(false));
  }, []);

  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    if (!authed) return;
    loadRef.current();
  }, [authed]);

  const handleLogin = async () => {
    if (!username.trim() || !password) return;
    setUnlocking(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        setGateError('Invalid admin credentials');
        return;
      }
      setGateError('');
      setPassword('');
      setAuthed(true);
    } catch {
      setGateError('Failed to reach the server');
    } finally {
      setUnlocking(false);
    }
  };

  // Live mode: refresh every REFRESH_SECS while the tab is visible, with a
  // visible countdown so it's obvious the numbers are current.
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setNextIn(prev => {
        if (prev <= 1) {
          loadRef.current();
          return REFRESH_SECS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [authed]);

  /* ── Checking the admin session ── */
  if (authed === null || (authed && !data)) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  /* ── Admin login gate ── */
  if (!authed || !data) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-surface/60 border border-border rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-10 h-10 rounded-full bg-surface border border-border overflow-hidden flex items-center justify-center shrink-0">
              <Image src="/logo_transparent.png" alt="ClassOrbit" width={40} height={40} className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-[16px] font-bold text-text-main font-display">Monitoring</h1>
              <p className="text-[11px] text-text-muted">Sign in with your admin account</p>
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setGateError(''); }}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main outline-none focus:border-primary/60 mb-4"
              placeholder="admin"
              autoComplete="username"
              autoFocus
            />
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Lock size={11} /> Password
            </label>
            <div className="relative mb-3">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setGateError(''); }}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 pr-11 text-[14px] text-text-main outline-none focus:border-primary/60"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main cursor-pointer">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {gateError && <p className="text-[12px] text-rose-400 mb-3">{gateError}</p>}
            <button type="submit" disabled={!username.trim() || !password || unlocking}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-[14px] transition-all cursor-pointer flex items-center justify-center gap-2">
              {unlocking ? <Loader2 size={15} className="animate-spin" /> : <Lock size={14} />}
              {unlocking ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  /* ── Dashboard ── */
  const days = lastNDays(30);
  const hours = lastNHours(24);
  const trafficByDay = new Map(data.traffic_daily.map(r => [r.day, r]));
  const signupsByDay = new Map(data.signups_daily.map(r => [r.day, r.count]));
  const loginsByDay = new Map(data.logins_daily.map(r => [r.day, r.count]));
  const promptsByDay = new Map(data.prompts_daily.map(r => [r.day, r.count]));
  const viewsByHour = new Map(data.hourly_24h.map(r => [r.hour, r.views]));
  const visitorSeries = days.map(d => trafficByDay.get(d)?.visitors ?? 0);
  const viewSeries = days.map(d => trafficByDay.get(d)?.views ?? 0);
  const totalInteractions = data.interactions_30d.prompts + data.interactions_30d.tool_launches + data.interactions_30d.logins;

  return (
    <div className="min-h-screen bg-mesh-gradient text-text-main relative selection:bg-primary/30">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[5%] left-[10%] w-[350px] h-[350px] bg-primary opacity-5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] bg-indigo-500 opacity-[0.03] blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#06040F]/70 backdrop-blur-xl border-b border-border">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 sm:h-16 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface border border-border overflow-hidden flex items-center justify-center shrink-0">
                <Image src="/logo_transparent.png" alt="ClassOrbit" width={40} height={40} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[14px] sm:text-[16px] font-bold leading-tight flex items-center gap-1.5 font-display truncate">
                  <span className="truncate">ClassOrbit Monitoring</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
                  </span>
                </h1>
                <p className="text-[10px] sm:text-[11px] text-text-muted truncate">
                  Auto-refreshes every {REFRESH_SECS}s · next in {nextIn}s · updated {fmtAgo(data.generated_at)}
                </p>
              </div>
            </div>
            <button onClick={() => { load(); setNextIn(REFRESH_SECS); }}
              className="flex items-center gap-2 bg-surface hover:bg-background border border-border hover:border-primary/50 text-text-muted hover:text-text-main px-3 sm:px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer shrink-0">
              <RefreshCw size={14} className={`text-primary ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6">
          {/* Audience */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            <StatTile icon={<Radio size={15} />} label="Active Now" value={num(data.active_now)} sub="on the site right now" color="emerald" live />
            <StatTile icon={<Users size={15} />} label="Visitors Today" value={num(data.visitors.today)} sub={`${num(data.pageviews.today)} page views`} color="sky" />
            <StatTile icon={<Users size={15} />} label="Visitors · 30d" value={num(data.visitors.d30)} sub={`${num(data.visitors.d7)} in last 7 days`} color="sky" />
            <StatTile icon={<Eye size={15} />} label="Impressions · 30d" value={num(data.pageviews.d30)} sub={`${num(data.pageviews.total)} all-time`} color="violet" />
            <StatTile icon={<UserPlus size={15} />} label="Signups" value={num(data.signups.total)} sub={`+${num(data.signups.d30)} this month`} color="amber" />
            <StatTile icon={<LogIn size={15} />} label="Google Users · 30d" value={num(data.google_users.d30)} sub={`of ${num(data.google_users.total)} accounts`} color="amber" />
            <StatTile icon={<Crown size={15} />} label="Pro Users" value={num(data.pro_users)} sub="paying subscribers" color="rose" />
            <StatTile icon={<MousePointerClick size={15} />} label="Interactions · 30d" value={num(totalInteractions)} sub={`${num(data.interactions_30d.prompts)} prompts built`} color="emerald" />
          </div>

          {/* Engagement */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatTile icon={<Clock size={15} />} label="Avg Session" value={fmtDuration(data.avg_session_seconds)} sub="time spent per visit (30d)" color="violet" />
            <StatTile icon={<Clock size={15} />} label="Total Time Spent" value={fmtDuration(data.total_time_seconds_30d)} sub="across all visitors (30d)" color="violet" />
            <StatTile icon={<LayoutGrid size={15} />} label="Pages / Session" value={data.avg_pages_per_session} sub={`${num(data.sessions_30d)} sessions (30d)`} color="sky" />
            <StatTile icon={<TrendingDown size={15} />} label="Bounce Rate" value={`${data.bounce_rate_30d}%`} sub="single-page visits (30d)" color="rose" />
            <StatTile icon={<Repeat size={15} />} label="Returning" value={`${data.returning_share_30d}%`} sub="visitors who came back (30d)" color="emerald" />
            <StatTile icon={<Globe size={15} />} label="Countries · 30d" value={num(data.countries.length)} sub={data.countries[0] ? `top: ${data.countries[0].country}` : 'no data yet'} color="emerald" />
          </div>

          {/* Traffic chart + growth small-multiples */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 min-w-0">
              <Card title="Traffic — last 30 days" icon={<Users size={14} />}>
                <LineChart days={days} series={[
                  { label: 'Visitors', color: SERIES_AMBER, values: visitorSeries },
                  { label: 'Page views', color: SERIES_SKY, values: viewSeries },
                ]} />
              </Card>
            </div>
            <Card title="Growth — last 30 days" icon={<UserPlus size={14} />}>
              <div className="space-y-5">
                <MiniBars labels={days.map(dayLabel)} values={days.map(d => signupsByDay.get(d) ?? 0)} color={SERIES_AMBER} title="New signups / day" />
                <MiniBars labels={days.map(dayLabel)} values={days.map(d => loginsByDay.get(d) ?? 0)} color={SERIES_SKY} title="Google logins / day" />
              </div>
            </Card>
          </div>

          {/* Last 24h pulse + funnel + product usage */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 min-w-0">
              <Card title="Activity — last 24 hours" icon={<Activity size={14} />}>
                <MiniBars wide labels={hours.map(hourLabel)} values={hours.map(h => viewsByHour.get(h) ?? 0)} color={SERIES_SKY} title="Page views / hour (your local time)" />
              </Card>
            </div>
            <div className="space-y-4">
              <Card title="Conversion funnel · 30d" icon={<Filter size={14} />}>
                <Funnel steps={[
                  { label: 'Visitors', value: data.visitors.d30, icon: <Users size={13} /> },
                  { label: 'Signed in with Google', value: data.google_users.d30, icon: <LogIn size={13} /> },
                  { label: 'New accounts', value: data.signups.d30, icon: <UserPlus size={13} /> },
                  { label: 'Pro subscribers', value: data.pro_users, icon: <Crown size={13} /> },
                ]} />
              </Card>
              <Card title="Product usage" icon={<Sparkles size={14} />}>
                <MiniBars labels={days.map(dayLabel)} values={days.map(d => promptsByDay.get(d) ?? 0)} color={SERIES_AMBER} title="Prompts built / day" />
              </Card>
            </div>
          </div>

          {/* Live sessions + Google accounts */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title={`Currently viewing (${num(data.active_now)})`} icon={<Radio size={14} />}>
              {data.active_sessions.length === 0 ? (
                <p className="text-[12px] text-text-muted">Nobody on the site in the last 5 minutes.</p>
              ) : (
                <>
                  {/* Phones: one stacked block per visitor — no sideways scrolling. */}
                  <div className="sm:hidden space-y-2">
                    {data.active_sessions.map((s, i) => (
                      <div key={i} className="bg-white/[0.02] border border-border/50 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[12px] font-semibold text-text-main truncate">
                            {s.name || s.email || 'Anonymous'}
                          </span>
                          <span className="text-[11px] text-emerald-400 font-semibold shrink-0">{fmtAgo(s.last_seen)}</span>
                        </div>
                        <p className="text-[12px] text-text-muted truncate mt-1">{s.current_path}</p>
                        <p className="text-[11px] text-text-muted flex items-center gap-2 mt-1.5">
                          <span className="flex items-center gap-1">{deviceIcon(s.device)}{s.device}</span>
                          <span>·</span>
                          <span>{s.country ?? '—'}</span>
                          <span>·</span>
                          <span>{num(s.pageviews)} pages</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                      <thead><tr className="text-text-muted uppercase text-[10px] tracking-wider">
                        <th className="pb-2 pr-3 font-bold">Visitor</th>
                        <th className="pb-2 pr-3 font-bold">Page</th>
                        <th className="pb-2 pr-3 font-bold">Device</th>
                        <th className="pb-2 pr-3 font-bold">Country</th>
                        <th className="pb-2 font-bold whitespace-nowrap">Last seen</th>
                      </tr></thead>
                      <tbody>
                        {data.active_sessions.map((s, i) => (
                          <tr key={i} className="border-t border-border/50">
                            <td className="py-2 pr-3 max-w-[180px] truncate">
                              {s.name || s.email ? (
                                <span className="text-text-main">{s.name ?? s.email}{s.name && s.email ? <span className="text-text-muted"> · {s.email}</span> : null}</span>
                              ) : (
                                <span className="text-text-muted">Anonymous</span>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-text-muted max-w-[140px] truncate">{s.current_path}</td>
                            <td className="py-2 pr-3 text-text-muted"><span className="flex items-center gap-1">{deviceIcon(s.device)}{s.device}</span></td>
                            <td className="py-2 pr-3 text-text-muted">{s.country ?? '—'}</td>
                            <td className="py-2 text-emerald-400 font-semibold whitespace-nowrap">{fmtAgo(s.last_seen)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>

            <Card title="Google accounts" icon={<LogIn size={14} />}
              action={<span className="text-[11px] text-text-muted shrink-0">{num(data.logins.d30)} sign-ins · 30d</span>}>
              {data.google_accounts.length === 0 ? (
                <p className="text-[12px] text-text-muted">No accounts yet.</p>
              ) : (
                <>
                  <div className="sm:hidden space-y-2">
                    {data.google_accounts.map((u, i) => (
                      <div key={i} className="bg-white/[0.02] border border-border/50 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[12px] font-semibold text-text-main truncate">{u.name ?? 'Unknown'}</span>
                          {u.last_login_at && (
                            <span className="text-[11px] text-emerald-400 font-semibold shrink-0">{fmtAgo(u.last_login_at)}</span>
                          )}
                        </div>
                        {u.email && <p className="text-[12px] text-text-muted truncate mt-0.5">{u.email}</p>}
                        <p className="text-[11px] text-text-muted mt-1.5">Joined {fmtWhen(u.created_at)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                      <thead><tr className="text-text-muted uppercase text-[10px] tracking-wider">
                        <th className="pb-2 pr-3 font-bold">User</th>
                        <th className="pb-2 pr-3 font-bold">Joined</th>
                        <th className="pb-2 font-bold">Last login</th>
                      </tr></thead>
                      <tbody>
                        {data.google_accounts.map((u, i) => (
                          <tr key={i} className="border-t border-border/50">
                            <td className="py-2 pr-3 max-w-[220px] truncate">
                              <span className="text-text-main">{u.name ?? 'Unknown'}</span>
                              {u.email && <span className="text-text-muted"> · {u.email}</span>}
                            </td>
                            <td className="py-2 pr-3 text-text-muted whitespace-nowrap">{fmtWhen(u.created_at)}</td>
                            <td className="py-2 text-text-muted whitespace-nowrap">
                              {u.last_login_at ? (
                                <span className="text-emerald-400 font-semibold">{fmtAgo(u.last_login_at)}</span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Content + acquisition breakdowns */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Pages · 30d" icon={<FileText size={14} />}>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Most visited</p>
              <RankList unit="views" rows={data.top_pages.slice(0, 8).map(p => ({ label: p.path, value: p.views }))} />
              {data.entry_pages.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-4 mb-2">Landing pages (session entry)</p>
                  <RankList unit="entries" rows={data.entry_pages.slice(0, 5).map(p => ({ label: p.path, value: p.sessions }))} />
                </>
              )}
            </Card>
            <Card title="Blog views (all-time)" icon={<BookOpen size={14} />}>
              <RankList unit="views" rows={data.blog_views.filter(b => b.views > 0).map(b => ({ label: b.title, value: b.views, href: `/blog/${b.slug}` }))} />
            </Card>
            <Card title="Referrers · 30d" icon={<ArrowUpRight size={14} />}>
              <RankList unit="views" rows={data.referrers.map(r => ({ label: r.referrer, value: r.views }))} />
            </Card>
            <Card title="Audience · 30d" icon={<Globe size={14} />}>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">By country</p>
              <RankList unit="visitors" rows={data.countries.map(cn => ({ label: cn.country, value: cn.visitors }))} />
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-4 mb-2">By device</p>
              <RankList unit="visitors" rows={data.devices.map(d => ({ label: d.device, value: d.visitors }))} />
            </Card>
          </div>

          <p className="text-[11px] text-text-muted pb-6">
            First-party analytics: anonymous visitor ids only, no third-party trackers. Admin and monitoring visits are excluded from every number.
          </p>
        </main>
      </div>
    </div>
  );
}
