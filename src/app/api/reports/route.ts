import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        equipment: true,
      },
    });

    const equipment = await prisma.equipment.findMany({
      include: {
        category: true,
      },
    });

    const maintenanceHistory = await prisma.maintenanceHistory.findMany({
      include: {
        equipment: {
          include: {
            category: true,
          }
        },
        job: true,
      },
      orderBy: {
        performedAt: 'desc',
      }
    });

    return NextResponse.json({
      jobs,
      equipment,
      maintenanceHistory,
    });
  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
