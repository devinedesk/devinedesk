import { DashboardSidebar } from '@/components/DashboardSidebar';
import { OnboardingTour } from '@/components/dashboard/OnboardingTour';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-app-bg text-white overflow-hidden">
      <OnboardingTour />
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
