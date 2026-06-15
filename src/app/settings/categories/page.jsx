'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDataTable } from '../../../hooks/useDataTable';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';

export default function CategoriesPage() {
  const { data, total, loading, page, limit, setPage, handleSort, handleSearch, refresh, sortBy, sortOrder } = useDataTable({ endpoint: '/api/settings/categories', initialSortBy: 'name' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({ id: '', name: '', description: '' });

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: '', name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setFormData({ id: item.id, name: item.name, description: item.description || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/settings/categories/${id}`, { method: 'DELETE' });
      if (res.ok) refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = modalMode === 'add' ? '/api/settings/categories' : `/api/settings/categories/${formData.id}`;
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Asset Categories</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              onChange={handleSearch}
              placeholder="Search categories..."
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 block w-64"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Add Category
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <SortableHeader label="Name" columnKey="name" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Description" columnKey="description" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="px-6 py-4">{item.description}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(item)} className="text-blue-600 dark:text-blue-400 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 dark:text-red-400 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && !loading && (
                <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">No categories found.</td></tr>
              )}
              {loading && (
                <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500 animate-pulse">Loading categories...</td></tr>
              )}
            </tbody>
          </table>
        <Pagination page={page} limit={limit} total={total} setPage={setPage} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {modalMode === 'add' ? 'Add Category' : 'Edit Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Category Name"
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. HVAC"
              />
              <Textarea
                label="Description"
                rows="3"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Optional details..."
              />

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {modalMode === 'add' ? 'Save' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
