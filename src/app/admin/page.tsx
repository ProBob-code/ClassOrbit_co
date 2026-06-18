'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Loader2, LogOut, Users, FileText, Wrench,
  TrendingUp, RefreshCw, Plus, Trash2, Edit2, ToggleLeft, ToggleRight,
  ExternalLink, X, Rocket, Mail, Clock, BarChart3,
  UserCheck, Crown, ListOrdered, Search, ShieldAlert, CheckCircle2,
  Star, MessageSquare, LifeBuoy,
  Bot, User, Send, ArrowLeft, BookOpen, Eye, Pencil
} from 'lucide-react';
import BlogContent from '@/components/blog/BlogContent';


/* ─── Types ─── */
interface Stats {
  total_prompts: number;
  unique_users: number;
  pro_users: number;
  waitlist_count: number;
  active_tools: number;
  total_tools: number;
  recent_prompts: { user_id: string; topic: string; content_type: string; created_at: string }[];
  recent_waitlist: { email: string; name: string; created_at: string }[];
  tool_usage: { tool_id: string; tool_name: string; is_custom: number; count: number; last_used: string }[];
  custom_tools: { id: string; user_id: string; tool_name: string; tool_url: string; description: string; category: string; is_free: number; created_at: string; user_email?: string }[];
  feedback_avg: number;
  feedback_count: number;
  feedback_list: { user_email: string; rating: number; feedback: string; created_at: string }[];
  open_tickets_count?: number;
}

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
  sender: string;
  senderName: string;
  text: string;
  timestamp: number;
  type?: string;
}

interface AdminTool {
  id: string;
  tool_name: string;
  tool_url: string;
  tool_logo?: string;
  category: string;
  supported_outputs: string[];
  description?: string;
  is_free: boolean;
  pricing_info?: string;
  active: boolean;
  sort_order: number;
  is_new: boolean;
  new_until?: string;
}

const CATEGORIES = ['text', 'visual', 'presentation', 'audio', 'image', 'research'];
const OUTPUT_OPTIONS = [
  'quiz', 'lesson_plan', 'question_paper', 'worksheet', 'story', 'homework',
  'flashcards', 'debate', 'rubric', 'notes', 'video_script', 'ppt',
  'classroom_activity', 'interactive_game',
];

function emptyForm(): Partial<AdminTool> {
  return {
    tool_name: '', tool_url: '', category: 'text',
    supported_outputs: [], description: '', is_free: true,
    pricing_info: '', active: true, sort_order: 0, is_new: false,
  };
}

type Tab = 'overview' | 'tools' | 'activity' | 'waitlist' | 'feedback' | 'users' | 'tickets' | 'blogs';

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  cover_image_url: string | null;
  published: number;
  created_at: string;
  updated_at: string;
}

interface AdminUser {
  user_id: string;
  plan_type: string;
  subscription_status: string;
  plan_expires_at: string | null;
  is_blocked: number;
  email?: string | null;
  name?: string | null;
  created_at: string;
}

/* ─── Stat Card ─── */
function StatCard({ icon, label, value, color = 'primary', onClick }: { icon: React.ReactNode; label: string; value: string | number; color?: string; onClick?: () => void }) {
  const colorMap: Record<string, string> = {
    primary: 'from-amber-500/10 to-amber-500/2 border-amber-500/20 text-amber-400 shadow-amber-500/5',
    emerald: 'from-emerald-500/10 to-emerald-500/2 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5',
    violet: 'from-violet-500/10 to-violet-500/2 border-violet-500/20 text-violet-400 shadow-violet-500/5',
    rose: 'from-rose-500/10 to-rose-500/2 border-rose-500/20 text-rose-400 shadow-rose-500/5',
    sky: 'from-sky-500/10 to-sky-500/2 border-sky-500/20 text-sky-400 shadow-sky-500/5',
    amber: 'from-primary/10 to-primary/2 border-primary/20 text-primary shadow-primary/5',
  };
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-gradient-to-br ${colorMap[color].split(' ').slice(0, 3).join(' ')} border rounded-2xl p-5 shadow-sm hover:shadow-md ${colorMap[color].split(' ').pop()} transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ${colorMap[color].split(' ')[3]}`}>
          {icon}
        </div>
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[30px] font-extrabold text-text-main leading-none font-display tracking-tight">{value}</p>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Tools state
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminTool>>(emptyForm());
  const [saving, setSaving] = useState(false);

  // Blogs state
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editBlogId, setEditBlogId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState<Partial<Blog>>({});
  const [savingBlog, setSavingBlog] = useState(false);
  const [blogModalTab, setBlogModalTab] = useState<'edit' | 'preview'>('edit');

  // Search & Filter state for tools registry
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');

  // Live chat state (admin)
  const [activeChat, setActiveChat] = useState<Ticket | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStatus, setChatStatus] = useState('waiting_for_admin');
  const [assigningAi, setAssigningAi] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ─── Auth check ─── */
  useEffect(() => {
    fetch('/api/admin/verify')
      .then(r => r.json() as Promise<any>)
      .then(d => {
        if (d.valid) setAuthed(true);
        else router.replace('/admin/login');
      })
      .catch(() => router.replace('/admin/login'))
      .finally(() => setChecking(false));
  }, [router]);

  /* ─── Load stats ─── */
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats((await res.json()) as any);
    } catch { toast.error('Failed to load stats'); }
    finally { setStatsLoading(false); }
  }, []);

  /* ─── Load tools ─── */
  const loadTools = useCallback(async () => {
    setToolsLoading(true);
    try {
      const res = await fetch('/api/admin/tools');
      if (res.ok) {
        const data = (await res.json()) as any;
        setTools(data.tools ?? []);
      }
    } catch { toast.error('Failed to load tools'); }
    finally { setToolsLoading(false); }
  }, []);

  /* ─── Load users ─── */
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = (await res.json()) as any;
        setUsers(data.users ?? []);
      }
    } catch { toast.error('Failed to load users'); }
    finally { setUsersLoading(false); }
  }, []);

  /* ─── Load tickets ─── */
  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = (await res.json()) as any;
        setTickets(data.tickets ?? []);
      }
    } catch { toast.error('Failed to load support tickets'); }
    finally { setTicketsLoading(false); }
  }, []);

  /* ─── Load blogs ─── */
  const loadBlogs = useCallback(async () => {
    setBlogsLoading(true);
    try {
      const res = await fetch('/api/admin/blogs');
      if (res.ok) {
        const data = (await res.json()) as any;
        setBlogs(data.blogs ?? []);
      }
    } catch { toast.error('Failed to load blogs'); }
    finally { setBlogsLoading(false); }
  }, []);

  useEffect(() => {
    if (authed) {
      loadStats();
      loadTools();
      loadUsers();
      loadTickets();
      loadBlogs();
    }
  }, [authed, loadStats, loadTools, loadUsers, loadTickets, loadBlogs]);

  /* ─── Blog CRUD ─── */
  const openAddBlog = () => { setEditBlogId(null); setBlogForm({ title: '', slug: '', content: '', excerpt: '', author: '', published: 0 }); setBlogModalTab('edit'); setShowBlogModal(true); };
  const openEditBlog = (b: Blog) => {
    setEditBlogId(b.id);
    setBlogForm({
      title: b.title, slug: b.slug, content: b.content,
      excerpt: b.excerpt, author: b.author, published: b.published,
      cover_image_url: b.cover_image_url,
    });
    setBlogModalTab('edit');
    setShowBlogModal(true);
  };

  const handleSaveBlog = async () => {
    if (!blogForm.title?.trim() || !blogForm.slug?.trim() || !blogForm.content?.trim()) {
      toast.error('Title, slug, and content are required'); return;
    }
    setSavingBlog(true);
    try {
      const url = editBlogId ? `/api/admin/blogs/${editBlogId}` : '/api/admin/blogs';
      const method = editBlogId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogForm),
      });
      if (!res.ok) throw new Error();
      toast.success(editBlogId ? 'Blog updated!' : 'Blog added!');
      setShowBlogModal(false);
      await loadBlogs();
    } catch { toast.error('Failed to save blog. Ensure slug is unique.'); }
    finally { setSavingBlog(false); }
  };

  const handleDeleteBlog = async (id: string, title: string) => {
    if (!confirm(`Delete blog "${title}" permanently?`)) return;
    try {
      await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
      toast.success(`"${title}" deleted.`);
      await loadBlogs();
    } catch { toast.error('Failed to delete blog.'); }
  };

  /* ─── Tool CRUD ─── */
  const openAdd = () => { setEditId(null); setForm(emptyForm()); setShowModal(true); };
  const openEdit = (t: AdminTool) => {
    setEditId(t.id);
    setForm({
      tool_name: t.tool_name, tool_url: t.tool_url, tool_logo: t.tool_logo,
      category: t.category, supported_outputs: t.supported_outputs,
      description: t.description, is_free: t.is_free, pricing_info: t.pricing_info,
      active: t.active, sort_order: t.sort_order, is_new: t.is_new,
      new_until: t.new_until,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.tool_name?.trim() || !form.tool_url?.trim()) {
      toast.error('Tool name and URL are required'); return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/admin/tools/${editId}` : '/api/admin/tools';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editId ? 'Tool updated!' : 'Tool added!');
      setShowModal(false);
      await loadTools();
      await loadStats();
    } catch { toast.error('Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/tools/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      setTools(prev => prev.map(t => t.id === id ? { ...t, active: !currentActive } : t));
      toast.success(currentActive ? 'Tool deactivated from launcher' : 'Tool activated on launcher');
      await loadStats();
    } catch { toast.error('Failed to toggle active state.'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" permanently?`)) return;
    try {
      await fetch(`/api/admin/tools/${id}`, { method: 'DELETE' });
      setTools(prev => prev.filter(t => t.id !== id));
      toast.success(`"${name}" deleted.`);
      await loadStats();
    } catch { toast.error('Failed to delete.'); }
  };

  /* ─── Live Chat Handlers ─── */
  const openAdminChat = (ticket: Ticket) => {
    // Clean up previous listener
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setActiveChat(ticket);
    setChatMessages([]);
    setChatInput('');
    setChatStatus(ticket.chat_status || 'waiting_for_admin');

    const pollMessages = async () => {
      try {
        const res = await fetch(`/api/support/tickets/${ticket.id}/messages`);
        if (res.ok) {
          const data = await res.json() as any;
          if (data.meta?.status) setChatStatus(data.meta.status);
          if (data.messages) {
            const msgs: ChatMsg[] = data.messages.map((msg: any) => ({
              id: msg.id,
              sender: msg.sender,
              senderName: msg.sender_name,
              text: msg.text,
              timestamp: new Date(msg.created_at).getTime(),
              type: msg.type,
            }));
            setChatMessages(msgs);
          }
        }
      } catch (err) {
        console.error('Admin polling error:', err);
      }
    };

    pollMessages();
    pollingIntervalRef.current = setInterval(pollMessages, 3000);
  };

  const closeAdminChat = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setActiveChat(null);
    setChatMessages([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAdminSendMsg = async () => {
    if (!chatInput.trim() || !activeChat || sendingMsg) return;
    setSendingMsg(true);

    try {
      await fetch(`/api/support/tickets/${activeChat.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chatInput.trim(), sender: 'admin' }),
      });
      setChatInput('');
    } catch {
      toast.error('Failed to send');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAssignAi = async () => {
    if (!activeChat) return;
    setAssigningAi(true);

    try {
      const res = await fetch(`/api/support/tickets/${activeChat.id}/assign-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        toast.success('AI Agent assigned to ticket');
        await loadTickets();
      } else {
        toast.error('Failed to assign AI');
      }
    } catch {
      toast.error('Error assigning AI');
    } finally {
      setAssigningAi(false);
    }
  };

  const handleTakeOver = async () => {
    if (!activeChat) return;

    try {
      await fetch(`/api/support/tickets/${activeChat.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Admin has taken over this conversation.', sender: 'admin' }),
      });
      toast.success('You have taken over the ticket');
      await loadTickets();
    } catch {
      toast.error('Failed to take over');
    }
  };

  const handleInitiateResolve = async () => {
    if (!activeChat) return;
    
    try {
      await fetch(`/api/support/tickets/${activeChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: 'Has your issue been resolved? Please confirm to close the ticket.', 
          sender: 'admin',
          type: 'resolution_request'
        }),
      });
      toast.success('Resolution request sent to user.');
      setChatInput('');
      await loadTickets();
    } catch {
      toast.error('Failed to initiate resolve');
    }
  };

  const handleDeleteTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Ticket deleted');
        if (activeChat?.id === ticketId) {
          closeAdminChat();
        }
        await loadTickets();
        await loadStats();
      } else {
        toast.error('Failed to delete ticket');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleResolveFromChat = async (autoSolution?: string) => {
    if (!activeChat) return;
    const solution = typeof autoSolution === 'string' ? autoSolution : (chatInput.trim() || 'Resolved via live chat.');
    setResolvingId(activeChat.id);

    try {
      const res = await fetch(`/api/support/tickets/${activeChat.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solution }),
      });
      if (res.ok) {
        toast.success('Ticket resolved!');
        setChatInput('');
        closeAdminChat();
        await loadTickets();
        await loadStats();
      }
    } catch {
      toast.error('Failed to resolve');
    } finally {
      setResolvingId(null);
    }
  };

  const toggleOutput = (o: string) => {
    setForm(f => ({
      ...f,
      supported_outputs: f.supported_outputs?.includes(o)
        ? f.supported_outputs.filter(x => x !== o)
        : [...(f.supported_outputs ?? []), o],
    }));
  };

  const handleLogout = async () => {
    document.cookie = 'co_admin_token=; Path=/; Max-Age=0';
    router.replace('/admin/login');
  };

  // Maps a tool to prep, teach, or support phase (aligned with user launcher page)
  const getToolPhase = (tool: AdminTool): string => {
    if (tool.category === 'text' || tool.category === 'research' || tool.id === 'notebooklm') return 'prep';
    if (tool.category === 'presentation' || tool.category === 'visual' || tool.id === 'ideogram') return 'teach';
    return 'support';
  };

  const getToolLogoUrl = (url: string, logo?: string) => {
    if (logo) return logo;
    try {
      const parsedUrl = new URL(url);
      return `https://www.google.com/s2/favicons?sz=128&domain=${parsedUrl.hostname}`;
    } catch {
      return `https://www.google.com/s2/favicons?sz=128&domain=${url}`;
    }
  };

  /* ─── Loading ─── */
  if (checking) return (
    <div className="min-h-screen bg-[#06040F] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  if (!authed) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'users', label: 'Users', icon: <Users size={16} /> },
    { id: 'tools', label: 'AI Tools Launchpad', icon: <Wrench size={16} /> },
    { 
      id: 'tickets', 
      label: 'Support Tickets', 
      icon: <LifeBuoy size={16} />, 
      badge: stats?.open_tickets_count && stats.open_tickets_count > 0 ? (
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0 ml-1.5" />
      ) : null 
    },
    { id: 'feedback', label: 'Feedback Reviews', icon: <MessageSquare size={16} /> },
    { id: 'blogs', label: 'Blogs (SEO)', icon: <BookOpen size={16} /> },
    { id: 'activity', label: 'Recent Activity', icon: <Clock size={16} /> },
    { id: 'waitlist', label: 'Waitlist Registry', icon: <Mail size={16} /> },
  ];

  // Filtering tools logic
  const filteredTools = tools.filter(t => {
    const matchesSearch = t.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const phase = getToolPhase(t);
    const matchesPhase = phaseFilter === 'all' || phase === phaseFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && t.active) || 
      (statusFilter === 'inactive' && !t.active);
    return matchesSearch && matchesPhase && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-mesh-gradient text-text-main relative selection:bg-primary/30">
      {/* Background radial effects */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[5%] left-[10%] w-[350px] h-[350px] bg-primary opacity-5 blur-[120px] rounded-full animate-pulse-glow" />
        <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] bg-indigo-500 opacity-[0.03] blur-[150px] rounded-full animate-breathe" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-[#06040F]/70 backdrop-blur-xl border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-surface border border-border overflow-hidden flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
                <Image src="/logo_transparent.png" alt="ClassOrbit Logo" width={40} height={40} className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-[16px] font-bold text-text-main leading-tight flex items-center gap-1.5 font-display">
                  ClassOrbit Admin
                  <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Ops
                  </span>
                </h1>
                <p className="text-[11px] text-text-muted">Control Panel & Registry</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { loadStats(); loadTools(); }}
                className="flex items-center gap-2 bg-surface hover:bg-background border border-border hover:border-primary/50 text-text-muted hover:text-text-main px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer shadow-sm"
              >
                <RefreshCw size={14} className="text-primary" />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer shadow-sm"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8">
          {/* Tabs */}
          <div className="flex gap-1 bg-surface/40 border border-border rounded-2xl p-1.5 w-fit mb-8 backdrop-blur-md overflow-x-auto max-w-full">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-glow'
                    : 'text-text-muted hover:text-text-main hover:bg-white/[0.02]'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {statsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={28} className="animate-spin text-primary" />
                </div>
              ) : stats ? (
                <>
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <StatCard icon={<FileText size={18} />} label="Total Prompts" value={stats.total_prompts} color="primary" onClick={() => setActiveTab('activity')} />
                    <StatCard icon={<Users size={18} />} label="Total Users" value={stats.unique_users} color="sky" onClick={() => setActiveTab('users')} />
                    <StatCard icon={<Crown size={18} />} label="Pro Users" value={stats.pro_users} color="amber" onClick={() => setActiveTab('users')} />
                    <StatCard icon={<LifeBuoy size={18} />} label="Open Tickets" value={stats.open_tickets_count ?? 0} color="rose" onClick={() => setActiveTab('tickets')} />
                    <StatCard icon={<Mail size={18} />} label="Waitlist" value={stats.waitlist_count} color="violet" onClick={() => setActiveTab('waitlist')} />
                    <StatCard icon={<Wrench size={18} />} label="Active Tools" value={stats.active_tools} color="emerald" onClick={() => setActiveTab('tools')} />
                    <StatCard icon={<ListOrdered size={18} />} label="Total Tools" value={stats.total_tools} color="rose" onClick={() => setActiveTab('tools')} />
                  </div>

                  {/* Active Launchpad Tools Grid (Direct-Manipulation View) */}
                  <div className="glass-panel border border-border rounded-3xl p-6 relative overflow-hidden shadow-soft">
                    <div className="absolute -right-12 -top-12 w-36 h-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-[18px] font-bold text-text-main flex items-center gap-2 font-display">
                          <Rocket size={18} className="text-primary animate-pulse" />
                          Active Launchpad Tools ({stats.active_tools})
                        </h3>
                        <p className="text-[12px] text-text-muted mt-0.5">These integrations are currently active and visible to all platform users.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('tools')} 
                        className="text-[12px] text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl"
                      >
                        Manage Registry →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {tools.filter(t => t.active).map(tool => (
                        <motion.div 
                          key={tool.id} 
                          whileHover={{ scale: 1.02 }}
                          onClick={() => openEdit(tool)}
                          className="glass-card rounded-2xl p-4 flex flex-col items-center text-center hover:border-primary/40 transition-all cursor-pointer relative group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center p-2 mb-3 shadow-sm shrink-0 overflow-hidden relative group-hover:scale-105 transition-transform duration-200">
                            <Image
                              src={getToolLogoUrl(tool.tool_url, tool.tool_logo)}
                              alt={tool.tool_name}
                              width={48}
                              height={48}
                              unoptimized
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <p className="text-[13px] font-bold text-text-main truncate w-full mb-1">{tool.tool_name}</p>
                          
                          <div className="flex gap-1.5 mt-1.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              getToolPhase(tool) === 'prep' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                              getToolPhase(tool) === 'teach' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 
                              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {getToolPhase(tool) === 'prep' ? 'Prep' : getToolPhase(tool) === 'teach' ? 'Teach' : 'Support'}
                            </span>
                            <span className="text-[9px] text-text-muted bg-white/[0.04] border border-border px-1.5 py-0.5 rounded-full">
                              #{tool.sort_order}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      {tools.filter(t => t.active).length === 0 && (
                        <div className="col-span-full text-center py-8 text-text-muted text-[13px] border border-dashed border-border rounded-2xl bg-white/[0.01]">
                          <ShieldAlert size={24} className="mx-auto mb-2 text-text-subtle" />
                          No active tools in the Launchpad. Toggle tools to active state in the registry tab.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tool Usage Popularity Analytics */}
                  <div className="glass-panel border border-border rounded-3xl p-6 relative overflow-hidden shadow-soft mb-8">
                    <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-[18px] font-bold text-text-main flex items-center gap-2 font-display">
                          <TrendingUp size={18} className="text-primary animate-pulse" />
                          Tool Usage Popularity Ranking
                        </h3>
                        <p className="text-[12px] text-text-muted mt-0.5">Ranking of all platform tools by usage and launches.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(stats.tool_usage ?? []).slice(0, 9).map((u, i) => (
                        <div key={u.tool_id || i} className="flex items-center gap-3 bg-white/[0.02] border border-border/50 rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
                          {/* Rank number badge */}
                          <div className="absolute right-3 top-3 text-[14px] font-extrabold text-white/[0.03] group-hover:text-white/[0.06] transition-colors font-display">
                            #{i + 1}
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                            <Image
                              src={`https://www.google.com/s2/favicons?sz=128&domain=${u.tool_name.toLowerCase().includes('http') ? u.tool_name : u.tool_name + '.com'}`}
                              alt={u.tool_name}
                              width={40}
                              height={40}
                              unoptimized
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-text-main truncate pr-6">{u.tool_name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-semibold text-primary">{u.count} uses</span>
                              <span className="text-text-subtle text-[10px]">·</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                                u.is_custom === 1 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {u.is_custom === 1 ? 'Custom' : 'System'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!stats.tool_usage || stats.tool_usage.length === 0) && (
                        <div className="col-span-full text-center py-6 text-text-muted text-[13px] border border-dashed border-border rounded-2xl">
                          No tool usage records generated yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent activity previews */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent prompts */}
                    <div className="glass-panel border border-border rounded-3xl p-6 shadow-soft">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[16px] font-bold text-text-main flex items-center gap-2 font-display">
                          <TrendingUp size={16} className="text-primary" />
                          Recent Prompt Operations
                        </h3>
                        <button onClick={() => setActiveTab('activity')} className="text-[12px] text-primary font-semibold hover:underline cursor-pointer">
                          View All
                        </button>
                      </div>
                      <div className="space-y-3">
                        {stats.recent_prompts.slice(0, 5).map((p, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/[0.02] border border-border/50 rounded-2xl px-4.5 py-3.5 hover:bg-white/[0.04] transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[12px] text-primary font-bold shrink-0">
                              {p.content_type?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-text-main truncate">{p.topic || 'Untitled Prompt'}</p>
                              <p className="text-[11px] text-text-muted truncate mt-0.5">{p.content_type?.replace(/_/g, ' ')} · User: {p.user_id?.slice(0, 8)}...</p>
                            </div>
                            <span className="text-[11px] text-text-subtle shrink-0">
                              {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        ))}
                        {stats.recent_prompts.length === 0 && (
                          <p className="text-[13px] text-text-muted text-center py-6">No prompt statistics logged.</p>
                        )}
                      </div>
                    </div>

                    {/* Recent waitlist */}
                    <div className="glass-panel border border-border rounded-3xl p-6 shadow-soft">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[16px] font-bold text-text-main flex items-center gap-2 font-display">
                          <UserCheck size={16} className="text-violet-400" />
                          Recent Waitlist Registrants
                        </h3>
                        <button onClick={() => setActiveTab('waitlist')} className="text-[12px] text-primary font-semibold hover:underline cursor-pointer">
                          View All
                        </button>
                      </div>
                      <div className="space-y-3">
                        {stats.recent_waitlist.slice(0, 5).map((w, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/[0.02] border border-border/50 rounded-2xl px-4.5 py-3.5 hover:bg-white/[0.04] transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-[12px] text-violet-400 font-bold shrink-0">
                              {(w.name || w.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-text-main truncate">{w.name || 'Anonymous Partner'}</p>
                              <p className="text-[11px] text-text-muted truncate mt-0.5">{w.email}</p>
                            </div>
                            <span className="text-[11px] text-text-subtle shrink-0">
                              {new Date(w.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        ))}
                        {stats.recent_waitlist.length === 0 && (
                          <p className="text-[13px] text-text-muted text-center py-6">No waitlist signups recorded.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 bg-surface/30 border border-border rounded-3xl">
                  <ShieldAlert size={36} className="text-text-subtle mx-auto mb-3" />
                  <p className="text-text-muted text-[14px]">Failed to load stats. Click Refresh.</p>
                </div>
              )}
            </div>
          )}

          {/* ── AI TOOLS REGISTRY ── */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[22px] font-bold text-text-main font-display">AI Tools Registry</h2>
                  <p className="text-[13px] text-text-muted mt-1">Configure launch configurations, visibility parameters, pricing structures, and sorting values.</p>
                </div>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold text-[13px] transition-all shadow-glow active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus size={18} /> Register AI Tool
                </button>
              </div>

              {/* Filtering Controls */}
              <div className="bg-surface/30 border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-sm shadow-sm">
                <div className="relative group w-full md:max-w-xs">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search tools registry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-background/80 border border-border rounded-xl pl-10 pr-4 py-2 text-[13px] w-full focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-text-main placeholder:text-text-subtle"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <select
                      value={phaseFilter}
                      onChange={(e) => setPhaseFilter(e.target.value)}
                      className="bg-background/80 border border-border rounded-xl px-3.5 py-2 text-[13px] text-text-main focus:outline-none focus:border-primary transition-all cursor-pointer font-medium"
                    >
                      <option value="all">All Launchpad Phases</option>
                      <option value="prep">Preparation Phase</option>
                      <option value="teach">Visuals & Slides Phase</option>
                      <option value="support">Differentiation Phase</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-background/80 border border-border rounded-xl px-3.5 py-2 text-[13px] text-text-main focus:outline-none focus:border-primary transition-all cursor-pointer font-medium"
                    >
                      <option value="all">All Registry Status</option>
                      <option value="active">Active in Launchpad</option>
                      <option value="inactive">Disabled / Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {toolsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={28} className="animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredTools.map(tool => {
                    const phase = getToolPhase(tool);
                    return (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`glass-card rounded-[24px] p-6 flex flex-col h-[300px] border transition-all relative ${
                          tool.active ? 'border-border' : 'border-white/[0.04] opacity-50 bg-black/10'
                        }`}
                      >
                        <div className="flex-grow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white border border-border shadow-sm overflow-hidden flex items-center justify-center p-2 shrink-0">
                              <Image
                                src={getToolLogoUrl(tool.tool_url, tool.tool_logo)}
                                alt={tool.tool_name}
                                width={48}
                                height={48}
                                unoptimized
                                className="w-full h-full object-contain"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              {tool.is_new && (
                                <span className="text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  NEW
                                </span>
                              )}
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                tool.is_free 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-white/5 text-text-muted border-white/10'
                              }`}>
                                {tool.is_free ? 'Free' : 'Pro'}
                              </span>
                            </div>
                          </div>

                          <h3 className="font-display font-bold text-[18px] text-text-main mb-1.5 truncate">
                            {tool.tool_name}
                          </h3>
                          <p className="text-[12px] text-text-muted leading-relaxed line-clamp-2 h-[36px] overflow-hidden mb-3">
                            {tool.description || 'No tool description provided.'}
                          </p>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                              phase === 'prep' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              phase === 'teach' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              Phase: {phase === 'prep' ? 'Prep' : phase === 'teach' ? 'Teach' : 'Support'}
                            </span>
                            <span className="text-[10px] text-text-muted bg-white/[0.03] border border-border px-2 py-1 rounded-full uppercase tracking-wider">
                              Category: {tool.category}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                          <span className="text-[11px] font-mono text-text-subtle font-semibold">
                            Sort: #{tool.sort_order}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <a 
                              href={tool.tool_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="w-8 h-8 rounded-lg border border-border bg-background hover:border-primary flex items-center justify-center text-text-subtle hover:text-primary transition-colors cursor-pointer" 
                              title="Test Launch Link"
                            >
                              <ExternalLink size={14} />
                            </a>
                            <button 
                              onClick={() => openEdit(tool)} 
                              className="w-8 h-8 rounded-lg border border-border bg-background hover:border-primary flex items-center justify-center text-text-subtle hover:text-primary transition-colors cursor-pointer" 
                              title="Edit Parameters"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleToggle(tool.id, tool.active)} 
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                                tool.active 
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                                  : 'border-border bg-background text-text-subtle hover:text-text-main'
                              }`} 
                              title={tool.active ? 'Deactivate (Hide)' : 'Activate (Show)'}
                            >
                              {tool.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                            <button 
                              onClick={() => handleDelete(tool.id, tool.tool_name)} 
                              className="w-8 h-8 rounded-lg border border-border bg-background hover:border-red-500 hover:bg-red-500/10 flex items-center justify-center text-text-subtle hover:text-red-400 transition-colors cursor-pointer" 
                              title="Delete Permanently"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {filteredTools.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-surface/30 border border-border rounded-3xl">
                      <Search size={32} className="text-text-subtle mx-auto mb-3" />
                      <p className="text-text-muted text-[14px] font-bold">No registry tools matched your filter criteria.</p>
                      <button 
                        onClick={() => { setSearchQuery(''); setPhaseFilter('all'); setStatusFilter('all'); }} 
                        className="text-[12px] text-primary font-semibold hover:underline mt-2 cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* User Custom Tools Registry */}
              <div className="pt-8 border-t border-border mt-10">
                <div className="mb-6">
                  <h3 className="text-[18px] font-bold text-text-main flex items-center gap-2 font-display">
                    <Users size={18} className="text-violet-400" />
                    User-Registered Custom Tools
                  </h3>
                  <p className="text-[12px] text-text-muted mt-0.5">Integrations registered directly by platform users.</p>
                </div>
                
                {stats?.custom_tools?.length ? (
                  <div className="glass-panel border border-border rounded-2xl overflow-hidden shadow-soft">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border text-[11px] font-bold text-text-muted uppercase tracking-wider bg-white/[0.01]">
                            <th className="px-6 py-4">Tool Details</th>
                            <th className="px-6 py-4">Owner Email</th>
                            <th className="px-6 py-4">Launch URL</th>
                            <th className="px-6 py-4">Date Registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.custom_tools.map((c) => (
                            <tr key={c.id} className="border-b border-border/50 hover:bg-white/[0.01] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                    <Image
                                      src={`https://www.google.com/s2/favicons?sz=128&domain=${c.tool_url}`}
                                      alt={c.tool_name}
                                      width={32}
                                      height={32}
                                      unoptimized
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-[13px] font-semibold text-text-main">{c.tool_name}</p>
                                    <span className="text-[10px] text-text-muted capitalize">{c.category}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[13px] text-text-muted font-medium">{c.user_email || 'N/A (Deleted)'}</td>
                              <td className="px-6 py-4 text-[13px] text-primary hover:underline font-mono truncate max-w-xs">
                                <a href={c.tool_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                  {c.tool_url}
                                  <ExternalLink size={12} className="inline" />
                                </a>
                              </td>
                              <td className="px-6 py-4 text-[13px] text-text-muted">
                                {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-surface/30 border border-border border-dashed rounded-3xl">
                    <p className="text-text-muted text-[13px]">No user custom tools registered yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── USER FEEDBACK REVIEWS ── */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[20px] font-bold text-text-main font-display">User Feedback & Reviews</h2>
                <p className="text-[13px] text-text-muted mt-1">Check star ratings and constructive platform feedback submitted by users.</p>
              </div>

              {statsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
              ) : stats ? (
                <>
                  {/* Summary card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel border border-border rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-soft">
                      <div className="absolute right-4 top-4 text-primary opacity-10">
                        <Star size={72} fill="currentColor" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Average Star Rating</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[48px] font-extrabold text-text-main leading-none font-display">
                            {stats.feedback_avg ? Number(stats.feedback_avg).toFixed(1) : '0.0'}
                          </span>
                          <span className="text-text-muted text-[16px]">/ 5.0</span>
                        </div>
                      </div>
                      {/* Star icons */}
                      <div className="flex items-center gap-1.5 mt-4">
                        {[1, 2, 3, 4, 5].map((s) => {
                          const avg = stats.feedback_avg ?? 0;
                          const fill = s <= avg;
                          return (
                            <Star 
                              key={s} 
                              size={18} 
                              className={fill ? "text-amber-400" : "text-text-muted"} 
                              fill={fill ? "currentColor" : "none"} 
                            />
                          );
                        })}
                        <span className="text-[12px] text-text-muted ml-2">({stats.feedback_count} ratings)</span>
                      </div>
                    </div>

                    <div className="glass-panel border border-border rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-soft">
                      <div className="absolute right-4 top-4 text-violet-400 opacity-10">
                        <MessageSquare size={72} fill="currentColor" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Total Feedback Received</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[48px] font-extrabold text-text-main leading-none font-display">
                            {stats.feedback_count ?? 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-[12px] text-text-muted mt-4">Reviews submitted every 3-day prompt intervals until completed.</p>
                    </div>
                  </div>

                  {/* Reviews feed */}
                  <div className="glass-panel border border-border rounded-3xl p-6 shadow-soft">
                    <h3 className="text-[16px] font-bold text-text-main mb-5 flex items-center gap-2 font-display">
                      <MessageSquare size={16} className="text-primary" />
                      Constructive Feedback Log
                    </h3>

                    <div className="space-y-4">
                      {(stats.feedback_list ?? []).map((f, i) => (
                        <div key={i} className="bg-white/[0.02] border border-border/50 rounded-2xl p-5 hover:bg-white/[0.04] transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[12px] font-bold text-primary">
                                {(f.user_email || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[13px] font-bold text-text-main">{f.user_email || 'Anonymous Teacher'}</p>
                                <span className="text-[10px] text-text-muted">
                                  {new Date(f.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            {/* Stars badge */}
                            <div className="flex items-center gap-1 bg-background/50 border border-border px-2.5 py-1 rounded-xl w-fit">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  size={12} 
                                  className={s <= f.rating ? "text-amber-400" : "text-text-muted"} 
                                  fill={s <= f.rating ? "currentColor" : "none"} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-[13px] text-text-muted leading-relaxed whitespace-pre-wrap pl-11">
                            {f.feedback || <span className="italic text-text-subtle">No commentary left (rating only)</span>}
                          </p>
                        </div>
                      ))}

                      {(!stats.feedback_list || stats.feedback_list.length === 0) && (
                        <div className="text-center py-12 bg-background/30 border border-dashed border-border rounded-2xl">
                          <p className="text-text-muted text-[13px]">No platform feedback reviews recorded yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 bg-surface/30 border border-border rounded-3xl">
                  <ShieldAlert size={36} className="text-text-subtle mx-auto mb-3" />
                  <p className="text-text-muted text-[14px]">Failed to load feedback. Click Refresh.</p>
                </div>
              )}
            </div>
          )}

          {/* ── RECENT ACTIVITY ── */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[20px] font-bold text-text-main font-display">Recent System Actions</h2>
                <p className="text-[13px] text-text-muted mt-1">Detailed logs of recent prompt optimization requests executed on the ClassOrbit core engine.</p>
              </div>

              {statsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
              ) : stats?.recent_prompts.length ? (
                <div className="glass-panel border border-border rounded-2xl overflow-hidden shadow-soft">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-[11px] font-bold text-text-muted uppercase tracking-wider bg-white/[0.01]">
                          <th className="px-6 py-4">User ID / Node Address</th>
                          <th className="px-6 py-4">Topic / Parameter</th>
                          <th className="px-6 py-4">Content Output Type</th>
                          <th className="px-6 py-4">Timestamp (IST)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent_prompts.map((p, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4 text-[12px] text-text-muted font-mono">{p.user_id}</td>
                            <td className="px-6 py-4 text-[13px] text-text-main font-semibold">{p.topic || 'Untitled Prompt Parameter'}</td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                {p.content_type?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[13px] text-text-muted">
                              {new Date(p.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-surface/30 border border-border rounded-3xl">
                  <Clock size={32} className="text-text-subtle mx-auto mb-3" />
                  <p className="text-text-muted text-[14px]">No prompt operations logged yet.</p>
                </div>
              )}
            </div>
          )}

          {/* ── USERS REGISTRY ── */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[20px] font-bold text-text-main font-display">User Management</h2>
                <p className="text-[13px] text-text-muted mt-1">Manage user accounts, subscriptions, and access permissions.</p>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
              ) : users?.length ? (
                <div className="glass-panel border border-border rounded-2xl overflow-hidden shadow-soft">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-[11px] font-bold text-text-muted uppercase tracking-wider bg-white/[0.01]">
                          <th className="px-6 py-4">User ID</th>
                          <th className="px-6 py-4">Plan & Status</th>
                          <th className="px-6 py-4">Joined / Expires</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                         {users.map((u, i) => (
                          <tr key={i} className={`border-b border-border/50 transition-colors ${u.is_blocked ? 'bg-red-500/5' : 'hover:bg-white/[0.01]'}`}>
                            <td className="px-6 py-4">
                              {u.email ? (
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-[13px] font-bold text-text-main">{u.name || 'Anonymous Teacher'}</p>
                                  <span className="text-[11px] text-text-muted">{u.email}</span>
                                  <span className="text-[9px] text-text-subtle font-mono mt-0.5">{u.user_id}</span>
                                </div>
                              ) : (
                                <span className="text-[13px] text-text-main font-semibold font-mono truncate max-w-[200px] block">
                                  {u.user_id}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  u.plan_type === 'pro' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-text-muted border border-border'
                                }`}>
                                  {u.plan_type}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                  u.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                  u.subscription_status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                  'bg-white/5 text-text-muted border-border'
                                }`}>
                                  {u.subscription_status}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-[12px] text-text-main">
                                Joined: {new Date(u.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                              </p>
                              {u.plan_expires_at && (
                                <p className="text-[11px] text-text-muted mt-0.5">
                                  Expires: {new Date(u.plan_expires_at).toLocaleDateString('en-IN')}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/admin/users/${u.user_id}/block`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ is_blocked: !u.is_blocked }),
                                    });
                                    if (res.ok) {
                                      toast.success(`User ${!u.is_blocked ? 'blocked' : 'unblocked'}`);
                                      loadUsers();
                                    }
                                  } catch {
                                    toast.error('Failed to update block status');
                                  }
                                }}
                                className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-colors cursor-pointer border ${
                                  u.is_blocked
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                }`}
                              >
                                {u.is_blocked ? 'Unblock' : 'Block User'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-surface/30 border border-border rounded-3xl">
                  <Users size={32} className="text-text-subtle mx-auto mb-3" />
                  <p className="text-text-muted text-[14px]">No users found in the database.</p>
                </div>
              )}
            </div>
          )}

          {/* ── SUPPORT TICKETS (LIVE DASHBOARD) ── */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[20px] font-bold text-text-main font-display">Live Support Dashboard</h2>
                  <p className="text-[13px] text-text-muted mt-1">Real-time customer support with live chat, AI agent delegation, and ticket resolution.</p>
                </div>
                <button onClick={() => { loadTickets(); }} className="flex items-center gap-2 bg-surface hover:bg-background border border-border hover:border-primary/50 text-text-muted hover:text-text-main px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer shadow-sm shrink-0">
                  <RefreshCw size={14} className="text-primary" /> Refresh Tickets
                </button>
              </div>

              {/* Filtering Controls */}
              <div className="bg-surface/30 border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-sm shadow-sm">
                <div className="relative group w-full md:max-w-xs">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={ticketSearchQuery}
                    onChange={(e) => setTicketSearchQuery(e.target.value)}
                    className="bg-background/80 border border-border rounded-xl pl-10 pr-4 py-2 text-[13px] w-full focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-text-main placeholder:text-text-subtle"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <select value={ticketFilter} onChange={(e) => setTicketFilter(e.target.value as any)} className="bg-background/80 border border-border rounded-xl px-3.5 py-2 text-[13px] text-text-main focus:outline-none focus:border-primary transition-all cursor-pointer font-medium">
                    <option value="all">All Tickets</option>
                    <option value="open">Open Tickets</option>
                    <option value="resolved">Resolved Tickets</option>
                  </select>
                </div>
              </div>

              {ticketsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
              ) : (
                <div className="flex gap-6 h-[700px]">
                  {/* ─── Left: Ticket List ─── */}
                  <div className={`overflow-y-auto max-h-[700px] custom-scrollbar ${activeChat ? 'w-[360px] shrink-0 space-y-3' : 'w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start'}`}>
                    {tickets
                      .filter(t => {
                        const matchesStatus = ticketFilter === 'all' || t.status === ticketFilter;
                        const matchesSearch = t.id.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || t.message.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || (t.user_email || '').toLowerCase().includes(ticketSearchQuery.toLowerCase()) || (t.user_name || '').toLowerCase().includes(ticketSearchQuery.toLowerCase());
                        return matchesStatus && matchesSearch;
                      })
                      .map((ticket) => {
                        const isActive = activeChat?.id === ticket.id;
                        const cs = ticket.chat_status || ticket.status;
                        const statusColor = cs === 'resolved' ? 'emerald' : cs === 'ai_agent_active' ? 'violet' : cs === 'admin_active' ? 'emerald' : 'amber';
                        const statusLabel = cs === 'resolved' ? 'Resolved' : cs === 'ai_agent_active' ? 'AI Agent' : cs === 'admin_active' ? 'Admin Active' : 'Waiting';
                        const StatusIcon = cs === 'ai_agent_active' ? Bot : cs === 'admin_active' ? User : cs === 'resolved' ? CheckCircle2 : Clock;

                        return (
                          <div
                            key={ticket.id}
                            onClick={() => ticket.status === 'open' ? openAdminChat(ticket) : undefined}
                            className={`glass-panel border rounded-2xl p-4 transition-all ${
                              isActive ? 'border-primary/40 bg-primary/[0.03] ring-1 ring-primary/20' :
                              ticket.status === 'open' ? 'border-amber-500/15 hover:border-primary/30 cursor-pointer' :
                              'border-border/50 opacity-70'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold bg-${statusColor}-500/10 text-${statusColor}-400 border border-${statusColor}-500/20`}>
                                  <StatusIcon size={14} />
                                </div>
                                <div>
                                  <h4 className="text-[13px] font-bold text-text-main leading-tight">{ticket.user_name || 'Anonymous'}</h4>
                                  <p className="text-[10px] text-text-muted font-mono">{ticket.id}</p>
                                </div>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border flex items-center gap-1 bg-${statusColor}-500/10 text-${statusColor}-400 border-${statusColor}-500/20 ${cs === 'waiting_for_admin' ? 'animate-pulse' : ''}`}>
                                {statusLabel}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-text-muted italic line-clamp-2">&quot;{ticket.message}&quot;</p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[10px] text-text-subtle">{new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => handleDeleteTicket(ticket.id, e)}
                                  className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors cursor-pointer border border-rose-500/20"
                                  title="Delete Ticket"
                                >
                                  <Trash2 size={12} />
                                </button>
                                {ticket.status === 'open' && <span className="text-[10px] text-primary font-semibold">Open Chat →</span>}
                              </div>
                            </div>

                            {/* Resolved Solution (inline for resolved tickets) */}
                            {ticket.status === 'resolved' && ticket.solution && (
                              <div className="mt-2 bg-emerald-500/5 border-l-2 border-emerald-500 p-2.5 rounded-r-xl text-[11.5px]">
                                <span className="font-bold text-emerald-400 block mb-0.5">Solution:</span>
                                <p className="text-text-muted whitespace-pre-wrap line-clamp-3">{ticket.solution}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    {tickets.filter(t => {
                      const matchesStatus = ticketFilter === 'all' || t.status === ticketFilter;
                      const matchesSearch = t.id.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || t.message.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || (t.user_email || '').toLowerCase().includes(ticketSearchQuery.toLowerCase()) || (t.user_name || '').toLowerCase().includes(ticketSearchQuery.toLowerCase());
                      return matchesStatus && matchesSearch;
                    }).length === 0 && (
                      <div className="text-center py-20 bg-surface/30 border border-border rounded-3xl">
                        <LifeBuoy size={32} className="text-text-subtle mx-auto mb-3" />
                        <p className="text-text-muted text-[14px]">No support tickets found matching criteria.</p>
                      </div>
                    )}
                  </div>

                  {/* ─── Right: Live Chat Panel ─── */}
                  {activeChat && (
                    <div className="flex-1 glass-panel border border-border rounded-3xl flex flex-col overflow-hidden shadow-soft relative">
                      {/* Chat header */}
                      <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-white/[0.01]">
                        <div className="flex items-center gap-3">
                          <button onClick={closeAdminChat} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-text-main transition-colors cursor-pointer">
                            <ArrowLeft size={16} />
                          </button>
                          <div>
                            <h3 className="text-[14px] font-bold text-text-main font-display flex items-center gap-2">
                              {activeChat.user_name || 'Anonymous User'}
                              <span className="text-[10px] font-mono text-text-subtle font-normal">({activeChat.id})</span>
                            </h3>
                            <div className={`flex items-center gap-1 text-[10px] font-semibold ${
                              chatStatus === 'admin_active' ? 'text-emerald-400' :
                              chatStatus === 'ai_agent_active' ? 'text-violet-400' :
                              chatStatus === 'resolved' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {chatStatus === 'ai_agent_active' ? <Bot size={11} /> : chatStatus === 'admin_active' ? <User size={11} /> : chatStatus === 'resolved' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                              {chatStatus === 'ai_agent_active' ? 'AI Agent Active' : chatStatus === 'admin_active' ? 'You are connected' : chatStatus === 'resolved' ? 'Resolved' : 'Waiting for response'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Chat messages */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-3">
                        {chatMessages.length === 0 && (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                              <Loader2 size={24} className="animate-spin text-primary mx-auto mb-3" />
                              <p className="text-[12px] text-text-muted">Connecting to chat room...</p>
                            </div>
                          </div>
                        )}
                        {chatMessages.map((msg) => {
                          const isUser = msg.sender === 'user';
                          const isSystem = msg.sender === 'system' || msg.type === 'system';
                          const isResolution = msg.type === 'resolution';
                          const isAi = msg.sender === 'ai_agent';
                          const isAdmin = msg.sender === 'admin';

                          if (isSystem) {
                            return (
                              <div key={msg.id} className="flex justify-center my-1">
                                <span className="text-[10px] text-text-subtle bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-full">{msg.text}</span>
                              </div>
                            );
                          }

                          if (isResolution) {
                            return (
                              <div key={msg.id} className="my-2">
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-3 text-[12.5px]">
                                  <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1"><CheckCircle2 size={13} /> Resolution</span>
                                  <p className="text-text-muted whitespace-pre-wrap">{msg.text}</p>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                              <div className="flex flex-col gap-0.5 max-w-[75%]">
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${isUser ? 'ml-1' : 'mr-1 justify-end'} ${
                                  isAi ? 'text-violet-400' : isAdmin ? 'text-emerald-400' : 'text-text-muted'
                                }`}>
                                  {isAi ? <Bot size={10} /> : isAdmin ? <User size={10} /> : null}
                                  {msg.senderName}
                                </span>
                                <div className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                                  isUser ? 'bg-white/5 border border-white/[0.06] text-text-main rounded-tl-none' :
                                  isAi ? 'bg-violet-500/10 border border-violet-500/15 text-text-main rounded-tr-none' :
                                  'bg-primary text-white rounded-tr-none shadow-md shadow-primary/10'
                                }`}>
                                  <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <span className={`text-[9px] text-text-subtle ${isUser ? 'ml-1' : 'mr-1 text-right'}`}>
                                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat input */}
                      {chatStatus !== 'resolved' && (
                        <div className="flex flex-col border-t border-border shrink-0 bg-white/[0.01]">
                          <div className="px-4 py-2.5 border-b border-border/50 flex flex-wrap items-center gap-2 bg-background/50">
                            {chatStatus === 'ai_agent_active' && (
                              <button onClick={handleTakeOver} className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[11px] font-bold border border-primary/20 transition-all cursor-pointer flex items-center gap-1.5">
                                <User size={12} /> Take Over
                              </button>
                            )}
                            {chatStatus !== 'ai_agent_active' && (
                              <button onClick={handleAssignAi} disabled={assigningAi} className="px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg text-[11px] font-bold border border-violet-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                                {assigningAi ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                                Assign AI Agent
                              </button>
                            )}
                            <button onClick={handleInitiateResolve} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-bold border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5">
                              <CheckCircle2 size={12} /> Request Resolution
                            </button>
                            
                            <div className="w-px h-4 bg-border mx-2" />
                            
                            <button onClick={() => handleResolveFromChat('Resolved via live chat.')} disabled={resolvingId === activeChat.id} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-main rounded-lg text-[11px] font-bold border border-border transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                              {resolvingId === activeChat.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                              Force Resolve
                            </button>
                          </div>
                          
                          <div className="p-4 flex items-center gap-2">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAdminSendMsg(); }}
                              placeholder="Type your message to the user..."
                              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-[13px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                            />
                            <button
                              onClick={handleAdminSendMsg}
                              disabled={!chatInput.trim() || sendingMsg}
                              className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0 disabled:opacity-40"
                            >
                              {sendingMsg ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── WAITLIST REGISTRY ── */}
          {activeTab === 'waitlist' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[20px] font-bold text-text-main font-display">Waitlist Registry</h2>
                <p className="text-[13px] text-text-muted mt-1">Partners and early access subscribers requesting product updates or trial accounts.</p>
              </div>

              {statsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
              ) : stats?.recent_waitlist.length ? (
                <div className="glass-panel border border-border rounded-2xl overflow-hidden shadow-soft">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-[11px] font-bold text-text-muted uppercase tracking-wider bg-white/[0.01]">
                          <th className="px-6 py-4">Contact Name</th>
                          <th className="px-6 py-4">Registered Email Address</th>
                          <th className="px-6 py-4">Subscription Timestamp (IST)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent_waitlist.map((w, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4 text-[13px] text-text-main font-semibold">{w.name || 'Anonymous Partner'}</td>
                            <td className="px-6 py-4 text-[13px] text-text-muted font-medium select-all">{w.email}</td>
                            <td className="px-6 py-4 text-[13px] text-text-muted">
                              {new Date(w.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-surface/30 border border-border rounded-3xl">
                  <Mail size={32} className="text-text-subtle mx-auto mb-3" />
                  <p className="text-text-muted text-[14px]">No subscribers registered in the waitlist database.</p>
                </div>
              )}
            </div>
          )}

          {/* ── BLOGS REGISTRY ── */}
          {activeTab === 'blogs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-text-main font-display">Blogs Registry</h2>
                  <p className="text-[13px] text-text-muted mt-1">Manage SEO blogs and articles.</p>
                </div>
                <button
                  onClick={openAddBlog}
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-[13px] font-bold shadow-glow flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={16} /> Add Blog
                </button>
              </div>

              {blogsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
              ) : blogs.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogs.map(b => (
                    <div key={b.id} className="glass-panel border border-border rounded-3xl p-6 relative overflow-hidden shadow-soft hover:border-primary/30 transition-all flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-[16px] text-text-main line-clamp-2">{b.title}</h3>
                          <p className="text-[12px] text-text-subtle mt-1 flex items-center gap-1.5 font-mono">
                            /blogs/{b.slug}
                          </p>
                        </div>
                      </div>
                      <p className="text-[13px] text-text-muted line-clamp-3 mb-6 flex-1">
                        {b.excerpt || b.content.substring(0, 100) + '...'}
                      </p>
                      <div className="flex items-center justify-between border-t border-border pt-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          b.published ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {b.published ? 'Published' : 'Draft'}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => openEditBlog(b)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-text-main transition-colors cursor-pointer">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteBlog(b.id, b.title)} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-surface/30 border border-border rounded-3xl">
                  <BookOpen size={32} className="text-text-subtle mx-auto mb-3" />
                  <p className="text-text-muted text-[14px]">No blogs added yet.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Add/Edit Tool Modal ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-[#06040F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-[28px] w-full max-w-[620px] p-7 md:p-8 shadow-2xl relative my-8 text-left"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-[20px] font-bold text-text-main flex items-center gap-2">
                  <Rocket size={20} className="text-primary animate-float" />
                  {editId ? 'Modify System Integration' : 'Register New AI Tool'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-text-subtle hover:text-text-main transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                {/* Name + URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Tool Name *</label>
                    <input value={form.tool_name ?? ''} onChange={e => setForm(f => ({ ...f, tool_name: e.target.value }))} placeholder="e.g. Perplexity AI" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Tool Launch URL *</label>
                    <input value={form.tool_url ?? ''} onChange={e => setForm(f => ({ ...f, tool_url: e.target.value }))} placeholder="https://perplexity.ai" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Description</label>
                  <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Explain what this tool is best for (visible to users on launchpad)..." rows={3} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none" />
                </div>

                {/* Category + Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Core Category (Builder Mapping)</label>
                    <select value={form.category ?? 'text'} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main focus:outline-none focus:border-primary transition-all cursor-pointer font-medium">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Pricing Information (Subtext)</label>
                    <input value={form.pricing_info ?? ''} onChange={e => setForm(f => ({ ...f, pricing_info: e.target.value }))} placeholder="e.g. Free Tier, Pro ₹999/mo" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                </div>

                {/* Sort order + Logo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Launchpad Sort Order</label>
                    <input type="number" value={form.sort_order ?? 0} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Custom Logo URL (Favicon fallback active)</label>
                    <input value={form.tool_logo ?? ''} onChange={e => setForm(f => ({ ...f, tool_logo: e.target.value }))} placeholder="https://domain.com/logo.png" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                </div>

                {/* Supported outputs */}
                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2.5">Supported Content Types (Builder integration)</label>
                  <div className="flex flex-wrap gap-2">
                    {OUTPUT_OPTIONS.map(o => {
                      const active = form.supported_outputs?.includes(o);
                      return (
                        <button 
                          key={o} 
                          type="button" 
                          onClick={() => toggleOutput(o)} 
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            active 
                              ? 'bg-primary/10 border-primary text-primary' 
                              : 'bg-background border-border text-text-muted hover:border-text-subtle'
                          }`}
                        >
                          {o.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-6 pt-3 border-t border-border">
                  {[
                    { key: 'is_free', label: 'Offer Free Tier' },
                    { key: 'active', label: 'Active on Launchpad' },
                    { key: 'is_new', label: 'Mark as NEW Feature' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => setForm(f => ({ ...f, [key]: !(f as any)[key] }))}
                        className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${
                          (form as any)[key] ? 'bg-primary shadow-glow' : 'bg-background border border-border'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${
                          (form as any)[key] ? 'left-5.5' : 'left-0.5'
                        }`} />
                      </div>
                      <span className="text-[12px] font-semibold text-text-muted group-hover:text-text-main transition-colors select-none">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-border pt-5">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-[13px] text-text-muted hover:bg-white/[0.04] transition-colors cursor-pointer">
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold text-[13px] transition-colors shadow-glow flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editId ? 'Save Configurations' : 'Register Integration'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add/Edit Blog Modal ── */}
      <AnimatePresence>
        {showBlogModal && (
          <div className="fixed inset-0 bg-[#06040F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-[28px] w-full max-w-[800px] p-7 md:p-8 shadow-2xl relative my-8 text-left"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-[20px] font-bold text-text-main flex items-center gap-2">
                  <BookOpen size={20} className="text-primary" />
                  {editBlogId ? 'Edit Blog' : 'Create New Blog'}
                </h3>
                <button onClick={() => setShowBlogModal(false)} className="text-text-subtle hover:text-text-main transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]">
                  <X size={20} />
                </button>
              </div>

              {/* Edit / Preview tabs */}
              <div className="flex gap-1 bg-background/60 border border-border rounded-xl p-1 w-fit mb-5">
                <button
                  onClick={() => setBlogModalTab('edit')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                    blogModalTab === 'edit' ? 'bg-primary text-white shadow-glow' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => setBlogModalTab('preview')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                    blogModalTab === 'preview' ? 'bg-primary text-white shadow-glow' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Eye size={14} /> Preview
                </button>
              </div>

              {blogModalTab === 'preview' ? (
                <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  {!blogForm.title?.trim() && !blogForm.content?.trim() ? (
                    <div className="text-center py-20 text-text-muted text-[13px] border border-dashed border-border rounded-2xl">
                      Nothing to preview yet, add a title and content in the Edit tab.
                    </div>
                  ) : (
                    <div className="bg-mesh-gradient rounded-2xl p-6 md:p-8">
                      <div className="mb-6">
                        <span className="text-[12px] text-text-subtle">
                          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {blogForm.author ? ` · ${blogForm.author}` : ''}
                        </span>
                        <h1 className="font-display text-[28px] md:text-[36px] font-extrabold text-white leading-tight mt-2">
                          {blogForm.title || 'Untitled Post'}
                        </h1>
                      </div>
                      <BlogContent content={blogForm.content ?? ''} />
                    </div>
                  )}
                </div>
              ) : (
              <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Blog Title *</label>
                    <input value={blogForm.title ?? ''} onChange={e => setBlogForm(f => ({ ...f, title: e.target.value, slug: editBlogId ? f.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }))} placeholder="e.g. 5 AI Prompts for Teachers" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">URL Slug *</label>
                    <input value={blogForm.slug ?? ''} onChange={e => setBlogForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. 5-ai-prompts" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Excerpt (Short Summary)</label>
                  <textarea value={blogForm.excerpt ?? ''} onChange={e => setBlogForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Brief description for SEO and preview cards..." rows={2} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none" />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Content (HTML/Markdown) *</label>
                  <textarea value={blogForm.content ?? ''} onChange={e => setBlogForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your blog content here..." rows={12} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-y font-mono" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Author Name</label>
                    <input value={blogForm.author ?? ''} onChange={e => setBlogForm(f => ({ ...f, author: e.target.value }))} placeholder="e.g. ClassOrbit Team" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer group mb-3">
                      <div
                        onClick={() => setBlogForm(f => ({ ...f, published: f.published ? 0 : 1 }))}
                        className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${
                          blogForm.published ? 'bg-primary shadow-glow' : 'bg-background border border-border'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${
                          blogForm.published ? 'left-5.5' : 'left-0.5'
                        }`} />
                      </div>
                      <span className="text-[13px] font-bold text-text-main select-none">Publish to Website</span>
                    </label>
                  </div>
                </div>
              </div>
              )}

              <div className="mt-8 flex justify-end gap-3 border-t border-border pt-5">
                <button onClick={() => setShowBlogModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-[13px] text-text-muted hover:bg-white/[0.04] transition-colors cursor-pointer">
                  Cancel
                </button>
                <button 
                  onClick={handleSaveBlog} 
                  disabled={savingBlog} 
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold text-[13px] transition-colors shadow-glow flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {savingBlog && <Loader2 size={16} className="animate-spin" />}
                  {editBlogId ? 'Save Blog' : 'Create Blog'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
