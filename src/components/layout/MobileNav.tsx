'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, FolderOpen, Bookmark, Rocket, Menu, X, 
  User, Settings, LifeBuoy, LogOut 
} from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';

const navItems = [
  { href: '/builder', label: 'Builder', icon: Sparkles },
  { href: '/workspace', label: 'Drive', icon: FolderOpen },
  { href: '/prompts', label: 'Prompts', icon: Bookmark },
  { href: '/tools', label: 'Tools', icon: Rocket },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { profile, loading, signOut } = useUser();

  return (
    <>
      {/* Mobile hamburger - only visible on small screens */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-5 left-4 z-[60] p-2 bg-surface rounded-full border border-border shadow-soft cursor-pointer text-text-main hover:bg-background transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-xl border-t border-border flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile slide-out menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 h-full w-[280px] bg-surface z-[56] p-6 pt-20 flex flex-col border-r border-border"
            >
              {/* User info */}
              {!loading && profile && (
                <div className="flex items-center gap-3 mb-8 pb-5 border-b border-border">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.name || 'User'}
                      width={44}
                      height={44}
                      unoptimized
                      className="w-11 h-11 rounded-full border-2 border-primary/30 object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold">
                      {(profile.name || profile.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-label-md text-text-main font-bold truncate">
                      {profile.name || 'Teacher'}
                    </p>
                    <p className="text-label-sm text-text-muted truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                          : 'text-text-muted hover:bg-background hover:text-text-main border border-transparent'
                      }`}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-label-md font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom links */}
              <div className="pt-4 border-t border-border flex flex-col gap-1">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-all font-medium"
                >
                  <User size={18} />
                  <span className="text-label-sm">Profile</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-all font-medium"
                >
                  <Settings size={18} />
                  <span className="text-label-sm">Settings</span>
                </Link>
                <Link
                  href="/help"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-text-muted hover:text-text-main hover:bg-background rounded-lg transition-all font-medium"
                >
                  <LifeBuoy size={18} />
                  <span className="text-label-sm">Help Center</span>
                </Link>
                {profile && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition-all font-medium cursor-pointer mt-1"
                  >
                    <LogOut size={18} />
                    <span className="text-label-sm">Sign Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
