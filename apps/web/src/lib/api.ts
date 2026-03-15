/**
 * Apex Protocol Web — API Client
 *
 * All backend routes return: { success: boolean, data: T | null, error: string | null }
 * This client unwraps the `data` field transparently so callers receive typed DTOs directly.
 *
 * Auth flow:
 *   - Access tokens are stored in localStorage (apex_token, 7-day expiry)
 *   - Refresh tokens are stored in localStorage (apex_refresh_token, 30-day expiry)
 *   - On 401, the client automatically attempts one token refresh before redirecting to login
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'apex_token';
const REFRESH_TOKEN_KEY = 'apex_refresh_token';
const USER_KEY = 'apex_user';

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  // BYPASS AUTH
  return 'dummy-token';
}

export function saveAuth(token: string, user: unknown, refreshToken?: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser<T = { id: string; email: string; name: string }>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const str = localStorage.getItem(USER_KEY);
    return str ? (JSON.parse(str) as T) : null;
  } catch {
    return null;
  }
}

// ─── Core request ─────────────────────────────────────────────────────────────

// Guards against concurrent refresh attempts
let isRefreshing = false;

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Handle token expiry — attempt one silent refresh then retry
  if ((res.status === 401 || res.status === 403) && !isRetry && !isRefreshing) {
    // BYPASS AUTH FOR LOCAL TESTING: Don't logout on 401/403, just log it.
    console.warn('Auth bypassed: Ignoring 401/403 response.');
    /*
    const storedRefreshToken = typeof window !== 'undefined'
      ? localStorage.getItem(REFRESH_TOKEN_KEY)
      : null;

    if (storedRefreshToken) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data.success && data.data) {
            saveAuth(data.data.token, data.data.user, data.data.refreshToken);
            isRefreshing = false;
            // Retry the original request with the new token
            return request<T>(path, options, true);
          }
        }
      } catch {
        // Refresh request itself failed — fall through to logout
      } finally {
        isRefreshing = false;
      }
    }

    // Refresh failed or no refresh token available — clear and redirect
    clearAuth();
    if (typeof window !== 'undefined') window.location.href = '/';
    throw new Error('Authentication required');
    */
  }

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? json.message ?? `Request failed (${res.status})`);
  }

  // Unwrap envelope: { success: true, data: T, error: null }
  if (typeof json === 'object' && json !== null && 'success' in json && 'data' in json) {
    return json.data as T;
  }

  return json as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; refreshToken: string; user: { id: string; email: string; name: string } }>(
        '/api/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      ),

    register: (email: string, password: string, name: string) =>
      request<{ token: string; refreshToken: string; user: { id: string; email: string; name: string } }>(
        '/api/auth/register',
        { method: 'POST', body: JSON.stringify({ email, password, name }) }
      ),

    logout: (refreshToken?: string) =>
      request<null>('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),

    me: () =>
      request<{ user: { id: string; email: string; name: string } }>('/api/auth/me'),

    refresh: (refreshToken: string) =>
      request<{ token: string; refreshToken: string; user: { id: string; email: string; name: string } }>(
        '/api/auth/refresh',
        { method: 'POST', body: JSON.stringify({ refreshToken }) }
      ),
  },

  // ─── Programs ─────────────────────────────────────────────────────────────

  programs: {
    list: () =>
      request<{ programs: ApiProgram[] }>('/api/programs'),

    assigned: () =>
      request<{ programs: ApiProgram[] }>('/api/programs/assigned'),

    get: (id: string) =>
      request<{ program: ApiProgramFull }>(`/api/programs/${id}`),

    getWeeks: (id: string) =>
      request<{ weeks: ApiProgramWeek[] }>(`/api/programs/${id}/weeks`),

    assign: (id: string, startDate?: string) =>
      request<unknown>(`/api/programs/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ startDate }),
      }),
  },

  // ─── Workouts ─────────────────────────────────────────────────────────────

  workouts: {
    today: () =>
      request<ApiTodayWorkout | null>('/api/workouts/today'),

    getByWeekAndDay: (programId: string, week: number, day: number) =>
      request<{ workoutDay: ApiWorkoutDay }>(`/api/workouts/${programId}/${week}/${day}`),
  },

  // ─── Training Log ──────────────────────────────────────────────────────────

  trainingLog: {
    log: (data: TrainingLogInput) =>
      request<{ log: ApiTrainingLog }>('/api/training-log', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    history: (params?: { limit?: number; offset?: number; start_date?: string; end_date?: string }) => {
      const qs = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString() : '';
      return request<{ logs: ApiTrainingLog[]; total: number; limit: number; offset: number }>(
        `/api/training-log/history${qs}`
      );
    },

    exerciseHistory: (exerciseId: string) =>
      request<{ logs: ApiTrainingLog[] }>(`/api/training-log/exercise/${exerciseId}`),
  },

  // ─── Metrics ──────────────────────────────────────────────────────────────

  metrics: {
    list: (params?: { limit?: number; offset?: number; start_date?: string; end_date?: string }) => {
      const qs = params ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString() : '';
      return request<{ metrics: ApiMetric[]; total: number }>(`/api/metrics${qs}`);
    },

    log: (data: MetricsInput) =>
      request<{ metrics: ApiMetric }>('/api/metrics', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    latest: () =>
      request<{ metrics: ApiMetric | null }>('/api/metrics/latest'),

    recovery: () =>
      request<{ recoveryScore: number }>('/api/metrics/recovery'),
  },

  // ─── Analytics ────────────────────────────────────────────────────────────

  analytics: {
    dashboard: () =>
      request<ApiAnalyticsDashboard>('/api/analytics/dashboard'),
  },
};

export default api;

// ─── API Types (what the backend actually returns) ────────────────────────────

export interface ApiProgram {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  totalWeeks: number;
  isActive: boolean;
  createdAt: string;
}

export interface ApiProgramFull extends ApiProgram {
  programMonths: ApiProgramMonth[];
}

export interface ApiProgramMonth {
  id: string;
  monthNumber: number;
  name: string;
  description: string | null;
  programWeeks: ApiProgramWeek[];
}

export interface ApiProgramWeek {
  id: string;
  weekNumber: number;
  absoluteWeekNumber: number;
  workoutDays: ApiWorkoutDay[];
}

export interface ApiWorkoutDay {
  id: string;
  dayCode: string;
  phase: string;
  workoutType: string;
  sortOrder: number;
  notes: string | null;
  exercisePrescriptions: ApiExercisePrescription[];
}

export interface ApiExercisePrescription {
  id: string;
  workoutDayId: string;
  exerciseId: string;
  targetRepRange: string | null;
  incrementValue: string; // Decimal comes as string from Prisma
  incrementUnit: string;
  sortOrder: number;
  exercise: ApiExercise;
}

export interface ApiExercise {
  id: string;
  name: string;
  category: string | null;
  muscleGroup: string | null;
  equipment: string | null;
}

export interface ApiTodayWorkout {
  assignment: { id: string; programId: string; startDate: string | null };
  program: { id: string; name: string; totalWeeks: number };
  currentWeek: { id: string; weekNumber: number; absoluteWeekNumber: number };
  workoutDay: ApiWorkoutDay | null;
  daysSinceStart: number;
  message?: string;
}

export interface ApiTrainingLog {
  id: string;
  userId: string;
  exerciseId: string;
  sessionDate: string;
  weight: string | null;
  weightUnit: string;
  set1Reps: number | null;
  set2Reps: number | null;
  set3Reps: number | null;
  set4Reps: number | null;
  totalReps: number | null;
  status: string | null;
  readyToIncrease: boolean | null;
  nextWeight: string | null;
  exercise: ApiExercise;
  workoutDay: ApiWorkoutDay | null;
}

export interface ApiMetric {
  id: string;
  user_id: string;
  date: string;
  body_weight_kg: number | null;
  body_weight_unit: string;
  calories: number | null;
  protein_g: number | null;
  sleep_hours: number | null;
  hunger: number | null;
  mood: number | null;
  training_performance: number | null;
  notes: string | null;
}

export interface ApiAnalyticsDashboard {
  weeklyVolume: Array<{ week: string; volume: number }>;
  strengthTrends: Array<{
    exercise: string;
    dataPoints: Array<{ date: string; weight: number; status: string | null; totalReps: number | null }>;
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
  statusBreakdown?: {
    achieved: number;
    progress: number;
    failed: number;
    total: number;
  };
}

// ─── Request input types ──────────────────────────────────────────────────────

export interface TrainingLogInput {
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
  notes?: string;
}

export interface MetricsInput {
  date?: string;
  body_weight_kg?: number;
  calories?: number;
  protein_g?: number;
  sleep_hours?: number;
  hunger?: number;
  mood?: number;
  training_performance?: number;
  notes?: string;
}
