/**
 * useExercises
 *
 * Hooks for the exercise library.
 * Used in ExercisePicker and exercise detail screens.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { ExerciseItem } from '../types/api';

interface UseExercisesOptions {
  query?: string;
  muscleGroup?: string;
  equipment?: string;
  limit?: number;
  enabled?: boolean; // set false to defer fetching
}

interface UseExercisesReturn {
  exercises: ExerciseItem[];
  loading: boolean;
  error: string | null;
  search: (q: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useExercises(options: UseExercisesOptions = {}): UseExercisesReturn {
  const { query, muscleGroup, equipment, limit = 100, enabled = true } = options;

  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = useCallback(async (searchQuery?: string) => {
    try {
      setLoading(true);
      setError(null);

      let res;
      if (searchQuery && searchQuery.length > 1) {
        res = await api.exercises.search(searchQuery);
        if (res.success && res.data) {
          setExercises((res.data.exercises ?? []) as ExerciseItem[]);
        }
      } else {
        const params: Record<string, string> = { limit: String(limit) };
        if (muscleGroup) params.muscleGroup = muscleGroup;
        if (equipment) params.equipment = equipment;
        res = await api.exercises.list(params);
        if (res.success && res.data) {
          setExercises((res.data.exercises ?? []) as ExerciseItem[]);
        }
      }

      if (res && !res.success) {
        setError(res.error ?? 'Failed to load exercises');
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, [muscleGroup, equipment, limit]);

  useEffect(() => {
    if (enabled) fetchExercises(query);
  }, [enabled, fetchExercises, query]);

  const search = useCallback((q: string) => fetchExercises(q), [fetchExercises]);

  return { exercises, loading, error, search, refresh: () => fetchExercises(query) };
}
