import { ChevronUp, ChevronDown } from 'lucide-react';

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
          <ChevronUp className={`w-3 h-3 -mb-1 ${isActive && sortOrder === 'asc' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
          <ChevronDown className={`w-3 h-3 ${isActive && sortOrder === 'desc' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
        </div>
      </div>
    </th>
  );
}
