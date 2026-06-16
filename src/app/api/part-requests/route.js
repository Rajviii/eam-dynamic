import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    // Only Admin or Manager acting as Storekeeper
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL_OPEN'; // ALL_OPEN means REQUESTED or APPROVED

    let statusFilter = {};
    if (status === 'ALL_OPEN') {
      statusFilter = { requestStatus: { in: ['REQUESTED', 'APPROVED'] } };
    } else {
      statusFilter = { requestStatus: status };
    }

    const requests = await prisma.workOrderPart.findMany({
      where: statusFilter,
      orderBy: { requestedAt: 'desc' },
      include: {
        workOrder: {
          select: { id: true, woNumber: true, status: true, title: true, asset: { select: { name: true, code: true } } }
        },
        inventoryPart: true,
        requestedBy: {
          select: { id: true, name: true, role: true }
        },
        issuedBy: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching part requests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
