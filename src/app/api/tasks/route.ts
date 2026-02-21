import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        equipment: {
          include: {
            category: true
          }
        },
      },
      orderBy: { taskId: 'asc' },
    });

    const equipment = await prisma.equipment.findMany({
        orderBy: { code: 'asc' }
    });

    return NextResponse.json({ tasks, equipment });
  } catch (error) {
    console.error('Global tasks fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await requestToJson(req);
    const { taskId, taskName, frequency, taskDetail, equipmentId } = body;

    if (!taskId || !taskName || !equipmentId || !frequency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newTask = await prisma.task.create({
      data: {
        taskId,
        taskName,
        frequency,
        taskDetail,
        equipmentId: parseInt(equipmentId),
        createdBy: 1, // Default admin
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error('Global task creation error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Task ID already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function requestToJson(req: NextRequest) {
    try { return await req.json(); } catch { return {}; }
}
