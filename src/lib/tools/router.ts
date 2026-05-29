import toast from 'react-hot-toast';

export async function launchTool(toolName: string, toolUrl: string, prompt: string) {
  try {
    await navigator.clipboard.writeText(prompt);
    toast.success(`Prompt copied! Opening ${toolName}...`, {
      duration: 3000,
      icon: '🚀',
    });
    setTimeout(() => {
      window.open(toolUrl, '_blank');
    }, 500);
  } catch {
    toast.error('Failed to copy prompt. Please copy manually.');
  }
}
