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

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        criticality: true,
        site: true,
        category: true,
        parent: { select: { id: true, name: true, code: true } },
        histories: { orderBy: { createdAt: 'desc' }, take: 5 },
        workOrders: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const s = parseInt(data.safetyImpact) || 1;
    const e = parseInt(data.environmentalImpact) || 1;
    const p = parseInt(data.productionImpact) || 1;
    const f = parseInt(data.financialImpact) || 1;
    const { overallScore, classification } = calculateCriticality({ safety: s, env: e, prod: p, fin: f });

    let parsedInstallationDate = null;
    if (data.installationDate) {
      parsedInstallationDate = new Date(data.installationDate);
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        status: data.status,
        lifecycleStage: data.lifecycleStage,
        siteId: data.siteId,
        categoryId: data.categoryId || null,
        parentId: data.parentId || null,
        imageUrl: data.imageUrl || null,
        manufacturer: data.manufacturer || null,
        modelNumber: data.modelNumber || null,
        serialNumber: data.serialNumber || null,
        installationDate: parsedInstallationDate,
        criticality: {
          upsert: {
            create: {
              safetyImpact: s,
              environmentalImpact: e,
              productionImpact: p,
              financialImpact: f,
              overallScore: overallScore,
              classification: classification
            },
            update: {
              safetyImpact: s,
              environmentalImpact: e,
              productionImpact: p,
              financialImpact: f,
              overallScore: overallScore,
              classification: classification
            }
          }
        }
      }
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: error.message || 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.asset.update({
      where: { id },
      data: { isDeleted: true }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
