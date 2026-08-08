import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';

export const POST = withApiAuth({
  handler: async (request, { auth }) => {
    try {
      const userId = auth.user.id;

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });

      return NextResponse.json({ success: true, message: 'Two-Factor Authentication disabled' });
    } catch (error) {
      console.error('2FA Disable Error:', error);
      return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
    }
  },
});
