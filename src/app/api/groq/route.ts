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
    } = formData;

    const systemPrompt = `You are an expert curriculum designer and prompt engineer. Your job is to generate a highly optimized LLM prompt that a teacher can copy and paste into an AI (like ChatGPT or Claude) to create their lesson material.`;
    
    const userPrompt = `
Please generate a highly detailed, professional prompt to create a ${contentType}.
Subject: ${subject}
Grade: ${grade}
Topic/Objective: ${topic}
Teaching Styles: ${teachingStyles.join(', ') || 'Standard'}
Student Level: ${studentLevel}
Platform & Formatting Requirements: ${platformRequirements || 'Standard'}

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
