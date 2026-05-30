'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  FolderOpen, 
  Bookmark, 
  Rocket, 
  LifeBuoy, 
  Settings,
  Plus,
  User
} from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';

const navItems = [
  { href: '/builder', label: 'Prompt Builder', icon: Sparkles },
  { href: '/workspace', label: 'Workspace', icon: FolderOpen },
  { href: '/prompts', label: 'Saved Prompts', icon: Bookmark },
  { href: '/tools', label: 'Launchpad', icon: Rocket },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, loading } = useUser();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-[280px] flex-col p-6 z-40 bg-surface border-r border-border hidden md:flex shadow-soft">
      {/* Teacher Workspace Header */}
      <div className="flex justify-center mb-8 pb-5 border-b border-border">
        <img 
          src="/logo_transparent.png" 
          alt="ClassOrbit Logo" 
          className="w-32 h-auto object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" 
        />
      </div>

      {/* Navigation dividers */}
      <nav className="flex flex-col gap-2 flex-grow text-left">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'text-primary font-bold shadow-soft border border-primary/20 bg-primary/10 backdrop-blur-md'
                  : 'text-text-muted hover:bg-background hover:text-text-main font-medium border border-transparent'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/5 rounded-xl"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <Icon size={20} className="relative z-10" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-label-md relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Notepad Button */}
      <Link
        href="/builder"
        className="mt-4 mb-6 bg-gradient-primary text-white rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 font-semibold hover:shadow-glow active:scale-95 transition-all shadow-md text-label-md"
      >
        <Plus size={18} strokeWidth={3} />
        New Prompt
      </Link>

      {/* User card + links at bottom */}
      <div className="pt-4 border-t border-border flex flex-col gap-1 text-left">
        {/* User card */}
        {!loading && profile && (
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl hover:bg-background transition-all group"
          >
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.name || 'User'} 
                className="w-9 h-9 rounded-full border-2 border-primary/30 object-cover group-hover:border-primary transition-colors"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                {(profile.name || profile.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-label-md font-semibold text-text-main truncate">
                {profile.name || 'Teacher'}
              </p>
              <p className="text-[11px] text-text-muted truncate">
                {profile.email}
              </p>
            </div>
          </Link>
        )}

        <Link
          href="/help"
          className={`flex items-center gap-3 text-text-muted px-4 py-2.5 hover:bg-background rounded-lg transition-all font-medium ${
            pathname === '/help' ? 'text-primary bg-primary/5' : ''
          }`}
        >
          <LifeBuoy size={18} />
          <span className="text-label-sm">Help Center</span>
        </Link>
        <Link
          href="/settings"
          className={`flex items-center gap-3 text-text-muted px-4 py-2.5 hover:bg-background rounded-lg transition-all font-medium ${
            pathname === '/settings' ? 'text-primary bg-primary/5' : ''
          }`}
        >
          <Settings size={18} />
          <span className="text-label-sm">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
