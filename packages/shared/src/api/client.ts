/**
 * Apex Protocol — Shared API Client
 *
 * Used by both apps/web and apps/mobile to communicate with the backend.
 * Lightweight fetch-based wrapper — no external dependencies required.
 */

import { TrainingStatus } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface ApiClientOptions {
  /** Base URL of the backend API (e.g. http://localhost:4000) */
  baseUrl: string;
  /** Function to retrieve the stored auth token (can be async for React Native) */
  getToken: () => string | null | Promise<string | null>;
  /** Called when a 401/403 is received — use to trigger logout */
  onUnauthorized?: () => void;
}

// ─── Client factory ───────────────────────────────────────────────────────────

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, getToken, onUnauthorized } = options;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const token = await getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        onUnauthorized?.();
        return { success: false, data: null, error: 'Session expired. Please sign in again.' };
      }

      const json = (await res.json()) as ApiResponse<T>;
      return json;
    } catch (err: any) {
      clearTimeout(timeoutId);
      // AbortError = timeout; otherwise network failure
      const isTimeout = err?.name === 'AbortError';
      const message = isTimeout
        ? 'Request timed out. Check your connection and try again.'
        : err?.message === 'Network request failed'
          ? 'Cannot reach the server. Check your internet connection.'
          : err?.message ?? 'Network request failed';
      return { success: false, data: null, error: message };
    }
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  const auth = {
    register: (email: string, password: string, name: string) =>
      request<{ token: string; refreshToken: string; user: { id: string; email: string; name: string; firstName?: string | null; lastName?: string | null; onboardingComplete?: boolean; subscriptionActive?: boolean } }>('POST', '/api/auth/register', { email, password, name }),

    login: (email: string, password: string) =>
      request<{ token: string; refreshToken: string; user: { id: string; email: string; name: string; firstName?: string | null; lastName?: string | null; onboardingComplete?: boolean; subscriptionActive?: boolean } }>('POST', '/api/auth/login', { email, password }),

    logout: (refreshToken?: string) =>
      request<null>('POST', '/api/auth/logout', refreshToken ? { refreshToken } : undefined),

    refresh: (refreshToken: string) =>
      request<{ token: string; refreshToken: string; user: { id: string; email: string; name: string; firstName?: string | null; lastName?: string | null; onboardingComplete?: boolean; subscriptionActive?: boolean } }>('POST', '/api/auth/refresh', { refreshToken }),

    me: () =>
      request<{ user: { id: string; email: string; name: string; firstName?: string | null; lastName?: string | null; onboardingComplete?: boolean; subscriptionActive?: boolean } }>('GET', '/api/auth/me'),
  };

  // ─── Programs ──────────────────────────────────────────────────────────────

  const programs = {
    list: () =>
      request<{ programs: unknown[] }>('GET', '/api/programs'),

    assigned: () =>
      request<{ programs: unknown[] }>('GET', '/api/programs/assigned'),

    get: (id: string) =>
      request<{ program: unknown }>('GET', `/api/programs/${id}`),

    getWeeks: (id: string) =>
      request<{ weeks: unknown[] }>('GET', `/api/programs/${id}/weeks`),

    assign: (id: string, startDate?: string) =>
      request<unknown>('POST', `/api/programs/${id}/assign`, { startDate }),

    generate: (data: any) =>
      request<{ id: string }>('POST', '/api/programs/generate', data),
  };

  // ─── Profiles ──────────────────────────────────────────────────────────────

  const profiles = {
    getOnboarding: () =>
      request<unknown>('GET', '/api/profiles/onboarding'),

    saveOnboarding: (data: any) =>
      request<unknown>('POST', '/api/profiles/onboarding', data),

    saveUser: (data: any) =>
      request<unknown>('POST', '/api/profiles/user', data),

    getNotifications: () =>
      request<unknown>('GET', '/api/profiles/notifications'),

    saveNotifications: (data: any) =>
      request<unknown>('POST', '/api/profiles/notifications', data),
  };

  // ─── Workouts ──────────────────────────────────────────────────────────────

  const workouts = {
    today: () =>
      request<{
        assignment: { id: string; programId: string; startDate: string | null };
        program: { id: string; name: string; totalWeeks: number };
        currentWeek: { id: string; weekNumber: number; absoluteWeekNumber: number };
        workoutDay: {
          id: string;
          workoutType: string;
          phase: string;
          exercisePrescriptions: Array<{
            id: string;
            exerciseId: string;
            targetRepRange: string | null;
            targetSets: number | null;
            sortOrder: number;
            suggestedWeight: number;
            weightUnit: string;
            exercise: { id: string; name: string; muscleGroup: string | null; mediaUrl: string | null };
          }>;
        } | null;
      }>('GET', '/api/workouts/today'),

    getByWeekAndDay: (programId: string, week: number, day: number) =>
      request<{ workoutDay: unknown }>('GET', `/api/workouts/${programId}/${week}/${day}`),

    startSession: (data: { workoutDayId: string }) =>
      request<{ session: { id: string }; sessionExercises: any[] }>('POST', '/api/workouts/session/start', data),

    logSet: (sessionExerciseId: string, data: any) =>
      request<unknown>('POST', `/api/workouts/session/exercises/${sessionExerciseId}/sets`, data),

    finishSession: (data: { sessionId: string }) =>
      request<unknown>('POST', '/api/workouts/session/finish', data),

    addSessionExercise: (data: { sessionId: string; exerciseId: string; orderIndex?: number }) =>
      request<unknown>('POST', '/api/workouts/session/exercises', data),

    updateSessionExercise: (sessionExerciseId: string, exerciseId: string) =>
      request<unknown>('PATCH', `/api/workouts/session/exercises/${sessionExerciseId}`, { exerciseId }),

    removeSessionExercise: (sessionExerciseId: string) =>
      request<unknown>('DELETE', `/api/workouts/session/exercises/${sessionExerciseId}`),
  };

  // ─── Exercises ─────────────────────────────────────────────────────────────

  /** Canonical exercise shape returned by all /api/exercises endpoints */
  type ExerciseRecord = {
    id: string;
    name: string;
    muscleGroup: string | null;
    bodyPart: string | null;
    equipment: string | null;
    category: string | null;
    movementPattern: string | null;
    exerciseType: string | null;
    primaryMuscle: string | null;
    mediaUrl: string | null;
    isCompound: boolean;
    isUnilateral: boolean;
  };

  const exercises = {
    list: (params?: Record<string, string | number | boolean | undefined>) => {
      const filtered = params
        ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
        : undefined;
      const qs = filtered && Object.keys(filtered).length > 0
        ? '?' + new URLSearchParams(filtered).toString()
        : '';
      return request<{ exercises: ExerciseRecord[]; total: number }>('GET', `/api/exercises${qs}`);
    },

    search: (q: string) =>
      request<{ exercises: ExerciseRecord[] }>('GET', `/api/exercises/search?q=${encodeURIComponent(q)}`),

    get: (id: string) =>
      request<{ exercise: ExerciseRecord }>('GET', `/api/exercises/${id}`),

    getSubstitutions: (id: string) =>
      request<{ substitutions: Array<{ id: string; priorityRank: number; notes: string | null; substituteExercise: ExerciseRecord }> }>('GET', `/api/exercises/${id}/substitutions`),
  };

  // ─── Training Log ──────────────────────────────────────────────────────────

  const trainingLog = {
    log: (data: {
      exerciseId: string;
      sessionDate?: string;
      programId?: string;
      programWeekId?: string;
      workoutDayId?: string;
      exercisePrescriptionId?: string;
      weight?: number;
      weightUnit?: string;
      set1Reps?: number;
      set2Reps?: number;
      set3Reps?: number;
      set4Reps?: number;
      rir?: number;
      notes?: string;
    }) => request<{ log: unknown }>('POST', '/api/training-log', data),

    history: (params?: { limit?: number; offset?: number; start_date?: string; end_date?: string }) => {
      const qs = params
        ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))).toString()
        : '';
      return request<{ logs: unknown[]; total: number; limit: number; offset: number }>(
        'GET',
        `/api/training-log/history${qs}`
      );
    },

    exerciseHistory: (exerciseId: string) =>
      request<{ logs: unknown[] }>('GET', `/api/training-log/exercise/${exerciseId}`),
  };

  // ─── Metrics ───────────────────────────────────────────────────────────────

  const metrics = {
    log: (data: {
      date?: string;
      body_weight_kg?: number;
      body_weight_unit?: string;
      calories?: number;
      protein_g?: number;
      sleep_hours?: number;
      hunger?: number;
      mood?: number;
      training_performance?: number;
      binge_urge?: number;
      notes?: string;
    }) => request<{ metrics: { id: string; date: string; body_weight_kg: number | null; body_weight_unit: string; calories: number | null; protein_g: number | null; sleep_hours: number | null; hunger: number | null; binge_urge: number | null; mood: number | null; training_performance: number | null; notes: string | null } }>('POST', '/api/metrics', data),

    history: (params?: { limit?: number; offset?: number; start_date?: string; end_date?: string }) => {
      const qs = params
        ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))).toString()
        : '';
      return request<{ metrics: Array<{ id: string; date: string; body_weight_kg: number | null; body_weight_unit: string; calories: number | null; protein_g: number | null; sleep_hours: number | null; hunger: number | null; binge_urge: number | null; mood: number | null; training_performance: number | null; notes: string | null }>; total: number; limit: number; offset: number }>('GET', `/api/metrics${qs}`);
    },

    latest: () =>
      request<{ metrics: { id: string; date: string; body_weight_kg: number | null; body_weight_unit: string; calories: number | null; protein_g: number | null; sleep_hours: number | null; hunger: number | null; binge_urge: number | null; mood: number | null; training_performance: number | null; notes: string | null } | null }>('GET', '/api/metrics/latest'),

    recovery: () =>
      request<{ recoveryScore: number }>('GET', '/api/metrics/recovery'),
  };

  // ─── Analytics ─────────────────────────────────────────────────────────────

  const analytics = {
    dashboard: () =>
      request<{
        weeklyVolume: Array<{ week: string; volume: number }>;
        strengthTrends: Array<{
          exercise: string;
          dataPoints: Array<{ date: string; weight: number; status: TrainingStatus | null; totalReps: number | null }>;
          currentWeight: number;
          weightChangePct: number;
        }>;
        adherence: {
          sessionsLast4Weeks: number;
          expectedSessions: number;
          adherenceRate: number;
          streak: number;
        };
        recoveryScore: number;
        recentMetrics: Array<{
          id: string;
          date: string;
          body_weight_kg: number | null;
          mood: number | null;
          sleep_hours: number | null;
          training_performance: number | null;
        }>;
        statusBreakdown: {
          achieved: number;
          progress: number;
          failed: number;
          total: number;
        };
      }>('GET', '/api/analytics/dashboard'),
  };

  return { auth, programs, profiles, workouts, exercises, trainingLog, metrics, analytics, request };
}

export type ApexApiClient = ReturnType<typeof createApiClient>;
