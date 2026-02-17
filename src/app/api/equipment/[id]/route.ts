import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, differenceInDays } from 'date-fns';

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
            jobs: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const jobs = await prisma.job.findMany({
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
      jobs,
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
    const { jobCode, jobName, jobType, equipmentId, flag, dateDone, hoursWorked, plannedHours, frequency, criticality } = body;

    if (!jobCode || !jobName || !equipmentId || !dateDone || !plannedHours || !frequency || !criticality) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculations
    const dateDoneObj = new Date(dateDone);
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
    const today = new Date();
    const overdueDays = differenceInDays(today, dueDate) > 0 ? differenceInDays(today, dueDate) : 0;
    const remainingHours = Math.max(0, plannedHours - hoursWorked);

    const newJob = await prisma.job.create({
      data: {
        jobCode,
        jobName,
        jobType,
        equipmentId: parseInt(equipmentId),
        flag,
        dateDone: dateDoneObj,
        hoursWorked,
        plannedHours,
        frequency,
        dateDue: dueDate,
        remainingHours,
        criticality,
        overdueDays,
        createdBy: 1, // Default to admin for now, ideally fetch from session
        category: '', // Can be filled if needed or removed
      },
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
