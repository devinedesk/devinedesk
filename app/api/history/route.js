import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { UserService } from '@/src/lib/services/userService';

export const GET = withApiAuth({
  handler: async (request, { auth }) => {
    const history = await UserService.getHistory(auth.user.id, 50);

    return NextResponse.json(history);
  },
});

export const DELETE = withApiAuth({
  handler: async (request, { auth }) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await UserService.deleteHistory(auth.user.id, id);

    return NextResponse.json({ success: true });
  },
});
