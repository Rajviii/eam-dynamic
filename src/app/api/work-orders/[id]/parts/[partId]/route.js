import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../../lib/auth';

export async function DELETE(request, { params }) {
  try {
    const { id, partId } = await params;
    const user = await getCurrentUser();

    // 1. Fetch the Work Order to check its status
    const workOrder = await prisma.workOrder.findUnique({
      where: { id }
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Business Rule: Cannot remove parts from Completed/Closed WOs
    if (workOrder.status === 'COMPLETED' || workOrder.status === 'CLOSED') {
      return NextResponse.json({ error: 'Cannot modify parts on a completed or closed work order' }, { status: 400 });
    }

    // 2. Fetch the WorkOrderPart record
    const woPart = await prisma.workOrderPart.findUnique({
      where: { id: partId },
      include: { inventoryPart: true }
    });

    if (!woPart) {
      return NextResponse.json({ error: 'Work order part not found' }, { status: 404 });
    }

    // 3. Transaction: Delete record, Restore stock, Log audit
    await prisma.$transaction(async (tx) => {
      // Restore inventory
      await tx.inventoryPart.update({
        where: { id: woPart.inventoryPartId },
        data: {
          quantityOnHand: { increment: woPart.quantityConsumed }
        }
      });

      // Delete the consumed part record
      await tx.workOrderPart.delete({
        where: { id: partId }
      });

      // Audit Log
      if (user) {
        await tx.auditLog.create({
          data: {
            action: 'INVENTORY_RESTORED',
            entity: 'WorkOrder',
            entityId: id,
            userId: user.id,
            details: `Removed ${woPart.quantityConsumed} of ${woPart.inventoryPart.name} from Work Order. Stock restored.`
          }
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Part removed and inventory restored' });
  } catch (error) {
    console.error('Error removing part:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
