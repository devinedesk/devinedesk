import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/src/lib/rateLimit';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/src/lib/prisma';
import { UserService } from '@/src/lib/services/userService';
import bcrypt from 'bcryptjs';
import { env } from '@/src/lib/env';
import { RateLimitService } from '@/src/lib/services/rateLimitService';

const { authenticator } = require('otplib');

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(env.GITHUB_ID && env.GITHUB_SECRET
      ? [
          GithubProvider({
            clientId: env.GITHUB_ID,
            clientSecret: env.GITHUB_SECRET,
          }),
        ]
      : []),
    EmailProvider({
      server: process.env.EMAIL_SERVER || {
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: process.env.EMAIL_FROM || '"DevineDesk" <noreply@devinedesk.com>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const { EmailService } = await import('@/src/lib/services/emailService');
        await EmailService.sendEmail({
          to: email,
          subject: 'Sign in to DevineDesk',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Sign in to DevineDesk</h2>
              <p>Click the link below to sign in instantly via Magic Link:</p>
              <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Sign In</a>
              <p style="margin-top: 30px; font-size: 12px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'jsmith@example.com' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text', required: false },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        // Prevent credential stuffing (max 5 attempts per minute per IP)
        const ip = req?.headers?.['x-forwarded-for'] || 'anonymous';
        const isLimited = await RateLimitService.isRateLimited(`login:${ip}`, 5, 60);

        if (isLimited) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        const user = await UserService.getUserByEmail(credentials.email);

        if (!user || !user.password) {
          throw new Error('No user found');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error('Invalid password');
        }

        // Check 2FA
        if (user.twoFactorEnabled) {
          if (!credentials.twoFactorCode) {
            throw new Error('2FA_REQUIRED');
          }

          if (!user.twoFactorSecret) {
            throw new Error('2FA configuration error');
          }

          const isValid2FA = authenticator.verify({
            token: credentials.twoFactorCode,
            secret: user.twoFactorSecret,
          });

          if (!isValid2FA) {
            throw new Error('Invalid 2FA code');
          }
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.credits = user.credits;
      }

      // Update token if session is explicitly updated
      if (trigger === 'update' && session?.credits !== undefined) {
        token.credits = session.credits;
      }

      // Alternatively, we could fetch from DB here on every request for 100% accuracy,
      // but let's just make sure it initializes. For live credits, it's better to fetch
      // in the component or have a dedicated hook.
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.credits = token.credits;
      }
      return session;
    },
  },
  secret: env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
