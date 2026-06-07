import type { Metadata } from 'next';
import '../globals.css';
import ToastProvider from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: { default: 'Admin | ClassOrbit', template: '%s | ClassOrbit Admin' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastProvider />
    </>
  );
}
