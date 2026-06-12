import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const totalAssets = await prisma.asset.count();
    
    // Total Open Work Orders
    const openWorkOrders = await prisma.workOrder.count({
      where: {
        status: { notIn: ['COMPLETED', 'CLOSED'] }
      }
    });

    // Critical Assets Count
    const criticalAssetsAtRiskCount = await prisma.asset.count({
      where: {
        criticalityScore: { gte: 4 }
      }
    });

    // Asset Health Overview (Simulated mapping based on existing schema)
    const excellent = await prisma.asset.count({ where: { status: 'OPERATIONAL', criticalityScore: { lte: 2 } } });
    const good = await prisma.asset.count({ where: { status: 'OPERATIONAL', criticalityScore: { gt: 2 } } });
    const warning = await prisma.asset.count({ where: { status: 'DEGRADED' } });
    const critical = await prisma.asset.count({ where: { status: { in: ['UNDER_MAINTENANCE', 'DECOMMISSIONED'] } } });

    // Work Orders Grouped By Status
    const woStatusGroup = await prisma.workOrder.groupBy({
      by: ['status'],
      _count: true
    });
    const woStatuses = {
      draft: woStatusGroup.find(g => g.status === 'DRAFT')?._count || 0,
      assigned: woStatusGroup.find(g => g.status === 'ASSIGNED')?._count || 0,
      inProgress: woStatusGroup.find(g => g.status === 'IN_PROGRESS')?._count || 0,
      waitingParts: woStatusGroup.find(g => g.status === 'APPROVED')?._count || 0,
      completed: woStatusGroup.find(g => ['COMPLETED', 'CLOSED'].includes(g.status))?._count || 0,
    };

    // Critical Assets at Risk List
    const topCriticalAssets = await prisma.asset.findMany({
      where: { criticalityScore: { gte: 3 } },
      orderBy: { criticalityScore: 'desc' },
      take: 5,
      include: { riskAssessments: true }
    });

    const criticalAssetsList = topCriticalAssets.map(a => {
      // Base health on status
      let health = 100;
      if (a.status === 'DEGRADED') health = 70;
      if (a.status === 'UNDER_MAINTENANCE') health = 40;
      if (a.status === 'DECOMMISSIONED') health = 0;

      // Find max risk score if any
      const maxRisk = a.riskAssessments.length > 0 
        ? Math.max(...a.riskAssessments.map(r => r.riskScore)) 
        : (a.criticalityScore * 3); // mock fallback

      let riskStr = 'Low';
      if (maxRisk >= 20) riskStr = 'Extreme';
      else if (maxRisk >= 12) riskStr = 'High';
      else if (maxRisk >= 6) riskStr = 'Medium';

      return {
        id: a.id,
        name: a.name,
        health,
        risk: riskStr,
        criticality: a.criticalityScore >= 4 ? 'Critical' : 'High'
      };
    });

    // Upcoming Maintenance
    const upcomingWo = await prisma.workOrder.findMany({
      where: { status: { notIn: ['COMPLETED', 'CLOSED'] } },
      orderBy: { createdAt: 'desc' }, // Using createdAt as mock for plannedStartDate if it's mostly null
      take: 5,
      include: { asset: true }
    });

    const upcomingMaintenance = {
      today: [],
      tomorrow: [],
      thisWeek: []
    };

    upcomingWo.forEach((wo, idx) => {
      const item = {
        id: `WO-${wo.id.split('-')[0].substring(0,4).toUpperCase()}`,
        asset: wo.asset.name,
        title: wo.title,
        priority: wo.priority === 'CRITICAL' ? 'High' : 
                  wo.priority === 'HIGH' ? 'High' : 
                  wo.priority === 'MEDIUM' ? 'Medium' : 'Low'
      };
      if (idx === 0) upcomingMaintenance.today.push(item);
      else if (idx === 1) upcomingMaintenance.tomorrow.push(item);
      else upcomingMaintenance.thisWeek.push(item);
    });

    // Risk Matrix Data
    const allRisks = await prisma.riskAssessment.findMany({
      select: { probability: true, impact: true }
    });

    const riskMatrix = [];
    for (let l = 1; l <= 5; l++) {
      for (let c = 1; c <= 5; c++) {
        const count = allRisks.filter(r => r.probability === l && r.impact === c).length;
        riskMatrix.push({ likelihood: l, consequence: c, count });
      }
    }

    // Mocking maintenance cost and availability since they require deep calculations/history not fully seeded
    const maintenanceCost = 285000;
    const assetAvailability = 95.2;

    const data = {
      totalAssets,
      assetAvailability,
      openWorkOrders,
      criticalAssetsAtRisk: criticalAssetsAtRiskCount,
      maintenanceCost,
      assetHealthOverview: {
        excellent,
        good,
        warning,
        critical,
      },
      woStatuses,
      criticalAssetsList,
      upcomingMaintenance,
      riskMatrix
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
