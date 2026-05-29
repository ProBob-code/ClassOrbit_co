'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { 
  Star, Search, Bookmark, Eye, Copy, Trash2, X, ChevronRight, Layers, FileText
} from 'lucide-react';

interface SavedPrompt {
  id: string;
  contentType: string;
  grade: string;
  subject: string;
  topic: string;
  teachingStyles: string[];
  tools: string[];
  isFavorite: boolean;
  createdAt: string;
  promptText?: string;
}

const defaultPrompts: SavedPrompt[] = [
  {
    id: '1',
    contentType: 'Quiz',
    grade: 'Grade 5',
    subject: 'Science',
    topic: 'Photosynthesis & Cells',
    teachingStyles: ['Interactive', 'Visual Learning'],
    tools: ['ChatGPT', 'Canva'],
    isFavorite: true,
    createdAt: 'May 28, 2026',
    promptText: 'Act as an expert Grade 5 Science Teacher. Design an interactive 10-question multiple choice quiz on Photosynthesis, ensuring rich visuals are requested (e.g. diagrams showing stomata, light reactions). Keep the tone engaging and beginner-friendly.',
  },
  {
    id: '2',
    contentType: 'Lesson Plan',
    grade: 'Grade 10',
    subject: 'Biology',
    topic: 'Cell Division Scaffolding',
    teachingStyles: ['Exam Focused'],
    tools: ['Claude', 'Gamma'],
    isFavorite: false,
    createdAt: 'May 27, 2026',
    promptText: 'Draft a comprehensive 45-minute lesson plan targeting Cell Division (Mitosis and Meiosis) for a Grade 10 Biology class. Organize into sections: Hook, Direct Instruction, Guided Practice, and Independent Assessment. Align closely with exam-focused definitions.',
  },
  {
    id: '3',
    contentType: 'PPT',
    grade: 'Grade 8',
    subject: 'History',
    topic: 'Industrial Revolution Causes',
    teachingStyles: ['Story Based', 'Visual Learning'],
    tools: ['Gamma', 'Canva'],
    isFavorite: true,
    createdAt: 'May 26, 2026',
    promptText: 'Write a highly compelling slide presentation script structured as a historical narrative detailing the technological catalysts of the Industrial Revolution in Great Britain. Focus heavily on the steam engine and textile automation, requesting specific illustrations.',
  },
  {
    id: '4',
    contentType: 'Worksheet',
    grade: 'Grade 3',
    subject: 'Math',
    topic: 'Multiplication Tables Practice',
    teachingStyles: ['Fun', 'Gamified'],
    tools: ['ChatGPT'],
    isFavorite: false,
    createdAt: 'May 25, 2026',
    promptText: 'Create a fun, gamified practice worksheet sheet for learning multiplication tables. Structure questions as short challenges where students unlock keys to save a kingdom. Keep math problems focused on numbers 2 through 9.',
  },
];

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingPrompt, setViewingPrompt] = useState<SavedPrompt | null>(null);

  useEffect(() => {
    const localPrompts = localStorage.getItem('classorbit_prompts');
    if (localPrompts) {
      setPrompts(JSON.parse(localPrompts));
    } else {
      setPrompts(defaultPrompts);
      localStorage.setItem('classorbit_prompts', JSON.stringify(defaultPrompts));
    }
  }, []);

  const savePrompts = (updated: SavedPrompt[]) => {
    setPrompts(updated);
    localStorage.setItem('classorbit_prompts', JSON.stringify(updated));
  };

  const toggleFavorite = (id: string) => {
    const updated = prompts.map((p) => 
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    savePrompts(updated);
    
    const wasFavorite = prompts.find(p => p.id === id)?.isFavorite;
    toast.success(
      wasFavorite ? 'Removed from favorites' : 'Added to favorites!'
    );
  };

  const deletePrompt = (id: string, topic: string) => {
    if (confirm(`Delete prompt history for "${topic}"?`)) {
      const updated = prompts.filter((p) => p.id !== id);
      savePrompts(updated);
      toast.success('Prompt deleted.');
    }
  };

  const filtered = prompts
    .filter((p) => !filterFavorites || p.isFavorite)
    .filter(
      (p) =>
        !searchQuery ||
        p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contentType.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0 relative min-h-screen">
      
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center gap-1.5">
            <Bookmark size={16} /> History
          </span>
          <h1 className="font-display text-display-lg-mobile md:text-[40px] text-text-main font-bold tracking-tight">
            Saved Prompts
          </h1>
          <p className="text-body-md text-text-muted max-w-xl mt-2">
            Explore and reuse your custom engineered prompt blueprints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all border shadow-sm active:scale-95 ${
              filterFavorites
                ? 'bg-primary border-primary text-white'
                : 'bg-surface border-border text-text-muted hover:border-text-subtle'
            }`}
          >
            <Star size={18} fill={filterFavorites ? 'currentColor' : 'none'} />
            Favorites
          </button>
          
          <div className="relative group">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-body-md w-[200px] md:w-[260px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Prompts statistics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Layers size={24} />
          </div>
          <div>
            <span className="text-label-sm text-text-muted font-semibold uppercase tracking-wider block mb-1">Total Logged</span>
            <p className="font-display text-[24px] text-text-main font-bold leading-none">{prompts.length} Prompts</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Star size={24} fill="currentColor" />
          </div>
          <div>
            <span className="text-label-sm text-text-muted font-semibold uppercase tracking-wider block mb-1">Favorited</span>
            <p className="font-display text-[24px] text-text-main font-bold leading-none">{prompts.filter(p => p.isFavorite).length} Stars</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <FileText size={24} />
          </div>
          <div>
            <span className="text-label-sm text-text-muted font-semibold uppercase tracking-wider block mb-1">Coverage</span>
            <p className="font-display text-[24px] text-text-main font-bold leading-none">5 AI Engines</p>
          </div>
        </div>
      </section>

      {/* Main List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-3xl shadow-sm">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
            <Bookmark size={28} className="text-text-subtle" />
          </div>
          <p className="font-display text-headline-sm text-text-main font-bold mb-2">No Saved Prompts</p>
          <p className="text-body-sm text-text-muted max-w-sm mx-auto">
            Generate and save teaching materials inside the AI Prompt Studio to see your archive here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((prompt, i) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="glass-card rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="primary" className="shadow-sm">{prompt.contentType}</Badge>
                    <Badge variant="secondary" className="shadow-sm">{prompt.subject}</Badge>
                    <Badge variant="default" className="shadow-sm">{prompt.grade}</Badge>
                    <span className="text-label-sm text-text-muted bg-background border border-border px-2.5 py-1 rounded-lg font-semibold ml-2">
                      {prompt.createdAt}
                    </span>
                  </div>

                  <h3 className="font-display text-[22px] text-text-main font-bold mb-2 leading-tight">
                    {prompt.topic}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {prompt.teachingStyles.map((style) => (
                      <span
                        key={style}
                        className="text-label-sm text-text-main bg-background border border-border px-3 py-1 rounded-lg font-semibold shadow-sm"
                      >
                        {style}
                      </span>
                    ))}
                  </div>

                  <p className="text-label-sm text-text-muted">
                    <span className="font-semibold text-text-main">Channels:</span> {prompt.tools.join(', ')}
                  </p>
                </div>

                {/* Card actions */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-border">
                  <button
                    onClick={() => setViewingPrompt(prompt)}
                    className="flex-1 md:flex-initial bg-primary text-white px-5 py-2.5 rounded-xl text-label-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-primary-hover shadow-md active:scale-95"
                  >
                    <Eye size={16} />
                    View Prompt
                  </button>

                  <button
                    onClick={() => toggleFavorite(prompt.id)}
                    className={`p-2.5 rounded-xl transition-all border ${
                      prompt.isFavorite 
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' 
                        : 'bg-surface border-border text-text-muted hover:border-text-subtle'
                    }`}
                    title={prompt.isFavorite ? 'Remove star' : 'Mark as favorite'}
                  >
                    <Star size={18} fill={prompt.isFavorite ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(prompt.promptText || '');
                      toast.success('Prompt copied!');
                    }}
                    className="p-2.5 rounded-xl bg-surface border border-border text-text-muted hover:text-text-main hover:border-text-subtle transition-all"
                    title="Copy prompt"
                  >
                    <Copy size={18} />
                  </button>

                  <button
                    onClick={() => deletePrompt(prompt.id, prompt.topic)}
                    className="p-2.5 rounded-xl bg-surface border border-border text-text-muted hover:text-error hover:border-error/30 hover:bg-error/5 transition-all"
                    title="Delete record"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Prompts Details Modal */}
      <AnimatePresence>
        {viewingPrompt && (
          <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-[24px] w-full max-w-[640px] p-7 shadow-2xl relative text-left"
            >
              <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                <div className="pr-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-label-sm text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} /> Blueprint Record
                    </span>
                  </div>
                  <h3 className="font-display text-[24px] text-text-main font-bold leading-tight">
                    {viewingPrompt.topic}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingPrompt(null)}
                  className="text-text-subtle hover:text-text-main absolute top-7 right-7"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Readout */}
              <div className="bg-background border border-border p-5 rounded-xl font-mono text-[13px] text-text-main leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar whitespace-pre-wrap shadow-inner">
                {viewingPrompt.promptText || 'No prompt content logged.'}
              </div>

              <div className="mt-6 flex justify-between items-center pt-2">
                <p className="text-label-sm text-text-muted font-semibold">
                  Saved on {viewingPrompt.createdAt}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingPrompt.promptText || '');
                    toast.success('Prompt copied!');
                  }}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-label-md hover:bg-primary-hover transition-all flex items-center gap-2 shadow-md active:scale-95"
                >
                  <Copy size={16} />
                  Copy Blueprint
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
