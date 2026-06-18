'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, LifeBuoy, Loader2, Sparkles,
  CheckCircle2, Bot, User, ArrowLeft, Clock, Zap, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// Fallback only used server-side; no client imports needed

/* ─── Types ─── */
interface Ticket {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  message: string;
  status: 'open' | 'resolved';
  solution: string | null;
  chat_status?: string;
  assigned_to?: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface ChatMsg {
  id: string;
  sender: 'user' | 'bot' | 'admin' | 'ai_agent' | 'system';
  senderName?: string;
  text: string;
  timestamp: Date;
  type?: 'message' | 'resolution' | 'system' | 'conversation_end' | 'resolution_request';
  isTicketConfirmation?: boolean;
  isLoading?: boolean;
  feedbackState?: 'none' | 'yes' | 'no';
  editableTitle?: string;
}

type WidgetView = 'chat' | 'live' | 'tickets';

/* ─── Component ─── */
export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<WidgetView>('chat');

  // AI Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ sender: string; text: string }[]>([]);
  const [conversationEnded, setConversationEnded] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');

  // Live chat state
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [liveMessages, setLiveMessages] = useState<ChatMsg[]>([]);
  const [liveChatStatus, setLiveChatStatus] = useState<string>('waiting_for_admin');
  const [hasNewResolution, setHasNewResolution] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize bot greeting
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: "Hey! 👋 I'm ClassOrbit's AI assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = (await res.json()) as any;
        setTickets(data.tickets || []);
        // Check for newly resolved tickets
        const resolved = (data.tickets || []).filter(
          (t: Ticket) => t.status === 'resolved'
        );
        if (resolved.length > 0) setHasNewResolution(true);
      }
    } catch (e) {
      console.error('Failed to load tickets', e);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchTickets();
  }, [isOpen, fetchTickets]);

  // Scroll effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    liveEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages]);

  // D1 short-polling real-time listener
  const subscribeToChat = useCallback((ticketId: string) => {
    // Clean up previous listener
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    const pollMessages = async () => {
      try {
        const res = await fetch(`/api/support/tickets/${ticketId}/messages`);
        if (res.ok) {
          const data = await res.json() as any;
          
          if (data.meta?.status) {
            setLiveChatStatus(data.meta.status);
          }

          if (data.messages) {
            const msgs: ChatMsg[] = data.messages.map((msg: any) => ({
              id: msg.id,
              sender: msg.sender,
              senderName: msg.sender_name,
              text: msg.text,
              timestamp: new Date(msg.created_at),
              type: msg.type,
            }));
            
            setLiveMessages(() => {
              // Check for inactivity
              if (msgs.length > 0) {
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg.sender === 'admin' || lastMsg.sender === 'ai_agent') {
                  resetInactivityTimer(ticketId);
                } else {
                  clearInactivityTimer();
                }
              }
              return msgs;
            });
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Initial fetch
    pollMessages();

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(pollMessages, 3000);
  }, []);

  const unsubscribeFromChat = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    clearInactivityTimer();
  }, []);

  const clearInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const resetInactivityTimer = (ticketId: string) => {
    clearInactivityTimer();
    // 2 minutes inactivity timeout
    inactivityTimerRef.current = setTimeout(() => {
      handleAutoResolve(ticketId);
    }, 120000); 
  };

  const handleAutoResolve = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solution: 'Ticket automatically closed due to inactivity.' })
      });
      if (res.ok) {
        toast.success('Ticket closed due to inactivity.');
        setLiveChatStatus('resolved');
        clearInactivityTimer();
      }
    } catch (e) {
      console.error('Failed to auto-resolve', e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => unsubscribeFromChat();
  }, [unsubscribeFromChat]);

  /* ─── AI Chat Handling ─── */
  /* ─── Start New Conversation (keeps history visible) ─── */
  const handleNewConversation = () => {
    setConversationEnded(false);
    setConversationHistory([]);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isAiThinking) return;
    const trimmed = text.trim();
    setInputValue('');

    // If conversation was ended, restart context first
    if (conversationEnded) {
      handleNewConversation();
    }

    // Add user message
    const userMsg: ChatMsg = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setConversationHistory((prev) => [...prev, { sender: 'user', text: trimmed }]);

    // Check if user explicitly wants human
    const lower = trimmed.toLowerCase();
    if (
      lower.includes('human') ||
      lower.includes('talk to admin') ||
      lower.includes('representative') ||
      lower.includes('real person')
    ) {
      askForTicketConfirmation(trimmed);
      return;
    }

    // Otherwise, call the AI
    setIsAiThinking(true);
    const loadingMsg: ChatMsg = {
      id: 'loading',
      sender: 'bot',
      text: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMsg]);

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory: conversationHistory.slice(-6),
        }),
      });

      // Remove loading message
      setMessages((prev) => prev.filter((m) => m.id !== 'loading'));

      if (res.ok) {
        const data = (await res.json()) as any;
        const { reply, resolved, confidence } = data;

        const botMsg: ChatMsg = {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: reply,
          timestamp: new Date(),
          feedbackState: 'none',
        };
        setMessages((prev) => [...prev, botMsg]);
        setConversationHistory((prev) => [...prev, { sender: 'bot', text: reply }]);

        // If low confidence or not resolved, offer to escalate
        if (!resolved || confidence === 'low') {
          setTimeout(() => {
            askForTicketConfirmation(trimmed);
          }, 800);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            sender: 'bot',
            text: "I'm having trouble connecting right now. Would you like to create a support ticket instead?",
            timestamp: new Date(),
            isTicketConfirmation: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== 'loading'));
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'bot',
          text: "Something went wrong. Would you like to create a support ticket?",
          timestamp: new Date(),
          isTicketConfirmation: true,
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleFeedback = (messageId: string, helpful: 'yes' | 'no') => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, feedbackState: helpful } : m
      )
    );

    if (helpful === 'no') {
      const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
      askForTicketConfirmation(lastUserMsg?.text || 'general support');
    } else {
      // Mark conversation as ended with a nice closure
      setConversationEnded(true);
      setMessages((prev) => [
        ...prev,
        {
          id: 'helpful_ack_' + Date.now(),
          sender: 'bot',
          text: "Glad I could help! 🎉 Feel free to start a new question anytime.",
          timestamp: new Date(),
        },
        {
          id: 'conv_end_' + Date.now(),
          sender: 'system',
          text: 'Conversation ended',
          timestamp: new Date(),
          type: 'conversation_end',
        },
      ]);
    }
  };

  const askForTicketConfirmation = (queryText: string) => {
    setTicketTitle(queryText);
    setMessages((prev) => [
      ...prev,
      {
        id: 'confirm_' + Date.now(),
        sender: 'bot',
        text: `I can connect you with the admin team. Would you like to create a support ticket? You can edit the title below:`,
        timestamp: new Date(),
        isTicketConfirmation: true,
        editableTitle: queryText,
      },
    ]);
  };

  const handleConfirmTicket = async (queryText: string) => {
    setIsSubmittingTicket(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const newTicket: Ticket = data.ticket;
        setTickets((prev) => [newTicket, ...prev]);

        // Remove confirmation and show success
        setMessages((prev) => {
          const filtered = prev.filter((m) => !m.isTicketConfirmation);
          return [
            ...filtered,
            {
              id: 'success_' + Date.now(),
              sender: 'bot',
              text: `Ticket created! (${newTicket.id})\nYou're now in a live chat room. An admin or AI agent will respond shortly.`,
              timestamp: new Date(),
            },
          ];
        });

        toast.success('Support ticket created!');

        // Switch to live chat
        setActiveTicketId(newTicket.id);
        subscribeToChat(newTicket.id);
        setView('live');
      } else {
        const err = (await res.json()) as any;
        toast.error(err.error || 'Failed to create ticket');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleRejectTicket = () => {
    setConversationEnded(true);
    setMessages((prev) => {
      const filtered = prev.filter((m) => !m.isTicketConfirmation);
      return [
        ...filtered,
        {
          id: 'cancelled_' + Date.now(),
          sender: 'bot',
          text: 'No problem! Feel free to ask me anything else.',
          timestamp: new Date(),
        },
        {
          id: 'conv_end_reject_' + Date.now(),
          sender: 'system',
          text: 'Conversation ended',
          timestamp: new Date(),
          type: 'conversation_end',
        },
      ];
    });
  };

  /* ─── Live Chat Handling ─── */
  const handleSendLiveMessage = async (text: string) => {
    if (!text.trim() || !activeTicketId) return;
    setInputValue('');

    const ticketStatus = liveChatStatus;

    try {
      if (ticketStatus === 'ai_agent_active') {
        // Route through AI agent
        await fetch(`/api/support/tickets/${activeTicketId}/ai-respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: text.trim() }),
        });
      } else {
        // Regular message
        await fetch(`/api/support/tickets/${activeTicketId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim(), sender: 'user' }),
        });
      }
    } catch {
      toast.error('Failed to send message');
    }
  };

  const handleReopenTicket = async () => {
    if (!activeTicketId) return;
    try {
      const res = await fetch(`/api/support/tickets/${activeTicketId}/reopen`, { method: 'POST' });
      if (res.ok) {
        toast.success('Ticket reopened! An admin will review it.');
        setLiveChatStatus('waiting_for_admin');
        fetchTickets(); // Refresh tickets view state
      } else {
        toast.error('Failed to reopen ticket');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleUserResolve = async () => {
    if (!activeTicketId) return;
    try {
      const res = await fetch(`/api/support/tickets/${activeTicketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solution: 'Resolved by user confirmation.' }),
      });
      if (res.ok) {
        toast.success('Ticket resolved!');
        setLiveChatStatus('resolved');
        fetchTickets();
      } else {
        toast.error('Failed to resolve ticket');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const openTicketChat = (ticket: Ticket) => {
    setActiveTicketId(ticket.id);
    setLiveMessages([]);
    subscribeToChat(ticket.id);
    setView('live');
  };

  const closeLiveChat = () => {
    unsubscribeFromChat();
    setActiveTicketId(null);
    setLiveMessages([]);
    setView('chat');
  };

  /* ─── Status Label ─── */
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting_for_admin':
        return { text: 'Waiting for admin...', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: <Clock size={12} /> };
      case 'admin_active':
        return { text: 'Admin connected', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <User size={12} /> };
      case 'ai_agent_active':
        return { text: 'AI Agent assisting', color: 'text-violet-400', bg: 'bg-violet-500/10', icon: <Bot size={12} /> };
      case 'resolved':
        return { text: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <CheckCircle2 size={12} /> };
      default:
        return { text: 'Open', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: <Clock size={12} /> };
    }
  };

  /* ─── Message Bubble ─── */
  const renderMessage = (msg: ChatMsg) => {
    const isUser = msg.sender === 'user';
    const isSystem = msg.sender === 'system' || msg.type === 'system';
    const isResolution = msg.type === 'resolution';
    const isResolutionRequest = msg.type === 'resolution_request';
    const isAi = msg.sender === 'ai_agent';
    const isAdmin = msg.sender === 'admin';

    // Conversation end divider
    if (msg.type === 'conversation_end') {
      return (
        <div key={msg.id} className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <span className="text-[10px] text-text-subtle bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0">
            <CheckCircle2 size={10} className="text-emerald-400" />
            {msg.text}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>
      );
    }

    if (isSystem) {
      return (
        <div key={msg.id} className="flex justify-center my-2">
          <span className="text-[10px] text-text-subtle bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-full">
            {msg.text}
          </span>
        </div>
      );
    }

    if (isResolution) {
      return (
        <div key={msg.id} className="my-2">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-3 text-[12.5px]">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
              <CheckCircle2 size={13} /> Resolution
            </span>
            <p className="text-text-muted whitespace-pre-wrap">{msg.text}</p>
          </div>
        </div>
      );
    }

    if (isResolutionRequest) {
      return (
        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div className="flex flex-col gap-0.5 max-w-[85%]">
            {!isUser && (isAi || isAdmin) && (
              <span className={`text-[10px] font-bold flex items-center gap-1 ml-1 ${isAi ? 'text-violet-400' : 'text-emerald-400'}`}>
                {isAi ? <Bot size={10} /> : <User size={10} />}
                {msg.senderName || (isAi ? 'AI Agent' : 'Admin')}
              </span>
            )}
            <div className="bg-amber-500/10 border border-amber-500/20 text-text-main rounded-2xl rounded-tl-none px-4 py-3">
              <p className="whitespace-pre-wrap text-[13px]">{msg.text}</p>
              
              {liveChatStatus !== 'resolved' && (
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-amber-500/10">
                  <span className="text-[10px] text-amber-400 font-semibold text-center mb-1">Please confirm if your issue is resolved</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSendLiveMessage("No, I still need help.")}
                      className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-main rounded-lg text-[11px] font-bold transition-all border border-white/[0.06] cursor-pointer"
                    >
                      No, not yet
                    </button>
                    <button 
                      onClick={handleUserResolve}
                      className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-bold transition-all border border-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={12} /> Yes, resolve it
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Timestamp */}
            <span className={`text-[9px] text-text-subtle ml-1`}>
              {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      );
    }

    if (msg.isLoading) {
      return (
        <div key={msg.id} className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-none px-4 py-3 bg-white/5 border border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className="flex flex-col gap-0.5 max-w-[85%]">
          {/* Sender label for non-user messages */}
          {!isUser && (isAi || isAdmin) && (
            <span className={`text-[10px] font-bold flex items-center gap-1 ml-1 ${isAi ? 'text-violet-400' : 'text-emerald-400'}`}>
              {isAi ? <Bot size={10} /> : <User size={10} />}
              {msg.senderName || (isAi ? 'AI Agent' : 'Admin')}
            </span>
          )}
          <div
            className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
              isUser
                ? 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/10'
                : isAi
                  ? 'bg-violet-500/10 border border-violet-500/15 text-text-main rounded-tl-none'
                  : isAdmin
                    ? 'bg-emerald-500/10 border border-emerald-500/15 text-text-main rounded-tl-none'
                    : 'bg-white/5 border border-white/[0.06] text-text-main rounded-tl-none'
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.text}</p>

            {/* Helpful Solution Feedback buttons */}
            {view === 'chat' && msg.sender === 'bot' && msg.id !== 'welcome' && !msg.isLoading && !msg.isTicketConfirmation && !msg.text.includes('Ticket created!') && (
              <div className="flex items-center gap-3 mt-3 border-t border-white/[0.04] pt-2 justify-between shrink-0">
                <span className="text-[10px] text-text-subtle">Was this helpful?</span>
                {msg.feedbackState === 'yes' ? (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    ✓ Helpful
                  </span>
                ) : msg.feedbackState === 'no' ? (
                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                    Escalating...
                  </span>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleFeedback(msg.id, 'yes')}
                      className="px-2 py-0.5 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 text-text-muted hover:border-emerald-500/20 rounded-md text-[10px] font-bold transition-all border border-white/[0.06] cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, 'no')}
                      className="px-2 py-0.5 bg-white/5 hover:bg-amber-500/10 hover:text-amber-400 text-text-muted hover:border-amber-500/20 rounded-md text-[10px] font-bold transition-all border border-white/[0.06] cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Ticket Confirmation buttons */}
            {msg.isTicketConfirmation && (
              <div className="flex flex-col gap-2 mt-3 justify-end">
                {msg.editableTitle !== undefined && (
                  <input
                    type="text"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    placeholder="Enter your ticket subject..."
                    className="w-full bg-white/5 border border-white/[0.06] focus:border-primary/50 text-text-main rounded-lg px-3 py-2 text-[12px] outline-none transition-colors"
                  />
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleRejectTicket}
                    disabled={isSubmittingTicket}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-main rounded-lg text-[11px] font-bold transition-all border border-white/[0.06] cursor-pointer"
                  >
                    No, cancel
                  </button>
                  <button
                    onClick={() => handleConfirmTicket(ticketTitle || 'General help requested.')}
                    disabled={isSubmittingTicket || (msg.editableTitle !== undefined && !ticketTitle.trim())}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-glow cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingTicket ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
                    Yes, create ticket
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Timestamp */}
          <span className={`text-[9px] text-text-subtle ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
            {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };

  /* ─── Render ─── */
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-[370px] sm:w-[410px] h-[580px] max-h-[85vh] bg-[#0c0a1f]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 relative z-50"
          >
            {/* Ambient glow */}
            <div className="absolute top-0 left-0 w-full h-[60px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            <div className="absolute -right-24 -top-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            {/* ─── Header ─── */}
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between relative shrink-0">
              {view === 'live' ? (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={closeLiveChat}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-text-main transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h3 className="text-[13px] font-bold text-text-main leading-tight font-display">
                      Live Support
                    </h3>
                    <div className={`flex items-center gap-1 text-[10px] font-semibold ${getStatusLabel(liveChatStatus).color}`}>
                      {getStatusLabel(liveChatStatus).icon}
                      {getStatusLabel(liveChatStatus).text}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white shadow-md">
                    <LifeBuoy size={18} />
                  </div>
                  <div>
                    <h3 className="text-[13.5px] font-bold text-text-main leading-tight flex items-center gap-1.5 font-display">
                      ClassOrbit Support
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </h3>
                    <p className="text-[10px] text-text-muted">AI-powered · Admin on standby</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/[0.06] hover:bg-white/15 text-text-muted hover:text-text-main flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* ─── Tab Switcher (non-live views) ─── */}
            {view !== 'live' && (
              <div className="flex border-b border-white/[0.04] shrink-0">
                <button
                  onClick={() => setView('chat')}
                  className={`flex-1 py-2.5 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    view === 'chat'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Zap size={12} />
                  AI Chat
                </button>
                <button
                  onClick={() => { setView('tickets'); fetchTickets(); }}
                  className={`flex-1 py-2.5 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 relative ${
                    view === 'tickets'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <LifeBuoy size={12} />
                  My Tickets
                  {tickets.filter((t) => t.status === 'open').length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
                      {tickets.filter((t) => t.status === 'open').length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* ─── AI Chat View ─── */}
            {view === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3 relative">
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick suggestions (initial greeting OR conversation ended) */}
                {(messages.length === 1 || conversationEnded) && (
                  <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/[0.04] flex flex-col gap-2 shrink-0">
                    {conversationEnded && (
                      <button
                        onClick={() => {
                          handleNewConversation();
                          setInputValue('');
                        }}
                        className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[11px] transition-all border border-primary/20 cursor-pointer font-bold flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={12} />
                        Start a New Conversation
                      </button>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '🛠 How does Prompt Builder work?', msg: 'How does the Prompt Builder work?' },
                        { label: '💰 Pricing & Plans', msg: 'What are the pricing plans?' },
                        { label: '🚀 Which AI tools are supported?', msg: 'Which AI tools does ClassOrbit support?' },
                        { label: '📁 How do I organize my prompts?', msg: 'How do I use the Workspace and Saved Prompts?' },
                        { label: '❌ Cancel my plan', msg: 'How do I cancel my Pro subscription?' },
                      ].map((q) => (
                        <button
                          key={q.msg}
                          onClick={() => handleSendMessage(q.msg)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-main rounded-full text-[10px] whitespace-nowrap transition-all border border-white/[0.06] cursor-pointer"
                        >
                          {q.label}
                        </button>
                      ))}
                      <button
                        onClick={() => handleSendMessage('Talk to a human')}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-[10px] whitespace-nowrap transition-all border border-primary/20 cursor-pointer font-bold"
                      >
                        👤 Talk to Admin
                      </button>
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-3.5 border-t border-white/[0.06] flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage(inputValue);
                    }}
                    placeholder={conversationEnded ? 'Ask a new question...' : 'Ask me anything...'}
                    disabled={isAiThinking}
                    className="flex-1 bg-white/5 border border-white/[0.06] focus:border-primary/50 text-text-main rounded-xl px-4 py-2.5 text-[13px] outline-none transition-colors placeholder:text-text-subtle disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={isAiThinking || !inputValue.trim()}
                    className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </>
            )}

            {/* ─── Live Chat View ─── */}
            {view === 'live' && activeTicketId && (
              <>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3 relative">
                  {liveMessages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 size={24} className="animate-spin text-primary mx-auto mb-3" />
                        <p className="text-[12px] text-text-muted">Connecting to chat room...</p>
                      </div>
                    </div>
                  )}
                  {liveMessages.map(renderMessage)}
                  <div ref={liveEndRef} />
                </div>

                {/* Input (disabled if resolved) */}
                {liveChatStatus !== 'resolved' ? (
                  <div className="p-3.5 border-t border-white/[0.06] flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendLiveMessage(inputValue);
                      }}
                      placeholder={
                        liveChatStatus === 'ai_agent_active'
                          ? 'Chat with AI agent...'
                          : 'Type your message...'
                      }
                      className="flex-1 bg-white/5 border border-white/[0.06] focus:border-primary/50 text-text-main rounded-xl px-4 py-2.5 text-[13px] outline-none transition-colors placeholder:text-text-subtle"
                    />
                    <button
                      onClick={() => handleSendLiveMessage(inputValue)}
                      disabled={!inputValue.trim()}
                      className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0 disabled:opacity-40"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 border-t border-white/[0.06] flex flex-col items-center justify-center gap-2 shrink-0">
                    <p className="text-[12px] text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> This ticket has been resolved
                    </p>
                    <button
                      onClick={handleReopenTicket}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/[0.06] rounded-full text-[11px] text-text-main transition-colors cursor-pointer"
                    >
                      Reopen Ticket
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ─── Tickets View ─── */}
            {view === 'tickets' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {loadingTickets ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <LifeBuoy size={28} className="text-text-subtle mx-auto mb-3" />
                    <p className="text-[12px] text-text-muted">No support tickets yet.</p>
                    <p className="text-[11px] text-text-subtle mt-1">
                      Use the AI Chat tab to get help or create a ticket.
                    </p>
                  </div>
                ) : (
                  tickets.map((t) => {
                    const statusInfo = getStatusLabel(t.chat_status || t.status);
                    return (
                      <button
                        key={t.id}
                        onClick={() => openTicketChat(t)}
                        className="w-full text-left bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3.5 hover:bg-white/[0.04] transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-primary">
                            {t.id}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color} border border-current/20`}
                          >
                            {statusInfo.icon}
                            {statusInfo.text}
                          </span>
                        </div>
                        <p className="text-[12px] text-text-muted italic line-clamp-2 mb-2">
                          &quot;{t.message}&quot;
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-subtle">
                            {new Date(t.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className="text-[10px] text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            Open Chat →
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Floating Button ─── */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 relative group hover:shadow-glow transition-all cursor-pointer border border-primary/20"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare size={24} />
              {hasNewResolution && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#06040F] animate-pulse" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
