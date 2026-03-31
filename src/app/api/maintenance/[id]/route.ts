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

    await prisma.maintenanceHistory.delete({
      where: { id: maintenanceId },
    });
    
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

    // If this maintenance record is linked to a task, update the task's next due date
    const linkedTaskId = updatedRecord.taskId;
    if (linkedTaskId && updatedRecord.maintenanceDate) {
      const task = await prisma.task.findUnique({ where: { id: linkedTaskId } });
      if (task) {
        const completedDate = new Date(updatedRecord.maintenanceDate);
        const nextDue = calculateNextDueDate(completedDate, task.frequency);

        await prisma.task.update({
          where: { id: linkedTaskId },
          data: {
            lastCompletedDate: completedDate,
            nextDueDate: nextDue,
            // We might optionally reset runningHours here, but it's tricky on edit. 
            // Usually runningHours is reset on NEW maintenance. On edit, it's ambiguous.
            // Let's stick to dates for now as requested.
          }
        });
      }
    }

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Maintenance update error:', error);
    return NextResponse.json({ error: 'Failed to update maintenance record' }, { status: 500 });
  }
}
