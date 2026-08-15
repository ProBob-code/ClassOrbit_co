import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import ToastProvider from '@/components/ui/Toast';
import AnalyticsBeacon from '@/components/AnalyticsBeacon';

const BASE_URL = 'https://classorbit.co';

// Self-hosted at build time, so the browser makes no request to Google and
// nothing render-blocking sits in front of first paint. Both are variable
// fonts, so the old 300–800 weight list needs no `weight` option.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'ClassOrbit: The AI Command Center for Teachers',
    template: '%s | ClassOrbit',
  },
  description:
    'Your AI-powered classroom command center. ClassOrbit helps teachers plan lessons, create resources, and launch to ChatGPT, Claude, Canva, Gamma, NotebookLM, and more, zero prompt engineering required.',
  keywords: [
    'AI prompts for teachers',
    'ChatGPT for educators',
    'lesson plan AI generator',
    'classroom AI tools',
    'prompt builder for teachers',
    'AI teaching assistant',
    'ClassOrbit',
  ],
  authors: [{ name: 'ClassOrbit' }],
  creator: 'ClassOrbit',
  publisher: 'ClassOrbit',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'ClassOrbit',
    title: 'ClassOrbit: The AI Command Center for Teachers',
    description:
      'Your AI-powered classroom command center. Plan lessons, create resources, and launch directly to ChatGPT, Claude, Canva, Gamma, and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ClassOrbit: The AI Command Center for Teachers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClassOrbit: The AI Command Center for Teachers',
    description: 'Your AI-powered classroom command center for teachers.',
    images: ['/og-image.png'],
    creator: '@classorbit',
  },
  manifest: undefined,
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport = {
  themeColor: '#F59E0B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} scroll-smooth h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-on-surface font-body overflow-x-hidden" suppressHydrationWarning>
        {children}
        <ToastProvider />
        <AnalyticsBeacon />
      </body>
    </html>
  );
}
