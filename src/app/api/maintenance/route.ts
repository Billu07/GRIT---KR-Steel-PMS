import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateNextDueDate } from '@/lib/dateUtils';

export async function GET() {
  try {
    const logs = await prisma.maintenanceHistory.findMany({
      include: {
        equipment: {
          include: {
            category: true,
          }
        },
        task: true,
      },
      orderBy: {
        performedAt: 'desc',
      },
    });

    const equipment = await prisma.equipment.findMany({
      include: {
        category: true,
      }
    });

    const categories = await prisma.equipmentCategory.findMany();

    return NextResponse.json({ logs, equipment, categories });
  } catch (error) {
    console.error('Maintenance fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      equipmentId, 
      taskId,
      type, 
      informationDate, 
      serviceStartDate, 
      serviceEndDate, 
      problemDescription, 
      solutionDetails, 
      usedParts, 
      workType, 
      problemType, 
      remarks,
      maintenanceDate,
      maintenanceDetails
    } = body;

    if (!equipmentId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let taskTargetDate = null;

    // If it's a scheduled task, fetch current hours and targets before we reset them
    if (taskId) {
        const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } });
        if (task) {
            taskTargetDate = task.nextDueDate;
        }
    }

    const newHistory = await prisma.maintenanceHistory.create({
      data: {
        equipmentId,
        taskId: taskId ? parseInt(taskId) : null,
        type,
        targetDate: taskTargetDate,
        informationDate: informationDate ? new Date(informationDate) : null,
        serviceStartDate: serviceStartDate ? new Date(serviceStartDate) : null,
        serviceEndDate: serviceEndDate ? new Date(serviceEndDate) : null,
        problemDescription,
        solutionDetails,
        usedParts,
        workType,
        problemType,
        remarks,
        maintenanceDate: maintenanceDate ? new Date(maintenanceDate) : null,
        maintenanceDetails,
        performedAt: new Date(),
      },
    });

    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } });
      if (task) {
        // Use the explicit maintenanceDate if provided, otherwise default to today
        const completedDate = maintenanceDate ? new Date(maintenanceDate) : new Date();
        const nextDue = calculateNextDueDate(completedDate, task.frequency as any);

        await prisma.task.update({
          where: { id: task.id },
          data: {
            lastCompletedDate: completedDate,
            nextDueDate: nextDue
          }
        });
      }
    }

    return NextResponse.json(newHistory, { status: 201 });
  } catch (error) {
    console.error('Maintenance logging error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
