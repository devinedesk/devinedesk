import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
const otplib = require('otplib');
const { authenticator } = otplib;
import { z } from 'zod';

const enableSchema = z.object({
  code: z.string().length(6),
});

export const POST = withApiAuth({
  schema: enableSchema,
  handler: async (request, { auth, body }) => {
    try {
      const userId = auth.user.id;
      const { code } = body;

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.twoFactorSecret) {
        return NextResponse.json(
          { error: '2FA not initialized. Please generate a QR code first.' },
          { status: 400 }
        );
      }

      const isValid = authenticator.verify({
        token: code,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid authenticator code.' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      });

      return NextResponse.json({ success: true, message: 'Two-Factor Authentication enabled' });
    } catch (error) {
      console.error('2FA Enable Error:', error);
      return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
    }
  },
});
