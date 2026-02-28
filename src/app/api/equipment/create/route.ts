import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, categoryId, location, description, status, imageUrl, serviceReportUrl, safetyMeasures,
      capacity, model, serialNumber, brand, runningHours, testCertNumber, testCertValidity, testCertApplied,
      unit, quantity
    } = body;

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and Category ID are required' }, { status: 400 });
    }

    // Auto-generate code: EQ-0001 format
    const equipments = await prisma.equipment.findMany({
      select: { code: true }
    });

    let maxNum = 0;
    equipments.forEach(eq => {
      if (eq.code && eq.code.startsWith('EQ-')) {
        const parts = eq.code.split('-');
        if (parts.length > 1) {
          const num = parseInt(parts[1]);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    const code = `EQ-${String(maxNum + 1).padStart(4, '0')}`;

    const newEquipment = await prisma.equipment.create({
      data: {
        code,
        name,
        categoryId: parseInt(categoryId),
        location,
        description,
        status: status || 'active',
        imageUrl,
        serviceReportUrl,
        safetyMeasures,
        capacity,
        model,
        serialNumber,
        brand,
        runningHours,
        testCertNumber,
        testCertValidity,
        testCertApplied,
        unit,
        quantity,
      },
    });

    return NextResponse.json(newEquipment, { status: 201 });
  } catch (error) {
    console.error('Equipment creation error:', error);
    // Check for unique constraint violation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 'P2002') {
        // Retry with a slightly different logic if count collision happens (rare in this simple setup)
        const timestamp = Date.now().toString().slice(-4);
        const fallbackCode = `EQ-COLL-${timestamp}`;
        // This is a very simple fallback, ideally we'd loop or use a more robust generator
        return NextResponse.json({ error: 'Generated code collision, please try again.' }, { status: 409 });
    }
    return NextResponse.json({ error: `Internal server error: ${(error as Error).message}` }, { status: 500 });
  }
}
