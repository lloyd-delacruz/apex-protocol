import { ProgramRepository } from '../repositories/ProgramRepository';

// ─── Service ──────────────────────────────────────────────────────────────────

export const ProgramService = {
  /**
   * List programs visible to a user.
   * When userId is provided, includes the user's own generated/custom programs
   * alongside system templates so they appear in the catalog after assignment.
   */
  async listPrograms(userId?: string) {
    if (userId) return ProgramRepository.findAllForUser(userId);
    return ProgramRepository.findAll();
  },

  /** Programs assigned to a user */
  async getAssignedPrograms(userId: string) {
    return ProgramRepository.findAssignedToUser(userId);
  },

  /** Full program structure with all nested data */
  async getProgramById(id: string) {
    const program = await ProgramRepository.findByIdWithStructure(id);
    if (!program) {
      throw Object.assign(new Error('Program not found'), { statusCode: 404 });
    }
    return program;
  },

  /** Weeks for a program (flat list ordered by absolute week number) */
  async getProgramWeeks(programId: string) {
    const program = await ProgramRepository.findById(programId);
    if (!program) {
      throw Object.assign(new Error('Program not found'), { statusCode: 404 });
    }
    return ProgramRepository.findWeeksByProgramId(programId);
  },

  /** Workout day by week number and day sort order (1-indexed) */
  async getWorkoutDay(programId: string, week: number, day: number) {
    const workoutDay = await ProgramRepository.findWorkoutDay(programId, week, day);
    if (!workoutDay) {
      throw Object.assign(new Error('Workout day not found'), { statusCode: 404 });
    }
    return workoutDay;
  },

  /** Soft-delete a custom program owned by userId */
  async deleteProgram(id: string, userId?: string) {
    const program = await ProgramRepository.findById(id);
    if (!program) {
      throw Object.assign(new Error('Program not found'), { statusCode: 404 });
    }
    if (!program.isCustom) {
      throw Object.assign(new Error('System template programs cannot be deleted'), { statusCode: 403 });
    }
    if (userId && program.authorId && program.authorId !== userId) {
      throw Object.assign(new Error('Not authorized to delete this program'), { statusCode: 403 });
    }
    return ProgramRepository.softDeleteProgram(id);
  },

  /** Swap the exercise on an exercise prescription */
  async updatePrescriptionExercise(programId: string, prescriptionId: string, newExerciseId: string) {
    const program = await ProgramRepository.findById(programId);
    if (!program) {
      throw Object.assign(new Error('Program not found'), { statusCode: 404 });
    }
    const prescription = await ProgramRepository.findPrescriptionById(prescriptionId);
    if (!prescription) {
      throw Object.assign(new Error('Exercise prescription not found'), { statusCode: 404 });
    }
    return ProgramRepository.updatePrescriptionExercise(prescriptionId, newExerciseId);
  },

  /** Assign a program to a user */
  async assignProgram(userId: string, programId: string, startDate?: string) {
    const program = await ProgramRepository.findById(programId);
    if (!program) {
      throw Object.assign(new Error('Program not found'), { statusCode: 404 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const assignment = await ProgramRepository.createAssignment(userId, programId, start);
    return { assignment, program };
  },
};
