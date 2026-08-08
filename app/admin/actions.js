'use server';

import { getServerSession } from 'next-auth/next';
import { AdminService } from '@/src/lib/services/adminService';
import { revalidatePath } from 'next/cache';
import prisma from '@/src/lib/prisma';

async function requireAdmin() {
  const session = await getServerSession();
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function updateUserRoleAction(userId, role) {
  const admin = await requireAdmin();
  
  await AdminService.updateUserRole(userId, role);
  
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'UPDATE_ROLE',
      details: { targetUserId: userId, newRole: role },
      ipAddress: '127.0.0.1', // Should get from headers in real app
    }
  });

  revalidatePath('/admin/users');
}

export async function toggleUserBanAction(userId, currentStatus) {
  const admin = await requireAdmin();
  
  await AdminService.setUserBanStatus(userId, !currentStatus);
  
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: currentStatus ? 'UNBAN_USER' : 'BAN_USER',
      details: { targetUserId: userId },
      ipAddress: '127.0.0.1', 
    }
  });

  revalidatePath('/admin/users');
}
