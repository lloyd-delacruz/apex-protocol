/**
 * ExerciseDbService — Unit Tests
 *
 * Verifies HTTP client behaviour with a fully mocked axios.
 * No real network calls are made.
 */

import axios from 'axios';
import { ExerciseDbService } from '../services/ExerciseDbService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// ── Fixture ────────────────────────────────────────────────────────────────────

const mockExercise = {
  id: 'ex001',
  name: 'barbell bench press',
  gifUrl: 'https://example.com/bench.gif',
  bodyPart: 'chest',
  equipment: 'barbell',
  target: 'pectorals',
  secondaryMuscles: ['triceps', 'delts'],
  instructions: ['Lie on bench', 'Press bar up'],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildMockClient(response: unknown) {
  const mockGet = jest.fn().mockResolvedValue({ data: response });
  mockedAxios.create.mockReturnValue({ get: mockGet } as unknown as ReturnType<typeof axios.create>);
  return mockGet;
}

function buildErrorClient(status: number, statusText = 'Error') {
  const err = Object.assign(new Error(statusText), {
    isAxiosError: true,
    response: { status, statusText },
  });
  const mockGet = jest.fn().mockRejectedValue(err);
  mockedAxios.create.mockReturnValue({ get: mockGet } as unknown as ReturnType<typeof axios.create>);
  mockedAxios.isAxiosError.mockReturnValue(true);
  return mockGet;
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXERCISEDB_API_KEY = 'test-key';
  process.env.EXERCISEDB_API_HOST = 'exercisedb.p.rapidapi.com';
  process.env.EXERCISEDB_BASE_URL = 'https://exercisedb.p.rapidapi.com';
});

afterEach(() => {
  delete process.env.EXERCISEDB_API_KEY;
  delete process.env.EXERCISEDB_API_HOST;
  delete process.env.EXERCISEDB_BASE_URL;
});

// ── Config validation ─────────────────────────────────────────────────────────

describe('config validation', () => {
  it('throws when EXERCISEDB_API_KEY is missing', async () => {
    delete process.env.EXERCISEDB_API_KEY;
    buildMockClient([mockExercise]);
    await expect(ExerciseDbService.getExercises()).rejects.toThrow('EXERCISEDB_API_KEY');
  });

  it('throws when EXERCISEDB_API_HOST is missing', async () => {
    delete process.env.EXERCISEDB_API_HOST;
    buildMockClient([mockExercise]);
    await expect(ExerciseDbService.getExercises()).rejects.toThrow('EXERCISEDB_API_HOST');
  });

  it('throws when EXERCISEDB_BASE_URL is missing', async () => {
    delete process.env.EXERCISEDB_BASE_URL;
    buildMockClient([mockExercise]);
    await expect(ExerciseDbService.getExercises()).rejects.toThrow('EXERCISEDB_BASE_URL');
  });
});

// ── getExercises ──────────────────────────────────────────────────────────────

describe('getExercises', () => {
  it('returns exercises and pagination metadata', async () => {
    buildMockClient([mockExercise, mockExercise]);

    const result = await ExerciseDbService.getExercises(10, 0);

    expect(result.exercises).toHaveLength(2);
    expect(result.exercises[0].name).toBe('barbell bench press');
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
    expect(result.total).toBe(2);
  });

  it('throws with statusCode 429 on rate limit', async () => {
    buildErrorClient(429);

    await expect(ExerciseDbService.getExercises()).rejects.toMatchObject({
      message: expect.stringContaining('rate limit'),
    });
  });

  it('throws with statusCode 502 on auth failure (401)', async () => {
    buildErrorClient(401);

    await expect(ExerciseDbService.getExercises()).rejects.toMatchObject({
      message: expect.stringContaining('authorisation failed'),
    });
  });

  it('throws when response is not an array', async () => {
    buildMockClient({ unexpected: 'object' });

    await expect(ExerciseDbService.getExercises()).rejects.toThrow('unexpected shape');
  });
});

// ── searchExercises ───────────────────────────────────────────────────────────

describe('searchExercises', () => {
  it('throws 400 when name is empty', async () => {
    buildMockClient([]);
    await expect(ExerciseDbService.searchExercises('')).rejects.toMatchObject({
      message: expect.stringContaining('empty'),
    });
  });

  it('throws 400 when name is only whitespace', async () => {
    buildMockClient([]);
    await expect(ExerciseDbService.searchExercises('   ')).rejects.toMatchObject({
      message: expect.stringContaining('empty'),
    });
  });

  it('returns matching exercises', async () => {
    buildMockClient([mockExercise]);

    const result = await ExerciseDbService.searchExercises('bench');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ex001');
  });
});

// ── getExercisesByBodyPart ────────────────────────────────────────────────────

describe('getExercisesByBodyPart', () => {
  it('throws 400 when bodyPart is empty', async () => {
    buildMockClient([]);
    await expect(ExerciseDbService.getExercisesByBodyPart('')).rejects.toMatchObject({
      message: expect.stringContaining('empty'),
    });
  });

  it('returns exercises for a given body part', async () => {
    buildMockClient([mockExercise]);

    const result = await ExerciseDbService.getExercisesByBodyPart('chest');

    expect(result).toHaveLength(1);
    expect(result[0].bodyPart).toBe('chest');
  });
});

// ── getExercisesByEquipment ───────────────────────────────────────────────────

describe('getExercisesByEquipment', () => {
  it('throws 400 when equipment is empty', async () => {
    buildMockClient([]);
    await expect(ExerciseDbService.getExercisesByEquipment('')).rejects.toMatchObject({
      message: expect.stringContaining('empty'),
    });
  });

  it('returns exercises for a given equipment type', async () => {
    buildMockClient([mockExercise]);

    const result = await ExerciseDbService.getExercisesByEquipment('barbell');

    expect(result).toHaveLength(1);
    expect(result[0].equipment).toBe('barbell');
  });
});

// ── getExercisesByMuscle ──────────────────────────────────────────────────────

describe('getExercisesByMuscle', () => {
  it('throws 400 when muscle is empty', async () => {
    buildMockClient([]);
    await expect(ExerciseDbService.getExercisesByMuscle('')).rejects.toMatchObject({
      message: expect.stringContaining('empty'),
    });
  });

  it('returns exercises for a given target muscle', async () => {
    buildMockClient([mockExercise]);

    const result = await ExerciseDbService.getExercisesByMuscle('pectorals');

    expect(result).toHaveLength(1);
  });
});

// ── getExerciseById ───────────────────────────────────────────────────────────

describe('getExerciseById', () => {
  it('throws 400 when id is empty', async () => {
    buildMockClient({});
    await expect(ExerciseDbService.getExerciseById('')).rejects.toMatchObject({
      message: expect.stringContaining('empty'),
    });
  });

  it('returns a single exercise', async () => {
    buildMockClient(mockExercise);

    const result = await ExerciseDbService.getExerciseById('ex001');

    expect(result.id).toBe('ex001');
    expect(result.name).toBe('barbell bench press');
  });

  it('throws when response is an array instead of an object', async () => {
    buildMockClient([mockExercise]);

    await expect(ExerciseDbService.getExerciseById('ex001')).rejects.toThrow('unexpected shape');
  });

  it('throws when response is null', async () => {
    buildMockClient(null);

    await expect(ExerciseDbService.getExerciseById('ex001')).rejects.toThrow('unexpected shape');
  });
});

// ── getBodyPartList ───────────────────────────────────────────────────────────

describe('getBodyPartList', () => {
  it('returns array of body part strings', async () => {
    buildMockClient(['chest', 'back', 'shoulders', 'upper legs']);

    const result = await ExerciseDbService.getBodyPartList();

    expect(result).toEqual(['chest', 'back', 'shoulders', 'upper legs']);
  });

  it('throws when response is not an array', async () => {
    buildMockClient({ invalid: true });

    await expect(ExerciseDbService.getBodyPartList()).rejects.toThrow('unexpected shape');
  });
});

// ── getEquipmentList ──────────────────────────────────────────────────────────

describe('getEquipmentList', () => {
  it('returns array of equipment strings', async () => {
    buildMockClient(['barbell', 'dumbbell', 'cable', 'body weight']);

    const result = await ExerciseDbService.getEquipmentList();

    expect(result).toEqual(['barbell', 'dumbbell', 'cable', 'body weight']);
  });

  it('throws when response is not an array', async () => {
    buildMockClient(null);

    await expect(ExerciseDbService.getEquipmentList()).rejects.toThrow('unexpected shape');
  });
});
