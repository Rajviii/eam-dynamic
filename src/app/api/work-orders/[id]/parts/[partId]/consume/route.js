import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../../../lib/auth';

export async function PUT(request, { params }) {
  try {
    const { id, partId } = await params;
    const user = await getCurrentUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await prisma.$transaction(async (tx) => {
      const woPart = await tx.workOrderPart.findUnique({
        where: { id: partId },
        include: { inventoryPart: true, workOrder: true }
      });

      if (!woPart) throw new Error('Part request not found');

      // Rule 5: Technician confirms usage. ISSUED -> CONSUMED
      if (woPart.requestStatus !== 'ISSUED') {
        throw new Error('Part must be ISSUED before it can be consumed.');
      }

      // 1. Mark as CONSUMED
      const updatedWoPart = await tx.workOrderPart.update({
        where: { id: partId },
        data: {
          requestStatus: 'CONSUMED',
          consumedAt: new Date(),
          quantityConsumed: woPart.issuedQty
        }
      });

      // 2. Reduce InventoryPart.quantityOnHand
      await tx.inventoryPart.update({
        where: { id: woPart.inventoryPartId },
        data: {
          quantityOnHand: { decrement: woPart.issuedQty }
        }
      });

      // 3. Create Asset History entry (Rule 6)
      await tx.assetHistory.create({
        data: {
          assetId: woPart.workOrder.assetId,
          action: 'PART_CONSUMED',
          description: `Work Order ${woPart.workOrder.woNumber}: Consumed ${woPart.issuedQty} ${woPart.inventoryPart.name}`,
          performedById: user.id
        }
      });

      // 4. Audit Trail
      await tx.auditLog.create({
        data: {
          action: 'INVENTORY_CONSUMED',
          entity: 'WorkOrder',
          entityId: id,
          userId: user.id,
          details: `Technician confirmed usage of ${woPart.issuedQty} ${woPart.inventoryPart.name}.`
        }
      });

      return updatedWoPart;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error consuming part:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
