'use client';

import { useState, useEffect } from 'react';
import { useDataTable } from '../../hooks/useDataTable';
import Pagination from '../../components/ui/Pagination';
import SortableHeader from '../../components/ui/SortableHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

function TrendChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="h-48 flex items-end justify-between relative px-4 w-full">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
         <polyline 
           points={data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.downtime > 100 ? 100 : d.downtime)}`).join(' ')} 
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
  const { data: failureEvents, total, loading, page, limit, setPage, handleSort, handleSearch, refresh, sortBy, sortOrder } = useDataTable({ endpoint: '/api/failures', initialSortBy: 'occurredAt' });
  const [aggregates, setAggregates] = useState({ mtbf: 0, mttr: 0, availability: 0, reliability: 0, downtimeTrend: [], failureFrequency: [] });
  const [assets, setAssets] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    assetId: '', description: '', downtimeHours: 0, occurredAt: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(aData => setAssets(aData.data || aData))
      .catch(console.error);
    
    fetchAggregates();
  }, []);

  const fetchAggregates = async () => {
    try {
      const res = await fetch('/api/reliability');
      const data = await res.json();
      if (data.aggregates) {
        setAggregates(data.aggregates);
      }
    } catch (err) {
      console.error('Error fetching aggregates:', err);
    }
  };

  const openLogFailureModal = () => {
    setFormData({ assetId: assets[0]?.id || '', description: '', downtimeHours: 0, occurredAt: new Date().toISOString().slice(0, 16) });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      const res = await fetch(`/api/failures/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        fetchAggregates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/failures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        refresh();
        fetchAggregates();
      } else {
        alert('Failed to log failure event');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && failureEvents.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading reliability dashboard...</div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Reliability Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              onChange={handleSearch}
              placeholder="Search failures..." 
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 block w-64"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <button onClick={openLogFailureModal} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Log Failure Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">MTBF (Calculated)</h3>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{aggregates.mtbf} hrs</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">MTTR (Calculated)</h3>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{aggregates.mttr} hrs</div>
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
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (freq.count / 10) * 100)}%` }}></div>
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
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Failure Event Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Asset</th>
                <th scope="col" className="px-6 py-4 font-medium">Description</th>
                <SortableHeader label="Occurred At" columnKey="occurredAt" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Downtime (Hrs)" columnKey="downtimeHours" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} className="text-right" />
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {failureEvents.map((item, index) => (
                <tr key={item.id} className={`border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${index === failureEvents.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.assetCode} - {item.assetName}</td>
                  <td className="px-6 py-4">{item.description}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(item.occurredAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-medium text-red-500">{item.downtimeHours}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 dark:text-red-400 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {failureEvents.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No failure logs found. System running optimally.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} limit={limit} total={total} setPage={setPage} />
      </div>

      {/* Slide-out Modal for Log Failure */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-500 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Log Failure Event
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Select
                label="Failed Asset"
                required
                value={formData.assetId}
                onChange={e => setFormData({...formData, assetId: e.target.value})}
              >
                <option value="" disabled>Select Asset</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </Select>

              <Input
                label="Description / Issue"
                required
                type="text"
                placeholder="What failed?"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Occurred At"
                  required
                  type="datetime-local"
                  value={formData.occurredAt}
                  onChange={e => setFormData({...formData, occurredAt: e.target.value})}
                />
                <Input
                  label="Downtime (Hours)"
                  required
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.downtimeHours}
                  onChange={e => setFormData({...formData, downtimeHours: e.target.value})}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Submit Failure Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
