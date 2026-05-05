import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateNextDueDate } from '@/lib/dateUtils';

const MONTH_BASED_FREQUENCIES = new Set([
  'monthly',
  'quarterly',
  'semi_annually',
  'yearly',
  'five_yearly',
]);

export async function GET() {
  try {
    const [logs, equipment, categories] = await Promise.all([
      prisma.maintenanceHistory.findMany({
        include: {
          equipment: {
            include: { category: true },
          },
          task: true,
        },
        orderBy: {
          maintenanceDate: 'desc',
        },
      }),
      prisma.equipment.findMany({
        include: {
          category: true,
        }
      }),
      prisma.equipmentCategory.findMany(),
    ]);

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
      equipmentIds, // Support array of equipment IDs
      taskId,
      taskIds,
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
      maintenanceDetails,
      fromDate,
      toDate
    } = body;

    const baseEquipments = equipmentIds && Array.isArray(equipmentIds) && equipmentIds.length > 0 
      ? equipmentIds 
      : (equipmentId ? [parseInt(equipmentId)] : []);

    if ((baseEquipments.length === 0 && (!taskIds || taskIds.length === 0)) || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const targetTaskIds = taskIds && Array.isArray(taskIds) && taskIds.length > 0 
      ? taskIds 
      : (taskId ? [parseInt(taskId)] : [null]);

    const createdLogsCount = [];

    // Process tasks in parallel using Promise.all
    if (targetTaskIds[0] !== null) {
      await Promise.all(targetTaskIds.map(async (tId) => {
        const task = await prisma.task.findUnique({ where: { id: tId } });
        if (!task) return;

        const currentEquipmentId = task.equipmentId;

        if (type === 'scheduled' && fromDate && toDate) {
          // Sequential logging for date range
          const userFromDate = new Date(fromDate);
          const endLogDate = new Date(toDate);
          
          // Start from the LATER of user-provided fromDate or a freshly computed due date.
          // This avoids stale task.nextDueDate values (from prior buggy calculations) blocking valid backfills.
          const computedNextDue = task.lastCompletedDate
            ? calculateNextDueDate(new Date(task.lastCompletedDate), task.frequency)
            : null;
          const taskNextDue = computedNextDue ?? (task.nextDueDate ? new Date(task.nextDueDate) : userFromDate);
          let currentLogDate = new Date(Math.max(userFromDate.getTime(), taskNextDue.getTime()));
          
          const logsToCreate = [];
          let lastProcessedDate = null;

          // Safety break to prevent infinite loops (max 100 logs per task)
          let iterations = 0;
          while (currentLogDate <= endLogDate && iterations < 100) {
            iterations++;

            // Skip Fridays (Day 5) for logging
            if (currentLogDate.getDay() === 5 && !MONTH_BASED_FREQUENCIES.has(task.frequency)) {
              // Move to the next scheduled date
              currentLogDate = calculateNextDueDate(currentLogDate, task.frequency as any);
              continue;
            }

            logsToCreate.push({
              equipmentId: currentEquipmentId,
              taskId: tId,
              type,
              targetDate: currentLogDate,
              informationDate: informationDate ? new Date(informationDate) : null,
              problemDescription: null,
              solutionDetails,
              usedParts,
              workType,
              problemType,
              remarks,
              maintenanceDate: currentLogDate,
              maintenanceDetails,
              performedAt: new Date(),
            });

            lastProcessedDate = new Date(currentLogDate);
            // Move to the next due date for the next iteration
            currentLogDate = calculateNextDueDate(currentLogDate, task.frequency as any);
          }

          if (logsToCreate.length > 0) {
            await prisma.maintenanceHistory.createMany({ data: logsToCreate });

            // Final task update
            const nextDue = calculateNextDueDate(lastProcessedDate!, task.frequency as any);
            
            // Ensure nextDue is also not a Friday if it's a daily task or just generally
            let finalNextDue = nextDue;
            if (finalNextDue.getDay() === 5 && !MONTH_BASED_FREQUENCIES.has(task.frequency)) {
                finalNextDue = calculateNextDueDate(finalNextDue, task.frequency as any);
            }

            await prisma.task.update({
              where: { id: task.id },
              data: {
                lastCompletedDate: lastProcessedDate,
                nextDueDate: finalNextDue
              }
            });
            createdLogsCount.push(...logsToCreate);
          }
        } else {
          // Standard single log
          const taskTargetDate = task.nextDueDate;
          const newHistory = await prisma.maintenanceHistory.create({
            data: {
              equipmentId: currentEquipmentId,
              taskId: tId,
              type,
              targetDate: taskTargetDate,
              informationDate: informationDate ? new Date(informationDate) : null,
              serviceStartDate: serviceStartDate ? new Date(serviceStartDate) : null,
              serviceEndDate: serviceEndDate ? new Date(serviceEndDate) : null,
              problemDescription: type === 'scheduled' ? null : problemDescription,
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

          createdLogsCount.push(newHistory);

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
      }));
    } else {
      // Corrective/Predictive across multiple equipments
      await Promise.all(baseEquipments.map(async (eId) => {
        const newHistory = await prisma.maintenanceHistory.create({
          data: {
            equipmentId: parseInt(eId),
            taskId: null,
            type,
            targetDate: null,
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
        createdLogsCount.push(newHistory);
      }));
    }

    return NextResponse.json({ success: true, count: createdLogsCount.length }, { status: 201 });
    } catch (error) {
    console.error('Maintenance logging error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    const maintenanceIds = ids
      .map((id) => parseInt(id))
      .filter((id) => !Number.isNaN(id));

    if (maintenanceIds.length === 0) {
      return NextResponse.json({ error: 'No valid IDs provided' }, { status: 400 });
    }

    const logsToDelete = await prisma.maintenanceHistory.findMany({
      where: { id: { in: maintenanceIds } },
      select: { taskId: true },
    });

    const affectedTaskIds = Array.from(
      new Set(
        logsToDelete
          .map((log) => log.taskId)
          .filter((taskId): taskId is number => taskId !== null)
      )
    );

    const deleteResult = await prisma.$transaction(async (tx) => {
      const result = await tx.maintenanceHistory.deleteMany({
        where: {
          id: {
            in: maintenanceIds
          }
        }
      });

      for (const taskId of affectedTaskIds) {
        const task = await tx.task.findUnique({
          where: { id: taskId },
          select: { id: true, frequency: true },
        });

        if (!task) continue;

        const latestLog = await tx.maintenanceHistory.findFirst({
          where: {
            taskId,
            type: 'scheduled',
            maintenanceDate: { not: null },
          },
          orderBy: { maintenanceDate: 'desc' },
        });

        if (latestLog?.maintenanceDate) {
          const completedDate = new Date(latestLog.maintenanceDate);
          const nextDue = calculateNextDueDate(completedDate, task.frequency);

          await tx.task.update({
            where: { id: task.id },
            data: {
              lastCompletedDate: completedDate,
              nextDueDate: nextDue,
            },
          });
        } else {
          await tx.task.update({
            where: { id: task.id },
            data: {
              lastCompletedDate: null,
              nextDueDate: null,
            },
          });
        }
      }

      return result;
    });

    return NextResponse.json({ 
      message: `Successfully deleted ${deleteResult.count} maintenance records`,
      count: deleteResult.count
    });
  } catch (error) {
    console.error('Bulk maintenance delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

