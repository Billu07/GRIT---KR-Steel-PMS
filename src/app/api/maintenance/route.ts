import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      equipmentId, 
      type, 
      interventionDate, 
      serviceStartDate, 
      serviceEndDate, 
      problemDescription, 
      solutionDetails, 
      usedParts, 
      workType, 
      problemType, 
      remarks 
    } = body;

    if (!equipmentId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newHistory = await prisma.maintenanceHistory.create({
      data: {
        equipmentId,
        type,
        interventionDate: interventionDate ? new Date(interventionDate) : null,
        serviceStartDate: serviceStartDate ? new Date(serviceStartDate) : null,
        serviceEndDate: serviceEndDate ? new Date(serviceEndDate) : null,
        problemDescription,
        solutionDetails,
        usedParts,
        workType,
        problemType,
        remarks,
        performedAt: new Date(),
      },
    });

    return NextResponse.json(newHistory, { status: 201 });
  } catch (error) {
    console.error('Maintenance logging error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
