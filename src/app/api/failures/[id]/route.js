import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const failureEvent = await prisma.failureEvent.findUnique({
      where: { id: params.id },
      include: { asset: true, workOrder: true }
    });

    if (!failureEvent) {
      return NextResponse.json({ error: 'Failure event not found' }, { status: 404 });
    }

    return NextResponse.json(failureEvent);
  } catch (error) {
    console.error('Error fetching failure event:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    
    const updatedFailure = await prisma.failureEvent.update({
      where: { id: params.id },
      data: {
        description: data.description,
        downtimeHours: parseFloat(data.downtimeHours) || 0,
        assetId: data.assetId,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined
      }
    });

    return NextResponse.json(updatedFailure);
  } catch (error) {
    console.error('Error updating failure event:', error);
    return NextResponse.json({ error: 'Failed to update failure event' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await prisma.failureEvent.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting failure event:', error);
    return NextResponse.json({ error: 'Failed to delete failure event' }, { status: 500 });
  }
}
