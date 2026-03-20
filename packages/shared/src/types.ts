// ─── Enums ───────────────────────────────────────────────────────────────────

export type TrainingStatus = 'ACHIEVED' | 'PROGRESS' | 'FAILED';

export type WorkoutSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface TrainingProgram {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  duration_weeks: number;
  created_at: string;
}

export interface ProgramWeek {
  id: string;
  program_id: string;
  week_number: number;
}

export interface ProgramDay {
  id: string;
  week_id: string;
  day_number: number;
  name: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
}

export interface ProgramExercise {
  id: string;
  day_id: string;
  exercise_id: string;
  set_count: number;
  rep_min: number;
  rep_max: number;
  rir_target: number;
  order_index: number;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  program_day_id: string | null;
  date: string;
  notes: string | null;
  status: WorkoutSessionStatus;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  program_exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rir: number;
  status: TrainingStatus;
}

export interface ProgressionRecord {
  id: string;
  user_id: string;
  program_exercise_id: string;
  recommended_weight: number;
  readiness_score: number;
  calculated_at: string;
}

export interface BodyMetrics {
  id: string;
  user_id: string;
  date: string;
  body_weight_kg: number | null;
  calories: number | null;
  protein_g: number | null;
  sleep_hours: number | null;
  hunger: 1 | 2 | 3 | 4 | 5 | null;
  mood: 1 | 2 | 3 | 4 | 5 | null;
  training_performance: 1 | 2 | 3 | 4 | 5 | null;
}

// ─── Joined / Extended Types ──────────────────────────────────────────────────

export interface ProgramExerciseWithDetails extends ProgramExercise {
  exercise: Exercise;
}

export interface ProgramDayWithExercises extends ProgramDay {
  exercises: ProgramExerciseWithDetails[];
}

export interface ProgramWeekWithDays extends ProgramWeek {
  days: ProgramDayWithExercises[];
}

export interface TrainingProgramWithWeeks extends TrainingProgram {
  weeks: ProgramWeekWithDays[];
}

export interface WorkoutSetWithExercise extends WorkoutSet {
  program_exercise: ProgramExerciseWithDetails;
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  sets: WorkoutSetWithExercise[];
}

// ─── API Request / Response Types ─────────────────────────────────────────────

export interface AuthRegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateProgramRequest {
  name: string;
  description?: string;
  duration_weeks: number;
}

export interface CreateSessionRequest {
  program_day_id?: string;
  date?: string;
  notes?: string;
}

export interface LogSetRequest {
  program_exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rir: number;
}

export interface LogMetricsRequest {
  date?: string;
  body_weight_kg?: number;
  calories?: number;
  protein_g?: number;
  sleep_hours?: number;
  hunger?: 1 | 2 | 3 | 4 | 5;
  mood?: 1 | 2 | 3 | 4 | 5;
  training_performance?: 1 | 2 | 3 | 4 | 5;
}

// ─── Progression Engine Types ─────────────────────────────────────────────────

export interface ProgressionInput {
  sets: WorkoutSet[];
  rep_min: number;
  rep_max: number;
  rir_target: number;
  current_weight: number;
}

export interface ProgressionOutput {
  readiness_score: number;
  recommended_weight: number;
  status_summary: {
    achieved: number;
    progress: number;
    failed: number;
  };
}

// ─── Dashboard Summary Types ──────────────────────────────────────────────────

export interface DashboardSummary {
  today_session: WorkoutSession | null;
  today_day: ProgramDayWithExercises | null;
  weekly_volume: number;
  recent_sessions: WorkoutSession[];
  streak_days: number;
}

export interface ProgressChartPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ExerciseProgressionData {
  exercise: Exercise;
  data_points: ProgressChartPoint[];
  current_weight: number;
  weight_change_pct: number;
}
