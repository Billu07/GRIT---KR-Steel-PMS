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
    const { taskId, taskName, frequency, taskDetail, equipmentId } = body;

    const currentTask = await prisma.task.findUnique({ where: { id: dbTaskId } });
    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData: any = {
      taskId,
      taskName,
      frequency,
      taskDetail,
    };

    if (equipmentId) updateData.equipmentId = parseInt(equipmentId);

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