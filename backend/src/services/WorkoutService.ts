import prisma from '../db/prisma';

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
};
