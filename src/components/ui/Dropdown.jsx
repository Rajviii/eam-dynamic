import React, { useState, useEffect, useRef } from 'react';
import Label from './Label';
import { ChevronDown, Check, Search } from 'lucide-react';

export default function Dropdown({ 
  label, 
  value, 
  onChange, 
  options = [], 
  children,
  apiEndpoint, // e.g., '/api/assets'
  searchable = true,
  required, 
  error, 
  placeholder = "Select...",
  className = '',
  name
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Dynamic API State
  const [apiData, setApiData] = useState([]);
  const [apiPage, setApiPage] = useState(1);
  const [apiHasMore, setApiHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  // Static Local State
  const [staticPage, setStaticPage] = useState(1);
  const staticLimit = 10;
  
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch API Data
  const fetchApiData = async (pageNum, searchQuery, append = false) => {
    if (!apiEndpoint) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiEndpoint}?page=${pageNum}&limit=10&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      const results = data.data || [];
      const total = data.total || 0;
      
      // Map API results to { label, value } standard
      const formattedResults = results.map(item => {
        // Handle Asset/Generic vs Inventory payloads
        const name = item.name || item.description || 'Unknown';
        const code = item.code || item.partNumber || '';
        const extra = typeof item.onHand !== 'undefined' ? ` (Stock: ${item.onHand})` : typeof item.quantityOnHand !== 'undefined' ? ` (Stock: ${item.quantityOnHand})` : '';
        const displayCode = code ? ` (${code})` : '';
        
        return {
          value: item.id,
          label: `${name}${displayCode}${extra}`,
          original: item
        };
      });

      if (append) {
        setApiData(prev => {
          // Prevent duplicates if API acts weird
          const existingIds = new Set(prev.map(p => p.value));
          const newItems = formattedResults.filter(r => !existingIds.has(r.value));
          return [...prev, ...newItems];
        });
      } else {
        setApiData(formattedResults);
      }
      setApiHasMore(total > (pageNum - 1) * 10 + results.length);
    } catch (err) {
      console.error(`Error fetching from ${apiEndpoint}`, err);
    } finally {
      setLoading(false);
    }
  };

  // Initial API fetch when opened
  useEffect(() => {
    if (isOpen && apiEndpoint) {
      fetchApiData(1, search, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, search, apiEndpoint]);

  // Parse Static Options from children
  const parsedOptions = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === 'option') {
      if (child.props.disabled && !child.props.value) return null;
      return { 
        value: child.props.value, 
        label: child.props.children,
        disabled: child.props.disabled 
      };
    }
    return null;
  })?.filter(Boolean) || [];

  const staticOptions = options.length > 0 ? options : parsedOptions;
  
  // Local filtering for static options
  const displayStaticOptions = apiEndpoint 
    ? [] 
    : staticOptions.filter(opt => String(opt.label).toLowerCase().includes(search.toLowerCase()));

  const currentStaticOptions = displayStaticOptions.slice(0, staticPage * staticLimit);
  const staticHasMore = currentStaticOptions.length < displayStaticOptions.length;

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (apiEndpoint) {
      setApiPage(1);
    } else {
      setStaticPage(1);
    }
  };

  const handleLoadMore = (e) => {
    e.stopPropagation();
    if (apiEndpoint) {
      const nextPage = apiPage + 1;
      setApiPage(nextPage);
      fetchApiData(nextPage, search, true);
    } else {
      setStaticPage(prev => prev + 1);
    }
  };

  const handleSelect = (option) => {
    if (option.disabled) return;
    if (onChange) {
      // Simulate event for drop-in compatibility with traditional <select>
      onChange({ target: { value: option.value, name } });
    }
    setIsOpen(false);
    setSearch('');
  };

  const finalOptionsToRender = apiEndpoint ? apiData : currentStaticOptions;
  const finalHasMore = apiEndpoint ? apiHasMore : staticHasMore;

  // Selected Option Label Resolution
  let selectedLabel = placeholder;
  if (value) {
    if (apiEndpoint) {
      const found = apiData.find(o => String(o.value) === String(value));
      if (found) {
        selectedLabel = found.label;
      } else {
        selectedLabel = "Selected Option"; // Fallback if selected item is not in current paginated view
      }
    } else {
      const found = staticOptions.find(o => String(o.value) === String(value));
      if (found) selectedLabel = found.label;
    }
  }

  const handleWheel = (e) => e.stopPropagation();

  return (
    <div className={`w-full relative ${isOpen ? 'z-[100]' : 'z-10'} ${className}`} ref={dropdownRef}>
      {label && <Label>{label}</Label>}
      <div 
        className={`w-full flex items-center justify-between text-gray-600 dark:text-white bg-slate-50 dark:bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} rounded-lg p-2.5 text-sm cursor-pointer hover:border-blue-500 transition-colors`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedLabel}
        </span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '320px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
          {searchable && (
            <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="Search..."
                  value={search}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto flex-1 p-1" onWheel={handleWheel}>
            {finalOptionsToRender.length === 0 && !loading && (
              <div className="p-3 text-center text-sm text-slate-500">No options found</div>
            )}
            {finalOptionsToRender.map(opt => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt)}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-sm transition-all duration-150 ${
                  opt.disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : String(value) === String(opt.value) 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-semibold' 
                      : 'text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/80 hover:text-blue-700 dark:hover:text-blue-300'
                }`}
              >
                <span>{opt.label}</span>
                {String(value) === String(opt.value) && <Check size={16} />}
              </div>
            ))}
            
            {finalHasMore && (
              <div 
                className="p-2 text-center text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md font-medium"
                onClick={handleLoadMore}
              >
                {loading ? 'Loading...' : 'Load More'}
              </div>
            )}
            {!finalHasMore && finalOptionsToRender.length > 0 && finalOptionsToRender.length > 10 && (
              <div className="p-2 text-center text-xs text-slate-400">End of list</div>
            )}
          </div>
        </div>
      )}
      
      {/* Hidden input for form validation */}
      {required && (
        <input 
          type="text" 
          name={name}
          className="absolute opacity-0 w-0 h-0 pointer-events-none" 
          required 
          value={value || ''} 
          onChange={() => {}} 
        />
      )}
    </div>
  );
}
