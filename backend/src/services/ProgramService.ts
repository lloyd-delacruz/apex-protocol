import { ProgramRepository } from '../repositories/ProgramRepository';

// ─── Service ──────────────────────────────────────────────────────────────────

export const ProgramService = {
  /** List all active program templates */
  async listPrograms() {
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
