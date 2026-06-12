import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    // 1. Fetch all sites (roots)
    const sites = await prisma.site.findMany();
    // 2. Fetch all assets
    const assets = await prisma.asset.findMany();

    // Map sites to root nodes
    const hierarchy = sites.map(site => {
      return {
        id: site.id,
        name: site.name,
        type: 'plant',
        children: buildAssetTree(assets, null, site.id)
      };
    });

    return NextResponse.json([{
      id: 'root-org',
      name: 'ABC Manufacturing', // Ideally from Organization table
      type: 'root',
      children: hierarchy
    }]);
  } catch (error) {
    console.error('Error fetching asset hierarchy:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Recursive function to build tree
function buildAssetTree(allAssets, parentId, siteId) {
  // Find assets matching the parentId and siteId
  const children = allAssets.filter(a => a.parentId === parentId && a.siteId === siteId);
  
  if (children.length === 0) return [];

  return children.map(child => ({
    id: child.code,
    name: child.name,
    type: child.categoryId ? 'asset' : 'system', // Simplification
    children: buildAssetTree(allAssets, child.id, siteId)
  }));
}
