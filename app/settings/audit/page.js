import { getServerSession } from 'next-auth/next';
import prisma from '@/src/lib/prisma';
import { Card } from '@/components/ui/Card';
import { redirect } from 'next/navigation';
import { FileText, Clock, User, Fingerprint } from 'lucide-react';

export default async function AuditLogsSettings() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect('/auth/signin');

  const logs = await prisma.auditLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white capitalize">Audit Logs</h2>
        <p className="text-neutral-secondary mt-1">
          Review recent activity and security events on your account.
        </p>
      </div>

      <Card className="border-neutral-border-glass bg-neutral-card-bg/50 divide-y divide-white/[0.05] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/40 text-neutral-400 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Resource ID</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-neutral-500">
                    <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white font-medium flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-primary" />
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">{log.resource}</td>
                    <td className="px-6 py-4 text-neutral-500 font-mono text-xs">
                      {log.resourceId || '-'}
                    </td>
                    <td className="px-6 py-4 text-neutral-400 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
