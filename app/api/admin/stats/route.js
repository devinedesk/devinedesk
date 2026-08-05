import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/src/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const totalUsers = await prisma.user.count();
    
    // Total generations
    const totalGenerations = await prisma.generation.count();

    // Total transactions
    const transactions = await prisma.transaction.findMany();
    const totalPurchasedCredits = transactions
      .filter(t => t.type === 'purchase')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalSpentCredits = transactions
      .filter(t => t.type === 'usage')
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true, credits: true, role: true }
    });

    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true, email: true } } }
    });

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalGenerations,
        totalPurchasedCredits,
        totalSpentCredits
      },
      recentUsers,
      recentTransactions
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
