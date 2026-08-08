import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import prisma from '@/src/lib/prisma';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  variables: z.array(z.string()).optional(),
  isPublic: z.boolean().optional().default(false),
});

export const GET = withApiAuth({
  handler: async (req, { auth }) => {
    try {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;
      const includePublic = searchParams.get('public') === 'true';

      const whereClause = includePublic
        ? { OR: [{ userId: auth.user.id }, { isPublic: true }] }
        : { userId: auth.user.id };

      const templates = await prisma.promptTemplate.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: skip,
      });

      const total = await prisma.promptTemplate.count({
        where: whereClause,
      });

      return NextResponse.json({
        templates,
        metadata: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

export const POST = withApiAuth({
  schema: createTemplateSchema,
  handler: async (req, { auth, body }) => {
    try {
      const { name, description, content, variables, isPublic } = body;

      const template = await prisma.promptTemplate.create({
        data: {
          userId: auth.user.id,
          name,
          description,
          content,
          variables: variables ? JSON.stringify(variables) : null,
          isPublic,
        },
      });

      return NextResponse.json(template, { status: 201 });
    } catch (error) {
      console.error('Error creating prompt template:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});
