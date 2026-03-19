// Goal values must match what the route schema and frontend send
export type GoalType = 'strength' | 'hypertrophy' | 'fat_loss' | 'endurance' | 'athletic_performance' | 'general_fitness' | 'mobility';

export interface DayTemplate {
  phase: string;
  workoutType: string;
  notes: string;
  targetMuscleGroups: string[];
  isStrengthDay: boolean;   // true = lower reps / heavier load
  isCardioOrRest: boolean;  // true = skip main lifting prescription
}

// ─── Month phases — mirrors the 12-Week Base Program structure ────────────────

const MONTH_PHASES = ['Foundation', 'Development', 'Intensification'] as const;

export const ProgramTemplateService = {

  /** Human-readable phase name for a 0-indexed month */
  getPhaseForMonth(monthIndex: number): string {
    return MONTH_PHASES[monthIndex] ?? 'Block';
  },

  /**
   * Rep ranges per phase, calibrated to match the 12-Week Base Program logic:
   *   Foundation    → learn movements, moderate reps
   *   Development   → volume peak, moderate-high reps
   *   Intensification → intensity peak, lower reps
   *
   * When multiple goals are selected, the combination drives the ranges.
   * Strength+Hypertrophy (power-hypertrophy) is the base program's approach.
   */
  getRepRangeForGoalsAndPhase(goals: string[], monthIndex: number): string {
    const hasStrength = goals.includes('strength');
    const hasHypertrophy = goals.includes('hypertrophy');
    const primaryGoal = goals[0] as GoalType;

    // Power-hypertrophy (matches 12-Week Base Program's philosophy)
    if (hasStrength && hasHypertrophy) {
      const ranges = ['8-12', '6-10', '4-8'];
      return ranges[monthIndex] ?? '6-10';
    }

    if (hasStrength) {
      const ranges = ['6-8', '4-6', '3-5'];
      return ranges[monthIndex] ?? '4-6';
    }

    if (hasHypertrophy) {
      const ranges = ['12-15', '10-12', '8-10'];
      return ranges[monthIndex] ?? '10-12';
    }

    switch (primaryGoal) {
      case 'fat_loss': {
        const ranges = ['12-15', '12-15', '10-15'];
        return ranges[monthIndex] ?? '12-15';
      }
      case 'endurance': {
        const ranges = ['15-20', '15-20', '15-20'];
        return ranges[monthIndex] ?? '15-20';
      }
      case 'athletic_performance': {
        const ranges = ['8-12', '6-10', '4-8'];
        return ranges[monthIndex] ?? '6-10';
      }
      case 'general_fitness':
      default: {
        const ranges = ['10-15', '8-12', '8-12'];
        return ranges[monthIndex] ?? '10-12';
      }
    }
  },

  /** Legacy single-goal rep range (kept for backward compat) */
  getRepRangeForGoal(goal: GoalType): string {
    return this.getRepRangeForGoalsAndPhase([goal], 1);
  },

  /**
   * Weekly split template for the given days/week and goals combination.
   *
   * When strength+hypertrophy are both selected, the split mirrors the
   * 12-Week Base Program's Upper/Lower structure (Upper Strength,
   * Lower Strength, Upper Hypertrophy, Lower Hypertrophy), which is
   * the proven template for simultaneous strength and size gains.
   */
  getWeeklySplit(daysPerWeek: number, goals: string[] | GoalType): DayTemplate[] {
    const goalsArr = Array.isArray(goals) ? goals : [goals];
    const primaryGoal = (goalsArr[0] ?? 'general') as GoalType;
    const hasStrength = goalsArr.includes('strength');
    const hasHypertrophy = goalsArr.includes('hypertrophy');
    const isPowerHypertrophy = hasStrength && hasHypertrophy;

    const mkDay = (
      workoutType: string,
      notes: string,
      targets: string[],
      isStrength = false,
      isCardioOrRest = false
    ): DayTemplate => ({
      phase: isPowerHypertrophy ? 'Power-Hypertrophy' : primaryGoal.charAt(0).toUpperCase() + primaryGoal.slice(1).replace('_', ' '),
      workoutType,
      notes,
      targetMuscleGroups: targets,
      isStrengthDay: isStrength,
      isCardioOrRest,
    });

    switch (daysPerWeek) {
      case 2:
        return [
          mkDay('Full Body A', 'Compound focus — push & pull', ['Chest', 'Back', 'Quads', 'Hamstrings'], hasStrength),
          mkDay('Full Body B', 'Compound focus — hinge & press', ['Shoulders', 'Back', 'Glutes', 'Quads'], hasStrength),
        ];

      case 3:
        if (isPowerHypertrophy || hasHypertrophy) {
          return [
            mkDay('Push', 'Chest, Shoulders, Triceps', ['Chest', 'Shoulders', 'Triceps']),
            mkDay('Pull', 'Back, Biceps', ['Back', 'Biceps']),
            mkDay('Legs', 'Quads, Hamstrings, Calves', ['Quads', 'Hamstrings', 'Calves']),
          ];
        }
        return [
          mkDay('Full Body A', 'Heavy compounds', ['Chest', 'Back', 'Quads'], true),
          mkDay('Full Body B', 'Volume focus', ['Shoulders', 'Back', 'Hamstrings']),
          mkDay('Full Body C', 'Accessory focus', ['Chest', 'Back', 'Full Body']),
        ];

      case 4:
        // Mirrors the 12-Week Base Program's 4-session structure exactly
        return [
          mkDay('Upper Strength', 'Heavy pressing & pulling — maximal tension, controlled eccentrics', ['Chest', 'Back', 'Shoulders'], true),
          mkDay('Lower Strength', 'Heavy squats & hinges — maximal load, full depth', ['Quads', 'Hamstrings', 'Glutes'], true),
          mkDay('Upper Hypertrophy', 'Volume & isolation — muscle contraction and pump, 2-3s eccentric', ['Chest', 'Back', 'Shoulders']),
          mkDay('Lower Hypertrophy', 'Volume & isolation — quad and glute development, full ROM', ['Quads', 'Hamstrings', 'Calves']),
        ];

      case 5:
        return [
          mkDay('Upper Strength', 'Heavy compounds', ['Chest', 'Back'], true),
          mkDay('Lower Strength', 'Heavy squats & hinges', ['Quads', 'Hamstrings'], true),
          mkDay('Push', 'Hypertrophy focus', ['Chest', 'Shoulders']),
          mkDay('Pull', 'Hypertrophy focus', ['Back', 'Biceps']),
          mkDay('Legs', 'Hypertrophy focus', ['Quads', 'Calves']),
        ];

      case 6:
        return [
          mkDay('Push A', 'Heavy', ['Chest', 'Shoulders'], true),
          mkDay('Pull A', 'Heavy', ['Back', 'Biceps'], true),
          mkDay('Legs A', 'Heavy', ['Quads', 'Hamstrings'], true),
          mkDay('Push B', 'Volume', ['Chest', 'Shoulders']),
          mkDay('Pull B', 'Volume', ['Back', 'Biceps']),
          mkDay('Legs B', 'Volume', ['Quads', 'Hamstrings']),
        ];

      default:
        return Array.from({ length: daysPerWeek }).map((_, i) =>
          mkDay(`Workout ${i + 1}`, 'Balanced session', [])
        );
    }
  },
};
