/**
 * useMetrics
 *
 * Hooks for body metrics data (weight, calories, sleep, mood, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { MetricEntry } from '../types/api';

// ─── useLatestMetrics ─────────────────────────────────────────────────────────

interface UseLatestMetricsReturn {
  metrics: MetricEntry | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLatestMetrics(): UseLatestMetricsReturn {
  const [metrics, setMetrics] = useState<MetricEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.metrics.latest();
      if (res.success && res.data) {
        setMetrics(res.data.metrics);
      } else {
        setError(res.error ?? 'Failed to load metrics');
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { metrics, loading, error, refresh: fetch };
}

// ─── useMetricsHistory ────────────────────────────────────────────────────────

interface UseMetricsHistoryReturn {
  entries: MetricEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMetricsHistory(limit = 30): UseMetricsHistoryReturn {
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.metrics.history({ limit });
      if (res.success && res.data) {
        setEntries(res.data.metrics);
      } else {
        setError(res.error ?? 'Failed to load metrics history');
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { entries, loading, error, refresh: fetch };
}

// ─── useRecoveryScore ─────────────────────────────────────────────────────────

interface UseRecoveryScoreReturn {
  score: number | null;
  loading: boolean;
  error: string | null;
}

export function useRecoveryScore(): UseRecoveryScoreReturn {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.metrics.recovery().then((res) => {
      if (res.success && res.data) {
        setScore(res.data.recoveryScore);
      } else {
        setError(res.error ?? 'Failed to load recovery score');
      }
      setLoading(false);
    }).catch((e: any) => {
      setError(e.message);
      setLoading(false);
    });
  }, []);

  return { score, loading, error };
}
