'use client';

import { useState, useEffect } from 'react';
import { useDataTable } from '../../hooks/useDataTable';
import Pagination from '../../components/ui/Pagination';
import SortableHeader from '../../components/ui/SortableHeader';

export default function AssetsPage() {
  const { data: assets, total, loading, page, limit, setPage, handleSort, handleSearch, refresh, sortBy, sortOrder } = useDataTable({ endpoint: '/api/assets', initialSortBy: 'code' });
  const [categories, setCategories] = useState([]);
  const [sites, setSites] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    id: '', code: '', name: '', status: 'OPERATIONAL', lifecycleStage: 'ACTIVE', criticalityScore: 3, categoryId: '', siteId: ''
  });

  useEffect(() => {
    Promise.all([fetch('/api/settings/categories'), fetch('/api/settings/sites')])
      .then(async ([catRes, siteRes]) => {
        setCategories((await catRes.json()).data || []);
        setSites((await siteRes.json()).data || []);
      }).catch(console.error);
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: '', code: '', name: '', status: 'OPERATIONAL', lifecycleStage: 'ACTIVE', criticalityScore: 3, categoryId: categories[0]?.id || '', siteId: sites[0]?.id || '' });
    setIsModalOpen(true);
  };

  const openEditModal = (asset) => {
    setModalMode('edit');
    setFormData({
      id: asset.id,
      code: asset.code,
      name: asset.name,
      status: asset.rawStatus || 'OPERATIONAL',
      lifecycleStage: asset.lifecycleStage || 'ACTIVE',
      criticalityScore: asset.criticalityScore || 3,
      categoryId: asset.categoryId || '',
      siteId: asset.siteId || ''
    });
    setIsModalOpen(true);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = modalMode === 'add' ? '/api/assets' : `/api/assets/${formData.id}`;
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
        const errorData = await res.json();
        alert('Failed to save asset: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error saving asset');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading && assets.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading assets...</div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Assets</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              onChange={handleSearch}
              placeholder="Search assets..." 
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 block w-64"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Asset
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <SortableHeader label="Asset ID" columnKey="code" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Name" columnKey="name" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <th scope="col" className="px-6 py-4 font-medium">Category</th>
                <th scope="col" className="px-6 py-4 font-medium">Location</th>
                <th scope="col" className="px-6 py-4 font-medium">Health Score</th>
                <SortableHeader label="Criticality" columnKey="criticalityScore" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Status" columnKey="status" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => (
                <tr key={asset.id} className={`border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${index === assets.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{asset.code}</td>
                  <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">{asset.name}</td>
                  <td className="px-6 py-4">{asset.category}</td>
                  <td className="px-6 py-4">{asset.location}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      asset.healthScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      asset.healthScore >= 60 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {asset.healthScore}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      asset.criticality === 'Critical' ? 'text-red-600 dark:text-red-400' :
                      asset.criticality === 'High' ? 'text-orange-600 dark:text-orange-400' :
                      asset.criticality === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {asset.criticality}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      asset.status === 'Operational' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      asset.status === 'Maintenance' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      asset.status === 'Degraded' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(asset)} className="text-blue-600 dark:text-blue-400 hover:underline mr-3 text-sm">Edit</button>
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

      {/* Slide-out Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {modalMode === 'add' ? 'Add New Asset' : 'Edit Asset'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asset Code</label>
                <input required type="text" name="code" value={formData.code} onChange={handleChange} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. GEN-101" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Asset Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Primary Generator" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location (Site)</label>
                <select required name="siteId" value={formData.siteId} onChange={handleChange} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="">-- Select Location --</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="OPERATIONAL">Operational</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="DEGRADED">Degraded</option>
                  <option value="DECOMMISSIONED">Decommissioned</option>
                  <option value="IN_STORAGE">In Storage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lifecycle Stage</label>
                <select name="lifecycleStage" value={formData.lifecycleStage} onChange={handleChange} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="PROCUREMENT">Procurement</option>
                  <option value="COMMISSIONED">Commissioned</option>
                  <option value="ACTIVE">Active</option>
                  <option value="END_OF_LIFE">End of Life</option>
                  <option value="DISPOSED">Disposed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Criticality Score (1-5)</label>
                <input required type="number" min="1" max="5" name="criticalityScore" value={formData.criticalityScore} onChange={handleChange} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {modalMode === 'add' ? 'Create Asset' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
