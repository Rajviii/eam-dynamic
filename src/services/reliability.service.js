import { prisma } from '../lib/prisma';

export const ReliabilityCalculationService = {
  async calculateGlobalMetrics() {
    // 1. Get Assets
    const assets = await prisma.asset.findMany({
      where: { isDeleted: false },
      include: {
        failureEvents: true,
        workOrders: {
          where: {
            maintenanceProgramId: null, // Corrective work orders
            status: { in: ['COMPLETED', 'CLOSED'] }
          }
        }
      }
    });

    if (!assets || assets.length === 0) {
      return { mtbf: 0, mttr: 0, availability: 100, reliability: 100, downtimeTrend: [], failureFrequency: [] };
    }

    let totalMtbf = 0;
    let totalMttr = 0;
    let totalAvailability = 0;
    let totalDowntimeTrend = {}; // Group by month
    let failureFrequencyMap = {}; // Group by asset code

    const now = new Date();

    assets.forEach(asset => {
      // 2. Total Time
      const startDate = asset.installationDate || asset.createdAt;
      const totalHoursSinceStart = Math.max(0, (now - startDate) / (1000 * 60 * 60));

      // 3. Number of Failures & Downtime
      let totalDowntimeHours = 0;
      asset.failureEvents.forEach(fe => {
        const downtime = fe.downtimeHours || 0;
        totalDowntimeHours += downtime;
        
        const month = new Date(fe.occurredAt).toLocaleString('default', { month: 'short' });
        totalDowntimeTrend[month] = (totalDowntimeTrend[month] || 0) + downtime;
      });

      const totalOperatingHours = Math.max(0, totalHoursSinceStart - totalDowntimeHours);
      const numberOfFailures = asset.failureEvents.length;

      // MTBF
      let mtbf = numberOfFailures > 0 ? totalOperatingHours / numberOfFailures : totalOperatingHours;
      
      // Failure Frequency
      if (numberOfFailures > 0) {
        failureFrequencyMap[asset.code] = numberOfFailures;
      }

      // 4. MTTR Calculation
      let totalRepairHours = 0;
      let countCorrective = 0;

      asset.workOrders.forEach(wo => {
        if (wo.actualStartDate && wo.actualEndDate) {
          const repairTime = Math.max(0, (wo.actualEndDate - wo.actualStartDate) / (1000 * 60 * 60));
          totalRepairHours += repairTime;
          countCorrective++;
        }
      });

      let mttr = countCorrective > 0 ? totalRepairHours / countCorrective : 0;

      // 5. Availability
      let availability = 100;
      if (mtbf > 0 || mttr > 0) {
        availability = (mtbf / (mtbf + mttr)) * 100;
      }

      totalMtbf += mtbf;
      totalMttr += mttr;
      totalAvailability += availability;
    });

    const count = assets.length;
    const avgMtbf = Math.round(totalMtbf / count);
    const avgMttr = Number((totalMttr / count).toFixed(1));
    const avgAvailability = Number((totalAvailability / count).toFixed(1));

    // Format Downtime Trend
    const downtimeTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.toLocaleString('default', { month: 'short' });
      downtimeTrend.push({
        month: m,
        downtime: Number((totalDowntimeTrend[m] || 0).toFixed(1))
      });
    }

    // Format Failure Frequency
    const failureFrequency = Object.keys(failureFrequencyMap)
      .map(key => ({ asset: key, count: failureFrequencyMap[key] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      mtbf: avgMtbf,
      mttr: avgMttr,
      availability: avgAvailability,
      reliability: Number((avgAvailability * 0.95).toFixed(1)), // Mocked reliability score based on availability
      downtimeTrend,
      failureFrequency
    };
  }
};
