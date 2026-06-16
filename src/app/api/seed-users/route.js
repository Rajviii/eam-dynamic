import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const org = await prisma.organization.upsert({
      where: { name: 'Acme Corp' },
      update: {},
      create: { name: 'Acme Corp' }
    });

    const site = await prisma.site.findFirst({ where: { organizationId: org.id } }) || 
      await prisma.site.create({ data: { name: 'Main Plant', organizationId: org.id } });

    // Ensure users exist
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: { role: 'ADMIN', passwordHash: 'password123' },
      create: { email: 'admin@example.com', name: 'Admin User', role: 'ADMIN', organizationId: org.id, siteId: site.id, passwordHash: 'password123' }
    });

    await prisma.user.upsert({
      where: { email: 'manager@example.com' },
      update: { role: 'MANAGER', passwordHash: 'password123' },
      create: { email: 'manager@example.com', name: 'Maintenance Manager', role: 'MANAGER', organizationId: org.id, siteId: site.id, passwordHash: 'password123' }
    });

    await prisma.user.upsert({
      where: { email: 'tech@example.com' },
      update: { role: 'TECHNICIAN', passwordHash: 'password123' },
      create: { email: 'tech@example.com', name: 'Senior Technician', role: 'TECHNICIAN', organizationId: org.id, siteId: site.id, passwordHash: 'password123' }
    });

    // Ensure technician profile exists for the tech user
    await prisma.technician.upsert({
      where: { email: 'tech@example.com' },
      update: { name: 'Senior Technician' },
      create: { 
        email: 'tech@example.com', 
        name: 'Senior Technician', 
        technicianCode: 'TECH-001', 
        role: 'Mechanical Tech' 
      }
    });

    return NextResponse.json({ success: true, message: 'Users seeded successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
