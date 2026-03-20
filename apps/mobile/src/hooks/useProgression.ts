/**
 * useProgression
 *
 * Hook for the weight progression system.
 * Fetches pending progression prompts and provides confirm/dismiss actions.
 *
 * Used in WorkoutScreen to show "Ready to progress?" prompts
 * after the user achieves all top-set reps.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { progression as progressionService } from '../services/api';
import type { PendingProgression } from '../types/api';

interface UseProgressionReturn {
  pending: PendingProgression[];
  loading: boolean;
  error: string | null;
  confirm: (progressionId: string, confirmedWeight: number) => Promise<void>;
  dismiss: (progressionId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProgression(): UseProgressionReturn {
  const [pending, setPending] = useState<PendingProgression[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const confirmSnapshot = useRef<PendingProgression[]>([]);
  const dismissSnapshot = useRef<PendingProgression[]>([]);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await progressionService.pending();
      if (res.success && res.data) {
        setPending(res.data.progressions ?? []);
      } else {
        setError(res.error ?? 'Failed to load progressions');
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const confirm = useCallback(async (progressionId: string, confirmedWeight: number) => {
    // Optimistic update — remove immediately so UI feels instant
    setPending((prev) => {
      const next = prev.filter((p) => p.id !== progressionId);
      // Store snapshot in closure for rollback
      confirmSnapshot.current = prev;
      return next;
    });
    try {
      const res = await progressionService.confirm({ progressionId, confirmedWeight });
      if (!res.success) {
        setPending(confirmSnapshot.current ?? []);
        setError(res.error ?? 'Failed to confirm progression. Please try again.');
      }
    } catch (e: any) {
      setPending(confirmSnapshot.current ?? []);
      setError(e.message ?? 'Network error. Your progression was not saved.');
    }
  }, []);

  const dismiss = useCallback(async (progressionId: string) => {
    setPending((prev) => {
      const next = prev.filter((p) => p.id !== progressionId);
      dismissSnapshot.current = prev;
      return next;
    });
    try {
      const res = await progressionService.dismiss(progressionId);
      if (!res.success) {
        setPending(dismissSnapshot.current ?? []);
        setError(res.error ?? 'Failed to dismiss. Please try again.');
      }
    } catch (e: any) {
      setPending(dismissSnapshot.current ?? []);
      setError(e.message ?? 'Network error.');
    }
  }, []);

  return { pending, loading, error, confirm, dismiss, refresh: fetch };
}
