import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';

const { Decimal } = Prisma;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateTrainingLogInput {
  userId: string;
  exerciseId: string;
  sessionDate: Date;
  programId?: string;
  programWeekId?: string;
  workoutDayId?: string;
  exercisePrescriptionId?: string;
  weight?: number;
  weightUnit?: string;
  set1Reps?: number;
  set2Reps?: number;
  set3Reps?: number;
  set4Reps?: number;
  rir?: number;
  totalReps?: number;
  lowerRep?: number;
  upperRep?: number;
  readyToIncrease?: boolean;
  nextWeight?: number;
  status?: string;
  notes?: string;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const TrainingLogRepository = {
  async create(data: CreateTrainingLogInput) {
    return prisma.trainingLog.create({
      data: {
        userId: data.userId,
        exerciseId: data.exerciseId,
        sessionDate: data.sessionDate,
        programId: data.programId,
        programWeekId: data.programWeekId,
        workoutDayId: data.workoutDayId,
        exercisePrescriptionId: data.exercisePrescriptionId,
        weight: data.weight !== undefined ? new Decimal(data.weight) : null,
        weightUnit: data.weightUnit ?? 'lb',
        set1Reps: data.set1Reps,
        set2Reps: data.set2Reps,
        set3Reps: data.set3Reps,
        set4Reps: data.set4Reps,
        rir: data.rir,
        totalReps: data.totalReps,
        lowerRep: data.lowerRep,
        upperRep: data.upperRep,
        readyToIncrease: data.readyToIncrease,
        nextWeight: data.nextWeight !== undefined ? new Decimal(data.nextWeight) : null,
        status: data.status,
        notes: data.notes,
      },
      include: {
        exercise: true,
        exercisePrescription: true,
      },
    });
  },

  async findByUserAndDate(userId: string, sessionDate: Date) {
    return prisma.trainingLog.findMany({
      where: { userId, sessionDate },
      include: { exercise: true, workoutDay: true, exercisePrescription: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findHistoryByUser(
    userId: string,
    options: { limit?: number; offset?: number; startDate?: Date; endDate?: Date }
  ) {
    const { limit = 20, offset = 0, startDate, endDate } = options;

    const where: Record<string, unknown> = { userId };
    if (startDate || endDate) {
      where['sessionDate'] = {};
      if (startDate) (where['sessionDate'] as Record<string, unknown>)['gte'] = startDate;
      if (endDate) (where['sessionDate'] as Record<string, unknown>)['lte'] = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.trainingLog.findMany({
        where,
        include: { exercise: true, workoutDay: true },
        orderBy: [{ sessionDate: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(limit, 100),
        skip: offset,
      }),
      prisma.trainingLog.count({ where }),
    ]);

    return { logs, total };
  },

  /** Per-exercise history for progression charts */
  async findByUserAndExercise(userId: string, exerciseId: string, limit = 30) {
    return prisma.trainingLog.findMany({
      where: { userId, exerciseId },
      orderBy: { sessionDate: 'desc' },
      take: limit,
      include: { exercise: true },
    });
  },

  /** Sessions grouped by date (distinct dates) */
  async findSessionDates(userId: string, limit = 50) {
    const results = await prisma.trainingLog.findMany({
      where: { userId },
      select: { sessionDate: true, workoutDay: { select: { workoutType: true } } },
      distinct: ['sessionDate'],
      orderBy: { sessionDate: 'desc' },
      take: limit,
    });
    return results;
  },

  /** Volume per week (total reps × weight) for analytics */
  async findWeeklyVolume(userId: string, weeks = 12) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);

    return prisma.trainingLog.findMany({
      where: {
        userId,
        sessionDate: { gte: cutoff },
        weight: { not: null },
        totalReps: { not: null },
      },
      select: {
        sessionDate: true,
        weight: true,
        totalReps: true,
      },
      orderBy: { sessionDate: 'asc' },
    });
  },
};
