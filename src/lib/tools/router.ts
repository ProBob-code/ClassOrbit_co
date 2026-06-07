import toast from 'react-hot-toast';

// Platforms that pre-fill the prompt directly in the URL — no paste needed
const URL_PRELOAD_MAP: Record<string, (prompt: string) => string> = {
  chatgpt: (p) => `https://chatgpt.com/?q=${encodeURIComponent(p.slice(0, 1800))}`,
  claude:  (p) => `https://claude.ai/new?q=${encodeURIComponent(p.slice(0, 1800))}`,
};

const SSO_URLS: Record<string, string> = {
  chatgpt:     'https://chatgpt.com',
  claude:      'https://claude.ai',
  canva:       'https://www.canva.com',
  gamma:       'https://gamma.app',
  notebooklm:  'https://notebooklm.google.com',
  elevenlabs:  'https://elevenlabs.io',
  suno:        'https://suno.com',
  ideogram:    'https://ideogram.ai',
  diffit:      'https://app.diffit.me',
};

function toolKey(toolName: string): string {
  return toolName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Returns true if this platform auto-pastes via URL (no manual Ctrl+V needed). */
export function supportsAutoFill(toolName: string): boolean {
  return toolKey(toolName) in URL_PRELOAD_MAP;
}

export async function launchTool(toolName: string, toolUrl: string, prompt: string) {
  const key = toolKey(toolName);
  const canAutoFill = key in URL_PRELOAD_MAP;

  try {
    // Always copy to clipboard as a reliable fallback
    await navigator.clipboard.writeText(prompt);

    if (canAutoFill) {
      const targetUrl = URL_PRELOAD_MAP[key](prompt);
      toast.success(`Opening ${toolName} with your prompt pre-loaded!`, {
        duration: 3500,
        icon: '✨',
        style: { fontWeight: 600 },
      });
      setTimeout(() => window.open(targetUrl, '_blank'), 300);
    } else {
      const targetUrl = SSO_URLS[key] || toolUrl;
      toast((t) => {
        const el = document.createElement('span');
        el.innerHTML = `<span style="font-weight:700">Opening ${toolName}…</span><br/><span style="font-size:13px;color:#71717A">Prompt copied — press <kbd style="background:#f3f4f6;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:11px">Ctrl+V</kbd> or <kbd style="background:#f3f4f6;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:11px">⌘V</kbd> to paste it.</span>`;
        return el as any;
      }, { duration: 6000, icon: '🚀' });
      setTimeout(() => window.open(targetUrl, '_blank'), 400);
    }
  } catch {
    toast.error('Could not copy prompt — please copy it manually above.');
  }
}
