/**
 * Shared fallback responses for ClassOrbit support systems when
 * Groq API keys are not configured or are invalid/placeholders.
 */

export function getMockChatbotReply(message: string): { reply: string; resolved: boolean; confidence: 'high' | 'medium' | 'low' } {
  const msg = message.toLowerCase().trim();

  if (msg.includes('pricing') || msg.includes('plan') || msg.includes('cost') || msg.includes('fee') || msg.includes('pro') || msg.includes('subscription')) {
    return {
      reply: "ClassOrbit offers three pricing plans:\n1. **Free Plan**: 25 prompt optimizations per month, full access to features.\n2. **Pro Plan**: ₹199/month for unlimited optimizations and advanced engines (Suno, ElevenLabs, Ideogram, etc.).\n3. **School Plan**: Custom pricing for schools and institutions.\n\nYou can upgrade via the 'Upgrade to Pro' tab in the sidebar.",
      resolved: true,
      confidence: 'high'
    };
  }

  if (msg.includes('cancel') || msg.includes('refund') || msg.includes('unsubscribe')) {
    return {
      reply: "To cancel your Pro subscription, go to your Profile page (click your avatar at the bottom-left of the sidebar), scroll to the bottom, and click the 'Cancel Plan' button. If you need a refund or have a billing issue, please connect with a human administrator.",
      resolved: false,
      confidence: 'medium'
    };
  }

  if (msg.includes('human') || msg.includes('admin') || msg.includes('support') || msg.includes('help') || msg.includes('ticket') || msg.includes('person') || msg.includes('agent')) {
    return {
      reply: "I understand you need human assistance. I will escalate this to a live administrator immediately. Please click the button below to open a support ticket.",
      resolved: false,
      confidence: 'low'
    };
  }

  if (msg.includes('quiz') || msg.includes('worksheet') || msg.includes('lesson') || msg.includes('rubric') || msg.includes('homework') || msg.includes('flashcard') || msg.includes('prompt')) {
    return {
      reply: "ClassOrbit supports generating optimized prompts for 14 different classroom content types (such as quizzes, worksheets, lesson plans, debate preparation, and rubrics). To start, select the Guided Builder or Free Type mode in the sidebar, choose your settings, and copy the resulting prompt to your favorite AI platform (ChatGPT, Claude, etc.)!",
      resolved: true,
      confidence: 'high'
    };
  }

  return {
    reply: "Welcome to ClassOrbit Support! I can help you with features, prompt building, upgrade pricing, or canceling your plan. If your issue is account-specific or requires admin intervention, please let me know and I will escalate this to a human admin.",
    resolved: true,
    confidence: 'medium'
  };
}

export function getMockAiAgentReply(message: string): string {
  const chatbotReply = getMockChatbotReply(message);
  // Strip markdown asterisks to return clean text for the live chat
  return chatbotReply.reply.replace(/\*\*/g, '');
}

