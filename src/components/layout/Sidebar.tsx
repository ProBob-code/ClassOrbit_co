'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  Zap,
} from 'lucide-react';


import { useUser } from '@/lib/hooks/useUser';
import { usePlan } from '@/lib/hooks/usePlan';

const navItems = [
  { href: '/builder', label: 'Prompt Builder', icon: Sparkles },
  { href: '/workspace', label: 'Workspace', icon: FolderOpen },
  { href: '/prompts', label: 'Saved Prompts', icon: Bookmark },
  { href: '/tools', label: 'Launchpad', icon: Rocket },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, loading } = useUser();
  const plan = usePlan();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-[280px] z-40 bg-surface border-r border-border hidden md:flex flex-col shadow-soft overflow-hidden">

      {/* Logo - compact */}
      <div className="flex justify-center px-6 pt-5 pb-4 border-b border-border shrink-0">
        <Image
          src="/logo_transparent.png"
          alt="ClassOrbit Logo"
          width={96}
          height={96}
          className="w-24 h-auto object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]"
        />
      </div>

      {/* Nav - scrollable middle, takes all available space */}
      <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar px-4 py-4 text-left">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary font-bold border border-primary/20 bg-primary/10'
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


        {/* Upgrade link - inside nav, visible for free users */}
        {!plan.is_pro && (
          <Link
            href="/upgrade"
            className={`mt-2 flex items-center gap-3 px-4 py-3 rounded-xl transition-all border font-semibold ${
              pathname === '/upgrade'
                ? 'bg-primary text-white border-primary shadow-glow'
                : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/60'
            }`}
          >
            <Zap size={18} fill="currentColor" strokeWidth={0} className="shrink-0" />
            <span className="text-label-md">Upgrade to Pro</span>
            <span className="ml-auto text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">
              ₹199/mo
            </span>
          </Link>
        )}

        {/* Pro badge when active */}
        {!plan.loading && plan.is_pro && (
          <div className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
            <Zap size={15} className="text-primary shrink-0" fill="currentColor" />
            <span className="text-[12px] font-bold text-primary">Pro Plan · Active</span>
          </div>
        )}
      </nav>

      {/* Bottom section - always visible, fixed height */}
      <div className="shrink-0 px-4 pb-4 pt-3 border-t border-border flex flex-col gap-1">

        {/* New Prompt button */}
        <Link
          href="/builder"
          className="mb-2 bg-gradient-primary text-white rounded-xl py-3 px-6 flex items-center justify-center gap-2 font-semibold hover:shadow-glow active:scale-95 transition-all shadow-md text-label-md"
        >
          <Plus size={18} strokeWidth={3} />
          New Prompt
        </Link>

        {/* User profile card - always visible, always clickable */}
        {!loading && profile && (
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background transition-all group border border-transparent hover:border-border"
          >
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name || 'User'}
                width={32}
                height={32}
                unoptimized
                className="w-8 h-8 rounded-full border-2 border-primary/30 object-cover group-hover:border-primary transition-colors shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {(profile.name || profile.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text-main truncate leading-tight">
                {profile.name || 'Teacher'}
              </p>
              <p className="text-[11px] text-text-muted truncate leading-tight">
                {profile.email}
              </p>
            </div>
          </Link>
        )}

        {/* Help + Settings row */}
        <div className="flex gap-1 mt-1">
          <Link
            href="/help"
            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
              pathname === '/help' ? 'text-primary bg-primary/5' : 'text-text-muted hover:bg-background hover:text-text-main'
            }`}
          >
            <LifeBuoy size={15} />
            Help
          </Link>
          <Link
            href="/settings"
            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
              pathname === '/settings' ? 'text-primary bg-primary/5' : 'text-text-muted hover:bg-background hover:text-text-main'
            }`}
          >
            <Settings size={15} />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}
