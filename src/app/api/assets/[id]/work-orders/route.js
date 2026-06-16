import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

async function getAllChildAssetIds(assetId) {
  const children = await prisma.asset.findMany({
    where: { parentId: assetId, isDeleted: false },
    select: { id: true }
  });

  let ids = children.map(c => c.id);
  for (const child of children) {
    const childIds = await getAllChildAssetIds(child.id);
    ids = ids.concat(childIds);
  }
  return ids;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const rollup = searchParams.get('rollup') !== 'false'; // Default to true

    // Fetch the asset first to verify existence
    const asset = await prisma.asset.findUnique({
      where: { id, isDeleted: false }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    let assetIds = [id];
    if (rollup) {
      const childIds = await getAllChildAssetIds(id);
      assetIds = assetIds.concat(childIds);
    }

    const workOrders = await prisma.workOrder.findMany({
      where: {
        assetId: { in: assetIds }
      },
      include: {
        asset: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error('Error fetching asset work orders:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
