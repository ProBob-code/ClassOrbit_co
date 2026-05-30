'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Settings, Palette, Bell, Sparkles, Save, Check } from 'lucide-react';
import { defaultTools } from '@/data/default-tools';
import toast from 'react-hot-toast';

interface UserSettings {
  defaultTools: string[];
  defaultMode: 'free' | 'guided';
  theme: 'dark';
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultTools: ['chatgpt', 'claude'],
  defaultMode: 'guided',
  theme: 'dark',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('classorbit_settings');
    if (stored) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('classorbit_settings', JSON.stringify(settings));
    setSaved(true);
    toast.success('Settings saved!');
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleDefaultTool = (toolId: string) => {
    setSettings(prev => ({
      ...prev,
      defaultTools: prev.defaultTools.includes(toolId)
        ? prev.defaultTools.filter(t => t !== toolId)
        : [...prev.defaultTools, toolId],
    }));
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0 relative min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center gap-1.5">
          <Settings size={16} /> Preferences
        </span>
        <h1 className="font-display text-display-lg-mobile md:text-[40px] text-text-main font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-body-md text-text-muted max-w-xl mt-2">
          Customize your ClassOrbit experience.
        </p>
      </motion.div>

      <div className="space-y-8">
        {/* Default AI Tools */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-[24px] p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-display text-headline-sm font-bold text-text-main">Default AI Tools</h3>
              <p className="text-label-sm text-text-muted">Pre-select your preferred platforms when building prompts</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {defaultTools.filter(t => t.active).map(tool => (
              <button
                key={tool.id}
                onClick={() => toggleDefaultTool(tool.id)}
                className={`px-4 py-3 rounded-xl text-label-md font-semibold transition-all border flex items-center gap-2 shadow-sm ${
                  settings.defaultTools.includes(tool.id)
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
        </motion.div>

        {/* Default Builder Mode */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-[24px] p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="font-display text-headline-sm font-bold text-text-main">Default Builder Mode</h3>
              <p className="text-label-sm text-text-muted">Choose which mode opens by default</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSettings(prev => ({ ...prev, defaultMode: 'guided' }))}
              className={`flex-1 px-5 py-4 rounded-xl text-label-md font-semibold transition-all border text-center ${
                settings.defaultMode === 'guided'
                  ? 'bg-secondary/10 border-secondary/30 text-secondary ring-1 ring-secondary/30'
                  : 'bg-surface border-border text-text-muted hover:border-text-subtle'
              }`}
            >
              <p className="font-bold mb-1">Guided Builder</p>
              <p className="text-label-sm font-normal text-text-muted">Step-by-step form</p>
            </button>
            <button
              onClick={() => setSettings(prev => ({ ...prev, defaultMode: 'free' }))}
              className={`flex-1 px-5 py-4 rounded-xl text-label-md font-semibold transition-all border text-center ${
                settings.defaultMode === 'free'
                  ? 'bg-secondary/10 border-secondary/30 text-secondary ring-1 ring-secondary/30'
                  : 'bg-surface border-border text-text-muted hover:border-text-subtle'
              }`}
            >
              <p className="font-bold mb-1">Free Type</p>
              <p className="text-label-sm font-normal text-text-muted">Write your own prompt</p>
            </button>
          </div>
        </motion.div>

        {/* Notifications (placeholder for future) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-[24px] p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-display text-headline-sm font-bold text-text-main">Notifications</h3>
              <p className="text-label-sm text-text-muted">Manage how you receive updates</p>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-5 text-center">
            <p className="text-body-md text-text-muted">
              Notification preferences coming soon. Stay tuned!
            </p>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={handleSave}
            className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold text-label-md flex items-center gap-2 hover:bg-primary-hover transition-all shadow-md active:scale-95"
          >
            {saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
