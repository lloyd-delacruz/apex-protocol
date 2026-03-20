/**
 * API Response Types — Mobile
 *
 * Canonical shapes for every backend API response consumed by the mobile app.
 * These are derived directly from backend service/route implementations.
 * Do not use `any` or `unknown` here — every field must be explicitly typed.
 */

import { TrainingStatus } from '@apex/shared';

// ─── Standard API envelope ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Shape of the user object returned by /auth/login, /auth/register, /auth/me */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  onboardingComplete?: boolean;
  subscriptionActive?: boolean;
}

/** Full response body from POST /auth/login and POST /auth/register */
export interface AuthResponseData {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── Body metrics (GET /api/metrics, GET /api/metrics/latest) ─────────────────

/**
 * A single metric entry as normalised by the backend route.
 * Field names match the snake_case output of the `normaliseMetric()` helper
 * in backend/src/routes/metrics.ts.
 */
export interface MetricEntry {
  id: string;
  date: string;             // YYYY-MM-DD
  body_weight_kg: number | null;
  body_weight_unit: string; // 'kg' | 'lb'
  calories: number | null;
  protein_g: number | null;
  sleep_hours: number | null;
  hunger: number | null;    // 1–10
  binge_urge: number | null;
  mood: number | null;      // 1–10
  training_performance: number | null; // 1–10
  notes: string | null;
}

// ─── Analytics dashboard (GET /api/analytics/dashboard) ──────────────────────

/** Shape returned by AnalyticsService.getDashboardAnalytics() */
export interface DashboardAnalytics {
  weeklyVolume: Array<{ week: string; volume: number }>;
  strengthTrends: Array<{
    exercise: string;
    dataPoints: Array<{
      date: string;
      weight: number;
      status: TrainingStatus | null;
      totalReps: number | null;
    }>;
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
  /** Recent metric entries (last 7 days) normalised to snake_case */
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
}

// ─── Onboarding profile (GET /api/profiles/onboarding) ───────────────────────

/**
 * Profile data returned directly in `data` from GET /api/profiles/onboarding.
 * Backend returns: { success: true, data: { ...profile fields } }
 */
export interface OnboardingProfile {
  id: string;
  userId: string;
  goal: string | null;
  consistency: string | null;
  experience: string | null;
  environment: string | null;
  workoutsPerWeek: number | null;
  specificDays: string[] | null;
  notificationOptIn: boolean;
  notificationTime: string | null;
}

// ─── Exercise library (GET /api/exercises) ────────────────────────────────────

/** A single exercise record as returned by ExerciseService */
export interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: string | null;
  bodyPart: string | null;
  equipment: string | null;
  category: string | null;
  movementPattern: string | null;
  primaryMuscle: string | null;
  mediaUrl: string | null;
  isBodyweight: boolean;
}

// ─── Progression ──────────────────────────────────────────────────────────────

export interface PendingProgression {
  id: string;
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  recommendedWeight: number;
  readinessScore: number;
  programExerciseId: string;
}

export interface ProgressionConfirmRequest {
  progressionId: string;
  confirmedWeight: number;
}

export interface SuggestedWeightsRequest {
  exerciseIds: string[];
}

export interface SuggestedWeightsResponse {
  [exerciseId: string]: {
    currentWeight: number;
    suggestedWeight: number;
    readinessScore: number;
  };
}
