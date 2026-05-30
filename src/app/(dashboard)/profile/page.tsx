'use client';

import { useUser } from '@/lib/hooks/useUser';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Sparkles, Star, LogOut, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { profile, loading, signOut } = useUser();
  const [stats, setStats] = useState({ prompts: 0, favorites: 0 });

  useEffect(() => {
    // Load stats from localStorage
    const savedPrompts = localStorage.getItem('classorbit_prompts');
    if (savedPrompts) {
      const prompts = JSON.parse(savedPrompts);
      setStats({
        prompts: prompts.length,
        favorites: prompts.filter((p: any) => p.isFavorite).length,
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface rounded-xl" />
          <div className="h-32 bg-surface rounded-3xl" />
          <div className="h-48 bg-surface rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto px-margin-mobile md:px-margin-page py-8 mt-16 md:mt-0 relative min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block flex items-center gap-1.5">
          <User size={16} /> Account
        </span>
        <h1 className="font-display text-display-lg-mobile md:text-[40px] text-text-main font-bold tracking-tight">
          My Profile
        </h1>
        <p className="text-body-md text-text-muted max-w-xl mt-2">
          Manage your ClassOrbit account and view your activity.
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-[28px] p-8 mb-8"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.name || 'User'} 
              className="w-24 h-24 rounded-full border-4 border-primary/30 object-cover shadow-glow"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary/30 flex items-center justify-center text-primary font-bold text-3xl">
              {(profile?.name || profile?.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-display text-[28px] font-bold text-text-main mb-1">
              {profile?.name || 'Teacher'}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-text-muted mb-4">
              <Mail size={16} />
              <span className="text-body-md">{profile?.email}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-text-muted">
              <Shield size={16} />
              <span className="text-label-sm font-semibold">Signed in with Google</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
      >
        <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles size={24} />
          </div>
          <div>
            <span className="text-label-sm text-text-muted font-semibold uppercase tracking-wider block mb-1">Prompts Created</span>
            <p className="font-display text-[28px] text-text-main font-bold leading-none">{stats.prompts}</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Star size={24} fill="currentColor" />
          </div>
          <div>
            <span className="text-label-sm text-text-muted font-semibold uppercase tracking-wider block mb-1">Favorites</span>
            <p className="font-display text-[28px] text-text-main font-bold leading-none">{stats.favorites}</p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="font-display text-headline-sm font-bold text-text-main mb-4">Account Actions</h3>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 font-semibold transition-all cursor-pointer active:scale-95"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}
