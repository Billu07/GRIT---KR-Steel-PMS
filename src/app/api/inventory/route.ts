import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Fetch all inventory
export async function GET() {
  try {
    const p = prisma as any;
    if (p['inventory']) {
      const inventory = await p['inventory'].findMany({
        orderBy: { id: 'asc' },
      });
      return NextResponse.json(inventory);
    }
    return NextResponse.json([], { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch inventory:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new inventory item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const p = prisma as any;
    if (!p['inventory']) throw new Error('Inventory model not found');

    const newItem = await p['inventory'].create({
      data: {
        name: body.name,
        quantity: body.quantity || '',
        description: body.description || '',
        swl: body.swl || '',
        certificateNo: body.certificateNo || '',
      },
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error('Failed to create inventory:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update existing inventory item
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const p = prisma as any;
    if (!p['inventory']) throw new Error('Inventory model not found');

    const updatedItem = await p['inventory'].update({
      where: { id: Number(id) },
      data: {
        name: data.name,
        quantity: data.quantity,
        description: data.description,
        swl: data.swl,
        certificateNo: data.certificateNo,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error('Failed to update inventory:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove inventory item
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const p = prisma as any;
    if (!p['inventory']) throw new Error('Inventory model not found');

    await p['inventory'].delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete inventory:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
