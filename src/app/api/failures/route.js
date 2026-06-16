import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const [failures, total] = await Promise.all([
      prisma.failureEvent.findMany({
        include: { asset: true, workOrder: true },
        orderBy: { occurredAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.failureEvent.count()
    ]);

    const data = failures.map(f => ({
      id: f.id,
      assetName: f.asset.name,
      assetCode: f.asset.code,
      description: f.description,
      occurredAt: f.occurredAt,
      resolvedAt: f.resolvedAt,
      downtimeHours: f.downtimeHours,
      workOrderTitle: f.workOrder ? f.workOrder.title : null
    }));

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error('Error fetching failure events:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newFailure = await prisma.failureEvent.create({
      data: {
        assetId: body.assetId,
        description: body.description,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
        downtimeHours: body.downtimeHours ? parseFloat(body.downtimeHours) : 0,
      }
    });
    return NextResponse.json(newFailure, { status: 201 });
  } catch (error) {
    console.error('Error logging failure:', error);
    return NextResponse.json({ error: 'Failed to log failure event' }, { status: 500 });
  }
}
