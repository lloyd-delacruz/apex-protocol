import prisma from '../db/prisma';

export interface StartSessionInput {
  userId: string;
  workoutDayId?: string;
}

export interface FinishSessionInput {
  sessionId: string;
  notes?: string;
  syncToAppleHealth?: boolean;
  postToStrava?: boolean;
  postToFitbit?: boolean;
}

export interface LogSetInput {
  sessionExerciseId: string;
  setType?: string;
  setOrder: number;
  targetReps?: number;
  actualReps?: number;
  targetWeight?: number;
  actualWeight?: number;
  unit?: string;
  rir?: number;
  rpe?: number;
  completed?: boolean;
  restAfterSec?: number;
}

export interface AddSessionExerciseInput {
  sessionId: string;
  exerciseId: string;
  orderIndex: number;
}

export const WorkoutSessionService = {
  /**
   * Start a new workout session.
   */
  async startSession(input: StartSessionInput) {
    const session = await prisma.workoutSession.create({
      data: {
        userId: input.userId,
        workoutDayId: input.workoutDayId,
        status: 'in_progress',
        startedAt: new Date(),
      },
    });

    let sessionExercises: any[] = [];

    if (input.workoutDayId) {
      const prescriptions = await prisma.exercisePrescription.findMany({
        where: { workoutDayId: input.workoutDayId },
        orderBy: { sortOrder: 'asc' },
      });

      if (prescriptions.length > 0) {
        await prisma.workoutSessionExercise.createMany({
          data: prescriptions.map((p: any, idx: number) => ({
            sessionId: session.id,
            exerciseId: p.exerciseId,
            workoutExerciseId: p.id,
            orderIndex: idx,
            wasReplaced: false,
          })),
        });

        sessionExercises = await prisma.workoutSessionExercise.findMany({
          where: { sessionId: session.id },
          orderBy: { orderIndex: 'asc' },
        });
      }
    }

    return { session, sessionExercises };
  },

  /**
   * Add a custom exercise to an existing in-progress session.
   */
  async addSessionExercise(input: AddSessionExerciseInput) {
    return prisma.workoutSessionExercise.create({
      data: {
        sessionId: input.sessionId,
        exerciseId: input.exerciseId,
        orderIndex: input.orderIndex,
        wasReplaced: false,
      },
    });
  },

  /**
   * Replace an exercise in a session.
   */
  async updateSessionExercise(sessionExerciseId: string, newExerciseId: string) {
    return prisma.workoutSessionExercise.update({
      where: { id: sessionExerciseId },
      data: {
        exerciseId: newExerciseId,
        wasReplaced: true,
      },
    });
  },

  /**
   * Remove an exercise from an in-progress session.
   */
  async removeSessionExercise(sessionExerciseId: string) {
    return prisma.workoutSessionExercise.delete({
      where: { id: sessionExerciseId },
    });
  },

  /**
   * Log an individual set for a session exercise.
   */
  async logSet(input: LogSetInput) {
    return prisma.loggedSet.create({
      data: {
        sessionExerciseId: input.sessionExerciseId,
        setType: input.setType ?? 'working',
        setOrder: input.setOrder,
        targetReps: input.targetReps,
        actualReps: input.actualReps,
        targetWeight: input.targetWeight,
        actualWeight: input.actualWeight,
        unit: input.unit ?? 'kg',
        rir: input.rir,
        rpe: input.rpe,
        completed: input.completed ?? true,
        completedAt: input.completed ? new Date() : null,
        restAfterSec: input.restAfterSec,
      },
    });
  },

  /**
   * Finish a workout session.
   */
  async finishSession(input: FinishSessionInput) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: input.sessionId },
    });

    if (!session) {
      throw Object.assign(new Error('Session not found'), { statusCode: 404 });
    }

    const finishedAt = new Date();
    const durationSec = Math.floor((finishedAt.getTime() - session.startedAt.getTime()) / 1000);

    return prisma.workoutSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        finishedAt,
        durationSec,
        notes: input.notes,
        syncToAppleHealth: input.syncToAppleHealth ?? false,
        postToStrava: input.postToStrava ?? false,
        postToFitbit: input.postToFitbit ?? false,
      },
    });
  },
};
