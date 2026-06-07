'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { Star, Search, Eye, Copy, Trash2, X, Layers, FileText, Loader2, Bookmark, Plus } from 'lucide-react';

interface SavedPrompt {
  id: string;
  content_type: string;
  grade: string;
  subject: string;
  topic: string;
  tools: string[];
  is_favorite: boolean;
  created_at: string;
  prompt_text?: string;
}

function formatDate(raw: string): string {
  try { return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }); } catch { return raw; }
}

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  if (res.status === 503) throw new Error('DB_UNAVAILABLE');
  return res;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [useLocal, setUseLocal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFav, setFilterFav] = useState(false);
  const [viewingPrompt, setViewingPrompt] = useState<SavedPrompt | null>(null);

  // Workspace saving state
  const [savingPrompt, setSavingPrompt] = useState<SavedPrompt | null>(null);
  const [workspaceFolders, setWorkspaceFolders] = useState<any[]>([]);
  const [saveFolderId, setSaveFolderId] = useState('');
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenSaveModal = async (prompt: SavedPrompt) => {
    setSavingPrompt(prompt);
    try {
      const res = await apiFetch('/api/workspace');
      if (res.ok) {
        const data = await res.json();
        const folders = data.folders ?? [];
        setWorkspaceFolders(folders);
        if (folders.length > 0) setSaveFolderId(folders[0].id);
        return;
      }
    } catch { /* fall through to localStorage */ }
    const lf = localStorage.getItem('classorbit_folders');
    const folders = lf ? JSON.parse(lf) : [];
    setWorkspaceFolders(folders);
    if (folders.length > 0) setSaveFolderId(folders[0].id);
  };

  const handleSaveToWorkspace = async () => {
    if (!savingPrompt) return;
    setIsSaving(true);
    let targetFolderId = saveFolderId;
    let targetFolderName = '';
    const contentTypeName = savingPrompt.content_type || 'Prompt';
    const topicText = savingPrompt.topic || 'Untitled';
    const truncatedTopic = topicText.length > 25 ? topicText.substring(0, 25) + '...' : topicText;
    const fileName = `${truncatedTopic} (${contentTypeName}).prompt`;

    try {
      if (isCreatingNewFolder) {
        if (!newFolderName.trim()) { toast.error('Please enter a folder name!'); setIsSaving(false); return; }
        const stickers = ['📚', '📝', '🔬', '📐', '🎨', '🚀'];
        const colors = ['bg-primary', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500'];
        const res = await apiFetch('/api/workspace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'folder', name: newFolderName.trim(), sticker: stickers[Math.floor(Math.random() * stickers.length)], color: colors[Math.floor(Math.random() * colors.length)] }),
        });
        if (res.ok) { const d = await res.json(); targetFolderId = d.id; targetFolderName = d.name; }
      } else {
        targetFolderName = workspaceFolders.find((f: any) => f.id === saveFolderId)?.name ?? 'Workspace';
      }

      await apiFetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'file', folder_id: targetFolderId, name: fileName, type: 'prompt', content: savingPrompt.prompt_text }),
      });
    } catch {
      const lf = localStorage.getItem('classorbit_folders');
      const lfi = localStorage.getItem('classorbit_files');
      const folders = lf ? JSON.parse(lf) : [];
      const files = lfi ? JSON.parse(lfi) : [];
      if (!targetFolderName) targetFolderName = folders.find((f: any) => f.id === targetFolderId)?.name ?? 'Workspace';
      files.unshift({ id: Math.random().toString(36).slice(2, 9), name: fileName, type: 'prompt', date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), folderId: targetFolderId, folder_id: targetFolderId, content: savingPrompt.prompt_text });
      localStorage.setItem('classorbit_files', JSON.stringify(files));
    }

    setSavingPrompt(null);
    setIsCreatingNewFolder(false);
    setNewFolderName('');
    setIsSaving(false);

    toast.success(`Saved to ${targetFolderName}!`);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/prompts');
      if (res.status === 401) { setLoading(false); return; }
      const data = await res.json();
      setPrompts(data.prompts ?? []);
      setUseLocal(false);
    } catch {
      setUseLocal(true);
      const lp = localStorage.getItem('classorbit_prompts');
      const parsed = lp ? JSON.parse(lp) : [];
      // Normalize localStorage shape to API shape
      setPrompts(parsed.map((p: any) => ({
        id: p.id,
        content_type: p.contentType ?? p.content_type ?? '',
        grade: p.grade ?? '',
        subject: p.subject ?? '',
        topic: p.topic ?? '',
        tools: p.tools ?? [],
        is_favorite: p.isFavorite ?? p.is_favorite ?? false,
        created_at: p.createdAt ?? p.created_at ?? new Date().toISOString(),
        prompt_text: p.promptText ?? p.prompt_text ?? '',
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleFavorite = async (id: string, current: boolean) => {
    try {
      if (useLocal) {
        const lp = localStorage.getItem('classorbit_prompts');
        const list = lp ? JSON.parse(lp) : [];
        const updated = list.map((p: any) => p.id === id ? { ...p, isFavorite: !current, is_favorite: !current } : p);
        localStorage.setItem('classorbit_prompts', JSON.stringify(updated));
      } else {
        await apiFetch(`/api/prompts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_favorite: !current }),
        });
      }
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, is_favorite: !current } : p));
    } catch { toast.error('Failed to update.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;
    try {
      if (useLocal) {
        const lp = localStorage.getItem('classorbit_prompts');
        const updated = lp ? JSON.parse(lp).filter((p: any) => p.id !== id) : [];
        localStorage.setItem('classorbit_prompts', JSON.stringify(updated));
      } else {
        await apiFetch(`/api/prompts/${id}`, { method: 'DELETE' });
      }
      setPrompts(prev => prev.filter(p => p.id !== id));
      toast.success('Prompt deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  const filtered = prompts.filter(p => {
    const matchFav = !filterFav || p.is_favorite;
    const matchSearch = !searchQuery || [p.topic, p.subject, p.content_type].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchFav && matchSearch;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="w-full max-w-[1200px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0 min-h-screen">



      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center gap-1.5">
            <FileText size={16} /> Prompt Library
          </span>
          <h1 className="font-display text-display-lg-mobile md:text-[40px] text-text-main font-bold tracking-tight">Saved Prompts</h1>
          <p className="text-body-md text-text-muted max-w-xl mt-2">Your prompt history — review, re-launch, or save favourites.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-body-md w-[200px] focus:w-[260px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setFilterFav(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all border shadow-sm ${filterFav ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-border text-text-muted hover:border-text-subtle'}`}
          >
            <Star size={16} fill={filterFav ? 'currentColor' : 'none'} /> Favourites
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 bg-surface border border-border rounded-3xl">
          <Layers size={40} className="mx-auto text-text-subtle mb-4" strokeWidth={1.5} />
          <p className="font-display text-headline-sm text-text-main font-bold mb-2">No prompts yet</p>
          <p className="text-body-sm text-text-muted">Build prompts in the Builder and save them to see them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge variant="prompt" className="text-[10px] font-bold uppercase">{p.content_type || 'Prompt'}</Badge>
                  {p.grade && <span className="text-[11px] text-text-muted font-medium bg-white/5 border border-border px-2 py-0.5 rounded-full">{p.grade}</span>}
                  {p.subject && <span className="text-[11px] text-text-muted font-medium bg-white/5 border border-border px-2 py-0.5 rounded-full">{p.subject}</span>}
                  {(p.tools ?? []).map(t => (
                    <span key={t} className="text-[11px] text-primary font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <p className="font-semibold text-text-main text-[15px] leading-snug truncate">{p.topic || 'Untitled Prompt'}</p>
                <p className="text-[12px] text-text-subtle mt-1">{formatDate(p.created_at)}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                <button onClick={() => setViewingPrompt(p)} className="px-4 py-2 rounded-xl bg-surface border border-border hover:border-primary flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-label-sm font-semibold">
                  <Eye size={16} /> View
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenSaveModal(p)} className="w-9 h-9 rounded-xl bg-surface border border-border hover:border-primary flex items-center justify-center text-text-muted hover:text-primary transition-colors" title="Save to Workspace">
                    <Bookmark size={16} />
                  </button>
                  <button onClick={() => toggleFavorite(p.id, p.is_favorite)} className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${p.is_favorite ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-border text-text-subtle hover:text-primary hover:border-primary'}`} title="Toggle favourite">
                    <Star size={16} fill={p.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(p.prompt_text || ''); toast.success('Copied!'); }} className="w-9 h-9 rounded-xl bg-surface border border-border hover:border-primary flex items-center justify-center text-text-muted hover:text-primary transition-colors" title="Copy">
                    <Copy size={16} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="w-9 h-9 rounded-xl bg-surface border border-border hover:border-red-500 hover:bg-red-500/10 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {viewingPrompt && (
          <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface border border-border rounded-[24px] w-full max-w-[640px] p-7 shadow-2xl relative">
              <button onClick={() => setViewingPrompt(null)} className="absolute top-6 right-6 text-text-subtle hover:text-text-main"><X size={22} /></button>
              <div className="mb-5 pb-4 border-b border-border">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="prompt" className="text-[10px] font-bold uppercase">{viewingPrompt.content_type || 'Prompt'}</Badge>
                  {viewingPrompt.grade && <span className="text-[11px] text-text-muted bg-white/5 border border-border px-2 py-0.5 rounded-full">{viewingPrompt.grade}</span>}
                  {viewingPrompt.subject && <span className="text-[11px] text-text-muted bg-white/5 border border-border px-2 py-0.5 rounded-full">{viewingPrompt.subject}</span>}
                </div>
                <h3 className="font-display text-headline-sm font-bold text-text-main pr-8">{viewingPrompt.topic || 'Untitled'}</h3>
              </div>
              <div className="bg-background border border-border rounded-xl p-5 max-h-[320px] overflow-y-auto custom-scrollbar">
                <pre className="text-[13px] font-mono text-text-main whitespace-pre-wrap break-words leading-relaxed">
                  {viewingPrompt.prompt_text || 'No content saved.'}
                </pre>
              </div>
              <div className="mt-5 flex justify-end gap-3 flex-wrap">
                <button onClick={() => setViewingPrompt(null)} className="px-5 py-2.5 rounded-xl text-label-md font-semibold text-text-muted hover:bg-background transition-colors">Close</button>
                <button onClick={() => { setViewingPrompt(null); handleOpenSaveModal(viewingPrompt); }} className="bg-surface border border-border px-5 py-2.5 rounded-xl text-label-md font-semibold text-text-muted hover:text-primary hover:border-primary transition-colors flex items-center gap-2">
                  <Bookmark size={16} /> Save to Workspace
                </button>
                <button onClick={() => { navigator.clipboard.writeText(viewingPrompt.prompt_text || ''); toast.success('Copied!'); }} className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-label-md hover:bg-primary-hover transition-colors shadow-md flex items-center gap-2">
                  <Copy size={16} /> Copy Prompt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save to Workspace Modal */}
      <AnimatePresence>
        {savingPrompt && (
          <div className="fixed inset-0 bg-[#06040F]/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-[24px] w-full max-w-[480px] p-7 shadow-2xl relative text-text-main"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-headline-sm font-bold text-text-main flex items-center gap-2">
                  <Bookmark className="text-primary" size={20} />
                  Save to Workspace
                </h3>
                <button onClick={() => setSavingPrompt(null)} className="text-text-subtle hover:text-text-main transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-5 text-left">
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Folder / Category</label>
                  
                  {!isCreatingNewFolder ? (
                    <div className="flex gap-2">
                      <select
                        value={saveFolderId}
                        onChange={(e) => setSaveFolderId(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-body-md text-text-main focus:outline-none focus:border-primary transition-all cursor-pointer"
                      >
                        {workspaceFolders.map((f: any) => (
                          <option key={f.id} value={f.id} className="bg-surface text-text-main">
                            {f.sticker} {f.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewFolder(true)}
                        className="px-4 py-3 bg-surface hover:bg-background border border-border hover:border-text-subtle text-text-main rounded-xl font-semibold transition-all text-label-md shrink-0 flex items-center gap-1"
                      >
                        <Plus size={16} /> New
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="e.g. Social Studies"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary transition-all text-text-main placeholder:text-text-subtle"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatingNewFolder(false)}
                          className="text-label-sm text-text-muted hover:text-text-main font-semibold px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setSavingPrompt(null)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-label-md text-text-muted hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveToWorkspace}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-semibold text-label-md transition-colors shadow-md shadow-primary/20 disabled:opacity-60 flex items-center gap-2"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  Confirm & Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
