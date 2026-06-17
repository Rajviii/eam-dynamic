import { useState, useEffect, useCallback } from 'react';

export function useDataTable({ endpoint, initialSortBy = 'id', initialSortOrder = 'desc', initialLimit = 10 }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [rawJson, setRawJson] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  // Internal trigger to refetch
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const hasQuery = endpoint.includes('?');
      const separator = hasQuery ? '&' : '?';
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        query: search, // support both parameter styles for API resilience
        sortBy,
        sortOrder
      });

      const res = await fetch(`${endpoint}${separator}${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      
      const json = await res.json();
      setRawJson(json);
      // Expecting { data: [...], total: 100 } from the new standardized APIs
      if (json.data && typeof json.total !== 'undefined') {
        setData(json.data);
        setTotal(json.total);
      } else {
        // Fallback for non-paginated APIs during transition
        setData(Array.isArray(json) ? json : []);
        setTotal(Array.isArray(json) ? json.length : 0);
      }
    } catch (err) {
      console.error(err);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, limit, search, sortBy, sortOrder, refreshTrigger]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSearch = (e) => {
    const value = e && e.target ? e.target.value : e;
    setSearch(value || '');
    setPage(1); // Reset to page 1 on new search
  };

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  return {
    data,
    total,
    loading,
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    setPage,
    setLimit,
    handleSort,
    handleSearch,
    refresh,
    rawJson
  };
}
