import type { Metadata } from 'next';
import Topbar from '@/components/layout/Topbar';
import SiteFooter from '@/components/layout/SiteFooter';
import PricingSection from '@/components/sections/PricingSection';
import FAQ from '@/components/sections/FAQ';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'ClassOrbit pricing: free forever plan, Pro at ₹199/month, and school/enterprise plans. Start free, upgrade anytime.',
};

export default function PricingPage() {
  return (
    <>
      <Topbar />
      <main className="pt-20 galaxy-bg min-h-screen font-body text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="aurora" />
          <div className="nebula" />
          <div className="starfield" />
          <div className="starfield starfield-far" />
          <div className="shooting-star top-[10%] right-[8%]" />
        </div>
        <div className="max-w-[1400px] mx-auto px-margin-mobile md:px-margin-page pt-12 pb-4 text-center relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white text-sm font-medium transition-colors">
            ← Back to home
          </Link>
        </div>
        <PricingSection />
        <FAQ />
        <div className="py-16 text-center px-margin-mobile relative z-10">
          <p className="text-text-muted text-sm max-w-xl mx-auto">
            Have a question about pricing or need a custom quote for your school district?{' '}
            <a href="mailto:hello@classorbit.co" className="text-primary font-semibold hover:underline">
              Email us at hello@classorbit.co
            </a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
