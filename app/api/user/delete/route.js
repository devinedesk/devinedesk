import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';

export const POST = withApiAuth({
  handler: async (request, { auth }) => {
    try {
      const userId = auth.user.id;

      // We hard delete the user. Prisma will cascade delete everything where onDelete: Cascade is defined.
      await prisma.user.delete({
        where: { id: userId },
      });

      return NextResponse.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete Account Error:', error);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
  },
});
