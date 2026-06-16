import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // In a real app, you'd secure this with a secret token, e.g.
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) ...

  try {
    const today = new Date();
    today.setHours(23,59,59,999);

    // Find active maintenance programs due today or earlier
    const duePrograms = await prisma.maintenanceProgram.findMany({
      where: {
        isActive: true,
        nextDueDate: {
          lte: today
        }
      },
      include: {
        asset: true
      }
    });

    const createdWorkOrders = [];

    for (const program of duePrograms) {
      // Create Work Order
      const wo = await prisma.workOrder.create({
        data: {
          title: `PM: ${program.title}`,
          description: program.description || `Auto-generated preventive maintenance for ${program.asset.name}`,
          status: 'DRAFT',
          priority: program.priority,
          workType: program.workType || 'Preventive Maintenance',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
          
          assetId: program.assetId,
          maintenanceProgramId: program.id,
          assignedToId: program.technicianId,
          siteId: program.asset.siteId,
          
          plannedStartDate: new Date(),
        }
      });

      // Update next due date
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + program.frequencyDays);
      
      await prisma.maintenanceProgram.update({
        where: { id: program.id },
        data: {
          nextDueDate: nextDate
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: 'WO_GENERATED_PM',
          entity: 'WorkOrder',
          entityId: wo.id,
          details: `Auto-generated PM from Program ${program.title}`
        }
      });

      // Optional Notification to assignee
      if (program.technicianId) {
        // Find user for this technician if exists (mocking by role logic or lookup)
        const techUser = await prisma.user.findFirst({
          where: { role: 'TECHNICIAN' } // Simplification since email matching isn't strictly enforced in schema relations yet
        });
        
        if (techUser) {
          await prisma.notification.create({
            data: {
              title: 'New PM Assigned',
              message: `You have been assigned a new PM: ${wo.title}`,
              type: 'WO_ASSIGNED',
              userId: techUser.id,
              linkUrl: '/work-orders'
            }
          });
        }
      }

      createdWorkOrders.push(wo);
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${createdWorkOrders.length} PM Work Orders`,
      count: createdWorkOrders.length
    });

  } catch (error) {
    console.error('Cron PM Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
