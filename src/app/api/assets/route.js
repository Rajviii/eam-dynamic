import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to calculate classification based on ISO 55001 matrix (sum-based)
function calculateCriticality(scores) {
  const { safety, env, prod, fin } = scores;
  
  // Calculate total score by summing up the impact areas (max 20)
  const overallScore = safety + env + prod + fin;
  
  let classification = 'LOW';
  if (overallScore >= 16) classification = 'CRITICAL';
  else if (overallScore >= 11) classification = 'HIGH';
  else if (overallScore >= 6) classification = 'MEDIUM';
  else classification = 'LOW';

  return { overallScore, classification };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;
    const query = searchParams.get('query') || searchParams.get('search') || '';
    
    const validCriticalities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const criticality = searchParams.get('criticality')?.toUpperCase() || '';

    const where = {
      isDeleted: false,
      ...(validCriticalities.includes(criticality) ? {
        criticality: {
          classification: criticality
        }
      } : {}),
      ...(query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } }
        ]
      } : {})
    };

    const assets = await prisma.asset.findMany({
      skip,
      take: limit,
      where,
      include: {
        site: { select: { name: true } },
        category: { select: { name: true } },
        criticality: true
      },
      orderBy: { code: 'asc' }
    });

    const total = await prisma.asset.count({ where });

    const formattedAssets = assets.map(asset => {
      let healthScore = 'N/A';
      if (asset.status === 'OPERATIONAL') healthScore = 95;
      else if (asset.status === 'DEGRADED') healthScore = 70;
      else if (asset.status === 'UNDER_MAINTENANCE') healthScore = 40;
      else if (asset.status === 'DECOMMISSIONED') healthScore = 0;

      return {
        id: asset.id,
        code: asset.code,
        name: asset.name,
        category: asset.category?.name || 'Uncategorized',
        site: asset.site?.name || 'Unassigned',
        status: asset.status,
        criticality: asset.criticality?.classification || 'LOW',
        healthScore: healthScore,
      };
    });

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
