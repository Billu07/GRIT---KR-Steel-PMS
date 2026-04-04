import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateNextDueDate } from '@/lib/dateUtils';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let maintenanceId: number | undefined;
  try {
    const { id } = await params;
    maintenanceId = parseInt(id);

    console.log('[DELETE] Attempting to delete maintenance record with ID:', maintenanceId);

    if (isNaN(maintenanceId)) {
      return NextResponse.json({ error: 'Invalid maintenance ID' }, { status: 400 });
    }

    // Check if record exists first
    const record = await prisma.maintenanceHistory.findUnique({
      where: { id: maintenanceId }
    });

    if (!record) {
      console.warn('[DELETE] Record not found:', maintenanceId);
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 });
    }

    // Find task before deleting the log
    const linkedTaskId = record.taskId;

    await prisma.maintenanceHistory.delete({
      where: { id: maintenanceId },
    });
    
    // Sync task dates after deletion
    if (linkedTaskId) {
      const task = await prisma.task.findUnique({ where: { id: linkedTaskId } });
      if (task) {
        const latestLog = await prisma.maintenanceHistory.findFirst({
          where: { taskId: linkedTaskId, type: 'scheduled', maintenanceDate: { not: null } },
          orderBy: { maintenanceDate: 'desc' }
        });

        if (latestLog && latestLog.maintenanceDate) {
          const completedDate = new Date(latestLog.maintenanceDate);
          const nextDue = calculateNextDueDate(completedDate, task.frequency);
          await prisma.task.update({
            where: { id: linkedTaskId },
            data: { lastCompletedDate: completedDate, nextDueDate: nextDue }
          });
        } else {
          // No logs left, nullify dates
          await prisma.task.update({
            where: { id: linkedTaskId },
            data: { lastCompletedDate: null, nextDueDate: null }
          });
        }
      }
    }

    console.log('[DELETE] Successfully deleted maintenance record:', maintenanceId);
    return NextResponse.json({ message: 'Maintenance record deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE] Maintenance delete error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete maintenance record', 
      details: error.message || String(error),
      code: error.code // Prisma error code if available
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const maintenanceId = parseInt(id);

  if (isNaN(maintenanceId)) {
    return NextResponse.json({ error: 'Invalid maintenance ID' }, { status: 400 });
  }

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

    const currentRecord = await prisma.maintenanceHistory.findUnique({ where: { id: maintenanceId } });
    if (!currentRecord) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 });
    }

    const updateData: any = {
      type,
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
    };

    if (equipmentId) updateData.equipmentId = parseInt(equipmentId);
    if (taskId) updateData.taskId = parseInt(taskId);
    else if (taskId === null) updateData.taskId = null;

    const updatedRecord = await prisma.maintenanceHistory.update({
      where: { id: maintenanceId },
      data: updateData,
    });

    // If this maintenance record is linked to a task, update the task's next due date safely
    const linkedTaskId = updatedRecord.taskId;
    if (linkedTaskId) {
      const task = await prisma.task.findUnique({ where: { id: linkedTaskId } });
      if (task) {
        // Find the absolute latest scheduled log for this task to determine its true lastCompletedDate
        const latestLog = await prisma.maintenanceHistory.findFirst({
          where: { taskId: linkedTaskId, type: 'scheduled', maintenanceDate: { not: null } },
          orderBy: { maintenanceDate: 'desc' }
        });

        if (latestLog && latestLog.maintenanceDate) {
          const completedDate = new Date(latestLog.maintenanceDate);
          const nextDue = calculateNextDueDate(completedDate, task.frequency);
          await prisma.task.update({
            where: { id: linkedTaskId },
            data: { lastCompletedDate: completedDate, nextDueDate: nextDue }
          });
        }
      }
    }

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Maintenance update error:', error);
    return NextResponse.json({ error: 'Failed to update maintenance record' }, { status: 500 });
  }
}
