import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const risk = await prisma.riskAssessment.findUnique({
      where: { id: id },
      include: { asset: true }
    });

    if (!risk) {
      return NextResponse.json({ error: 'Risk Assessment not found' }, { status: 404 });
    }

    return NextResponse.json(risk);
  } catch (error) {
    console.error('Error fetching risk:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const prob = parseInt(data.likelihood) || 1;
    const impact = parseInt(data.consequence) || 1;

    const updatedRisk = await prisma.riskAssessment.update({
      where: { id: id },
      data: {
        probability: prob,
        impact: impact,
        riskScore: prob * impact,
        mitigationPlan: data.risk,
        assetId: data.assetId,
      }
    });

    return NextResponse.json(updatedRisk);
  } catch (error) {
    console.error('Error updating risk:', error);
    return NextResponse.json({ error: 'Failed to update risk' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.riskAssessment.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting risk:', error);
    return NextResponse.json({ error: 'Failed to delete risk' }, { status: 500 });
  }
}
