/**
 * useProfile
 *
 * Hook for fetching the user's profile/onboarding preferences.
 * Used to read settings like workoutsPerWeek that were set during onboarding.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface UserProfile {
  workoutsPerWeek: number;
}

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.request<{ workoutsPerWeek?: number }>('GET', '/api/profiles/onboarding');
      if (res.success && res.data) {
        setProfile({ workoutsPerWeek: res.data.workoutsPerWeek ?? 4 });
      } else {
        setError(res.error ?? 'Failed to load profile');
      }
    } catch (e: any) {
      setError(e.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { profile, loading, error, refresh: fetch };
}
