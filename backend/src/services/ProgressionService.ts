import { ProgressionRepository } from '../repositories/ProgressionRepository';

export const ProgressionService = {
  async getPending(userId: string) {
    const logs = await ProgressionRepository.getPendingProgressions(userId);
    return logs.map((log) => ({
      trainingLogId: log.id,
      exerciseId: log.exerciseId,
      exerciseName: log.exercise.name,
      muscleGroup: log.exercise.muscleGroup ?? null,
      sessionDate: log.sessionDate,
      achievedWeight: log.weight !== null ? Number(log.weight) : null,
      weightUnit: log.weightUnit,
    }));
  },

  async confirm(
    trainingLogId: string,
    userId: string,
    exerciseId: string,
    currentWeight: number,
    incrementPct: number,
    weightUnit: string,
  ) {
    const newWeight = roundToHalf(currentWeight * (1 + incrementPct / 100));
    await ProgressionRepository.confirmProgression(
      trainingLogId,
      userId,
      exerciseId,
      newWeight,
      weightUnit,
      incrementPct,
    );
    return { newWeight, weightUnit };
  },

  async dismiss(trainingLogId: string) {
    await ProgressionRepository.dismissProgression(trainingLogId);
  },

  async getSuggestedWeight(userId: string, exerciseId: string) {
    const record = await ProgressionRepository.getSuggestedWeight(userId, exerciseId);
    if (!record) return null;
    return {
      suggestedWeight: Number(record.currentWeight),
      weightUnit: record.weightUnit,
      preferredIncrementPct: record.preferredIncrementPct,
    };
  },

  async getSuggestedWeightsBatch(userId: string, exerciseIds: string[]) {
    const records = await ProgressionRepository.getSuggestedWeightsBatch(userId, exerciseIds);
    // Return a map: exerciseId → { suggestedWeight, weightUnit, preferredIncrementPct }
    const result: Record<string, { suggestedWeight: number; weightUnit: string; preferredIncrementPct: number }> = {};
    for (const r of records) {
      result[r.exerciseId] = {
        suggestedWeight: Number(r.currentWeight),
        weightUnit: r.weightUnit,
        preferredIncrementPct: r.preferredIncrementPct,
      };
    }
    return result;
  },
};

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}
