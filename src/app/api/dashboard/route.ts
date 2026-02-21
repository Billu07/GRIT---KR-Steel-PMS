import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, startOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = startOfDay(new Date());
    const thisMonth = startOfMonth(new Date());

    const logsToday = await prisma.maintenanceHistory.count({
      where: {
        performedAt: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const logsThisMonth = await prisma.maintenanceHistory.count({
      where: {
        performedAt: {
          gte: thisMonth,
        },
      },
    });

    const scheduledTasks = await prisma.task.count();
    const totalAssets = await prisma.equipment.count();

    // Use direct property access as the model is definitely present in the DB
    // Cast to any to avoid TS errors if the generated client is currently out of sync in the editor
    const inventoryItems = await (prisma as any).inventory.count();

    const correctiveLogs = await prisma.maintenanceHistory.count({
      where: {
        type: 'corrective',
      }
    });

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
    console.error('Dashboard API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
