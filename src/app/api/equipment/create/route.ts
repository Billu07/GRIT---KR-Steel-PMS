import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, categoryId, location, description, status, imageUrl } = body;

    if (!code || !name || !categoryId) {
      return NextResponse.json({ error: 'Code, Name, and Category ID are required' }, { status: 400 });
    }

    const newEquipment = await prisma.equipment.create({
      data: {
        code,
        name,
        categoryId: parseInt(categoryId),
        location,
        description,
        status: status || 'active',
        imageUrl,
      },
    });

    return NextResponse.json(newEquipment, { status: 201 });
  } catch (error) {
    console.error('Equipment creation error:', error);
    // Check for unique constraint violation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 'P2002') {
        return NextResponse.json({ error: 'Equipment code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
