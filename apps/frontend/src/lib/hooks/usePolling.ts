/**
 * usePolling Hook
 * Generic polling hook for fetching data at regular intervals
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetwork } from '@/lib/context/NetworkContext';

interface UsePollingOptions<T> {
  /**
   * Function to fetch data
   */
  fetchFn: () => Promise<T>;
  /**
   * Polling interval in milliseconds (default: 30000 = 30 seconds)
   */
  interval?: number;
  /**
   * Whether polling is enabled (default: true)
   */
  enabled?: boolean;
  /**
   * A key that when changed will reset the cached data (useful for user changes)
   */
  key?: string | null;
  /**
   * Callback on successful fetch
   */
  onSuccess?: (data: T) => void;
  /**
   * Callback on fetch error
   */
  onError?: (error: Error) => void;
  /**
   * Whether to refetch when window gains focus (default: true)
   */
  refetchOnFocus?: boolean;
  /**
   * Whether to refetch when coming back online (default: true)
   */
  refetchOnReconnect?: boolean;
}

interface UsePollingResult<T> {
  /**
   * The fetched data
   */
  data: T | null;
  /**
   * Whether the initial fetch is loading
   */
  isLoading: boolean;
  /**
   * Whether a refetch is in progress
   */
  isRefetching: boolean;
  /**
   * Any error that occurred during fetching
   */
  error: Error | null;
  /**
   * Manually trigger a refetch
   */
  refetch: () => Promise<void>;
  /**
   * Whether currently offline
   */
  isOffline: boolean;
}

export function usePolling<T>(options: UsePollingOptions<T>): UsePollingResult<T> {
  const {
    fetchFn,
    interval = 30000,
    enabled = true,
    key,
    onSuccess,
    onError,
    refetchOnFocus = true,
    refetchOnReconnect = true,
  } = options;

  const { isOnline } = useNetwork();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchFnRef = useRef(fetchFn);
  const wasOfflineRef = useRef(!isOnline);
  const previousKeyRef = useRef(key);

  // Keep fetchFn reference up to date
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  // Reset data when key changes (e.g., user changes)
  useEffect(() => {
    if (previousKeyRef.current !== key) {
      setData(null);
      setError(null);
      setIsLoading(true);
      previousKeyRef.current = key;
    }
  }, [key]);

  const fetch = useCallback(
    async (isInitial = false) => {
      if (!enabled) return;

      // Don't fetch if offline (unless we have no data yet for offline fallback)
      if (!isOnline && data !== null) return;

      try {
        if (isInitial) {
          setIsLoading(true);
        } else {
          setIsRefetching(true);
        }

        const result = await fetchFnRef.current();
        setData(result);
        setError(null);
        onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Fetch failed');
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
        setIsRefetching(false);
      }
    },
    [enabled, isOnline, data, onSuccess, onError]
  );

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetch(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Polling interval
  useEffect(() => {
    if (enabled && isOnline && interval > 0) {
      intervalRef.current = setInterval(() => fetch(false), interval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetch, enabled, isOnline, interval]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus || !enabled) return;

    const handleFocus = () => {
      if (isOnline) {
        fetch(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetch, refetchOnFocus, enabled, isOnline]);

  // Refetch when coming back online
  useEffect(() => {
    if (!refetchOnReconnect || !enabled) return;

    // If we were offline and now we're online, refetch
    if (wasOfflineRef.current && isOnline) {
      fetch(false);
    }

    wasOfflineRef.current = !isOnline;
  }, [isOnline, refetchOnReconnect, enabled, fetch]);

  const refetch = useCallback(async () => {
    await fetch(false);
  }, [fetch]);

  return {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
    isOffline: !isOnline,
  };
}

export default usePolling;
