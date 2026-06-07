import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDB } from '@/lib/d1';

export const runtime = 'edge';

const FREE_LIMIT = 25;

async function checkAndIncrementUsage(userId: string): Promise<{ allowed: boolean; used: number }> {
  const db = getDB();
  if (!db) return { allowed: true, used: 0 }; // local dev: no limits

  const month = new Date().toISOString().slice(0, 7);

  // Get plan
  const profile = await db.prepare(
    'SELECT plan_type, plan_expires_at FROM user_profiles WHERE user_id = ?'
  ).bind(userId).first<{ plan_type: string; plan_expires_at: string | null }>();

  const plan = profile?.plan_type ?? 'free';
  const expired = plan === 'pro' && profile?.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
  const isPro = (plan === 'pro' || plan === 'school') && !expired;

  if (isPro) {
    // Pro users: increment but don't block
    await db.prepare(
      'INSERT INTO prompt_usage (user_id, month, count) VALUES (?, ?, 1) ON CONFLICT(user_id, month) DO UPDATE SET count = count + 1'
    ).bind(userId, month).run();
    return { allowed: true, used: 0 };
  }

  // Free plan: check limit before incrementing
  const usage = await db.prepare(
    'SELECT count FROM prompt_usage WHERE user_id = ? AND month = ?'
  ).bind(userId, month).first<{ count: number }>();

  const used = usage?.count ?? 0;
  if (used >= FREE_LIMIT) return { allowed: false, used };

  // Under limit — increment
  await db.prepare(
    'INSERT INTO prompt_usage (user_id, month, count) VALUES (?, ?, 1) ON CONFLICT(user_id, month) DO UPDATE SET count = count + 1'
  ).bind(userId, month).run();

  return { allowed: true, used: used + 1 };
}

export async function POST(req: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Plan enforcement
    const { allowed, used } = await checkAndIncrementUsage(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'LIMIT_REACHED', prompts_used: used, prompt_limit: FREE_LIMIT },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { formData } = body;
    if (!formData) return NextResponse.json({ error: 'Missing formData' }, { status: 400 });

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

    if (curriculum) userPrompt += `Curriculum / Board Standard: ${curriculum}\n`;
    if (institution) userPrompt += `Institution / University / City Context: ${institution}\n`;

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
   - Adjust the cognitive complexity of the new questions to match the targeted level: "${studentLevel}".
   - CRITICAL NON-REPETITION CONSTRAINT: Under no circumstances should the target AI repeat any questions verbatim from the attached papers.`;
      }
      userPrompt += `\n`;
    }

    userPrompt += `\nMake sure to format the prompts perfectly according to each tool's limit.\nOutput strictly a valid JSON object matching the schema.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
        max_tokens: 2048,
      }),
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
    } catch {
      resultJson = { prompts: { chatgpt: data.choices[0].message.content.trim() } };
    }

    return NextResponse.json(resultJson);
  } catch (error: any) {
    console.error('Error in /api/groq:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
