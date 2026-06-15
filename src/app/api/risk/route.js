import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'riskScore';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;

    const orderBy = ['riskScore', 'probability', 'impact'].includes(sortBy) 
      ? { [sortBy]: sortOrder } 
      : { riskScore: sortOrder };

    const where = search ? {
      OR: [
        { mitigationPlan: { contains: search, mode: 'insensitive' } },
        { asset: { name: { contains: search, mode: 'insensitive' } } },
      ]
    } : {};

    const [riskAssessments, total] = await Promise.all([
      prisma.riskAssessment.findMany({
        where, skip, take: limit, orderBy,
        include: { asset: true }
      }),
      prisma.riskAssessment.count({ where })
    ]);

    const formattedRisks = riskAssessments.map((risk, index) => {
      let scoreStr = 'Low';
      if (risk.riskScore >= 20) scoreStr = 'Extreme';
      else if (risk.riskScore >= 12) scoreStr = 'High';
      else if (risk.riskScore >= 6) scoreStr = 'Medium';

      return {
        dbId: risk.id,
        assetId: risk.assetId,
        id: `R-${String(skip + index + 1).padStart(2, '0')}`,
        risk: risk.mitigationPlan || `${risk.asset?.name || 'Unknown'} potential failure`,
        likelihood: risk.probability,
        consequence: risk.impact,
        rawScore: risk.riskScore,
        status: 'Open',
        riskScore: scoreStr,
        assetName: risk.asset?.name
      };
    });

    return NextResponse.json({ data: formattedRisks, total });
  } catch (error) {
    console.error('Error fetching risk assessments:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 400 });
    }

    const prob = parseInt(data.likelihood) || 1;
    const impact = parseInt(data.consequence) || 1;

    const newRisk = await prisma.riskAssessment.create({
      data: {
        probability: prob,
        impact: impact,
        riskScore: prob * impact,
        mitigationPlan: data.risk,
        assetId: asset.id
      }
    });

    return NextResponse.json(newRisk, { status: 201 });
  } catch (error) {
    console.error('Error creating risk assessment:', error);
    return NextResponse.json({ error: 'Failed to create risk' }, { status: 500 });
  }
}
