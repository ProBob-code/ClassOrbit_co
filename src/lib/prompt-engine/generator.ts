import { TeacherInput, ToolPrompts } from '@/types';
import { defaultTools } from '@/data/default-tools';
import { getToolTemplate } from './templates';
import { optimizePrompt } from './optimizer';

export function generatePrompts(input: TeacherInput): ToolPrompts {
  const prompts: ToolPrompts = {};

  const selectedToolData = defaultTools.filter((tool) =>
    input.selectedTools.includes(tool.id)
  );

  for (const tool of selectedToolData) {
    const template = getToolTemplate(tool.id, input);
    const optimized = optimizePrompt(template, input, tool.id);

    prompts[tool.id] = {
      toolName: tool.tool_name,
      toolUrl: tool.tool_url,
      toolLogo: tool.tool_logo,
      prompt: optimized,
      category: tool.category,
    };
  }

  return prompts;
}
