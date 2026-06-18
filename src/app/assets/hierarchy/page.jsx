'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Recursive filter function for searching the hierarchy tree
function filterTree(nodes, query) {
  if (!query) return nodes;

  return nodes.map(node => {
    const isMatch = node.name.toLowerCase().includes(query.toLowerCase()) ||
      (node.code && node.code.toLowerCase().includes(query.toLowerCase()));

    const filteredChildren = node.children ? filterTree(node.children, query) : [];

    if (isMatch || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
        isMatch // Flag to highlight this node
      };
    }
    return null;
  }).filter(Boolean);
}

const HierarchyNode = ({ node, selectedNode, onSelect, forceExpand, isRoot = false }) => {
  const router = useRouter();
  const isExpandable = node.children && node.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(isRoot || node.type === 'plant');

  useEffect(() => {
    if (forceExpand !== undefined) {
      setIsExpanded(forceExpand);
    }
  }, [forceExpand]);

  const getIcon = (type) => {
    switch (type) {
      case 'root': return <div className="w-5 h-5 bg-slate-800 text-white rounded flex items-center justify-center text-[10px] font-bold" title="Organization">Org</div>;
      case 'plant': return <div className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center text-[10px] font-bold" title="Site / Plant">Site</div>;
      case 'building': return <div className="w-5 h-5 bg-orange-500 text-white rounded flex items-center justify-center text-[10px] font-bold" title="Building">Bldg</div>;
      case 'area': return <div className="w-5 h-5 bg-purple-500 text-white rounded flex items-center justify-center text-[10px] font-bold" title="Area">Area</div>;
      case 'asset': return <div className="w-5 h-5 bg-slate-200 text-slate-700 rounded border border-slate-300 flex items-center justify-center text-[10px] font-bold" title="Asset">Asst</div>;
      case 'component': return <div className="w-5 h-5 bg-slate-500 text-white rounded flex items-center justify-center text-[10px] font-bold" title="Component">Comp</div>;
      default: return <div className="w-5 h-5 bg-slate-200 text-slate-700 rounded border border-slate-300 flex items-center justify-center text-[10px] font-bold">-</div>;
    }
  };

  const isSelected = selectedNode?.id === node.id;

  return (
    <div className="flex flex-col">
      <div
        onClick={() => onSelect(node)}
        className={`flex items-center py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg group transition-colors cursor-pointer ${isSelected
            ? 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500 font-medium'
            : isRoot
              ? 'bg-slate-50 dark:bg-slate-800/50 font-semibold'
              : ''
          }`}
      >
        <div className="flex items-center gap-2 w-full">
          {isExpandable ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {isExpanded ?
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg> :
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              }
            </button>
          ) : (
            <div className="w-5 h-5"></div>
          )}
          {getIcon(node.type)}
          <span className={`text-sm truncate ${node.isMatch
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-800 dark:text-slate-200'
            }`}>
            {node.code ? `${node.code} - ` : ''}{node.name}
          </span>

          {node.type !== 'root' && (
            <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const url = node.type === 'plant'
                    ? `/assets/new?siteId=${node.id}`
                    : `/assets/new?parentId=${node.id}&siteId=${node.siteId}`;
                  router.push(url);
                }}
                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                title="Add child asset/component under this node"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {isExpandable && isExpanded && (
        <div className="ml-6 pl-2 border-l border-slate-200 dark:border-slate-700 mt-1 flex flex-col gap-1">
          {node.children.map((child, idx) => (
            <HierarchyNode
              key={child.id || idx}
              node={child}
              selectedNode={selectedNode}
              onSelect={onSelect}
              forceExpand={forceExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function AssetHierarchyPage() {
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    fetch('/api/assets/hierarchy')
      .then(res => res.json())
      .then(data => {
        setHierarchy(data);
        if (data && data.length > 0) {
          setSelectedNode(data[0]); // Default to organization level
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading asset hierarchy...</div>;
  }

  if (!hierarchy || hierarchy.length === 0) {
    return <div className="p-8 text-center text-red-500">Failed to load asset hierarchy.</div>;
  }

  const handleSelectNode = (node) => {
    setSelectedNode(node);
  };

  // Filter hierarchy tree based on search query
  const filteredHierarchy = searchQuery ? filterTree(hierarchy, searchQuery) : hierarchy;

  // Derive metrics for stats panel
  const statsNode = selectedNode || hierarchy[0];
  const metrics = statsNode.metrics || {
    assetsCount: 0,
    activeWorkOrdersCount: 0,
    avgHealthScore: 100,
    criticalAssetsCount: 0,
    criticalityCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  };

  const totalCrit = (metrics.criticalityCounts.CRITICAL + metrics.criticalityCounts.HIGH + metrics.criticalityCounts.MEDIUM + metrics.criticalityCounts.LOW) || 1;
  const pCritical = Math.round((metrics.criticalityCounts.CRITICAL / totalCrit) * 100);
  const pHigh = Math.round((metrics.criticalityCounts.HIGH / totalCrit) * 100);
  const pMedium = Math.round((metrics.criticalityCounts.MEDIUM / totalCrit) * 100);
  const pLow = Math.round((metrics.criticalityCounts.LOW / totalCrit) * 100);

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Asset Hierarchy</h1>
          <p className="text-xs text-slate-500 mt-0.5">Physical and functional breakdown taxonomy (ISO 14224)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search hierarchy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 block w-64"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <button
            onClick={() => setExpandAll(!expandAll)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left Side: Tree View */}
        <div className="w-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <h3 className="font-medium text-slate-800 dark:text-slate-100">Structure</h3>
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-slate-800 rounded"></div> Organization</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-blue-600 rounded"></div> Site</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-orange-500 rounded"></div> Building</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-purple-500 rounded"></div> Area</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-slate-200 border border-slate-300 rounded"></div> Asset</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-slate-500 rounded"></div> Component</span>
            </div>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            {filteredHierarchy.map(rootNode => (
              <HierarchyNode
                key={rootNode.id}
                node={rootNode}
                selectedNode={selectedNode}
                onSelect={handleSelectNode}
                forceExpand={searchQuery ? true : expandAll ? true : undefined}
                isRoot={true}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Metrics/Summary of selected level */}
        <div className="w-1/2 flex flex-col gap-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">
              {statsNode.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wider font-mono">
              {statsNode.type === 'root' ? 'Top level organizational view' : `Hierarchy level: ${statsNode.type}`}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
                <div className="text-xs text-slate-500 mb-1 font-medium">Assets Count (Rollup)</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{metrics.assetsCount}</div>
              </div>
              <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
                <div className="text-xs text-slate-500 mb-1 font-medium">Critical Assets (Rollup)</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.criticalAssetsCount}</div>
              </div>
              <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
                <div className="text-xs text-slate-500 mb-1 font-medium">Active Work Orders</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{metrics.activeWorkOrdersCount}</div>
              </div>
              <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
                <div className="text-xs text-slate-500 mb-1 font-medium">Avg Health Score</div>
                <div className={`text-2xl font-bold ${metrics.avgHealthScore >= 90 ? 'text-green-600 dark:text-green-400' :
                    metrics.avgHealthScore >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                  }`}>{metrics.avgHealthScore}%</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 flex-1">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-6">Assets Criticality Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 text-xs font-semibold uppercase tracking-wide">Critical</div>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${pCritical}%` }}></div>
                </div>
                <div className="w-12 text-right text-xs text-slate-500 font-bold">{pCritical}%</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 text-xs font-semibold uppercase tracking-wide">High</div>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${pHigh}%` }}></div>
                </div>
                <div className="w-12 text-right text-xs text-slate-500 font-bold">{pHigh}%</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 text-xs font-semibold uppercase tracking-wide">Medium</div>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full transition-all duration-500" style={{ width: `${pMedium}%` }}></div>
                </div>
                <div className="w-12 text-right text-xs text-slate-500 font-bold">{pMedium}%</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 text-xs font-semibold uppercase tracking-wide">Low</div>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pLow}%` }}></div>
                </div>
                <div className="w-12 text-right text-xs text-slate-500 font-bold">{pLow}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
