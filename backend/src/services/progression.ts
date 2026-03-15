import { TrainingStatus, WorkoutSet } from '@apex/shared';

/**
 * Determines the training status for a single set based on reps performed
 * vs the prescribed rep range.
 *
 * - ACHIEVED: reps >= rep_max (hit or exceeded the top of the range)
 * - PROGRESS: reps >= rep_min && reps < rep_max (within range but not max)
 * - FAILED:   reps < rep_min (below the minimum target)
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
 * Calculates a readiness score (0–100) based on the distribution of set
 * statuses from the most recent session for a given exercise.
 *
 * Scoring weights:
 *   ACHIEVED = 100 pts per set
 *   PROGRESS = 60 pts per set
 *   FAILED   = 10 pts per set
 *
 * The final score is the average across all sets, clamped to [0, 100].
 */
export function calculateReadiness(sets: WorkoutSet[]): number {
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
 * Recommends the next training weight based on current weight and readiness.
 *
 * Progression logic:
 *   readiness >= 90  →  increase by 5%  (strong session, push forward)
 *   readiness >= 70  →  increase by 2.5% (solid session, small step up)
 *   readiness >= 50  →  maintain current weight (borderline, consolidate)
 *   readiness < 50   →  decrease by 5%  (struggled, deload slightly)
 *
 * Weight is rounded to the nearest 0.5 kg for practical loading.
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

  const rawWeight = currentWeight * multiplier;
  // Round to nearest 0.5 kg
  return Math.round(rawWeight * 2) / 2;
}

/**
 * Full progression calculation combining all three functions above.
 * Takes a set of workout sets and the current working weight,
 * returns readiness score and recommended next weight.
 */
export function calculateProgression(
  sets: WorkoutSet[],
  currentWeight: number
): { readiness: number; recommendedWeight: number } {
  const readiness = calculateReadiness(sets);
  const recommendedWeight = recommendNextWeight(currentWeight, readiness);
  return { readiness, recommendedWeight };
}
