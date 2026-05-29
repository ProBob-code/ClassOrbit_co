import { defaultTools } from '@/data/default-tools';
import { AITool, ToolCategory } from '@/types';

export function getToolsByCategory(category?: ToolCategory): AITool[] {
  if (!category) return defaultTools.filter((t) => t.active);
  return defaultTools.filter((t) => t.active && t.category === category);
}

export function getToolById(id: string): AITool | undefined {
  return defaultTools.find((t) => t.id === id);
}

export function getToolsForContentType(contentType: string): AITool[] {
  return defaultTools.filter(
    (t) => t.active && t.supported_outputs.includes(contentType)
  );
}

export const categoryLabels: Record<ToolCategory, string> = {
  text: 'Text Generation',
  visual: 'Visual Design',
  presentation: 'Presentations',
  audio: 'Audio',
  video: 'Video',
  research: 'Research',
  image: 'Image Generation',
};

export const categoryIcons: Record<ToolCategory, string> = {
  text: 'edit_note',
  visual: 'palette',
  presentation: 'slideshow',
  audio: 'music_note',
  video: 'videocam',
  research: 'search',
  image: 'image',
};
