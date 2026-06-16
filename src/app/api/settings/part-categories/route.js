import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';
    const skip = (page - 1) * limit;
    
    const orderBy = ['name', 'description'].includes(sortBy) ? { [sortBy]: sortOrder } : { name: sortOrder };
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const [data, total] = await Promise.all([
      prisma.partCategory.findMany({ where, skip, take: limit, orderBy }),
      prisma.partCategory.count({ where })
    ]);
    return NextResponse.json({ data, total });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const category = await prisma.partCategory.create({
      data: {
        name: data.name,
        description: data.description || ''
      }
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
