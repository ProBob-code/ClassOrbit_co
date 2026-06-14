'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTools } from '@/context/ToolsContext';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { 
  Search, Rocket, Sparkles, PenTool, Presentation, Puzzle, ExternalLink, Loader2, Plus, Trash2, X
} from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';

interface Launchphase {
  id: string;
  name: string;
  icon: any;
  desc: string;
  categories: string[];
}

const classroomPhases: Launchphase[] = [
  {
    id: 'prep',
    name: 'Preparation',
    icon: PenTool,
    desc: 'Draft lesson maps, quizzes, rubrics, and reading material.',
    categories: ['text', 'research'],
  },
  {
    id: 'teach',
    name: 'Visuals & Slides',
    icon: Presentation,
    desc: 'Create beautiful outlines, presentable slide decks, and diagrams.',
    categories: ['presentation', 'visual', 'audio', 'image'],
  },
  {
    id: 'support',
    name: 'Differentiation',
    icon: Puzzle,
    desc: 'Construct personal student audio summaries and research mappings.',
    categories: ['research', 'audio', 'text'],
  }
];

export default function LaunchpadPage() {
  const { profile, loading } = useUser();
  const { tools: systemTools, newTools } = useTools();
  const [activePhase, setActivePhase] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  // Custom AI Tools state
  const [customTools, setCustomTools] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toolUrl, setToolUrl] = useState('');
  const [toolName, setToolName] = useState('');
  const [toolDesc, setToolDesc] = useState('');
  const [toolCategory, setToolCategory] = useState<'prep' | 'teach' | 'support'>('prep');
  const [toolIsFree, setToolIsFree] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tools');
        if (res.status === 503) throw new Error('DB_UNAVAILABLE');
        if (res.ok) {
          const data = (await res.json()) as any;
          const mapped = (data.tools ?? []).map((t: any) => ({
            id: t.id,
            tool_name: t.tool_name,
            tool_url: t.tool_url,
            description: t.description || 'Custom AI tool.',
            category: t.category || 'text',
            is_free: t.is_free === 1 || t.is_free === true,
            supported_outputs: ['notes', 'quiz', 'lesson_plan'],
            active: true,
            sort_order: 100,
          }));
          setCustomTools(mapped);
          // Keep localStorage in sync for the builder page (which reads it)
          localStorage.setItem('classorbit_custom_tools', JSON.stringify(mapped));
        }
      } catch {
        const lc = localStorage.getItem('classorbit_custom_tools');
        if (lc) setCustomTools(JSON.parse(lc));
      }
    })();
  }, []);

  const saveCustomTools = (updated: any[]) => {
    setCustomTools(updated);
    localStorage.setItem('classorbit_custom_tools', JSON.stringify(updated));
  };

  const handleUrlChange = (val: string) => {
    setToolUrl(val);
    if (val.trim()) {
      try {
        let domain = val;
        if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
          domain = 'https://' + domain;
        }
        const url = new URL(domain);
        const parts = url.hostname.split('.');
        const rawName = parts.length > 2 ? parts[parts.length - 2] : parts[0];
        const suggestedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        if (!toolName) {
          setToolName(suggestedName);
        }
      } catch (e) {
        // Ignored
      }
    }
  };

  const handleAddCustomTool = async () => {
    if (!toolUrl.trim()) { toast.error('Tool URL is required'); return; }
    if (!toolName.trim()) { toast.error('Tool Name is required'); return; }

    let formattedUrl = toolUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const category = toolCategory === 'prep' ? 'text' : toolCategory === 'teach' ? 'presentation' : 'audio';

    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_name: toolName.trim(), tool_url: formattedUrl, description: toolDesc.trim() || 'Custom AI tool.', category, is_free: toolIsFree }),
      });
      const data = (await res.json()) as any;
      const newTool = {
        id: res.status === 503 ? 'custom-' + Math.random().toString(36).slice(2, 9) : data.id,
        tool_name: toolName.trim(),
        tool_url: formattedUrl,
        description: toolDesc.trim() || 'Custom AI tool.',
        category,
        is_free: toolIsFree,
        supported_outputs: ['notes', 'quiz', 'lesson_plan'],
        active: true,
        sort_order: 100 + customTools.length,
      };
      saveCustomTools([...customTools, newTool]);
    } catch {
      const newTool = {
        id: 'custom-' + Math.random().toString(36).slice(2, 9),
        tool_name: toolName.trim(), tool_url: formattedUrl,
        description: toolDesc.trim() || 'Custom AI tool.',
        category, is_free: toolIsFree,
        supported_outputs: ['notes', 'quiz', 'lesson_plan'],
        active: true, sort_order: 100 + customTools.length,
      };
      saveCustomTools([...customTools, newTool]);
    }

    setToolUrl(''); setToolName(''); setToolDesc(''); setToolCategory('prep'); setToolIsFree(true);
    setShowAddModal(false);
    toast.success(`${toolName} saved to launcher!`);
  };

  const handleDeleteCustomTool = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from your launcher?`)) return;
    try {
      await fetch(`/api/tools/${id}`, { method: 'DELETE' });
    } catch { /* fallback to local removal */ }
    const updated = customTools.filter(t => t.id !== id);
    saveCustomTools(updated);
    toast.success(`Removed ${name} from launcher.`);
  };

  const getToolPhase = (tool: any): string => {
    if (tool.category === 'text' || tool.category === 'research' || tool.id === 'notebooklm') return 'prep';
    if (tool.category === 'presentation' || tool.category === 'visual' || tool.id === 'ideogram') return 'teach';
    return 'support';
  };

  const getToolLogoUrl = (url: string, logo?: string) => {
    if (logo) return logo;
    try {
      const parsedUrl = new URL(url);
      return `https://www.google.com/s2/favicons?sz=128&domain=${parsedUrl.hostname}`;
    } catch (e) {
      return `https://www.google.com/s2/favicons?sz=128&domain=${url}`;
    }
  };

  const allToolsList = [
    ...systemTools.map(t => ({ ...t, isCustom: false })),
    ...customTools.map(t => ({ ...t, active: true, isCustom: true }))
  ];

  const filteredTools = allToolsList
    .filter((t) => t.active)
    .filter((t) => {
      if (activePhase === 'all') return true;
      return getToolPhase(t) === activePhase;
    })
    .filter((t) =>
      t.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getGoogleSsoUrl = (toolId: string, defaultUrl: string): string => {
    const ssoUrls: Record<string, string> = {
      chatgpt: 'https://chatgpt.com',
      claude: 'https://claude.ai',
      canva: 'https://www.canva.com',
      gamma: 'https://gamma.app',
      notebooklm: 'https://notebooklm.google.com',
      elevenlabs: 'https://elevenlabs.io',
      suno: 'https://suno.com',
      ideogram: 'https://ideogram.ai',
      diffit: 'https://app.diffit.me',
    };
    const cleanId = toolId.toLowerCase().replace(/[^a-z0-9]/g, '');
    return ssoUrls[cleanId] || defaultUrl;
  };


  const handleLaunch = (id: string, name: string, url: string, isCustom = false) => {
    setLaunchingId(id);
    toast.success(`Opening ${name} integration...`);
    
    // Log tool launch event asynchronously
    fetch('/api/tools/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_id: id, tool_name: name, is_custom: isCustom, action_type: 'launch' }),
    }).catch(e => console.error('Error logging launch', e));

    setTimeout(() => {
      const targetUrl = getGoogleSsoUrl(id, url);
      window.open(targetUrl, '_blank');
      setLaunchingId(null);
    }, 700);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0 relative min-h-screen">
      
      {/* Header section with ClassOrbit logo and Google SSO Session Bridge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4 text-left">
          <img 
            src="/logo_transparent.png" 
            alt="ClassOrbit Logo" 
            className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] shrink-0" 
          />
          <div>
            <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-1 block flex items-center gap-1.5">
              <Rocket size={14} /> Integrations
            </span>
            <h1 className="font-display text-display-lg-mobile md:text-[40px] text-text-main font-bold tracking-tight">
              AI Launchpad
            </h1>
            <p className="text-body-md text-text-muted max-w-xl mt-1 leading-relaxed">
              Seamlessly launch into your favorite educational AI tools with pre-configured parameters.
            </p>
          </div>
        </div>

        {/* New tool notification banner */}
        {newTools.length > 0 && (
          <div className="w-full lg:max-w-md bg-primary/10 border border-primary/30 rounded-2xl px-5 py-3 flex items-start gap-3 shrink-0">
            <span className="text-2xl shrink-0 mt-0.5">🎉</span>
            <div>
              <p className="font-bold text-white text-[14px]">
                {newTools.length === 1 ? `New tool: ${newTools[0].tool_name}!` : `${newTools.length} new tools added!`}
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                {newTools.map(t => t.tool_name).join(', ')} — scroll down to try {newTools.length === 1 ? 'it' : 'them'} out.
              </p>
            </div>
          </div>
        )}

        {/* Google SSO Session Bridge Card */}
        {!loading && profile && (
          <div className="glass-panel rounded-2xl p-4.5 flex items-center gap-4 border border-emerald-500/20 bg-emerald-500/5 max-w-md w-full lg:w-auto shadow-sm shadow-emerald-500/5 text-left shrink-0">
            <div className="relative">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.name || ''} 
                  className="w-11 h-11 rounded-full border-2 border-emerald-500/40 object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                  {(profile.name || profile.email || 'T').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#06040F] rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Google SSO Session Synced</span>
              <p className="text-label-sm font-bold text-text-main truncate mt-0.5">{profile.email}</p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-tight max-w-[280px]">
                Single-sign-on active. Click "Continue with Google" on external tools to log in instantly.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar - Search & Register Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-surface/30 border border-border/60 rounded-2xl p-4">
        <p className="text-label-md text-text-muted font-semibold text-left">
          Discover and navigate to classroom assistants
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-body-md w-full sm:w-[220px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm text-text-main placeholder:text-text-subtle"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 px-4.5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 shrink-0 text-label-md cursor-pointer"
          >
            <Plus size={18} />
            Register AI Tool
          </button>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <button
          onClick={() => setActivePhase('all')}
          className={`glass-card rounded-2xl p-5 transition-all text-left flex flex-col justify-between h-[130px] ${
            activePhase === 'all' ? 'ring-2 ring-primary border-primary shadow-md bg-primary/5' : 'hover:border-text-subtle'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${activePhase === 'all' ? 'bg-primary text-white' : 'bg-background border border-border text-text-muted'}`}>
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className={`font-display font-bold text-headline-sm leading-tight ${activePhase === 'all' ? 'text-primary' : 'text-text-main'}`}>All Tools</h4>
            <p className="text-label-sm text-text-muted mt-1 truncate">Explore full tool registry</p>
          </div>
        </button>

        {classroomPhases.map((phase) => {
          const isSelected = activePhase === phase.id;
          const Icon = phase.icon;
          return (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              className={`glass-card rounded-2xl p-5 transition-all text-left flex flex-col justify-between h-[130px] ${
                isSelected ? 'ring-2 ring-primary border-primary shadow-md bg-primary/5' : 'hover:border-text-subtle'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isSelected ? 'bg-primary text-white' : 'bg-background border border-border text-text-muted'}`}>
                <Icon size={20} />
              </div>
              <div>
                <h4 className={`font-display font-bold text-headline-sm leading-tight ${isSelected ? 'text-primary' : 'text-text-main'}`}>{phase.name}</h4>
                <p className="text-label-sm text-text-muted mt-1 truncate">{phase.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-3xl shadow-sm">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
            <Search size={28} className="text-text-subtle" />
          </div>
          <p className="font-display text-headline-sm text-text-main font-bold mb-2">No tools found</p>
          <p className="text-body-sm text-text-muted max-w-sm mx-auto">
            Try adjusting your search query or phase filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredTools.map((tool) => {
              const isLaunching = launchingId === tool.id;
              
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-[24px] p-6 flex flex-col h-[310px] group hover:border-primary/50 text-left"
                >
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-border shadow-sm overflow-hidden flex items-center justify-center p-2 shrink-0">
                        <img 
                          src={getToolLogoUrl(tool.tool_url, tool.tool_logo)} 
                          alt={tool.tool_name} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?sz=128&domain=google.com';
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {tool.is_new && (
                          <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            NEW
                          </span>
                        )}
                        {tool.isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomTool(tool.id, tool.tool_name);
                            }}
                            className="p-1.5 rounded-lg bg-surface hover:bg-error/10 text-text-subtle hover:text-error border border-border transition-colors cursor-pointer"
                            title="Delete custom tool"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <Badge variant={tool.is_free ? 'success' : 'default'} className="font-semibold shadow-sm text-[10px] uppercase">
                          {tool.is_free ? 'Free' : 'Pro'}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-[20px] text-text-main mb-2">
                      {tool.tool_name}
                    </h3>
                    <p className="text-label-sm text-text-muted leading-relaxed line-clamp-2 h-[48px] overflow-hidden">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <button
                      onClick={() => handleLaunch(tool.id, tool.tool_name, tool.tool_url, !!tool.isCustom)}
                      className={`w-full py-3 rounded-xl font-bold text-label-md flex items-center justify-center gap-2 transition-all shadow-sm ${
                        isLaunching
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-surface hover:bg-background border border-border hover:border-primary text-text-main group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-glow'
                      }`}
                    >
                      {isLaunching ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          Launch Integration
                          <ExternalLink size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Register Custom AI Tool Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-[#06040F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-[24px] w-full max-w-[500px] p-7 shadow-2xl relative text-text-main text-left"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-headline-sm font-bold text-text-main flex items-center gap-2">
                  <Rocket className="text-primary" size={20} />
                  Register Custom AI Tool
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-text-subtle hover:text-text-main transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Tool URL</label>
                  <input
                    type="text"
                    placeholder="https://perplexity.ai"
                    value={toolUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary transition-all text-text-main placeholder:text-text-subtle"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Tool Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Perplexity"
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary transition-all text-text-main placeholder:text-text-subtle"
                  />
                </div>

                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Description</label>
                  <textarea
                    placeholder="What is this tool best for? E.g. Great for conversational research and citation..."
                    value={toolDesc}
                    onChange={(e) => setToolDesc(e.target.value)}
                    className="w-full h-20 bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary transition-all text-text-main placeholder:text-text-subtle resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label-sm font-semibold text-text-muted block mb-2">Category Phase</label>
                    <select
                      value={toolCategory}
                      onChange={(e) => setToolCategory(e.target.value as any)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary transition-all text-text-main cursor-pointer font-medium"
                    >
                      <option value="prep">Preparation (Text)</option>
                      <option value="teach">Visuals & Slides</option>
                      <option value="support">Differentiation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-label-sm font-semibold text-text-muted block mb-2">Pricing Tier</label>
                    <select
                      value={toolIsFree ? 'free' : 'pro'}
                      onChange={(e) => setToolIsFree(e.target.value === 'free')}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary transition-all text-text-main cursor-pointer font-medium"
                    >
                      <option value="free">Free Tier</option>
                      <option value="pro">Pro / Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-label-md text-text-muted hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomTool}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-semibold text-label-md transition-colors shadow-md shadow-primary/20"
                >
                  Save Integration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
