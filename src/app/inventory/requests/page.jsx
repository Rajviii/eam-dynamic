'use client';

import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, XCircle } from 'lucide-react';

export default function PartRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/part-requests?status=ALL_OPEN');
      const data = await res.json();
      if (res.ok) {
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching part requests', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`/api/part-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchRequests();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to process request');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  return (
    <div className="mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package size={24} className="text-blue-500" />
            Part Requests
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review and issue requested inventory parts for active Work Orders.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Work Order</th>
                <th className="px-6 py-4 font-medium">Part Requested</th>
                <th className="px-6 py-4 font-medium">Qty</th>
                <th className="px-6 py-4 font-medium">Stock Available</th>
                <th className="px-6 py-4 font-medium">Requested By</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">Loading requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">No open part requests at this time.</td>
                </tr>
              ) : requests.map((req) => {
                const canIssue = req.inventoryPart?.quantityOnHand >= req.requestedQty;
                return (
                  <tr key={req.id} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">{new Date(req.requestedAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      <div className="font-mono text-xs text-blue-600 dark:text-blue-400">
                        {req.workOrder?.woNumber?.startsWith('WO-') ? req.workOrder.woNumber : `WO-${(req.workOrder?.id || '').split('-')[0].substring(0, 6).toUpperCase()}`}
                      </div>
                      <div className="text-xs font-normal text-slate-500 truncate max-w-[150px]">{req.workOrder?.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      {req.inventoryPart?.name} <span className="text-xs text-slate-500">({req.inventoryPart?.code})</span>
                    </td>
                    <td className="px-6 py-4 font-bold">{req.requestedQty}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${canIssue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {req.inventoryPart?.quantityOnHand}
                      </span>
                    </td>
                    <td className="px-6 py-4">{req.requestedBy?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${req.requestStatus === 'REQUESTED' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          req.requestStatus === 'APPROVED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                        {req.requestStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {req.requestStatus === 'REQUESTED' && (
                          <>
                            <button
                              onClick={() => handleAction(req.id, 'ISSUE')}
                              disabled={!canIssue}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-all shadow-sm ${canIssue ? 'bg-blue-600 hover:bg-blue-700 hover:shadow' : 'bg-blue-400 cursor-not-allowed opacity-60'}`}
                              title={!canIssue ? "Insufficient stock" : "Issue Part"}
                            >
                              <CheckCircle size={14} /> Issue
                            </button>
                            <button
                              onClick={() => { if (confirm('Reject this request?')) handleAction(req.id, 'REJECT') }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all border border-red-200 dark:border-red-800"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
