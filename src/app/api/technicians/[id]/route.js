import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const technician = await prisma.technician.findUnique({
      where: { id: params.id },
      include: {
        assignedWorkOrders: true,
        maintenanceProgs: true,
      }
    });

    if (!technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    return NextResponse.json(technician);
  } catch (error) {
    console.error('Error fetching technician:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json();

    const updatedTechnician = await prisma.technician.update({
      where: { id: params.id },
      data: {
        employeeNumber: data.employeeNumber,
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        skills: data.skills,
        status: data.status,
      }
    });

    return NextResponse.json(updatedTechnician);
  } catch (error) {
    console.error('Error updating technician:', error);
    return NextResponse.json({ error: 'Failed to update technician' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await prisma.technician.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting technician:', error);
    return NextResponse.json({ error: 'Failed to delete technician' }, { status: 500 });
  }
}
