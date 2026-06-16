import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const part = await prisma.inventoryPart.findUnique({
      where: { id }
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    return NextResponse.json(part);
  } catch (error) {
    console.error('Error fetching inventory part:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const updatedPart = await prisma.inventoryPart.update({
      where: { id },
      data: {
        code: data.partNumber,
        name: data.description,
        categoryId: data.categoryId || null,
        quantityOnHand: parseInt(data.onHand),
        reorderLevel: parseInt(data.reorderPoint),
        minStockLevel: parseInt(data.minStockLevel) || 0,
        cost: parseFloat(data.unitCost),
      }
    });

    return NextResponse.json(updatedPart);
  } catch (error) {
    console.error('Error updating inventory part:', error);
    return NextResponse.json({ error: 'Failed to update part' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.inventoryPart.update({
      where: { id },
      data: { isDeleted: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inventory part:', error);
    return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 });
  }
}
