import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const isKanban = searchParams.get('kanban') === 'true';

    // Base filter for roles
    let baseWhere = {};
    if (user?.role === 'TECHNICIAN') {
      // Find the Technician record linked to this User's email
      const technician = await prisma.technician.findUnique({
        where: { email: user.email }
      });
      if (technician) {
        baseWhere = { assignedToId: technician.id };
      } else {
        // If no linked technician found, return no work orders
        baseWhere = { id: 'no-match-found' };
      }
    }
    
    if (isKanban) {
      // Kanban View: Unpaginated
      const rawWorkOrders = await prisma.workOrder.findMany({
        where: baseWhere,
        include: { asset: true, assignedTo: true },
        orderBy: { createdAt: 'desc' }
      });

      const workOrders = { draft: [], assigned: [], inProgress: [], waitingParts: [], completed: [] };
      rawWorkOrders.forEach(wo => {
        const formattedWo = {
          dbId: wo.id,
          id: wo.woNumber,
          title: wo.title,
          description: wo.description,
          asset: `${wo.asset.code} - ${wo.asset.name}`,
          assetId: wo.assetId,
          priority: wo.priority === 'CRITICAL' ? 'Critical' : wo.priority === 'HIGH' ? 'High' : wo.priority === 'MEDIUM' ? 'Medium' : 'Low',
          rawPriority: wo.priority,
          rawStatus: wo.status,
          assignee: wo.assignedTo ? wo.assignedTo.name : null,
          assigneeRole: wo.assignedTo ? wo.assignedTo.role : null,
        };
        if (wo.status === 'DRAFT') workOrders.draft.push(formattedWo);
        else if (wo.status === 'ASSIGNED') workOrders.assigned.push(formattedWo);
        else if (wo.status === 'IN_PROGRESS') workOrders.inProgress.push(formattedWo);
        else if (wo.status === 'WAITING_PARTS') workOrders.waitingParts.push(formattedWo);
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

    const orderBy = ['title', 'status', 'priority', 'createdAt', 'dueDate'].includes(sortBy) 
      ? { [sortBy]: sortOrder } 
      : { createdAt: sortOrder };

    const where = search ? {
      ...baseWhere,
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { woNumber: { contains: search, mode: 'insensitive' } }
      ]
    } : baseWhere;

    const [rawWorkOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where, skip, take: limit, orderBy,
        include: { asset: true, assignedTo: true }
      }),
      prisma.workOrder.count({ where })
    ]);

    const formattedData = rawWorkOrders.map(wo => ({
      dbId: wo.id,
      id: wo.woNumber,
      title: wo.title,
      description: wo.description,
      asset: `${wo.asset.code} - ${wo.asset.name}`,
      assetId: wo.assetId,
      priority: wo.priority === 'CRITICAL' ? 'Critical' : wo.priority === 'HIGH' ? 'High' : wo.priority === 'MEDIUM' ? 'Medium' : 'Low',
      rawPriority: wo.priority,
      rawStatus: wo.status,
      status: wo.status === 'DRAFT' ? 'Draft' : wo.status === 'ASSIGNED' ? 'Assigned' : wo.status === 'IN_PROGRESS' ? 'In Progress' : wo.status === 'WAITING_PARTS' ? 'Waiting Parts' : wo.status === 'COMPLETED' ? 'Completed' : 'Closed',
      assignee: wo.assignedTo ? wo.assignedTo.name : null,
      assigneeRole: wo.assignedTo ? wo.assignedTo.role : null,
      workType: wo.workType,
      dueDate: wo.dueDate,
      createdAt: wo.createdAt
    }));

    return NextResponse.json({ data: formattedData, total });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validation Rules
    if (!data.assetId) return NextResponse.json({ error: 'Asset is required' }, { status: 400 });
    if (!data.assignedToId) return NextResponse.json({ error: 'Assigned Technician is required' }, { status: 400 });
    if (!data.description) return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    if (data.dueDate && new Date(data.dueDate) < new Date(new Date().setHours(0,0,0,0))) {
      return NextResponse.json({ error: 'Due Date cannot be in the past' }, { status: 400 });
    }
    
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 400 });
    }

    // Auto-generate WO Number
    // Simple robust strategy: WO-YYYYMMDD-XXXX
    const count = await prisma.workOrder.count();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(count + 1001).padStart(4, '0');
    const woNumber = `WO-${dateStr}-${seq}`;

    const newWorkOrder = await prisma.workOrder.create({
      data: {
        woNumber,
        title: data.title,
        description: data.description,
        status: data.status || 'DRAFT',
        priority: data.priority || 'MEDIUM',
        workType: data.workType || 'Corrective Maintenance',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assetId: asset.id,
        siteId: asset.siteId,
        assignedToId: data.assignedToId,
        estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : null,
      }
    });

    return NextResponse.json(newWorkOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
  }
}
