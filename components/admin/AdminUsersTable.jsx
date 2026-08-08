'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminUsersTable({ users: initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const router = useRouter();

  const handleSuspend = async (userId, currentRole) => {
    if (
      !confirm(`Are you sure you want to ${currentRole === 'BANNED' ? 'unban' : 'ban'} this user?`)
    )
      return;
    try {
      const { apiClient } = await import('@/src/lib/apiClient');
      await apiClient.post(`/admin/users/${userId}/suspend`);

      // Update local state for optimistic UI
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: currentRole === 'BANNED' ? 'USER' : 'BANNED' } : u
        )
      );
      router.refresh();
    } catch (err) {
      alert(err.message || 'Failed to suspend user');
    }
  };

  const handleGrantCredits = async (userId) => {
    const amountStr = prompt('Enter amount of credits to grant:');
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount');
      return;
    }

    try {
      const { apiClient } = await import('@/src/lib/apiClient');
      await apiClient.post(`/admin/users/${userId}/credits`, { amount });

      // Update local state for optimistic UI
      setUsers(users.map((u) => (u.id === userId ? { ...u, credits: u.credits + amount } : u)));
      router.refresh();
    } catch (err) {
      alert(err.message || 'Failed to grant credits');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-secondary uppercase bg-panel-bg">
          <tr>
            <th className="px-5 py-4">User</th>
            <th className="px-5 py-4">Role</th>
            <th className="px-5 py-4">Credits</th>
            <th className="px-5 py-4">Joined</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-muted bg-card-bg">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-muted/10 transition-colors">
              <td className="px-5 py-4">
                <div className="font-medium text-white">{user.name || 'Anonymous'}</div>
                <div className="text-xs text-secondary mt-0.5">{user.email}</div>
              </td>
              <td className="px-5 py-4">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold ${user.role === 'BANNED' ? 'bg-red-500/20 text-red-400' : user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-400/20 text-blue-400'}`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-5 py-4 text-purple-400 font-mono font-medium">{user.credits}</td>
              <td className="px-5 py-4 text-secondary">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleGrantCredits(user.id)}
                    className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    + Credits
                  </button>
                  <button
                    onClick={() => handleSuspend(user.id, user.role)}
                    className={`${user.role === 'BANNED' ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-600' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'} border px-3 py-1.5 rounded-lg text-xs font-medium transition-colors`}
                  >
                    {user.role === 'BANNED' ? 'Unban' : 'Ban'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
