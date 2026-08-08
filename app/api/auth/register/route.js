import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { UserService } from '@/src/lib/services/userService';
import bcrypt from 'bcryptjs';
import { withApiAuth } from '@/src/lib/apiHandler';
import { z } from 'zod';
import prisma from '@/src/lib/prisma';
import crypto from 'crypto';
import { EmailService } from '@/src/lib/services/emailService';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  refCode: z.string().optional(),
});

export const POST = withApiAuth({
  requireAuth: false,
  schema: registerSchema,
  handler: async (request, { body }) => {
    const { email, password, name, refCode } = body;

    // Check if user already exists
    const existingUser = await UserService.getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    let referredByUserId = null;
    if (refCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: refCode } });
      if (referrer) referredByUserId = referrer.id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique 8-character referral code for the NEW user
    const newReferralCode = crypto.randomBytes(4).toString('hex');

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
        referralCode: newReferralCode,
        referredById: referredByUserId,
      },
    });

    // Grant the affiliate bonus if applicable
    if (referredByUserId) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: referredByUserId },
          data: { credits: { increment: 100 } },
        }),
        prisma.transaction.create({
          data: {
            userId: referredByUserId,
            amount: 100,
            type: 'bonus',
            description: `Affiliate Bonus for referring ${user.email}`,
          },
        }),
        prisma.auditLog.create({
          data: {
            action: 'AFFILIATE_BONUS_GRANTED',
            resource: 'User',
            resourceId: referredByUserId,
            metadata: JSON.stringify({ amount: 100, referredUserId: user.id }),
          },
        }),
      ]);
    }

    // Generate Email Verification Token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;

    // Send welcome/verification email asynchronously
    EmailService.sendEmail({
      to: user.email,
      subject: 'Welcome to DevineDesk! Please verify your email.',
      html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Welcome aboard, ${user.name}!</h2>
                <p>We're thrilled to have you join DevineDesk. To get started, please verify your email address by clicking the link below:</p>
                <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Verify Email</a>
              </div>
            `,
    }).catch(console.error);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  },
});
