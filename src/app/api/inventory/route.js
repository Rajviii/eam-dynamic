import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'code';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    const skip = (page - 1) * limit;
    
    const orderBy = ['code', 'name', 'quantityOnHand', 'cost'].includes(sortBy) 
      ? { [sortBy]: sortOrder } 
      : { code: sortOrder };

    const where = {
      isDeleted: false,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ]
      } : {})
    };

    const [parts, total] = await Promise.all([
      prisma.inventoryPart.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { category: true }
      }),
      prisma.inventoryPart.count({ where })
    ]);

    const formattedParts = parts.map(part => {
      let status = 'In Stock';
      if (part.quantityOnHand === 0) status = 'Out of Stock';
      else if (part.quantityOnHand <= part.reorderLevel) status = 'Low Stock';

      return {
        id: part.id,
        partNumber: part.code,
        description: part.name,
        category: part.category ? part.category.name : 'General',
        categoryId: part.categoryId,
        onHand: part.quantityOnHand,
        reorderPoint: part.reorderLevel,
        minStockLevel: part.minStockLevel,
        unitCost: part.cost,
        status,
      };
    });

    return NextResponse.json({ data: formattedParts, total });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    const firstSite = await prisma.site.findFirst();
    if (!firstSite) {
      return NextResponse.json({ error: 'No sites available' }, { status: 400 });
    }

    const newPart = await prisma.inventoryPart.create({
      data: {
        code: data.partNumber,
        name: data.description,
        categoryId: data.categoryId || null,
        quantityOnHand: parseInt(data.onHand) || 0,
        reorderLevel: parseInt(data.reorderPoint) || 0,
        minStockLevel: parseInt(data.minStockLevel) || 0,
        cost: parseFloat(data.unitCost) || 0.0,
        siteId: firstSite.id
      }
    });

    return NextResponse.json(newPart, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory part:', error);
    return NextResponse.json({ error: 'Failed to create part' }, { status: 500 });
  }
}
