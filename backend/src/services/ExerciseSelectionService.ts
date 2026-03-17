/**
 * ExerciseSelectionService
 *
 * Purpose:  Select exercises from the local Exercise table for program generation.
 *           This service is the ONLY layer that chooses exercises at generation time.
 *
 * Source of truth: local PostgreSQL Exercise table — populated via ExerciseImportService.
 * ExerciseDB (external API) is NEVER called here; it is an import/sync concern only.
 *
 * Architecture:
 *   ExerciseDB API  →  ExerciseImportService  →  exercises table
 *                                                      ↑
 *                               ExerciseSelectionService reads from here only
 *                                                      ↑
 *                               ExerciseRepository.findForGenerator()
 */

import { ExerciseRepository, ExerciseDTO } from '../repositories/ExerciseRepository';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type EquipmentAccess =
  | 'full_gym'
  | 'dumbbells_only'
  | 'bodyweight_only'
  | 'home_gym'
  | 'machines_only'
  | string[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the difficulty tiers appropriate for a given experience level.
 * Used to exclude exercises that are too advanced for beginners.
 */
function getDifficultiesForExperience(experience: ExperienceLevel): string[] {
  switch (experience) {
    case 'beginner':     return ['beginner', 'intermediate'];
    case 'intermediate': return ['beginner', 'intermediate', 'advanced'];
    case 'advanced':     return ['intermediate', 'advanced'];
  }
}

/**
 * Broad check: does an exercise target any of the listed muscle groups?
 * Checks primaryMuscle, muscleGroup (legacy), and bodyPart — so it works
 * correctly for both locally-authored and ExerciseDB-imported records.
 */
function matchesMuscleGroups(exercise: ExerciseDTO, groups: string[]): boolean {
  if (!groups || groups.length === 0) return true;
  if (groups.includes('Full Body')) return true;

  return groups.some((g) => {
    const gl = g.toLowerCase();
    return (
      exercise.primaryMuscle?.toLowerCase().includes(gl) ||
      exercise.muscleGroup?.toLowerCase().includes(gl) ||
      exercise.bodyPart?.toLowerCase().includes(gl)
    );
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const ExerciseSelectionService = {

  // ── Equipment mapping ────────────────────────────────────────────────────

  /**
   * Translates higher-level equipment access tokens into the lowercase strings
   * stored in the local exercises table (as normalised by ExerciseImportService).
   *
   * Returns an empty array for full_gym / no restriction → no equipment filter.
   */
  getEquipmentFilter(equipment: EquipmentAccess): string[] {
    if (Array.isArray(equipment)) {
      return equipment.map((e) => e.toLowerCase());
    }
    switch (equipment) {
      case 'bodyweight_only': return ['bodyweight'];
      case 'dumbbells_only':  return ['dumbbell', 'bodyweight'];
      case 'home_gym':        return ['barbell', 'dumbbell', 'bodyweight'];
      case 'machines_only':   return ['machine', 'cable'];
      case 'full_gym':
      default:                return [];   // no filter = everything
    }
  },

  // ── Volume ───────────────────────────────────────────────────────────────

  /** Target exercises per workout day based on experience. */
  getExercisesPerDay(experience: ExperienceLevel): number {
    switch (experience) {
      case 'advanced':     return 6;
      case 'intermediate': return 5;
      case 'beginner':
      default:             return 4;
    }
  },

  // ── Pool loading (DB layer — uses ExerciseRepository exclusively) ─────────

  /**
   * Loads the exercise pool for a program from the LOCAL exercises table.
   * All filtering is pushed to the database via ExerciseRepository.findForGenerator().
   *
   * Cascading fallback strategy (each step widens the search and logs a warning):
   *   1. equipment + goal + difficulty  ← ideal
   *   2. equipment + difficulty          ← drop goal tag
   *   3. equipment only                  ← drop difficulty
   *   4. no filter                       ← last resort (all active exercises)
   *
   * Throws a 400 if the local database contains no exercises at all.
   */
  async loadExercisePool(
    equipment: EquipmentAccess,
    primaryGoal: string,
    experience: ExperienceLevel,
  ): Promise<ExerciseDTO[]> {
    const eqList      = this.getEquipmentFilter(equipment);
    const difficulties = getDifficultiesForExperience(experience);
    const context     = `goal=${primaryGoal} equipment=[${eqList.join(',')}] experience=${experience}`;

    // ── Attempt 1: full filter (goal + equipment + difficulty) ──────────
    let pool = await ExerciseRepository.findForGenerator({
      equipment:   eqList.length > 0 ? eqList : undefined,
      goal:        primaryGoal,
      difficulties,
      limit:       500,
    });

    if (pool.length > 0) return pool;

    // ── Attempt 2: drop goal tag ─────────────────────────────────────────
    console.warn(
      `[ExerciseSelection] No exercises found for ${context}. ` +
      `Retrying without goal filter.`
    );
    pool = await ExerciseRepository.findForGenerator({
      equipment:   eqList.length > 0 ? eqList : undefined,
      difficulties,
      limit:       500,
    });

    if (pool.length > 0) return pool;

    // ── Attempt 3: drop difficulty ────────────────────────────────────────
    console.warn(
      `[ExerciseSelection] Still no exercises (${context}) without goal. ` +
      `Retrying without difficulty filter.`
    );
    pool = await ExerciseRepository.findForGenerator({
      equipment: eqList.length > 0 ? eqList : undefined,
      limit:     500,
    });

    if (pool.length > 0) return pool;

    // ── Attempt 4: drop equipment (all active exercises) ──────────────────
    console.warn(
      `[ExerciseSelection] No exercises for equipment [${eqList.join(',')}]. ` +
      `Falling back to all active exercises in the local database.`
    );
    pool = await ExerciseRepository.findForGenerator({ limit: 500 });

    if (pool.length > 0) return pool;

    // ── Hard failure ──────────────────────────────────────────────────────
    console.error(
      `[ExerciseSelection] Local exercise database is empty. ` +
      `Run the exercise import (npm run exercises:import) before generating programs.`
    );
    throw Object.assign(
      new Error(
        'No exercises found in the local database. ' +
        'Please import exercises before generating a program.'
      ),
      { statusCode: 400 }
    );
  },

  // ── Day-level selection (in-memory — operates on the pre-loaded pool) ─────

  /**
   * Selects exercises for a single workout day from an in-memory pool.
   *
   * Selection order:
   *   1. Filter by movement pattern (if provided, uses enriched movementPattern field)
   *   2. Filter by target muscle groups (checks primaryMuscle, muscleGroup, bodyPart)
   *   3. Apply compound/isolation preference
   *   4. Bias beginners away from barbell-only lifts
   *   5. Shuffle and pick
   *   6. Sort compounds first (or isolation-first for isolation preference)
   *
   * All filtering degrades gracefully — each filter step falls back to the
   * previous pool if it would leave fewer exercises than needed.
   */
  selectExercisesForDay(
    pool: ExerciseDTO[],
    experience: ExperienceLevel,
    targetMuscleGroups?: string[],
    targetMovementPatterns?: string[],
    compoundPreference: 'compound' | 'mixed' | 'isolation' = 'mixed',
  ): ExerciseDTO[] {
    const exerciseCount = this.getExercisesPerDay(experience);
    let available = [...pool];

    // ── Step 1: movement pattern filter ────────────────────────────────────
    if (targetMovementPatterns && targetMovementPatterns.length > 0) {
      const patternMatched = available.filter(
        (e) =>
          e.movementPattern &&
          targetMovementPatterns.some(
            (p) => e.movementPattern!.toLowerCase() === p.toLowerCase()
          )
      );
      // Only apply if we get enough exercises; otherwise fall back to full pool
      if (patternMatched.length >= exerciseCount) {
        available = patternMatched;
      }
    }

    // ── Step 2: muscle-group filter ─────────────────────────────────────────
    if (targetMuscleGroups && targetMuscleGroups.length > 0) {
      const muscleMatched = available.filter((e) =>
        matchesMuscleGroups(e, targetMuscleGroups)
      );
      if (muscleMatched.length > 0) {
        available = muscleMatched;
      }
    }

    // ── Step 3: compound/isolation preference ───────────────────────────────
    const isCompound = (e: ExerciseDTO) => e.isCompound === true || e.category === 'compound';

    if (compoundPreference === 'compound') {
      const compoundOnly = available.filter(isCompound);
      // Require at least enough compound exercises to fill the day
      if (compoundOnly.length >= exerciseCount) available = compoundOnly;
    } else if (compoundPreference === 'isolation') {
      const isolationOnly = available.filter((e) => !isCompound(e));
      if (isolationOnly.length >= exerciseCount) available = isolationOnly;
    }

    // ── Step 4: beginner bias — de-rank barbell-only lifts ──────────────────
    if (experience === 'beginner') {
      available = [...available].sort((a, b) => {
        const aBarbell = a.equipment?.toLowerCase() === 'barbell' ? 1 : 0;
        const bBarbell = b.equipment?.toLowerCase() === 'barbell' ? 1 : 0;
        return aBarbell - bBarbell;
      });
    }

    // ── Step 5: shuffle (introduce variety across weeks) ────────────────────
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, exerciseCount);

    // ── Step 6: final sort — compounds first (or isolation-first) ──────────
    return picked.sort((a, b) => {
      const aComp = isCompound(a) ? -1 : 1;
      const bComp = isCompound(b) ? -1 : 1;
      return compoundPreference === 'isolation'
        ? bComp - aComp   // isolation first
        : aComp - bComp;  // compound first (default)
    });
  },
};
