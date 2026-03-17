/**
 * ExerciseRepository
 *
 * Handles all database access for the Exercise model.
 * Supports full-text search, multi-field filtering, and substitution retrieval.
 */

import prisma from '../db/prisma';
import { Exercise, Prisma } from '@prisma/client';

export interface ExerciseFilters {
  search?: string;
  goal?: string;
  equipment?: string;
  movementPattern?: string;
  bodyPart?: string;
  primaryMuscle?: string;
  muscleGroup?: string;
  exerciseType?: string;
  difficulty?: string;
  isCompound?: boolean;
  isUnilateral?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Structured query for program generation.
 * All fields optional — combine as needed per workout day.
 */
export interface GeneratorExerciseQuery {
  /** Apex Protocol equipment strings, e.g. ['barbell', 'dumbbell']. Empty = no equipment filter. */
  equipment?: string[];
  /** Goal tag to require, e.g. 'strength', 'hypertrophy'. */
  goal?: string;
  /** One or more movement patterns to include, e.g. ['squat', 'hinge']. */
  movementPatterns?: string[];
  /** One or more body parts to include, e.g. ['Lower Body', 'Upper Body']. */
  bodyParts?: string[];
  /** Difficulties to include, e.g. ['beginner', 'intermediate']. */
  difficulties?: string[];
  /** When true, only return compound exercises. */
  compoundOnly?: boolean;
  /** Maximum records. Default 200. */
  limit?: number;
}

/**
 * Exercise record with computed `isEnriched` field.
 * isEnriched = true when the record was imported from an external source
 * and has been synced at least once.
 */
export interface ExerciseDTO extends Exercise {
  isEnriched: boolean;
}

export interface ExerciseWithSubstitutions extends ExerciseDTO {
  substitutions: Array<{
    id: string;
    priorityRank: number;
    notes: string | null;
    substituteExercise: ExerciseDTO;
  }>;
}

function toDTO(ex: Exercise): ExerciseDTO {
  return {
    ...ex,
    isEnriched: ex.externalSource !== null && ex.lastSyncedAt !== null,
  };
}

export const ExerciseRepository = {
  /**
   * Returns all active exercises with optional multi-field filtering.
   */
  async findAll(filters: ExerciseFilters = {}): Promise<{ exercises: ExerciseDTO[]; total: number }> {
    const {
      search,
      goal,
      equipment,
      movementPattern,
      bodyPart,
      primaryMuscle,
      muscleGroup,
      exerciseType,
      difficulty,
      isCompound,
      isUnilateral,
      limit = 50,
      offset = 0,
    } = filters;

    const where: Prisma.ExerciseWhereInput = {
      isActive: true,
      deletedAt: null,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (equipment) {
      where.equipment = { equals: equipment, mode: 'insensitive' };
    }

    if (movementPattern) {
      where.movementPattern = { equals: movementPattern, mode: 'insensitive' };
    }

    if (bodyPart) {
      where.bodyPart = { equals: bodyPart, mode: 'insensitive' };
    }

    if (primaryMuscle) {
      where.primaryMuscle = { contains: primaryMuscle, mode: 'insensitive' };
    }

    if (muscleGroup) {
      where.muscleGroup = { contains: muscleGroup, mode: 'insensitive' };
    }

    if (exerciseType) {
      where.exerciseType = { equals: exerciseType, mode: 'insensitive' };
    }

    if (difficulty) {
      where.difficulty = { equals: difficulty, mode: 'insensitive' };
    }

    if (isCompound !== undefined) {
      where.isCompound = isCompound;
    }

    if (isUnilateral !== undefined) {
      where.isUnilateral = isUnilateral;
    }

    // goalTags is a JSON array — use array_contains for JSONB element membership check
    if (goal) {
      where.goalTags = {
        array_contains: [goal],
      };
    }

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.exercise.count({ where }),
    ]);

    return { exercises: exercises.map(toDTO), total };
  },

  /**
   * Returns a single exercise by ID, including its substitutions.
   */
  async findById(id: string): Promise<ExerciseWithSubstitutions | null> {
    return prisma.exercise.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: {
        substitutionsAsOriginal: {
          include: { substituteExercise: true },
          orderBy: { priorityRank: 'asc' },
        },
      },
    }).then((ex) => {
      if (!ex) return null;
      return {
        ...toDTO(ex),
        substitutions: ex.substitutionsAsOriginal.map((s) => ({
          id: s.id,
          priorityRank: s.priorityRank,
          notes: s.notes,
          substituteExercise: toDTO(s.substituteExercise),
        })),
      };
    });
  },

  /**
   * Full-text search by name (case-insensitive contains).
   */
  async search(query: string, limit = 20): Promise<ExerciseDTO[]> {
    const rows = await prisma.exercise.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        name: { contains: query, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });
    return rows.map(toDTO);
  },

  /**
   * Returns exercises filtered by a specific goal tag.
   */
  async findByGoal(goal: string, limit = 100): Promise<ExerciseDTO[]> {
    const rows = await prisma.exercise.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        goalTags: { array_contains: [goal] },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });
    return rows.map(toDTO);
  },

  /**
   * Returns exercises filtered by equipment type.
   */
  async findByEquipment(equipment: string, limit = 100): Promise<ExerciseDTO[]> {
    const rows = await prisma.exercise.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        equipment: { equals: equipment, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });
    return rows.map(toDTO);
  },

  /**
   * Returns exercises filtered by movement pattern.
   */
  async findByPattern(pattern: string, limit = 100): Promise<ExerciseDTO[]> {
    const rows = await prisma.exercise.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        movementPattern: { equals: pattern, mode: 'insensitive' },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });
    return rows.map(toDTO);
  },

  /**
   * Returns substitution options for a given exercise ID.
   */
  async getSubstitutions(exerciseId: string): Promise<Array<{
    id: string;
    priorityRank: number;
    notes: string | null;
    substituteExercise: ExerciseDTO;
  }>> {
    const subs = await prisma.exerciseSubstitution.findMany({
      where: { exerciseId },
      include: { substituteExercise: true },
      orderBy: { priorityRank: 'asc' },
    });
    return subs.map((s) => ({
      id: s.id,
      priorityRank: s.priorityRank,
      notes: s.notes,
      substituteExercise: toDTO(s.substituteExercise),
    }));
  },

  /**
   * Returns exercises matching a structured generator query.
   * This is the canonical query used by the program generator to build
   * exercise pools for each workout day. All filters are optional and
   * composable — only the filters that are set are applied.
   *
   * The result is NOT paginated: it returns up to `limit` exercises ordered
   * by compound-first, then name. This is intentional — the generator
   * operates on the full available pool, not a UI page slice.
   */
  async findForGenerator(query: GeneratorExerciseQuery = {}): Promise<ExerciseDTO[]> {
    const {
      equipment = [],
      goal,
      movementPatterns = [],
      bodyParts = [],
      difficulties = [],
      compoundOnly = false,
      limit = 200,
    } = query;

    const where: Prisma.ExerciseWhereInput = {
      isActive: true,
      deletedAt: null,
    };

    if (equipment.length > 0) {
      where.equipment = { in: equipment, mode: 'insensitive' };
    }

    if (goal) {
      where.goalTags = { array_contains: [goal] };
    }

    if (movementPatterns.length > 0) {
      where.movementPattern = { in: movementPatterns, mode: 'insensitive' };
    }

    if (bodyParts.length > 0) {
      where.bodyPart = { in: bodyParts, mode: 'insensitive' };
    }

    if (difficulties.length > 0) {
      where.difficulty = { in: difficulties, mode: 'insensitive' };
    }

    if (compoundOnly) {
      where.isCompound = true;
    }

    const rows = await prisma.exercise.findMany({
      where,
      orderBy: [
        // Compounds first, then alphabetical within each group
        { isCompound: 'desc' },
        { name: 'asc' },
      ],
      take: limit,
    });

    return rows.map(toDTO);
  },

  /**
   * Returns the distinct values for each taxonomy field (used for filter dropdowns).
   */
  async getTaxonomyOptions(): Promise<{
    equipment: string[];
    movementPatterns: string[];
    bodyParts: string[];
    exerciseTypes: string[];
    difficulties: string[];
    goalTags: string[];
  }> {
    // goalTags is a JSONB array column — use raw SQL to get distinct element values
    const [equipment, movementPatterns, bodyParts, exerciseTypes, difficulties, goalTagRows] =
      await Promise.all([
        prisma.exercise.findMany({ where: { isActive: true, equipment: { not: null } }, select: { equipment: true }, distinct: ['equipment'], orderBy: { equipment: 'asc' } }),
        prisma.exercise.findMany({ where: { isActive: true, movementPattern: { not: null } }, select: { movementPattern: true }, distinct: ['movementPattern'], orderBy: { movementPattern: 'asc' } }),
        prisma.exercise.findMany({ where: { isActive: true, bodyPart: { not: null } }, select: { bodyPart: true }, distinct: ['bodyPart'], orderBy: { bodyPart: 'asc' } }),
        prisma.exercise.findMany({ where: { isActive: true, exerciseType: { not: null } }, select: { exerciseType: true }, distinct: ['exerciseType'], orderBy: { exerciseType: 'asc' } }),
        prisma.exercise.findMany({ where: { isActive: true, difficulty: { not: null } }, select: { difficulty: true }, distinct: ['difficulty'] }),
        prisma.$queryRaw<{ goal_tag: string }[]>`
          SELECT DISTINCT jsonb_array_elements_text(goal_tags) AS goal_tag
          FROM exercises
          WHERE is_active = true
            AND goal_tags IS NOT NULL
            AND jsonb_typeof(goal_tags) = 'array'
          ORDER BY goal_tag
        `,
      ]);
    return {
      equipment: equipment.map((e) => e.equipment!),
      movementPatterns: movementPatterns.map((e) => e.movementPattern!),
      bodyParts: bodyParts.map((e) => e.bodyPart!),
      exerciseTypes: exerciseTypes.map((e) => e.exerciseType!),
      difficulties: difficulties.map((e) => e.difficulty!),
      goalTags: goalTagRows.map((r) => r.goal_tag),
    };
  },
};
