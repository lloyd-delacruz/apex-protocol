import { TrainingStatus } from '@apex/shared';

/**
 * Determines training status based on reps performed vs target range.
 *
 * ACHIEVED: reps >= rep_max — hit the top of the range
 * PROGRESS: rep_min <= reps < rep_max — within range but not max
 * FAILED:   reps < rep_min — below minimum
 */
export function calculateStatus(
  reps: number,
  repMin: number,
  repMax: number
): TrainingStatus {
  if (reps >= repMax) return 'ACHIEVED';
  if (reps >= repMin) return 'PROGRESS';
  return 'FAILED';
}

/**
 * Calculates a readiness/performance score (0–100) from a set of workout sets.
 *
 * ACHIEVED = 100 pts, PROGRESS = 60 pts, FAILED = 10 pts
 * Score is the average across all sets.
 */
export function calculateReadiness(sets: Array<{ status: TrainingStatus }>): number {
  if (sets.length === 0) return 50;

  const weights: Record<TrainingStatus, number> = {
    ACHIEVED: 100,
    PROGRESS: 60,
    FAILED: 10,
  };

  const total = sets.reduce((sum, set) => sum + weights[set.status], 0);
  const score = total / sets.length;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Recommends the next training weight based on readiness score.
 *
 * readiness >= 90  → +5%
 * readiness >= 70  → +2.5%
 * readiness >= 50  → maintain
 * readiness < 50   → -5%
 *
 * Weight is rounded to the nearest 0.5 kg.
 */
export function recommendNextWeight(
  currentWeight: number,
  readiness: number
): number {
  let multiplier: number;

  if (readiness >= 90) {
    multiplier = 1.05;
  } else if (readiness >= 70) {
    multiplier = 1.025;
  } else if (readiness >= 50) {
    multiplier = 1.0;
  } else {
    multiplier = 0.95;
  }

  const raw = currentWeight * multiplier;
  return Math.round(raw * 2) / 2;
}

/**
 * Computes a color class string based on training status.
 */
export function statusColor(status: TrainingStatus): string {
  switch (status) {
    case 'ACHIEVED': return 'text-success';
    case 'PROGRESS': return 'text-accent';
    case 'FAILED': return 'text-danger';
    default: return 'text-success';
  }
}

/**
 * Computes the readiness label from a numeric score.
 */
export function readinessLabel(score: number): string {
  if (score >= 90) return 'Peak';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Solid';
  if (score >= 45) return 'Moderate';
  if (score >= 30) return 'Low';
  return 'Poor';
}

/**
 * Summarizes a set of workout sets into status counts.
 */
export function summarizeSetStatuses(sets: Array<{ status: TrainingStatus }>): {
  achieved: number;
  progress: number;
  failed: number;
  total: number;
} {
  const counts = { achieved: 0, progress: 0, failed: 0 };
  for (const set of sets) {
    if (set.status === 'ACHIEVED') counts.achieved++;
    else if (set.status === 'PROGRESS') counts.progress++;
    else counts.failed++;
  }
  return { ...counts, total: sets.length };
}

/**
 * Calculates total volume (weight × reps) for a set of workout sets.
 */
export function calculateVolume(sets: Array<{ weight_kg: number; reps: number }>): number {
  return sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0);
}
