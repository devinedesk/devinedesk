import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
import qrcode from 'qrcode';

const otplib = require('otplib');
const { authenticator } = otplib;

export const POST = withApiAuth({
  handler: async (request, { auth }) => {
    try {
      const userId = auth.user.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Generate a new secret
      const secret = authenticator.generateSecret();

      // We use the app name "DevineDesk" and the user's email
      const otpauth = authenticator.keyuri(user.email, 'DevineDesk', secret);

      // Generate QR Code data URL
      const qrCodeUrl = await qrcode.toDataURL(otpauth);

      // Save the secret to the user, but leave twoFactorEnabled as false for now
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret },
      });

      return NextResponse.json({
        secret,
        qrCodeUrl,
      });
    } catch (error) {
      console.error('2FA Generate Error:', error);
      return NextResponse.json({ error: 'Failed to generate 2FA setup' }, { status: 500 });
    }
  },
});
