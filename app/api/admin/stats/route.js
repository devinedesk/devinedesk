import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { AdminService } from '@/src/lib/services/adminService';

export const GET = withApiAuth({
  requireAdmin: true,
  handler: async (req, { auth }) => {
    const stats = await AdminService.getStats();
    return NextResponse.json(stats);
  }
});
