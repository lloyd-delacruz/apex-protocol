import prisma from '../db/prisma';

export interface StartSessionInput {
  userId: string;
  workoutDayId?: string;
}

export interface FinishSessionInput {
  sessionId: string;
  notes?: string;
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
   * Creates the session record and populates workout_session_exercises
   * from the exercise prescriptions for the given workoutDayId.
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
          data: prescriptions.map((p, idx) => ({
            sessionId: session.id,
            exerciseId: p.exerciseId,
            workoutExerciseId: p.id, // stores the prescription ID for mapping
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
   * Replace an exercise in a session (marks was_replaced = true, updates exerciseId).
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
   * Finish a workout session and compute summary stats.
   */
  async finishSession(input: FinishSessionInput) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: input.sessionId },
      include: { workoutDay: true },
    });

    if (!session) {
      throw Object.assign(new Error('Session not found'), { statusCode: 404 });
    }

    if (session.status !== 'in_progress') {
      throw Object.assign(new Error('Session is not in progress'), { statusCode: 400 });
    }

    const finishedAt = new Date();
    const durationSec = Math.floor((finishedAt.getTime() - session.startedAt.getTime()) / 1000);

    // Compute stats from training logs of the same day for this user
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await prisma.trainingLog.findMany({
      where: {
        userId: session.userId,
        workoutDayId: session.workoutDayId,
        sessionDate: { gte: today },
      },
    });

    let totalVolume = 0;
    const completedExercises = new Set<string>();

    logs.forEach((log) => {
      const weight = Number(log.weight || 0);
      const reps = (log.set1Reps || 0) + (log.set2Reps || 0) + (log.set3Reps || 0) + (log.set4Reps || 0);
      totalVolume += weight * reps;
      completedExercises.add(log.exerciseId);
    });

    // Simple calorie estimate: 5 kcal per minute for weight training
    const estimatedCalories = Math.floor((durationSec / 60) * 5);

    const updatedSession = await prisma.workoutSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        finishedAt,
        durationSec,
        totalVolume,
        estimatedCalories,
        completedExerciseCount: completedExercises.size,
        notes: input.notes,
      },
    });

    await this.updateWeeklyProgress(session.userId);

    return updatedSession;
  },

  /**
   * Update or create the weekly progress record for the user.
   */
  async updateWeeklyProgress(userId: string) {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const workoutsThisWeek = await prisma.workoutSession.count({
      where: {
        userId,
        status: 'completed',
        finishedAt: { gte: weekStart },
      },
    });

    return prisma.weeklyProgress.upsert({
      where: { userId_weekStartDate: { userId, weekStartDate: weekStart } },
      update: { workoutsCompleted: workoutsThisWeek },
      create: {
        userId,
        weekStartDate: weekStart,
        workoutsCompleted: workoutsThisWeek,
        weeklyGoal: 3,
      },
    });
  },
};
