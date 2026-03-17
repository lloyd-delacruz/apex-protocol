import prisma from '../db/prisma';

export const ProgressionRepository = {
  /**
   * Returns the most recent achieved (readyToIncrease=true, progressionConfirmed=false)
   * training log per exercise for a user, within the past 14 days.
   */
  async getPendingProgressions(userId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 14);

    const logs = await prisma.trainingLog.findMany({
      where: {
        userId,
        readyToIncrease: true,
        progressionConfirmed: false,
        sessionDate: { gte: since },
      },
      include: {
        exercise: {
          select: { id: true, name: true, muscleGroup: true, equipment: true },
        },
      },
      orderBy: { sessionDate: 'desc' },
    });

    // Deduplicate: one entry per exercise (most recent first)
    const seen = new Set<string>();
    const result = [];
    for (const log of logs) {
      if (!seen.has(log.exerciseId)) {
        seen.add(log.exerciseId);
        result.push(log);
      }
    }
    return result;
  },

  async confirmProgression(
    trainingLogId: string,
    userId: string,
    exerciseId: string,
    newWeight: number,
    weightUnit: string,
    incrementPct: number,
  ) {
    await prisma.trainingLog.update({
      where: { id: trainingLogId },
      data: { progressionConfirmed: true },
    });

    await prisma.userExerciseWeight.upsert({
      where: { userId_exerciseId: { userId, exerciseId } },
      create: {
        userId,
        exerciseId,
        currentWeight: newWeight,
        weightUnit,
        preferredIncrementPct: incrementPct,
        confirmedAt: new Date(),
      },
      update: {
        currentWeight: newWeight,
        weightUnit,
        preferredIncrementPct: incrementPct,
        confirmedAt: new Date(),
      },
    });
  },

  async dismissProgression(trainingLogId: string) {
    await prisma.trainingLog.update({
      where: { id: trainingLogId },
      data: { progressionConfirmed: true },
    });
  },

  async getSuggestedWeight(userId: string, exerciseId: string) {
    return prisma.userExerciseWeight.findUnique({
      where: { userId_exerciseId: { userId, exerciseId } },
    });
  },

  async getSuggestedWeightsBatch(userId: string, exerciseIds: string[]) {
    return prisma.userExerciseWeight.findMany({
      where: { userId, exerciseId: { in: exerciseIds } },
    });
  },
};
