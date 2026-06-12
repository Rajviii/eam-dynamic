import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const category = await prisma.assetCategory.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const category = await prisma.assetCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description
      }
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.assetCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
