import { NextResponse } from 'next/server';
import { getMockChatbotReply } from '@/lib/support-ai-fallback';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { CHATBOT_SYSTEM_PROMPT } from '@/lib/ai-prompts';

export const runtime = 'edge';

function getGroqApiKey(): string {
  try {
    const { env } = getRequestContext();
    return (env as Record<string, string>).GROQ_API_KEY || process.env.GROQ_API_KEY || '';
  } catch {
    return process.env.GROQ_API_KEY || '';
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
    ];

    // Add recent conversation history (last 10 turns for better context)
    for (const msg of conversationHistory.slice(-10)) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
    }

    messages.push({ role: 'user', content: message.trim() });

    const apiKey = getGroqApiKey();
    const isPlaceholder = !apiKey || apiKey.startsWith('your_') || apiKey === 'your_groq_api_key_here';

    if (isPlaceholder) {
      return NextResponse.json(getMockChatbotReply(message));
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
      return NextResponse.json(getMockChatbotReply(message));
    }

    const data = await response.json();
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

    return NextResponse.json({
      reply: parsed.reply,
      resolved: parsed.resolved ?? true,
      confidence: parsed.confidence ?? 'medium',
    });
  } catch (error: any) {
    console.error('Error in /api/support/chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
