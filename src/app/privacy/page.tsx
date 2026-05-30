'use client';

import Link from 'next/link';
import Topbar from '@/components/layout/Topbar';

export default function PrivacyPage() {
  return (
    <>
      <Topbar />
      <main className="pt-24 bg-mesh-gradient min-h-screen relative overflow-hidden font-body text-text-main">
        {/* Galaxy Background Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48Zz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIwLjUiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuOCIvPjxjaXJjbGUgY3g9IjI1MCIgY3k9IjE1MCIgcj0iMSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC41Ii8+PGNpcmNsZSBjeD0iMzUwIiBjeT0iMzAwIiByPSIwLjUiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuNiIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjM1MCIgcj0iMS41IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjMiLz48L2c+PC9zdmc+')] opacity-20 mix-blend-screen" />
          <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 blur-[180px] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-[800px] mx-auto px-margin-mobile md:px-margin-page py-12 relative z-10 text-left">
          {/* Header Title */}
          <header className="mb-10 text-center md:text-left">
            <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block">
              Legal Documentation
            </span>
            <h1 className="font-display text-[36px] md:text-[48px] text-text-main font-bold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-body-md text-text-muted mt-2">
              Last updated: May 30, 2026
            </p>
          </header>

          {/* Policy Document Body */}
          <article className="glass-panel rounded-[32px] p-6 sm:p-10 border border-border/80 shadow-xl space-y-8 bg-surface/40 backdrop-blur-lg">
            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-text-main">1. Introduction</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                Welcome to ClassOrbit.co (the "Service", "we", "us", or "our"). We are committed to protecting the privacy and personal data of the educators, teachers, and school administrators who use our Service. This Privacy Policy explains how we collect, use, and protect your information when you use our AI Prompt Studio.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-text-main">2. Information We Collect</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                To provide our prompt building and manager services, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-body-md text-text-muted leading-relaxed">
                <li><strong>Account Credentials</strong>: Information from your Google Account OAuth session (name, email address, profile picture) used to verify and log you in.</li>
                <li><strong>Prompt Blueprints</strong>: Parameters you enter in our Builder page (grade levels, subjects, content types, teaching styles, and topics) used to engineer optimized AI prompts.</li>
                <li><strong>Workspace Directories</strong>: File lists, folders, prompt blueprints, and custom tool parameters saved locally or synced with your account profile.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-text-main">3. How We Use Your Data</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                We use collected information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-body-md text-text-muted leading-relaxed">
                <li>Provide, run, and personalize your ClassOrbit account dashboard, builder, workspace, and tools registry.</li>
                <li>Verify your account credentials via Google Secure Sign-On.</li>
                <li>Generate and customize optimized education prompt models on the Groq API engine.</li>
                <li>Analyze app usage metrics to improve interface layouts, tool launch processes, and speed.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-text-main">4. Data Storage and Security</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                Your workspace documents, folders, registered tools, and prompt favorites are securely managed and backed up. Additionally, active working directories and custom integrations are temporarily stored locally in your browser's secure `localStorage` sandbox to ensure lightning-fast speeds. We implement robust industry-standard encryption protocols to protect your OAuth tokens and cloud-synced files.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-text-main">5. Cookies</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                We use essential browser cookies and storage sessions solely to authenticate your login sessions and remember your dashboard settings. No advertising or tracking cookies are utilized on our platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-text-main">6. Changes to this Policy</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                We may periodically update this Privacy Policy. Any modifications will be posted here with an updated revision date.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-text-main">7. Contact Us</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                If you have questions regarding this Privacy Policy or your data, please contact us at: <a href="mailto:support@classorbit.co" className="text-primary font-semibold hover:underline">support@classorbit.co</a>.
              </p>
            </section>
          </article>

          {/* Quick Back Navigation */}
          <div className="mt-8 text-center md:text-left">
            <Link href="/" className="text-primary hover:underline font-bold text-label-md flex items-center gap-1.5 justify-center md:justify-start">
              <span>←</span> Back to Homepage
            </Link>
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="w-full py-12 px-margin-mobile md:px-margin-page bg-surface border-t border-border text-left relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo_transparent.png" alt="ClassOrbit Logo" className="w-8 h-8 object-contain" />
            <span className="text-2xl font-extrabold tracking-tight text-text-main">
              Class<span className="text-primary">Orbit</span>
            </span>
          </div>
          <p className="text-label-sm text-text-muted font-bold">
            © 2026 ClassOrbit.co. The AI Prompt Studio for Educators.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-text-muted hover:text-text-main font-label-sm font-bold transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-text-muted hover:text-text-main font-label-sm font-bold transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
