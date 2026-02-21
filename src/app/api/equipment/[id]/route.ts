import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryId = parseInt(id);

  if (isNaN(categoryId)) {
    return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
  }

  try {
    const category = await prisma.equipmentCategory.findUnique({
      where: { id: categoryId },
      include: {
        equipment: {
          include: {
            tasks: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const tasks = await prisma.task.findMany({
      where: {
        equipment: {
          categoryId: categoryId,
        },
      },
      include: {
        equipment: true,
      },
    });

    return NextResponse.json({
      category,
      equipment: category.equipment,
      tasks,
    });
  } catch (error) {
    console.error('Equipment fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryId = parseInt(id);

  if (isNaN(categoryId)) {
    return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { taskId, taskName, frequency, taskDetail, equipmentId } = body;

    if (!taskId || !taskName || !equipmentId || !frequency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newTask = await prisma.task.create({
      data: {
        taskId,
        taskName,
        frequency,
        taskDetail,
        equipmentId: parseInt(equipmentId),
        createdBy: 1, // Default to admin for now
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error('Task creation error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A task with this ID already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
