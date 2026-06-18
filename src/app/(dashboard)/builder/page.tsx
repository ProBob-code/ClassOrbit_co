'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { contentTypes } from '@/data/content-types';
import { subjects } from '@/data/subjects';
import { grades } from '@/data/grades';
import { launchTool, supportsAutoFill } from '@/lib/tools/router';
import { useTools } from '@/context/ToolsContext';
import { TeacherInput, ToolPrompts } from '@/types';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import {
  Sparkles, CheckCircle2, ChevronDown, Rocket, Copy, ExternalLink, PenTool, Presentation,
  BookOpen, FileText, ClipboardList, Book, Home, Layers, Users, MessageSquare, Gamepad2,
  Video, CheckSquare, File, Loader2, FlaskConical, Calculator, BookA, Globe,
  Palette, History, Music, Binary, PenLine, SlidersHorizontal,
  Send, Bookmark, RotateCcw, X, Plus, Share2, Lock
} from 'lucide-react';
import UpgradeModal from '@/components/ui/UpgradeModal';

interface AttachedFile {
  name: string;
  size: number;
  content: string;
  type: string;
}

const getToolLogoUrl = (url: string, logo?: string) => {
  if (logo) return logo;
  try {
    const parsedUrl = new URL(url);
    return `https://www.google.com/s2/favicons?sz=128&domain=${parsedUrl.hostname}`;
  } catch {
    return `https://www.google.com/s2/favicons?sz=128&domain=${url}`;
  }
};

const extractTxtText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

const extractDocxText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXml = await zip.file('word/document.xml')?.async('text');
    if (!documentXml) return '';
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
    const paragraphs = xmlDoc.getElementsByTagName('w:t');
    let text = '';
    for (let i = 0; i < paragraphs.length; i++) {
      text += paragraphs[i].textContent + ' ';
    }
    return text.trim();
  } catch (err) {
    console.error('Error parsing docx:', err);
    throw new Error('Failed to parse Word document. Please ensure it is not corrupted.');
  }
};

const loadPdfJs = async (): Promise<any> => {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/pdf.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PDF parser.'));
    document.head.appendChild(script);
  });
  (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  return (window as any).pdfjsLib;
};

const extractPdfText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const typedarray = new Uint8Array(reader.result as ArrayBuffer);
        const pdfjsLib = await loadPdfJs();
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          text += strings.join(' ') + '\n';
        }
        resolve(text);
      } catch (err) {
        console.error('Error parsing pdf:', err);
        reject(new Error('Failed to parse PDF. It may be a scanned or corrupted file.'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

const enforcePlatformLimits = (prompt: string, toolId: string, formData: TeacherInput, mode: BuilderMode, freePrompt: string): string => {
  const topicText = mode === 'free' ? freePrompt.split('\n')[0] : formData.topic;
  
  if (toolId === 'canva') {
    return `Create a clean, visually stunning and professional educational presentation template about "${topicText}" for a Grade ${formData.grade} ${formData.subject} class, tailored at the ${formData.studentLevel} level.`;
  }
  
  if (toolId === 'suno') {
    return `[Style: Upbeat educational children's pop, acoustic guitar, catchy clear vocals]

[Lyrics about ${topicText}]:
(Verse 1)
Let's learn about ${topicText} today!
It guides us in a simple way.
(Chorus)
Oh ${topicText}, so bright and clear,
Helping students far and near!`;
  }
  
  if (toolId === 'ideogram') {
    return `A modern, clean educational poster and visual diagram illustrating "${topicText}". Ideal for Grade ${formData.grade} ${formData.subject} classroom wall, flat vector art style, colorful high-resolution educational graphic, highly detailed.`;
  }
  
  if (toolId === 'elevenlabs') {
    let cleanScript = prompt
      .replace(/Slide \d+:?/gi, '')
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/Optimized for ElevenLabs:?/gi, '')
      .trim();
    if (cleanScript.length > 800) {
      cleanScript = cleanScript.substring(0, 800) + '...';
    }
    return `Read the following educational overview about "${topicText}" in a warm, clear, professional voice:\n\n${cleanScript}`;
  }
  
  return prompt;
};

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

const curriculumOptions = [
  { value: '', label: 'Select Curriculum (Optional)' },
  { value: 'CBSE', label: 'CBSE' },
  { value: 'ICSE / ISC', label: 'ICSE / ISC' },
  { value: 'State Board', label: 'State Board' },
  { value: 'NIOS', label: 'NIOS (National Institute of Open Schooling)' },
  { value: 'IB Board', label: 'IB (International Baccalaureate)' },
  { value: 'IGCSE', label: 'IGCSE / Cambridge' },
  { value: 'Other', label: 'Other (Type Custom)' }
];

const institutionOptions = [
  { value: '', label: 'Select Institution (Optional)' },
  { value: 'Public School', label: 'Public School' },
  { value: 'Private School', label: 'Private School' },
  { value: 'International School', label: 'International School' },
  { value: 'College', label: 'College' },
  { value: 'University', label: 'University' },
  { value: 'Online/Homeschool', label: 'Online/Homeschool' },
  { value: 'Other', label: 'Other (Type Custom)' }
];

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
  const { tools: systemTools } = useTools();
  const [mode, setMode] = useState<BuilderMode>('guided');
  const [viewState, setViewState] = useState<ViewState>('building');

  // Free type state
  const [freePrompt, setFreePrompt] = useState('');
  const [freeTools, setFreeTools] = useState<string[]>(['chatgpt', 'claude']);

  // Attachments State
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
    toast.success('Attachment removed');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsParsing(true);
    const loader = toast.loading('Reading attached document...', {
      style: {
        borderRadius: '1rem',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
      }
    });
    try {
      const newAttachments: AttachedFile[] = [...attachments];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop()?.toLowerCase();
        let content = '';
        
        if (ext === 'txt') {
          content = await extractTxtText(file);
        } else if (ext === 'docx') {
          content = await extractDocxText(file);
        } else if (ext === 'pdf') {
          content = await extractPdfText(file);
        } else {
          content = `[Non-text binary file: ${file.name}]`;
        }
        
        newAttachments.push({
          name: file.name,
          size: file.size,
          content: content,
          type: file.type || ext || 'unknown'
        });
      }
      setAttachments(newAttachments);
      toast.success('Attached successfully!', { id: loader });
    } catch (err: any) {
      toast.error(err.message || 'Error parsing document', { id: loader });
    } finally {
      setIsParsing(false);
    }
  };

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
    curriculum: '',
    institution: '',
  });

  const [generatedPrompts, setGeneratedPrompts] = useState<ToolPrompts | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');

  const [customCurriculumMode, setCustomCurriculumMode] = useState(false);
  const [customInstitutionMode, setCustomInstitutionMode] = useState(false);

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usageInfo, setUsageInfo] = useState({ used: 0, limit: 15 });
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'school'>('free');

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch('/api/me/plan');
        if (res.ok) {
          const data = (await res.json()) as any;
          setUserPlan(data.plan_type || 'free');
        }
      } catch (err) {
        console.error('Failed to fetch plan', err);
      }
    };
    fetchPlan();
  }, []);

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
  const [isSaving, setIsSaving] = useState(false);

  // Share state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleOpenSaveModal = async () => {
    try {
      const res = await fetch('/api/workspace');
      if (res.ok) {
        const data = (await res.json()) as any;
        const folders = data.folders ?? [];
        setWorkspaceFolders(folders);
        if (folders.length > 0) setSaveFolderId(folders[0].id);
        setShowSaveModal(true);
        return;
      }
    } catch { /* fall through to localStorage */ }
    // localStorage fallback
    const lf = localStorage.getItem('classorbit_folders');
    const folders = lf ? JSON.parse(lf) : [
      { id: 'my-lessons', name: 'My Lessons', sticker: '📚', color: 'bg-primary' },
    ];
    if (!lf) localStorage.setItem('classorbit_folders', JSON.stringify(folders));
    setWorkspaceFolders(folders);
    if (folders.length > 0) setSaveFolderId(folders[0].id);
    setShowSaveModal(true);
  };

  const handleSavePrompt = async () => {
    if (!generatedPrompts || !activeTab) return;
    const activePromptData = generatedPrompts[activeTab];
    setIsSaving(true);

    const topicText = mode === 'free' ? freePrompt.split('\n')[0] : formData.topic;
    const truncatedTopic = topicText.length > 25 ? topicText.substring(0, 25) + '...' : topicText;
    const contentTypeName = contentTypes.find(c => c.id === (mode === 'free' ? 'lesson_plan' : formData.contentType))?.label || 'Prompt';
    const fileName = `${truncatedTopic} (${contentTypeName} - ${activePromptData.toolName}).prompt`;

    let targetFolderId = saveFolderId;
    let targetFolderName = '';

    try {
      // Create new folder if requested
      if (isCreatingNewFolder) {
        if (!newFolderName.trim()) { toast.error('Please enter a folder name!'); setIsSaving(false); return; }
        const stickers = ['📚', '📝', '🔬', '📐', '🎨', '🚀'];
        const colors = ['bg-primary', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500'];
        const res = await fetch('/api/workspace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'folder', name: newFolderName.trim(), sticker: stickers[Math.floor(Math.random() * stickers.length)], color: colors[Math.floor(Math.random() * colors.length)] }),
        });
        if (res.ok) { const d = (await res.json()) as any; targetFolderId = d.id; targetFolderName = d.name; }
      } else {
        targetFolderName = workspaceFolders.find((f: any) => f.id === saveFolderId)?.name ?? 'Workspace';
      }

      // Save file to workspace
      await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'file', folder_id: targetFolderId, name: fileName, type: 'prompt', content: activePromptData.prompt }),
      });
    } catch {
      // Fallback: save to localStorage
      const lf = localStorage.getItem('classorbit_folders');
      const lfi = localStorage.getItem('classorbit_files');
      const folders = lf ? JSON.parse(lf) : [];
      const files = lfi ? JSON.parse(lfi) : [];
      if (!targetFolderName) targetFolderName = folders.find((f: any) => f.id === targetFolderId)?.name ?? 'Workspace';
      files.unshift({ id: Math.random().toString(36).slice(2, 9), name: fileName, type: 'prompt', date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), folderId: targetFolderId, folder_id: targetFolderId, content: activePromptData.prompt });
      localStorage.setItem('classorbit_files', JSON.stringify(files));
    }

    setShowSaveModal(false);
    setIsCreatingNewFolder(false);
    setNewFolderName('');
    setIsSaving(false);

    toast.success((t) => (
      <span className="flex items-center gap-1.5 flex-wrap text-[14px]">
        Saved to <strong>{targetFolderName}</strong>!
        <Link href="/workspace" onClick={() => toast.dismiss(t.id)} className="underline text-primary font-bold hover:text-primary/80 transition-colors">View Workspace</Link>
      </span>
    ), { duration: 5000 });
  };

  const handleShare = async () => {
    if (!generatedPrompts || !activeTab) return;
    const data = generatedPrompts[activeTab];
    setIsSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: data.toolName,
          tool_url: data.toolUrl,
          prompt_text: data.prompt,
          topic: mode === 'free' ? freePrompt.split('\n')[0] : formData.topic,
          content_type: formData.contentType,
          grade: formData.grade,
          subject: formData.subject,
        }),
      });
      if (res.ok) {
        const d = (await res.json()) as any;
        const fullUrl = `${window.location.origin}${d.url}`;
        setShareUrl(fullUrl);
        await navigator.clipboard.writeText(fullUrl);
        toast.success('Share link copied to clipboard!');
      } else {
        toast.error('Sharing unavailable right now.');
      }
    } catch { toast.error('Sharing unavailable right now.'); }
    finally { setIsSharing(false); }
  };

  const updateField = (field: keyof TeacherInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        ? { 
            formData: { 
              ...formData, 
              topic: freePrompt, 
              selectedTools: freeTools,
              hasAttachment: attachments.length > 0,
              attachedFiles: attachments.map(a => a.name)
            } 
          }
        : { 
            formData: {
              ...formData,
              hasAttachment: attachments.length > 0,
              attachedFiles: attachments.map(a => a.name)
            }
          };

      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (res.status === 403) {
        const errData = (await res.json()) as any;
        if (errData.error === 'LIMIT_REACHED') {
          toast.dismiss(loader);
          setUsageInfo({ used: errData.prompts_used ?? 25, limit: errData.prompt_limit ?? 25 });
          setShowUpgradeModal(true);
          setIsGenerating(false);
          return;
        }
        throw new Error('Failed to fetch');
      }

      if (!res.ok) throw new Error('Failed to fetch');
      const data = (await res.json()) as any;
      
      const tools = mode === 'free' ? freeTools : formData.selectedTools;
      const selectedToolData = systemTools.filter(t => tools.includes(t.id));
      const prompts: ToolPrompts = {};
      
      for (const tool of selectedToolData) {
        let toolPrompt = '';
        if (data.prompts && data.prompts[tool.id]) {
          toolPrompt = data.prompts[tool.id];
        } else if (data.prompt) {
          toolPrompt = data.prompt;
        } else {
          // Fallback context in case of parsing deviations
          toolPrompt = `Act as an expert Grade ${formData.grade} ${formData.subject} teacher. Topic: ${formData.topic}`;
        }

        // Enforce strict platform constraints (e.g. Canva, Suno, Ideogram limits)
        toolPrompt = enforcePlatformLimits(toolPrompt, tool.id, formData, mode, freePrompt);

        // Assemble combined prompt with delimiters if attachments exist
        let combinedPrompt = toolPrompt;
        if (attachments.length > 0) {
          combinedPrompt += `\n\n==================================================\n`;
          combinedPrompt += `ATTACHED REFERENCE DOCUMENTS FOR RAG:\n`;
          for (const att of attachments) {
            combinedPrompt += `\n--- START OF FILE: ${att.name} ---\n`;
            combinedPrompt += att.content;
            combinedPrompt += `\n--- END OF FILE: ${att.name} ---\n`;
          }
          combinedPrompt += `==================================================\n`;
        }

        prompts[tool.id] = {
          toolName: tool.tool_name,
          toolUrl: tool.tool_url,
          toolLogo: getToolLogoUrl(tool.tool_url, tool.tool_logo),
          prompt: combinedPrompt,
          category: tool.category,
        };
      }

      setGeneratedPrompts(prompts);
      setViewState('ready');
      toast.success('Your prompt is ready!', { id: loader });

      // Log usage for each selected tool as builder_use
      selectedToolData.forEach(tool => {
        fetch('/api/tools/usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool_id: tool.id,
            tool_name: tool.tool_name,
            is_custom: false,
            action_type: 'builder_use',
          }),
        }).catch(err => console.error("Failed to log tool usage", err));
      });

      // Automatically log the generation to Saved Prompts history
      const topicText = mode === 'free' ? freePrompt.split('\n')[0] : formData.topic;
      const contentTypeName = contentTypes.find(c => c.id === (mode === 'free' ? 'lesson_plan' : formData.contentType))?.label || 'Prompt';
      const firstTool = Object.keys(prompts)[0];
      if (firstTool) {
        fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_type: mode === 'free' ? 'Free Type' : contentTypeName,
            grade: mode === 'free' ? 'General' : formData.grade,
            subject: mode === 'free' ? 'General' : formData.subject,
            topic: topicText.length > 40 ? topicText.substring(0, 40) + '...' : topicText,
            tools: selectedToolData.map(t => t.tool_name),
            prompt_text: prompts[firstTool].prompt,
          }),
        }).catch(err => console.error("Failed to save history", err));
      }
    } catch {
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
                    <Image src={data.toolLogo} alt={data.toolName} width={16} height={16} unoptimized className="w-4 h-4 rounded-sm object-cover" />
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
                    <div className="flex flex-wrap items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <span className="text-label-md font-bold text-text-main">Optimized for {data.toolName}</span>
                      <span className="text-[11px] bg-white/5 border border-border px-2.5 py-0.5 rounded-full text-text-muted font-mono ml-1.5 shrink-0">
                        {data.prompt.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
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

        {/* Launch Buttons - one per selected tool */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 mb-8"
        >
          <p className="text-label-sm font-bold text-text-muted uppercase tracking-wider text-center">
            Launch to Platform
          </p>

          {/* Paste tip banner */}
          <div className="flex items-start gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl px-5 py-3.5">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[13px] text-emerald-300 leading-relaxed">
              <strong className="text-emerald-200">Your prompt is already copied.</strong>{' '}
              Platforms marked <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full text-[11px] font-bold">✨ Auto-paste</span> will open with the prompt pre-loaded.
              For others, press{' '}
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">Ctrl+V</kbd>
              {' '}or{' '}
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">⌘V</kbd>
              {' '}to paste after the platform opens.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(generatedPrompts).map(([toolId, data]) => {
              const autoFill = supportsAutoFill(data.toolName);
              return (
                <button
                  key={toolId}
                  onClick={() => {
                    fetch('/api/tools/usage', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        tool_id: toolId, 
                        tool_name: data.toolName, 
                        is_custom: false, 
                        action_type: 'launch' 
                      }),
                    }).catch(e => console.error('Error logging launch from builder', e));
                    launchTool(data.toolName, data.toolUrl, data.prompt);
                  }}
                  className="group glass-card hover:border-primary/50 rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-glow active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-border shadow-sm overflow-hidden flex items-center justify-center p-2 shrink-0">
                    {data.toolLogo ? (
                      <Image src={data.toolLogo} alt={data.toolName} width={48} height={48} unoptimized className="w-full h-full object-contain" />
                    ) : (
                      <Rocket size={20} className="text-primary/40" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-display font-bold text-text-main text-[15px] group-hover:text-primary transition-colors">
                      Open in {data.toolName}
                    </p>
                    {autoFill ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-0.5">
                        ✨ Auto-paste - prompt pre-loaded
                      </span>
                    ) : (
                      <span className="text-label-sm text-text-muted">
                        Copied - press Ctrl+V / ⌘V to paste
                      </span>
                    )}
                  </div>
                  <ExternalLink size={18} className="text-text-muted group-hover:text-primary transition-colors shrink-0" />
                </button>
              );
            })}
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
            Build Another
          </button>

          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border text-text-muted hover:text-text-main hover:border-primary font-semibold transition-all active:scale-95 disabled:opacity-60"
          >
            {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
            {shareUrl ? 'Link Copied!' : 'Share Prompt'}
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
            Tell us what you need. We&apos;ll craft a platform-optimized prompt ready for your favorite AI tools.
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
                  Type freely - describe the lesson material, quiz, or resource you want to create. We&apos;ll optimize it for your chosen AI platforms.
                </p>
              </div>

              <textarea
                value={freePrompt}
                onChange={(e) => setFreePrompt(e.target.value)}
                placeholder="Example: Create a fun 10-question quiz on photosynthesis for my Grade 5 science class. Include diagrams and make it engaging with fun facts between questions..."
                className="w-full h-[240px] bg-surface border border-border rounded-2xl p-5 text-body-md leading-relaxed resize-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm placeholder:text-text-subtle"
              />

              {/* Reference Document Attachments (RAG) */}
              <div className="space-y-3 pt-2 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-label-sm font-semibold text-text-muted ml-1 flex items-center gap-1.5 cursor-pointer">
                    <FileText size={16} className="text-primary" />
                    Reference Documents / Material (Optional)
                  </label>
                  {attachments.length > 0 && (
                    <span className="text-[12px] text-primary font-bold animate-pulse">
                      {attachments.length} file(s) attached
                    </span>
                  )}
                </div>
                
                {/* Drag / Upload Zone */}
                <div className="relative border border-dashed border-border hover:border-primary/50 transition-colors rounded-2xl p-5 text-center bg-surface/30 group">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isParsing}
                  />
                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-text-subtle group-hover:text-primary group-hover:border-primary/20 transition-all">
                      {isParsing ? <Loader2 size={20} className="animate-spin text-primary" /> : <Plus size={20} />}
                    </div>
                    <div>
                      <p className="text-label-md font-bold text-text-main">
                        {isParsing ? 'Parsing attachments...' : 'Click or Drag files to attach'}
                      </p>
                      <p className="text-[11px] text-text-muted mt-1">
                        Supports PDF, Word (.docx), or Text (.txt)
                      </p>
                    </div>
                  </div>
                </div>

                {/* List of attachments */}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-surface border border-border rounded-xl p-3 shadow-sm text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold text-[10px]">
                            {file.name.split('.').pop()?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-label-sm font-bold text-text-main truncate">{file.name}</p>
                            <p className="text-[10px] text-text-muted">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="p-1 hover:bg-red-500/10 text-text-subtle hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                          title="Remove file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tools selection */}
              <div className="space-y-3 pt-2">
                <label className="text-label-sm font-semibold text-text-muted ml-1">Send to AI Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {systemTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => toggleFreeTool(tool.id)}
                      className={`px-4 py-3 rounded-xl text-label-md font-semibold transition-all border flex items-center gap-2 shadow-sm ${
                        freeTools.includes(tool.id)
                        ? 'bg-surface border-primary ring-1 ring-primary text-primary'
                        : 'bg-surface border-border hover:border-text-subtle text-text-muted hover:text-text-main'
                      }`}
                    >
                      <Image src={getToolLogoUrl(tool.tool_url, tool.tool_logo)} alt={tool.tool_name} width={20} height={20} unoptimized className="w-5 h-5 rounded-sm object-contain" />
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
                    const isPremium = userPlan === 'free' && !['quiz', 'lesson_plan', 'worksheet', 'homework', 'flashcards'].includes(c.id);
                    const Icon = iconMap[c.icon] || FileText;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          if (isPremium) {
                            setShowUpgradeModal(true);
                          } else {
                            updateField('contentType', c.id);
                          }
                        }}
                        className={`relative glass-card p-4 rounded-2xl flex flex-col items-center gap-3 text-center transition-all ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5 shadow-md border-primary' : 'hover:bg-background border-border hover:border-text-subtle'
                        } ${isPremium ? 'opacity-60 grayscale hover:grayscale-0' : ''}`}
                      >
                        {isPremium && (
                          <div className="absolute top-2 right-2 bg-secondary/80 backdrop-blur text-warning p-1 rounded-full shadow-sm" title="Pro Feature">
                            <Lock size={12} strokeWidth={2.5} />
                          </div>
                        )}
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
                  What&apos;s the topic?
                </h3>
                <textarea
                  value={formData.topic}
                  onChange={(e) => updateField('topic', e.target.value)}
                  placeholder="E.g. The water cycle, fractions, photosynthesis..."
                  className="w-full h-32 bg-surface border border-border rounded-2xl p-4 text-body-md leading-relaxed resize-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
              </div>

              {/* Step 4: Refinements & Curriculum Context */}
              <div className="space-y-6 text-left">
                <h3 className="text-headline-md font-bold text-text-main flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-label-md">4</span>
                  Refinements & Context
                </h3>
                
                <div className="space-y-3">
                  <label className="text-label-sm font-semibold text-text-muted ml-1">Target Difficulty / Scaffolding Level</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'weak', label: 'Easy / Foundational' },
                      { id: 'average', label: 'Standard / Average' },
                      { id: 'advanced', label: 'Advanced / High-Order' },
                      { id: 'mixed', label: 'Mixed / Balanced Rigor' },
                    ].map(l => (
                      <button
                        key={l.id}
                        type="button"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2 relative">
                    <label className="text-label-sm font-semibold text-text-muted ml-1 flex justify-between items-center">
                      Curriculum / Board
                      {customCurriculumMode && (
                        <button type="button" onClick={() => { setCustomCurriculumMode(false); updateField('curriculum', ''); }} className="text-primary hover:underline text-[11px]">Choose from list</button>
                      )}
                    </label>
                    {!customCurriculumMode ? (
                      <div className="relative">
                        <select
                          value={curriculumOptions.find(o => o.value === formData.curriculum) ? formData.curriculum : ''}
                          onChange={(e) => {
                            if (e.target.value === 'Other') {
                              setCustomCurriculumMode(true);
                              updateField('curriculum', '');
                            } else {
                              updateField('curriculum', e.target.value);
                            }
                          }}
                          className="w-full appearance-none bg-surface border border-border rounded-xl px-4 py-3 text-body-md text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                        >
                          {curriculumOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-subtle" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData.curriculum || ''}
                        onChange={(e) => updateField('curriculum', e.target.value)}
                        placeholder="Type curriculum..."
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm text-text-main placeholder:text-text-subtle"
                        autoFocus
                      />
                    )}
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-label-sm font-semibold text-text-muted ml-1 flex justify-between items-center">
                      Institution / University / City
                      {customInstitutionMode && (
                        <button type="button" onClick={() => { setCustomInstitutionMode(false); updateField('institution', ''); }} className="text-primary hover:underline text-[11px]">Choose from list</button>
                      )}
                    </label>
                    {!customInstitutionMode ? (
                      <div className="relative">
                        <select
                          value={institutionOptions.find(o => o.value === formData.institution) ? formData.institution : ''}
                          onChange={(e) => {
                            if (e.target.value === 'Other') {
                              setCustomInstitutionMode(true);
                              updateField('institution', '');
                            } else {
                              updateField('institution', e.target.value);
                            }
                          }}
                          className="w-full appearance-none bg-surface border border-border rounded-xl px-4 py-3 text-body-md text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
                        >
                          {institutionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-subtle" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData.institution || ''}
                        onChange={(e) => updateField('institution', e.target.value)}
                        placeholder="Type institution..."
                        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-body-md focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm text-text-main placeholder:text-text-subtle"
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Step 5: Reference Materials & Documents (RAG) */}
              <div className="space-y-4 pt-4 border-t border-border text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-headline-md font-bold text-text-main flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-label-md">5</span>
                    Reference Materials & Documents (Optional)
                  </h3>
                  {attachments.length > 0 && (
                    <span className="text-[12px] text-primary font-bold animate-pulse">
                      {attachments.length} file(s) attached
                    </span>
                  )}
                </div>
                <p className="text-body-sm text-text-muted leading-relaxed">
                  Attach syllabus outlines, reference papers, lesson notes, or textbooks. The AI will ground all generated content directly in these files.
                </p>
                
                {/* Upload Zone */}
                <div className="relative border border-dashed border-border hover:border-primary/50 transition-colors rounded-2xl p-5 text-center bg-surface/30 group">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isParsing}
                  />
                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-text-subtle group-hover:text-primary group-hover:border-primary/20 transition-all">
                      {isParsing ? <Loader2 size={20} className="animate-spin text-primary" /> : <Plus size={20} />}
                    </div>
                    <div>
                      <p className="text-label-md font-bold text-text-main">
                        {isParsing ? 'Parsing attachments...' : 'Click or Drag files to attach'}
                      </p>
                      <p className="text-[11px] text-text-muted mt-1">
                        Supports PDF, Word (.docx), or Text (.txt)
                      </p>
                    </div>
                  </div>
                </div>

                {/* List of attachments */}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-surface border border-border rounded-xl p-3 shadow-sm text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold text-[10px]">
                            {file.name.split('.').pop()?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-label-sm font-bold text-text-main truncate">{file.name}</p>
                            <p className="text-[10px] text-text-muted">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="p-1 hover:bg-red-500/10 text-text-subtle hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                          title="Remove file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 6: Tools & Submit */}
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="space-y-3">
                  <label className="text-label-sm font-semibold text-text-muted ml-1">Target AI Tools</label>
                  <div className="flex flex-wrap gap-2">
                    {systemTools.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={`px-4 py-3 rounded-xl text-label-md font-semibold transition-all border flex items-center gap-2 shadow-sm ${
                          formData.selectedTools.includes(tool.id)
                          ? 'bg-surface border-primary ring-1 ring-primary text-primary'
                          : 'bg-surface border-border hover:border-text-subtle text-text-muted hover:text-text-main'
                        }`}
                      >
                        <Image src={getToolLogoUrl(tool.tool_url, tool.tool_logo)} alt={tool.tool_name} width={20} height={20} unoptimized className="w-5 h-5 rounded-sm object-contain" />
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

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        promptsUsed={usageInfo.used}
        promptLimit={usageInfo.limit}
      />
    </div>
  );
}
