import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { z } from 'zod';
import { AppService } from '@/src/lib/services/appService';

export const GET = withApiAuth({
  handler: async (request, { auth }) => {
    const { searchParams } = new URL(request.url);
    const appName = searchParams.get('app_name');

    if (appName) {
      const interest = await AppService.getInterest(auth.user.id, appName);
      return NextResponse.json({ interested: !!interest });
    }

    const interests = await AppService.getInterests(auth.user.id);
    // The UI expects an array of app names
    return NextResponse.json(interests.map((i) => i.appName));
  },
});

const interestSchema = z
  .object({
    app_name: z.string().min(1).max(100).optional(),
    appName: z.string().min(1).max(100).optional(),
  })
  .refine((data) => data.app_name || data.appName, {
    message: 'Either app_name or appName must be provided',
  });

export const POST = withApiAuth({
  schema: interestSchema,
  handler: async (request, { auth, body }) => {
    // Support both app_name and appName
    const appName = body.app_name || body.appName;

    if (!appName) {
      return NextResponse.json({ error: 'app_name is required' }, { status: 400 });
    }

    const interest = await AppService.addInterest(auth.user.id, appName);

    return NextResponse.json({ success: true, interest });
  },
});
