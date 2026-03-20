/**
 * useProgress
 *
 * Hook for analytics dashboard data (strength trends, volume, performance).
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { DashboardAnalytics } from '../types/api';

interface UseProgressReturn {
  data: DashboardAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProgress(): UseProgressReturn {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.analytics.dashboard();
      if (res.success && res.data) {
        setData(res.data as unknown as DashboardAnalytics);
      } else {
        setError(res.error ?? 'Failed to load analytics');
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
