import { ErrorState } from '@/components/ui/ErrorState';

export const metadata = {
  title: 'Under Maintenance - DevineDesk',
  description: 'DevineDesk is currently undergoing scheduled maintenance.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        <ErrorState
          code="503"
          title="Scheduled Maintenance"
          message="We are currently upgrading DevineDesk to bring you a better experience. We will be back online shortly. Thank you for your patience!"
          showHome={false}
        />
        
        <div className="mt-8 text-center text-sm text-neutral-500">
          Check our <a href="/status" className="text-cyan-500 hover:underline">Status Page</a> for real-time updates.
        </div>
      </div>
    </div>
  );
}
