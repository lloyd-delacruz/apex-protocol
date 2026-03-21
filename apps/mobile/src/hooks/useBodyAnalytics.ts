import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { ApiResponse } from '@apex/shared';

export interface MuscleAnalytic {
  name: string;
  lastWorkedAt: string | null;
  totalSets: number;
  recentExercises: string[];
  isFresh: boolean;
}

export interface BodyAnalyticsData {
  weeklyVolume: { week: string; volume: number }[];
  strengthTrends: any[];
  adherence: {
    sessionsLast4Weeks: number;
    expectedSessions: number;
    adherenceRate: number;
    streak: number;
  };
  recoveryScore: number;
  muscleAnalytics: MuscleAnalytic[];
  recentMetrics: any[];
}

interface UseBodyAnalyticsReturn {
  data: BodyAnalyticsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBodyAnalytics(): UseBodyAnalyticsReturn {
  const [data, setData] = useState<BodyAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Using the dashboard endpoint which now includes muscleAnalytics
      const res = await api.request('GET', '/api/analytics/dashboard') as ApiResponse<BodyAnalyticsData>;
      
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error ?? 'Failed to load body analytics');
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
