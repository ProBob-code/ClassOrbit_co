import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: { default: 'Admin | ClassOrbit', template: '%s | ClassOrbit Admin' },
  robots: { index: false, follow: false },
};

// No ToastProvider here: this layout nests inside the root layout, which
// already mounts one. Two <Toaster>s render every toast twice.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
