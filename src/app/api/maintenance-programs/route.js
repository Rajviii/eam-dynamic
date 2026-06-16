import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    const where = {};
    if (assetId) {
      where.assetId = assetId;
    }

    const programs = await prisma.maintenanceProgram.findMany({
      where,
      include: {
        asset: {
          select: { name: true, criticality: true, code: true }
        },
        technician: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching maintenance programs:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    const program = await prisma.maintenanceProgram.create({
      data: {
        title: data.title,
        description: data.description || null,
        frequencyDays: parseInt(data.frequencyDays) || 30,
        scheduleType: data.scheduleType || 'MONTHLY',
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
        assetId: data.assetId,
        technicianId: data.technicianId || null,
        workType: data.workType || 'Preventive Maintenance',
        priority: data.priority || 'MEDIUM',
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        asset: {
          select: { name: true, criticality: true, code: true }
        },
        technician: true
      }
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance program:', error);
    return NextResponse.json({ error: 'Failed to create maintenance program' }, { status: 500 });
  }
}
