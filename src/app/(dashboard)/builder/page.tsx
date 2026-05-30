'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { contentTypes } from '@/data/content-types';
import { subjects } from '@/data/subjects';
import { grades, studentLevels } from '@/data/grades';
import { teachingStyles } from '@/data/teaching-styles';
import { defaultTools } from '@/data/default-tools';
import { launchTool } from '@/lib/tools/router';
import { TeacherInput, ToolPrompts } from '@/types';
import toast from 'react-hot-toast';
import { 
  Sparkles, CheckCircle2, ChevronDown, Rocket, Copy, ExternalLink, PenTool, Presentation, 
  BookOpen, FileText, ClipboardList, Book, Home, Layers, Users, MessageSquare, Gamepad2, 
  Video, CheckSquare, File, Loader2, FlaskConical, Calculator, BookA, Globe, 
  Palette, History, Music, Binary, PenLine, SlidersHorizontal, ArrowLeft, 
  Send, PartyPopper, Bookmark, RotateCcw, X, Plus
} from 'lucide-react';

const iconMap: Record<string, any> = {
  'quiz': PenTool, 'slideshow': Presentation, 'menu_book': BookOpen, 'description': FileText,
  'assignment': ClipboardList, 'auto_stories': Book, 'home_work': Home, 'style': Layers,
  'groups': Users, 'forum': MessageSquare, 'sports_esports': Gamepad2, 'videocam': Video,
  'grading': CheckSquare, 'note': File
};

const getSubjectIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('science')) return FlaskConical;
  if (l.includes('math')) return Calculator;
  if (l.includes('english')) return BookA;
  if (l.includes('history')) return History;
  if (l.includes('geography')) return Globe;
  if (l.includes('art')) return Palette;
  if (l.includes('music')) return Music;
  if (l.includes('computer')) return Binary;
  return BookOpen;
};

type BuilderMode = 'free' | 'guided';
type ViewState = 'building' | 'ready';

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-mesh-gradient text-white font-bold text-lg">Loading Workspace...</div>
    }>
      <BuilderContent />
    </Suspense>
  );
}

function BuilderContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<BuilderMode>('guided');
  const [viewState, setViewState] = useState<ViewState>('building');

  // Free type state
  const [freePrompt, setFreePrompt] = useState('');
  const [freeTools, setFreeTools] = useState<string[]>(['chatgpt', 'claude']);

  // Guided builder state
  const [formData, setFormData] = useState<TeacherInput>({
    contentType: searchParams.get('type') || 'lesson_plan',
    grade: searchParams.get('grade') || 'Grade 5',
    subject: searchParams.get('subject') || 'Science',
    topic: searchParams.get('topic') || '',
    teachingStyles: [],
    duration: '40 mins',
    studentLevel: 'average',
    selectedTools: ['chatgpt', 'claude'],
  });

  const [generatedPrompts, setGeneratedPrompts] = useState<ToolPrompts | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    if (generatedPrompts) {
      const keys = Object.keys(generatedPrompts);
      if (keys.length > 0) {
        setActiveTab(keys[0]);
      }
    }
  }, [generatedPrompts]);

  // Save to Workspace Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [workspaceFolders, setWorkspaceFolders] = useState<any[]>([]);
  const [saveFolderId, setSaveFolderId] = useState('');
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleOpenSaveModal = () => {
    const localFolders = localStorage.getItem('classorbit_folders');
    let foldersList = [];
    if (localFolders) {
      foldersList = JSON.parse(localFolders);
    } else {
      const defaultFolders = [
        { id: 'my-lessons', name: 'My Lessons', sticker: '📚', fileCount: 4, color: 'bg-primary' },
        { id: 'science', name: 'Science Lab', sticker: '🔬', fileCount: 3, color: 'bg-emerald-500' },
        { id: 'english', name: 'English Lit', sticker: '📝', fileCount: 2, color: 'bg-blue-500' },
        { id: 'math', name: 'Math Class', sticker: '📐', fileCount: 1, color: 'bg-purple-500' },
      ];
      foldersList = defaultFolders;
      localStorage.setItem('classorbit_folders', JSON.stringify(defaultFolders));
    }
    setWorkspaceFolders(foldersList);
    if (foldersList.length > 0) {
      setSaveFolderId(foldersList[0].id);
    }
    setShowSaveModal(true);
  };

  const handleSavePrompt = () => {
    if (!generatedPrompts || !activeTab) return;
    const activePromptData = generatedPrompts[activeTab];

    let targetFolderId = saveFolderId;
    let targetFolderName = '';

    const localFolders = localStorage.getItem('classorbit_folders');
    let foldersList = localFolders ? JSON.parse(localFolders) : [];

    if (isCreatingNewFolder) {
      if (!newFolderName.trim()) {
        toast.error('Please enter a folder name!');
        return;
      }
      const newId = newFolderName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const exists = foldersList.some((f: any) => f.id === newId);
      if (exists) {
        targetFolderId = newId;
        targetFolderName = foldersList.find((f: any) => f.id === newId).name;
      } else {
        const stickers = ['📚', '📝', '🔬', '📐', '🎨', '🚀', '⭐', '🦖', '🧩', '📋'];
        const colors = ['bg-primary', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500'];
        const randomSticker = stickers[Math.floor(Math.random() * stickers.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const newFolder = {
          id: newId,
          name: newFolderName.trim(),
          sticker: randomSticker,
          fileCount: 0,
          color: randomColor,
        };
        foldersList.push(newFolder);
        localStorage.setItem('classorbit_folders', JSON.stringify(foldersList));
        targetFolderId = newId;
        targetFolderName = newFolderName.trim();
      }
    } else {
      const folderObj = foldersList.find((f: any) => f.id === saveFolderId);
      targetFolderName = folderObj ? folderObj.name : 'Workspace';
    }

    // Save prompt file
    const localFiles = localStorage.getItem('classorbit_files');
    const filesList = localFiles ? JSON.parse(localFiles) : [];

    // Construct file name based on topic and active tool
    const topicText = mode === 'free' ? freePrompt.split('\n')[0] : formData.topic;
    const truncatedTopic = topicText.length > 25 ? topicText.substring(0, 25) + '...' : topicText;
    const contentTypeName = contentTypes.find(c => c.id === (mode === 'free' ? 'lesson_plan' : formData.contentType))?.label || 'Prompt';
    const fileName = `${truncatedTopic} (${contentTypeName} - ${activePromptData.toolName}).prompt`;

    const newFile = {
      id: Math.random().toString(36).substring(7),
      name: fileName,
      type: 'prompt',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      folderId: targetFolderId,
      content: activePromptData.prompt,
    };

    // Increment folder count
    const updatedFolders = foldersList.map((f: any) => 
      f.id === targetFolderId ? { ...f, fileCount: f.fileCount + 1 } : f
    );
    localStorage.setItem('classorbit_folders', JSON.stringify(updatedFolders));
    localStorage.setItem('classorbit_files', JSON.stringify([newFile, ...filesList]));

    setShowSaveModal(false);
    setIsCreatingNewFolder(false);
    setNewFolderName('');

    // Trigger toast success with Link
    toast.success((t) => (
      <span className="flex items-center gap-1.5 flex-wrap text-[14px]">
        Saved to <strong>{targetFolderName}</strong>!
        <Link 
          href="/workspace" 
          onClick={() => toast.dismiss(t.id)} 
          className="underline text-primary font-bold hover:text-primary/80 transition-colors"
        >
          View Workspace
        </Link>
      </span>
    ), { duration: 5000 });
  };

  const updateField = (field: keyof TeacherInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleStyle = (styleId: string) => {
    setFormData((prev) => ({
      ...prev,
      teachingStyles: prev.teachingStyles.includes(styleId)
        ? prev.teachingStyles.filter((s) => s !== styleId)
        : [...prev.teachingStyles, styleId],
    }));
  };

  const toggleTool = (toolId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTools: prev.selectedTools.includes(toolId)
        ? prev.selectedTools.filter((t) => t !== toolId)
        : [...prev.selectedTools, toolId],
    }));
  };

  const toggleFreeTool = (toolId: string) => {
    setFreeTools(prev => 
      prev.includes(toolId)
        ? prev.filter(t => t !== toolId)
        : [...prev, toolId]
    );
  };

  const handleCreatePrompt = async () => {
    if (mode === 'free') {
      if (!freePrompt.trim()) {
        toast.error("Please type your prompt or describe what you need!");
        return;
      }
      if (freeTools.length === 0) {
        toast.error("Please select at least one AI tool!");
        return;
      }
    } else {
      if (!formData.topic.trim()) {
        toast.error("Please provide a topic or objective!");
        return;
      }
      if (formData.selectedTools.length === 0) {
        toast.error("Please select at least one AI tool!");
        return;
      }
    }

    setIsGenerating(true);
    const loader = toast.loading('Crafting your prompt...', {
      style: {
        borderRadius: '1rem',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
      }
    });

    try {
      const bodyData = mode === 'free' 
        ? { formData: { ...formData, topic: freePrompt, selectedTools: freeTools } }
        : { formData };

      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      const tools = mode === 'free' ? freeTools : formData.selectedTools;
      const selectedToolData = defaultTools.filter(t => tools.includes(t.id));
      const prompts: ToolPrompts = {};
      for (const tool of selectedToolData) {
        prompts[tool.id] = {
          toolName: tool.tool_name,
          toolUrl: tool.tool_url,
          toolLogo: tool.tool_logo,
          prompt: data.prompt,
          category: tool.category,
        };
      }

      setGeneratedPrompts(prompts);
      setViewState('ready');
      toast.success('Your prompt is ready!', { id: loader });
    } catch (e) {
      toast.error('Failed to generate prompt. Please check your API key.', { id: loader });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    setViewState('building');
    setGeneratedPrompts(null);
  };

  // ===== PROMPT READY VIEW =====
  if (viewState === 'ready' && generatedPrompts) {
    return (
      <div className="w-full max-w-[1000px] mx-auto px-margin-mobile md:px-margin-page py-8 relative min-h-screen flex flex-col bg-mesh-gradient">
        {/* Celebration Header */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-16 md:mt-4 mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30"
          >
            <CheckCircle2 size={40} className="text-emerald-400" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-[36px] md:text-[48px] text-text-main font-extrabold tracking-tight mb-3"
          >
            Your Prompt is <span className="text-gradient-gold">Ready!</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-body-lg text-text-muted max-w-lg mx-auto"
          >
            Copy and launch directly into your preferred AI platform. Your optimized prompt is ready to go.
          </motion.p>
        </motion.div>

        {/* Prompt Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-[28px] overflow-hidden shadow-2xl mb-8"
        >
          {/* Tab bar for tools */}
          {Object.keys(generatedPrompts).length > 1 && (
            <div className="flex overflow-x-auto custom-scrollbar border-b border-border bg-surface/50">
              {Object.entries(generatedPrompts).map(([toolId, data]) => (
                <button
                  key={toolId}
                  onClick={() => setActiveTab(toolId)}
                  className={`px-6 py-4 font-semibold text-label-md whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                    activeTab === toolId
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-text-muted hover:text-text-main hover:bg-white/5'
                  }`}
                >
                  {data.toolLogo && (
                    <img src={data.toolLogo} alt={data.toolName} className="w-4 h-4 rounded-sm object-cover" />
                  )}
                  {data.toolName}
                </button>
              ))}
            </div>
          )}

          {/* Prompt content */}
          <div className="p-6">
            {Object.entries(generatedPrompts).map(([toolId, data]) => {
              if (activeTab !== toolId) return null;
              return (
                <div key={toolId}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <span className="text-label-md font-bold text-text-main">Optimized for {data.toolName}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(data.prompt);
                        toast.success('Copied to clipboard!');
                      }}
                      className="text-label-sm font-semibold bg-surface hover:bg-background border border-border shadow-sm px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors text-text-main"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                  
                  <div className="bg-surface border border-border rounded-2xl p-5 max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                    <pre className="text-body-sm font-mono text-text-main whitespace-pre-wrap break-words leading-relaxed">
                      {data.prompt}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Launch Buttons — one per selected tool */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 mb-8"
        >
          <p className="text-label-sm font-bold text-text-muted uppercase tracking-wider mb-4 text-center">
            Launch to Platform
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(generatedPrompts).map(([toolId, data]) => (
              <button
                key={toolId}
                onClick={() => launchTool(data.toolName, data.toolUrl, data.prompt)}
                className="group glass-card hover:border-primary/50 rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-glow active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-border shadow-sm overflow-hidden flex items-center justify-center p-2 shrink-0">
                  {data.toolLogo ? (
                    <img src={data.toolLogo} alt={data.toolName} className="w-full h-full object-contain" />
                  ) : (
                    <Rocket size={20} className="text-primary/40" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-display font-bold text-text-main text-[16px] group-hover:text-primary transition-colors">
                    Open in {data.toolName}
                  </p>
                  <p className="text-label-sm text-text-muted">Copies prompt & opens {data.toolName}</p>
                </div>
                <ExternalLink size={20} className="text-text-muted group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Action bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 pb-8"
        >
          <button
            onClick={handleStartOver}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border text-text-muted hover:text-text-main hover:border-text-subtle font-semibold transition-all active:scale-95"
          >
            <RotateCcw size={18} />
            Build Another Prompt
          </button>

          <button
            onClick={handleOpenSaveModal}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary/95 font-semibold transition-all active:scale-95 shadow-md shadow-primary/10"
          >
            <Bookmark size={18} />
            Save to Workspace
          </button>
        </motion.div>

        {/* Save Folder Modal */}
        <AnimatePresence>
          {showSaveModal && (
            <div className="fixed inset-0 bg-[#06040F]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-surface border border-border rounded-[24px] w-full max-w-[480px] p-7 shadow-2xl relative text-text-main"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display text-headline-sm font-bold text-text-main flex items-center gap-2">
                    <Bookmark className="text-primary" size={20} />
                    Save Prompt to Workspace
                  </h3>
                  <button onClick={() => setShowSaveModal(false)} className="text-text-subtle hover:text-text-main transition-colors">
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
                              {f.sticker} {f.name} ({f.fileCount} files)
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsCreatingNewFolder(true)}
                          className="px-4 py-3 bg-surface hover:bg-background border border-border hover:border-text-subtle text-text-main rounded-xl font-semibold transition-all text-label-md shrink-0 flex items-center gap-1"
                        >
                          <Plus size={16} />
                          New
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
                            Use Existing
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-label-md text-text-muted hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePrompt}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-semibold text-label-md transition-colors shadow-md shadow-primary/20"
                  >
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

  // ===== BUILDING VIEW (Free Type + Guided) =====
  return (
    <div className="w-full max-w-[1400px] mx-auto px-margin-mobile md:px-margin-page py-8 relative min-h-screen flex flex-col bg-mesh-gradient">
      <header className="mb-8 text-center md:text-left mt-16 md:mt-0">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center justify-center md:justify-start gap-1.5">
            <Sparkles size={16} /> Prompt Builder
          </span>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-text-main font-bold tracking-tight">
            Build Your Prompt
          </h1>
          <p className="text-body-lg text-text-muted max-w-2xl mt-2 mx-auto md:mx-0 leading-relaxed">
            Tell us what you need. We'll craft a platform-optimized prompt ready for your favorite AI tools.
          </p>
        </motion.div>
      </header>

      {/* Mode Toggle */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-1 bg-surface border border-border rounded-2xl p-1.5 w-fit mb-8 shadow-sm"
      >
        <button
          onClick={() => setMode('free')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-label-md font-semibold transition-all ${
            mode === 'free'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-muted hover:text-text-main hover:bg-background'
          }`}
        >
          <PenLine size={18} />
          Free Type
        </button>
        <button
          onClick={() => setMode('guided')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-label-md font-semibold transition-all ${
            mode === 'guided'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-muted hover:text-text-main hover:bg-background'
          }`}
        >
          <SlidersHorizontal size={18} />
          Guided Builder
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {mode === 'free' ? (
          /* ===== FREE TYPE MODE ===== */
          <motion.div
            key="free"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start flex-1 pb-12"
          >
            {/* Left: Typing Area */}
            <div className="lg:col-span-7 space-y-6 glass-panel p-6 sm:p-8 rounded-[32px]">
              <div className="space-y-3">
                <h3 className="text-headline-md font-bold text-text-main flex items-center gap-2">
                  <PenLine size={22} className="text-primary" />
                  What do you need?
                </h3>
                <p className="text-body-md text-text-muted">
                  Type freely — describe the lesson material, quiz, or resource you want to create. We'll optimize it for your chosen AI platforms.
                </p>
              </div>

              <textarea
                value={freePrompt}
                onChange={(e) => setFreePrompt(e.target.value)}
                placeholder="Example: Create a fun 10-question quiz on photosynthesis for my Grade 5 science class. Include diagrams and make it engaging with fun facts between questions..."
                className="w-full h-[240px] bg-surface border border-border rounded-2xl p-5 text-body-md leading-relaxed resize-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm placeholder:text-text-subtle"
              />

              {/* Tools selection */}
              <div className="space-y-3 pt-2">
                <label className="text-label-sm font-semibold text-text-muted ml-1">Send to AI Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {defaultTools.filter(t => t.active).map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => toggleFreeTool(tool.id)}
                      className={`px-4 py-3 rounded-xl text-label-md font-semibold transition-all border flex items-center gap-2 shadow-sm ${
                        freeTools.includes(tool.id)
                        ? 'bg-surface border-primary ring-1 ring-primary text-primary'
                        : 'bg-surface border-border hover:border-text-subtle text-text-muted hover:text-text-main'
                      }`}
                    >
                      {tool.tool_logo && (
                        <img src={tool.tool_logo} alt={tool.tool_name} className="w-5 h-5 rounded-sm object-cover" />
                      )}
                      {tool.tool_name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleCreatePrompt}
                disabled={isGenerating}
                className="w-full bg-gradient-primary text-white py-4.5 rounded-2xl font-bold text-headline-sm flex items-center justify-center gap-2 transition-all shadow-glow active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Crafting your prompt...
                  </>
                ) : (
                  <>
                    <Send size={22} />
                    Build My Prompt
                  </>
                )}
              </button>
            </div>

            {/* Right: Tips Panel */}
            <div className="lg:col-span-5">
              <div className="glass-panel rounded-[32px] p-8 border-dashed">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="font-display text-headline-md font-bold text-text-main">Tips for great prompts</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { title: 'Be specific about your audience', desc: 'Mention the grade level and student abilities' },
                    { title: 'State the content type', desc: 'Quiz, lesson plan, worksheet, presentation...' },
                    { title: 'Include learning objectives', desc: 'What should students know by the end?' },
                    { title: 'Mention format preferences', desc: 'Multiple choice, open-ended, visual, interactive...' },
                    { title: 'Add context', desc: 'Subject area, curriculum standards, time duration...' },
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[12px] font-bold mt-0.5 shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-label-md font-semibold text-text-main">{tip.title}</p>
                        <p className="text-label-sm text-text-muted">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-label-sm text-text-muted">
                    💡 <strong className="text-text-main">Prefer guidance?</strong> Switch to the{' '}
                    <button onClick={() => setMode('guided')} className="text-primary font-semibold hover:underline">
                      Guided Builder
                    </button>{' '}
                    for step-by-step prompt creation.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ===== GUIDED BUILDER MODE ===== */
          <motion.div
            key="guided"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start flex-1 pb-12"
          >
            {/* LEFT COLUMN: Builder Form */}
            <div className="lg:col-span-7 space-y-8 glass-panel p-6 sm:p-8 rounded-[32px]">
              {/* Step 1: Format */}
              <div className="space-y-4">
                <h3 className="text-headline-md font-bold text-text-main flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-label-md">1</span>
                  What are we making?
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {contentTypes.slice(0, 12).map((c) => {
                    const isSelected = formData.contentType === c.id;
                    const Icon = iconMap[c.icon] || FileText;
                    return (
                      <button
                        key={c.id}
                        onClick={() => updateField('contentType', c.id)}
                        className={`glass-card p-4 rounded-2xl flex flex-col items-center gap-3 text-center transition-all ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5 shadow-md border-primary' : 'hover:bg-background border-border hover:border-text-subtle'
                        }`}
                      >
                        <Icon size={28} className={isSelected ? 'text-primary' : 'text-text-subtle'} strokeWidth={1.5} />
                        <span className={`text-label-md font-semibold break-words whitespace-normal leading-tight ${isSelected ? 'text-primary' : 'text-text-main'}`}>
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Subject & Grade */}
              <div className="space-y-4">
                <h3 className="text-headline-md font-bold text-text-main flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-label-md">2</span>
                  Who is it for?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <label className="text-label-sm font-semibold text-text-muted ml-1">Subject Area</label>
                    <div className="relative">
                      <select 
                        value={formData.subject}
                        onChange={(e) => updateField('subject', e.target.value)}
                        className="w-full appearance-none bg-surface border border-border rounded-xl pl-10 pr-10 py-3.5 text-body-md text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                      >
                        {subjects.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                      </select>
                      {(() => {
                        const SubjectIcon = getSubjectIcon(formData.subject);
                        return <SubjectIcon size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none" />;
                      })()}
                      <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-subtle" />
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-label-sm font-semibold text-text-muted ml-1">Grade Level</label>
                    <div className="relative">
                      <select 
                        value={formData.grade}
                        onChange={(e) => updateField('grade', e.target.value)}
                        className="w-full appearance-none bg-surface border border-border rounded-xl pl-10 pr-10 py-3.5 text-body-md text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                      >
                        {grades.map(g => <option key={g.id} value={g.label}>{g.label}</option>)}
                      </select>
                      <Users size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle pointer-events-none" />
                      <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-subtle" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Topic */}
              <div className="space-y-4">
                <h3 className="text-headline-md font-bold text-text-main flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-label-md">3</span>
                  What's the topic?
                </h3>
                <textarea
                  value={formData.topic}
                  onChange={(e) => updateField('topic', e.target.value)}
                  placeholder="E.g. The water cycle, fractions, photosynthesis..."
                  className="w-full h-32 bg-surface border border-border rounded-2xl p-4 text-body-md leading-relaxed resize-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
              </div>

              {/* Step 4: Refinements */}
              <div className="space-y-4">
                <h3 className="text-headline-md font-bold text-text-main flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-label-md">4</span>
                  Refinements
                </h3>
                
                <div className="space-y-3">
                  <label className="text-label-sm font-semibold text-text-muted ml-1">Scaffolding Level</label>
                  <div className="flex flex-wrap gap-2">
                    {studentLevels.map(l => (
                      <button
                        key={l.id}
                        onClick={() => updateField('studentLevel', l.id)}
                        className={`px-5 py-2.5 rounded-full text-label-sm font-semibold transition-all border shadow-sm ${
                          formData.studentLevel === l.id 
                          ? 'bg-secondary text-white border-secondary' 
                          : 'bg-surface border-border hover:border-text-subtle text-text-muted hover:text-text-main'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-label-sm font-semibold text-text-muted ml-1">Teaching Styles (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {teachingStyles.slice(0, 5).map(s => (
                      <button
                        key={s.id}
                        onClick={() => toggleStyle(s.id)}
                        className={`px-4 py-2.5 rounded-full text-label-sm font-medium transition-all border flex items-center gap-1.5 shadow-sm ${
                          formData.teachingStyles.includes(s.id)
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-surface border-border hover:border-text-subtle text-text-muted'
                        }`}
                      >
                        {formData.teachingStyles.includes(s.id) && <CheckCircle2 size={16} />}
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 5: Platform Requirements */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-headline-md font-bold text-text-main flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-label-md">5</span>
                  Platform Specific Requirements
                </h3>
                <div className="space-y-2">
                  <label className="text-label-sm font-semibold text-text-muted ml-1">E.g., Canvas LMS format, Google Classroom, generic PDF</label>
                  <input
                    type="text"
                    value={formData.platformRequirements || ''}
                    onChange={(e) => updateField('platformRequirements', e.target.value)}
                    placeholder="Type any specific platform formatting..."
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Step 6: Tools & Submit */}
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="space-y-3">
                  <label className="text-label-sm font-semibold text-text-muted ml-1">Target AI Tools</label>
                  <div className="flex flex-wrap gap-2">
                    {defaultTools.filter(t => t.active).map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={`px-4 py-3 rounded-xl text-label-md font-semibold transition-all border flex items-center gap-2 shadow-sm ${
                          formData.selectedTools.includes(tool.id)
                          ? 'bg-surface border-primary ring-1 ring-primary text-primary'
                          : 'bg-surface border-border hover:border-text-subtle text-text-muted hover:text-text-main'
                        }`}
                      >
                        {tool.tool_logo && (
                          <img src={tool.tool_logo} alt={tool.tool_name} className="w-5 h-5 rounded-sm object-cover" />
                        )}
                        {tool.tool_name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreatePrompt}
                  disabled={isGenerating}
                  className="w-full bg-gradient-primary text-white py-4.5 rounded-2xl font-bold text-headline-sm flex items-center justify-center gap-2 transition-all shadow-glow active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      Crafting your prompt...
                    </>
                  ) : (
                    <>
                      <Sparkles size={24} />
                      Build My Prompt
                    </>
                  )}
                </button>
              </div>

              {/* Link to free type */}
              <div className="text-center pt-2">
                <p className="text-label-sm text-text-muted">
                  💡 <strong className="text-text-main">Know what you want?</strong> Use{' '}
                  <button onClick={() => setMode('free')} className="text-primary font-semibold hover:underline">
                    Free Type
                  </button>{' '}
                  to type your prompt directly.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Preview Panel */}
            <div className="lg:col-span-5 sticky top-24">
              <div className="glass-panel border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center text-center min-h-[500px]">
                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6 shadow-inner border border-border">
                  <Rocket size={40} className="text-text-subtle" strokeWidth={1.5} />
                </div>
                <h3 className="text-headline-md font-bold text-text-main mb-2">Ready for Liftoff</h3>
                <p className="text-body-md text-text-muted max-w-sm">
                  Configure your lesson parameters and hit build. Your optimized AI prompt will appear here, ready to launch.
                </p>
                <div className="mt-8 flex items-center gap-2 text-label-sm text-text-subtle">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Prompt engine standing by
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
