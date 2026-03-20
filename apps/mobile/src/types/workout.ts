/**
 * Workout Domain Types
 *
 * Canonical types for the workout feature, derived from actual backend
 * API response shapes. Screens may define local form-state types
 * (e.g. weight/reps as strings for TextInput) — those stay in-screen.
 * These types represent what arrives over the wire.
 */

import { TrainingStatus } from '@apex/shared';

// ─── Today's workout (GET /api/workouts/today) ────────────────────────────────

/** A single exercise prescription as enriched by WorkoutService */
export interface WorkoutPrescription {
  id: string;
  exerciseId: string;
  targetRepRange: string | null;
  targetSets: number | null;
  sortOrder: number;
  /** Backend-computed suggested starting weight */
  suggestedWeight: number;
  /** Unit for suggestedWeight: 'kg' | 'lb' */
  weightUnit: string;
  exercise: {
    id: string;
    name: string;
    muscleGroup: string | null;
    mediaUrl: string | null;
  };
}

/** Full response shape from GET /api/workouts/today */
export interface TodayWorkout {
  assignment: { id: string; programId: string; startDate: string | null };
  program: { id: string; name: string; totalWeeks: number };
  currentWeek: { id: string; weekNumber: number; absoluteWeekNumber: number };
  workoutDay: {
    id: string;
    workoutType: string;
    phase: string;
    exercisePrescriptions: WorkoutPrescription[];
  } | null;
}

// ─── Session types (POST /api/workouts/session/start response) ────────────────

/** A session exercise entry as returned from session/start */
export interface SessionExercise {
  id: string;
  exerciseId: string;
  orderIndex: number;
}

/** Active session as persisted to AsyncStorage between app restarts */
export interface ActiveSession {
  sessionId: string;
  workoutDayId: string;
  exercises: SessionExercise[];
}

// ─── Training log (GET /api/training-log/history) ─────────────────────────────

/**
 * A single training log record as returned by the history endpoint.
 * The backend returns raw Prisma rows with an included exercise relation.
 */
export interface TrainingHistoryLog {
  id: string;
  sessionDate: string;       // YYYY-MM-DD
  weight: number | null;
  weightUnit: string;        // 'kg' | 'lb'
  set1Reps: number | null;
  set2Reps: number | null;
  set3Reps: number | null;
  set4Reps: number | null;
  totalReps: number | null;
  status: TrainingStatus | null;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    muscleGroup: string | null;
  };
  workoutDay: {
    id: string;
    workoutType: string;
  } | null;
}
