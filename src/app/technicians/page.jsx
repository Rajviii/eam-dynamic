'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDataTable } from '../../hooks/useDataTable';
import Pagination from '../../components/ui/Pagination';
import SortableHeader from '../../components/ui/SortableHeader';
import Input from '../../components/ui/Input';
import Dropdown from '../../components/ui/Dropdown';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';

export default function TechniciansPage() {
  const { data: technicians, total, loading, page, limit, setPage, handleSort, handleSearch, refresh, sortBy, sortOrder } = useDataTable({ endpoint: '/api/technicians', initialSortBy: 'name' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({
    id: '', technicianCode: '', employeeNumber: '', name: '', role: '', email: '', phone: '', skills: '', status: 'Active'
  });

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: '', technicianCode: '', employeeNumber: '', name: '', role: '', email: '', phone: '', skills: '', status: 'Active' });
    setIsModalOpen(true);
  };

  const openEditModal = (tech) => {
    setModalMode('edit');
    setFormData({ ...tech });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this technician?')) return;
    try {
      const res = await fetch(`/api/technicians/${id}`, { method: 'DELETE' });
      if (res.ok) refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = modalMode === 'add' ? '/api/technicians' : `/api/technicians/${formData.id}`;
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
        const err = await res.json();
        alert(err.error || 'Failed to save technician');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Technicians & Resources</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              onChange={handleSearch}
              placeholder="Search technicians..."
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 block w-64"
            />
          </div>
          <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Plus size={16} />
            Add Technician
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 sticky top-0">
              <tr>
                <SortableHeader label="Tech ID" columnKey="technicianCode" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Name" columnKey="name" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <SortableHeader label="Role" columnKey="role" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <th scope="col" className="px-6 py-4 font-medium">Contact</th>
                <SortableHeader label="Status" columnKey="status" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech, index) => (
                <tr key={tech.id} className={`border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${index === technicians.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{tech.technicianCode}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {tech.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                      </div>
                      <Link href={`/technicians/${tech.id}`} className="hover:underline hover:text-blue-600">{tech.name}</Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">{tech.role}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{tech.email}</span>
                      {tech.phone && <span className="text-xs text-slate-400">{tech.phone}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      tech.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      tech.status === 'On Leave' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {tech.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <Link href={`/technicians/${tech.id}`} className="text-slate-400 hover:text-blue-600 transition-colors" title="View Workload">
                      <Eye size={18} />
                    </Link>
                    <button onClick={() => openEditModal(tech)} className="text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(tech.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {technicians.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No technicians found.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 animate-pulse">Loading technicians...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} limit={limit} total={total} setPage={setPage} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {modalMode === 'add' ? 'Add Technician' : 'Edit Technician'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                <Input label="Email" required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. john@example.com" />
                <Dropdown label="Role / Trade" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="Mechanical Technician">Mechanical Technician</option>
                  <option value="Electrical Technician">Electrical Technician</option>
                  <option value="HVAC Technician">HVAC Technician</option>
                  <option value="Instrumentation Technician">Instrumentation Technician</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Maintenance Manager">Maintenance Manager</option>
                </Dropdown>
                <Dropdown label="Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </Dropdown>
                <Input label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
                <Input label="Employee Number" value={formData.employeeNumber} onChange={e => setFormData({...formData, employeeNumber: e.target.value})} placeholder="EMP-001" />
                <div className="col-span-2">
                  <Input label="Skills & Certifications" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="e.g. Forklift License, OSHA 30, High Voltage" />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {modalMode === 'add' ? 'Save Technician' : 'Update Technician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
