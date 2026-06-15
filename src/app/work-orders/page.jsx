'use client';

import { useState, useEffect } from 'react';
import { useDataTable } from '../../hooks/useDataTable';
import Pagination from '../../components/ui/Pagination';
import SortableHeader from '../../components/ui/SortableHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

// Kanban Column Component
function KanbanColumn({ title, count, colorClass, borderClass, targetStatus, onDropCard, children }) {
  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const woId = e.dataTransfer.getData('woId');
    if (woId && targetStatus) {
      onDropCard(woId, targetStatus);
    }
  };

  return (
    <div 
      className={`flex flex-col w-80 shrink-0 transition-colors duration-200 rounded-lg pb-2`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={`flex items-center justify-between p-3 mb-3 bg-white dark:bg-slate-900 border-t-4 ${borderClass} border-x border-b border-slate-200 dark:border-slate-800 rounded-lg shadow-sm`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded-full">{count}</span>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto pb-4 h-[calc(100vh-280px)] min-h-[100px]">
        {children}
      </div>
    </div>
  );
}

// Kanban Card Component
function KanbanCard({ wo, onEdit, onDelete }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('woId', wo.dbId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{wo.id}</span>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${wo.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            wo.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
              wo.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}>
          {wo.priority}
        </span>
      </div>
      <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-1 leading-snug">{wo.title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{wo.asset}</p>

      <div className="flex items-center justify-between mt-auto">
        {wo.assignee ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
              {wo.assignee.split(' ').map(n => n[0]).join('')}
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-300">{wo.assignee}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Unassigned</span>
        )}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(wo)} className="text-blue-500 hover:text-blue-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
          <button onClick={() => onDelete(wo.dbId)} className="text-red-500 hover:text-red-600">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkOrdersPage() {
  const { data: flatOrders, total, loading: tableLoading, page, limit, setPage, handleSort, handleSearch, refresh, sortBy, sortOrder } = useDataTable({ endpoint: '/api/work-orders', initialSortBy: 'createdAt' });
  const [workOrders, setWorkOrders] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // View Toggle State
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({
    dbId: '', title: '', description: '', status: 'DRAFT', priority: 'MEDIUM', assetId: ''
  });

  const fetchKanbanData = async () => {
    setLoading(true);
    try {
      const [woRes, assetsRes] = await Promise.all([
        fetch('/api/work-orders?kanban=true'),
        fetch('/api/assets')
      ]);
      setWorkOrders(await woRes.json());
      setAssets((await assetsRes.json()).data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKanbanData();
  }, []);

  const handleDropCard = async (woId, newStatus) => {
    // Optimistic update could go here, but for simplicity we fetch after PUT
    const targetOrder = flatOrders.find(wo => wo.dbId === woId);
    if (!targetOrder || targetOrder.rawStatus === newStatus) return;

    try {
      // Reconstruct full form data to send
      const updateData = {
        title: targetOrder.title,
        description: targetOrder.description || '',
        status: newStatus,
        priority: targetOrder.rawPriority,
        assetId: targetOrder.assetId
      };

      const res = await fetch(`/api/work-orders/${woId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        fetchKanbanData();
        refresh();
      } else {
        const errorData = await res.json();
        alert(`Failed to move Work Order: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error dragging card:', err);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ dbId: '', title: '', description: '', status: 'DRAFT', priority: 'MEDIUM', assetId: assets[0]?.id || '' });
    setIsModalOpen(true);
  };

  const openEditModal = (wo) => {
    setModalMode('edit');
    setFormData({
      dbId: wo.dbId,
      title: wo.title,
      description: wo.description || '',
      status: wo.rawStatus,
      priority: wo.rawPriority,
      assetId: wo.assetId
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this work order?')) return;
    try {
      const res = await fetch(`/api/work-orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchKanbanData();
        refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = modalMode === 'add' ? '/api/work-orders' : `/api/work-orders/${formData.dbId}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchKanbanData();
        refresh();
      } else {
        alert('Failed to save Work Order');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !workOrders) {
    return <div className="p-8 text-center text-slate-500">Loading work orders...</div>;
  }

  if (!workOrders) {
    return <div className="p-8 text-center text-red-500">Failed to load work orders.</div>;
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Work Orders</h1>
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Kanban
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Table
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              onChange={handleSearch}
              placeholder="Search tasks..."
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 block w-64"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Create Task
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
          <KanbanColumn title="Draft" count={workOrders.draft.length} borderClass="border-t-slate-400" colorClass="bg-slate-400" targetStatus="DRAFT" onDropCard={handleDropCard}>
            {workOrders.draft.map(wo => <KanbanCard key={wo.id} wo={wo} onEdit={openEditModal} onDelete={handleDelete} />)}
          </KanbanColumn>

          <KanbanColumn title="Assigned" count={workOrders.assigned.length} borderClass="border-t-blue-400" colorClass="bg-blue-400" targetStatus="ASSIGNED" onDropCard={handleDropCard}>
            {workOrders.assigned.map(wo => <KanbanCard key={wo.id} wo={wo} onEdit={openEditModal} onDelete={handleDelete} />)}
          </KanbanColumn>

          <KanbanColumn title="In Progress" count={workOrders.inProgress.length} borderClass="border-t-orange-400" colorClass="bg-orange-400" targetStatus="IN_PROGRESS" onDropCard={handleDropCard}>
            {workOrders.inProgress.map(wo => <KanbanCard key={wo.id} wo={wo} onEdit={openEditModal} onDelete={handleDelete} />)}
          </KanbanColumn>

          <KanbanColumn title="Waiting Parts" count={workOrders.waitingParts.length} borderClass="border-t-purple-500" colorClass="bg-purple-500" targetStatus="APPROVED" onDropCard={handleDropCard}>
            {workOrders.waitingParts.map(wo => <KanbanCard key={wo.id} wo={wo} onEdit={openEditModal} onDelete={handleDelete} />)}
          </KanbanColumn>

          <KanbanColumn title="Completed" count={workOrders.completed.length} borderClass="border-t-green-500" colorClass="bg-green-500" targetStatus="COMPLETED" onDropCard={handleDropCard}>
            {workOrders.completed.map(wo => <KanbanCard key={wo.id} wo={wo} onEdit={openEditModal} onDelete={handleDelete} />)}
          </KanbanColumn>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <SortableHeader label="WO ID" columnKey="id" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                  <SortableHeader label="Title" columnKey="title" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                  <th scope="col" className="px-6 py-4 font-medium">Asset</th>
                  <SortableHeader label="Status" columnKey="status" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                  <SortableHeader label="Priority" columnKey="priority" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                  <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flatOrders.map((wo, index) => (
                  <tr key={wo.id} className={`border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${index === flatOrders.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{wo.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{wo.title}</td>
                    <td className="px-6 py-4">{wo.asset}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {wo.rawStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${wo.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        wo.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          wo.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditModal(wo)} className="text-blue-600 dark:text-blue-400 hover:underline mr-3 text-sm">Edit</button>
                      <button onClick={() => handleDelete(wo.dbId)} className="text-red-600 dark:text-red-400 hover:underline text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
                {flatOrders.length === 0 && !tableLoading && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No work orders found.</td>
                  </tr>
                )}
                {tableLoading && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 animate-pulse">Loading work orders...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} limit={limit} total={total} setPage={setPage} />
        </div>
      )}

      {/* Slide-out Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {modalMode === 'add' ? 'Create Work Order' : 'Edit Work Order'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Title"
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Fix HVAC"
              />
              <Select
                label="Asset"
                required
                value={formData.assetId}
                onChange={e => setFormData({...formData, assetId: e.target.value})}
              >
                <option value="" disabled>Select Asset</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </Select>
              <Select
                label="Status"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="DRAFT">Draft</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="APPROVED">Waiting Parts (Approved)</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
              </Select>
              <Select
                label="Priority"
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </Select>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  {modalMode === 'add' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
