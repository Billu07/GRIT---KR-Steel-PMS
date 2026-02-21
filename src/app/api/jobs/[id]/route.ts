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

    // Fetch the current job to compare dateDone
    const currentJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!currentJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

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

    let createHistory = false;
    let newDateDoneObj: Date | undefined;

    if (dateDone || frequency || plannedHours !== undefined || hoursWorked !== undefined) {
      const dateDoneObj = dateDone ? new Date(dateDone) : currentJob.dateDone;
      newDateDoneObj = dateDoneObj;
      
      // Check if dateDone has changed to trigger a history log
      if (dateDone && new Date(dateDone).getTime() !== new Date(currentJob.dateDone).getTime()) {
        createHistory = true;
      }
      
      const currentFrequency = frequency || currentJob.frequency;
      
      let daysToAdd = 7;
      switch (currentFrequency) {
        case 'daily': daysToAdd = 1; break;
        case 'weekly': daysToAdd = 7; break;
        case 'monthly': daysToAdd = 30; break;
        case 'quarterly': daysToAdd = 90; break;
        case 'semi_annually': daysToAdd = 182; break;
        case 'yearly': daysToAdd = 365; break;
        default: daysToAdd = 7;
      }
      const dueDate = addDays(dateDoneObj, daysToAdd);
      updateData.dateDone = dateDoneObj;
      updateData.dateDue = dueDate;
      
      const today = new Date();
      const overdueDays = differenceInDays(today, dueDate) > 0 ? differenceInDays(today, dueDate) : 0;
      updateData.overdueDays = overdueDays;
      
      const currentPlannedHours = plannedHours !== undefined ? plannedHours : currentJob.plannedHours;
      const currentHoursWorked = hoursWorked !== undefined ? hoursWorked : currentJob.hoursWorked;
      updateData.remainingHours = Math.max(0, currentPlannedHours - currentHoursWorked);
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    if (createHistory && newDateDoneObj) {
      await prisma.maintenanceHistory.create({
        data: {
          equipmentId: updatedJob.equipmentId,
          jobId: updatedJob.id,
          type: 'scheduled',
          performedAt: newDateDoneObj,
          remarks: `Job completed: ${updatedJob.jobName}`,
        }
      });
    }

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Job update error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
