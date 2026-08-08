export const dynamic = "force-dynamic";

import { AdminService } from '@/src/lib/services/adminService';
import { Card } from '@/components/ui/Card';
import { Shield, Search, UserX, UserCheck, ShieldAlert } from 'lucide-react';
import prisma from '@/src/lib/prisma';
import { updateUserRoleAction, toggleUserBanAction } from '../actions';

export const metadata = {
  title: 'Users & Moderation | Admin',
};

export default async function AdminUsersPage({ searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  const search = searchParams.search || '';

  const { users, total, totalPages } = await AdminService.getUsersList({ page, search });

  // Get ban statuses (simplified using settings table)
  const userIds = users.map((u) => u.id);
  const banSettings = await prisma.setting.findMany({
    where: { userId: { in: userIds }, key: 'account_banned' },
  });

  const bannedSet = new Set(banSettings.filter((s) => s.value === 'true').map((s) => s.userId));

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Users & Moderation
        </h2>
        <p className="text-neutral-secondary mt-1">Manage platform users, roles, and access.</p>
      </div>

      <Card className="p-0 border-neutral-border-glass bg-neutral-card-bg/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-border-glass bg-white/5 text-sm font-medium text-neutral-400">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Credits</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border-glass">
              {users.map((user) => {
                const isBanned = bannedSet.has(user.id);
                return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{user.name}</div>
                      <div className="text-sm text-neutral-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          user.role === 'ADMIN'
                            ? 'bg-primary/20 text-primary'
                            : user.role === 'DEVELOPER'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {user.role}
                      </span>
                      {isBanned && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-400">
                          Banned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">{user.credits.toLocaleString()}</td>
                    <td className="px-6 py-4 text-neutral-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <form
                          action={updateUserRoleAction.bind(
                            null,
                            user.id,
                            user.role === 'ADMIN' ? 'USER' : 'ADMIN'
                          )}
                        >
                          <button
                            type="submit"
                            className="p-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg transition-colors"
                            title={user.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                          >
                            <ShieldAlert size={16} />
                          </button>
                        </form>
                        <form action={toggleUserBanAction.bind(null, user.id, isBanned)}>
                          <button
                            type="submit"
                            className={`p-2 rounded-lg transition-colors ${isBanned ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'text-red-400 bg-red-500/10 hover:bg-red-500/20'}`}
                            title={isBanned ? 'Unban User' : 'Ban User'}
                          >
                            {isBanned ? <UserCheck size={16} /> : <UserX size={16} />}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-neutral-500">No users found.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
