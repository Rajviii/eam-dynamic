import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const wo = await prisma.workOrder.findUnique({
      where: { id: id },
      include: {
        asset: true,
        assignedTo: true,
      }
    });

    if (!wo) {
      return NextResponse.json({ error: 'Work Order not found' }, { status: 404 });
    }

    return NextResponse.json(wo);
  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const user = await getCurrentUser();
    
    // Fetch existing WO to check rules
    const existingWo = await prisma.workOrder.findUnique({ where: { id: id }});
    if (!existingWo) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    if (existingWo.status === 'CLOSED') return NextResponse.json({ error: 'Cannot modify a closed work order' }, { status: 403 });

    // Validate Due Date
    if (data.dueDate && new Date(data.dueDate) < new Date(new Date().setHours(0,0,0,0))) {
      return NextResponse.json({ error: 'Due Date cannot be in the past' }, { status: 400 });
    }

    let mappedStatus = data.status;

    // RBAC: Technicians cannot CLOSE work orders
    if (user && user.role === 'TECHNICIAN' && mappedStatus === 'CLOSED') {
      mappedStatus = 'COMPLETED'; // Force to completed instead of closed
    }

    const updatedWo = await prisma.workOrder.update({
      where: { id: id },
      data: {
        title: data.title,
        description: data.description,
        status: mappedStatus,
        priority: data.priority,
        assetId: data.assetId,
        assignedToId: data.assignedToId || null,
        workType: data.workType,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : null,
        actualHours: data.actualHours ? parseFloat(data.actualHours) : null,
        completionNotes: data.completionNotes,
        failureCause: data.failureCause,
        rootCause: data.rootCause,
      }
    });

    // Create Audit Log
    if (user) {
      await prisma.auditLog.create({
        data: {
          action: `WO_UPDATED_STATUS_${mappedStatus}`,
          entity: 'WorkOrder',
          entityId: updatedWo.id,
          userId: user.id,
          details: `Status updated to ${mappedStatus}`
        }
      });
    }

    // Notify Manager if Technician marks it as COMPLETED
    if (mappedStatus === 'COMPLETED' && existingWo.status !== 'COMPLETED') {
      const managers = await prisma.user.findMany({ where: { role: { in: ['MANAGER', 'ADMIN'] } } });
      if (managers.length > 0) {
        await prisma.notification.createMany({
          data: managers.map(m => ({
            title: 'Work Order Completed',
            message: `Work Order ${updatedWo.title} has been completed and requires review.`,
            type: 'WO_NEEDS_REVIEW',
            userId: m.id,
            linkUrl: `/work-orders`
          }))
        });
      }
    }

    // Asset History on Closure/Completion
    if ((mappedStatus === 'CLOSED' || mappedStatus === 'COMPLETED') && existingWo.status !== mappedStatus) {
      await prisma.assetHistory.create({
        data: {
          assetId: updatedWo.assetId,
          action: 'WORK_ORDER_RESOLVED',
          description: `Work Order ${updatedWo.id} resolved. ${updatedWo.completionNotes || ''}`,
          performedById: user ? user.id : null
        }
      });
    }

    return NextResponse.json(updatedWo);
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json({ error: error.message || 'Failed to update work order' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.workOrder.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting work order:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete work order' }, { status: 500 });
  }
}
