import prisma from '../db/prisma';

// ─── Repository ───────────────────────────────────────────────────────────────

export const ProgramRepository = {
  /** All active programs (template catalog) */
  async findAll() {
    return prisma.program.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  },

  /** Programs assigned to a specific user */
  async findAssignedToUser(userId: string) {
    const assignments = await prisma.userProgramAssignment.findMany({
      where: { userId, isActive: true },
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
};
