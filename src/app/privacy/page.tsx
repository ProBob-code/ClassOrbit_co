'use client';

import Link from 'next/link';
import Topbar from '@/components/layout/Topbar';
import SiteFooter from '@/components/layout/SiteFooter';

export default function PrivacyPage() {
  return (
    <>
      <Topbar />
      <main className="pt-24 galaxy-bg min-h-screen font-body text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="nebula" />
          <div className="starfield" />
          <div className="starfield starfield-far" />
          <div className="shooting-star top-[14%] right-[10%]" />
        </div>
        <div className="max-w-[900px] mx-auto px-margin-mobile md:px-margin-page py-12 relative z-10 text-left">
          {/* Header Title */}
          <header className="mb-10 text-center md:text-left">
            <span className="text-label-sm font-bold text-primary tracking-widest uppercase mb-2 block">
              Legal Documentation
            </span>
            <h1 className="font-display text-[36px] md:text-[48px] text-white font-bold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-body-md text-text-muted mt-2">
              Last updated: May 30, 2026
            </p>
          </header>

          {/* Policy Document Body */}
          <article className="glass-panel rounded-[32px] p-6 sm:p-10 space-y-8">
            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">1. Introduction</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                Welcome to ClassOrbit.co (the &quot;Service&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We are committed to protecting the privacy and personal data of the educators, teachers, and school administrators who use our Service. This Privacy Policy explains how we collect, use, and protect your information when you use the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">2. Information We Collect</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                To provide our prompt building and manager services, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-body-md text-text-muted leading-relaxed">
                <li><strong className="text-white">Account Credentials</strong>: Information from your Google Account OAuth session (name, email address, profile picture) used to verify and log you in.</li>
                <li><strong className="text-white">Prompt Blueprints</strong>: Parameters you enter in our Builder page (grade levels, subjects, content types, teaching styles, and topics) used to engineer optimized AI prompts.</li>
                <li><strong className="text-white">Workspace Directories</strong>: File lists, folders, prompt blueprints, and custom tool parameters saved locally or synced with your account profile.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">3. How We Use Your Data</h2>
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
              <h2 className="font-display text-headline-md font-bold text-white">4. Data Storage and Security</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                Your workspace documents, folders, registered tools, and prompt favorites are securely managed and backed up. Additionally, active working directories and custom integrations are temporarily stored locally in your browser&apos;s secure localStorage sandbox to ensure lightning-fast speeds. We implement robust industry-standard encryption protocols to protect your OAuth tokens and cloud-synced files.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">5. Cookies</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                We use essential browser cookies and storage sessions solely to authenticate your login sessions and remember your dashboard settings. No advertising or tracking cookies are utilized on our platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">6. Changes to this Policy</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                We may periodically update this Privacy Policy. Any modifications will be posted here with an updated revision date.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">7. Contact Us</h2>
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

      <SiteFooter />
    </>
  );
}
