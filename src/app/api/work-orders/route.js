import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const isKanban = searchParams.get('kanban') === 'true';
    
    if (isKanban) {
      // Kanban View: Unpaginated
      const rawWorkOrders = await prisma.workOrder.findMany({
        include: { asset: true, assignedTo: true },
        orderBy: { createdAt: 'desc' }
      });

      const workOrders = { draft: [], assigned: [], inProgress: [], waitingParts: [], completed: [] };
      rawWorkOrders.forEach(wo => {
        const formattedWo = {
          dbId: wo.id,
          id: `WO-${wo.id.split('-')[0].substring(0,4).toUpperCase()}`,
          title: wo.title,
          description: wo.description,
          asset: `${wo.asset.code} - ${wo.asset.name}`,
          assetId: wo.assetId,
          priority: wo.priority === 'CRITICAL' ? 'Critical' : wo.priority === 'HIGH' ? 'High' : wo.priority === 'MEDIUM' ? 'Medium' : 'Low',
          rawPriority: wo.priority,
          rawStatus: wo.status,
          assignee: wo.assignedTo ? wo.assignedTo.name : null,
        };
        if (wo.status === 'DRAFT') workOrders.draft.push(formattedWo);
        else if (wo.status === 'ASSIGNED') workOrders.assigned.push(formattedWo);
        else if (wo.status === 'IN_PROGRESS') workOrders.inProgress.push(formattedWo);
        else if (wo.status === 'APPROVED') workOrders.waitingParts.push(formattedWo);
        else if (wo.status === 'COMPLETED' || wo.status === 'CLOSED') workOrders.completed.push(formattedWo);
      });
      return NextResponse.json(workOrders);
    }

    // Table View: Paginated
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;

    const orderBy = ['title', 'status', 'priority', 'createdAt'].includes(sortBy) 
      ? { [sortBy]: sortOrder } 
      : { createdAt: sortOrder };

    const where = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const [rawWorkOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where, skip, take: limit, orderBy,
        include: { asset: true, assignedTo: true }
      }),
      prisma.workOrder.count({ where })
    ]);

    const formattedData = rawWorkOrders.map(wo => ({
      dbId: wo.id,
      id: `WO-${wo.id.split('-')[0].substring(0,4).toUpperCase()}`,
      title: wo.title,
      description: wo.description,
      asset: `${wo.asset.code} - ${wo.asset.name}`,
      assetId: wo.assetId,
      priority: wo.priority === 'CRITICAL' ? 'Critical' : wo.priority === 'HIGH' ? 'High' : wo.priority === 'MEDIUM' ? 'Medium' : 'Low',
      rawPriority: wo.priority,
      rawStatus: wo.status,
      status: wo.status === 'DRAFT' ? 'Draft' : wo.status === 'ASSIGNED' ? 'Assigned' : wo.status === 'IN_PROGRESS' ? 'In Progress' : wo.status === 'APPROVED' ? 'Waiting Parts' : 'Completed',
      assignee: wo.assignedTo ? wo.assignedTo.name : null,
      createdAt: wo.createdAt
    }));

    return NextResponse.json({ data: formattedData, total });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Fallback logic for siteId: try to get it from the asset or just grab the first site
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 400 });
    }

    const newWorkOrder = await prisma.workOrder.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || 'DRAFT',
        priority: data.priority || 'MEDIUM',
        assetId: asset.id,
        siteId: asset.siteId
      }
    });

    return NextResponse.json(newWorkOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
  }
}
