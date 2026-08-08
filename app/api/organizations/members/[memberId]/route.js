import { checkRateLimit } from '@/src/lib/rateLimit';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/src/lib/prisma';
import { rateLimit } from '@/lib/security';

// Helper to verify caller permissions
async function verifyPermission(callerUserId, targetMemberId) {
  // 1. Fetch the target member row to find which organization they belong to
  const targetMember = await prisma.organizationMember.findUnique({
    where: { id: targetMemberId },
    include: { organization: true },
  });

  if (!targetMember) return { error: 'Member not found', status: 404 };

  const orgId = targetMember.organizationId;

  // 2. Fetch the caller's membership in the SAME organization
  const callerMembership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: callerUserId,
      },
    },
  });

  if (!callerMembership) return { error: 'Forbidden', status: 403 };

  return { targetMember, callerMembership, orgId };
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session || !session.user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResult = await rateLimit(request, 20, 60, session.user.id);
    if (!rateLimitResult.success)
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { memberId } = params;
    const body = await request.json();
    const { role } = body;

    if (!['ADMIN', 'MEMBER', 'OWNER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { targetMember, callerMembership, error, status, orgId } = await verifyPermission(
      session.user.id,
      memberId
    );
    if (error) return NextResponse.json({ error }, { status });

    // Permissions logic
    if (callerMembership.role !== 'OWNER' && callerMembership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (targetMember.role === 'OWNER' && callerMembership.userId !== targetMember.userId) {
      return NextResponse.json({ error: "Cannot modify Owner's role" }, { status: 403 });
    }

    if (role === 'OWNER' && callerMembership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only Owners can grant Ownership' }, { status: 403 });
    }

    const updatedMember = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_MEMBER_ROLE',
        resource: 'OrganizationMember',
        resourceId: memberId,
        userId: session.user.id,
        organizationId: orgId,
        metadata: { newRole: role, oldRole: targetMember.role },
      },
    });

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (err) {
    console.error('Update Member Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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

    const rateLimitResult = await rateLimit(request, 10, 60, session.user.id);
    if (!rateLimitResult.success)
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { memberId } = params;

    const { targetMember, callerMembership, error, status, orgId } = await verifyPermission(
      session.user.id,
      memberId
    );
    if (error) return NextResponse.json({ error }, { status });

    // Can delete if they are OWNER/ADMIN, or if they are deleting themselves (leaving)
    const isSelf = callerMembership.userId === targetMember.userId;
    const hasPerms = callerMembership.role === 'OWNER' || callerMembership.role === 'ADMIN';

    if (!isSelf && !hasPerms) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Prevent deleting the last owner
    if (targetMember.role === 'OWNER') {
      const ownerCount = await prisma.organizationMember.count({
        where: { organizationId: orgId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of the organization.' },
          { status: 400 }
        );
      }
    }

    // Admins cannot delete Owners
    if (targetMember.role === 'OWNER' && callerMembership.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admins cannot remove Owners' }, { status: 403 });
    }

    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    await prisma.auditLog.create({
      data: {
        action: isSelf ? 'LEAVE_ORGANIZATION' : 'REMOVE_MEMBER',
        resource: 'OrganizationMember',
        resourceId: memberId,
        userId: session.user.id,
        organizationId: orgId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete Member Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
