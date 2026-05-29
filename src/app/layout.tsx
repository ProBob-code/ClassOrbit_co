import type { Metadata } from 'next';
import './globals.css';
import ToastProvider from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'ClassOrbit — The AI Operating System for Teachers',
  description:
    'Reclaim 10+ hours a week. Smart Builder creates tailored lesson plans, grading rubrics, and personalized resources in seconds — all within one serene workspace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-on-surface font-body overflow-x-hidden">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
