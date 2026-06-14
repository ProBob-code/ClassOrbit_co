import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDB, nanoid } from '@/lib/d1';
import { getMockAiAgentReply } from '@/lib/support-ai-fallback';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { TICKET_AI_SYSTEM_PROMPT } from '@/lib/ai-prompts';

export const runtime = 'edge';

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

  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  // Auth check — user must be authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { userMessage } = body;

  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    // Verify the ticket is in ai_agent_active mode
    const ticket = await db.prepare('SELECT user_id, user_name, chat_status FROM support_tickets WHERE id = ?').bind(ticketId).first();
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    if (ticket.user_id !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (ticket.chat_status !== 'ai_agent_active') {
      return NextResponse.json({ error: 'This ticket is not handled by AI agent' }, { status: 400 });
    }

    // 1. Push the user's message to D1
    const userMsgId = 'msg_' + nanoid();
    await db.prepare(
      'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text, type) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userMsgId, ticketId, 'user', ticket.user_name || 'User', userMessage.trim(), 'message').run();

    // 2. Read full conversation history
    const messages = await db.prepare(
      'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC'
    ).bind(ticketId).all();

    // 3. Build Groq messages — include ALL history for context (admin messages too)
    const groqMessages: { role: string; content: string }[] = [
      { role: 'system', content: TICKET_AI_SYSTEM_PROMPT },
    ];

    for (const msg of (messages.results || [])) {
      if (msg.type === 'system') continue;
      // Include admin messages as context so the AI knows the full conversation
      groqMessages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.sender === 'admin'
          ? `[Admin said]: ${msg.text}`
          : msg.text as string,
      });
    }

    const apiKey = getGroqApiKey();
    const isPlaceholder = !apiKey || apiKey.startsWith('your_') || apiKey === 'your_groq_api_key_here';

    let aiReply = "I'm looking into this for you. Could you share a bit more detail about what's happening?";

    if (isPlaceholder) {
      aiReply = getMockAiAgentReply(userMessage);
    } else {
      // Call Groq
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
        aiReply = getMockAiAgentReply(userMessage);
      } else {
        const groqData = await groqResponse.json();
        aiReply = groqData.choices?.[0]?.message?.content?.trim() || aiReply;
      }
    }

    // 5. Push AI response to D1
    const aiMsgId = 'msg_' + nanoid();
    await db.prepare(
      'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text, type) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(aiMsgId, ticketId, 'ai_agent', 'AI Support Agent', aiReply, 'message').run();

    return NextResponse.json({ success: true, reply: aiReply });
  } catch (error: any) {
    console.error('AI respond error:', error);
    return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
  }
}
