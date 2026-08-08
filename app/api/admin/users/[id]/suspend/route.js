import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
import { AdminService } from '@/src/lib/services/adminService';

export const POST = withApiAuth({
  requireAdmin: true,
  handler: async (req, { params }) => {
    const { id } = params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Toggle ban status
    const newRole = user.role === 'BANNED' ? 'USER' : 'BANNED';

    await prisma.user.update({
      where: { id },
      data: { role: newRole },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: newRole === 'BANNED' ? 'ADMIN_BAN_USER' : 'ADMIN_UNBAN_USER',
        resource: 'User',
        resourceId: id,
      },
    });

    return NextResponse.json({ success: true, role: newRole });
  },
});
