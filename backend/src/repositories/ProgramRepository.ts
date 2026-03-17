import prisma from '../db/prisma';

// ─── Repository ───────────────────────────────────────────────────────────────

export const ProgramRepository = {
  /** All active system template programs (isCustom = false) */
  async findAll() {
    return prisma.program.findMany({
      where: { isActive: true, isCustom: false, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  },

  /**
   * All programs visible to a specific user:
   *   - Every active system template (isCustom = false)
   *   - Plus any generated/custom programs this user has been assigned
   *
   * This ensures generated programs appear in the user's catalog immediately
   * after assignment without needing a separate fetch.
   */
  async findAllForUser(userId: string) {
    const templates = await prisma.program.findMany({
      where: { isActive: true, isCustom: false, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    const customAssignments = await prisma.userProgramAssignment.findMany({
      where: {
        userId,
        isActive: true,
        program: { isCustom: true, isActive: true, deletedAt: null },
      },
      include: { program: true },
      orderBy: { assignedAt: 'desc' },
    });

    const customPrograms = customAssignments.map((a) => a.program);

    // Deduplicate in case a program somehow appears in both lists
    const seenIds = new Set(templates.map((p) => p.id));
    const uniqueCustom = customPrograms.filter((p) => !seenIds.has(p.id));

    return [...templates, ...uniqueCustom];
  },

  /** Programs assigned to a specific user */
  async findAssignedToUser(userId: string) {
    const assignments = await prisma.userProgramAssignment.findMany({
      where: {
        userId,
        isActive: true,
        program: { isActive: true, deletedAt: null },
      },
      include: {
        program: true,
      },
      orderBy: { assignedAt: 'desc' },
    });
    return assignments.map((a) => ({ ...a.program, assignedAt: a.assignedAt, startDate: a.startDate }));
  },

  /** Full program with months → weeks → days → prescriptions → exercises */
  async findByIdWithStructure(id: string) {
    return prisma.program.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: {
        programMonths: {
          orderBy: { monthNumber: 'asc' },
          include: {
            programWeeks: {
              orderBy: { weekNumber: 'asc' },
              include: {
                workoutDays: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    exercisePrescriptions: {
                      orderBy: { sortOrder: 'asc' },
                      include: {
                        exercise: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  /** Weeks for a program (flattened across months) */
  async findWeeksByProgramId(programId: string) {
    return prisma.programWeek.findMany({
      where: {
        programMonth: { programId },
      },
      orderBy: { absoluteWeekNumber: 'asc' },
      include: {
        programMonth: true,
        workoutDays: {
          orderBy: { sortOrder: 'asc' },
          include: {
            exercisePrescriptions: {
              orderBy: { sortOrder: 'asc' },
              include: { exercise: true },
            },
          },
        },
      },
    });
  },

  /** Single workout day by week absolute number and day sort order */
  async findWorkoutDay(programId: string, absoluteWeek: number, dayOrder: number) {
    return prisma.workoutDay.findFirst({
      where: {
        sortOrder: dayOrder,
        programWeek: {
          absoluteWeekNumber: absoluteWeek,
          programMonth: { programId },
        },
      },
      include: {
        exercisePrescriptions: {
          orderBy: { sortOrder: 'asc' },
          include: { exercise: true },
        },
        programWeek: { include: { programMonth: true } },
      },
    });
  },

  /** Assign program to user (create only) */
  async createAssignment(userId: string, programId: string, startDate?: Date) {
    return prisma.userProgramAssignment.create({
      data: { userId, programId, startDate, isActive: true },
    });
  },

  async findById(id: string) {
    return prisma.program.findFirst({
      where: { id, isActive: true, deletedAt: null },
    });
  },

  /** Soft-delete a program */
  async softDeleteProgram(id: string) {
    return prisma.program.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  },

  /** Find a single exercise prescription by id */
  async findPrescriptionById(id: string) {
    return prisma.exercisePrescription.findFirst({
      where: { id },
      include: { exercise: true },
    });
  },

  /** Swap the exercise on a prescription */
  async updatePrescriptionExercise(prescriptionId: string, newExerciseId: string) {
    return prisma.exercisePrescription.update({
      where: { id: prescriptionId },
      data: { exerciseId: newExerciseId },
      include: { exercise: true },
    });
  },
};
