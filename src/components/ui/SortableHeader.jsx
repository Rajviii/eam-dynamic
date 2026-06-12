export default function SortableHeader({ label, columnKey, sortBy, sortOrder, handleSort, className = '' }) {
  const isActive = sortBy === columnKey;

  return (
    <th 
      scope="col" 
      className={`px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors select-none group ${className}`}
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center gap-1">
        <span className={isActive ? 'text-blue-600 dark:text-blue-400' : ''}>{label}</span>
        <div className={`flex flex-col ml-1 opacity-0 group-hover:opacity-50 transition-opacity ${isActive ? 'opacity-100 group-hover:opacity-100' : ''}`}>
          <svg className={`w-3 h-3 -mb-1 ${isActive && sortOrder === 'asc' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          <svg className={`w-3 h-3 ${isActive && sortOrder === 'desc' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </div>
      </div>
    </th>
  );
}
