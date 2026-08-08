import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';
import { withApiAuth } from '@/src/lib/apiHandler';

export const GET = withApiAuth({
  requireAdmin: true,
  handler: async (req, { auth }) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const role = searchParams.get('role');
      const status = searchParams.get('status');

      let where = {};
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { id: { equals: search } },
        ];
      }

      if (role && role !== 'ALL') {
        where.role = role;
      }

      if (status === 'BANNED') {
        where.deletedAt = { not: null };
      } else if (status === 'ACTIVE') {
        where.deletedAt = null;
      }

      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          credits: true,
          createdAt: true,
          deletedAt: true,
        },
      });

      return NextResponse.json(users);
    } catch (error) {
      console.error('[ADMIN_USERS_GET]', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },
});

const updateSchema = z.object({
  userId: z.string(),
  action: z.enum(['UPDATE_ROLE', 'ADD_CREDITS', 'BAN', 'UNBAN']),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  credits: z.number().int().optional(),
});

export const PATCH = withApiAuth({
  requireAdmin: true,
  schema: updateSchema,
  handler: async (req, { auth, body }) => {
    try {
      const { userId, action, role, credits } = body;

      // Prevent modifying SUPER_ADMIN if you are just an ADMIN
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (targetUser.role === 'SUPER_ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Cannot modify Super Admins' }, { status: 403 });
      }

      let updatedUser;

      switch (action) {
        case 'UPDATE_ROLE':
          if (!role) return NextResponse.json({ error: 'Role required' }, { status: 400 });
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, role: true },
          });
          break;

        case 'ADD_CREDITS':
          if (credits === undefined)
            return NextResponse.json({ error: 'Credits required' }, { status: 400 });
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: credits } },
            select: { id: true, credits: true },
          });
          // Log transaction
          await prisma.transaction.create({
            data: {
              userId,
              amount: credits,
              type: 'bonus',
              description: `Admin bonus from ${auth.user.email}`,
            },
          });
          break;

        case 'BAN':
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { deletedAt: new Date() },
            select: { id: true, deletedAt: true },
          });
          break;

        case 'UNBAN':
          updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { deletedAt: null },
            select: { id: true, deletedAt: true },
          });
          break;
      }

      // Log admin action
      await prisma.auditLog.create({
        data: {
          action: `ADMIN_${action}`,
          resource: 'User',
          resourceId: userId,
          userId: auth.user.id,
          metadata: JSON.stringify({ role, credits }),
        },
      });

      return NextResponse.json(updatedUser);
    } catch (error) {
      console.error('[ADMIN_USERS_PATCH]', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },
});
