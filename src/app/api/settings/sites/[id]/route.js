import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(site);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const site = await prisma.site.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location
      }
    });
    return NextResponse.json(site);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.site.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
