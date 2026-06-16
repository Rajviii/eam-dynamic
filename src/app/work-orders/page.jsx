'use client';

import { useState, useEffect } from 'react';
import { useDataTable } from '../../hooks/useDataTable';
import { useAuth } from '../../contexts/AuthContext';
import Pagination from '../../components/ui/Pagination';
import SortableHeader from '../../components/ui/SortableHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

// Kanban Column Component
function KanbanColumn({ title, count, colorClass, borderClass, targetStatus, onDropCard, children }) {
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const woId = e.dataTransfer.getData('woId');
    if (woId && targetStatus) onDropCard(woId, targetStatus);
  };

  return (
    <div className="flex flex-col w-80 shrink-0 transition-colors duration-200 rounded-lg pb-2" onDragOver={handleDragOver} onDrop={handleDrop}>
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
    <div draggable onDragStart={handleDragStart} className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 dark:hover:border-blue-500 transition-colors group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{wo.id}</span>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${wo.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            wo.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
              wo.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
          {wo.priority}
        </span>
      </div>
      <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-1 leading-snug">{wo.title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{wo.asset}</p>

      <div className="flex items-center justify-between mt-auto">
        {wo.assignee ? (
          <div className="flex items-center gap-2" title={`${wo.assignee} - ${wo.assigneeRole}`}>
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
              {wo.assignee.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{wo.assignee}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic flex items-center gap-1">Unassigned</span>
        )}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(wo)} className="text-blue-500 hover:text-blue-600"><Edit2 size={14} /></button>
          <button onClick={() => onDelete(wo.dbId)} className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );
}

export default function WorkOrdersPage() {
  const { user } = useAuth();
  // If technician, we inject a queryParam into the endpoint
  const queryEndpoint = user?.role === 'TECHNICIAN' 
    ? `/api/work-orders?assignedToId=${user.id}`
    : '/api/work-orders';
    
  const { data: flatOrders, total, loading: tableLoading, page, limit, setPage, handleSort, handleSearch, refresh, sortBy, sortOrder } = useDataTable({ endpoint: queryEndpoint, initialSortBy: 'createdAt' });
  const [workOrders, setWorkOrders] = useState(null);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [woParts, setWoParts] = useState([]);
  const [newPart, setNewPart] = useState({ inventoryPartId: '', quantityConsumed: 1 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({
    dbId: '', title: '', description: '', status: 'DRAFT', priority: 'MEDIUM', assetId: '', assignedToId: '',
    workType: 'Corrective Maintenance', dueDate: '', estimatedHours: '', actualHours: '', completionNotes: ''
  });

  const fetchKanbanData = async () => {
    setLoading(true);
    try {
      const kanbanEndpoint = user?.role === 'TECHNICIAN' 
        ? `/api/work-orders?kanban=true&assignedToId=${user.id}`
        : '/api/work-orders?kanban=true';
        
      const [woRes, assetsRes, techRes, invRes] = await Promise.all([
        fetch(kanbanEndpoint),
        fetch('/api/assets'),
        fetch('/api/technicians?limit=100'),
        fetch('/api/inventory?limit=100')
      ]);
      setWorkOrders(await woRes.json());
      setAssets((await assetsRes.json()).data || []);
      setTechnicians((await techRes.json()).data || []);
      
      const invData = await invRes.json();
      setInventory(invData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKanbanData(); }, []);

  const handleDropCard = async (woId, newStatus) => {
    const targetOrder = flatOrders.find(wo => wo.dbId === woId);
    if (!targetOrder || targetOrder.rawStatus === newStatus) return;

    try {
      const res = await fetch(`/api/work-orders/${woId}`);
      const fullData = await res.json();
      
      const updateData = { ...fullData, status: newStatus };

      const putRes = await fetch(`/api/work-orders/${woId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (putRes.ok) {
        fetchKanbanData();
        refresh();
      } else {
        const errorData = await putRes.json();
        alert(`Failed to move Work Order: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error dragging card:', err);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setWoParts([]);
    setFormData({
      dbId: '', title: '', description: '', status: 'DRAFT', priority: 'MEDIUM', assetId: '', assignedToId: '',
      workType: 'Corrective Maintenance', dueDate: '', estimatedHours: '', actualHours: '', completionNotes: ''
    });
    setIsModalOpen(true);
  };

  const loadParts = async (id) => {
    try {
      const res = await fetch(`/api/work-orders/${id}/parts`);
      if (res.ok) setWoParts(await res.json());
    } catch (err) { console.error(err); }
  };

  const openEditModal = async (wo) => {
    // Fetch full WO details to populate all fields
    const res = await fetch(`/api/work-orders/${wo.dbId}`);
    const fullWo = await res.json();
    await loadParts(wo.dbId);

    setModalMode('edit');
    setFormData({
      dbId: fullWo.id,
      title: fullWo.title,
      description: fullWo.description || '',
      status: fullWo.status,
      priority: fullWo.priority,
      assetId: fullWo.assetId,
      assignedToId: fullWo.assignedToId || '',
      workType: fullWo.workType || 'Corrective Maintenance',
      dueDate: fullWo.dueDate ? fullWo.dueDate.split('T')[0] : '',
      estimatedHours: fullWo.estimatedHours || '',
      actualHours: fullWo.actualHours || '',
      completionNotes: fullWo.completionNotes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this work order?')) return;
    try {
      const res = await fetch(`/api/work-orders/${id}`, { method: 'DELETE' });
      if (res.ok) { fetchKanbanData(); refresh(); }
    } catch (err) { console.error(err); }
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
        const data = await res.json();
        alert(data.error || 'Failed to save Work Order');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !workOrders) return <div className="p-8 text-center text-slate-500">Loading work orders...</div>;
  if (!workOrders) return <div className="p-8 text-center text-red-500">Failed to load work orders.</div>;

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Work Orders</h1>
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Kanban</button>
            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Table</button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input type="text" onChange={handleSearch} placeholder="Search tasks..." className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 block w-64" />
            <Search size={16} className="text-slate-500 absolute left-3 top-3" />
          </div>
          {user?.role !== 'TECHNICIAN' && (
            <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <Plus size={16} /> Create Task
            </button>
          )}
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
          <KanbanColumn title="Waiting Parts" count={workOrders.waitingParts.length} borderClass="border-t-purple-500" colorClass="bg-purple-500" targetStatus="WAITING_PARTS" onDropCard={handleDropCard}>
            {workOrders.waitingParts.map(wo => <KanbanCard key={wo.id} wo={wo} onEdit={openEditModal} onDelete={handleDelete} />)}
          </KanbanColumn>
          <KanbanColumn title="Completed" count={workOrders.completed.length} borderClass="border-t-green-500" colorClass="bg-green-500" targetStatus="COMPLETED" onDropCard={handleDropCard}>
            {workOrders.completed.map(wo => <KanbanCard key={wo.id} wo={wo} onEdit={openEditModal} onDelete={handleDelete} />)}
          </KanbanColumn>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                <tr>
                  <SortableHeader label="WO ID" columnKey="id" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                  <SortableHeader label="Title" columnKey="title" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                  <th className="px-6 py-4 font-medium">Asset</th>
                  <th className="px-6 py-4 font-medium">Assigned To</th>
                  <SortableHeader label="Status" columnKey="status" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                  <SortableHeader label="Priority" columnKey="priority" sortBy={sortBy} sortOrder={sortOrder} handleSort={handleSort} />
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flatOrders.map((wo, index) => (
                  <tr key={wo.id} className={`border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${index === flatOrders.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{wo.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{wo.title}</td>
                    <td className="px-6 py-4">{wo.asset}</td>
                    <td className="px-6 py-4">{wo.assignee || '-'}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{wo.status}</span></td>
                    <td className="px-6 py-4"><span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${wo.priority === 'Critical' ? 'bg-red-100 text-red-700' : wo.priority === 'High' ? 'bg-orange-100 text-orange-700' : wo.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'}`}>{wo.priority}</span></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditModal(wo)} className="text-blue-600 hover:underline mr-3 text-sm">Edit</button>
                      <button onClick={() => handleDelete(wo.dbId)} className="text-red-600 hover:underline text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} limit={limit} total={total} setPage={setPage} />
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {modalMode === 'add' ? 'Create Work Order' : `Edit Work Order ${formData.dbId.split('-')[0]}`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Core Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Input label="Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Inspect Conveyor Belt" />
                  </div>
                  <div className="col-span-2">
                    <Input label="Description" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the problem or task..." />
                  </div>
                  <Select label="Asset" required apiEndpoint="/api/assets" value={formData.assetId} onChange={e => setFormData({...formData, assetId: e.target.value})} />
                  <Select label="Work Type" value={formData.workType} onChange={e => setFormData({...formData, workType: e.target.value})}>
                    <option value="Corrective Maintenance">Corrective Maintenance</option>
                    <option value="Preventive Maintenance">Preventive Maintenance</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Breakdown">Breakdown</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Calibration">Calibration</option>
                  </Select>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Planning & Execution</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Assigned Technician" required value={formData.assignedToId} onChange={e => setFormData({...formData, assignedToId: e.target.value})}>
                    <option value="" disabled>Select Technician</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name} ({t.role})</option>)}
                  </Select>
                  <Input label="Due Date" type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                  <Select label="Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="DRAFT">Draft</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_PARTS">Waiting Parts</option>
                    <option value="COMPLETED">Completed (Pending Review)</option>
                    {user?.role !== 'TECHNICIAN' && <option value="CLOSED">Closed</option>}
                  </Select>
                  <Select label="Priority" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                  <Input label="Estimated Hours" type="number" step="0.5" value={formData.estimatedHours} onChange={e => setFormData({...formData, estimatedHours: e.target.value})} placeholder="e.g. 2.5" />
                  <Input label="Actual Hours" type="number" step="0.5" value={formData.actualHours} onChange={e => setFormData({...formData, actualHours: e.target.value})} placeholder="e.g. 3.0" />
                </div>
              </div>
              
              {formData.status === 'COMPLETED' || formData.status === 'CLOSED' ? (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Completion Info</h3>
                  <Input label="Completion Notes" value={formData.completionNotes} onChange={e => setFormData({...formData, completionNotes: e.target.value})} placeholder="How was this resolved?" />
                </div>
              ) : null}

              {modalMode === 'edit' && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Parts & Materials</h3>
                  
                  {woParts.length > 0 ? (
                    <ul className="mb-4 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      {woParts.map(p => (
                        <li key={p.id} className="p-3 flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-800/50 group">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{p.inventoryPart?.name} ({p.inventoryPart?.code})</span>
                            <span className="text-xs text-slate-500 mt-0.5">Requested: {new Date(p.requestedAt).toLocaleDateString()} by {p.requestedBy?.name || 'System'}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Qty: {p.requestedQty}</span>
                            
                            {/* Status Badge */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.requestStatus === 'REQUESTED' ? 'bg-yellow-100 text-yellow-700' :
                              p.requestStatus === 'ISSUED' ? 'bg-blue-100 text-blue-700' :
                              p.requestStatus === 'CONSUMED' ? 'bg-green-100 text-green-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {p.requestStatus}
                            </span>

                            {/* Consume Action for Technicians */}
                            {p.requestStatus === 'ISSUED' && formData.status !== 'COMPLETED' && formData.status !== 'CLOSED' && (
                              <button 
                                type="button"
                                onClick={async () => {
                                  if (!confirm(`Confirm consumption of ${p.issuedQty}x ${p.inventoryPart?.name}? This will permanently deduct from inventory.`)) return;
                                  try {
                                    const res = await fetch(`/api/work-orders/${formData.dbId}/parts/${p.id}/consume`, { method: 'PUT' });
                                    if (res.ok) {
                                      loadParts(formData.dbId);
                                    } else {
                                      const err = await res.json();
                                      alert(err.error || 'Failed to consume part');
                                    }
                                  } catch (error) {
                                    alert('Network error consuming part');
                                  }
                                }}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors shadow-sm"
                                title="Confirm Usage"
                              >
                                Consume
                              </button>
                            )}

                            {/* Remove Action (Only if REQUESTED or CANCELLED) */}
                            {(p.requestStatus === 'REQUESTED' || p.requestStatus === 'CANCELLED') && formData.status !== 'COMPLETED' && formData.status !== 'CLOSED' && (
                              <button 
                                type="button"
                                onClick={async () => {
                                  if (!confirm('Cancel this part request?')) return;
                                  try {
                                    const res = await fetch(`/api/work-orders/${formData.dbId}/parts/${p.id}`, { method: 'DELETE' });
                                    if (res.ok) {
                                      loadParts(formData.dbId);
                                    } else {
                                      const err = await res.json();
                                      alert(err.error || 'Failed to cancel request');
                                    }
                                  } catch (error) {
                                    alert('Network error canceling request');
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium ml-2"
                                title="Cancel Request"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 mb-4 italic">No parts requested yet.</p>
                  )}

                  {formData.status !== 'CLOSED' && (
                    <div className="flex gap-2 items-end bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <Select 
                          label="Part" 
                          apiEndpoint="/api/inventory" 
                          value={newPart.inventoryPartId} 
                          onChange={e => setNewPart({...newPart, inventoryPartId: e.target.value})} 
                        />
                      </div>
                      <div className="w-24">
                        <Input label="Qty" type="number" min="1" value={newPart.requestedQty} onChange={e => setNewPart({...newPart, requestedQty: e.target.value})} />
                      </div>
                      <button 
                        type="button" 
                        disabled={!newPart.inventoryPartId}
                        onClick={async () => {
                          const res = await fetch(`/api/work-orders/${formData.dbId}/parts`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...newPart, requestedQty: newPart.requestedQty || 1 })
                          });
                          if (res.ok) {
                            setNewPart({ inventoryPartId: '', requestedQty: 1 });
                            loadParts(formData.dbId);
                            // Also refresh the WO to catch status changes (WAITING_PARTS)
                            fetchKanbanData();
                            refresh();
                            setFormData(prev => ({ ...prev, status: 'WAITING_PARTS' }));
                          } else {
                            const err = await res.json();
                            alert(err.error);
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium mb-1 disabled:opacity-50"
                      >
                        Request
                      </button>
                    </div>
                  )}
                </div>
              )}

            </form>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {modalMode === 'add' ? 'Create Task' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
