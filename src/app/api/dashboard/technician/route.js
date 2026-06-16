import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TECHNICIAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the technician record for this user based on email (since user.email should match technician.email)
    const technician = await prisma.technician.findUnique({
      where: { email: user.email }
    });

    if (!technician) {
      return NextResponse.json({
        assignedWorkOrders: 0,
        pmTasks: 0,
        dueToday: 0,
        overdue: 0,
        unreadNotifications: 0,
        recentWorkOrders: []
      });
    }

    // Count assigned open work orders
    const assignedWorkOrders = await prisma.workOrder.count({
      where: {
        assignedToId: technician.id,
        status: { notIn: ['COMPLETED', 'CLOSED'] }
      }
    });

    // Count PM tasks
    const pmTasks = await prisma.workOrder.count({
      where: {
        assignedToId: technician.id,
        status: { notIn: ['COMPLETED', 'CLOSED'] },
        workType: 'Preventive Maintenance'
      }
    });

    // Count due today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const dueToday = await prisma.workOrder.count({
      where: {
        assignedToId: technician.id,
        status: { notIn: ['COMPLETED', 'CLOSED'] },
        dueDate: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });

    const overdue = await prisma.workOrder.count({
      where: {
        assignedToId: technician.id,
        status: { notIn: ['COMPLETED', 'CLOSED'] },
        dueDate: {
          lt: startOfToday
        }
      }
    });

    // Notifications
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    });

    // Recent Priority Work Orders
    const recentWorkOrders = await prisma.workOrder.findMany({
      where: {
        assignedToId: technician.id,
        status: { notIn: ['COMPLETED', 'CLOSED'] }
      },
      include: {
        asset: { select: { name: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ],
      take: 5
    });

    return NextResponse.json({
      assignedWorkOrders,
      pmTasks,
      dueToday,
      overdue,
      unreadNotifications,
      recentWorkOrders
    });

  } catch (error) {
    console.error('Error fetching tech stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
