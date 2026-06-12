'use client';

import Link from 'next/link';

export default function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome to the EAM Platform
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Your complete guide to setting up and managing your Enterprise Asset Management system. Follow these steps in sequence to get up and running smoothly.
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex gap-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <div className="flex-shrink-0 mt-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xl">
              1
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Configure Settings (Reference Data)</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Before adding assets, you need to set up the foundational data that the system uses to organize everything. This prevents manual typing and ensures consistency across the platform.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <span className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">Locations / Sites</span>
                <span className="text-sm text-slate-500">Where are your assets physically located?</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <span className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">Categories</span>
                <span className="text-sm text-slate-500">How do you classify equipment? (e.g., HVAC, IT)</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <span className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">Vendors</span>
                <span className="text-sm text-slate-500">Who supplies your parts or services?</span>
              </div>
            </div>
            <Link href="/settings" className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Go to Settings &rarr;
            </Link>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex gap-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
          <div className="flex-shrink-0 mt-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-xl">
              2
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Register Assets</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              With your locations and categories defined, you can now log your physical equipment into the system. Every asset gets a unique ID, status, and criticality score.
            </p>
            <Link href="/assets" className="inline-flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
              View Asset Registry &rarr;
            </Link>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex gap-6 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
          <div className="flex-shrink-0 mt-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold text-xl">
              3
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Log Inventory & Spare Parts</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Add all your spare parts to the inventory. You can track quantities on hand, unit costs, and set reorder minimums to receive low-stock alerts.
            </p>
            <Link href="/inventory" className="inline-flex items-center text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline">
              Manage Inventory &rarr;
            </Link>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex gap-6 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
          <div className="flex-shrink-0 mt-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-xl">
              4
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Create & Track Work Orders</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              When an asset breaks or needs maintenance, create a Work Order. You can view work orders in a traditional paginated table, or use the interactive Kanban board to drag-and-drop tasks across statuses.
            </p>
            <Link href="/work-orders" className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">
              Open Work Orders &rarr;
            </Link>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex gap-6 hover:border-rose-300 dark:hover:border-rose-700 transition-colors">
          <div className="flex-shrink-0 mt-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-xl">
              5
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Monitor Risk & Reliability</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              As your platform matures, use the analytical modules to track system health. Log operational risks in the <strong>Risk Register</strong>, and track downtime and failures in the <strong>Reliability Metrics</strong> dashboard.
            </p>
            <div className="flex gap-6 mt-2">
              <Link href="/risk" className="inline-flex items-center text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline">
                Risk Register &rarr;
              </Link>
              <Link href="/reliability" className="inline-flex items-center text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline">
                Reliability Metrics &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
