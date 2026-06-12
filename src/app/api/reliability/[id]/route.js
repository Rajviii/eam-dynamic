import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const metric = await prisma.reliabilityMetric.findUnique({
      where: { id: params.id },
      include: { asset: true }
    });

    if (!metric) {
      return NextResponse.json({ error: 'Metric not found' }, { status: 404 });
    }

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Error fetching metric:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    
    const updatedMetric = await prisma.reliabilityMetric.update({
      where: { id: params.id },
      data: {
        mtbf: parseFloat(data.mtbf) || 0,
        mttr: parseFloat(data.mttr) || 0,
        availability: parseFloat(data.availability) || 0,
        downtime: parseFloat(data.downtime) || 0,
        assetId: data.assetId,
      }
    });

    return NextResponse.json(updatedMetric);
  } catch (error) {
    console.error('Error updating metric:', error);
    return NextResponse.json({ error: 'Failed to update metric' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await prisma.reliabilityMetric.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting metric:', error);
    return NextResponse.json({ error: 'Failed to delete metric' }, { status: 500 });
  }
}
