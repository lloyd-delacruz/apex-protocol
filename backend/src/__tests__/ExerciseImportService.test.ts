/**
 * ExerciseImportService — Unit Tests
 *
 * Verifies import, upsert, deduplication, and error handling.
 * Mocks both ExerciseDbService (HTTP) and Prisma (database).
 */

import { ExerciseImportService } from '../services/ExerciseImportService';

// ─── Mock ExerciseDbService ───────────────────────────────────────────────────

jest.mock('../services/ExerciseDbService', () => ({
  ExerciseDbService: {
    getExercises: jest.fn(),
    getExercisesByBodyPart: jest.fn(),
    getExercisesByEquipment: jest.fn(),
  },
}));

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const mockPrismaExercise = {
  findFirst: jest.fn(),
  update: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockResolvedValue({}),
};

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    exercise: mockPrismaExercise,
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { ExerciseDbService } from '../services/ExerciseDbService';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const rawExercise = {
  id: 'ext-001',
  name: 'barbell bench press',
  gifUrl: 'https://example.com/bench.gif',
  bodyPart: 'chest',
  equipment: 'barbell',
  target: 'pectorals',
  secondaryMuscles: ['triceps', 'delts'],
  instructions: ['Lie flat on bench.', 'Grip bar at shoulder width.'],
};

const rawExercise2 = {
  id: 'ext-002',
  name: 'dumbbell curl',
  gifUrl: 'https://example.com/curl.gif',
  bodyPart: 'upper arms',
  equipment: 'dumbbell',
  target: 'biceps',
  secondaryMuscles: ['brachialis'],
  instructions: ['Stand upright.', 'Curl dumbbell up.'],
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no existing records in DB
  mockPrismaExercise.findFirst.mockResolvedValue(null);
  mockPrismaExercise.update.mockResolvedValue({});
  mockPrismaExercise.create.mockResolvedValue({});
});

// ─── normalise() — pure function ─────────────────────────────────────────────

describe('normalise()', () => {
  it('maps ExerciseDB bodyPart to Apex Protocol bodyPart', () => {
    const result = ExerciseImportService.normalise(rawExercise);
    expect(result.bodyPart).toBe('Upper Body');
  });

  it('maps ExerciseDB equipment to Apex Protocol equipment', () => {
    const result = ExerciseImportService.normalise(rawExercise);
    expect(result.equipment).toBe('barbell');
  });

  it('maps body weight equipment to bodyweight', () => {
    const result = ExerciseImportService.normalise({ ...rawExercise, equipment: 'body weight' });
    expect(result.equipment).toBe('bodyweight');
  });

  it('sets externalId and externalSource correctly', () => {
    const result = ExerciseImportService.normalise(rawExercise);
    expect(result.externalId).toBe('ext-001');
    expect(result.externalSource).toBe('exercisedb');
  });

  it('title-cases the exercise name', () => {
    const result = ExerciseImportService.normalise(rawExercise);
    expect(result.name).toBe('Barbell Bench Press');
  });

  it('joins instructions into a numbered string', () => {
    const result = ExerciseImportService.normalise(rawExercise);
    expect(result.instructions).toContain('1.');
    expect(result.instructions).toContain('2.');
  });

  it('sets instructions to null when instructions array is empty', () => {
    const result = ExerciseImportService.normalise({ ...rawExercise, instructions: [] });
    expect(result.instructions).toBeNull();
  });

  it('sets movementPattern via classification', () => {
    const result = ExerciseImportService.normalise(rawExercise);
    // Bench press should be horizontal_push
    expect(result.movementPattern).toBe('horizontal_push');
  });

  it('sets isCompound via classification', () => {
    const result = ExerciseImportService.normalise(rawExercise);
    expect(result.isCompound).toBe(true);
  });

  it('sets goalTags including strength for barbell compound', () => {
    const result = ExerciseImportService.normalise(rawExercise);
    expect(result.goalTags).toEqual(expect.arrayContaining(['strength', 'hypertrophy']));
  });

  it('maps upper arms body part to Upper Body', () => {
    const result = ExerciseImportService.normalise(rawExercise2);
    expect(result.bodyPart).toBe('Upper Body');
  });

  it('maps waist body part to Core', () => {
    const coreEx = { ...rawExercise, bodyPart: 'waist', target: 'abs' };
    const result = ExerciseImportService.normalise(coreEx);
    expect(result.bodyPart).toBe('Core');
  });

  it('sets mediaUrl from gifUrl', () => {
    const result = ExerciseImportService.normalise(rawExercise);
    expect(result.mediaUrl).toBe('https://example.com/bench.gif');
  });

  it('sets mediaUrl to null when gifUrl is empty string', () => {
    const result = ExerciseImportService.normalise({ ...rawExercise, gifUrl: '' });
    expect(result.mediaUrl).toBeNull();
  });
});

// ─── Deduplication — Strategy 1: match by externalId ─────────────────────────

describe('deduplication — strategy 1 (existing import)', () => {
  it('updates existing record when (externalId, externalSource) matches', async () => {
    const existingRecord = { id: 'db-uuid-001', externalId: 'ext-001', externalSource: 'exercisedb' };
    // findFirst returns the existing record on first call (strategy 1 check)
    mockPrismaExercise.findFirst.mockResolvedValueOnce(existingRecord);

    (ExerciseDbService.getExercisesByBodyPart as jest.Mock).mockResolvedValue([rawExercise]);

    const result = await ExerciseImportService.importByBodyPart('chest');

    expect(result.updated).toBe(1);
    expect(result.imported).toBe(0);
    expect(mockPrismaExercise.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'db-uuid-001' },
      })
    );
    expect(mockPrismaExercise.create).not.toHaveBeenCalled();
  });
});

// ─── Deduplication — Strategy 2: match by name ───────────────────────────────

describe('deduplication — strategy 2 (name match)', () => {
  it('enriches existing record when name matches but no externalId', async () => {
    const localRecord = {
      id: 'db-uuid-002',
      externalId: null,
      externalSource: null,
      mediaUrl: null,
      instructions: null,
      secondaryMuscles: null,
    };
    // First call (strategy 1): no match
    mockPrismaExercise.findFirst.mockResolvedValueOnce(null);
    // Second call (strategy 2): name match
    mockPrismaExercise.findFirst.mockResolvedValueOnce(localRecord);

    (ExerciseDbService.getExercisesByBodyPart as jest.Mock).mockResolvedValue([rawExercise]);

    const result = await ExerciseImportService.importByBodyPart('chest');

    expect(result.updated).toBe(1);
    expect(result.imported).toBe(0);
    expect(mockPrismaExercise.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'db-uuid-002' },
        data: expect.objectContaining({
          externalId: 'ext-001',
          externalSource: 'exercisedb',
        }),
      })
    );
  });

  it('skips when name matches but a DIFFERENT external source owns it', async () => {
    const foreignRecord = {
      id: 'db-uuid-003',
      externalId: 'foreign-123',
      externalSource: 'wger',
      mediaUrl: null,
      instructions: null,
      secondaryMuscles: null,
    };
    mockPrismaExercise.findFirst.mockResolvedValueOnce(null);
    mockPrismaExercise.findFirst.mockResolvedValueOnce(foreignRecord);

    (ExerciseDbService.getExercisesByBodyPart as jest.Mock).mockResolvedValue([rawExercise]);

    const result = await ExerciseImportService.importByBodyPart('chest');

    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(0);
    expect(result.updated).toBe(0);
    expect(mockPrismaExercise.create).not.toHaveBeenCalled();
    expect(mockPrismaExercise.update).not.toHaveBeenCalled();
  });

  it('does NOT overwrite existing non-null mediaUrl when enriching', async () => {
    const localRecord = {
      id: 'db-uuid-004',
      externalId: null,
      externalSource: null,
      mediaUrl: 'https://existing-media.com/bench.gif',  // already set
      instructions: null,
      secondaryMuscles: null,
    };
    mockPrismaExercise.findFirst.mockResolvedValueOnce(null);
    mockPrismaExercise.findFirst.mockResolvedValueOnce(localRecord);

    (ExerciseDbService.getExercisesByBodyPart as jest.Mock).mockResolvedValue([rawExercise]);

    await ExerciseImportService.importByBodyPart('chest');

    const updateCall = mockPrismaExercise.update.mock.calls[0][0];
    // mediaUrl should NOT be in the update data (it's already set)
    expect(updateCall.data.mediaUrl).toBeUndefined();
  });
});

// ─── Deduplication — Strategy 3: new record ──────────────────────────────────

describe('deduplication — strategy 3 (new record)', () => {
  it('creates a new record when no existing match is found', async () => {
    // Both findFirst calls return null → new record
    mockPrismaExercise.findFirst.mockResolvedValue(null);

    (ExerciseDbService.getExercisesByBodyPart as jest.Mock).mockResolvedValue([rawExercise]);

    const result = await ExerciseImportService.importByBodyPart('chest');

    expect(result.imported).toBe(1);
    expect(result.updated).toBe(0);
    expect(mockPrismaExercise.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Barbell Bench Press',
          externalId: 'ext-001',
          externalSource: 'exercisedb',
          equipment: 'barbell',
          isActive: true,
        }),
      })
    );
  });

  it('correctly maps goalTags on the created record', async () => {
    mockPrismaExercise.findFirst.mockResolvedValue(null);

    (ExerciseDbService.getExercisesByBodyPart as jest.Mock).mockResolvedValue([rawExercise]);

    await ExerciseImportService.importByBodyPart('chest');

    const createCall = mockPrismaExercise.create.mock.calls[0][0];
    expect(createCall.data.goalTags).toEqual(expect.arrayContaining(['strength', 'hypertrophy']));
  });
});

// ─── Error isolation ──────────────────────────────────────────────────────────

describe('error isolation', () => {
  it('continues processing remaining exercises when one fails', async () => {
    // First exercise causes DB error; second should still be processed
    mockPrismaExercise.findFirst
      .mockRejectedValueOnce(new Error('DB connection lost'))
      .mockResolvedValue(null);  // second exercise succeeds

    (ExerciseDbService.getExercisesByBodyPart as jest.Mock).mockResolvedValue([rawExercise, rawExercise2]);

    const result = await ExerciseImportService.importByBodyPart('chest');

    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].externalId).toBe('ext-001');
    expect(result.errors[0].error).toContain('DB connection lost');
    // Second exercise should still succeed
    expect(result.imported).toBe(1);
  });

  it('accumulates multiple errors without throwing', async () => {
    mockPrismaExercise.findFirst.mockRejectedValue(new Error('DB error'));

    (ExerciseDbService.getExercisesByBodyPart as jest.Mock).mockResolvedValue([rawExercise, rawExercise2]);

    const result = await ExerciseImportService.importByBodyPart('chest');

    expect(result.failed).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(result.imported).toBe(0);
    expect(result.updated).toBe(0);
  });
});

// ─── importByEquipment ────────────────────────────────────────────────────────

describe('importByEquipment', () => {
  it('calls ExerciseDbService.getExercisesByEquipment and processes results', async () => {
    mockPrismaExercise.findFirst.mockResolvedValue(null);
    (ExerciseDbService.getExercisesByEquipment as jest.Mock).mockResolvedValue([rawExercise]);

    const result = await ExerciseImportService.importByEquipment('barbell');

    expect(ExerciseDbService.getExercisesByEquipment).toHaveBeenCalledWith('barbell');
    expect(result.imported).toBe(1);
  });
});

// ─── Duplicate prevention summary ────────────────────────────────────────────

describe('duplicate prevention', () => {
  it('never creates a duplicate when same exercise is imported twice', async () => {
    // First import: no existing record → creates
    mockPrismaExercise.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    (ExerciseDbService.getExercisesByBodyPart as jest.Mock).mockResolvedValue([rawExercise]);

    const firstRun = await ExerciseImportService.importByBodyPart('chest');
    expect(firstRun.imported).toBe(1);

    // Second import: finds existing by externalId → updates, not creates
    jest.clearAllMocks();
    mockPrismaExercise.findFirst.mockResolvedValue({
      id: 'db-uuid-001',
      externalId: 'ext-001',
      externalSource: 'exercisedb',
    });
    (ExerciseDbService.getExercisesByBodyPart as jest.Mock).mockResolvedValue([rawExercise]);

    const secondRun = await ExerciseImportService.importByBodyPart('chest');
    expect(secondRun.imported).toBe(0);
    expect(secondRun.updated).toBe(1);
    expect(mockPrismaExercise.create).not.toHaveBeenCalled();
  });
});
