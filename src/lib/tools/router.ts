import toast from 'react-hot-toast';

const getGoogleSsoUrl = (toolName: string, defaultUrl: string): string => {
  const ssoUrls: Record<string, string> = {
    chatgpt: 'https://chatgpt.com',
    claude: 'https://claude.ai',
    canva: 'https://www.canva.com',
    gamma: 'https://gamma.app',
    notebooklm: 'https://notebooklm.google.com',
    elevenlabs: 'https://elevenlabs.io',
    suno: 'https://suno.com',
    ideogram: 'https://ideogram.ai',
    diffit: 'https://app.diffit.me',
  };
  const cleanId = toolName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ssoUrls[cleanId] || defaultUrl;
};

export async function launchTool(toolName: string, toolUrl: string, prompt: string) {
  try {
    await navigator.clipboard.writeText(prompt);
    toast.success(`Prompt copied! Opening ${toolName}...`, {
      duration: 3000,
      icon: '🚀',
    });
    
    const targetUrl = getGoogleSsoUrl(toolName, toolUrl);
    
    setTimeout(() => {
      window.open(targetUrl, '_blank');
    }, 500);
  } catch {
    toast.error('Failed to copy prompt. Please copy manually.');
  }
}
