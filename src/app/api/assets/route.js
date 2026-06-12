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
    
    // For related fields, mapping sorting is complex, so we fallback to sorting by 'code' if it's a related field.
    // In a real app we would map this correctly.
    const orderBy = ['code', 'name', 'status', 'lifecycleStage', 'criticalityScore'].includes(sortBy) 
      ? { [sortBy]: sortOrder } 
      : { code: sortOrder };

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          site: true,
          category: true,
        }
      }),
      prisma.asset.count({ where })
    ]);

    const formattedAssets = assets.map(asset => {
      // Map criticalityScore (1-5) to High/Medium/Low string
      let criticality = 'Low';
      if (asset.criticalityScore >= 5) criticality = 'Critical';
      else if (asset.criticalityScore === 4) criticality = 'High';
      else if (asset.criticalityScore === 3) criticality = 'Medium';

      // Mock Health Score based on ID string to keep it stable
      const hash = asset.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const healthScore = 50 + (hash % 50); // Generates a stable score between 50-99

      return {
        id: asset.id,
        code: asset.code,
        name: asset.name,
        category: asset.category?.name || 'Uncategorized',
        categoryId: asset.categoryId,
        location: asset.site?.name || 'Unknown',
        siteId: asset.siteId,
        healthScore,
        criticality,
        criticalityScore: asset.criticalityScore,
        lifecycleStage: asset.lifecycleStage,
        status: asset.status === 'UNDER_MAINTENANCE' ? 'Maintenance' : 
                asset.status === 'OPERATIONAL' ? 'Operational' : 
                asset.status === 'DECOMMISSIONED' ? 'Decommissioned' : 'Degraded',
        rawStatus: asset.status
      };
    });

    return NextResponse.json({ data: formattedAssets, total });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // For simplicity, we hardcode a siteId since we don't have a Sites UI yet.
    // In a real app, this would be selected by the user.
    const firstSite = await prisma.site.findFirst();
    if (!firstSite) {
      return NextResponse.json({ error: 'No sites available to assign asset to.' }, { status: 400 });
    }

    const siteIdToUse = data.siteId || firstSite.id;

    const newAsset = await prisma.asset.create({
      data: {
        code: data.code,
        name: data.name,
        status: data.status || 'OPERATIONAL',
        lifecycleStage: data.lifecycleStage || 'ACTIVE',
        criticalityScore: parseInt(data.criticalityScore) || 3,
        siteId: siteIdToUse,
        categoryId: data.categoryId || null,
      }
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
