'use client';

import Link from 'next/link';
import Topbar from '@/components/layout/Topbar';
import SiteFooter from '@/components/layout/SiteFooter';

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-body-md text-text-muted mt-2">
              Last updated: May 30, 2026
            </p>
          </header>

          {/* Terms Document Body */}
          <article className="glass-panel rounded-[32px] p-6 sm:p-10 space-y-8">
            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">1. Acceptance of Terms</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                By accessing or using ClassOrbit.co (the &quot;Service&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not access or use the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">2. Use of Service</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                ClassOrbit provides a prompt building, manager, and navigation system for educators. You agree to use the Service strictly for lawful, educational, and professional instruction purposes. You are solely responsible for verifying the accuracy of any prompts, quizzes, worksheets, or output packages engineered on ClassOrbit prior to presenting them to student audiences.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">3. Account Registration & Google Authentication</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                Access to the builder, saved prompts database, tools registry, and custom integrations requires you to register using a secure Google OAuth account session. You are responsible for keeping your login credentials confidential and for all activities that occur under your account session.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">4. Intellectual Property</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                The software, design interfaces, prompt generation algorithms, branding materials (including all ClassOrbit logos), and layouts are the exclusive property of ClassOrbit.co. However, the custom prompt blueprints and file packages you build remain completely yours to download, distribute, and teach.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">5. Integrations & External Platforms</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                Our service is built to navigate you directly to various external educational AI platforms (e.g. ChatGPT, Claude, Canva, Gamma, NotebookLM, Perplexity). We are not affiliated with, endorsed by, or legally responsible for any content, pricing structures, terms of service, or accessibility issues on these external platforms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">6. Disclaimers and Limitation of Liability</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                The Service is provided &quot;as is&quot; and &quot;as available&quot;. We do not guarantee uninterrupted, secure, or error-free operations. To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the prompt engine or navigation resources.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">7. Governing Law</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                These Terms of Service shall be governed by and construed in accordance with the laws of your local jurisdiction, without regard to conflict of law principles.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-headline-md font-bold text-white">8. Contact Information</h2>
              <p className="text-body-md text-text-muted leading-relaxed">
                If you have questions regarding these Terms of Service, please contact us at: <a href="mailto:support@classorbit.co" className="text-primary font-semibold hover:underline">support@classorbit.co</a>.
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
