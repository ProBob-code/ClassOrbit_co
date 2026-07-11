import type { Metadata } from 'next';
import './globals.css';
import ToastProvider from '@/components/ui/Toast';

const BASE_URL = 'https://classorbit.co';

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
    <html lang="en" className="scroll-smooth h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-on-surface font-body overflow-x-hidden" suppressHydrationWarning>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
