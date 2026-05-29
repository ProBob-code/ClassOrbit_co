import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Topbar />
      <Sidebar />
      <MobileNav />
      <main className="md:ml-[280px] pt-16 min-h-screen flex flex-col pb-16 md:pb-0">
        {children}
      </main>
      {/* Background embellishments */}
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary opacity-[0.03] rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-secondary opacity-[0.03] rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />
    </>
  );
}
