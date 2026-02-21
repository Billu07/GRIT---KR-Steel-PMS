import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic and clear cache
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Basic data fetching
    const tasks = await prisma.task.findMany({ orderBy: { updatedAt: 'desc' } });
    const equipment = await prisma.equipment.findMany({ include: { category: true }, orderBy: { code: 'asc' } });
    const maintenanceHistory = await prisma.maintenanceHistory.findMany({ include: { equipment: true, task: true }, orderBy: { performedAt: 'desc' } });

    let inventory: any[] = [];
    
    // Safely check for inventory model existence
    const p = prisma as any;
    if (p['inventory'] && typeof p['inventory'].findMany === 'function') {
      inventory = await p['inventory'].findMany({ orderBy: { id: 'asc' } });
    } else {
      console.warn('Inventory model not yet available in Prisma Client');
    }

    return NextResponse.json({
      tasks,
      equipment,
      maintenanceHistory,
      inventory,
    });
  } catch (error: any) {
    console.error('Failed to fetch report data:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
