'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GraduationCap, LifeBuoy, Settings } from 'lucide-react';

export default function Topbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-page h-16 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-border shadow-sm' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="flex items-center gap-2">
        <Link href="/" className="text-headline-md font-display font-bold text-text-main flex items-center gap-2">
          <GraduationCap size={28} className="text-primary" strokeWidth={2.5} />
          ClassOrbit
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <Link href="/builder" className="text-text-muted text-label-md font-medium hover:text-primary transition-colors">
          Prompt Builder
        </Link>
        <Link href="/workspace" className="text-text-muted text-label-md font-medium hover:text-primary transition-colors">
          Workspace
        </Link>
        <Link href="/tools" className="text-text-muted text-label-md font-medium hover:text-primary transition-colors">
          Launchpad
        </Link>
      </nav>

      <div className="flex items-center gap-4 relative z-20">
        <div className="hidden md:flex items-center gap-2">
          <button className="text-text-muted p-2 hover:bg-background rounded-full transition-colors cursor-pointer" title="Help">
            <LifeBuoy size={20} />
          </button>
          <button className="text-text-muted p-2 hover:bg-background rounded-full transition-colors cursor-pointer" title="Settings">
            <Settings size={20} />
          </button>
        </div>
        <Link
          href="/login"
          className="bg-text-main text-white px-6 py-2 rounded-lg text-label-md font-semibold hover:bg-text-muted transition-colors shadow-sm active:scale-95"
        >
          Sign In
        </Link>
      </div>
    </header>
  );
}
