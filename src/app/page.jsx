'use client';

import { useState, useEffect } from 'react';

// Reusable KPI Widget Component
function MetricWidget({ title, value, subtext, trend, trendUp }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
      <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
      <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
        <span className="text-xs text-slate-500 dark:text-slate-400">{subtext}</span>
      </div>
    </div>
  );
}

// True Dynamic SVG Donut Chart
function DynamicDonutChart({ segments, centerText }) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const radius = 15.91549430918954; // Circumference = 100
  let cumulativePercent = 0;

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
        {/* Background Ring */}
        <circle cx="21" cy="21" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
        {/* Segments */}
        {total > 0 && segments.map((seg, i) => {
          const percent = (seg.value / total) * 100;
          const strokeDasharray = `${percent} ${100 - percent}`;
          const strokeDashoffset = -cumulativePercent;
          cumulativePercent += percent;

          if (seg.value === 0) return null;
          return (
            <circle
              key={i}
              cx="21" cy="21" r={radius}
              fill="transparent"
              strokeWidth="6"
              stroke={seg.color}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-in-out"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">{centerText}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
      </div>
    </div>
  );
}

// 5x5 Risk Matrix Heatmap
function RiskHeatmap({ matrixData }) {
  const getCellColor = (l, c) => {
    const score = l * c;
    if (score >= 20) return 'bg-red-500';
    if (score >= 12) return 'bg-orange-500';
    if (score >= 6) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div className="flex">
      {/* Y Axis Label */}
      <div className="flex flex-col justify-center items-center pr-2">
        <span className="text-xs font-semibold text-slate-500 -rotate-90 origin-center translate-x-3 w-4">Likelihood</span>
      </div>
      <div className="flex flex-col flex-1 gap-1">
        {/* Y Axis Ticks */}
        <div className="flex flex-col-reverse justify-between h-48 absolute -ml-4 py-2">
          {[1, 2, 3, 4, 5].map(tick => <span key={tick} className="text-[10px] text-slate-400">{tick}</span>)}
        </div>
        {/* 5x5 Grid */}
        <div className="grid grid-cols-5 grid-rows-5 gap-1 h-48 flex-1 ml-2">
          {[5, 4, 3, 2, 1].map(l => (
            [1, 2, 3, 4, 5].map(c => {
              const cell = matrixData.find(m => m.likelihood === l && m.consequence === c);
              const count = cell ? cell.count : 0;
              return (
                <div key={`${l}-${c}`} className={`${getCellColor(l, c)} opacity-80 hover:opacity-100 rounded-sm flex items-center justify-center transition-opacity relative group`}>
                  {count > 0 && <span className="text-white text-xs font-bold drop-shadow-md">{count}</span>}
                  <div className="hidden group-hover:block absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
                    {count} Risks (L:{l} C:{c})
                  </div>
                </div>
              );
            })
          ))}
        </div>
        {/* X Axis Ticks */}
        <div className="flex justify-between pl-4 pr-3 pt-1">
          {[1, 2, 3, 4, 5].map(tick => <span key={tick} className="text-[10px] text-slate-400">{tick}</span>)}
        </div>
        <div className="text-center w-full mt-1">
          <span className="text-xs font-semibold text-slate-500 ml-4">Consequence</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading dynamic dashboard...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-center text-red-500">Failed to load dashboard metrics.</div>;
  }

  // Formatting segments for Donut Charts
  const healthSegments = [
    { label: 'Excellent', value: stats.assetHealthOverview.excellent, color: '#3b82f6' }, // blue-500
    { label: 'Good', value: stats.assetHealthOverview.good, color: '#22c55e' }, // green-500
    { label: 'Warning', value: stats.assetHealthOverview.warning, color: '#f97316' }, // orange-500
    { label: 'Critical', value: stats.assetHealthOverview.critical, color: '#ef4444' } // red-500
  ];
  const healthTotal = healthSegments.reduce((a, b) => a + b.value, 0);

  const woSegments = [
    { label: 'Draft', value: stats.woStatuses?.draft, color: '#cbd5e1' }, // slate-300
    { label: 'Assigned', value: stats.woStatuses.assigned, color: '#60a5fa' }, // blue-400
    { label: 'In Progress', value: stats.woStatuses.inProgress, color: '#fb923c' }, // orange-400
    { label: 'Waiting Parts', value: stats.woStatuses.waitingParts, color: '#a855f7' }, // purple-500
    { label: 'Completed', value: stats.woStatuses.completed, color: '#22c55e' } // green-500
  ];
  const woTotal = woSegments.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <div className="flex items-center gap-3">
          <select className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2">
            <option>All Sites</option>
            <option>Plant A</option>
            <option>Plant B</option>
          </select>
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg p-2">
            May 20 - Jun 20, 2024
          </div>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricWidget title="Total Assets" value={stats.totalAssets} trend="12.5%" trendUp={true} subtext="vs last month" />
        <MetricWidget title="Asset Availability" value={`${stats.assetAvailability}%`} trend="2.4%" trendUp={true} subtext="vs last month" />
        <MetricWidget title="Open Work Orders" value={stats.openWorkOrders} trend="5" trendUp={false} subtext="Overdue" />
        <MetricWidget title="Critical Assets at Risk" value={stats.criticalAssetsAtRisk} trend="2" trendUp={false} subtext="High Risk" />
        <MetricWidget title="Maintenance Cost (YTD)" value={`$${(stats.maintenanceCost / 1000).toFixed(0)}K`} trend="8.7%" trendUp={false} subtext="vs last month" />
      </div>

      {/* Row 2: Charts & Missing Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Dynamic Asset Health Overview */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 flex flex-col">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-6">Asset Health Overview</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 flex-1">
            <DynamicDonutChart segments={healthSegments} centerText={healthTotal} />
            <div className="flex flex-col gap-3 w-full max-w-[150px]">
              {healthSegments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{seg.label}</span>
                  <span className="ml-auto font-medium text-slate-900 dark:text-slate-100">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Work Orders by Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 flex flex-col">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-6">Work Orders by Status</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 flex-1">
            <DynamicDonutChart segments={woSegments} centerText={woTotal} />
            <div className="flex flex-col gap-3 w-full max-w-[150px]">
              {woSegments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{seg.label}</span>
                  <span className="ml-auto font-medium text-slate-900 dark:text-slate-100">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Exposure Heatmap */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-1">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-2">Risk Exposure</h3>
          <RiskHeatmap matrixData={stats.riskMatrix} />
        </div>

      </div>

      {/* Row 3: Tables & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Critical Assets at Risk */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-4">Critical Assets at Risk</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium text-center">Health</th>
                  <th className="pb-3 font-medium text-center">Risk</th>
                  <th className="pb-3 font-medium text-right">Criticality</th>
                </tr>
              </thead>
              <tbody>
                {stats.criticalAssetsList.map((asset, i) => (
                  <tr key={asset.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                    <td className="py-3 font-medium text-slate-900 dark:text-slate-100">{asset.name}</td>
                    <td className="py-3 text-center">
                      <span className={`font-bold ${asset.health < 50 ? 'text-red-500' : asset.health < 80 ? 'text-orange-500' : 'text-green-500'}`}>{asset.health}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${asset.risk === 'Extreme' ? 'bg-red-100 text-red-700' : asset.risk === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{asset.risk}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-red-500 font-medium text-xs uppercase">{asset.criticality}</span>
                    </td>
                  </tr>
                ))}
                {stats.criticalAssetsList.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-500 text-sm">No critical assets at risk.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-4 hover:underline">View all critical assets</button>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-4">Upcoming Maintenance</h3>
          <div className="flex-1 space-y-4">

            {/* Today */}
            {stats.upcomingMaintenance.today.length > 0 && (
              <div>
                <h4 className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase mb-2">Today</h4>
                {stats.upcomingMaintenance.today.map(wo => (
                  <div key={wo.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{wo.asset} - <span className="font-normal text-slate-600 dark:text-slate-400">{wo.title}</span></div>
                      <div className="text-xs text-blue-500 mt-0.5">{wo.id}</div>
                    </div>
                    <span className={`text-xs font-bold ${wo.priority === 'High' ? 'text-red-500' : 'text-orange-500'}`}>{wo.priority}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tomorrow */}
            {stats.upcomingMaintenance.tomorrow.length > 0 && (
              <div>
                <h4 className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase mb-2">Tomorrow</h4>
                {stats.upcomingMaintenance.tomorrow.map(wo => (
                  <div key={wo.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{wo.asset} - <span className="font-normal text-slate-600 dark:text-slate-400">{wo.title}</span></div>
                      <div className="text-xs text-blue-500 mt-0.5">{wo.id}</div>
                    </div>
                    <span className={`text-xs font-bold ${wo.priority === 'High' ? 'text-red-500' : 'text-orange-500'}`}>{wo.priority}</span>
                  </div>
                ))}
              </div>
            )}

            {/* This Week */}
            {stats.upcomingMaintenance.thisWeek.length > 0 && (
              <div>
                <h4 className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase mb-2">This Week</h4>
                {stats.upcomingMaintenance.thisWeek.map(wo => (
                  <div key={wo.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{wo.asset} - <span className="font-normal text-slate-600 dark:text-slate-400">{wo.title}</span></div>
                      <div className="text-xs text-blue-500 mt-0.5">{wo.id}</div>
                    </div>
                    <span className={`text-xs font-bold ${wo.priority === 'High' ? 'text-red-500' : 'text-orange-500'}`}>{wo.priority}</span>
                  </div>
                ))}
              </div>
            )}

            {Object.values(stats.upcomingMaintenance).flat().length === 0 && (
              <p className="text-sm text-slate-500 italic">No upcoming maintenance scheduled.</p>
            )}

          </div>
          <button className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-auto pt-4 hover:underline self-start">View full calendar</button>
        </div>

      </div>

      {/* Row 4: Strategic Objectives (ISO 55001) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold">Strategic Objectives (ISO 55001)</h3>
          <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">View all objectives</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">

          <div className="flex flex-col sm:px-4 py-2 sm:py-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Improve Asset Availability</h4>
            <span className="text-xs text-slate-500 mb-4">Target: &gt;95%</span>
            <div className="flex items-end justify-between mt-auto">
              <span className="text-xs font-bold text-green-600 dark:text-green-500">On Track</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-500">95.2%</span>
            </div>
          </div>

          <div className="flex flex-col sm:px-4 py-2 sm:py-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Reduce Maintenance Cost</h4>
            <span className="text-xs text-slate-500 mb-4">Target: -10%</span>
            <div className="flex items-end justify-between mt-auto">
              <span className="text-xs font-bold text-red-600 dark:text-red-500">At Risk</span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-500">-8.7%</span>
            </div>
          </div>

          <div className="flex flex-col sm:px-4 py-2 sm:py-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Zero Safety Incidents</h4>
            <span className="text-xs text-slate-500 mb-4">Target: 0</span>
            <div className="flex items-end justify-between mt-auto">
              <span className="text-xs font-bold text-green-600 dark:text-green-500">On Track</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-500">0</span>
            </div>
          </div>

          <div className="flex flex-col sm:px-4 py-2 sm:py-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Asset Renewal Plan</h4>
            <span className="text-xs text-slate-500 mb-4">Target: 90%</span>
            <div className="flex items-end justify-between mt-auto">
              <span className="text-xs font-bold text-green-600 dark:text-green-500">On Track</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-500">87%</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
