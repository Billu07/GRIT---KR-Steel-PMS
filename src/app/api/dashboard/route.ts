import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, startOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = startOfDay(new Date());
    const thisMonth = startOfMonth(new Date());

    console.log('Dashboard API: Fetching stats...');

    const [logsToday, logsThisMonth, scheduledTasks, totalAssets, inventoryItems, correctiveLogs] = await Promise.all([
      prisma.maintenanceHistory.count({
        where: {
          performedAt: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.maintenanceHistory.count({
        where: {
          performedAt: {
            gte: thisMonth,
          },
        },
      }),
      prisma.task.count(),
      prisma.equipment.count(),
      (prisma as any).inventory.count(),
      prisma.maintenanceHistory.count({
        where: {
          type: 'corrective',
        }
      })
    ]);

    console.log('Dashboard API: Fetching recent activity...');

    const recentLogs = await prisma.maintenanceHistory.findMany({
      take: 10,
      orderBy: {
        performedAt: 'desc',
      },
      include: {
        equipment: true,
        task: true,
      },
    });

    const activeTasks = await prisma.task.findMany({
      take: 10,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        equipment: {
          include: {
            category: true
          }
        }
      }
    });

    const equipment = await prisma.equipment.findMany({
      orderBy: {
        code: 'asc',
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({
      stats: {
        logsToday,
        logsThisMonth,
        scheduledTasks,
        totalAssets,
        inventoryItems,
        correctiveLogs,
      },
      recentLogs,
      activeTasks,
      equipment
    });
  } catch (error: any) {
    console.error('Dashboard API Error Details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
    });
    return NextResponse.json({ 
        error: 'Failed to load dashboard data', 
        details: error.message 
    }, { status: 500 });
  }
}
