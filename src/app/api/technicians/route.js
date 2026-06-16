import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('query') || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { technicianCode: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [technicians, total] = await Promise.all([
      prisma.technician.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.technician.count({ where })
    ]);

    return NextResponse.json({ data: technicians, total });
  } catch (error) {
    console.error('Error fetching technicians:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Auto-generate Technician Code if not provided
    const techCode = data.technicianCode || `TECH-${Date.now().toString().slice(-4)}`;

    const newTechnician = await prisma.technician.create({
      data: {
        technicianCode: techCode,
        employeeNumber: data.employeeNumber || null,
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone || null,
        skills: data.skills || null,
        status: data.status || 'Active',
      }
    });

    return NextResponse.json(newTechnician, { status: 201 });
  } catch (error) {
    console.error('Error creating technician:', error);
    return NextResponse.json({ error: 'Failed to create technician' }, { status: 500 });
  }
}
