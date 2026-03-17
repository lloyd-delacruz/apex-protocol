import { ProgramGeneratorService } from '../services/ProgramGeneratorService';
import { ExerciseSelectionService } from '../services/ExerciseSelectionService';
import { ProgramTemplateService } from '../services/ProgramTemplateService';
import prisma from '../db/prisma';
import { ExerciseDTO } from '../repositories/ExerciseRepository';

// Mock dependencies
jest.mock('../db/prisma', () => ({
  program: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  programMonth: {
    create: jest.fn(),
  },
  programWeek: {
    create: jest.fn(),
  },
  workoutDay: {
    create: jest.fn(),
  },
  exercisePrescription: {
    createMany: jest.fn(),
  },
}));

jest.mock('../services/ExerciseSelectionService');
jest.mock('../services/ProgramTemplateService');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('ProgramGeneratorService', () => {
  const mockExercise: ExerciseDTO = {
    id: 'ex-1',
    name: 'Bench Press',
    category: 'compound',
    muscleGroup: 'Chest',
    equipment: 'barbell',
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    bodyPart: null,
    primaryMuscle: null,
    secondaryMuscles: null,
    movementPattern: null,
    exerciseType: null,
    goalTags: null,
    difficulty: null,
    instructions: null,
    mediaUrl: null,
    videoUrl: null,
    isCompound: true,
    isUnilateral: false,
    externalId: null,
    externalSource: null,
    lastSyncedAt: null,
    isEnriched: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (ExerciseSelectionService.loadExercisePool as jest.Mock).mockResolvedValue([mockExercise]);
    (ExerciseSelectionService.selectExercisesForDay as jest.Mock).mockReturnValue([mockExercise]);

    (ProgramTemplateService.getRepRangeForGoalsAndPhase as jest.Mock).mockReturnValue('5-8');
    (ProgramTemplateService.getWeeklySplit as jest.Mock).mockReturnValue([
      { phase: 'Test Phase', workoutType: 'Test Workout', notes: 'Test Notes', targetMuscleGroups: ['Chest'], isStrengthDay: false, isCardioOrRest: false },
    ]);

    // Sequential create mocks
    (mockPrisma.program.create as jest.Mock).mockResolvedValue({ id: 'prog-1', name: 'Generated Test Program' });
    (mockPrisma.programMonth.create as jest.Mock).mockResolvedValue({ id: 'month-1' });
    (mockPrisma.programWeek.create as jest.Mock).mockResolvedValue({ id: 'week-1' });
    (mockPrisma.workoutDay.create as jest.Mock).mockResolvedValue({ id: 'day-1' });
    (mockPrisma.exercisePrescription.createMany as jest.Mock).mockResolvedValue({ count: 1 });
    (mockPrisma.program.findUnique as jest.Mock).mockResolvedValue({ id: 'prog-1', name: 'Generated Test Program', programMonths: [] });
  });

  it('generates a program structure successfully', async () => {
    const result = await ProgramGeneratorService.generateProgram({
      userId: 'user-1',
      goals: ['strength'],
      experienceLevel: 'intermediate',
      daysPerWeek: 3,
      equipment: 'full_gym',
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('prog-1');

    // Verify services were called with right arguments
    expect(ExerciseSelectionService.loadExercisePool).toHaveBeenCalledWith('full_gym', 'strength', 'intermediate');
    expect(ProgramTemplateService.getWeeklySplit).toHaveBeenCalledWith(3, ['strength']);
    expect(ProgramTemplateService.getRepRangeForGoalsAndPhase).toHaveBeenCalledWith(['strength'], expect.any(Number));

    // Verify the program was created with correct metadata
    expect(mockPrisma.program.create).toHaveBeenCalledTimes(1);
    const createArgs = (mockPrisma.program.create as jest.Mock).mock.calls[0][0];
    expect(createArgs.data.authorId).toBe('user-1');
    expect(createArgs.data.isCustom).toBe(true);
    expect(createArgs.data.goalType).toBe('strength');
    expect(createArgs.data.sourceType).toBe('ai_generator');
    expect(createArgs.data.totalWeeks).toBe(12);

    // Verify sequential structure — 3 months × 4 weeks = 12 week.creates
    expect(mockPrisma.programMonth.create).toHaveBeenCalledTimes(3);
    expect(mockPrisma.programWeek.create).toHaveBeenCalledTimes(12); // 3 months × 4 weeks

    // workoutDay.create called once per week (1-day split mock) × 12 weeks = 12
    expect(mockPrisma.workoutDay.create).toHaveBeenCalledTimes(12);

    // exercisePrescription.createMany called once per day = 12
    expect(mockPrisma.exercisePrescription.createMany).toHaveBeenCalledTimes(12);

    // Verify prescription content
    const prescriptionCall = (mockPrisma.exercisePrescription.createMany as jest.Mock).mock.calls[0][0];
    expect(prescriptionCall.data[0].exerciseId).toBe('ex-1');
    expect(prescriptionCall.data[0].targetRepRange).toBe('5-8');
  });

  it('throws an error if no exercises match equipment', async () => {
    (ExerciseSelectionService.loadExercisePool as jest.Mock).mockRejectedValue(
      Object.assign(new Error('No exercises found'), { statusCode: 400 })
    );

    await expect(ProgramGeneratorService.generateProgram({
      userId: 'user-1',
      goals: ['strength'],
      experienceLevel: 'intermediate',
      daysPerWeek: 3,
      equipment: 'bodyweight_only',
    })).rejects.toThrow('No exercises found');

    // Prisma should never be called if exercise pool loading fails
    expect(mockPrisma.program.create).not.toHaveBeenCalled();
    expect(ProgramTemplateService.getWeeklySplit).not.toHaveBeenCalled();
  });

  it('throws if goals array is empty', async () => {
    await expect(ProgramGeneratorService.generateProgram({
      userId: 'user-1',
      goals: [],
      experienceLevel: 'beginner',
      daysPerWeek: 3,
      equipment: 'full_gym',
    })).rejects.toThrow('At least one goal is required.');
  });
});
