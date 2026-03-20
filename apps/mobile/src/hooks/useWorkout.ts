/**
 * useWorkout
 *
 * Hooks for fetching workout data from the backend.
 * Screens should call these hooks instead of calling api directly,
 * so data-fetching logic is centralized and reusable.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { TodayWorkout, TrainingHistoryLog } from '../types/workout';

// ─── useTodayWorkout ──────────────────────────────────────────────────────────

interface UseTodayWorkoutReturn {
  data: TodayWorkout | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTodayWorkout(): UseTodayWorkoutReturn {
  const [data, setData] = useState<TodayWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.workouts.today();
      if (res.success && res.data) {
        setData(res.data as TodayWorkout);
      } else {
        setError(res.error ?? 'Failed to load today\'s workout');
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

// ─── useTrainingHistory ───────────────────────────────────────────────────────

interface UseTrainingHistoryReturn {
  sessions: TrainingHistoryLog[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTrainingHistory(limit = 20): UseTrainingHistoryReturn {
  const [sessions, setSessions] = useState<TrainingHistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.trainingLog.history({ limit });
      if (res.success && res.data) {
        setSessions(res.data.logs as TrainingHistoryLog[]);
      } else {
        setError(res.error ?? 'Failed to load training history');
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { sessions, loading, error, refresh: fetch };
}
