import prisma from '../db/prisma';
import { ExerciseSelectionService, ExperienceLevel, EquipmentAccess } from './ExerciseSelectionService';
import { ProgramTemplateService } from './ProgramTemplateService';

export interface GeneratorParams {
  userId?: string;
  goals: string[];           // one or more: ['strength', 'hypertrophy', ...]
  experienceLevel: ExperienceLevel;
  daysPerWeek: number;
  equipment: EquipmentAccess;
  compoundPreference?: 'compound' | 'mixed' | 'isolation';
}

// ─── Month phase definitions — mirrors the 12-Week Base Program ───────────────

const MONTH_DEFINITIONS = [
  {
    monthNumber: 1,
    name: 'Month 1 — Foundation',
    description: 'Build movement patterns, establish baseline strength, and adapt to training volume.',
  },
  {
    monthNumber: 2,
    name: 'Month 2 — Development',
    description: 'Progressive overload and volume accumulation. Push past your foundation.',
  },
  {
    monthNumber: 3,
    name: 'Month 3 — Intensification',
    description: 'Peak intensity, maximum effort sets. Realise the gains built over 12 weeks.',
  },
];

const WEEKS_PER_MONTH = 4;
const TOTAL_MONTHS = 3; // 12 weeks total

// ─── Increment defaults by equipment type ─────────────────────────────────────

function getIncrement(equipment: string | null): { value: number; unit: string } {
  const eq = (equipment ?? '').toLowerCase();
  if (eq === 'barbell') return { value: 2.5, unit: 'kg' };
  if (eq === 'dumbbell') return { value: 2, unit: 'kg' };
  if (eq === 'machine' || eq === 'cable') return { value: 2.5, unit: 'kg' };
  return { value: 2.5, unit: 'kg' };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const ProgramGeneratorService = {
  /**
   * Generates a fully structured 12-week program following the same
   * Foundation → Development → Intensification phase structure as the
   * Apex Protocol 12-Week Base Program.
   *
   * Supports multiple goals (e.g. ['strength', 'hypertrophy']) to produce
   * a combined program, which uses the Upper/Lower Power-Hypertrophy split
   * that underpins the base program.
   */
  async generateProgram(params: GeneratorParams) {
    const { userId, goals, experienceLevel, daysPerWeek, equipment, compoundPreference = 'mixed' } = params;

    if (!goals || goals.length === 0) {
      throw Object.assign(new Error('At least one goal is required.'), { statusCode: 400 });
    }

    // 1. Load exercise pool from local DB — filtered by equipment, primary goal, and
    //    experience level. Uses ExerciseRepository.findForGenerator() with cascading
    //    fallbacks. ExerciseDB is never called here; it is an import/sync concern only.
    const primaryGoal = goals[0];
    const allowedExercises = await ExerciseSelectionService.loadExercisePool(
      equipment,
      primaryGoal,
      experienceLevel,
    );

    // 2. Weekly split (same structure used across all 12 weeks; rep ranges change per phase)
    const weeklySplit = ProgramTemplateService.getWeeklySplit(daysPerWeek, goals);

    // 3. Program metadata
    const goalLabel = goals
      .map((g) => g.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
      .join(' + ');

    const name = `${goalLabel} Protocol — ${daysPerWeek}d/wk`;
    const description =
      `A custom 12-week ${goalLabel.toLowerCase()} program built for a ${experienceLevel}. ` +
      `${daysPerWeek} training days per week, structured across Foundation, Development, and Intensification phases. ` +
      (goals.includes('strength') && goals.includes('hypertrophy')
        ? 'Follows the Upper/Lower Power-Hypertrophy split of the Apex Protocol Base Program.'
        : '');

    // 4. Create the program record first, then build the structure in sequential steps.
    //    This avoids deeply-nested Prisma transactions that can fail with large programs.
    const slug = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const program = await prisma.program.create({
      data: {
        name,
        slug,
        description,
        totalWeeks: TOTAL_MONTHS * WEEKS_PER_MONTH,
        isCustom: true,
        authorId: userId ?? null,
        goalType: goals.join(','),
        experienceLevel,
        daysPerWeek,
        equipmentList: Array.isArray(equipment) ? equipment : [equipment as string],
        sourceType: 'ai_generator',
        isActive: true,
      },
    });

    // 5. Build months → weeks → days → prescriptions sequentially
    for (let monthIdx = 0; monthIdx < MONTH_DEFINITIONS.length; monthIdx++) {
      const monthDef = MONTH_DEFINITIONS[monthIdx];
      const month = await prisma.programMonth.create({
        data: {
          programId: program.id,
          monthNumber: monthDef.monthNumber,
          name: monthDef.name,
          description: monthDef.description,
        },
      });

      for (let weekInMonth = 0; weekInMonth < WEEKS_PER_MONTH; weekInMonth++) {
        const absoluteWeekNumber = monthIdx * WEEKS_PER_MONTH + weekInMonth + 1;
        const repRange = ProgramTemplateService.getRepRangeForGoalsAndPhase(goals, monthIdx);

        const week = await prisma.programWeek.create({
          data: {
            programMonthId: month.id,
            weekNumber: weekInMonth + 1,
            absoluteWeekNumber,
          },
        });

        for (let dIdx = 0; dIdx < weeklySplit.length; dIdx++) {
          const dayTemplate = weeklySplit[dIdx];
          const dayExercises = ExerciseSelectionService.selectExercisesForDay(
            allowedExercises,
            experienceLevel,
            dayTemplate.targetMuscleGroups,
            undefined,
            compoundPreference
          );

          let dayRepRange = repRange;
          if (goals.includes('strength') && goals.includes('hypertrophy')) {
            dayRepRange = dayTemplate.isStrengthDay
              ? ProgramTemplateService.getRepRangeForGoalsAndPhase(['strength'], monthIdx)
              : ProgramTemplateService.getRepRangeForGoalsAndPhase(['hypertrophy'], monthIdx);
          }

          const day = await prisma.workoutDay.create({
            data: {
              programWeekId: week.id,
              dayCode: `D${dIdx + 1}`,
              phase: dayTemplate.phase,
              workoutType: dayTemplate.workoutType,
              sortOrder: dIdx + 1,
              notes: dayTemplate.notes,
            },
          });

          if (dayExercises.length > 0) {
            await prisma.exercisePrescription.createMany({
              data: dayExercises.map((ex, exIdx) => {
                const inc = getIncrement(ex.equipment);
                return {
                  workoutDayId: day.id,
                  exerciseId: ex.id,
                  targetRepRange: dayTemplate.isCardioOrRest ? null : dayRepRange,
                  incrementValue: inc.value,
                  incrementUnit: inc.unit,
                  sortOrder: exIdx + 1,
                };
              }),
            });
          }
        }
      }
    }

    // 6. Re-fetch with full include for the response
    const fullProgram = await prisma.program.findUnique({
      where: { id: program.id },
      include: {
        programMonths: {
          orderBy: { monthNumber: 'asc' },
          include: {
            programWeeks: {
              orderBy: { weekNumber: 'asc' },
              include: {
                workoutDays: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    exercisePrescriptions: {
                      orderBy: { sortOrder: 'asc' },
                      include: { exercise: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!fullProgram) {
      throw Object.assign(new Error('Program was created but could not be loaded.'), { statusCode: 500 });
    }

    return fullProgram;
  },
};
