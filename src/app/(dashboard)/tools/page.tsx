'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { defaultTools } from '@/data/default-tools';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { 
  Search, Rocket, Sparkles, PenTool, Presentation, Puzzle, ExternalLink, Loader2 
} from 'lucide-react';

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
  const [activePhase, setActivePhase] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const getToolPhase = (tool: typeof defaultTools[0]): string => {
    if (tool.category === 'text' || tool.id === 'notebooklm') return 'prep';
    if (tool.category === 'presentation' || tool.category === 'visual' || tool.id === 'ideogram') return 'teach';
    return 'support';
  };

  const filteredTools = defaultTools
    .filter((t) => t.active)
    .filter((t) => {
      if (activePhase === 'all') return true;
      return getToolPhase(t) === activePhase;
    })
    .filter((t) =>
      t.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleLaunch = (id: string, name: string, url: string) => {
    setLaunchingId(id);
    toast.success(`Opening ${name} integration...`);
    setTimeout(() => {
      window.open(url, '_blank');
      setLaunchingId(null);
    }, 700);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0 relative min-h-screen">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center gap-1.5">
            <Rocket size={16} /> Integrations
          </span>
          <h1 className="font-display text-display-lg-mobile md:text-[40px] text-text-main font-bold tracking-tight">
            AI Launchpad
          </h1>
          <p className="text-body-md text-text-muted max-w-xl mt-2">
            Seamlessly launch into your favorite educational AI tools with pre-configured parameters.
          </p>
        </div>

        <div className="relative group">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-body-md w-[200px] md:w-[260px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          />
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
                  className="glass-card rounded-[24px] p-6 flex flex-col justify-between h-[280px] group hover:border-primary/50"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-border shadow-sm overflow-hidden flex items-center justify-center p-2">
                        <img src={tool.logoUrl} alt={tool.tool_name} className="w-full h-full object-contain" />
                      </div>
                      <Badge variant={tool.is_free ? 'success' : 'default'} className="font-semibold shadow-sm">
                        {tool.is_free ? 'Free Tier' : 'Pro'}
                      </Badge>
                    </div>

                    <h3 className="font-display font-bold text-[20px] text-text-main mb-2">
                      {tool.tool_name}
                    </h3>
                    <p className="text-label-sm text-text-muted leading-relaxed line-clamp-3">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <button
                      onClick={() => handleLaunch(tool.id, tool.tool_name, tool.tool_url)}
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
    </div>
  );
}
