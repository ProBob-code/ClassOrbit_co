import { TeacherInput } from '@/types';

const styleModifiers: Record<string, string> = {
  fun: '\n\nMake the content light-hearted and entertaining. Use humor, fun facts, and surprising examples to maintain engagement.',
  interactive: '\n\nInclude discussion questions, think-pair-share activities, and opportunities for student dialogue throughout.',
  story_based: '\n\nFrame the content within a narrative structure. Use storytelling techniques, characters, or real-world scenarios to make concepts relatable.',
  visual_learning: '\n\nInclude suggestions for diagrams, charts, infographics, and visual aids. Describe any visuals that should accompany the content.',
  gamified: '\n\nIncorporate game elements: points, challenges, levels, or competition formats. Make learning feel like play.',
  exam_focused: '\n\nAlign content with common exam formats. Include practice questions, mark schemes, and exam-style exercises.',
  beginner_friendly: '\n\nUse simple language and build concepts step by step. Avoid jargon and provide definitions for technical terms.',
  activity_based: '\n\nInclude hands-on activities, experiments, projects, or physical tasks that reinforce learning through doing.',
};

const levelModifiers: Record<string, string> = {
  weak: '\n\nSimplify language and concepts. Use scaffolding techniques, provide extra examples, and include fill-in-the-blank or guided response formats to build confidence.',
  average: '\n\nBalance challenge and support. Include a mix of straightforward and moderately challenging content.',
  advanced: '\n\nInclude higher-order thinking questions, extension activities, and opportunities for critical analysis and independent exploration.',
  mixed: '\n\nProvide differentiated content with tiered activities. Include easier warm-up tasks, core content, and challenge extensions for different ability levels.',
};

export function optimizePrompt(basePrompt: string, input: TeacherInput, toolId: string): string {
  let optimized = basePrompt;

  // Add teaching style modifiers
  for (const style of input.teachingStyles) {
    const modifier = styleModifiers[style];
    if (modifier) {
      optimized += modifier;
    }
  }

  // Add level modifier
  const levelMod = levelModifiers[input.studentLevel];
  if (levelMod) {
    optimized += levelMod;
  }

  // Add duration constraint
  if (input.duration) {
    optimized += `\n\nIMPORTANT: The total content should be appropriate for a ${input.duration} session.`;
  }

  // Tool-specific formatting hints
  if (toolId === 'canva' || toolId === 'gamma') {
    optimized += '\n\nKeep text concise and visual-friendly. Use bullet points over paragraphs.';
  }

  if (toolId === 'chatgpt' || toolId === 'claude') {
    optimized += '\n\nFormat the output using markdown with clear headings, numbered lists, and tables where appropriate.';
  }

  return optimized;
}
