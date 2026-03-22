import prisma from '../db/prisma';
import { ProgressionService } from './ProgressionService';

// ─── Service ──────────────────────────────────────────────────────────────────

export const WorkoutService = {
  /**
   * Get today's workout for a user based on their active program assignment.
   * Determines the current absolute week and day based on the program start date.
   */
  async getTodaysWorkout(userId: string) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

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

    // ─── Check for manual override for today ──────────────────────────────────
    if (assignment.overrideWorkoutDayId && assignment.overrideWorkoutDate) {
      const overrideStr = new Date(assignment.overrideWorkoutDate).toISOString().split('T')[0];
      
      if (overrideStr === todayStr) {
        console.log('[WorkoutService] Found manual workout override for today:', assignment.overrideWorkoutDayId);
        
        const workoutDay = await prisma.workoutDay.findUnique({
          where: { id: assignment.overrideWorkoutDayId },
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

        if (workoutDay) {
          // Enhance with suggested weights
          const enrichedPrescriptions = await Promise.all(
            workoutDay.exercisePrescriptions.map(async (p) => {
              const suggestion = await this.calculateSuggestedWeight(userId, p.exerciseId, p.targetRepRange || '10', bestLifts);
              return {
                ...p,
                exercise: p.exercise,
                suggestedWeight: suggestion.weight,
                weightUnit: suggestion.unit,
              };
            })
          );
          (workoutDay as any).exercisePrescriptions = enrichedPrescriptions;

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
              id: workoutDay.programWeekId,
              weekNumber: (workoutDay.programWeek as any).weekNumber,
              absoluteWeekNumber: (workoutDay.programWeek as any).absoluteWeekNumber,
            },
            workoutDay,
            isOverride: true,
          };
        }
      }
    }

    // Regular Logic
    const startDate = assignment.startDate ?? assignment.assignedAt;
    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysSinceStart = Math.floor((today.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceStart < 0) {
      return { message: 'Program starts in the future', assignment };
    }

    const allWeeks = assignment.program.programMonths.flatMap((m) => m.programWeeks);
    const totalWeeks = allWeeks.length;
    const totalDays = totalWeeks * 7;

    if (daysSinceStart >= totalDays) {
      return { message: 'Program complete', assignment };
    }

    const absoluteWeekIndex = Math.floor(daysSinceStart / 7);
    const dayOfWeek = daysSinceStart % 7;

    const currentWeek = allWeeks[absoluteWeekIndex];
    if (!currentWeek) return null;

    const workoutDay = currentWeek.workoutDays.find((d) => d.sortOrder === dayOfWeek + 1) ?? null;

    if (workoutDay) {
      const enrichedPrescriptions = await Promise.all(
        workoutDay.exercisePrescriptions.map(async (p) => {
          const suggestion = await this.calculateSuggestedWeight(userId, p.exerciseId, p.targetRepRange || '10', bestLifts);
          return {
            ...p,
            exercise: p.exercise,
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

  async swapWorkout(userId: string, workoutDayId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignment = await prisma.userProgramAssignment.findFirst({
      where: { userId, isActive: true },
    });

    if (!assignment) {
      throw Object.assign(new Error('No active program assignment found'), { statusCode: 404 });
    }

    return prisma.userProgramAssignment.update({
      where: { id: assignment.id },
      data: {
        overrideWorkoutDayId: workoutDayId,
        overrideWorkoutDate: today,
      },
    });
  },

  async calculateSuggestedWeight(userId: string, exerciseId: string, targetRepsText: string, bestLifts: any[]) {
    const confirmed = await ProgressionService.getSuggestedWeight(userId, exerciseId);
    if (confirmed && confirmed.suggestedWeight > 0) {
      return { weight: confirmed.suggestedWeight, unit: confirmed.weightUnit };
    }

    if (bestLifts.length > 0) {
      const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
      if (exercise) {
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

        if (match && Number(match.weight) > 0) {
          const est1RM = Number(match.weight) * (1 + Number(match.reps || 1) / 30);
          const targetRepsMatch = targetRepsText.match(/(\d+)/);
          const targetReps = targetRepsMatch ? parseInt(targetRepsMatch[1], 10) : 10;
          const pct = Math.max(0.4, 1 - (targetReps * 0.025));
          const suggested = Math.round(est1RM * pct * 2) / 2;

          return { weight: suggested, unit: match.unit || 'kg' };
        }
      }
    }

    return { weight: 0, unit: 'kg' };
  },
};
