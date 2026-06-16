import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { action } = await request.json(); // 'ISSUE', 'REJECT'
    const user = await getCurrentUser();

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const woPart = await tx.workOrderPart.findUnique({
        where: { id },
        include: { inventoryPart: true, workOrder: { include: { assignedTo: true } } }
      });

      if (!woPart) throw new Error('Request not found');

      if (action === 'REJECT') {
        const updated = await tx.workOrderPart.update({
          where: { id },
          data: { requestStatus: 'CANCELLED' }
        });
        
        // Notify Technician
        if (woPart.workOrder.assignedTo) {
          const techUser = await tx.user.findUnique({ where: { email: woPart.workOrder.assignedTo.email } });
          if (techUser) {
            await tx.notification.create({
              data: {
                title: 'Part Request Rejected',
                message: `Your request for ${woPart.inventoryPart.name} was rejected.`,
                type: 'PART_REJECTED',
                userId: techUser.id,
                linkUrl: `/work-orders`
              }
            });
          }
        }
        return updated;
      }

      if (action === 'ISSUE') {
        if (woPart.inventoryPart.quantityOnHand < woPart.requestedQty) {
          throw new Error('Insufficient inventory to issue this part.');
        }

        // We mark it as ISSUED. 
        // Note: As per requirement, inventory Qty is reduced at "CONSUME" by Technician.
        // If we needed to reserve stock, we'd decrement it here. But we stick to the plan.
        const updatedWoPart = await tx.workOrderPart.update({
          where: { id },
          data: {
            requestStatus: 'ISSUED',
            issuedQty: woPart.requestedQty,
            issuedAt: new Date(),
            issuedById: user.id
          }
        });

        // Audit Trail
        await tx.auditLog.create({
          data: {
            action: 'PART_ISSUED',
            entity: 'WorkOrder',
            entityId: woPart.workOrderId,
            userId: user.id,
            details: `Storekeeper issued ${woPart.requestedQty} of ${woPart.inventoryPart.name}.`
          }
        });

        // Notify Technician
        if (woPart.workOrder.assignedTo) {
          const techUser = await tx.user.findUnique({ where: { email: woPart.workOrder.assignedTo.email } });
          if (techUser) {
            await tx.notification.create({
              data: {
                title: 'Part Issued',
                message: `Your requested part ${woPart.inventoryPart.name} is ready for pickup/use.`,
                type: 'PART_ISSUED',
                userId: techUser.id,
                linkUrl: `/work-orders`
              }
            });
          }
        }

        // Rule 4: If ALL requested parts are ISSUED/CONSUMED, change WAITING_PARTS -> IN_PROGRESS
        const allParts = await tx.workOrderPart.findMany({
          where: { workOrderId: woPart.workOrderId }
        });
        
        const allIssuedOrConsumed = allParts.every(p => 
          p.requestStatus === 'ISSUED' || p.requestStatus === 'CONSUMED' || p.requestStatus === 'CANCELLED'
        );

        if (allIssuedOrConsumed && woPart.workOrder.status === 'WAITING_PARTS') {
          await tx.workOrder.update({
            where: { id: woPart.workOrderId },
            data: { status: 'IN_PROGRESS' }
          });

          await tx.auditLog.create({
            data: {
              action: 'WO_RESUMED',
              entity: 'WorkOrder',
              entityId: woPart.workOrderId,
              userId: user.id,
              details: `All parts issued. Work Order returned to IN_PROGRESS.`
            }
          });
        }

        return updatedWoPart;
      }

      throw new Error('Invalid action');
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error handling part request:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
