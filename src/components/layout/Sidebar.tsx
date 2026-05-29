'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  FolderOpen, 
  Bookmark, 
  Rocket, 
  GraduationCap, 
  LifeBuoy, 
  Settings,
  Plus
} from 'lucide-react';

const navItems = [
  { href: '/builder', label: 'Prompt Builder', icon: Sparkles },
  { href: '/workspace', label: 'Workspace', icon: FolderOpen },
  { href: '/prompts', label: 'Saved Prompts', icon: Bookmark },
  { href: '/tools', label: 'Launchpad', icon: Rocket },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-[280px] flex-col p-6 z-40 bg-surface border-r border-border hidden md:flex shadow-soft">
      {/* Teacher Workspace Header */}
      <div className="flex items-center gap-3.5 mb-8 pb-5">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
          <GraduationCap size={24} strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <p className="font-display text-label-md text-text-main font-bold leading-tight">ClassOrbit</p>
          <p className="text-label-sm text-text-muted mt-0.5">Educator Studio</p>
        </div>
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
              className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary font-semibold shadow-sm border border-border bg-white'
                  : 'text-text-muted hover:bg-background hover:text-text-main font-medium'
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

      {/* Help link at bottom */}
      <div className="pt-4 border-t border-border flex flex-col gap-1 text-left">
        <Link
          href="#"
          className="flex items-center gap-3 text-text-muted px-4 py-2.5 hover:bg-background rounded-lg transition-all font-medium"
        >
          <LifeBuoy size={18} />
          <span className="text-label-sm">Help Center</span>
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 text-text-muted px-4 py-2.5 hover:bg-background rounded-lg transition-all font-medium"
        >
          <Settings size={18} />
          <span className="text-label-sm">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
