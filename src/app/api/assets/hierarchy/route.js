import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    // 1. Fetch all sites (roots)
    const sites = await prisma.site.findMany();
    // 2. Fetch all assets with criticality and active work orders
    const assets = await prisma.asset.findMany({
      where: { isDeleted: false },
      include: {
        criticality: true,
        workOrders: {
          where: { status: { notIn: ['COMPLETED', 'CLOSED'] } }
        }
      }
    });

    // Map sites to root nodes and roll up their metrics
    const hierarchy = sites.map(site => {
      const siteChildren = buildAssetTree(assets, null, site.id, 0);
      
      const assetsCount = siteChildren.reduce((sum, c) => sum + c.metrics.assetsCount, 0);
      const activeWorkOrdersCount = siteChildren.reduce((sum, c) => sum + c.metrics.activeWorkOrdersCount, 0);
      const totalHealthSum = siteChildren.reduce((sum, c) => sum + c.metrics.totalHealthSum, 0);
      const avgHealthScore = assetsCount > 0 ? Math.round(totalHealthSum / assetsCount) : 100;

      const criticalityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      siteChildren.forEach(c => {
        criticalityCounts.CRITICAL += c.metrics.criticalityCounts.CRITICAL;
        criticalityCounts.HIGH += c.metrics.criticalityCounts.HIGH;
        criticalityCounts.MEDIUM += c.metrics.criticalityCounts.MEDIUM;
        criticalityCounts.LOW += c.metrics.criticalityCounts.LOW;
      });

      const criticalAssetsCount = criticalityCounts.CRITICAL + criticalityCounts.HIGH;

      return {
        id: site.id,
        name: site.name,
        type: 'plant',
        metrics: {
          assetsCount,
          activeWorkOrdersCount,
          totalHealthSum,
          avgHealthScore,
          criticalityCounts,
          criticalAssetsCount
        },
        children: siteChildren
      };
    });

    // Roll up corporate-level metrics
    const orgAssetsCount = hierarchy.reduce((sum, c) => sum + c.metrics.assetsCount, 0);
    const orgActiveWorkOrdersCount = hierarchy.reduce((sum, c) => sum + c.metrics.activeWorkOrdersCount, 0);
    const orgTotalHealthSum = hierarchy.reduce((sum, c) => sum + c.metrics.totalHealthSum, 0);
    const orgAvgHealthScore = orgAssetsCount > 0 ? Math.round(orgTotalHealthSum / orgAssetsCount) : 100;

    const orgCriticalityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    hierarchy.forEach(c => {
      orgCriticalityCounts.CRITICAL += c.metrics.criticalityCounts.CRITICAL;
      orgCriticalityCounts.HIGH += c.metrics.criticalityCounts.HIGH;
      orgCriticalityCounts.MEDIUM += c.metrics.criticalityCounts.MEDIUM;
      orgCriticalityCounts.LOW += c.metrics.criticalityCounts.LOW;
    });

    const orgCriticalAssetsCount = orgCriticalityCounts.CRITICAL + orgCriticalityCounts.HIGH;

    return NextResponse.json([{
      id: 'root-org',
      name: 'ABC Manufacturing', // Corporate organizational root
      type: 'root',
      metrics: {
        assetsCount: orgAssetsCount,
        activeWorkOrdersCount: orgActiveWorkOrdersCount,
        totalHealthSum: orgTotalHealthSum,
        avgHealthScore: orgAvgHealthScore,
        criticalityCounts: orgCriticalityCounts,
        criticalAssetsCount: orgCriticalAssetsCount
      },
      children: hierarchy
    }]);
  } catch (error) {
    console.error('Error fetching asset hierarchy:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Recursive function to build tree with dynamic EAM levels and metrics
function buildAssetTree(allAssets, parentId, siteId, depth = 0) {
  const childrenAssets = allAssets.filter(a => a.parentId === parentId && a.siteId === siteId);
  
  return childrenAssets.map(child => {
    // 1. Determine asset health based on operational status
    let ownHealth = 100;
    if (child.status === 'DEGRADED') ownHealth = 70;
    else if (child.status === 'UNDER_MAINTENANCE') ownHealth = 40;
    else if (child.status === 'DECOMMISSIONED') ownHealth = 0;

    const hasChildren = allAssets.some(a => a.parentId === child.id);
    
    // 2. Classify EAM level dynamically
    let type = 'asset';
    if (depth === 0) type = 'building';
    else if (depth === 1) type = 'area';
    else if (depth === 2) type = 'asset';
    else type = 'component';

    // 3. Build tree recursively for nested children
    const childrenNodes = buildAssetTree(allAssets, child.id, siteId, depth + 1);

    // 4. Roll up child metrics
    const assetsCount = 1 + childrenNodes.reduce((sum, c) => sum + c.metrics.assetsCount, 0);
    const activeWorkOrdersCount = child.workOrders.length + childrenNodes.reduce((sum, c) => sum + c.metrics.activeWorkOrdersCount, 0);
    const totalHealthSum = ownHealth + childrenNodes.reduce((sum, c) => sum + c.metrics.totalHealthSum, 0);
    const avgHealthScore = Math.round(totalHealthSum / assetsCount);

    const ownCriticality = child.criticality?.classification || 'LOW';
    const criticalityCounts = {
      CRITICAL: ownCriticality === 'CRITICAL' ? 1 : 0,
      HIGH: ownCriticality === 'HIGH' ? 1 : 0,
      MEDIUM: ownCriticality === 'MEDIUM' ? 1 : 0,
      LOW: ownCriticality === 'LOW' ? 1 : 0,
    };
    childrenNodes.forEach(c => {
      criticalityCounts.CRITICAL += c.metrics.criticalityCounts.CRITICAL;
      criticalityCounts.HIGH += c.metrics.criticalityCounts.HIGH;
      criticalityCounts.MEDIUM += c.metrics.criticalityCounts.MEDIUM;
      criticalityCounts.LOW += c.metrics.criticalityCounts.LOW;
    });

    const criticalAssetsCount = criticalityCounts.CRITICAL + criticalityCounts.HIGH;

    return {
      id: child.id,
      code: child.code,
      name: child.name,
      type,
      status: child.status,
      siteId: child.siteId,
      criticality: ownCriticality,
      healthScore: ownHealth,
      metrics: {
        assetsCount,
        activeWorkOrdersCount,
        totalHealthSum,
        avgHealthScore,
        criticalityCounts,
        criticalAssetsCount
      },
      children: childrenNodes
    };
  });
}
