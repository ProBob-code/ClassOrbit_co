import { TeacherInput } from '@/types';

const templates: Record<string, (input: TeacherInput) => string> = {
  chatgpt: (input) =>
    `You are an expert educational content creator. Create a ${input.contentType.replace(/_/g, ' ')} for ${input.grade} students studying ${input.subject} on the topic of "${input.topic}".

Requirements:
- Student Level: ${input.studentLevel}
- Duration: ${input.duration}
- Teaching Styles: ${input.teachingStyles.join(', ')}

Please create a comprehensive, well-structured ${input.contentType.replace(/_/g, ' ')} that:
1. Is age-appropriate for ${input.grade} students
2. Covers key concepts of "${input.topic}" thoroughly
3. Includes clear instructions and learning objectives
4. Provides an answer key or rubric where applicable
5. Uses accessible yet accurate language

Format the output with clear headings, numbered sections, and proper formatting.`,

  claude: (input) =>
    `I need you to create a detailed ${input.contentType.replace(/_/g, ' ')} for a ${input.grade} ${input.subject} class. The topic is "${input.topic}".

Context:
- This is for ${input.studentLevel} students
- The session should fit within ${input.duration}
- Preferred teaching approach: ${input.teachingStyles.join(', ')}

Please structure your response with:
1. Learning objectives (2-3 clear, measurable goals)
2. Main content (the ${input.contentType.replace(/_/g, ' ')} itself)
3. Assessment criteria or answer key
4. Extension activities for early finishers
5. Differentiation suggestions

Use a warm, encouraging tone suitable for educators. Be specific and practical.`,

  canva: (input) =>
    `Design a visually appealing ${input.contentType.replace(/_/g, ' ')} for ${input.grade} ${input.subject} about "${input.topic}".

Design requirements:
- Use bright, engaging colors appropriate for ${input.grade} students
- Include clear headings and organized sections
- Add relevant icons or illustrations
- Make text readable with appropriate font sizes
- Teaching style emphasis: ${input.teachingStyles.join(', ')}
- Duration context: ${input.duration}
- Student level: ${input.studentLevel}

The layout should be clean, professional, and education-friendly.`,

  gamma: (input) =>
    `Create a presentation about "${input.topic}" for ${input.grade} ${input.subject} class.

Slide structure:
1. Title slide with topic and grade level
2. Learning objectives (2-3 key goals)
3-8. Content slides covering main concepts
9. Interactive activity or discussion prompt
10. Summary and key takeaways

Guidelines:
- Student level: ${input.studentLevel}
- Teaching approach: ${input.teachingStyles.join(', ')}
- Time frame: ${input.duration}
- Keep text concise - use bullet points
- Suggest relevant images for each slide`,

  notebooklm: (input) =>
    `Research and compile comprehensive notes on "${input.topic}" for a ${input.grade} ${input.subject} class.

I need:
1. Key concepts and definitions
2. Important facts and figures
3. Common misconceptions students have
4. Real-world applications and examples
5. Connections to other topics in ${input.subject}

Context: This is for ${input.studentLevel} students with a ${input.duration} session. The teaching approach emphasizes ${input.teachingStyles.join(', ')}.

Please organize the information in a way that's easy for a teacher to reference during lesson planning.`,

  suno: (input) =>
    `Create an educational song about "${input.topic}" for ${input.grade} ${input.subject} students.

The song should:
- Be catchy and memorable for ${input.grade} students
- Cover key facts about "${input.topic}"
- Use simple, age-appropriate vocabulary
- Be suitable for a ${input.duration} activity
- Incorporate ${input.teachingStyles.join(', ')} elements
- Student level: ${input.studentLevel}`,

  elevenlabs: (input) =>
    `Create a narration script about "${input.topic}" for ${input.grade} ${input.subject}.

Requirements:
- Clear, engaging narration suitable for ${input.studentLevel} students
- Duration: approximately ${input.duration}
- Tone: educational yet captivating
- Teaching approach: ${input.teachingStyles.join(', ')}
- Include pauses for reflection and key emphasis points`,

  ideogram: (input) =>
    `Create an educational illustration or diagram about "${input.topic}" for ${input.grade} ${input.subject}.

Visual requirements:
- Clear, labeled diagram suitable for ${input.grade} students
- Use colors and symbols appropriate for ${input.studentLevel} learners
- Include key terms and concepts
- Style: clean, educational poster format
- Teaching emphasis: ${input.teachingStyles.join(', ')}`,
};

export function getToolTemplate(toolId: string, input: TeacherInput): string {
  const templateFn = templates[toolId];
  if (!templateFn) {
    return `Create a ${input.contentType.replace(/_/g, ' ')} for ${input.grade} ${input.subject} about "${input.topic}". Student level: ${input.studentLevel}. Duration: ${input.duration}. Teaching styles: ${input.teachingStyles.join(', ')}.`;
  }
  return templateFn(input);
}
