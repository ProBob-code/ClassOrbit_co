'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LifeBuoy, Settings, LogOut, User, ChevronDown, Zap } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { usePlan } from '@/lib/hooks/usePlan';

export default function Topbar({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { profile, loading, signOut } = useUser();
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const plan = usePlan();
  const light = theme === 'light';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-page transition-all duration-500 ease-out ${
        light
          ? scrolled
            ? 'h-16 bg-white/85 backdrop-blur-2xl border-b border-slate-200 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.12)]'
            : 'h-20 bg-transparent border-b border-transparent'
          : scrolled
            ? 'h-16 bg-[#06040F]/80 backdrop-blur-2xl border-b border-white/10 shadow-soft'
            : 'h-20 bg-transparent border-b border-transparent'
      }`}
    >
      <div className="flex items-center gap-2 ml-12 md:ml-0">
        <Link href="/" className={`text-headline-md font-display font-bold flex items-center gap-3 group ${light ? 'text-slate-900' : 'text-text-main'}`}>
          <span className={`transition-all duration-500 font-extrabold tracking-tight ${scrolled ? 'text-2xl' : 'text-3xl group-hover:scale-105'}`}>
            Class<span className="text-primary">Orbit</span>
          </span>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        {(isLanding
          ? [
              { name: 'Features', href: '#how-it-works' },
              { name: 'Pricing', href: '/pricing' },
              { name: 'For Schools', href: '#for-schools' },
              { name: 'Blog', href: '/blog' },
            ]
          : [
              { name: 'Prompt Builder', href: '/builder' },
              { name: 'Workspace', href: '/workspace' },
              { name: 'Launchpad', href: '/tools' },
            ]
        ).map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`group relative text-label-md font-medium transition-colors py-2 ${
                isActive
                  ? 'text-primary'
                  : light
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-text-muted hover:text-white'
              }`}
            >
              {link.name}
              <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary transition-transform origin-left duration-300 ease-out rounded-full ${light ? '' : 'shadow-glow'} ${
                isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`} />
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 relative z-20">
        {loading ? (
          <div className={`w-10 h-10 rounded-full animate-pulse ${light ? 'bg-slate-100' : 'bg-surface'}`} />
        ) : profile ? (
          /* ===== LOGGED IN STATE ===== */
          <div className="flex items-center gap-3" ref={dropdownRef}>
            {/* Go Pro button - only for free users, not on landing */}
            {!isLanding && !plan.loading && !plan.is_pro && (
              <Link
                href="/upgrade"
                className="hidden md:flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 text-primary px-4 py-2 rounded-full text-[13px] font-bold transition-all"
              >
                <Zap size={13} fill="currentColor" strokeWidth={0} />
                Go Pro · ₹199/mo
              </Link>
            )}
            {/* Desktop helper icons */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/help"
                className={`p-2 rounded-full transition-all duration-300 ${light ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                title="Help"
              >
                <LifeBuoy size={18} strokeWidth={2} />
              </Link>
              <Link
                href="/settings"
                className={`p-2 rounded-full transition-all duration-300 ${light ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                title="Settings"
              >
                <Settings size={18} strokeWidth={2} />
              </Link>
            </div>

            {/* User Avatar + Dropdown Trigger */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-full transition-all cursor-pointer group ${light ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name || 'User'}
                  width={36}
                  height={36}
                  unoptimized
                  className="w-9 h-9 rounded-full border-2 border-primary/40 object-cover shadow-sm group-hover:border-primary transition-colors"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-bold text-sm">
                  {(profile.name || profile.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className={`hidden lg:block text-label-md font-semibold max-w-[120px] truncate ${light ? 'text-slate-900' : 'text-text-main'}`}>
                {profile.name || profile.email?.split('@')[0] || 'Teacher'}
              </span>
              <ChevronDown
                size={16}
                className={`hidden lg:block transition-transform duration-200 ${light ? 'text-slate-500' : 'text-text-muted'} ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-[240px] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-border bg-background/50">
                  <p className="text-label-md font-bold text-text-main truncate">
                    {profile.name || 'Teacher'}
                  </p>
                  <p className="text-label-sm text-text-muted truncate">
                    {profile.email}
                  </p>
                </div>

                <div className="py-1.5">
                  <Link 
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-label-md text-text-muted hover:text-text-main hover:bg-background transition-colors font-medium"
                  >
                    <User size={18} />
                    My Profile
                  </Link>
                  <Link 
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-label-md text-text-muted hover:text-text-main hover:bg-background transition-colors font-medium"
                  >
                    <Settings size={18} />
                    Settings
                  </Link>
                  <Link 
                    href="/help"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-label-md text-text-muted hover:text-text-main hover:bg-background transition-colors font-medium"
                  >
                    <LifeBuoy size={18} />
                    Help Center
                  </Link>
                </div>

                <div className="border-t border-border py-1.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-label-md text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors font-medium cursor-pointer"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ===== LOGGED OUT STATE ===== */
          light ? (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center text-label-md font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-full transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login?next=/builder"
                className="inline-flex items-center h-10 rounded-full bg-primary hover:bg-primary-hover px-6 text-label-md font-bold text-white shadow-[0_8px_20px_-8px_rgba(245,158,11,0.7)] active:scale-95 transition-all"
              >
                Get started
              </Link>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-3">
                <button className="text-text-muted hover:text-white hover:bg-white/5 p-2 rounded-full transition-all duration-300 cursor-pointer" title="Help">
                  <LifeBuoy size={18} strokeWidth={2} />
                </button>
              </div>
              <Link
                href="/login"
                className="relative inline-flex h-10 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background active:scale-95 transition-transform"
              >
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#06040F_0%,#F59E0B_50%,#06040F_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-surface px-6 py-1 text-label-md font-semibold text-white backdrop-blur-3xl hover:bg-surface/80 transition-colors">
                  Get Started
                </span>
              </Link>
            </>
          )
        )}
      </div>
    </header>
  );
}
