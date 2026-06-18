import type { Metadata } from 'next';
import Topbar from '@/components/layout/Topbar';
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
      <main className="pt-20 bg-mesh-gradient min-h-screen font-body text-text-main">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-page pt-12 pb-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-main text-sm font-medium transition-colors mb-8">
            ← Back to home
          </Link>
        </div>
        <PricingSection />
        <FAQ />
        <div className="py-16 text-center px-margin-mobile">
          <p className="text-text-muted text-sm max-w-xl mx-auto">
            Have a question about pricing or need a custom quote for your school district?{' '}
            <a href="mailto:hello@classorbit.co" className="text-primary font-semibold hover:underline">
              Email us at hello@classorbit.co
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
