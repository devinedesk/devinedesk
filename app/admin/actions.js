'use server';

import { getServerSession } from 'next-auth/next';
import { AdminService } from '@/src/lib/services/adminService';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await getServerSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}

export async function updateUserRoleAction(userId, role) {
  await requireAdmin();
  await AdminService.updateUserRole(userId, role);
  revalidatePath('/admin/users');
}

export async function toggleUserBanAction(userId, currentStatus) {
  await requireAdmin();
  await AdminService.setUserBanStatus(userId, !currentStatus);
  revalidatePath('/admin/users');
}
