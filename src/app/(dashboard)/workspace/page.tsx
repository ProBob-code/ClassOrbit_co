'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import { exportLessonPackage } from '@/lib/export/zip-generator';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  FolderPlus, FilePlus, Search, Archive, Eye, Trash2, X, Copy, Package,
  FolderOpen, FileText, LayoutTemplate, Image as ImageIcon, File, Calendar, Sparkles
} from 'lucide-react';

interface FolderData {
  id: string;
  name: string;
  sticker: string;
  fileCount: number;
  color: string;
}

interface FileData {
  id: string;
  name: string;
  type: 'pdf' | 'prompt' | 'pptx' | 'img' | 'docx';
  date: string;
  folderId: string;
  content?: string;
}

const defaultFolders: FolderData[] = [
  { id: 'my-lessons', name: 'My Lessons', sticker: '📚', fileCount: 4, color: 'bg-primary' },
  { id: 'science', name: 'Science Lab', sticker: '🔬', fileCount: 3, color: 'bg-emerald-500' },
  { id: 'english', name: 'English Lit', sticker: '📝', fileCount: 2, color: 'bg-blue-500' },
  { id: 'math', name: 'Math Class', sticker: '📐', fileCount: 1, color: 'bg-purple-500' },
];

const defaultFiles: FileData[] = [
  { id: '1', name: 'Cell Biology Photosynthesis Quiz.pdf', type: 'pdf', date: 'May 28, 2026', folderId: 'science', content: 'Demoprompt for Cell Biology Multiple Choice Quiz' },
  { id: '2', name: 'Creative Writing Prompts: Time Travel.docx', type: 'docx', date: 'May 27, 2026', folderId: 'english', content: 'Generate a set of 5 creative writing prompts themed around historical time travel.' },
  { id: '3', name: 'Industrial Revolution Lesson Outline.pptx', type: 'pptx', date: 'May 26, 2026', folderId: 'my-lessons', content: 'Create a 10-slide outline for a high school lesson on the economic causes of the Industrial Revolution.' },
  { id: '4', name: 'Plant Cell Diagram High-Res.img', type: 'img', date: 'May 25, 2026', folderId: 'science', content: 'High quality visual description prompt for generating plant cell layout' },
  { id: '5', name: 'Shakespeare Sonnets Curriculum Map.pdf', type: 'pdf', date: 'May 24, 2026', folderId: 'english', content: 'Literature lesson outline for Grade 10 on Sonnet structures.' },
  { id: '6', name: 'Pythagorean Triangles Activity.docx', type: 'docx', date: 'May 23, 2026', folderId: 'math', content: 'Construct an activity sheet where students resolve real-world triangle hypotenuse questions.' },
];

const getFileIcon = (type: string) => {
  switch(type) {
    case 'pdf': return <FileText size={20} className="text-red-500" />;
    case 'docx': return <File size={20} className="text-blue-500" />;
    case 'pptx': return <LayoutTemplate size={20} className="text-orange-500" />;
    case 'img': return <ImageIcon size={20} className="text-purple-500" />;
    case 'prompt': return <FileText size={20} className="text-primary" />;
    default: return <File size={20} className="text-text-muted" />;
  }
};

const stickerOptions = ['📚', '📐', '🔬', '📝', '🎨', '🚀', '⭐', '🦖', '🧩', '📋'];
const folderColors = [
  { id: 'bg-primary', name: 'Indigo' },
  { id: 'bg-emerald-500', name: 'Emerald' },
  { id: 'bg-blue-500', name: 'Blue' },
  { id: 'bg-purple-500', name: 'Purple' },
  { id: 'bg-rose-500', name: 'Rose' },
];

export default function WorkspacePage() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderSticker, setNewFolderSticker] = useState('📚');
  const [newFolderColor, setNewFolderColor] = useState('bg-primary');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'pdf' | 'prompt' | 'pptx' | 'img' | 'docx'>('pdf');
  const [newFileFolder, setNewFileFolder] = useState('my-lessons');
  const [newFileContent, setNewFileContent] = useState('');

  const [viewingFile, setViewingFile] = useState<FileData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('Initializing export...');

  useEffect(() => {
    const localFolders = localStorage.getItem('classorbit_folders');
    const localFiles = localStorage.getItem('classorbit_files');

    if (localFolders) {
      setFolders(JSON.parse(localFolders));
    } else {
      setFolders(defaultFolders);
      localStorage.setItem('classorbit_folders', JSON.stringify(defaultFolders));
    }

    if (localFiles) {
      setFiles(JSON.parse(localFiles));
    } else {
      setFiles(defaultFiles);
      localStorage.setItem('classorbit_files', JSON.stringify(defaultFiles));
    }
  }, []);

  const saveFolders = (updated: FolderData[]) => {
    setFolders(updated);
    localStorage.setItem('classorbit_folders', JSON.stringify(updated));
  };

  const saveFiles = (updated: FileData[]) => {
    setFiles(updated);
    localStorage.setItem('classorbit_files', JSON.stringify(updated));
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Please provide a folder name!');
      return;
    }
    const folderId = newFolderName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const duplicate = folders.some(f => f.id === folderId);
    if (duplicate) {
      toast.error('Folder already exists.');
      return;
    }

    const newFolder: FolderData = {
      id: folderId,
      name: newFolderName,
      sticker: newFolderSticker,
      fileCount: 0,
      color: newFolderColor,
    };

    saveFolders([...folders, newFolder]);
    setNewFolderName('');
    setShowFolderModal(false);
    toast.success('Folder created!');
  };

  const handleUploadFile = () => {
    if (!newFileName.trim()) {
      toast.error('File name is required');
      return;
    }

    const extension = newFileType === 'pdf' ? '.pdf' : newFileType === 'pptx' ? '.pptx' : newFileType === 'docx' ? '.docx' : newFileType === 'img' ? '.jpg' : '.prompt';
    const finalName = newFileName.endsWith(extension) ? newFileName : `${newFileName}${extension}`;

    const newFile: FileData = {
      id: Math.random().toString(36).substring(7),
      name: finalName,
      type: newFileType,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      folderId: newFileFolder,
      content: newFileContent || `Content for ${newFileName}`,
    };

    const updatedFolders = folders.map(f => f.id === newFileFolder ? { ...f, fileCount: f.fileCount + 1 } : f);
    saveFolders(updatedFolders);
    saveFiles([newFile, ...files]);
    
    setNewFileName('');
    setNewFileContent('');
    setShowUploadModal(false);
    toast.success('File created successfully');
  };

  const handleDeleteFile = (id: string, name: string, folderId: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      const updatedFiles = files.filter(f => f.id !== id);
      const updatedFolders = folders.map(f => f.id === folderId ? { ...f, fileCount: Math.max(0, f.fileCount - 1) } : f);
      saveFolders(updatedFolders);
      saveFiles(updatedFiles);
      toast.success('File deleted.');
    }
  };

  const handleCompilePackage = () => {
    if (files.length === 0) {
      toast.error('Workspace is empty!');
      return;
    }
    setIsExporting(true);
    setExportProgress(10);
    setExportMessage('Compressing files...');

    setTimeout(() => {
      setExportProgress(50);
      setExportMessage('Generating metadata...');
      
      setTimeout(async () => {
        setExportProgress(85);
        setExportMessage('Finalizing ZIP package...');

        try {
          const zipFiles = files
            .filter(f => !selectedFolder || f.folderId === selectedFolder)
            .map(f => ({ name: f.name, content: f.content || '' }));

          const activeFolderTitle = selectedFolder 
            ? folders.find(f => f.id === selectedFolder)?.name || 'Export'
            : 'Workspace_Export';

          await exportLessonPackage(activeFolderTitle, zipFiles, (p) => {
            setExportProgress(Math.floor(85 + (p * 0.15)));
          });

          setIsExporting(false);
          toast.success('Export successful!');
        } catch (e) {
          setIsExporting(false);
          toast.error('Export failed.');
        }
      }, 800);
    }, 800);
  };

  const filteredFiles = files.filter((file) => {
    const matchesFolder = !selectedFolder || file.folderId === selectedFolder;
    const matchesSearch = !searchQuery || file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0 relative min-h-screen">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center gap-1.5">
            <FolderOpen size={16} /> Data Management
          </span>
          <h1 className="font-display text-display-lg-mobile md:text-[40px] text-text-main font-bold tracking-tight">
            Workspace
          </h1>
          <p className="text-body-md text-text-muted max-w-xl mt-2">
            Organize, view, and export your lesson plans, prompts, and class materials.
          </p>
        </div>

        {/* Toolbar */}
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

          <button
            onClick={() => setShowFolderModal(true)}
            className="bg-surface border border-border hover:border-text-subtle text-text-main px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <FolderPlus size={18} />
            New Folder
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <FilePlus size={18} />
            Create File
          </button>

          <button
            onClick={handleCompilePackage}
            className="bg-gradient-primary text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-glow active:scale-95"
          >
            <Archive size={18} />
            Export ZIP
          </button>
        </div>
      </div>

      {/* Folders Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-label-md text-text-main font-bold uppercase tracking-wider">
            Directories
          </h2>
          {selectedFolder && (
            <button
              onClick={() => setSelectedFolder(null)}
              className="text-label-sm text-primary font-bold hover:underline flex items-center gap-1"
            >
              <X size={14} /> Clear Filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          {folders.map((folder) => {
            const isSelected = selectedFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(isSelected ? null : folder.id)}
                className={`glass-card rounded-2xl p-5 text-left w-full sm:w-[240px] flex flex-col justify-between h-[120px] transition-all group relative overflow-hidden ${
                  isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'hover:border-text-subtle'
                }`}
              >
                <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full ${folder.color}`} />
                <div className="flex justify-between items-start z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${folder.color}`}>
                    <span className="text-[20px]">{folder.sticker}</span>
                  </div>
                </div>
                <div className="z-10 mt-auto">
                  <h4 className="font-display font-bold text-headline-sm text-text-main truncate">
                    {folder.name}
                  </h4>
                  <p className="text-label-sm text-text-muted font-medium mt-0.5">
                    {files.filter(f => f.folderId === folder.id).length} files
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Files Section */}
      <section>
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <h2 className="text-label-md text-text-main font-bold uppercase tracking-wider">
            Documents
          </h2>
          <span className="text-label-sm text-text-muted font-semibold">
            {filteredFiles.length} items
          </span>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-border rounded-3xl shadow-sm">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
              <FolderOpen size={28} className="text-text-subtle" />
            </div>
            <p className="font-display text-headline-sm text-text-main font-bold mb-2">No files found</p>
            <p className="text-body-sm text-text-muted max-w-sm mx-auto mb-6">
              Create a new file or adjust your search filters to find what you're looking for.
            </p>
            <Link
              href="/builder"
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-label-sm inline-flex items-center gap-2 hover:shadow-glow transition-all"
            >
              <Sparkles size={16} />
              Open Prompt Builder
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
                      <Calendar size={12} /> {file.date.split(',')[0]}
                    </p>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setViewingFile(file)}
                        className="w-8 h-8 rounded-lg bg-surface border border-border hover:border-primary flex items-center justify-center text-text-muted hover:text-primary transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id, file.name, file.folderId)}
                        className="w-8 h-8 rounded-lg bg-surface border border-border hover:border-error hover:bg-error/10 flex items-center justify-center text-text-muted hover:text-error transition-colors"
                        title="Delete"
                      >
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

      {/* Modals */}
      <AnimatePresence>
        {/* Create Folder Modal */}
        {showFolderModal && (
          <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-[24px] w-full max-w-[480px] p-7 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-headline-sm font-bold text-text-main">Create Directory</h3>
                <button onClick={() => setShowFolderModal(false)} className="text-text-subtle hover:text-text-main">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Folder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Projects"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {stickerOptions.map((sticker) => (
                      <button
                        key={sticker}
                        onClick={() => setNewFolderSticker(sticker)}
                        className={`w-10 h-10 rounded-xl text-[20px] flex items-center justify-center transition-all ${
                          newFolderSticker === sticker ? 'bg-background border-2 border-primary shadow-sm' : 'border border-border hover:bg-background'
                        }`}
                      >
                        {sticker}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Color Theme</label>
                  <div className="flex gap-3">
                    {folderColors.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => setNewFolderColor(col.id)}
                        className={`w-8 h-8 rounded-full ${col.id} transition-all ${
                          newFolderColor === col.id ? 'ring-4 ring-primary/20 scale-110 shadow-md' : 'hover:scale-110 opacity-80 hover:opacity-100'
                        }`}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-label-md text-text-muted hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-label-md hover:bg-primary-hover transition-colors shadow-md"
                >
                  Create Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Upload/Create File Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-[24px] w-full max-w-[540px] p-7 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-headline-sm font-bold text-text-main">New File</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-text-subtle hover:text-text-main">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">File Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Lesson Plan"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label-sm font-semibold text-text-muted block mb-2">Type</label>
                    <select
                      value={newFileType}
                      onChange={(e) => setNewFileType(e.target.value as any)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="pdf">PDF Document</option>
                      <option value="docx">Word Document</option>
                      <option value="pptx">Presentation</option>
                      <option value="img">Image File</option>
                      <option value="prompt">Prompt Blueprint</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label-sm font-semibold text-text-muted block mb-2">Directory</label>
                    <select
                      value={newFileFolder}
                      onChange={(e) => setNewFileFolder(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary transition-all cursor-pointer"
                    >
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-label-sm font-semibold text-text-muted block mb-2">Content</label>
                  <textarea
                    placeholder="Enter file contents or prompt details..."
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    className="w-full h-32 bg-background border border-border rounded-xl p-4 text-body-md resize-none font-mono text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-label-md text-text-muted hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadFile}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-label-md hover:bg-primary-hover transition-colors shadow-md"
                >
                  Save File
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* View File Modal */}
        {viewingFile && (
          <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-[24px] w-full max-w-[640px] p-7 shadow-2xl relative"
            >
              <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={viewingFile.type as any} className="text-[10px] font-bold uppercase shadow-sm">
                      {viewingFile.type}
                    </Badge>
                    <span className="text-label-sm text-text-muted font-medium">
                      {folders.find(f => f.id === viewingFile.folderId)?.name}
                    </span>
                  </div>
                  <h3 className="font-display text-headline-sm text-text-main font-bold pr-8 leading-tight">
                    {viewingFile.name}
                  </h3>
                </div>
                <button onClick={() => setViewingFile(null)} className="text-text-subtle hover:text-text-main absolute top-7 right-7">
                  <X size={24} />
                </button>
              </div>

              <div className="bg-background border border-border rounded-xl p-5 font-mono text-[13px] text-text-main leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar whitespace-pre-wrap shadow-inner">
                {viewingFile.content || 'No content available.'}
              </div>

              <div className="mt-6 flex justify-between items-center pt-2">
                <p className="text-label-sm text-text-muted font-medium flex items-center gap-1.5">
                  <Calendar size={14} /> {viewingFile.date}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingFile.content || '');
                    toast.success('Copied to clipboard!');
                  }}
                  className="bg-surface border border-border hover:bg-background text-text-main px-5 py-2.5 rounded-xl font-semibold text-label-md hover:border-primary transition-all flex items-center gap-2 shadow-sm"
                >
                  <Copy size={16} />
                  Copy Content
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Export Loader Modal */}
        {isExporting && (
          <div className="fixed inset-0 bg-secondary/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-[360px] bg-surface border border-border p-8 rounded-[24px] text-center shadow-2xl relative"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package size={32} className="text-primary animate-pulse" />
              </div>

              <h4 className="font-display font-bold text-headline-sm mb-2 text-text-main">Exporting Package</h4>
              <p className="text-label-sm text-text-muted mb-6 h-5">{exportMessage}</p>

              <div className="w-full bg-background border border-border h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <span className="text-label-sm font-bold text-text-main">{exportProgress}% Complete</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
