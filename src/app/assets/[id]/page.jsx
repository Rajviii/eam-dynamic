export default function AssetDetailsPage({ params }) {
  // Mock asset details since we can't await params synchronously in Next 15 easily without specific patterns, 
  // but this is standard React component.
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Boiler 01</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-500">AST-002</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Critical</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Create Work Order
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center min-h-[240px]">
            {/* Image Placeholder */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </div>
          <div className="w-full md:w-2/3 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Location</span>
              <span className="font-medium">Plant A / Utilities</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Status</span>
              <span className="font-medium text-green-600 dark:text-green-400">Operational</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Health Score</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">62</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Availability</span>
              <span className="font-medium">92.1%</span>
            </div>
            
            <div className="col-span-2 lg:col-span-4 border-t border-slate-200 dark:border-slate-800 pt-6 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Specifications</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Manufacturer</span><span className="font-medium">Fulton</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Model</span><span className="font-medium">FT-2000</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Serial Number</span><span className="font-medium">FUL-2000-082</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Install Date</span><span className="font-medium">15 Mar 2020</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Capacity</span><span className="font-medium">10,000 kg/hr</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Description</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    High pressure steam boiler used for process heating and power generation. Regular maintenance required for safety compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400">Overview</button>
          <button className="px-6 py-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Work Orders</button>
          <button className="px-6 py-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Maintenance History</button>
          <button className="px-6 py-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Reliability</button>
          <button className="px-6 py-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Parts</button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-5">
              <h4 className="font-medium mb-4">Maintenance Cost Trend</h4>
              <div className="h-40 flex items-end justify-between relative px-2">
                <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                   <polyline points="0,80 20,85 40,60 60,75 80,40 100,50" fill="none" stroke="#3b82f6" strokeWidth="2" />
                </svg>
                <span className="text-xs text-slate-500 z-10">Jan</span>
                <span className="text-xs text-slate-500 z-10">Feb</span>
                <span className="text-xs text-slate-500 z-10">Mar</span>
                <span className="text-xs text-slate-500 z-10">Apr</span>
                <span className="text-xs text-slate-500 z-10">May</span>
                <span className="text-xs text-slate-500 z-10">Jun</span>
              </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-5">
              <h4 className="font-medium mb-4">Cost by Category</h4>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full border-[12px] border-slate-100 dark:border-slate-800 relative">
                  <div className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-blue-500 border-r-blue-500 border-b-green-500 border-l-purple-500 opacity-80" style={{ transform: 'rotate(45deg)' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="font-bold text-lg">$285K</span>
                    <span className="text-[10px] text-slate-500">Total</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-slate-600 dark:text-slate-300">Labor</span></div><span className="font-medium">45%</span></div>
                  <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-slate-600 dark:text-slate-300">Parts</span></div><span className="font-medium">35%</span></div>
                  <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className="text-slate-600 dark:text-slate-300">Contract</span></div><span className="font-medium">15%</span></div>
                  <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div><span className="text-slate-600 dark:text-slate-300">Other</span></div><span className="font-medium">5%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
