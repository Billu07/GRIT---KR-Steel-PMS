import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    let taskRunningHours = null;
    let taskEstimatedHours = null;
    let taskTargetDate = null;

    // If it's a scheduled task, fetch current hours and targets before we reset them
    if (taskId) {
        const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } });
        if (task) {
            taskRunningHours = task.runningHours;
            taskEstimatedHours = task.estimatedHours;
            taskTargetDate = task.nextDueDate;
        }
    }

    const newHistory = await prisma.maintenanceHistory.create({
      data: {
        equipmentId,
        taskId: taskId ? parseInt(taskId) : null,
        type,
        runningHours: taskRunningHours,
        estimatedHours: taskEstimatedHours,
        targetDate: taskTargetDate,
        targetHours: taskEstimatedHours, // Record the hour target for the history log
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
        const nextDue = new Date(completedDate);
        
        switch (task.frequency) {
          case 'hourly': nextDue.setHours(nextDue.getHours() + 1); break;
          case 'daily': nextDue.setDate(nextDue.getDate() + 1); break;
          case 'weekly': nextDue.setDate(nextDue.getDate() + 7); break;
          case 'fifteen_days': nextDue.setDate(nextDue.getDate() + 15); break;
          case 'monthly': nextDue.setMonth(nextDue.getMonth() + 1); break;
          case 'quarterly': nextDue.setMonth(nextDue.getMonth() + 3); break;
          case 'semi_annually': nextDue.setMonth(nextDue.getMonth() + 6); break;
          case 'yearly': nextDue.setFullYear(nextDue.getFullYear() + 1); break;
        }

        await prisma.task.update({
          where: { id: task.id },
          data: {
            lastCompletedDate: completedDate,
            nextDueDate: nextDue,
            runningHours: 0 // Reset usage-based counter on completion
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
