import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const program = await prisma.maintenanceProgram.findUnique({
      where: { id: id },
      include: {
        asset: {
          select: { name: true, criticality: true, code: true }
        }
      }
    });

    if (!program) {
      return NextResponse.json({ error: 'Maintenance Program not found' }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error('Error fetching maintenance program:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const updatedProgram = await prisma.maintenanceProgram.update({
      where: { id: id },
      data: {
        title: data.title,
        description: data.description,
        frequencyDays: data.frequencyDays !== undefined ? parseInt(data.frequencyDays) : undefined,
        scheduleType: data.scheduleType,
        nextDueDate: data.nextDueDate !== undefined ? (data.nextDueDate ? new Date(data.nextDueDate) : null) : undefined,
        isActive: data.isActive,
      },
      include: {
        asset: {
          select: { name: true, criticality: true, code: true }
        }
      }
    });

    return NextResponse.json(updatedProgram);
  } catch (error) {
    console.error('Error updating maintenance program:', error);
    return NextResponse.json({ error: 'Failed to update maintenance program' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.maintenanceProgram.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting maintenance program:', error);
    return NextResponse.json({ error: 'Failed to delete maintenance program' }, { status: 500 });
  }
}
