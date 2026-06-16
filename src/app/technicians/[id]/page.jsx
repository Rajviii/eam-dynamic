'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Briefcase, CheckCircle, Clock, Calendar } from 'lucide-react';

export default function TechnicianDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [technician, setTechnician] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTech = async () => {
      try {
        const res = await fetch(`/api/technicians/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setTechnician(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchTech();
  }, [params.id]);

  if (loading) {
    return <div className="p-8 flex justify-center items-center h-full"><div className="animate-pulse text-slate-500">Loading details...</div></div>;
  }

  if (!technician) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Technician Not Found</h2>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const workOrders = technician.assignedWorkOrders || [];
  const openWOs = workOrders.filter(wo => !['COMPLETED', 'CLOSED'].includes(wo.status));
  const completedWOs = workOrders.filter(wo => ['COMPLETED', 'CLOSED'].includes(wo.status));
  const pmAssignments = technician.maintenanceProgs || [];

  return (
    <div className="h-full flex flex-col relative overflow-y-auto pr-2 pb-8">
      <div className="mb-6 flex items-center gap-4 shrink-0">
        <Link href="/technicians" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-3">
            {technician.name}
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${
              technician.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              technician.status === 'On Leave' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {technician.status}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{technician.role} &bull; {technician.technicianCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* KPI Cards */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Open Tasks</span>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-auto">{openWOs.length}</span>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
              <CheckCircle size={16} />
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</span>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-auto">{completedWOs.length}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">PM Assignments</span>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-auto">{pmAssignments.length}</span>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Est. Backlog</span>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-auto">
            {openWOs.reduce((acc, curr) => acc + (curr.estimatedHours || 0), 0)} <span className="text-sm font-normal text-slate-500">hrs</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Open Work Orders List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Current Workload</h3>
              <Link href="/work-orders" className="text-sm text-blue-600 hover:underline">View All in Board</Link>
            </div>
            <div className="p-0">
              {openWOs.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No open work orders assigned.</div>
              ) : (
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Task</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Priority</th>
                      <th className="px-5 py-3 font-medium text-right">Est. Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {openWOs.map(wo => (
                      <tr key={wo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{wo.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{wo.woNumber}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">{wo.status}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${wo.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            wo.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            wo.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {wo.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {wo.estimatedHours ? `${wo.estimatedHours}h` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div>
          {/* Profile Details Sidebar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Contact Information</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm text-slate-900 dark:text-slate-200">{technician.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-sm text-slate-900 dark:text-slate-200">{technician.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Employee Number</p>
                <p className="text-sm text-slate-900 dark:text-slate-200">{technician.employeeNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Skills & Certifications</h3>
            </div>
            <div className="p-5 flex flex-wrap gap-2">
              {technician.skills ? technician.skills.split(',').map((skill, i) => (
                <span key={i} className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md">
                  {skill.trim()}
                </span>
              )) : (
                <p className="text-sm text-slate-500">No skills logged.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
