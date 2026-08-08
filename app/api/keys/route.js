import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import crypto from 'crypto';
import { AuditService } from '@/src/lib/services/auditService';
import { withApiAuth } from '@/src/lib/apiHandler';
import { z } from 'zod';

const createKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name too long')
    .optional()
    .default('Default Key'),
});

export const GET = withApiAuth({
  handler: async (request, { auth }) => {
    try {
      const userId = auth.user.id;
      const keys = await prisma.aPIKey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const maskedKeys = keys.map((k) => ({
        id: k.id,
        name: k.name,
        maskedKey: k.maskedKey || 'sk_prod_...xxxx',
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
      }));

      return NextResponse.json({ keys: maskedKeys });
    } catch (error) {
      console.error('Fetch API Keys Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

export const POST = withApiAuth({
  schema: createKeySchema,
  handler: async (request, { auth, body }) => {
    try {
      const userId = auth.user.id;
      const { name } = body;

      const rawKey = `sk_prod_${crypto.randomBytes(24).toString('hex')}`;
      const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
      const maskedKey = `${rawKey.substring(0, 12)}...${rawKey.substring(rawKey.length - 4)}`;

      const newKey = await prisma.aPIKey.create({
        data: {
          key: hashedKey,
          maskedKey: maskedKey,
          name: name,
          userId: userId,
        },
      });

      await AuditService.log({
        userId: userId,
        action: 'API_KEY_CREATED',
        resource: newKey.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json({
        id: newKey.id,
        name: newKey.name,
        key: rawKey,
      });
    } catch (error) {
      console.error('Create API Key Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

export const DELETE = withApiAuth({
  handler: async (request, { auth }) => {
    try {
      const userId = auth.user.id;
      const { searchParams } = new URL(request.url);
      const keyId = searchParams.get('id');

      if (!keyId) return NextResponse.json({ error: 'Key ID required' }, { status: 400 });

      await prisma.aPIKey.deleteMany({
        where: {
          id: keyId,
          userId: userId,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Delete API Key Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});
