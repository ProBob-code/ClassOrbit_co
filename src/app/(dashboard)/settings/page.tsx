'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Settings, Palette, Bell, Sparkles, Save, Check, CreditCard, Zap, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { defaultTools } from '@/data/default-tools';
import toast from 'react-hot-toast';
import { usePlan } from '@/lib/hooks/usePlan';
import CheckoutButton from '@/components/ui/CheckoutButton';

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

type Tab = 'preferences' | 'billing';

function SettingsContent() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return searchParams.get('tab') === 'billing' ? 'billing' : 'preferences';
  });
  const plan = usePlan();

  useEffect(() => {
    const stored = localStorage.getItem('classorbit_settings');
    if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center gap-1.5">
          <Settings size={16} /> Preferences
        </span>
        <h1 className="font-display text-display-lg-mobile md:text-[40px] text-text-main font-bold tracking-tight">Settings</h1>
        <p className="text-body-md text-text-muted max-w-xl mt-2">Customize your ClassOrbit experience.</p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-fit mb-8">
        {([['preferences', 'Preferences'], ['billing', 'Billing & Plan']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-lg text-label-md font-semibold transition-all ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── PREFERENCES TAB ── */}
      {activeTab === 'preferences' && (
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel rounded-[24px] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Sparkles size={20} /></div>
              <div>
                <h3 className="font-display text-headline-sm font-bold text-text-main">Default AI Tools</h3>
                <p className="text-label-sm text-text-muted">Pre-select your preferred platforms when building prompts</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {defaultTools.filter(t => t.active).map(tool => (
                <button key={tool.id} onClick={() => toggleDefaultTool(tool.id)}
                  className={`px-4 py-3 rounded-xl text-label-md font-semibold transition-all border flex items-center gap-2 shadow-sm ${settings.defaultTools.includes(tool.id) ? 'bg-surface border-primary ring-1 ring-primary text-primary' : 'bg-surface border-border hover:border-text-subtle text-text-muted hover:text-text-main'}`}>
                  {tool.tool_logo && <Image src={tool.tool_logo} alt={tool.tool_name} width={20} height={20} unoptimized className="w-5 h-5 rounded-sm object-cover" />}
                  {tool.tool_name}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-[24px] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary"><Palette size={20} /></div>
              <div>
                <h3 className="font-display text-headline-sm font-bold text-text-main">Default Builder Mode</h3>
                <p className="text-label-sm text-text-muted">Choose which mode opens by default</p>
              </div>
            </div>
            <div className="flex gap-3">
              {(['guided', 'free'] as const).map(m => (
                <button key={m} onClick={() => setSettings(prev => ({ ...prev, defaultMode: m }))}
                  className={`flex-1 px-5 py-4 rounded-xl text-label-md font-semibold transition-all border text-center ${settings.defaultMode === m ? 'bg-secondary/10 border-secondary/30 text-secondary ring-1 ring-secondary/30' : 'bg-surface border-border text-text-muted hover:border-text-subtle'}`}>
                  <p className="font-bold mb-1">{m === 'guided' ? 'Guided Builder' : 'Free Type'}</p>
                  <p className="text-label-sm font-normal text-text-muted">{m === 'guided' ? 'Step-by-step form' : 'Write your own prompt'}</p>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel rounded-[24px] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Bell size={20} /></div>
              <div>
                <h3 className="font-display text-headline-sm font-bold text-text-main">Notifications</h3>
                <p className="text-label-sm text-text-muted">Manage how you receive updates</p>
              </div>
            </div>
            <div className="bg-background border border-border rounded-xl p-5 text-center">
              <p className="text-body-md text-text-muted">Notification preferences coming soon. Stay tuned!</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button onClick={handleSave} className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold text-label-md flex items-center gap-2 hover:bg-primary-hover transition-all shadow-md active:scale-95">
              {saved ? <Check size={18} /> : <Save size={18} />}
              {saved ? 'Saved!' : 'Save Settings'}
            </button>
          </motion.div>
        </div>
      )}

      {/* ── BILLING TAB ── */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Current plan card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-[24px] p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><CreditCard size={20} /></div>
              <div>
                <h3 className="font-display text-headline-sm font-bold text-text-main">Current Plan</h3>
                <p className="text-label-sm text-text-muted">Manage your subscription</p>
              </div>
            </div>

            {plan.loading ? (
              <div className="h-20 bg-background rounded-xl animate-pulse" />
            ) : plan.is_pro ? (
              /* PRO plan */
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-white text-[17px]">ClassOrbit Pro</p>
                    <p className="text-[13px] text-primary font-medium">All features unlocked · Unlimited prompts</p>
                  </div>
                  <span className="text-[11px] font-bold text-white bg-primary px-2.5 py-1 rounded-full uppercase tracking-wider">Active</span>
                </div>

                {plan.plan_expires_at && (
                  <div className="flex items-center gap-2 text-[13px] text-text-muted">
                    <Calendar size={14} />
                    <span>Renews on <strong className="text-text-main">{new Date(plan.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                  </div>
                )}

                <div className="pt-3 border-t border-border">
                  <p className="text-[13px] text-text-muted">
                    To cancel or manage your subscription, email{' '}
                    <a href="mailto:hello@classorbit.co" className="text-primary font-semibold hover:underline">hello@classorbit.co</a>
                  </p>
                </div>
              </div>
            ) : (
              /* FREE plan */
              <div className="space-y-5">
                <div className="flex items-center gap-3 bg-white/3 border border-border rounded-2xl px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-muted shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-white text-[17px]">Free Plan</p>
                    <p className="text-[13px] text-text-muted">25 prompts/month · 5 content types</p>
                  </div>
                </div>

                {/* Usage bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={13} /> Monthly Usage
                    </span>
                    <span className="text-[12px] font-bold text-primary">{plan.prompts_used} / {plan.prompt_limit} prompts</span>
                  </div>
                  <div className="h-2.5 bg-background border border-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(((plan.prompts_used) / (plan.prompt_limit ?? 25)) * 100, 100)}%`,
                        background: (plan.prompts_used / (plan.prompt_limit ?? 25)) >= 0.8 ? '#F97316' : '#F59E0B',
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-text-subtle mt-1.5">Resets on the 1st of each month</p>
                </div>

                <div className="pt-2 border-t border-border space-y-3">
                  <p className="text-[14px] text-text-muted font-medium">Upgrade to remove all limits:</p>
                  <CheckoutButton plan="pro_monthly" label="Upgrade to Pro - ₹199/month" onSuccess={() => plan.refetch()} />
                  <CheckoutButton
                    plan="pro_yearly"
                    label="Yearly Plan - ₹179/month (billed ₹2,148/year)"
                    className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary/10 transition-all active:scale-[0.98]"
                    onSuccess={() => plan.refetch()}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* What's included */}
          {!plan.is_pro && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-[24px] p-7">
              <h3 className="font-display text-headline-sm font-bold text-text-main mb-5 flex items-center gap-2">
                <Zap size={18} className="text-primary" fill="currentColor" /> What you unlock with Pro
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Unlimited prompts every month',
                  'All available AI platforms',
                  'All 14 content types',
                  'Unlimited Workspace',
                  'Document attachments (RAG)',
                  'Custom AI tool registry',
                  'Public prompt sharing',
                  'Priority generation speed',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />
                    <span className="text-[13px] text-text-muted">{f}</span>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-text-subtle mt-5">
                For school or institution pricing, email{' '}
                <a href="mailto:hello@classorbit.co" className="text-primary hover:underline font-semibold">hello@classorbit.co</a>
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
