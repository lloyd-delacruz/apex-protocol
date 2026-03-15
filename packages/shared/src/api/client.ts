/**
 * Apex Protocol — Shared API Client
 *
 * Used by both apps/web and apps/mobile to communicate with the backend.
 * Lightweight fetch-based wrapper — no external dependencies required.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface ApiClientOptions {
  /** Base URL of the backend API (e.g. http://localhost:4000) */
  baseUrl: string;
  /** Function to retrieve the stored auth token */
  getToken: () => string | null;
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
    const token = getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 || res.status === 403) {
      onUnauthorized?.();
    }

    const json = (await res.json()) as ApiResponse<T>;
    return json;
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  const auth = {
    register: (email: string, password: string, name: string) =>
      request<{ token: string; user: unknown }>('POST', '/api/auth/register', { email, password, name }),

    login: (email: string, password: string) =>
      request<{ token: string; user: unknown }>('POST', '/api/auth/login', { email, password }),

    logout: (refreshToken?: string) =>
      request<null>('POST', '/api/auth/logout', refreshToken ? { refreshToken } : undefined),

    refresh: (refreshToken: string) =>
      request<{ token: string; refreshToken: string; user: unknown }>('POST', '/api/auth/refresh', { refreshToken }),

    me: () =>
      request<{ user: unknown }>('GET', '/api/auth/me'),
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
  };

  // ─── Workouts ──────────────────────────────────────────────────────────────

  const workouts = {
    today: () =>
      request<{ workout: unknown }>('GET', '/api/workouts/today'),

    getByWeekAndDay: (programId: string, week: number, day: number) =>
      request<{ workoutDay: unknown }>('GET', `/api/workouts/${programId}/${week}/${day}`),
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
        ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()
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
      calories?: number;
      protein_g?: number;
      sleep_hours?: number;
      hunger?: number;
      mood?: number;
      training_performance?: number;
      notes?: string;
    }) => request<{ metrics: unknown }>('POST', '/api/metrics', data),

    history: (params?: { limit?: number; offset?: number; start_date?: string; end_date?: string }) => {
      const qs = params
        ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()
        : '';
      return request<{ metrics: unknown[]; total: number }>('GET', `/api/metrics${qs}`);
    },

    latest: () =>
      request<{ metrics: unknown }>('GET', '/api/metrics/latest'),

    recovery: () =>
      request<{ recoveryScore: number }>('GET', '/api/metrics/recovery'),
  };

  // ─── Analytics ─────────────────────────────────────────────────────────────

  const analytics = {
    dashboard: () =>
      request<{
        weeklyVolume: { week: string; volume: number }[];
        strengthTrends: unknown[];
        adherence: {
          sessionsLast4Weeks: number;
          expectedSessions: number;
          adherenceRate: number;
          streak: number;
        };
        recoveryScore: number;
        recentMetrics: unknown[];
      }>('GET', '/api/analytics/dashboard'),
  };

  return { auth, programs, workouts, trainingLog, metrics, analytics, request };
}

export type ApexApiClient = ReturnType<typeof createApiClient>;
