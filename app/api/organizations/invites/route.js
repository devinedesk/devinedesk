import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/src/lib/prisma';
import { EmailService } from '@/src/lib/services/emailService';
import { rateLimit } from '@/lib/security';
import { organizationInviteSchema } from '@/lib/validators';

export async function POST(request) {
  const ip = request?.headers?.get('x-forwarded-for') ?? '127.0.0.1';
  const rateLimit = await checkRateLimit(`${ip}_api`, 'FREE'); // Default to free tier globally
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    );
  }

  try {
    const session = await getServerSession();
    if (!session || !session.user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResult = await rateLimit(request, 10, 60, session.user.id); // 10 invites per minute
    if (!rateLimitResult.success)
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await request.json();
    const parsed = organizationInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { organizationId, email, role } = parsed.data;

    // Verify current user has permission to invite (OWNER or ADMIN)
    const inviterMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: organizationId,
          userId: session.user.id,
        },
      },
      include: { organization: true },
    });

    if (
      !inviterMembership ||
      (inviterMembership.role !== 'OWNER' && inviterMembership.role !== 'ADMIN')
    ) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to invite users' },
        { status: 403 }
      );
    }

    // Find the target user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!targetUser) {
      // In a full implementation, we'd create a pending invite token.
      // For MVP, we'll send an email asking them to sign up first.
      await EmailService.sendEmail({
        to: email,
        subject: `You've been invited to join ${inviterMembership.organization.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>You've been invited!</h2>
            <p>${session.user.name || session.user.email} has invited you to join the organization <strong>${inviterMembership.organization.name}</strong> on DevineDesk.</p>
            <p>Please <a href="https://devinedesk.com/auth/signup">sign up</a> for an account with this email address, and they will be able to add you.</p>
          </div>
        `,
      });
      return NextResponse.json({ message: 'Invite email sent to user to sign up.' });
    }

    // Check if already a member
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: organizationId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Add user to organization
    const newMember = await prisma.organizationMember.create({
      data: {
        organizationId: organizationId,
        userId: targetUser.id,
        role: role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'INVITE_USER',
        resource: 'OrganizationMember',
        resourceId: newMember.id,
        userId: session.user.id,
        organizationId: organizationId,
      },
    });

    await EmailService.sendEmail({
      to: email,
      subject: `You've been added to ${inviterMembership.organization.name}`,
      html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to the team!</h2>
            <p>${session.user.name || session.user.email} has added you to <strong>${inviterMembership.organization.name}</strong> on DevineDesk.</p>
            <p>You can now access shared workflows and billing.</p>
          </div>
        `,
    });

    return NextResponse.json({ success: true, member: newMember });
  } catch (error) {
    console.error('Organization Invite Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
