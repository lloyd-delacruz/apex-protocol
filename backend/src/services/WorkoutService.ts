import prisma from '../db/prisma';
import { ProgressionService } from './ProgressionService';

// ─── Service ──────────────────────────────────────────────────────────────────

export const WorkoutService = {
  /**
   * Get today's workout for a user based on their active program assignment.
   * Determines the current absolute week and day based on the program start date.
   */
  async getTodaysWorkout(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active program assignment
    const assignment = await prisma.userProgramAssignment.findFirst({
      where: { userId, isActive: true },
      include: {
        user: {
          include: { onboardingProfile: true },
        },
        program: {
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
        },
      },
    });

    if (!assignment) {
      return null;
    }

    const { onboardingProfile } = assignment.user;
    const bestLifts = (onboardingProfile?.bestLifts as any[]) || [];

    const startDate = assignment.startDate ?? assignment.assignedAt;
    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0);

    // Days since program start (0-indexed)
    const daysSinceStart = Math.floor((today.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceStart < 0) {
      return { message: 'Program starts in the future', assignment };
    }

    // Collect all workout days in order
    const allWeeks = assignment.program.programMonths.flatMap((m) => m.programWeeks);
    const totalWeeks = allWeeks.length;
    const totalDays = totalWeeks * 7;

    // If beyond program end, return null
    if (daysSinceStart >= totalDays) {
      return { message: 'Program complete', assignment };
    }

    const absoluteWeekIndex = Math.floor(daysSinceStart / 7); // 0-indexed
    const dayOfWeek = daysSinceStart % 7; // 0 = program day 1 (Mon)

    const currentWeek = allWeeks[absoluteWeekIndex];
    if (!currentWeek) return null;

    // Find workout day for this day of week (sortOrder is 1-indexed)
    const workoutDay = currentWeek.workoutDays.find((d) => d.sortOrder === dayOfWeek + 1) ?? null;

    // Enhance prescriptions with suggested weights
    if (workoutDay) {
      const enrichedPrescriptions = await Promise.all(
        workoutDay.exercisePrescriptions.map(async (p) => {
          const suggestion = await this.calculateSuggestedWeight(userId, p.exerciseId, p.targetRepRange || '10', bestLifts);
          return {
            ...p,
            exercise: p.exercise, // Explicitly preserve the exercise relation
            suggestedWeight: suggestion.weight,
            weightUnit: suggestion.unit,
          };
        }),
      );
      (workoutDay as any).exercisePrescriptions = enrichedPrescriptions;
    }

    return {
      assignment: {
        id: assignment.id,
        programId: assignment.programId,
        startDate: assignment.startDate,
      },
      program: {
        id: assignment.program.id,
        name: assignment.program.name,
        totalWeeks: assignment.program.totalWeeks,
      },
      currentWeek: {
        id: currentWeek.id,
        weekNumber: currentWeek.weekNumber,
        absoluteWeekNumber: currentWeek.absoluteWeekNumber,
      },
      workoutDay,
      daysSinceStart,
    };
  },

  /**
   * Get a specific workout day by absolute week and sort order.
   */
  async getWorkoutByWeekAndDay(programId: string, absoluteWeek: number, dayOrder: number) {
    const week = await prisma.programWeek.findFirst({
      where: {
        absoluteWeekNumber: absoluteWeek,
        programMonth: { programId },
      },
    });

    if (!week) {
      throw Object.assign(new Error('Week not found'), { statusCode: 404 });
    }

    const workoutDay = await prisma.workoutDay.findFirst({
      where: { programWeekId: week.id, sortOrder: dayOrder },
      include: {
        exercisePrescriptions: {
          orderBy: { sortOrder: 'asc' },
          include: { exercise: true },
        },
        programWeek: {
          include: { programMonth: { include: { program: true } } },
        },
      },
    });

    if (!workoutDay) {
      throw Object.assign(new Error('Workout day not found'), { statusCode: 404 });
    }

    return workoutDay;
  },

  /**
   * Internal helper to calculate the suggested weight for an exercise.
   * Priority: 1. Confirmed History, 2. Calibration (Best Lifts), 3. Default (0)
   */
  async calculateSuggestedWeight(userId: string, exerciseId: string, targetRepsText: string, bestLifts: any[]) {
    // 1. Check confirmed history via ProgressionService
    const confirmed = await ProgressionService.getSuggestedWeight(userId, exerciseId);
    if (confirmed && confirmed.suggestedWeight > 0) {
      return { weight: confirmed.suggestedWeight, unit: confirmed.weightUnit };
    }

    // 2. Check Calibration (Best Lifts)
    if (bestLifts.length > 0) {
      const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
      if (exercise) {
        // Find a matching best lift
        const match = bestLifts.find((bl) => {
          if (!bl) return false;
          const name = bl.exerciseName || bl.exercise;
          if (!name || typeof name !== 'string') return false;
          
          const lowerName = name.toLowerCase();
          const targetName = exercise.name.toLowerCase();

          return (
            lowerName === targetName ||
            (targetName.includes('squat') && lowerName.includes('squat')) ||
            (targetName.includes('bench') && lowerName.includes('bench press')) ||
            (targetName.includes('deadlift') && lowerName.includes('deadlift')) ||
            (targetName.includes('press') && lowerName.includes('press'))
          );
        });

        if (match && match.weight > 0) {
          // Epley 1RM Est: 1RM = weight * (1 + reps/30)
          const est1RM = Number(match.weight) * (1 + Number(match.reps) / 30);
          
          // Parse target reps (e.g. "8-12" -> 10)
          const targetRepsMatch = targetRepsText.match(/(\d+)/);
          const targetReps = targetRepsMatch ? parseInt(targetRepsMatch[1], 10) : 10;

          // % of 1RM based on reps (approximate for calibration)
          // 1 rep = 100%, 5 reps = 87%, 10 reps = 75%, 15 reps = 65%
          const pct = Math.max(0.4, 1 - (targetReps * 0.025)); // Simple linear approximation
          const suggested = Math.round(est1RM * pct * 2) / 2; // Round to 0.5

          return { weight: suggested, unit: match.unit || 'kg' };
        }
      }
    }

    // 3. Fallback
    return { weight: 0, unit: 'kg' };
  },
};
