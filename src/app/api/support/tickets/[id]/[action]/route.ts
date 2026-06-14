import { NextResponse } from 'next/server';
import { getDB, nanoid } from '@/lib/d1';
import { createClient } from '@/lib/supabase/server';
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

export async function GET(req: Request, props: { params: Promise<{ id: string; action: string }> }) {
  const params = await props.params;
  const { id: ticketId, action } = params;

  if (action === 'messages') {
    const db = getDB();
    if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

    const secret = getJwtSecret();
    const isAdmin = await isAdminRequest(req, secret);

    let user = null;
    if (!isAdmin) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
      
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await db.prepare('SELECT user_id, chat_status FROM support_tickets WHERE id = ?').bind(ticketId).first<{user_id: string, chat_status: string}>();
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    if (!isAdmin && ticket.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const messages = await db.prepare(
        'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC'
      ).bind(ticketId).all();

      return NextResponse.json({
        meta: { status: ticket.chat_status },
        messages: messages.results || [] 
      });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(req: Request, props: { params: Promise<{ id: string; action: string }> }) {
  const params = await props.params;
  const { id: ticketId, action } = params;
  
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  if (action === 'resolve') {
    const secret = getJwtSecret();
    const isAdmin = await isAdminRequest(req, secret);

    let user = null;
    if (!isAdmin) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin) {
      const ticket = await db.prepare('SELECT user_id FROM support_tickets WHERE id = ?').bind(ticketId).first<{user_id: string}>();
      if (!ticket || ticket.user_id !== user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    try {
      const body = await req.json();
      const { solution } = body;

      if (!solution || typeof solution !== 'string' || !solution.trim()) {
        return NextResponse.json({ error: 'Solution is required' }, { status: 400 });
      }

      const resolvedAt = new Date().toISOString();

      await db.prepare(
        "UPDATE support_tickets SET status = 'resolved', solution = ?, resolved_at = ?, chat_status = 'resolved' WHERE id = ?"
      ).bind(solution.trim(), resolvedAt, ticketId).run();

      const msgId = 'msg_' + nanoid();
      await db.prepare(
        'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text, type) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        msgId, 
        ticketId, 
        isAdmin ? 'admin' : 'user', 
        isAdmin ? 'ClassOrbit Admin' : 'User', 
        solution.trim(), 
        'resolution'
      ).run();

      const ticket = await db.prepare('SELECT * FROM support_tickets WHERE id = ?').bind(ticketId).first();
      return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
      return NextResponse.json({ error: 'Failed to resolve ticket' }, { status: 500 });
    }
  }

  if (action === 'messages' || action === 'message') {
    try {
      const body = await req.json();
      const { text, sender, senderName, type } = body;

      if (!text || typeof text !== 'string' || !text.trim() || !sender) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }

      const secret = getJwtSecret();
      const isAdmin = await isAdminRequest(req, secret);
      
      let user = null;
      if (!isAdmin) {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        user = data.user;
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const ticket = await db.prepare('SELECT user_id, status FROM support_tickets WHERE id = ?').bind(ticketId).first<{user_id: string, status: string}>();
      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

      if (!isAdmin && ticket.user_id !== user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (ticket.status === 'resolved') {
        return NextResponse.json({ error: 'Ticket is resolved' }, { status: 400 });
      }

      const msgId = 'msg_' + nanoid();
      
      let resolvedSenderName = senderName || sender;
      if (action === 'message' && !senderName) {
        resolvedSenderName = sender === 'admin' ? 'ClassOrbit Admin' : 'User';
      }

      await db.prepare(
        'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text, type) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(msgId, ticketId, sender, resolvedSenderName, text.trim(), type || 'message').run();

      if (action === 'message' && sender === 'admin') {
        await db.prepare(
          "UPDATE support_tickets SET chat_status = 'admin_active', assigned_to = 'admin' WHERE id = ? AND chat_status = 'waiting_for_admin'"
        ).bind(ticketId).run();
      }

      return NextResponse.json({ success: true, id: msgId });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
    }
  }

  if (action === 'ai-respond') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { userMessage } = body;

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    try {
      const ticket = await db.prepare('SELECT user_id, user_name, chat_status FROM support_tickets WHERE id = ?').bind(ticketId).first<{user_id: string, user_name: string, chat_status: string}>();
      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      if (ticket.user_id !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      if (ticket.chat_status !== 'ai_agent_active') {
        return NextResponse.json({ error: 'This ticket is not handled by AI agent' }, { status: 400 });
      }

      const userMsgId = 'msg_' + nanoid();
      await db.prepare(
        'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text, type) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(userMsgId, ticketId, 'user', ticket.user_name || 'User', userMessage.trim(), 'message').run();

      const messages = await db.prepare(
        'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC'
      ).bind(ticketId).all<any>();

      const groqMessages: { role: string; content: string }[] = [
        { role: 'system', content: TICKET_AI_SYSTEM_PROMPT },
      ];

      for (const msg of (messages.results || [])) {
        if (msg.type === 'system') continue;
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

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          aiReply = groqData.choices?.[0]?.message?.content?.trim() || aiReply;
        } else {
          aiReply = getMockAiAgentReply(userMessage);
        }
      }

      const aiMsgId = 'msg_' + nanoid();
      await db.prepare(
        'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text, type) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(aiMsgId, ticketId, 'ai_agent', 'AI Support Agent', aiReply, 'message').run();

      return NextResponse.json({ success: true, reply: aiReply });
    } catch (error: any) {
      return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
    }
  }

  if (action === 'assign-ai') {
    const secret = getJwtSecret();
    if (!(await isAdminRequest(req, secret))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await db.prepare(
        "UPDATE support_tickets SET chat_status = 'ai_agent_active', assigned_to = 'ai_agent' WHERE id = ?"
      ).bind(ticketId).run();

      const ticket = await db.prepare('SELECT message FROM support_tickets WHERE id = ?').bind(ticketId).first<{ message: string }>();
      const initialUserMsg = ticket?.message || '';

      const { results: messagesRaw } = await db.prepare(
        'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC'
      ).bind(ticketId).all<any>();

      const groqMessages: { role: string; content: string }[] = [
        { role: 'system', content: TICKET_AI_SYSTEM_PROMPT },
      ];

      if (messagesRaw && messagesRaw.length > 0) {
        for (const msg of messagesRaw) {
          if (msg.type === 'system') continue;
          groqMessages.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.sender === 'admin'
              ? `[Admin said]: ${msg.text}`
              : msg.text,
          });
        }
      } else if (initialUserMsg) {
        groqMessages.push({ role: 'user', content: initialUserMsg });
      }

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
        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          aiReply = groqData.choices?.[0]?.message?.content?.trim() || aiReply;
        } else {
          aiReply = getMockAiAgentReply(initialUserMsg || 'hello');
        }
      }

      const aiMsgId = 'msg_' + Date.now();
      await db.prepare(
        'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text) VALUES (?, ?, ?, ?, ?)'
      ).bind(aiMsgId, ticketId, 'ai_agent', 'AI Support Agent', aiReply).run();

      return NextResponse.json({ success: true, reply: aiReply });
    } catch (error: any) {
      return NextResponse.json({ error: 'Failed to assign AI agent' }, { status: 500 });
    }
  }

  if (action === 'reopen') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      const ticket = await db.prepare('SELECT user_id, status FROM support_tickets WHERE id = ?').bind(ticketId).first<{user_id: string, status: string}>();
      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      
      if (ticket.user_id !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (ticket.status !== 'resolved') return NextResponse.json({ error: 'Ticket is not resolved' }, { status: 400 });

      await db.prepare(
        'UPDATE support_tickets SET status = ?, chat_status = ?, assigned_to = NULL WHERE id = ?'
      ).bind('open', 'waiting_for_admin', ticketId).run();

      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ error: 'Failed to reopen ticket' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
