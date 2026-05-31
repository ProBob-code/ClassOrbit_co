import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formData } = body;

    if (!formData) {
      return NextResponse.json({ error: 'Missing formData' }, { status: 400 });
    }

    const {
      contentType,
      grade,
      subject,
      topic,
      studentLevel,
      curriculum = '',
      institution = '',
      hasAttachment = false,
      attachedFiles = [],
      selectedTools = ['chatgpt', 'claude'],
    } = formData;

    const systemPrompt = `You are an expert curriculum designer and prompt engineer. Your job is to generate highly optimized, platform-specific LLM prompts for different AI tools.
You MUST return your output as a strictly valid JSON object matching this exact TypeScript structure:
{
  "prompts": {
    [toolId: string]: string
  }
}

Customize the prompt generated for each requested tool in "selectedTools" based on the platform's specific text/word boundaries:
1. 'chatgpt' / 'claude': Full-fidelity, extensive educational prompts with high pedagogical rigor, detailed steps, and clear structure.
2. 'canva': Layout-focused design blueprint prompt with visually friendly elements. Must be under 1000 characters.
3. 'gamma': Structured, slide-by-slide outline format (max 8-10 slides) with slide titles and brief slide content guidelines. Under 1200 characters.
4. 'notebooklm': Structured synthesis queries, notes consolidation guidelines, and study guide research questions.
5. 'suno': Strictly under 600 characters. Return a clean "Style of Music" tag block (e.g., upbeat pop, catchy children's vocals, acoustic) followed by 2 very short, catchy educational verses and a simple chorus.
6. 'elevenlabs': Strictly under 1200 characters. Return a PURE narrative spoken voice script for reading (NO markdown headings, NO bullet points, NO prompt commands, just pure spoken speech text).
7. 'ideogram': Strictly under 500 characters. Return a highly descriptive, visual-only text-to-image graphic prompt describing a crisp educational diagram, visual poster, or educational vector artwork. No conversational text.

Return ONLY a valid JSON object. Do not include markdown wrappers like \`\`\`json or raw text before or after the JSON.`;
    
    let userPrompt = `
Please generate optimized prompts for the following target tools: ${selectedTools.join(', ')}.
Content Type: ${contentType}
Subject: ${subject}
Grade/Audience: ${grade}
Topic/Objective: ${topic}
Target Difficulty Target: ${studentLevel}
`;

    if (curriculum) {
      userPrompt += `Curriculum / Board Standard: ${curriculum}\n`;
    }
    if (institution) {
      userPrompt += `Institution / University / City Context: ${institution}\n`;
    }

    if (hasAttachment) {
      userPrompt += `
Reference Files Attached: ${attachedFiles.join(', ')}

CRITICAL REQUIREMENT (RAG & Grounding):
The prompts you generate MUST explicitly command the target AI assistant to:
1. Act as a strict RAG (Retrieval-Augmented Generation) assistant, grounding all generated explanations and facts strictly in the reference documents/materials provided at the bottom of the prompt (which the user will paste).
2. Mimic the layout, style, and structure of the reference papers, but apply them to the target grade and subject.`;

      if (contentType === 'question_paper') {
        userPrompt += `
3. For this question paper/exam:
   - Carefully analyze the question formats, pattern, marks allocation, and rigor of the attached previous question papers.
   - Adjust the cognitive complexity of the new questions to match the targeted level: "${studentLevel}" (e.g., Weak Students: simplified questions and guiding hints; Average: standard exam rigor; Advanced: high-order critical thinking and complex problem solving; Mixed: balanced distribution of easy, medium, and difficult questions).
   - **CRITICAL NON-REPETITION CONSTRAINT:** Under no circumstances should the target AI repeat any questions verbatim from the attached papers. All questions must be brand-new, unique, and fresh creations that assess the same skills and topics.`;
      }
      userPrompt += `\n`;
    }

    userPrompt += `
Make sure to format the prompts perfectly according to each tool's limit.
Output strictly a valid JSON object matching the schema.
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API Error:', errorData);
      return NextResponse.json({ error: 'Failed to generate prompt from Groq' }, { status: response.status });
    }

    const data = await response.json();
    let resultJson: any = {};
    try {
      resultJson = JSON.parse(data.choices[0].message.content.trim());
    } catch (e) {
      console.error('Failed to parse Groq response as JSON:', data.choices[0].message.content);
      // Fallback
      resultJson = { prompts: { chatgpt: data.choices[0].message.content.trim() } };
    }

    return NextResponse.json(resultJson);

  } catch (error: any) {
    console.error('Error in /api/groq:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
