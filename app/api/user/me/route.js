import { NextResponse } from 'next/server';
import { withApiAuth } from '@/src/lib/apiHandler';
import { UserService } from '@/src/lib/services/userService';

export const GET = withApiAuth({
  handler: async (req, { auth }) => {
    const user = await UserService.getUserProfile(auth.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  }
});
