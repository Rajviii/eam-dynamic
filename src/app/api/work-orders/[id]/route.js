import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const wo = await prisma.workOrder.findUnique({
      where: { id: id },
      include: {
        asset: true,
        assignedTo: true,
      }
    });

    if (!wo) {
      return NextResponse.json({ error: 'Work Order not found' }, { status: 404 });
    }

    return NextResponse.json(wo);
  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Check if the status requires a state change that we map
    const mappedStatus = data.status; // 'DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'APPROVED', 'COMPLETED', 'CLOSED'

    const updatedWo = await prisma.workOrder.update({
      where: { id: id },
      data: {
        title: data.title,
        description: data.description,
        status: mappedStatus,
        priority: data.priority,
        assetId: data.assetId,
      }
    });

    return NextResponse.json(updatedWo);
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json({ error: error.message || 'Failed to update work order' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.workOrder.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting work order:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete work order' }, { status: 500 });
  }
}
