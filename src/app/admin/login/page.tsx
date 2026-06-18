'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  GraduationCap, Lock, ShieldCheck, Key, Eye, EyeOff, Loader2, AlertCircle, Terminal
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/admin');
      } else {
        const data = (await res.json()) as any;
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const floatingIcons = [GraduationCap, Lock, ShieldCheck, Key, Terminal];

  return (
    <div className="min-h-screen flex items-center justify-center px-margin-mobile relative overflow-hidden bg-mesh-gradient">
      {/* Background blurs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-primary opacity-10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-indigo-500 opacity-5 blur-[120px] rounded-full" />
      </div>

      {/* Floating security and educational icons */}
      {floatingIcons.map((Icon, i) => (
        <motion.div
          key={i}
          className="absolute text-primary opacity-[0.08] pointer-events-none"
          style={{
            top: `${15 + i * 15}%`,
            left: `${10 + i * 18}%`,
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon size={64} strokeWidth={1.5} />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="glass-panel rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden text-center border-white/10">
          {/* Internal gradient glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo with Double Space Orbits */}
          <div className="relative flex items-center justify-center mb-8 h-32">
            {/* Spinning Outer Orbit Ring */}
            <div className="absolute w-36 h-36 border border-dashed border-primary/45 rounded-full animate-spin-slow pointer-events-none" />
            {/* Spinning Inner Reverse Orbit Ring */}
            <div className="absolute w-[118px] h-[118px] border border-dotted border-secondary/35 rounded-full animate-spin-reverse-slow pointer-events-none" />
            
            {/* Core Circular Logo Badge */}
            <div className="w-32 h-32 rounded-full drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] relative z-10 flex items-center justify-center bg-surface/80 backdrop-blur border border-white/10 p-0 overflow-hidden">
              <Image src="/logo_transparent.png" alt="ClassOrbit Logo" width={128} height={128} className="w-full h-full object-cover rounded-full" />
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-[26px] font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent mb-1">
              Admin Gateway
            </h1>
            <p className="text-body-md text-text-muted">
              ClassOrbit Database & Operations
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-5 text-[13px] font-medium text-left"
            >
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div>
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                autoFocus
                className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-[15px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 pr-11 text-[15px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-muted transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl font-bold text-label-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-8 shadow-glow"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Authorize Session
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-text-subtle mt-6">
          Authorized operations only · Security logging active
        </p>
      </motion.div>
    </div>
  );
}
