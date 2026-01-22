import { useState, useEffect, useCallback, useRef } from 'react';

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds default TTL

/**
 * Get cached data with TTL check
 */
function getCachedData(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Set cache with TTL
 */
function setCachedData(key, data, ttl = CACHE_TTL) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}

/**
 * Invalidate cache by key or pattern
 */
export function invalidateCache(keyOrPattern) {
  if (typeof keyOrPattern === 'string') {
    // Exact key match
    cache.delete(keyOrPattern);
    // Also invalidate pattern matches
    for (const key of cache.keys()) {
      if (key.startsWith(keyOrPattern)) {
        cache.delete(key);
      }
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  cache.clear();
}

/**
 * Custom hook for API calls with caching
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} { data, loading, error, refetch }
 */
export function useApiCache(apiFunction, options = {}) {
  const {
    cacheKey,
    params = {},
    ttl = CACHE_TTL,
    enabled = true,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const paramsRef = useRef(params);

  // Generate cache key from function name and params
  const generateCacheKey = useCallback(() => {
    if (cacheKey) return cacheKey;
    const paramString = JSON.stringify(params);
    return `${apiFunction.name || 'api'}_${paramString}`;
  }, [cacheKey, params, apiFunction]);

  const fetchData = useCallback(async (skipCache = false) => {
    const key = generateCacheKey();
    
    // Check cache first (unless skipCache)
    if (!skipCache) {
      const cachedData = getCachedData(key);
      if (cachedData) {
        setData(cachedData);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFunction(params);
      const responseData = response.data;
      
      if (mountedRef.current) {
        setData(responseData);
        setCachedData(key, responseData, ttl);
        onSuccess?.(responseData);
      }
      
      return responseData;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        onError?.(err);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunction, params, ttl, generateCacheKey, onSuccess, onError]);

  // Refetch function that bypasses cache
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Initial fetch when enabled
  useEffect(() => {
    mountedRef.current = true;
    
    // Check if params changed
    const paramsChanged = JSON.stringify(params) !== JSON.stringify(paramsRef.current);
    paramsRef.current = params;

    if (enabled) {
      fetchData(paramsChanged); // Skip cache if params changed
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled, fetchData, JSON.stringify(params)]);

  return { data, loading, error, refetch };
}

/**
 * Hook for managing list data with optimistic updates
 */
export function useOptimisticList(initialData = []) {
  const [items, setItems] = useState(initialData);
  const [pendingOperations, setPendingOperations] = useState([]);

  const addItem = useCallback((item, apiCall) => {
    const tempId = `temp_${Date.now()}`;
    const tempItem = { ...item, _id: tempId, _isPending: true };
    
    setItems(prev => [tempItem, ...prev]);
    setPendingOperations(prev => [...prev, tempId]);

    return apiCall()
      .then(response => {
        setItems(prev => prev.map(i => 
          i._id === tempId ? { ...response.data.data, _isPending: false } : i
        ));
        return response;
      })
      .catch(error => {
        setItems(prev => prev.filter(i => i._id !== tempId));
        throw error;
      })
      .finally(() => {
        setPendingOperations(prev => prev.filter(id => id !== tempId));
      });
  }, []);

  const updateItem = useCallback((id, updates, apiCall) => {
    setItems(prev => prev.map(item => 
      item._id === id ? { ...item, ...updates, _isPending: true } : item
    ));

    return apiCall()
      .then(response => {
        setItems(prev => prev.map(item => 
          item._id === id ? { ...response.data.data, _isPending: false } : item
        ));
        return response;
      })
      .catch(error => {
        // Revert on error - you might want to store previous state
        throw error;
      });
  }, []);

  const removeItem = useCallback((id, apiCall) => {
    const removedItem = items.find(i => i._id === id);
    setItems(prev => prev.filter(i => i._id !== id));

    return apiCall()
      .catch(error => {
        // Revert on error
        if (removedItem) {
          setItems(prev => [removedItem, ...prev]);
        }
        throw error;
      });
  }, [items]);

  return {
    items,
    setItems,
    addItem,
    updateItem,
    removeItem,
    isPending: pendingOperations.length > 0
  };
}

export default useApiCache;
