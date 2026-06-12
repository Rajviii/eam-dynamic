export default function Pagination({ page, limit, total, setPage }) {
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Showing <span className="font-medium text-slate-900 dark:text-slate-100">{Math.min((page - 1) * limit + 1, total)}</span> to <span className="font-medium text-slate-900 dark:text-slate-100">{Math.min(page * limit, total)}</span> of <span className="font-medium text-slate-900 dark:text-slate-100">{total}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded text-sm text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Previous
        </button>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 px-2">
          Page {page} of {totalPages}
        </span>
        <button 
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded text-sm text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
