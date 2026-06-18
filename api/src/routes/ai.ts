import { Hono, type Context } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/d1';
import { getSupabase } from '../lib/supabase';
import { getMockChatbotReply } from '../lib/support-ai-fallback';
import { CHATBOT_SYSTEM_PROMPT } from '../lib/ai-prompts';

const router = new Hono<AppEnv>();

const FREE_LIMIT = 25;

async function checkAndIncrementUsage(c: Context<AppEnv>, userId: string): Promise<{ allowed: boolean; used: number }> {
  const db = getDB(c);
  const month = new Date().toISOString().slice(0, 7);

  const profile = await db.prepare(
    'SELECT plan_type, plan_expires_at FROM user_profiles WHERE user_id = ?'
  ).bind(userId).first<{ plan_type: string; plan_expires_at: string | null }>();

  const plan = profile?.plan_type ?? 'free';
  const expired = plan === 'pro' && profile?.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
  const isPro = (plan === 'pro' || plan === 'school') && !expired;

  if (isPro) {
    await db.prepare(
      'INSERT INTO prompt_usage (user_id, month, count) VALUES (?, ?, 1) ON CONFLICT(user_id, month) DO UPDATE SET count = count + 1'
    ).bind(userId, month).run();
    return { allowed: true, used: 0 };
  }

  const usage = await db.prepare(
    'SELECT count FROM prompt_usage WHERE user_id = ? AND month = ?'
  ).bind(userId, month).first<{ count: number }>();

  const used = usage?.count ?? 0;
  if (used >= FREE_LIMIT) return { allowed: false, used };

  await db.prepare(
    'INSERT INTO prompt_usage (user_id, month, count) VALUES (?, ?, 1) ON CONFLICT(user_id, month) DO UPDATE SET count = count + 1'
  ).bind(userId, month).run();

  return { allowed: true, used: used + 1 };
}

router.post('/groq', async (c) => {
  try {
    const supabase = getSupabase(c);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { allowed, used } = await checkAndIncrementUsage(c, user.id);
    if (!allowed) {
      return c.json(
        { error: 'LIMIT_REACHED', prompts_used: used, prompt_limit: FREE_LIMIT },
        403
      );
    }

    const body = await c.req.json();
    const { formData } = body;
    if (!formData) return c.json({ error: 'Missing formData' }, 400);

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
        Authorization: `Bearer ${c.env.GROQ_API_KEY}`,
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
      return c.json({ error: 'Failed to generate prompt from Groq' }, response.status as any);
    }

    const data = await response.json() as any;
    let resultJson: any = {};
    try {
      resultJson = JSON.parse(data.choices[0].message.content.trim());
    } catch {
      resultJson = { prompts: { chatgpt: data.choices[0].message.content.trim() } };
    }

    return c.json(resultJson);
  } catch (error: any) {
    console.error('Error in /api/groq:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

router.post('/support/chat', async (c) => {
  try {
    const body = await c.req.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
    ];

    for (const msg of conversationHistory.slice(-10)) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
    }

    messages.push({ role: 'user', content: message.trim() });

    const apiKey = c.env.GROQ_API_KEY;
    const isPlaceholder = !apiKey || apiKey.startsWith('your_') || apiKey === 'your_groq_api_key_here';

    if (isPlaceholder) {
      return c.json(getMockChatbotReply(message));
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      return c.json(getMockChatbotReply(message));
    }

    const data = await response.json() as any;
    const rawContent = data.choices?.[0]?.message?.content?.trim() || '';

    let parsed: { reply: string; resolved: boolean; confidence: string };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = {
        reply: rawContent || "I'm sorry, I couldn't process that. Could you try rephrasing?",
        resolved: true,
        confidence: 'medium',
      };
    }

    return c.json({
      reply: parsed.reply,
      resolved: parsed.resolved ?? true,
      confidence: parsed.confidence ?? 'medium',
    });
  } catch (error: any) {
    console.error('Error in /api/support/chat:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export default router;
