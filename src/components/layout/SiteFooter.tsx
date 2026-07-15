import Link from 'next/link';
import Image from 'next/image';

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Prompt Builder', href: '/login?next=/builder' },
      { label: 'Workspace', href: '/login?next=/workspace' },
      { label: 'Launchpad', href: '/login?next=/tools' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'For Teachers',
    links: [
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Subjects', href: '/#subjects' },
      { label: 'Blog', href: '/blog' },
      { label: 'Get started free', href: '/login?next=/builder' },
    ],
  },
  {
    title: 'For Schools',
    links: [
      { label: 'Schools & Districts', href: '/#for-schools' },
      { label: 'Early access', href: '/#for-schools' },
      { label: 'Contact sales', href: 'mailto:hello@classorbit.co' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Help Center', href: '/help' },
      { label: 'Contact', href: 'mailto:hello@classorbit.co' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="w-full bg-[#060210] border-t border-white/10 text-left relative overflow-hidden">
      {/* Faint nebula glow */}
      <div className="absolute bottom-[-40%] left-[15%] w-[500px] h-[400px] bg-secondary/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="max-w-[1500px] mx-auto px-margin-mobile md:px-margin-page py-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          {/* Brand blurb */}
          <div className="col-span-2 md:col-span-2 pr-4">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image src="/logo_transparent.png" alt="ClassOrbit" width={32} height={32} className="w-8 h-8 object-contain" />
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Class<span className="text-primary">Orbit</span>
              </span>
            </Link>
            <p className="text-[14px] text-text-muted leading-relaxed max-w-xs">
              The AI command center for teachers. Plan lessons, build resources, and launch to your
              favorite AI tools — zero prompt engineering required.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[14px] text-text-muted hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/10 pt-8 mt-12">
          <p className="text-[13px] text-text-muted font-semibold">
            © 2026 ClassOrbit.co · The AI Command Center for Teachers.
          </p>
          <p className="text-[13px] text-text-subtle">Made with ♥ for teachers everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
