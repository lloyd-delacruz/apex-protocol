/**
 * useProgression
 *
 * Hook for the weight progression system.
 * Fetches pending progression prompts and provides confirm/dismiss actions.
 *
 * Used in WorkoutScreen to show "Ready to progress?" prompts
 * after the user achieves all top-set reps.
 */

import { useState, useEffect, useCallback } from 'react';
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
    await progressionService.confirm({ progressionId, confirmedWeight });
    // Remove the confirmed item from pending list immediately (optimistic update)
    setPending((prev) => prev.filter((p) => p.id !== progressionId));
  }, []);

  const dismiss = useCallback(async (progressionId: string) => {
    await progressionService.dismiss(progressionId);
    setPending((prev) => prev.filter((p) => p.id !== progressionId));
  }, []);

  return { pending, loading, error, confirm, dismiss, refresh: fetch };
}
