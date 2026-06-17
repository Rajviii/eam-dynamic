import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const technician = await prisma.technician.findUnique({
      where: { id: id },
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
    const { id } = await params;
    const data = await request.json();

    // Fetch existing technician first to check their current email
    const existingTech = await prisma.technician.findUnique({
      where: { id: id }
    });

    if (!existingTech) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    const updatedTechnician = await prisma.$transaction(async (tx) => {
      // 1. Update Technician table
      const updated = await tx.technician.update({
        where: { id: id },
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

      // 2. Synchronize to User table if a matching user account exists
      const existingUser = await tx.user.findUnique({
        where: { email: existingTech.email }
      });

      if (existingUser) {
        await tx.user.update({
          where: { email: existingTech.email },
          data: {
            email: data.email,
            name: data.name,
            role: 'TECHNICIAN'
          }
        });
      }

      return updated;
    });

    return NextResponse.json(updatedTechnician);
  } catch (error) {
    console.error('Error updating technician:', error);
    return NextResponse.json({ error: 'Failed to update technician' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existingTech = await prisma.technician.findUnique({
      where: { id: id }
    });

    if (!existingTech) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete Technician
      await tx.technician.delete({
        where: { id: id }
      });

      // 2. Delete corresponding User if it is a technician login
      await tx.user.deleteMany({
        where: {
          email: existingTech.email,
          role: 'TECHNICIAN'
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting technician:', error);
    return NextResponse.json({ error: 'Failed to delete technician' }, { status: 500 });
  }
}
