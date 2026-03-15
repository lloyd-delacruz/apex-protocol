import { MetricsRepository, UpsertMetricsInput } from '../repositories/MetricsRepository';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LogMetricsInput {
  userId: string;
  date?: string;
  body_weight_kg?: number;
  body_weight_unit?: string;
  calories?: number;
  protein_g?: number;
  sleep_hours?: number;
  hunger?: number;
  mood?: number;
  training_performance?: number;
  binge_urge?: number;
  notes?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const MetricsService = {
  async logMetrics(input: LogMetricsInput) {
    const entryDate = input.date ? new Date(input.date) : new Date();
    // Normalise to midnight UTC to avoid timezone drift in date comparisons
    entryDate.setUTCHours(0, 0, 0, 0);

    const data: UpsertMetricsInput = {
      userId: input.userId,
      entryDate,
      bodyWeight: input.body_weight_kg,
      bodyWeightUnit: input.body_weight_unit,
      calories: input.calories,
      proteinGrams: input.protein_g,
      sleepHours: input.sleep_hours,
      hungerScore: input.hunger,
      bingeUrgeScore: input.binge_urge,
      moodScore: input.mood,
      trainingPerformanceScore: input.training_performance,
      notes: input.notes,
    };

    return MetricsRepository.upsert(data);
  },

  async getHistory(
    userId: string,
    options: { limit?: number; offset?: number; startDate?: string; endDate?: string }
  ) {
    return MetricsRepository.findByUser(userId, {
      limit: options.limit,
      offset: options.offset,
      startDate: options.startDate ? new Date(options.startDate) : undefined,
      endDate: options.endDate ? new Date(options.endDate) : undefined,
    });
  },

  async getLatest(userId: string) {
    return MetricsRepository.findLatest(userId);
  },

  /**
   * Compute a recovery score (0–100) based on recent body metrics.
   * Factors: sleep, mood, training performance, hunger (inverse).
   */
  async getRecoveryScore(userId: string): Promise<number> {
    const entries = await MetricsRepository.findRecent(userId, 7);

    if (entries.length === 0) return 50;

    const scores: number[] = [];

    for (const entry of entries) {
      let entryScore = 0;
      let factors = 0;

      if (entry.sleepHours !== null) {
        const sleep = Number(entry.sleepHours);
        // 8h = 100, 6h = 60, <5h = 20
        const sleepScore = Math.min(100, Math.max(20, sleep * 12.5));
        entryScore += sleepScore;
        factors++;
      }

      if (entry.moodScore !== null) {
        // 1-10 scale → 10–100
        entryScore += entry.moodScore * 10;
        factors++;
      }

      if (entry.trainingPerformanceScore !== null) {
        entryScore += entry.trainingPerformanceScore * 10;
        factors++;
      }

      if (entry.hungerScore !== null) {
        // High hunger can indicate under-recovery — inverse score
        const hungerRecovery = Math.max(0, 100 - (entry.hungerScore - 5) * 10);
        entryScore += hungerRecovery;
        factors++;
      }

      if (factors > 0) {
        scores.push(entryScore / factors);
      }
    }

    if (scores.length === 0) return 50;

    // Weighted average: recent days count more
    const total = scores.reduce((a, b) => a + b, 0);
    return Math.round(Math.min(100, Math.max(0, total / scores.length)));
  },
};
