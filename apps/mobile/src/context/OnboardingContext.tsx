import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_BASE_URL } from '../lib/api';
import { useAuth } from './AuthContext';
import { CONFIG } from '../constants/config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CoreGoal = 'strength' | 'muscle' | 'body_composition' | 'weight_loss' | 'general_fitness' | 'performance';
export type Consistency = 'brand_new' | 'returning' | 'inconsistent' | 'consistent' | 'very_consistent';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Environment = 'commercial_gym' | 'small_gym' | 'home_gym' | 'minimal_home' | 'bodyweight_only' | 'custom';

export interface BestLift {
  exercise: string;
  reps: number;
  weight: number;
  unit: 'kg' | 'lbs';
}

export interface BodyStats {
  gender?: string;
  dob?: string;
  height?: number;
  weight?: number;
  unit: 'kg' | 'lbs';
}

export interface OnboardingState {
  step: number;
  goal?: CoreGoal;
  consistency?: Consistency;
  experience?: ExperienceLevel;
  environment?: Environment;
  equipment: string[];
  bestLifts: BestLift[];
  workoutsPerWeek: number;
  specificDays: string[];
  notificationsEnabled: boolean;
  notificationTime?: string;
  bodyStats: BodyStats;
  referralSource?: string;
}

interface OnboardingContextValue {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetOnboarding: () => void;
  syncToBackend: () => Promise<void>;
  generateProgram: () => Promise<string>;
  completeOnboarding: () => Promise<void>;
  loading: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ONBOARDING_STORAGE_KEY = 'apex_onboarding_state';

const INITIAL_STATE: OnboardingState = {
  step: 1,
  equipment: [],
  bestLifts: [],
  workoutsPerWeek: 3,
  specificDays: [],
  notificationsEnabled: false,
  bodyStats: { unit: 'kg' },
};

// ─── Context ──────────────────────────────────────────────────────────────────

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { setOnboardingComplete } = useAuth();
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  // Load state from AsyncStorage on mount
  useEffect(() => {
    async function loadState() {
      try {
        if (CONFIG.DEV_MODE) {
          console.log('[OnboardingContext] DEV_MODE: Resetting state to start fresh');
          setState(INITIAL_STATE);
          // In dev mode, we want a clean start every single time
          await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
          return;
        }
        const saved = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (saved) {
          setState(JSON.parse(saved));
        }
      } catch (err) {
        console.error('[OnboardingContext] Failed to load state:', err);
      } finally {
        setLoading(false);
      }
    }
    loadState();
  }, []);

  // Auto-save to AsyncStorage whenever state changes
  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loading]);

  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, 15) }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(INITIAL_STATE);
    AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }, []);

  const syncToBackend = useCallback(async () => {
    try {
      const res = await api.request('POST', '/api/profiles/onboarding', {
        goal: state.goal,
        experience: state.experience,
        consistency: state.consistency,
        environment: state.environment,
        equipment: state.equipment,
        workoutsPerWeek: state.workoutsPerWeek,
        bestLifts: state.bestLifts,
        bodyStats: state.bodyStats,
        referralSource: state.referralSource,
      });
      if (!res.success) {
        throw new Error((res as any).error ?? 'Failed to save profile to server');
      }
    } catch (err) {
      console.error('[OnboardingContext] Sync failed:', err);
      throw err;
    }
  }, [state]);

  const generateProgram = useCallback(async () => {
    const method = 'POST';
    const path = '/api/programs/generate';
    const fullUrl = `${API_BASE_URL}${path}`;

    try {
      // 1. Map mobile-specific goal to backend GoalType array (aligned with DB tags)
      const goalMapping: Record<string, string[]> = {
        strength: ['strength'],
        muscle: ['hypertrophy'],
        body_composition: ['hypertrophy', 'fat_loss'],
        weight_loss: ['fat_loss'],
        general_fitness: ['general_fitness'],
        performance: ['athletic_performance'],
      };

      const goals = goalMapping[state.goal || ''] || ['general_fitness'];

      // 2. Normalize equipment to singular lowercase (matches ExerciseDB/DB taxonomy)
      const equipment = (state.equipment || []).map(e => {
        const lower = e.toLowerCase();
        if (lower === 'dumbbells') return 'dumbbell';
        if (lower === 'kettlebells') return 'kettlebell';
        if (lower === 'cables') return 'cable';
        if (lower === 'pull-up bar') return 'bodyweight'; // Fallback to bodyweight if barred
        return lower;
      });

      // 3. Align field names with backend schema (src/routes/programs.ts -> generateSchema)
      const payload = {
        goals,
        experienceLevel: state.experience,
        daysPerWeek: state.workoutsPerWeek,
        equipment,
      };
      
      const { loadToken } = await import('../lib/api');
      const token = await loadToken();

      console.log('--- [FORENSIC DEBUG] generateProgram START ---');
      console.log('1. final API_BASE_URL:', API_BASE_URL);
      console.log('2. full request URL:', fullUrl);
      console.log('3. HTTP method:', method);
      console.log('4. request payload:', JSON.stringify(payload, null, 2));
      console.log('5. whether auth token exists:', !!token);

      const res = await api.request<{ program: { id: string } }>(method, path, payload);
      
      console.log('6. API Response:', {
        success: res.success,
        error: (res as any).error,
        data: res.data
      });

      if (!res.success) {
        const errMsg = (res as any).error || 'Failed to generate program';
        const isNetworkErr = errMsg.includes('Cannot reach the server') || errMsg.includes('Network request failed');
        if (isNetworkErr) {
          throw new Error(`Cannot reach the server at ${API_BASE_URL}. Ensure the backend is running on port 4001 and accessible from this device.`);
        }
        throw new Error(errMsg);
      }

      console.log('--- [FORENSIC DEBUG] generateProgram SUCCESS ---');

      const programId = res.data!.program.id;
      console.log('[OnboardingContext] assigning programId:', programId);
      const assignRes = await api.request('POST', `/api/programs/${programId}/assign`);
      console.log('[OnboardingContext] assign response: success=', assignRes.success, 'error=', (assignRes as any).error);
      if (!assignRes.success) {
        throw new Error((assignRes as any).error || 'Failed to assign program');
      }
      return programId;
    } catch (err: any) {
      console.log('--- [FORENSIC DEBUG] generateProgram FAILED ---');
      console.log('6. exact caught error object:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        ...err
      });
      console.error('[OnboardingContext] Program generation failed:', err);
      throw err;
    }
  }, [state]);

  const completeOnboarding = useCallback(async () => {
    try {
      await syncToBackend();
      // Keep a local flag if needed, but setOnboardingComplete updates the Auth state
      await AsyncStorage.setItem('onboarding_complete_verified', 'true');
      setOnboardingComplete(true);
      // Clean up onboarding state
      AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch (err) {
      console.error('[OnboardingContext] Completion failed:', err);
      throw err;
    }
  }, [syncToBackend, setOnboardingComplete]);

  return (
    <OnboardingContext.Provider
      value={{
        state,
        updateState,
        nextStep,
        prevStep,
        resetOnboarding,
        syncToBackend,
        generateProgram,
        completeOnboarding,
        loading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return ctx;
}
