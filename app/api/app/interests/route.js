import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { AppService } from '@/src/lib/services/appService';

export const GET = withApiAuth({
    handler: async (request, { auth }) => {
        const interests = await AppService.getInterests(auth.user.id);

        // The UI expects an array of app names
        return NextResponse.json(interests.map(i => i.appName));
    }
});
