'use client';

import { useState, useEffect } from 'react';

const HierarchyNode = ({ node, isRoot = false }) => {
  const isExpandable = node.children && node.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(isRoot || node.type === 'plant');

  const getIcon = (type) => {
    switch(type) {
      case 'root': return <div className="w-5 h-5 bg-slate-800 text-white rounded flex items-center justify-center text-[10px] font-bold">O</div>;
      case 'plant': return <div className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center text-[10px] font-bold">P</div>;
      case 'line': return <div className="w-5 h-5 bg-orange-500 text-white rounded flex items-center justify-center text-[10px] font-bold">L</div>;
      case 'system': return <div className="w-5 h-5 bg-purple-500 text-white rounded flex items-center justify-center text-[10px] font-bold">S</div>;
      case 'subsystem': return <div className="w-5 h-5 bg-teal-500 text-white rounded flex items-center justify-center text-[10px] font-bold">SS</div>;
      case 'asset': return <div className="w-5 h-5 bg-slate-200 text-slate-700 rounded border border-slate-300 flex items-center justify-center text-[10px] font-bold">A</div>;
      default: return <div className="w-5 h-5 bg-slate-200 text-slate-700 rounded border border-slate-300 flex items-center justify-center text-[10px] font-bold">-</div>;
    }
  };

  return (
    <div className="flex flex-col">
      <div className={`flex items-center py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group transition-colors ${isRoot ? 'bg-slate-50 dark:bg-slate-800/50 font-semibold' : ''}`}>
        <div className="flex items-center gap-2 w-full">
          {isExpandable ? (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
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
          <span className={`text-sm text-slate-800 dark:text-slate-200 truncate ${node.type === 'asset' ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400 cursor-pointer' : ''}`}>
            {node.id !== node.name && node.id.includes('-') ? `${node.id} - ` : ''}{node.name}
          </span>
          
          <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg></button>
          </div>
        </div>
      </div>
      
      {isExpandable && isExpanded && (
        <div className="ml-6 pl-2 border-l border-slate-200 dark:border-slate-700 mt-1 flex flex-col gap-1">
          {node.children.map((child, idx) => (
            <HierarchyNode key={child.id || idx} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function AssetHierarchyPage() {
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/assets/hierarchy')
      .then(res => res.json())
      .then(data => {
        setHierarchy(data);
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

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Asset Hierarchy</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search hierarchy..." 
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 block w-64"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <button className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Expand All
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left Side: Tree View */}
        <div className="w-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <h3 className="font-medium text-slate-800 dark:text-slate-100">Structure</h3>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-600 rounded"></div> Plant</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded"></div> System</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded"></div> Asset</span>
            </div>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            {hierarchy.map(rootNode => (
              <HierarchyNode key={rootNode.id} node={rootNode} isRoot={true} />
            ))}
          </div>
        </div>

        {/* Right Side: Metrics/Summary of selected level */}
        <div className="w-1/2 flex flex-col gap-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">ABC Manufacturing (All Sites)</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Top level organizational view</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
                <div className="text-sm text-slate-500 mb-1">Total Assets</div>
                <div className="text-2xl font-bold">1,248</div>
              </div>
              <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
                <div className="text-sm text-slate-500 mb-1">Critical Assets</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">48</div>
              </div>
              <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
                <div className="text-sm text-slate-500 mb-1">Active Work Orders</div>
                <div className="text-2xl font-bold">156</div>
              </div>
              <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30">
                <div className="text-sm text-slate-500 mb-1">Avg Health Score</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">82</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 flex-1">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-6">Assets by Criticality</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium">Critical</div>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <div className="w-8 text-right text-sm text-slate-500">15%</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium">High</div>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <div className="w-8 text-right text-sm text-slate-500">25%</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium">Medium</div>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <div className="w-8 text-right text-sm text-slate-500">40%</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium">Low</div>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <div className="w-8 text-right text-sm text-slate-500">20%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
