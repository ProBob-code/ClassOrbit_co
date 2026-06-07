'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import { exportLessonPackage } from '@/lib/export/zip-generator';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  FolderPlus, FilePlus, Search, Archive, Eye, Trash2, X, Copy, Package,
  FolderOpen, FileText, LayoutTemplate, Image as ImageIcon, File, Calendar, Sparkles, Rocket, Edit2
} from 'lucide-react';
import { useTools } from '@/context/ToolsContext';
import { launchTool } from '@/lib/tools/router';

interface FolderData {
  id: string;
  name: string;
  sticker: string;
  color: string;
}

interface FileData {
  id: string;
  name: string;
  type: 'pdf' | 'prompt' | 'pptx' | 'img' | 'docx';
  date: string;
  folder_id: string;
  content?: string;
}

const stickerOptions = ['📚', '📐', '🔬', '📝', '🎨', '🚀', '⭐', '🦖', '🧩', '📋'];
const folderColors = [
  { id: 'bg-primary', name: 'Gold' },
  { id: 'bg-emerald-500', name: 'Emerald' },
  { id: 'bg-blue-500', name: 'Blue' },
  { id: 'bg-purple-500', name: 'Purple' },
  { id: 'bg-rose-500', name: 'Rose' },
];

function formatDate(raw: string): string {
  try {
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return raw;
  }
}

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf': return <FileText size={20} className="text-red-500" />;
    case 'docx': return <File size={20} className="text-blue-500" />;
    case 'pptx': return <LayoutTemplate size={20} className="text-orange-500" />;
    case 'img': return <ImageIcon size={20} className="text-purple-500" />;
    case 'prompt': return <FileText size={20} className="text-primary" />;
    default: return <File size={20} className="text-text-muted" />;
  }
}

// Lightweight API helpers with localStorage fallback for local dev
async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  if (res.status === 503) throw new Error('DB_UNAVAILABLE');
  return res;
}

export default function WorkspacePage() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [useLocal, setUseLocal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderSticker, setNewFolderSticker] = useState('📚');
  const [newFolderColor, setNewFolderColor] = useState('bg-primary');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'pdf' | 'prompt' | 'pptx' | 'img' | 'docx'>('prompt');
  const [newFileFolder, setNewFileFolder] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  const [editingFolder, setEditingFolder] = useState<FolderData | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderSticker, setEditFolderSticker] = useState('📚');
  const [editFolderColor, setEditFolderColor] = useState('bg-primary');

  const [editingFile, setEditingFile] = useState<FileData | null>(null);
  const [editFileName, setEditFileName] = useState('');

  const [viewingFile, setViewingFile] = useState<FileData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('Initializing export...');
  const [customToolsForLaunch, setCustomToolsForLaunch] = useState<any[]>([]);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/workspace');
      if (res.status === 401) { setLoading(false); return; }
      const data = await res.json();
      const mappedFiles: FileData[] = (data.files ?? []).map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        folder_id: f.folder_id,
        content: f.content,
        date: formatDate(f.created_at),
      }));
      setFolders(data.folders ?? []);
      setFiles(mappedFiles);
      if ((data.folders ?? []).length > 0) setNewFileFolder(data.folders[0].id);
      setUseLocal(false);
    } catch {
      // D1 unavailable — fall back to localStorage (local dev)
      setUseLocal(true);
      const lf = localStorage.getItem('classorbit_folders');
      const lfi = localStorage.getItem('classorbit_files');
      const parsedFolders = lf ? JSON.parse(lf) : [];
      const parsedFiles = lfi ? JSON.parse(lfi) : [];
      setFolders(parsedFolders);
      setFiles(parsedFiles.map((f: any) => ({ ...f, folder_id: f.folderId })));
      if (parsedFolders.length > 0) setNewFileFolder(parsedFolders[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const lc = localStorage.getItem('classorbit_custom_tools');
    if (lc) setCustomToolsForLaunch(JSON.parse(lc));
  }, [viewingFile]);

  const { tools: systemTools } = useTools();
  const allAvailableTools = [...systemTools, ...customToolsForLaunch];

  // ── Folder CRUD ────────────────────────────────────────────────────────────
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) { toast.error('Please provide a folder name!'); return; }
    try {
      if (useLocal) {
        const folderId = newFolderName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (folders.some(f => f.id === folderId)) { toast.error('Folder already exists.'); return; }
        const newFolder = { id: folderId, name: newFolderName.trim(), sticker: newFolderSticker, color: newFolderColor };
        const updated = [...folders, newFolder];
        setFolders(updated);
        localStorage.setItem('classorbit_folders', JSON.stringify(updated));
      } else {
        const res = await apiFetch('/api/workspace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'folder', name: newFolderName.trim(), sticker: newFolderSticker, color: newFolderColor }),
        });
        const data = await res.json();
        setFolders(prev => [...prev, data]);
      }
      setNewFolderName('');
      setShowFolderModal(false);
      toast.success('Folder created!');
    } catch { toast.error('Failed to create folder.'); }
  };

  // ── File CRUD ──────────────────────────────────────────────────────────────
  const handleUploadFile = async () => {
    if (!newFileName.trim()) { toast.error('File name is required'); return; }
    const ext = newFileType === 'pdf' ? '.pdf' : newFileType === 'pptx' ? '.pptx' : newFileType === 'docx' ? '.docx' : newFileType === 'img' ? '.jpg' : '.prompt';
    const finalName = newFileName.endsWith(ext) ? newFileName : `${newFileName}${ext}`;
    const targetFolder = newFileFolder || (folders[0]?.id ?? '');

    try {
      if (useLocal) {
        const lfi = localStorage.getItem('classorbit_files');
        const existing = lfi ? JSON.parse(lfi) : [];
        const newFile = { id: Math.random().toString(36).slice(2, 9), name: finalName, type: newFileType, date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), folderId: targetFolder, folder_id: targetFolder, content: newFileContent || `Content for ${newFileName}` };
        localStorage.setItem('classorbit_files', JSON.stringify([newFile, ...existing]));
        setFiles(prev => [{ ...newFile }, ...prev]);
      } else {
        const res = await apiFetch('/api/workspace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'file', folder_id: targetFolder, name: finalName, type: newFileType, content: newFileContent }),
        });
        const data = await res.json();
        setFiles(prev => [{ id: data.id, name: data.name, type: data.type, folder_id: data.folder_id, content: data.content, date: formatDate(new Date().toISOString()) }, ...prev]);
      }
      setNewFileName(''); setNewFileContent(''); setShowUploadModal(false);
      toast.success('File created successfully');
    } catch { toast.error('Failed to create file.'); }
  };

  const handleDeleteFile = async (id: string, name: string, folder_id: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      if (useLocal) {
        const lfi = localStorage.getItem('classorbit_files');
        const updated = lfi ? JSON.parse(lfi).filter((f: any) => f.id !== id) : [];
        localStorage.setItem('classorbit_files', JSON.stringify(updated));
      } else {
        await apiFetch(`/api/workspace/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'file' }) });
      }
      setFiles(prev => prev.filter(f => f.id !== id));
      toast.success('File deleted.');
    } catch { toast.error('Failed to delete file.'); }
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const openEditFolder = (folder: FolderData) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderSticker(folder.sticker);
    setEditFolderColor(folder.color);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder) return;
    if (!editFolderName.trim()) { toast.error('Please provide a folder name!'); return; }
    try {
      if (useLocal) {
        const updated = folders.map(f => f.id === editingFolder.id ? { ...f, name: editFolderName.trim(), sticker: editFolderSticker, color: editFolderColor } : f);
        setFolders(updated);
        localStorage.setItem('classorbit_folders', JSON.stringify(updated));
      } else {
        await apiFetch(`/api/workspace/${editingFolder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'folder', name: editFolderName.trim(), sticker: editFolderSticker, color: editFolderColor }),
        });
        setFolders(prev => prev.map(f => f.id === editingFolder.id ? { ...f, name: editFolderName.trim(), sticker: editFolderSticker, color: editFolderColor } : f));
      }
      setEditingFolder(null);
      toast.success('Folder updated!');
    } catch { toast.error('Failed to update folder.'); }
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`Delete folder "${name}"? This will also delete all files inside it.`)) return;
    try {
      if (useLocal) {
        const lf = localStorage.getItem('classorbit_folders');
        const lfi = localStorage.getItem('classorbit_files');
        const updatedFolders = lf ? JSON.parse(lf).filter((f: any) => f.id !== id) : [];
        const updatedFiles = lfi ? JSON.parse(lfi).filter((f: any) => f.folderId !== id && f.folder_id !== id) : [];
        localStorage.setItem('classorbit_folders', JSON.stringify(updatedFolders));
        localStorage.setItem('classorbit_files', JSON.stringify(updatedFiles));
      } else {
        await apiFetch(`/api/workspace/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'folder' }) });
      }
      setFolders(prev => prev.filter(f => f.id !== id));
      setFiles(prev => prev.filter(f => f.folder_id !== id));
      if (selectedFolder === id) setSelectedFolder(null);
      toast.success('Folder deleted.');
    } catch { toast.error('Failed to delete folder.'); }
  };

  const openEditFile = (file: FileData) => {
    setEditingFile(file);
    let nameWithoutExt = file.name;
    const parts = file.name.split('.');
    if (parts.length > 1 && ['pdf','pptx','docx','jpg','png','prompt'].includes(parts[parts.length-1])) {
      nameWithoutExt = parts.slice(0, -1).join('.');
    }
    setEditFileName(nameWithoutExt);
  };

  const handleUpdateFile = async () => {
    if (!editingFile) return;
    if (!editFileName.trim()) { toast.error('File name is required!'); return; }
    try {
      const parts = editingFile.name.split('.');
      const ext = (parts.length > 1 && ['pdf','pptx','docx','jpg','png','prompt'].includes(parts[parts.length-1])) ? `.${parts[parts.length-1]}` : '';
      const finalName = editFileName.endsWith(ext) ? editFileName.trim() : `${editFileName.trim()}${ext}`;

      if (useLocal) {
        const lfi = localStorage.getItem('classorbit_files');
        const existing = lfi ? JSON.parse(lfi) : [];
        const updated = existing.map((f: any) => f.id === editingFile.id ? { ...f, name: finalName } : f);
        localStorage.setItem('classorbit_files', JSON.stringify(updated));
        setFiles(prev => prev.map(f => f.id === editingFile.id ? { ...f, name: finalName } : f));
      } else {
        await apiFetch(`/api/workspace/${editingFile.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'file', name: finalName }),
        });
        setFiles(prev => prev.map(f => f.id === editingFile.id ? { ...f, name: finalName } : f));
      }
      setEditingFile(null);
      toast.success('File updated!');
    } catch { toast.error('Failed to update file.'); }
  };

  const handleCompilePackage = () => {
    if (files.length === 0) { toast.error('Workspace is empty!'); return; }
    setIsExporting(true); setExportProgress(10); setExportMessage('Compressing files...');
    setTimeout(() => {
      setExportProgress(50); setExportMessage('Generating metadata...');
      setTimeout(async () => {
        setExportProgress(85); setExportMessage('Finalizing ZIP package...');
        try {
          const zipFiles = files.filter(f => !selectedFolder || f.folder_id === selectedFolder).map(f => ({ name: f.name, content: f.content || '' }));
          const title = selectedFolder ? folders.find(f => f.id === selectedFolder)?.name || 'Export' : 'Workspace_Export';
          await exportLessonPackage(title, zipFiles, (p) => setExportProgress(Math.floor(85 + p * 0.15)));
          setIsExporting(false); toast.success('Export successful!');
        } catch { setIsExporting(false); toast.error('Export failed.'); }
      }, 800);
    }, 800);
  };

  const filteredFiles = files.filter(file => {
    const matchesFolder = !selectedFolder || file.folder_id === selectedFolder;
    const matchesSearch = !searchQuery || file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0 relative min-h-screen">



      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center gap-1.5">
            <FolderOpen size={16} /> Workspace
          </span>
          <h1 className="font-display text-display-lg-mobile md:text-[40px] text-text-main font-bold tracking-tight">
            My Workspace
          </h1>
          <p className="text-body-md text-text-muted max-w-xl mt-2">
            Organize, view, and export your lesson plans, prompts, and class materials.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-body-md w-[200px] focus:w-[260px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>
          <button onClick={() => setShowFolderModal(true)} className="bg-surface border border-border hover:border-text-subtle text-text-main px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95">
            <FolderPlus size={18} /> New Folder
          </button>
          <button onClick={() => { setShowUploadModal(true); if (folders[0]) setNewFileFolder(folders[0].id); }} className="bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95">
            <FilePlus size={18} /> Create File
          </button>
          <button onClick={handleCompilePackage} className="bg-gradient-to-r from-primary to-primary-hover text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-glow active:scale-95">
            <Archive size={18} /> Export ZIP
          </button>
        </div>
      </div>

      {/* Folders */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-label-md text-text-main font-bold uppercase tracking-wider">Directories</h2>
          {selectedFolder && (
            <button onClick={() => setSelectedFolder(null)} className="text-label-sm text-primary font-bold hover:underline flex items-center gap-1">
              <X size={14} /> Clear Filter
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          {folders.length === 0 && (
            <div className="text-text-muted text-sm py-4">No folders yet — create one to get started.</div>
          )}
          {folders.map((folder) => {
            const isSelected = selectedFolder === folder.id;
            const fileCount = files.filter(f => f.folder_id === folder.id).length;
            return (
              <div
                key={folder.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedFolder(isSelected ? null : folder.id); }}
                onClick={() => setSelectedFolder(isSelected ? null : folder.id)}
                className={`glass-card rounded-2xl p-5 text-left w-full sm:w-[240px] flex flex-col justify-between h-[120px] transition-all group relative overflow-hidden cursor-pointer ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'hover:border-text-subtle'}`}
              >
                <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full ${folder.color}`} />
                <div className="flex justify-between items-start z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${folder.color}`}>
                    <span className="text-[20px]">{folder.sticker}</span>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openEditFolder(folder); }} className="w-7 h-7 rounded-lg bg-surface/80 hover:bg-surface border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors" title="Edit Folder">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }} className="w-7 h-7 rounded-lg bg-surface/80 hover:bg-surface border border-border flex items-center justify-center text-text-muted hover:text-error transition-colors" title="Delete Folder">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="z-10 mt-auto">
                  <h4 className="font-display font-bold text-headline-sm text-text-main truncate">{folder.name}</h4>
                  <p className="text-label-sm text-text-muted font-medium mt-0.5">{fileCount} files</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Files */}
      <section>
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <h2 className="text-label-md text-text-main font-bold uppercase tracking-wider">Documents</h2>
          <span className="text-label-sm text-text-muted font-semibold">{filteredFiles.length} items</span>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-border rounded-3xl shadow-sm">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
              <FolderOpen size={28} className="text-text-subtle" />
            </div>
            <p className="font-display text-headline-sm text-text-main font-bold mb-2">No files found</p>
            <p className="text-body-sm text-text-muted max-w-sm mx-auto mb-6">
              Build a prompt or create a file to start filling your workspace.
            </p>
            <Link href="/builder" className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-label-sm inline-flex items-center gap-2 hover:shadow-glow transition-all">
              <Sparkles size={16} /> Open Prompt Builder
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {filteredFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card rounded-2xl p-5 flex flex-col justify-between h-[180px] group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                        {getFileIcon(file.type)}
                      </div>
                      <Badge variant={file.type as any} className="text-[10px] font-bold uppercase shadow-sm">
                        {file.type}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-text-main text-[15px] leading-tight line-clamp-2" title={file.name}>
                      {file.name}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-[12px] text-text-subtle font-medium flex items-center gap-1.5">
                      <Calendar size={12} /> {file.date?.split(',')[0] ?? ''}
                    </p>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditFile(file)} className="w-8 h-8 rounded-lg bg-surface border border-border hover:border-primary flex items-center justify-center text-text-muted hover:text-primary transition-colors" title="Rename File">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setViewingFile(file)} className="w-8 h-8 rounded-lg bg-surface border border-border hover:border-primary flex items-center justify-center text-text-muted hover:text-primary transition-colors" title="View">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDeleteFile(file.id, file.name, file.folder_id)} className="w-8 h-8 rounded-lg bg-surface border border-border hover:border-error hover:bg-error/10 flex items-center justify-center text-text-muted hover:text-error transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ── Modals ── */}
      <AnimatePresence>

        {/* Create Folder */}
        {showFolderModal && (
          <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface border border-border rounded-[24px] w-full max-w-[480px] p-7 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-headline-sm font-bold text-text-main">Create Directory</h3>
                <button onClick={() => setShowFolderModal(false)} className="text-text-subtle hover:text-text-main"><X size={20} /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Folder Name</label>
                  <input type="text" placeholder="e.g. Science Projects" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-text-main" />
                </div>
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {stickerOptions.map((s) => (
                      <button key={s} onClick={() => setNewFolderSticker(s)} className={`w-10 h-10 rounded-xl text-[20px] flex items-center justify-center transition-all ${newFolderSticker === s ? 'bg-background border-2 border-primary shadow-sm' : 'border border-border hover:bg-background'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Color Theme</label>
                  <div className="flex gap-3">
                    {folderColors.map((col) => (
                      <button key={col.id} onClick={() => setNewFolderColor(col.id)} className={`w-8 h-8 rounded-full ${col.id} transition-all ${newFolderColor === col.id ? 'ring-4 ring-primary/20 scale-110 shadow-md' : 'hover:scale-110 opacity-80 hover:opacity-100'}`} title={col.name} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowFolderModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-label-md text-text-muted hover:bg-background transition-colors">Cancel</button>
                <button onClick={handleCreateFolder} className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-label-md hover:bg-primary-hover transition-colors shadow-md">Create Folder</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create File */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface border border-border rounded-[24px] w-full max-w-[540px] p-7 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-headline-sm font-bold text-text-main">New File</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-text-subtle hover:text-text-main"><X size={20} /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">File Name</label>
                  <input type="text" placeholder="e.g. Lesson Plan" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-text-main" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label-sm font-semibold text-text-muted block mb-2">Type</label>
                    <select value={newFileType} onChange={(e) => setNewFileType(e.target.value as any)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary transition-all cursor-pointer text-text-main">
                      <option value="prompt">Prompt Blueprint</option>
                      <option value="pdf">PDF Document</option>
                      <option value="docx">Word Document</option>
                      <option value="pptx">Presentation</option>
                      <option value="img">Image File</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label-sm font-semibold text-text-muted block mb-2">Directory</label>
                    <select value={newFileFolder} onChange={(e) => setNewFileFolder(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary transition-all cursor-pointer text-text-main">
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Content</label>
                  <textarea placeholder="Enter file contents or prompt details..." value={newFileContent} onChange={(e) => setNewFileContent(e.target.value)} className="w-full h-32 bg-background border border-border rounded-xl p-4 text-body-md resize-none font-mono text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-text-main" />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowUploadModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-label-md text-text-muted hover:bg-background transition-colors">Cancel</button>
                <button onClick={handleUploadFile} className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-label-md hover:bg-primary-hover transition-colors shadow-md">Save File</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* View File */}
        {viewingFile && (
          <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface border border-border rounded-[24px] w-full max-w-[640px] p-7 shadow-2xl relative">
              <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={viewingFile.type as any} className="text-[10px] font-bold uppercase shadow-sm">{viewingFile.type}</Badge>
                    <span className="text-label-sm text-text-muted font-medium">{folders.find(f => f.id === viewingFile.folder_id)?.name}</span>
                  </div>
                  <h3 className="font-display text-headline-sm text-text-main font-bold pr-8 leading-tight">{viewingFile.name}</h3>
                </div>
                <button onClick={() => setViewingFile(null)} className="text-text-subtle hover:text-text-main absolute top-7 right-7"><X size={24} /></button>
              </div>
              <div className="bg-background border border-border rounded-xl p-5 font-mono text-[13px] text-text-main leading-relaxed max-h-[250px] overflow-y-auto custom-scrollbar whitespace-pre-wrap shadow-inner">
                {viewingFile.content || 'No content available.'}
              </div>
              {viewingFile.type === 'prompt' && (
                <div className="mt-5 border-t border-border pt-4 text-left">
                  <p className="text-label-sm font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Rocket size={14} className="text-primary animate-pulse" /> Launch Platform & Copy Prompt
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                    {allAvailableTools.map((tool) => (
                      <button key={tool.id} onClick={() => launchTool(tool.tool_name, tool.tool_url, viewingFile.content || '')} className="flex items-center gap-2.5 p-2 bg-background border border-border hover:border-primary rounded-xl text-left transition-all active:scale-95 text-text-main group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-white border border-border shadow-sm flex items-center justify-center p-1 shrink-0">
                          <img src={tool.tool_logo || `https://www.google.com/s2/favicons?sz=128&domain=${tool.tool_url}`} alt={tool.tool_name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?sz=128&domain=google.com'; }} />
                        </div>
                        <span className="text-[12px] font-bold truncate group-hover:text-primary transition-colors">{tool.tool_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 flex justify-between items-center pt-2">
                <p className="text-label-sm text-text-muted font-medium flex items-center gap-1.5"><Calendar size={14} /> {viewingFile.date}</p>
                <button onClick={() => { navigator.clipboard.writeText(viewingFile.content || ''); toast.success('Copied to clipboard!'); }} className="bg-surface border border-border hover:bg-background text-text-main px-5 py-2.5 rounded-xl font-semibold text-label-md hover:border-primary transition-all flex items-center gap-2 shadow-sm">
                  <Copy size={16} /> Copy Content
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Folder */}
        {editingFolder && (
          <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface border border-border rounded-[24px] w-full max-w-[480px] p-7 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-headline-sm font-bold text-text-main">Edit Directory</h3>
                <button onClick={() => setEditingFolder(null)} className="text-text-subtle hover:text-text-main"><X size={20} /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Folder Name</label>
                  <input type="text" placeholder="e.g. Science Projects" value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-text-main" />
                </div>
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {stickerOptions.map((s) => (
                      <button key={s} onClick={() => setEditFolderSticker(s)} className={`w-10 h-10 rounded-xl text-[20px] flex items-center justify-center transition-all ${editFolderSticker === s ? 'bg-background border-2 border-primary shadow-sm' : 'border border-border hover:bg-background'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Color Theme</label>
                  <div className="flex gap-3">
                    {folderColors.map((col) => (
                      <button key={col.id} onClick={() => setEditFolderColor(col.id)} className={`w-8 h-8 rounded-full ${col.id} transition-all ${editFolderColor === col.id ? 'ring-4 ring-primary/20 scale-110 shadow-md' : 'hover:scale-110 opacity-80 hover:opacity-100'}`} title={col.name} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setEditingFolder(null)} className="px-5 py-2.5 rounded-xl font-semibold text-label-md text-text-muted hover:bg-background transition-colors">Cancel</button>
                <button onClick={handleUpdateFolder} className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-label-md hover:bg-primary-hover transition-colors shadow-md">Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit File Name */}
        {editingFile && (
          <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface border border-border rounded-[24px] w-full max-w-[480px] p-7 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-headline-sm font-bold text-text-main">Rename File</h3>
                <button onClick={() => setEditingFile(null)} className="text-text-subtle hover:text-text-main"><X size={20} /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">File Name</label>
                  <input type="text" value={editFileName} onChange={(e) => setEditFileName(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-text-main" autoFocus />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setEditingFile(null)} className="px-5 py-2.5 rounded-xl font-semibold text-label-md text-text-muted hover:bg-background transition-colors">Cancel</button>
                <button onClick={handleUpdateFile} className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-label-md hover:bg-primary-hover transition-colors shadow-md">Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Export loader */}
        {isExporting && (
          <div className="fixed inset-0 bg-secondary/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-[360px] bg-surface border border-border p-8 rounded-[24px] text-center shadow-2xl">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package size={32} className="text-primary animate-pulse" />
              </div>
              <h4 className="font-display font-bold text-headline-sm mb-2 text-text-main">Exporting Package</h4>
              <p className="text-label-sm text-text-muted mb-6 h-5">{exportMessage}</p>
              <div className="w-full bg-background border border-border h-2 rounded-full overflow-hidden mb-3">
                <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${exportProgress}%` }} />
              </div>
              <span className="text-label-sm font-bold text-text-main">{exportProgress}% Complete</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
