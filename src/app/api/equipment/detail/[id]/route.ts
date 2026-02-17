import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const equipmentId = parseInt(id);

  if (isNaN(equipmentId)) {
    return NextResponse.json({ error: 'Invalid equipment ID' }, { status: 400 });
  }

  try {
    await prisma.equipment.delete({
      where: { id: equipmentId },
    });
    return NextResponse.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Equipment delete error:', error);
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const equipmentId = parseInt(id);

  if (isNaN(equipmentId)) {
    return NextResponse.json({ error: 'Invalid equipment ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { code, name, categoryId, location, description, status, imageUrl } = body;

    const updateData: any = {
      code,
      name,
      location,
      description,
      status,
      imageUrl,
    };

    if (categoryId) updateData.categoryId = parseInt(categoryId);

    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: updateData,
    });

    return NextResponse.json(updatedEquipment);
  } catch (error) {
    console.error('Equipment update error:', error);
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 });
  }
}
