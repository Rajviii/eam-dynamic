'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Briefcase as BriefcaseIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle2 as CheckCircleIcon,
  RefreshCw as RefreshIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Info as InfoIcon
} from 'lucide-react';

export default function PlannerWorkbenchPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningWo, setAssigningWo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Timezone-safe local date formatting helper
  const getLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date and assignment filters for EAM scheduling
  const [scheduleDate, setScheduleDate] = useState(getLocalDateString(new Date()));
  const [assignmentFilter, setAssignmentFilter] = useState('UNASSIGNED');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [woRes, techRes] = await Promise.all([
        fetch('/api/work-orders?limit=100'),
        fetch('/api/technicians?limit=100')
      ]);

      if (woRes.ok && techRes.ok) {
        const woData = await woRes.json();
        const techData = await techRes.json();
        setWorkOrders(woData.data || woData);
        setTechnicians(techData.data || techData);
      }
    } catch (err) {
      console.error('Failed to fetch planner workbench data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (woId, techId) => {
    try {
      const wo = workOrders.find(w => w.dbId === woId);
      if (!wo) return;

      const res = await fetch(`/api/work-orders/${woId}`);
      const fullData = await res.json();

      const updateData = {
        ...fullData,
        assignedToId: techId,
        // Set due date to the selected scheduleDate if set, otherwise today's local date
        dueDate: scheduleDate || getLocalDateString(new Date()),
        status: 'ASSIGNED'
      };

      const putRes = await fetch(`/api/work-orders/${woId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (putRes.ok) {
        setAssigningWo(null);
        fetchData();
      } else {
        const errorData = await putRes.json();
        alert(`Failed to assign: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error assigning work order:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse flex flex-col items-center justify-center gap-3 py-24">
        <RefreshIcon className="animate-spin text-blue-500 w-8 h-8" />
        <span className="text-lg font-medium">Loading Planner Workbench...</span>
      </div>
    );
  }

  // Resolve active date for capacity load (defaults to today if scheduleDate is empty/cleared)
  const capacityDate = scheduleDate || getLocalDateString(new Date());

  // Calculate capacity per technician based on active, estimated hours of their work orders for the selected date
  const capacityData = technicians.map(tech => {
    const assignedWOs = workOrders.filter(w =>
      w.assignedToId === tech.id &&
      ['ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'].includes(w.rawStatus || w.status) &&
      (w.dueDate ? getLocalDateString(w.dueDate) === capacityDate : false)
    );

    // Sum estimated hours (default to 2 hours if not specified)
    const totalAssignedHours = assignedWOs.reduce((sum, w) => {
      const hours = w.estimatedHours ? parseFloat(w.estimatedHours) : 2.0;
      return sum + hours;
    }, 0);

    const shiftLimit = 8.0; // standard 8-hour workday limit
    const remainingCapacity = Math.max(0, shiftLimit - totalAssignedHours);
    const utilizationRate = (totalAssignedHours / shiftLimit) * 100;

    return {
      ...tech,
      assignedCount: assignedWOs.length,
      assignedHours: totalAssignedHours,
      remainingCapacity,
      utilizationRate,
      assignedWOs
    };
  });

  // Filter queue work orders
  const backlogWOs = workOrders.filter(w => {
    const isOpenStatus = ['DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'].includes(w.rawStatus || w.status);

    let matchesAssignment = true;
    if (assignmentFilter === 'UNASSIGNED') {
      matchesAssignment = !w.assignedToId;
    } else if (assignmentFilter === 'ASSIGNED') {
      matchesAssignment = !!w.assignedToId;
    }

    const matchesSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.asset && w.asset.toLowerCase().includes(searchTerm.toLowerCase())) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === 'ALL' || w.priority.toUpperCase() === priorityFilter;

    // Date filter: only filter by date if scheduleDate is selected (not empty)
    let matchesDate = true;
    if (scheduleDate) {
      matchesDate = w.dueDate ? getLocalDateString(w.dueDate) === scheduleDate : false;
    }

    return isOpenStatus && matchesAssignment && matchesSearch && matchesPriority && matchesDate;
  });

  // Global metrics based on the active queue content and schedule date
  const totalBacklogTasks = backlogWOs.length;
  const totalBacklogHours = backlogWOs.reduce((sum, w) => sum + (w.estimatedHours ? parseFloat(w.estimatedHours) : 2.0), 0);

  const totalAvailableTechHours = capacityData.reduce((sum, t) => sum + t.remainingCapacity, 0);
  const globalCapacityUsed = capacityData.reduce((sum, t) => sum + t.assignedHours, 0);
  const globalCapacityTotal = technicians.length * 8.0;
  const globalUtilization = globalCapacityTotal > 0 ? (globalCapacityUsed / globalCapacityTotal) * 100 : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Planner Workbench
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Standard ISO 55001 capacity scheduling. Assign backlog work orders based on artisan available hours and skills.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto self-stretch">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-sm text-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Schedule Date:</span>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="bg-transparent border-0 outline-none text-slate-900 dark:text-white font-medium text-xs w-28 focus:ring-0"
            />
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm bg-white dark:bg-slate-900"
          >
            <RefreshIcon size={16} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Backlog Tasks</span>
          <span className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalBacklogTasks} WOs</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Backlog Effort Required</span>
          <span className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalBacklogHours.toFixed(1)} hrs</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Available Artisan Hours</span>
          <span className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{totalAvailableTechHours.toFixed(1)} hrs</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Artisan Utilization Rate</span>
          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{globalUtilization.toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Artisan Capacity List (Cols 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2">
            Artisan Capacity & Load
          </h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {capacityData.map(tech => (
              <div key={tech.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-950 dark:text-white flex items-center gap-1.5">
                      <UserIcon size={14} className="text-blue-500" />
                      {tech.name}
                    </h3>
                    <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">
                      {tech.technicianCode}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {tech.role}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Utilization ({tech.assignedHours.toFixed(1)}h / 8.0h)</span>
                    <span className={tech.utilizationRate > 100 ? 'text-red-500 font-bold' : tech.utilizationRate > 75 ? 'text-orange-500' : 'text-slate-700 dark:text-slate-300'}>
                      {tech.utilizationRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${tech.utilizationRate > 100 ? 'bg-red-500' :
                        tech.utilizationRate > 75 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                      style={{ width: `${Math.min(100, tech.utilizationRate)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Scheduled Task Listing for Selected Date */}
                {tech.assignedWOs.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Scheduled for {new Date(capacityDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}:</span>
                    <div className="space-y-1">
                      {tech.assignedWOs.map(w => (
                        <div key={w.id} className="flex justify-between items-center text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded-lg shadow-sm">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-850 dark:text-slate-200 truncate">{w.title}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">{w.id}</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0 ml-2">
                            {w.estimatedHours ? `${w.estimatedHours}h` : '2h'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tech.skills && (
                  <div className="flex flex-wrap gap-1 items-center pt-1">
                    <BriefcaseIcon size={10} className="text-slate-400 mr-1" />
                    {tech.skills.split(',').map((skill, sIdx) => (
                      <span key={sIdx} className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {capacityData.length === 0 && (
              <p className="text-sm text-slate-500 italic text-center py-6">No technicians configured. Register technicians in the resources tab.</p>
            )}
          </div>
        </div>

        {/* Right Side: Backlog Queue (Cols 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              Work Order Scheduling Queue
              <span className="group relative cursor-pointer flex items-center">
                <InfoIcon size={14} className="text-slate-400 hover:text-slate-600 transition-colors" />
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 bg-slate-950 border border-slate-800 text-white text-[10px] p-2 rounded-lg shadow-xl z-50 whitespace-normal leading-normal font-normal pointer-events-none">
                  To see the actual hours-calculation, the work order should be in ASSIGNED state.
                </span>
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto self-stretch">
              {/* Search */}
              <div className="relative flex-1 sm:w-40">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg pl-8 pr-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                />
                <SearchIcon size={12} className="text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Assignment Status Filter */}
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
              >
                <option value="UNASSIGNED">Unassigned Backlog</option>
                <option value="ASSIGNED">Scheduled / Assigned</option>
                <option value="ALL">All Open Tasks</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Priority</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {backlogWOs.map(wo => (
              <div key={wo.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-colors shadow-sm bg-white dark:bg-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      {wo.id}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${wo.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                      wo.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                        wo.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-600'
                      }`}>
                      {wo.priority}
                    </span>
                    {wo.assignedToId && (
                      <span className="text-[9px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                        Assigned to: {wo.assignee || 'Artisan'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{wo.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><BriefcaseIcon size={12} /> {wo.asset || 'No Asset'}</span>
                    <span className="flex items-center gap-1"><ClockIcon size={12} /> {wo.estimatedHours ? `${wo.estimatedHours} hrs` : '2.0 hrs'}</span>
                    <span className="flex items-center gap-1"><CalendarIcon size={12} /> Due: {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : '-'}</span>
                  </div>
                </div>

                <div className="relative self-stretch md:self-auto shrink-0 flex items-center">
                  {assigningWo === wo.dbId ? (
                    <div className="flex gap-2 items-center w-full justify-between md:justify-end">
                      <select
                        defaultValue=""
                        onChange={(e) => handleAssign(wo.dbId, e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 w-40 text-slate-700 dark:text-slate-300"
                      >
                        <option value="" disabled>Choose Artisan</option>
                        {capacityData.map(tech => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({tech.remainingCapacity.toFixed(1)}h left)
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setAssigningWo(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAssigningWo(wo.dbId)}
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
                    >
                      {wo.assignedToId ? 'Reassign' : 'Schedule / Assign'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {backlogWOs.length === 0 && (
              <p className="text-sm text-slate-500 italic text-center py-10 bg-slate-50/50 dark:bg-slate-800/10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No work orders match the selected filters.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
