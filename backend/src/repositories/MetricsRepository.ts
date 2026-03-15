import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';

const { Decimal } = Prisma;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpsertMetricsInput {
  userId: string;
  entryDate: Date;
  bodyWeight?: number;
  bodyWeightUnit?: string;
  calories?: number;
  proteinGrams?: number;
  sleepHours?: number;
  hungerScore?: number;
  bingeUrgeScore?: number;
  moodScore?: number;
  trainingPerformanceScore?: number;
  notes?: string;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const MetricsRepository = {
  async upsert(data: UpsertMetricsInput) {
    const payload = {
      userId: data.userId,
      entryDate: data.entryDate,
      bodyWeight: data.bodyWeight !== undefined ? new Decimal(data.bodyWeight) : undefined,
      bodyWeightUnit: data.bodyWeightUnit,
      calories: data.calories,
      proteinGrams: data.proteinGrams,
      sleepHours: data.sleepHours !== undefined ? new Decimal(data.sleepHours) : undefined,
      hungerScore: data.hungerScore,
      bingeUrgeScore: data.bingeUrgeScore,
      moodScore: data.moodScore,
      trainingPerformanceScore: data.trainingPerformanceScore,
      notes: data.notes,
    };

    return prisma.bodyMetric.upsert({
      where: {
        userId_entryDate: {
          userId: data.userId,
          entryDate: data.entryDate,
        },
      },
      update: {
        // Only overwrite fields that were actually provided
        ...(data.bodyWeight !== undefined && { bodyWeight: new Decimal(data.bodyWeight) }),
        ...(data.bodyWeightUnit !== undefined && { bodyWeightUnit: data.bodyWeightUnit }),
        ...(data.calories !== undefined && { calories: data.calories }),
        ...(data.proteinGrams !== undefined && { proteinGrams: data.proteinGrams }),
        ...(data.sleepHours !== undefined && { sleepHours: new Decimal(data.sleepHours) }),
        ...(data.hungerScore !== undefined && { hungerScore: data.hungerScore }),
        ...(data.bingeUrgeScore !== undefined && { bingeUrgeScore: data.bingeUrgeScore }),
        ...(data.moodScore !== undefined && { moodScore: data.moodScore }),
        ...(data.trainingPerformanceScore !== undefined && {
          trainingPerformanceScore: data.trainingPerformanceScore,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      create: payload,
    });
  },

  async findByUser(
    userId: string,
    options: { limit?: number; offset?: number; startDate?: Date; endDate?: Date }
  ) {
    const { limit = 30, offset = 0, startDate, endDate } = options;

    const where: Record<string, unknown> = { userId };
    if (startDate || endDate) {
      where['entryDate'] = {};
      if (startDate) (where['entryDate'] as Record<string, unknown>)['gte'] = startDate;
      if (endDate) (where['entryDate'] as Record<string, unknown>)['lte'] = endDate;
    }

    const [metrics, total] = await Promise.all([
      prisma.bodyMetric.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        take: Math.min(limit, 365),
        skip: offset,
      }),
      prisma.bodyMetric.count({ where }),
    ]);

    return { metrics, total };
  },

  async findLatest(userId: string) {
    return prisma.bodyMetric.findFirst({
      where: { userId },
      orderBy: { entryDate: 'desc' },
    });
  },

  /** Recent entries for recovery score computation */
  async findRecent(userId: string, days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return prisma.bodyMetric.findMany({
      where: { userId, entryDate: { gte: cutoff } },
      orderBy: { entryDate: 'desc' },
    });
  },
};
