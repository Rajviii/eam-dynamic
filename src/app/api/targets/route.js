import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fy = searchParams.get('fy');

    if (!fy) {
      return NextResponse.json({ error: 'Fiscal Year (fy) is required' }, { status: 400 });
    }

    let target = await prisma.strategicTarget.findUnique({
      where: { fiscalYear: fy }
    });

    if (!target) {
      // Return default values if no target exists for this FY yet
      target = {
        fiscalYear: fy,
        availabilityTarget: 95.0,
        downtimeTarget: 10.0,
        maintenanceCostTarget: 5.0,
        assetHealthTarget: 80.0
      };
    }

    return NextResponse.json({ data: target });
  } catch (error) {
    console.error('Error fetching target:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { fiscalYear, availabilityTarget, downtimeTarget, maintenanceCostTarget, assetHealthTarget } = data;

    if (!fiscalYear) {
      return NextResponse.json({ error: 'Fiscal Year is required' }, { status: 400 });
    }

    const target = await prisma.strategicTarget.upsert({
      where: { fiscalYear },
      update: {
        availabilityTarget: parseFloat(availabilityTarget),
        downtimeTarget: parseFloat(downtimeTarget),
        maintenanceCostTarget: parseFloat(maintenanceCostTarget),
        assetHealthTarget: parseFloat(assetHealthTarget)
      },
      create: {
        fiscalYear,
        availabilityTarget: parseFloat(availabilityTarget),
        downtimeTarget: parseFloat(downtimeTarget),
        maintenanceCostTarget: parseFloat(maintenanceCostTarget),
        assetHealthTarget: parseFloat(assetHealthTarget)
      }
    });

    return NextResponse.json({ data: target });
  } catch (error) {
    console.error('Error saving target:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
