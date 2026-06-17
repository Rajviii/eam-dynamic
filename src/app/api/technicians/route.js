import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

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

    const currentUser = await getCurrentUser();
    // Default organizationId: if no logged-in user, fetch the first organization in the system
    let orgId = currentUser?.organizationId;
    let siteId = currentUser?.siteId;
    
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst();
      orgId = firstOrg?.id;
    }
    if (!siteId && orgId) {
      const firstSite = await prisma.site.findFirst({ where: { organizationId: orgId } });
      siteId = firstSite?.id;
    }

    const newTechnician = await prisma.$transaction(async (tx) => {
      // 1. Create Technician record
      const technician = await tx.technician.create({
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

      // 2. Synchronize to User table
      if (orgId) {
        const existingUser = await tx.user.findUnique({
          where: { email: data.email }
        });

        if (existingUser) {
          // If User already exists, promote them to role TECHNICIAN and update name
          await tx.user.update({
            where: { email: data.email },
            data: {
              name: data.name,
              role: 'TECHNICIAN',
              siteId: siteId || existingUser.siteId
            }
          });
        } else {
          // If User does not exist, create a new User record
          await tx.user.create({
            data: {
              email: data.email,
              name: data.name,
              role: 'TECHNICIAN',
              organizationId: orgId,
              siteId: siteId || null,
            }
          });
        }
      }

      return technician;
    });

    return NextResponse.json(newTechnician, { status: 201 });
  } catch (error) {
    console.error('Error creating technician:', error);
    return NextResponse.json({ error: 'Failed to create technician' }, { status: 500 });
  }
}
