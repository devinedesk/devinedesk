import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Dashboard — devinedesk',
};

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  return (
    <div className="flex min-h-screen bg-app-bg text-white font-sans">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-panel-bg border-r border-muted hidden md:flex flex-col">
        <div className="p-6 border-b border-muted">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
            Admin Panel
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-4 mt-4">
            Core
          </div>
          <Link
            href="/admin"
            className="block px-4 py-2 rounded-lg bg-white/5 text-white transition-colors font-medium"
          >
            Overview
          </Link>
          <Link
            href="/admin/users"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Users & Moderation
          </Link>
          <Link
            href="/admin/finance"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Finance & Ledger
          </Link>
          <Link
            href="/admin/support"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Support Tickets
          </Link>

          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-4 mt-6">
            Observability
          </div>
          <Link
            href="/admin/audit"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Audit Logs
          </Link>
          <Link
            href="/admin/usage"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Cost & Usage
          </Link>
          <Link
            href="/admin/security"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Security Center
          </Link>
          <Link
            href="/admin/health"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            System Health
          </Link>
          <Link
            href="/admin/performance"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Performance Metrics
          </Link>

          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-4 mt-6">
            System
          </div>
          <Link
            href="/admin/operations"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Operations
          </Link>
          <Link
            href="/admin/queue"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Job Queues
          </Link>
          <Link
            href="/admin/storage"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Storage & Assets
          </Link>
          <Link
            href="/admin/feature-flags"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Feature Flags
          </Link>
          <Link
            href="/admin/infrastructure"
            className="block px-4 py-2 rounded-lg hover:bg-white/5 text-neutral-secondary hover:text-white transition-colors font-medium"
          >
            Infrastructure
          </Link>
        </nav>
        <div className="p-4 border-t border-muted">
          <Link
            href="/"
            className="block text-center text-sm text-secondary hover:text-white font-medium transition-colors"
          >
            &larr; Back to Platform
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-app-bg">
        <header className="h-16 border-b border-muted flex items-center px-6 md:hidden bg-panel-bg">
          <span className="font-bold text-red-500">Admin</span>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
