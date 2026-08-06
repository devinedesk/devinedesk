import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { AdminService } from '@/src/lib/services/adminService';

export const GET = withApiAuth({
  requireAdmin: true,
  handler: async (req, { auth }) => {
    const analytics = await AdminService.getAnalytics(30);
    return NextResponse.json(analytics);
  }
});
