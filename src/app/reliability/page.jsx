'use client';

import { useState, useEffect } from 'react';
import { useDataTable } from '../../hooks/useDataTable';
import Pagination from '../../components/ui/Pagination';
import SortableHeader from '../../components/ui/SortableHeader';

function TrendChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="h-48 flex items-end justify-between relative px-4 w-full">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
         <polyline 
           points={data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - d.downtime}`).join(' ')} 
           fill="none" 
           stroke="#3b82f6" 
           strokeWidth="2" 
         />
      </svg>
      {data.map((d, i) => (
        <span key={i} className="text-xs text-slate-500 z-10 translate-y-6">{d.month}</span>
      ))}
    </div>
  );
}

export default function ReliabilityPage() {
  const { data: rawMetrics, total, loading, page, limit, setPage, handleSort, handleSearch, refresh, sortBy, sortOrder, rawJson } = useDataTable({ endpoint: '/api/reliability', initialSortBy: 'recordedAt' });
  const [assets, setAssets] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({
    id: '', assetId: '', mtbf: 0, mttr: 0, availability: 0, downtime: 0
  });

  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(aData => setAssets(aData.data || aData))
      .catch(console.error);
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: '', assetId: assets[0]?.id || '', mtbf: 0, mttr: 0, availability: 100, downtime: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (metric) => {
    setModalMode('edit');
    setFormData({
      id: metric.id,
      assetId: metric.assetId,
      mtbf: metric.mtbf,
      mttr: metric.mttr,
      availability: metric.availability,
      downtime: metric.downtime
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`/api/reliability/${id}`, { method: 'DELETE' });
      if (res.ok) refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = modalMode === 'add' ? '/api/reliability' : `/api/reliability/${formData.id}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        refresh();
      } else {
        alert('Failed to save metric');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && (!rawJson || rawMetrics.length === 0)) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading reliability metrics...</div>;
  }

  const aggregates = rawJson?.aggregates || {
    mtbf: 0, mttr: 0, availability: 0, reliability: 0, downtimeTrend: [], failureFrequency: []
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Reliability Metrics</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              onChange={handleSearch}
              placeholder="Search metrics..." 
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 block w-64"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <select className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg p-2 w-48">
            <option>Past 30 Days</option>
            <option>Past 90 Days</option>
            <option>Year to Date</option>
          </select>
          <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Log Metric
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">MTBF (Avg Hours)</h3>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{aggregates.mtbf}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">MTTR (Avg Hours)</h3>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{aggregates.mttr}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Availability</h3>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{aggregates.availability}%</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">System Reliability</h3>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{aggregates.reliability}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-8">Downtime Trend (Hours)</h3>
          <div className="pb-6">
            <TrendChart data={aggregates.downtimeTrend} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-4">Highest Failure Frequency</h3>
          <div className="space-y-4">
            {aggregates.failureFrequency.map((freq, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{freq.asset}</span>
                <div className="flex items-center gap-3 w-1/2">
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${(freq.count / 15) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-bold text-slate-500 w-8">{freq.count}</span>
                </div>
              </div>
            ))}
            {aggregates.failureFrequency.length === 0 && (
              <p className="text-slate-500 italic">No failure data available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Raw Data Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Asset Name</th>
                <SortableHeader label="MTBF" columnKey="mtbf" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} className="text-right" />
                <SortableHeader label="MTTR" columnKey="mttr" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} className="text-right" />
                <SortableHeader label="Availability %" columnKey="availability" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} className="text-right" />
                <SortableHeader label="Downtime (Hrs)" columnKey="downtime" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} className="text-right" />
                <SortableHeader label="Recorded At" columnKey="recordedAt" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} className="text-right" />
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rawMetrics.map((item, index) => (
                <tr key={item.id} className={`border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${index === rawMetrics.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.assetName}</td>
                  <td className="px-6 py-4 text-right">{item.mtbf}</td>
                  <td className="px-6 py-4 text-right">{item.mttr}</td>
                  <td className="px-6 py-4 text-right font-medium text-green-600 dark:text-green-400">{item.availability}%</td>
                  <td className="px-6 py-4 text-right text-red-500">{item.downtime}</td>
                  <td className="px-6 py-4 text-right text-slate-500">{new Date(item.recordedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(item)} className="text-blue-600 dark:text-blue-400 hover:underline mr-3 text-sm">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 dark:text-red-400 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {rawMetrics.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">No raw records found. Click 'Log Metric' to create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} limit={limit} total={total} setPage={setPage} />
      </div>

      {/* Slide-out Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {modalMode === 'add' ? 'Log Metric' : 'Edit Metric'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Asset</label>
                <select required value={formData.assetId} onChange={e => setFormData({...formData, assetId: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="" disabled>Select Asset</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">MTBF (Hours)</label>
                  <input required type="number" step="0.1" min="0" value={formData.mtbf} onChange={e => setFormData({...formData, mtbf: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">MTTR (Hours)</label>
                  <input required type="number" step="0.1" min="0" value={formData.mttr} onChange={e => setFormData({...formData, mttr: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Availability (%)</label>
                  <input required type="number" step="0.1" min="0" max="100" value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Downtime (Hours)</label>
                  <input required type="number" step="0.1" min="0" value={formData.downtime} onChange={e => setFormData({...formData, downtime: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {modalMode === 'add' ? 'Log Metric' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
