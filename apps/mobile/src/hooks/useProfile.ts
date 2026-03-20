/**
 * useProfile
 *
 * Hook for fetching the user's onboarding profile/preferences.
 * Exposes the full OnboardingProfile so screens can read any field
 * set during onboarding (goal, consistency, experience, workoutsPerWeek, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { OnboardingProfile } from '../types/api';

interface UseProfileReturn {
  profile: OnboardingProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.profiles.getOnboarding();
      if (res.success) {
        // data can be null for a new user with no profile yet — not an error
        setProfile(res.data as OnboardingProfile | null);
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
