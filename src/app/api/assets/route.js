import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to calculate classification based on ISO 55001 matrix (1-5 scale)
function calculateCriticality(scores) {
  const { safety, env, prod, fin } = scores;
  
  // Overall score could be max, average, or weighted sum. 
  // Let's use the maximum impact score to determine the worst-case scenario.
  const overallScore = Math.max(safety, env, prod, fin);
  
  let classification = 'LOW';
  if (overallScore === 5) classification = 'CRITICAL';
  else if (overallScore === 4) classification = 'HIGH';
  else if (overallScore === 3) classification = 'MEDIUM';
  else classification = 'LOW';

  return { overallScore, classification };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const assets = await prisma.asset.findMany({
      skip,
      take: limit,
      include: {
        site: { select: { name: true } },
        category: { select: { name: true } },
        criticality: true,
        reliabilityMetrics: {
          orderBy: { recordedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { code: 'asc' }
    });

    const total = await prisma.asset.count();

    const formattedAssets = assets.map(a => ({
      id: a.id,
      code: a.code,
      name: a.name,
      category: a.category?.name || 'Uncategorized',
      site: a.site?.name || 'Unassigned',
      status: a.status,
      lifecycleStage: a.lifecycleStage,
      criticality: a.criticality?.classification || 'N/A',
      healthScore: a.reliabilityMetrics[0]?.healthScore || 'N/A'
    }));

    return NextResponse.json({ data: formattedAssets, total });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Fallback if no site is provided
    const firstSite = await prisma.site.findFirst();
    if (!firstSite) {
      return NextResponse.json({ error: 'No sites available to assign asset to.' }, { status: 400 });
    }

    const siteIdToUse = data.siteId || firstSite.id;

    // Process Criticality
    const s = parseInt(data.safetyImpact) || 1;
    const e = parseInt(data.environmentalImpact) || 1;
    const p = parseInt(data.productionImpact) || 1;
    const f = parseInt(data.financialImpact) || 1;
    const { overallScore, classification } = calculateCriticality({ safety: s, env: e, prod: p, fin: f });

    // Handle date
    let parsedInstallationDate = null;
    if (data.installationDate) {
      parsedInstallationDate = new Date(data.installationDate);
    }

    const newAsset = await prisma.asset.create({
      data: {
        code: data.code,
        name: data.name,
        status: data.status || 'OPERATIONAL',
        lifecycleStage: data.lifecycleStage || 'OPERATIONAL',
        siteId: siteIdToUse,
        categoryId: data.categoryId || null,
        imageUrl: data.imageUrl || null,
        manufacturer: data.manufacturer || null,
        modelNumber: data.modelNumber || null,
        serialNumber: data.serialNumber || null,
        installationDate: parsedInstallationDate,
        criticality: {
          create: {
            safetyImpact: s,
            environmentalImpact: e,
            productionImpact: p,
            financialImpact: f,
            overallScore: overallScore,
            classification: classification
          }
        }
      }
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: error.message || 'Failed to create asset' }, { status: 500 });
  }
}
