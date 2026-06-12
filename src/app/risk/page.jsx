'use client';

import { useState, useEffect } from 'react';
import { useDataTable } from '../../hooks/useDataTable';
import Pagination from '../../components/ui/Pagination';
import SortableHeader from '../../components/ui/SortableHeader';

export default function RiskRegisterPage() {
  const { data: risks, total, loading, page, limit, setPage, handleSort, handleSearch, refresh, sortBy, sortOrder } = useDataTable({ endpoint: '/api/risk', initialSortBy: 'id' });
  const [assets, setAssets] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({
    dbId: '', risk: '', likelihood: 1, consequence: 1, assetId: ''
  });

  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(aData => setAssets(aData.data || aData))
      .catch(console.error);
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ dbId: '', risk: '', likelihood: 1, consequence: 1, assetId: assets[0]?.id || '' });
    setIsModalOpen(true);
  };

  const openEditModal = (r) => {
    setModalMode('edit');
    setFormData({
      dbId: r.dbId,
      risk: r.risk,
      likelihood: r.likelihood,
      consequence: r.consequence,
      assetId: r.assetId
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this risk assessment?')) return;
    try {
      const res = await fetch(`/api/risk/${id}`, { method: 'DELETE' });
      if (res.ok) refresh();
      else alert('Failed to delete risk');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = modalMode === 'add' ? '/api/risk' : `/api/risk/${formData.dbId}`;
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
        alert('Failed to save risk assessment');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && risks.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading risk register...</div>;
  }

  // Calculate metrics
  const avgRiskScore = risks.length > 0 ? (risks.reduce((acc, r) => acc + (r.likelihood * r.consequence), 0) / risks.length).toFixed(1) : 0;
  const criticalRisks = risks.filter(r => (r.likelihood * r.consequence) >= 20).length;
  const highRisks = risks.filter(r => {
    const s = r.likelihood * r.consequence;
    return s >= 12 && s < 20;
  }).length;
  const mitigationsActive = risks.filter(r => r.status === 'Mitigating').length; // Mock metric based on original UI design

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Risk Register</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              onChange={handleSearch}
              placeholder="Search risks..." 
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 block w-64"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <button onClick={openAddModal} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Log New Risk
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Average Risk Score</h3>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">{avgRiskScore}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Critical Risks (&ge;20)</h3>
          <div className="text-2xl font-bold text-red-600 dark:text-red-500 mt-2">{criticalRisks}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">High Risks (12-19)</h3>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-500 mt-2">{highRisks}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Mitigations Active</h3>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-500 mt-2">{mitigationsActive}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <SortableHeader label="Risk ID" columnKey="id" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Identified Risk / Mitigation Plan" columnKey="risk" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Likelihood (1-5)" columnKey="likelihood" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} className="text-center" />
                <SortableHeader label="Consequence (1-5)" columnKey="consequence" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} className="text-center" />
                <th scope="col" className="px-6 py-4 font-medium text-center">Risk Score</th>
                <SortableHeader label="Status" columnKey="status" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((item, index) => (
                <tr key={item.id} className={`border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${index === risks.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.id}</td>
                  <td className="px-6 py-4 font-medium">
                    <span className="block text-slate-800 dark:text-slate-200">{item.risk}</span>
                    <span className="block text-xs text-slate-500 mt-1">Asset: {item.assetName}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{item.likelihood}</td>
                  <td className="px-6 py-4 text-center font-medium">{item.consequence}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.riskScore === 'Extreme' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800' :
                      item.riskScore === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800' :
                      item.riskScore === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800' :
                      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800'
                    }`}>
                      {item.likelihood * item.consequence} ({item.riskScore})
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium ${
                      item.status === 'Open' ? 'text-red-600 dark:text-red-400' :
                      item.status === 'Mitigating' ? 'text-orange-600 dark:text-orange-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      • {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(item)} className="text-blue-600 dark:text-blue-400 hover:underline mr-3 text-sm">Edit</button>
                    <button onClick={() => handleDelete(item.dbId)} className="text-red-600 dark:text-red-400 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {risks.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">No risks found. Click 'Log New Risk' to add one.</td>
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
                {modalMode === 'add' ? 'Log New Risk' : 'Edit Risk'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asset at Risk</label>
                <select required value={formData.assetId} onChange={e => setFormData({...formData, assetId: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="" disabled>Select Asset</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Identified Risk / Mitigation</label>
                <textarea required rows="3" value={formData.risk} onChange={e => setFormData({...formData, risk: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Describe the risk and mitigation plan..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Likelihood (1-5)</label>
                  <input required type="number" min="1" max="5" value={formData.likelihood} onChange={e => setFormData({...formData, likelihood: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Consequence (1-5)</label>
                  <input required type="number" min="1" max="5" value={formData.consequence} onChange={e => setFormData({...formData, consequence: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {modalMode === 'add' ? 'Log Risk' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
