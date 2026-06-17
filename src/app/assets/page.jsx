'use client';

import { useDataTable } from '../../hooks/useDataTable';
import Pagination from '../../components/ui/Pagination';
import SortableHeader from '../../components/ui/SortableHeader';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AssetsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const criticality = searchParams.get('criticality') || '';

  const endpoint = criticality
    ? `/api/assets?criticality=${encodeURIComponent(criticality)}`
    : '/api/assets';

  const { data: assets, total, loading, page, limit, setPage, handleSort, handleSearch, refresh, sortBy, sortOrder } = useDataTable({ 
    endpoint, 
    initialSortBy: 'code' 
  });

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
      } else {
        alert('Failed to delete asset');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting asset');
    }
  };

  if (loading && assets.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading assets...</div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Assets</h1>
            {criticality && (
              <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                {criticality} Only
                <button 
                  onClick={() => router.push('/assets')} 
                  className="hover:text-red-950 dark:hover:text-red-200 font-bold ml-1 text-sm leading-none focus:outline-none"
                  title="Clear Filter"
                >
                  &times;
                </button>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage all your equipment and facilities</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Search assets..."
              onChange={handleSearch}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-slate-900 dark:text-white"
            />
          </div>
          <button 
            onClick={() => router.push('/assets/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Asset
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <SortableHeader label="Asset ID" columnKey="code" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Name" columnKey="name" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Category" columnKey="category" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Location" columnKey="site" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Health Score" columnKey="healthScore" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Criticality" columnKey="criticality" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Status" columnKey="status" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">
                    <button onClick={() => router.push(`/assets/${asset.id}`)} className="hover:underline">
                      {asset.code}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{asset.name}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{asset.category}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{asset.site}</td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${
                      asset.healthScore >= 90 ? 'text-green-600 dark:text-green-400' :
                      asset.healthScore >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                      asset.healthScore >= 50 ? 'text-orange-600 dark:text-orange-400' :
                      asset.healthScore !== 'N/A' ? 'text-red-600 dark:text-red-400' : 'text-slate-400'
                    }`}>
                      {asset.healthScore}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      asset.criticality === 'CRITICAL' ? 'text-red-600 dark:text-red-400' :
                      asset.criticality === 'HIGH' ? 'text-orange-600 dark:text-orange-400' :
                      asset.criticality === 'MEDIUM' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {asset.criticality}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      asset.status === 'OPERATIONAL' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      asset.status === 'UNDER_MAINTENANCE' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      asset.status === 'DEGRADED' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {asset.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => router.push(`/assets/${asset.id}`)} className="text-blue-600 dark:text-blue-400 hover:underline mr-3 text-sm">Edit</button>
                    <button onClick={() => handleDelete(asset.id)} className="text-red-600 dark:text-red-400 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">No assets found. Click 'Add Asset' to create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} limit={limit} total={total} setPage={setPage} />
      </div>
    </div>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">Loading assets...</div>}>
      <AssetsList />
    </Suspense>
  );
}
