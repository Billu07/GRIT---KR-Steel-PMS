import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, startOfMonth } from 'date-fns';

export async function GET() {
  try {
    const today = startOfDay(new Date());
    const thisMonth = startOfMonth(new Date());

    const jobsToday = await prisma.job.count({
      where: {
        dateDue: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const jobsThisMonth = await prisma.job.count({
      where: {
        dateDue: {
          gte: thisMonth,
        },
      },
    });

    const dueJobs = await prisma.job.count({
      where: {
        dateDue: {
          gte: today,
        },
        overdueDays: 0,
      },
    });

    const overdueJobs = await prisma.job.count({
      where: {
        overdueDays: {
          gt: 0,
        },
      },
    });

    const recentJobs = await prisma.job.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        equipment: true,
      },
    });

    return NextResponse.json({
      stats: {
        jobsToday,
        jobsThisMonth,
        dueJobs,
        overdueJobs,
      },
      recentJobs,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
