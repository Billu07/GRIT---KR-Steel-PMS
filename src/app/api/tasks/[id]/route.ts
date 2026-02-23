import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = parseInt(id);

  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
  }

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Task delete error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbTaskId = parseInt(id);

  if (isNaN(dbTaskId)) {
    return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { taskId, taskName, frequency, taskDetail, equipmentId, lastCompletedDate, nextDueDate, criticality, estimatedHours, runningHours } = body;

    const currentTask = await prisma.task.findUnique({ where: { id: dbTaskId } });
    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (taskId !== undefined) updateData.taskId = taskId;
    if (taskName !== undefined) updateData.taskName = taskName;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (taskDetail !== undefined) updateData.taskDetail = taskDetail;
    if (equipmentId !== undefined) updateData.equipmentId = parseInt(equipmentId);
    if (lastCompletedDate !== undefined) updateData.lastCompletedDate = lastCompletedDate ? new Date(lastCompletedDate) : null;
    if (nextDueDate !== undefined) updateData.nextDueDate = nextDueDate ? new Date(nextDueDate) : null;
    if (criticality !== undefined) updateData.criticality = criticality;
    
    // Usage tracking safeguards
    if (estimatedHours !== undefined) {
        if (estimatedHours === null || estimatedHours === "") {
            updateData.estimatedHours = null;
        } else {
            const parsed = parseInt(estimatedHours);
            updateData.estimatedHours = isNaN(parsed) ? null : parsed;
        }
    }
    
    if (runningHours !== undefined) {
        const parsed = parseInt(runningHours);
        updateData.runningHours = isNaN(parsed) ? 0 : parsed;
    }

    const updatedTask = await prisma.task.update({
      where: { id: dbTaskId },
      data: updateData,
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('Task update error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A task with this ID already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}