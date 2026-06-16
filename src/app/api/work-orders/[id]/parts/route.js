import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const parts = await prisma.workOrderPart.findMany({
      where: { workOrderId: id },
      include: {
        inventoryPart: true,
        requestedBy: { select: { name: true } },
        issuedBy: { select: { name: true } }
      }
    });
    return NextResponse.json(parts);
  } catch (error) {
    console.error('Error fetching parts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { inventoryPartId, requestedQty } = await request.json();
    const user = await getCurrentUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await prisma.$transaction(async (tx) => {
      const part = await tx.inventoryPart.findUnique({
        where: { id: inventoryPartId }
      });

      if (!part) throw new Error('Part not found');

      // 1. Create the Request Record
      const woPart = await tx.workOrderPart.create({
        data: {
          workOrderId: id,
          inventoryPartId: inventoryPartId,
          requestedQty: parseInt(requestedQty, 10),
          requestStatus: 'REQUESTED',
          requestedById: user.id
        },
        include: { inventoryPart: true }
      });

      // 2. Audit Log
      await tx.auditLog.create({
        data: {
          action: 'PART_REQUESTED',
          entity: 'WorkOrder',
          entityId: id,
          userId: user.id,
          details: `Requested ${requestedQty} of ${part.name} (Code: ${part.code})`
        }
      });

      // 3. Notify Storekeepers (Managers/Admins)
      const managers = await tx.user.findMany({ where: { role: { in: ['MANAGER', 'ADMIN'] } } });
      if (managers.length > 0) {
        await tx.notification.createMany({
          data: managers.map(m => ({
            title: 'New Part Request',
            message: `Part requested for Work Order: ${part.name} (Qty: ${requestedQty}).`,
            type: 'PART_REQUEST',
            userId: m.id,
            linkUrl: `/inventory/requests`
          }))
        });
      }

      // 4. Automation Rules
      if (part.quantityOnHand < parseInt(requestedQty, 10)) {
        // Change WO status to WAITING_PARTS
        await tx.workOrder.update({
          where: { id },
          data: { status: 'WAITING_PARTS' }
        });

        // Fire Low Stock Notification
        if (managers.length > 0) {
          await tx.notification.createMany({
            data: managers.map(m => ({
              title: 'Low Stock Alert (Waiting Parts)',
              message: `Work Order delayed. Part ${part.name} is low in stock (${part.quantityOnHand} available, ${requestedQty} requested).`,
              type: 'LOW_STOCK',
              userId: m.id,
              linkUrl: `/inventory`
            }))
          });
        }
      }

      return woPart;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error requesting part:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
