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

    // Get the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch generations from the last 30 days
    const generations = await prisma.generation.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Fetch transactions from the last 30 days
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
        type: true,
        amount: true,
      },
    });

    // Grouping helper
    const groupByDay = (records, processRecord) => {
      const grouped = {};
      
      // Initialize the last 30 days with 0s
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        grouped[dateStr] = processRecord ? processRecord(null, true) : 0;
      }

      records.forEach(record => {
        const dateStr = new Date(record.createdAt).toISOString().split('T')[0];
        if (grouped[dateStr] !== undefined) {
          if (processRecord) {
            grouped[dateStr] = processRecord(record, false, grouped[dateStr]);
          } else {
            grouped[dateStr] += 1;
          }
        }
      });

      return Object.entries(grouped).map(([date, value]) => ({ date, ...value }));
    };

    // Group Generations
    const generationsData = groupByDay(generations, (record, init, prev) => {
      if (init) return { count: 0 };
      return { count: prev.count + 1 };
    }).map(d => ({ date: d.date, generations: d.count }));

    // Group Credits (Purchases vs Usage)
    const creditsData = groupByDay(transactions, (record, init, prev) => {
      if (init) return { purchased: 0, spent: 0 };
      if (record.type === 'purchase') {
        return { ...prev, purchased: prev.purchased + record.amount };
      } else if (record.type === 'usage') {
        return { ...prev, spent: prev.spent + Math.abs(record.amount) };
      }
      return prev;
    });

    return NextResponse.json({
      generationsData,
      creditsData
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
