/**
 * ExerciseDbService
 *
 * HTTP client for the RapidAPI ExerciseDB API.
 *
 * Purpose:  Fetch raw exercise data from ExerciseDB and return typed results.
 * Inputs:   Environment variables — EXERCISEDB_API_KEY, EXERCISEDB_API_HOST,
 *           EXERCISEDB_BASE_URL — must be set before calling any method.
 * Outputs:  Typed ExerciseDbExercise objects, never raw unknown.
 * Dependencies: axios (HTTP), process.env (config only — no secrets in code).
 *
 * This service does NOT touch the database. It is a pure API integration layer.
 * The import/sync logic that persists data lives in a separate service.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Raw exercise shape returned by the ExerciseDB API.
 * Fields map directly to what the API documents; nothing is added or removed.
 */
export interface ExerciseDbExercise {
  id: string;
  name: string;
  gifUrl: string;
  bodyPart: string;
  equipment: string;
  target: string;             // primary muscle
  secondaryMuscles: string[];
  instructions: string[];
}

export interface ExerciseDbListResponse {
  exercises: ExerciseDbExercise[];
  total: number;
  offset: number;
  limit: number;
}

export interface ExerciseDbConfig {
  apiKey: string;
  apiHost: string;
  baseUrl: string;
}

// ─── Config validation ────────────────────────────────────────────────────────

function resolveConfig(): ExerciseDbConfig {
  const apiKey  = process.env.EXERCISEDB_API_KEY;
  const apiHost = process.env.EXERCISEDB_API_HOST;
  const baseUrl = process.env.EXERCISEDB_BASE_URL;

  if (!apiKey)  throw new Error('Missing environment variable: EXERCISEDB_API_KEY');
  if (!apiHost) throw new Error('Missing environment variable: EXERCISEDB_API_HOST');
  if (!baseUrl) throw new Error('Missing environment variable: EXERCISEDB_BASE_URL');

  return { apiKey, apiHost, baseUrl };
}

// ─── Axios instance factory ───────────────────────────────────────────────────

function createClient(config: ExerciseDbConfig): AxiosInstance {
  return axios.create({
    baseURL: config.baseUrl,
    timeout: 15_000,
    headers: {
      'X-RapidAPI-Key':  config.apiKey,
      'X-RapidAPI-Host': config.apiHost,
    },
  });
}

// ─── Error normalisation ──────────────────────────────────────────────────────

/**
 * Converts an AxiosError into a plain Error with a useful message.
 * Ensures the raw API key is never included in the thrown message.
 */
function normaliseError(err: unknown, context: string): never {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError;
    const status   = axiosErr.response?.status;
    const detail   = axiosErr.response?.statusText ?? axiosErr.message;

    if (status === 401 || status === 403) {
      throw Object.assign(
        new Error(`ExerciseDB authorisation failed (${status}). Check EXERCISEDB_API_KEY.`),
        { statusCode: 502 }
      );
    }

    if (status === 429) {
      throw Object.assign(
        new Error('ExerciseDB rate limit exceeded. Try again later.'),
        { statusCode: 429 }
      );
    }

    if (status && status >= 400 && status < 500) {
      throw Object.assign(
        new Error(`ExerciseDB client error ${status} during ${context}: ${detail}`),
        { statusCode: 502 }
      );
    }

    if (!status || status >= 500) {
      throw Object.assign(
        new Error(`ExerciseDB upstream error during ${context}: ${detail}`),
        { statusCode: 502 }
      );
    }
  }

  throw Object.assign(
    new Error(`Unexpected error during ${context}: ${String(err)}`),
    { statusCode: 500 }
  );
}

// ─── Response guard ───────────────────────────────────────────────────────────

/**
 * Ensures the API response is an array (ExerciseDB returns plain arrays
 * for list endpoints). Throws if the shape is unexpected.
 */
function assertArray(data: unknown, context: string): ExerciseDbExercise[] {
  if (!Array.isArray(data)) {
    throw Object.assign(
      new Error(`ExerciseDB returned unexpected shape during ${context}`),
      { statusCode: 502 }
    );
  }
  return data as ExerciseDbExercise[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const ExerciseDbService = {
  /**
   * Fetch a paginated list of all exercises.
   *
   * @param limit  Maximum records to return (default 10, max 1300 per API docs).
   * @param offset Zero-based start index for pagination.
   */
  async getExercises(limit = 10, offset = 0): Promise<ExerciseDbListResponse> {
    const config = resolveConfig();
    const client = createClient(config);

    try {
      const { data } = await client.get<unknown>('/exercises', {
        params: { limit, offset },
      });

      const exercises = assertArray(data, 'getExercises');

      return { exercises, total: exercises.length, offset, limit };
    } catch (err) {
      normaliseError(err, 'getExercises');
    }
  },

  /**
   * Search exercises by name (case-insensitive partial match via the API).
   *
   * @param name  Search term, e.g. "squat" or "bench press".
   */
  async searchExercises(name: string): Promise<ExerciseDbExercise[]> {
    if (!name || name.trim().length < 1) {
      throw Object.assign(
        new Error('Search name must not be empty'),
        { statusCode: 400 }
      );
    }

    const config = resolveConfig();
    const client = createClient(config);

    try {
      const { data } = await client.get<unknown>(
        `/exercises/name/${encodeURIComponent(name.trim().toLowerCase())}`
      );

      return assertArray(data, 'searchExercises');
    } catch (err) {
      normaliseError(err, 'searchExercises');
    }
  },

  /**
   * Fetch all exercises for a given body part.
   *
   * Valid body parts (per ExerciseDB): back, cardio, chest, lower arms,
   * lower legs, neck, shoulders, upper arms, upper legs, waist.
   *
   * @param bodyPart  Body part string, e.g. "chest".
   */
  async getExercisesByBodyPart(bodyPart: string): Promise<ExerciseDbExercise[]> {
    if (!bodyPart || bodyPart.trim().length < 1) {
      throw Object.assign(
        new Error('bodyPart must not be empty'),
        { statusCode: 400 }
      );
    }

    const config = resolveConfig();
    const client = createClient(config);

    try {
      const { data } = await client.get<unknown>(
        `/exercises/bodyPart/${encodeURIComponent(bodyPart.trim().toLowerCase())}`
      );

      return assertArray(data, 'getExercisesByBodyPart');
    } catch (err) {
      normaliseError(err, 'getExercisesByBodyPart');
    }
  },

  /**
   * Fetch all exercises that use a specific piece of equipment.
   *
   * Valid equipment (per ExerciseDB): assisted, band, barbell, body weight,
   * bosu ball, cable, dumbbell, elliptical machine, ez barbell, hammer,
   * kettlebell, leverage machine, medicine ball, olympic barbell, resistance band,
   * roller, rope, skierg machine, sled machine, smith machine, stability ball,
   * stationary bike, stepmill machine, tire, trap bar, upper body ergometer,
   * weighted, wheel roller.
   *
   * @param equipment  Equipment string, e.g. "barbell".
   */
  async getExercisesByEquipment(equipment: string): Promise<ExerciseDbExercise[]> {
    if (!equipment || equipment.trim().length < 1) {
      throw Object.assign(
        new Error('equipment must not be empty'),
        { statusCode: 400 }
      );
    }

    const config = resolveConfig();
    const client = createClient(config);

    try {
      const { data } = await client.get<unknown>(
        `/exercises/equipment/${encodeURIComponent(equipment.trim().toLowerCase())}`
      );

      return assertArray(data, 'getExercisesByEquipment');
    } catch (err) {
      normaliseError(err, 'getExercisesByEquipment');
    }
  },

  /**
   * Fetch all exercises that target a specific muscle.
   *
   * Valid targets (per ExerciseDB): abductors, abs, adductors, biceps,
   * calves, cardiovascular system, delts, forearms, glutes, hamstrings,
   * lats, levator scapulae, pectorals, quads, serratus anterior,
   * spine, traps, triceps, upper back.
   *
   * @param muscle  Target muscle string, e.g. "quads".
   */
  async getExercisesByMuscle(muscle: string): Promise<ExerciseDbExercise[]> {
    if (!muscle || muscle.trim().length < 1) {
      throw Object.assign(
        new Error('muscle must not be empty'),
        { statusCode: 400 }
      );
    }

    const config = resolveConfig();
    const client = createClient(config);

    try {
      const { data } = await client.get<unknown>(
        `/exercises/target/${encodeURIComponent(muscle.trim().toLowerCase())}`
      );

      return assertArray(data, 'getExercisesByMuscle');
    } catch (err) {
      normaliseError(err, 'getExercisesByMuscle');
    }
  },

  /**
   * Fetch a single exercise by its ExerciseDB ID.
   *
   * @param id  ExerciseDB exercise ID, e.g. "0001".
   */
  async getExerciseById(id: string): Promise<ExerciseDbExercise> {
    if (!id || id.trim().length < 1) {
      throw Object.assign(
        new Error('Exercise ID must not be empty'),
        { statusCode: 400 }
      );
    }

    const config = resolveConfig();
    const client = createClient(config);

    try {
      const { data } = await client.get<unknown>(
        `/exercises/exercise/${encodeURIComponent(id.trim())}`
      );

      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw Object.assign(
          new Error(`ExerciseDB returned unexpected shape for exercise ID "${id}"`),
          { statusCode: 502 }
        );
      }

      return data as ExerciseDbExercise;
    } catch (err) {
      normaliseError(err, `getExerciseById(${id})`);
    }
  },

  /**
   * Fetch the list of valid body part values from ExerciseDB.
   * Useful for populating filter dropdowns and validating import params.
   */
  async getBodyPartList(): Promise<string[]> {
    const config = resolveConfig();
    const client = createClient(config);

    try {
      const { data } = await client.get<unknown>('/exercises/bodyPartList');

      if (!Array.isArray(data)) {
        throw Object.assign(
          new Error('ExerciseDB returned unexpected shape for bodyPartList'),
          { statusCode: 502 }
        );
      }

      return data as string[];
    } catch (err) {
      normaliseError(err, 'getBodyPartList');
    }
  },

  /**
   * Fetch the list of valid equipment values from ExerciseDB.
   * Useful for mapping ExerciseDB equipment strings to Apex Protocol taxonomy.
   */
  async getEquipmentList(): Promise<string[]> {
    const config = resolveConfig();
    const client = createClient(config);

    try {
      const { data } = await client.get<unknown>('/exercises/equipmentList');

      if (!Array.isArray(data)) {
        throw Object.assign(
          new Error('ExerciseDB returned unexpected shape for equipmentList'),
          { statusCode: 502 }
        );
      }

      return data as string[];
    } catch (err) {
      normaliseError(err, 'getEquipmentList');
    }
  },
};
