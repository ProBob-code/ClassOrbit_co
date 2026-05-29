'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { contentTypes } from '@/data/content-types';
import { subjects } from '@/data/subjects';
import { grades, studentLevels } from '@/data/grades';
import { teachingStyles } from '@/data/teaching-styles';
import { defaultTools } from '@/data/default-tools';
import { generatePrompts } from '@/lib/prompt-engine/generator';
import { launchTool } from '@/lib/tools/router';
import { TeacherInput, ToolPrompts } from '@/types';
import toast from 'react-hot-toast';
import { 
  Sparkles, CheckCircle2, ChevronDown, Rocket, Copy, ExternalLink, PenTool, Presentation, 
  BookOpen, FileText, ClipboardList, Book, Home, Layers, Users, MessageSquare, Gamepad2, 
  Video, CheckSquare, File, Loader2, FlaskConical, Calculator, BookA, Globe, 
  Palette, History, Music, Binary
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

export default function BuilderPage() {
  const [formData, setFormData] = useState<TeacherInput>({
    contentType: 'lesson_plan',
    grade: 'Grade 5',
    subject: 'Science',
    topic: '',
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

  const handleCreatePrompt = () => {
    if (!formData.topic.trim()) {
      toast.error("Please provide a topic or objective!");
      return;
    }
    if (formData.selectedTools.length === 0) {
      toast.error("Please select at least one AI tool!");
      return;
    }

    setIsGenerating(true);
    const loader = toast.loading('Engineering your prompt...', {
      style: {
        borderRadius: '1rem',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
      }
    });

    setTimeout(() => {
      const prompts = generatePrompts(formData);
      setGeneratedPrompts(prompts);
      setIsGenerating(false);
      toast.success('Prompts generated successfully!', { id: loader });
    }, 1500);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-margin-mobile md:px-margin-page py-8 relative min-h-screen flex flex-col bg-mesh-gradient">
      <header className="mb-10 text-center md:text-left mt-16 md:mt-0">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center justify-center md:justify-start gap-1.5">
            <Sparkles size={16} /> AI Prompt Studio
          </span>
          <h1 className="font-display text-display-lg-mobile md:text-display-lg text-text-main font-bold tracking-tight">
            Create Lesson Materials
          </h1>
          <p className="text-body-lg text-text-muted max-w-2xl mt-2 mx-auto md:mx-0 leading-relaxed">
            Configure your parameters below. We'll engineer the perfect prompt architecture tailored for your favorite AI tools.
          </p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start flex-1 pb-12">
        
        {/* LEFT COLUMN: Builder Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="lg:col-span-7 space-y-8 glass-panel p-6 sm:p-8 rounded-[32px]"
        >
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

          {/* Step 5: Tools & Submit */}
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
                    <img src={tool.logoUrl} alt={tool.tool_name} className="w-5 h-5 rounded-sm object-cover" />
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
                  Generating Architecture...
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  Generate Prompts
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Results Panel */}
        <div className="lg:col-span-5 sticky top-24">
          <AnimatePresence mode="wait">
            {!generatedPrompts ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center text-center min-h-[600px]"
              >
                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6 shadow-inner border border-border">
                  <Rocket size={40} className="text-text-subtle" strokeWidth={1.5} />
                </div>
                <h3 className="text-headline-md font-bold text-text-main mb-2">Ready for Liftoff</h3>
                <p className="text-body-md text-text-muted max-w-sm">
                  Configure your lesson parameters on the left and hit generate. Your highly optimized AI prompts will appear here.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-[32px] overflow-hidden shadow-2xl flex flex-col min-h-[650px] max-h-[85vh] border-white/60"
              >
                {/* Tabs */}
                <div className="flex overflow-x-auto custom-scrollbar border-b border-border bg-white/60 backdrop-blur-md">
                  {Object.entries(generatedPrompts).map(([toolId, data]) => (
                    <button
                      key={toolId}
                      onClick={() => setActiveTab(toolId)}
                      className={`px-6 py-4.5 font-semibold text-label-md whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === toolId
                        ? 'border-primary text-primary bg-white'
                        : 'border-transparent text-text-muted hover:bg-white/40'
                      }`}
                    >
                      {data.toolName}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden bg-background/50">
                  {Object.entries(generatedPrompts).map(([toolId, data]) => {
                    if (activeTab !== toolId) return null;
                    return (
                      <motion.div
                        key={toolId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col h-full"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-text-main flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-success" />
                            Optimized Architecture
                          </h4>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(data.prompt);
                              toast.success('Copied to clipboard!');
                            }}
                            className="text-label-sm font-semibold bg-surface hover:bg-background border border-border shadow-sm px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors text-text-main"
                          >
                            <Copy size={16} />
                            Copy
                          </button>
                        </div>

                        <div className="flex-1 bg-surface border border-border rounded-2xl p-5 overflow-y-auto custom-scrollbar relative shadow-inner">
                          <pre className="text-body-sm font-mono text-text-main whitespace-pre-wrap break-words">
                            {data.prompt}
                          </pre>
                        </div>

                        <div className="mt-6">
                          <button
                            onClick={() => launchTool(data.toolName, data.toolUrl, data.prompt)}
                            className="w-full bg-secondary hover:bg-secondary-hover text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                          >
                            Launch {data.toolName} Workspace
                            <ExternalLink size={18} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
