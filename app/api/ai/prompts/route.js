import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';
import { withApiAuth } from '@/src/lib/apiHandler';

export const GET = withApiAuth({
  handler: async (req, { auth }) => {
    try {
      const { searchParams } = new URL(req.url);
      const isPublic = searchParams.get('public') === 'true';

      const where = isPublic ? { isPublic: true } : { userId: auth.user.id };

      const prompts = await prisma.promptTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          content: true,
          variables: true,
          version: true,
          isPublic: true,
          createdAt: true,
          user: { select: { name: true, image: true } },
        },
      });

      return NextResponse.json(prompts);
    } catch (error) {
      console.error('[PROMPTS_GET]', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },
});

const createPromptSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  content: z.string().min(1),
  variables: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const POST = withApiAuth({
  schema: createPromptSchema,
  handler: async (req, { auth, body }) => {
    try {
      const prompt = await prisma.promptTemplate.create({
        data: {
          ...body,
          userId: auth.user.id,
        },
      });

      return NextResponse.json(prompt);
    } catch (error) {
      console.error('[PROMPTS_POST]', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },
});
