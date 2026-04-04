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
    const { taskId: providedTaskId, taskName, frequency, taskDetail, equipmentId, lastCompletedDate, nextDueDate, criticality } = body;

    if (!taskName || !equipmentId || !frequency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let taskId = providedTaskId;

    // Auto-generate taskId if not provided
    if (!taskId || taskId.trim() === "") {
      const existingTasks = await prisma.task.findMany({
        select: { taskId: true }
      });

      let maxNum = 0;
      existingTasks.forEach(t => {
        if (t.taskId) {
          // Try to find digits at the end of any TSK- prefixed ID or any ID ending in digits
          const match = t.taskId.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      });
      taskId = `TSK-${String(maxNum + 1).padStart(4, '0')}`;
    }

    const newTask = await prisma.task.create({
      data: {
        taskId,
        taskName,
        frequency,
        taskDetail,
        equipmentId: parseInt(equipmentId),
        lastCompletedDate: lastCompletedDate ? new Date(lastCompletedDate) : null,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        criticality: criticality || 'medium',
        createdBy: 1, // Default admin
      },
    });

    if (lastCompletedDate) {
      await prisma.maintenanceHistory.create({
        data: {
          equipmentId: parseInt(equipmentId),
          taskId: newTask.id,
          type: 'scheduled',
          targetDate: new Date(lastCompletedDate),
          maintenanceDate: new Date(lastCompletedDate),
          informationDate: new Date(lastCompletedDate),
          performedAt: new Date(),
          remarks: 'Initial completion logged at task creation',
        }
      });
    }

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
