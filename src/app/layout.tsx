import type { Metadata } from 'next';
import './globals.css';
import ToastProvider from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'ClassOrbit — The AI Prompt Studio for Educators',
  description:
    'Build perfect prompts, launch to any AI platform. ClassOrbit helps teachers craft optimized prompts effortlessly for ChatGPT, Claude, Gamma, Canva, and more — zero prompt engineering required.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-background text-on-surface font-body overflow-x-hidden">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
