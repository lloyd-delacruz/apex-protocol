import prisma from '../db/prisma';
import { TrainingLogRepository, CreateTrainingLogInput } from '../repositories/TrainingLogRepository';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LogExerciseInput {
  userId: string;
  exerciseId: string;
  sessionDate: string;
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
  notes?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const TrainingLogService = {
  /**
   * Log an exercise session.
   * Computes progression fields server-side from the prescription data.
   */
  async logExercise(input: LogExerciseInput) {
    const date = new Date(input.sessionDate);

    // Collect performed set reps
    const sets = [input.set1Reps, input.set2Reps, input.set3Reps, input.set4Reps].filter(
      (r): r is number => r !== undefined && r !== null
    );

    // Compute total reps
    const totalReps = sets.length > 0 ? sets.reduce((a, b) => a + b, 0) : null;

    // Resolve rep range from prescription if provided
    let lowerRep: number | undefined;
    let upperRep: number | undefined;
    let incrementValue = 0;

    if (input.exercisePrescriptionId) {
      const prescription = await prisma.exercisePrescription.findUnique({
        where: { id: input.exercisePrescriptionId },
      });

      if (prescription?.targetRepRange) {
        const parsed = parseRepRange(prescription.targetRepRange);
        lowerRep = parsed.lower;
        upperRep = parsed.upper;
      }

      if (prescription?.incrementValue) {
        incrementValue = Number(prescription.incrementValue);
      }
    }

    // Compute status and progression
    let status: string | undefined;
    let readyToIncrease: boolean | undefined;
    let nextWeight: number | undefined;

    if (sets.length > 0 && lowerRep !== undefined && upperRep !== undefined) {
      const allAboveLower = sets.every((r) => r >= lowerRep!);
      const allAtOrAboveUpper = sets.every((r) => r >= upperRep!);

      if (allAtOrAboveUpper) {
        status = 'ACHIEVED';
        readyToIncrease = true;
      } else if (allAboveLower) {
        status = 'PROGRESS';
        readyToIncrease = false;
      } else {
        status = 'FAILED';
        readyToIncrease = false;
      }

      if (input.weight !== undefined) {
        nextWeight = readyToIncrease
          ? roundToHalf(input.weight + incrementValue)
          : input.weight;
      }
    }

    const logData: CreateTrainingLogInput = {
      userId: input.userId,
      exerciseId: input.exerciseId,
      sessionDate: date,
      programId: input.programId,
      programWeekId: input.programWeekId,
      workoutDayId: input.workoutDayId,
      exercisePrescriptionId: input.exercisePrescriptionId,
      weight: input.weight,
      weightUnit: input.weightUnit,
      set1Reps: input.set1Reps,
      set2Reps: input.set2Reps,
      set3Reps: input.set3Reps,
      set4Reps: input.set4Reps,
      totalReps: totalReps ?? undefined,
      lowerRep,
      upperRep,
      readyToIncrease,
      nextWeight,
      status,
      notes: input.notes,
    };

    return TrainingLogRepository.create(logData);
  },

  async getHistory(
    userId: string,
    options: { limit?: number; offset?: number; startDate?: string; endDate?: string }
  ) {
    return TrainingLogRepository.findHistoryByUser(userId, {
      limit: options.limit,
      offset: options.offset,
      startDate: options.startDate ? new Date(options.startDate) : undefined,
      endDate: options.endDate ? new Date(options.endDate) : undefined,
    });
  },

  async getExerciseHistory(userId: string, exerciseId: string) {
    return TrainingLogRepository.findByUserAndExercise(userId, exerciseId);
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseRepRange(range: string): { lower: number; upper: number } {
  const parts = range.split('-').map((s) => parseInt(s.trim(), 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lower: parts[0], upper: parts[1] };
  }
  const single = parseInt(range.trim(), 10);
  return { lower: single, upper: single };
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}
