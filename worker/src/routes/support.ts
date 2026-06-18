import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB, nanoid } from '../lib/d1';
import { getSupabase } from '../lib/supabase';
import { isAdminRequest } from '../lib/admin-auth';
import { getMockAiAgentReply } from '../lib/support-ai-fallback';
import { TICKET_AI_SYSTEM_PROMPT } from '../lib/ai-prompts';

const router = new Hono<AppEnv>();

router.get('/support/tickets', async (c) => {
  const db = getDB(c);
  const secret = c.env.ADMIN_JWT_SECRET;
  const isAdmin = await isAdminRequest(c.req.raw, secret);

  if (isAdmin) {
    try {
      const tickets = await db.prepare(
        'SELECT * FROM support_tickets ORDER BY created_at DESC'
      ).all();
      return c.json({ tickets: tickets.results || [] });
    } catch (error: any) {
      console.error('Failed to fetch admin tickets:', error);
      return c.json({ error: 'Failed to fetch tickets' }, 500);
    }
  }

  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const tickets = await db.prepare(
      'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.id).all();
    return c.json({ tickets: tickets.results || [] });
  } catch (error: any) {
    console.error('Failed to fetch user tickets:', error);
    return c.json({ error: 'Failed to fetch tickets' }, 500);
  }
});

router.post('/support/tickets', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const body = await c.req.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const ticketId = 'tkt_' + nanoid();
    const email = user.email || null;
    const name = user.user_metadata?.full_name || user.user_metadata?.name || null;

    await db.prepare(
      'INSERT INTO support_tickets (id, user_id, user_email, user_name, message, status, chat_status, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(ticketId, user.id, email, name, message.trim(), 'open', 'waiting_for_admin', null).run();

    const msgId = 'msg_' + nanoid();
    await db.prepare(
      'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text, type) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(msgId, ticketId, 'user', name || 'User', message.trim(), 'message').run();

    const ticket = await db.prepare(
      'SELECT * FROM support_tickets WHERE id = ?'
    ).bind(ticketId).first();

    return c.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Failed to create support ticket:', error);
    return c.json({ error: 'Failed to create ticket' }, 500);
  }
});

router.delete('/support/tickets/:id', async (c) => {
  const secret = c.env.ADMIN_JWT_SECRET;
  if (!(await isAdminRequest(c.req.raw, secret))) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = getDB(c);
  const id = c.req.param('id');

  try {
    await db.prepare('DELETE FROM ticket_messages WHERE ticket_id = ?').bind(id).run();
    await db.prepare('DELETE FROM support_tickets WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete support ticket:', error);
    return c.json({ error: 'Failed to delete ticket' }, 500);
  }
});

router.get('/support/tickets/:id/:action', async (c) => {
  const ticketId = c.req.param('id');
  const action = c.req.param('action');
  const db = getDB(c);

  if (action === 'messages') {
    const secret = c.env.ADMIN_JWT_SECRET;
    const isAdmin = await isAdminRequest(c.req.raw, secret);

    let user = null;
    if (!isAdmin) {
      const supabase = getSupabase(c);
      const { data } = await supabase.auth.getUser();
      user = data.user;

      if (!user) return c.json({ error: 'Unauthorized' }, 401);
    }

    const ticket = await db.prepare('SELECT user_id, chat_status FROM support_tickets WHERE id = ?').bind(ticketId).first<{ user_id: string, chat_status: string }>();
    if (!ticket) return c.json({ error: 'Ticket not found' }, 404);

    if (!isAdmin && ticket.user_id !== user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const messages = await db.prepare(
        'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC'
      ).bind(ticketId).all();

      return c.json({
        meta: { status: ticket.chat_status },
        messages: messages.results || []
      });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return c.json({ error: 'Failed to fetch messages' }, 500);
    }
  }

  return c.json({ error: 'Not found' }, 404);
});

router.post('/support/tickets/:id/:action', async (c) => {
  const ticketId = c.req.param('id');
  const action = c.req.param('action');
  const db = getDB(c);

  if (action === 'resolve') {
    const secret = c.env.ADMIN_JWT_SECRET;
    const isAdmin = await isAdminRequest(c.req.raw, secret);

    let user = null;
    if (!isAdmin) {
      const supabase = getSupabase(c);
      const { data } = await supabase.auth.getUser();
      user = data.user;
      if (!user) return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!isAdmin) {
      const ticket = await db.prepare('SELECT user_id FROM support_tickets WHERE id = ?').bind(ticketId).first<{ user_id: string }>();
      if (!ticket || ticket.user_id !== user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
    }

    try {
      const body = await c.req.json();
      const { solution } = body;

      if (!solution || typeof solution !== 'string' || !solution.trim()) {
        return c.json({ error: 'Solution is required' }, 400);
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
      return c.json({ success: true, ticket });
    } catch {
      return c.json({ error: 'Failed to resolve ticket' }, 500);
    }
  }

  if (action === 'messages' || action === 'message') {
    try {
      const body = await c.req.json();
      const { text, sender, senderName, type } = body;

      if (!text || typeof text !== 'string' || !text.trim() || !sender) {
        return c.json({ error: 'Missing fields' }, 400);
      }

      const secret = c.env.ADMIN_JWT_SECRET;
      const isAdmin = await isAdminRequest(c.req.raw, secret);

      let user = null;
      if (!isAdmin) {
        const supabase = getSupabase(c);
        const { data } = await supabase.auth.getUser();
        user = data.user;
        if (!user) return c.json({ error: 'Unauthorized' }, 401);
      }

      const ticket = await db.prepare('SELECT user_id, status FROM support_tickets WHERE id = ?').bind(ticketId).first<{ user_id: string, status: string }>();
      if (!ticket) return c.json({ error: 'Ticket not found' }, 404);

      if (!isAdmin && ticket.user_id !== user?.id) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (ticket.status === 'resolved') {
        return c.json({ error: 'Ticket is resolved' }, 400);
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

      return c.json({ success: true, id: msgId });
    } catch {
      return c.json({ error: 'Failed to post message' }, 500);
    }
  }

  if (action === 'ai-respond') {
    const supabase = getSupabase(c);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const { userMessage } = body;

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return c.json({ error: 'Message is required' }, 400);
    }

    try {
      const ticket = await db.prepare('SELECT user_id, user_name, chat_status FROM support_tickets WHERE id = ?').bind(ticketId).first<{ user_id: string, user_name: string, chat_status: string }>();
      if (!ticket) return c.json({ error: 'Ticket not found' }, 404);
      if (ticket.user_id !== user.id) return c.json({ error: 'Unauthorized' }, 401);

      if (ticket.chat_status !== 'ai_agent_active') {
        return c.json({ error: 'This ticket is not handled by AI agent' }, 400);
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

      const apiKey = c.env.GROQ_API_KEY;
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
          const groqData = await groqResponse.json() as any;
          aiReply = groqData.choices?.[0]?.message?.content?.trim() || aiReply;
        } else {
          aiReply = getMockAiAgentReply(userMessage);
        }
      }

      const aiMsgId = 'msg_' + nanoid();
      await db.prepare(
        'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text, type) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(aiMsgId, ticketId, 'ai_agent', 'AI Support Agent', aiReply, 'message').run();

      return c.json({ success: true, reply: aiReply });
    } catch {
      return c.json({ error: 'Failed to generate AI response' }, 500);
    }
  }

  if (action === 'assign-ai') {
    const secret = c.env.ADMIN_JWT_SECRET;
    if (!(await isAdminRequest(c.req.raw, secret))) {
      return c.json({ error: 'Unauthorized' }, 401);
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

      const apiKey = c.env.GROQ_API_KEY;
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
          const groqData = await groqResponse.json() as any;
          aiReply = groqData.choices?.[0]?.message?.content?.trim() || aiReply;
        } else {
          aiReply = getMockAiAgentReply(initialUserMsg || 'hello');
        }
      }

      const aiMsgId = 'msg_' + Date.now();
      await db.prepare(
        'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text) VALUES (?, ?, ?, ?, ?)'
      ).bind(aiMsgId, ticketId, 'ai_agent', 'AI Support Agent', aiReply).run();

      return c.json({ success: true, reply: aiReply });
    } catch {
      return c.json({ error: 'Failed to assign AI agent' }, 500);
    }
  }

  if (action === 'reopen') {
    const supabase = getSupabase(c);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    try {
      const ticket = await db.prepare('SELECT user_id, status FROM support_tickets WHERE id = ?').bind(ticketId).first<{ user_id: string, status: string }>();
      if (!ticket) return c.json({ error: 'Ticket not found' }, 404);

      if (ticket.user_id !== user.id) return c.json({ error: 'Unauthorized' }, 401);
      if (ticket.status !== 'resolved') return c.json({ error: 'Ticket is not resolved' }, 400);

      await db.prepare(
        'UPDATE support_tickets SET status = ?, chat_status = ?, assigned_to = NULL WHERE id = ?'
      ).bind('open', 'waiting_for_admin', ticketId).run();

      return c.json({ success: true });
    } catch {
      return c.json({ error: 'Failed to reopen ticket' }, 500);
    }
  }

  return c.json({ error: 'Unknown action' }, 400);
});

export default router;
