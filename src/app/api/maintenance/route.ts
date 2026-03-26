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

    const createdLogs = [];

    // If taskIds are provided, log by tasks. Otherwise, log by equipments.
    if (targetTaskIds[0] !== null) {
      for (const tId of targetTaskIds) {
        const task = await prisma.task.findUnique({ where: { id: tId } });
        if (!task) continue;

        const currentEquipmentId = task.equipmentId;

        if (type === 'scheduled' && fromDate && toDate) {
          // Sequential logging for date range
          let currentLogDate = new Date(fromDate);
          const endLogDate = new Date(toDate);

          // Safety break to prevent infinite loops (max 100 logs per task)
          let iterations = 0;
          while (currentLogDate <= endLogDate && iterations < 100) {
            iterations++;
            
            const newHistory = await prisma.maintenanceHistory.create({
              data: {
                equipmentId: currentEquipmentId,
                taskId: tId,
                type,
                targetDate: currentLogDate, // In sequential mode, targetDate is the same as maintenanceDate
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
              },
            });
            createdLogs.push(newHistory);

            // Update task to this date to get the next one correctly
            const nextDue = calculateNextDueDate(currentLogDate, task.frequency as any);
            
            await prisma.task.update({
              where: { id: task.id },
              data: {
                lastCompletedDate: currentLogDate,
                nextDueDate: nextDue
              }
            });

            // Move to the next due date for the next iteration
            currentLogDate = new Date(nextDue);
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

          createdLogs.push(newHistory);

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
    } else {
      // Corrective/Predictive across multiple equipments
      for (const eId of baseEquipments) {
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
        createdLogs.push(newHistory);
      }
    }

    return NextResponse.json(createdLogs.length === 1 ? createdLogs[0] : createdLogs, { status: 201 });
  } catch (error) {
    console.error('Maintenance logging error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
