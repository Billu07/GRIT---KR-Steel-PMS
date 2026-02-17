import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, differenceInDays } from 'date-fns';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = parseInt(id);

  if (isNaN(jobId)) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  try {
    await prisma.job.delete({
      where: { id: jobId },
    });
    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Job delete error:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = parseInt(id);

  if (isNaN(jobId)) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { jobCode, jobName, jobType, equipmentId, flag, dateDone, hoursWorked, plannedHours, frequency, criticality } = body;

    // Recalculate derived fields if necessary
    const updateData: any = {
      jobCode,
      jobName,
      jobType,
      flag,
      hoursWorked,
      plannedHours,
      frequency,
      criticality,
    };

    if (equipmentId) updateData.equipmentId = parseInt(equipmentId);

    if (dateDone || frequency || plannedHours !== undefined || hoursWorked !== undefined) {
      const dateDoneObj = dateDone ? new Date(dateDone) : undefined;
      
      // We need existing data if some fields are missing for calculation, but simplified:
      // Assuming all relevant fields are passed or we fetch them. 
      // For now, let's assume the frontend passes all critical fields for recalculation or we rely on what's passed.
      
      if (dateDoneObj && frequency) {
         let daysToAdd = 7;
        switch (frequency) {
          case 'weekly': daysToAdd = 7; break;
          case 'monthly': daysToAdd = 30; break;
          case '3-monthly': daysToAdd = 90; break;
          case 'yearly': daysToAdd = 365; break;
          case '5-yearly': daysToAdd = 1825; break;
          default: daysToAdd = 7;
        }
        const dueDate = addDays(dateDoneObj, daysToAdd);
        updateData.dateDone = dateDoneObj;
        updateData.dateDue = dueDate;
        
        const today = new Date();
        const overdueDays = differenceInDays(today, dueDate) > 0 ? differenceInDays(today, dueDate) : 0;
        updateData.overdueDays = overdueDays;
      }
      
      if (plannedHours !== undefined && hoursWorked !== undefined) {
        updateData.remainingHours = Math.max(0, plannedHours - hoursWorked);
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Job update error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
