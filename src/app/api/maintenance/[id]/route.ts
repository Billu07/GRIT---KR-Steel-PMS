import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const maintenanceId = parseInt(id);

  if (isNaN(maintenanceId)) {
    return NextResponse.json({ error: 'Invalid maintenance ID' }, { status: 400 });
  }

  try {
    await prisma.maintenanceHistory.delete({
      where: { id: maintenanceId },
    });
    return NextResponse.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    console.error('Maintenance delete error:', error);
    return NextResponse.json({ error: 'Failed to delete maintenance record' }, { status: 500 });
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

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Maintenance update error:', error);
    return NextResponse.json({ error: 'Failed to update maintenance record' }, { status: 500 });
  }
}
