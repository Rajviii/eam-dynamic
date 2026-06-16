import { useState, useEffect, useRef } from 'react';
import Label from './Label';
import { Search, ChevronDown, Check } from 'lucide-react';

export default function AssetDropdown({ label, value, onChange, required, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
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

  const fetchAssets = async (pageNum, searchQuery, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets?page=${pageNum}&limit=10&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (append) {
        setAssets(prev => [...prev, ...(data.data || [])]);
      } else {
        setAssets(data.data || []);
      }
      setHasMore(data.total > (pageNum - 1) * 10 + (data.data?.length || 0));
    } catch (err) {
      console.error('Error fetching assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssets(1, search, false);
    }
  }, [isOpen, search]);

  const handleLoadMore = (e) => {
    e.stopPropagation();
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAssets(nextPage, search, true);
  };

  const handleSelect = (asset) => {
    setSelectedAsset(asset);
    onChange(asset.id);
    setIsOpen(false);
    setSearch('');
  };

  // Prevent parent scroll when scrolling dropdown
  const handleWheel = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={`w-full relative ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
      {label && <Label>{label}</Label>}
      <div 
        className={`w-full flex items-center justify-between text-gray-600 dark:text-white bg-slate-50 dark:bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} rounded-lg p-2.5 text-sm cursor-pointer hover:border-blue-500 transition-colors`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedAsset ? `${selectedAsset.name} (${selectedAsset.code})` : 'Select Asset...'}
        </span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg flex flex-col" style={{ maxHeight: '320px' }}>
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-lg shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-1" onWheel={handleWheel}>
            {assets.length === 0 && !loading && (
              <div className="p-3 text-center text-sm text-slate-500">No assets found</div>
            )}
            
            {assets.map(asset => (
              <div
                key={asset.id}
                onClick={() => handleSelect(asset)}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-sm hover:bg-blue-50 dark:hover:bg-slate-700 ${value === asset.id ? 'bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
              >
                <div className="flex flex-col">
                  <span>{asset.name}</span>
                  <span className="text-xs text-slate-500">{asset.code}</span>
                </div>
                {value === asset.id && <Check size={16} />}
              </div>
            ))}
            
            {hasMore && (
              <div 
                className="p-2 text-center text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md font-medium"
                onClick={handleLoadMore}
              >
                {loading ? 'Loading...' : 'Load More'}
              </div>
            )}
            {!hasMore && assets.length > 0 && (
              <div className="p-2 text-center text-xs text-slate-400">End of list</div>
            )}
          </div>
        </div>
      )}
      {/* Hidden input for form validation */}
      {required && (
        <input type="text" className="absolute opacity-0 w-0 h-0 pointer-events-none" required value={value} onChange={() => {}} />
      )}
    </div>
  );
}
