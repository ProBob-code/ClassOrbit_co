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
      teachingStyles = [],
      studentLevel,
      platformRequirements,
      hasAttachment = false,
      attachedFiles = [],
    } = formData;

    const systemPrompt = `You are an expert curriculum designer and prompt engineer. Your job is to generate a highly optimized LLM prompt that a teacher can copy and paste into an AI (like ChatGPT or Claude) to create their lesson material.`;
    
    let userPrompt = `
Please generate a highly detailed, professional prompt to create a ${contentType}.
Subject: ${subject}
Grade: ${grade}
Topic/Objective: ${topic}
Teaching Styles: ${teachingStyles.join(', ') || 'Standard'}
Student Level (Target Audience): ${studentLevel}
Platform & Formatting Requirements: ${platformRequirements || 'Standard'}
`;

    if (hasAttachment) {
      userPrompt += `
Reference Files Attached: ${attachedFiles.join(', ')}

CRITICAL REQUIREMENT (RAG & Grounding):
The teacher has attached the reference documents/materials listed above. 
The prompt you generate MUST explicitly instruct the target AI (ChatGPT/Claude) to:
1. Act as a strict RAG (Retrieval-Augmented Generation) assistant, grounding all generated content and explanations directly in the reference document content provided at the bottom of the prompt (which the user will paste).
2. Mimic the layout, style, and structure of the reference papers, but apply them to the target grade and subject.
3. If this is a question paper/exam:
   - Carefully analyze the question formats, pattern, marks allocation, and rigor of the attached previous question papers.
   - Adjust the cognitive complexity of the new questions to match the targeted level: "${studentLevel}" (e.g., Weak Students: simplified questions and guiding hints; Average: standard exam rigor; Advanced: high-order critical thinking and complex problem solving; Mixed: balanced distribution of easy, medium, and difficult questions).
   - **CRITICAL NON-REPETITION CONSTRAINT:** Under no circumstances should the target AI repeat any questions verbatim from the attached papers. All questions in the generated ${contentType} must be brand-new, unique, and fresh creations that assess the same skills and topics.
`;
    }

    userPrompt += `
The prompt you generate should instruct the target AI to act as an expert teacher, use the specified teaching styles, and perfectly format the output for the requested platform.
Output ONLY the optimized prompt text. Do not include conversational filler like "Here is the prompt". Just output the raw prompt.
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
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API Error:', errorData);
      return NextResponse.json({ error: 'Failed to generate prompt from Groq' }, { status: response.status });
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content.trim();

    return NextResponse.json({ prompt: generatedPrompt });

  } catch (error: any) {
    console.error('Error in /api/groq:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
