import { NextResponse } from 'next/server';
import { getDB } from '@/lib/d1';
import { isAdminRequest } from '@/lib/admin-auth';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getMockAiAgentReply } from '@/lib/support-ai-fallback';
import { TICKET_AI_SYSTEM_PROMPT } from '@/lib/ai-prompts';

export const runtime = 'edge';

function getJwtSecret(): string {
  try {
    const { env } = getRequestContext();
    return ((env as Record<string, string>).ADMIN_JWT_SECRET) || process.env.ADMIN_JWT_SECRET || 'dev_secret';
  } catch {
    return process.env.ADMIN_JWT_SECRET || 'dev_secret';
  }
}

function getGroqApiKey(): string {
  try {
    const { env } = getRequestContext();
    return (env as Record<string, string>).GROQ_API_KEY || process.env.GROQ_API_KEY || '';
  } catch {
    return process.env.GROQ_API_KEY || '';
  }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const ticketId = params.id;

  // Admin-only endpoint
  const secret = getJwtSecret();
  if (!(await isAdminRequest(req, secret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDB();
    if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

    // 1. Update D1 status
    await db.prepare(
      "UPDATE support_tickets SET chat_status = 'ai_agent_active', assigned_to = 'ai_agent' WHERE id = ?"
    ).bind(ticketId).run();

    // 2. Read the original ticket message + full conversation history
    const ticket = await db.prepare(
      'SELECT message FROM support_tickets WHERE id = ?'
    ).bind(ticketId).first<{ message: string }>();
    const initialUserMsg = ticket?.message || '';

    const { results: messagesRaw } = await db.prepare(
      'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC'
    ).bind(ticketId).all<any>();

    const sortedMessages = messagesRaw || [];

    // 3. Build Groq messages — include ALL context (admin messages too)
    const groqMessages: { role: string; content: string }[] = [
      { role: 'system', content: TICKET_AI_SYSTEM_PROMPT },
    ];

    // If there are existing messages, include them all for context
    if (sortedMessages.length > 0) {
      for (const msg of sortedMessages) {
        if (msg.type === 'system') continue;
        // Admin messages are context too — treat as assistant so the AI knows what was discussed
        groqMessages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.sender === 'admin'
            ? `[Admin said]: ${msg.text}`
            : msg.text,
        });
      }
    } else if (initialUserMsg) {
      groqMessages.push({
        role: 'user',
        content: initialUserMsg,
      });
    }

    // Final user-role instruction to trigger the AI's first response
    groqMessages.push({
      role: 'user',
      content: 'Please help me with my issue based on our conversation so far.',
    });

    const apiKey = getGroqApiKey();
    const isPlaceholder = !apiKey || apiKey.startsWith('your_') || apiKey === 'your_groq_api_key_here';

    let aiReply = "I've reviewed your conversation and I'm here to help. Could you tell me a bit more about what you're experiencing?";

    if (isPlaceholder) {
      aiReply = getMockAiAgentReply(initialUserMsg || 'hello');
    } else {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.4,
            max_tokens: 1024,
          }),
        });

        if (!groqResponse.ok) {
          console.error('Groq AI agent error:', await groqResponse.text());
          aiReply = getMockAiAgentReply(initialUserMsg || 'hello');
        } else {
          const groqData = await groqResponse.json();
          aiReply = groqData.choices?.[0]?.message?.content?.trim() || aiReply;
        }
      } catch (groqError) {
        console.error('Groq fetch failed:', groqError);
        aiReply = getMockAiAgentReply(initialUserMsg || 'hello');
      }
    }

    // 4. Push AI response to D1
    const aiMsgId = 'msg_' + Date.now();
    await db.prepare(
      'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text) VALUES (?, ?, ?, ?, ?)'
    ).bind(aiMsgId, ticketId, 'ai_agent', 'AI Support Agent', aiReply).run();

    return NextResponse.json({ success: true, reply: aiReply });
  } catch (error: any) {
    console.error('Failed to assign AI agent:', error);
    return NextResponse.json({ error: 'Failed to assign AI agent' }, { status: 500 });
  }
}
