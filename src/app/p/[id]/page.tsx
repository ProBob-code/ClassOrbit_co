import type { Metadata } from 'next';
import Link from 'next/link';
import { Copy, ExternalLink } from 'lucide-react';

export const runtime = 'edge';
interface Props {
  params: Promise<{ id: string }>;
}

async function getShare(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://classorbit.co';
    const res = await fetch(`${baseUrl}/api/share?id=${id}`, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const share = await getShare(id);
  if (!share) return { title: 'Shared Prompt | ClassOrbit' };
  return {
    title: `${share.topic || 'Shared Prompt'} | ClassOrbit`,
    description: `A ${share.content_type || 'teaching'} prompt for ${share.grade || 'educators'} — built with ClassOrbit and optimized for ${share.tool_name}.`,
  };
}

export default async function SharedPromptPage({ params }: Props) {
  const { id } = await params;
  const share = await getShare(id);

  if (!share) {
    return (
      <main className="min-h-screen bg-mesh-gradient flex items-center justify-center px-4">
        <div className="text-center glass-panel rounded-[28px] p-12 max-w-md">
          <p className="text-6xl mb-6">🔍</p>
          <h1 className="font-display text-2xl font-bold text-white mb-3">Prompt not found</h1>
          <p className="text-text-muted mb-8">This shared prompt may have been removed or the link is incorrect.</p>
          <Link href="/" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors">
            Build Your Own Prompt →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mesh-gradient py-16 px-4 font-body">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <img src="/logo_transparent.png" alt="ClassOrbit" className="w-8 h-8 object-contain" />
            <span className="text-xl font-extrabold text-white">Class<span className="text-primary">Orbit</span></span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            {share.content_type && <span className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold uppercase">{share.content_type}</span>}
            {share.grade && <span className="text-[11px] bg-white/5 text-text-muted border border-border px-2.5 py-0.5 rounded-full font-medium">{share.grade}</span>}
            {share.subject && <span className="text-[11px] bg-white/5 text-text-muted border border-border px-2.5 py-0.5 rounded-full font-medium">{share.subject}</span>}
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white leading-tight">
            {share.topic || 'Shared Teaching Prompt'}
          </h1>
          <p className="text-text-muted text-sm mt-2">Optimized for <strong className="text-text-main">{share.tool_name}</strong> · Shared via ClassOrbit</p>
        </div>

        {/* Prompt box */}
        <div className="glass-panel rounded-[24px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              {share.tool_name && (
                <img src={`https://www.google.com/s2/favicons?sz=64&domain=${share.tool_url}`} alt={share.tool_name} className="w-5 h-5 rounded-sm" onError={() => {}} />
              )}
              <span className="text-sm font-bold text-text-main">Prompt for {share.tool_name}</span>
            </div>
            <span className="text-[11px] text-text-subtle font-mono">{share.prompt_text?.split(/\s+/).filter(Boolean).length ?? 0} words</span>
          </div>
          <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
            <pre className="text-[13px] font-mono text-text-muted whitespace-pre-wrap break-words leading-relaxed">
              {share.prompt_text}
            </pre>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigator.clipboard.writeText(share.prompt_text)}
            className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-primary/50 transition-all cursor-pointer"
          >
            <Copy size={18} className="text-primary shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold text-text-main">Copy Prompt</p>
              <p className="text-[11px] text-text-muted">Copy to clipboard</p>
            </div>
          </button>
          <a
            href={share.tool_url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-primary/50 transition-all"
          >
            <ExternalLink size={18} className="text-primary shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold text-text-main">Open {share.tool_name}</p>
              <p className="text-[11px] text-text-muted">Paste and run this prompt</p>
            </div>
          </a>
        </div>

        {/* CTA */}
        <div className="glass-panel rounded-[24px] p-7 text-center border border-primary/20">
          <p className="text-white font-bold text-lg mb-2">Build your own prompts like this — free</p>
          <p className="text-text-muted text-sm mb-5">ClassOrbit generates platform-optimized prompts for any lesson, quiz, or worksheet in seconds.</p>
          <Link href="/login?next=/builder" className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-full font-bold hover:bg-primary-hover transition-all shadow-glow">
            Get Started Free →
          </Link>
          <p className="text-[12px] text-text-subtle mt-3">No credit card required · Free tier available</p>
        </div>
      </div>
    </main>
  );
}
