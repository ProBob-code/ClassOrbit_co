import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import OnboardingTour from '@/components/ui/OnboardingTour';
import NewToolWalkthrough from '@/components/ui/NewToolWalkthrough';
import { ToolsProvider } from '@/context/ToolsContext';
import ProReminderNotification from '@/components/ui/ProReminderNotification';
import FeedbackModal from '@/components/ui/FeedbackModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolsProvider>
      <Topbar />
      <Sidebar />
      <MobileNav />
      <main className="md:ml-[280px] pt-16 min-h-screen flex flex-col pb-16 md:pb-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <OnboardingTour />
      <NewToolWalkthrough />
      <ProReminderNotification />
      <FeedbackModal />
      {/* Background embellishments */}
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary opacity-[0.03] rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-secondary opacity-[0.03] rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />
    </ToolsProvider>
  );
}
