/**
 * ExerciseService
 *
 * Business logic layer for exercise catalog operations.
 * Wraps ExerciseRepository and provides request-level validation.
 */

import { ExerciseRepository, ExerciseFilters } from '../repositories/ExerciseRepository';

const VALID_GOALS = [
  'strength', 'hypertrophy', 'fat_loss', 'endurance',
  'athletic_performance', 'general_fitness', 'mobility_recovery',
];

const VALID_PATTERNS = [
  'squat', 'hinge', 'lunge_single_leg', 'horizontal_push', 'vertical_push',
  'horizontal_pull', 'vertical_pull', 'rotation', 'anti_rotation',
  'carry', 'cardio', 'mobility', 'balance',
];

const VALID_EXERCISE_TYPES = [
  'compound', 'isolation', 'cardio', 'plyometric', 'core', 'mobility', 'rehab',
];

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export const ExerciseService = {
  async list(filters: ExerciseFilters) {
    const limit = Math.min(Number(filters.limit) || 50, 200);
    const offset = Math.max(Number(filters.offset) || 0, 0);
    return ExerciseRepository.findAll({ ...filters, limit, offset });
  },

  async getById(id: string) {
    const exercise = await ExerciseRepository.findById(id);
    if (!exercise) {
      throw Object.assign(new Error('Exercise not found'), { statusCode: 404 });
    }
    return exercise;
  },

  async search(query: string) {
    if (!query || query.trim().length < 1) {
      throw Object.assign(new Error('Search query must not be empty'), { statusCode: 400 });
    }
    return ExerciseRepository.search(query.trim(), 30);
  },

  async getByGoal(goal: string) {
    if (!VALID_GOALS.includes(goal)) {
      throw Object.assign(
        new Error(`Invalid goal. Valid values: ${VALID_GOALS.join(', ')}`),
        { statusCode: 400 }
      );
    }
    return ExerciseRepository.findByGoal(goal);
  },

  async getByEquipment(equipment: string) {
    return ExerciseRepository.findByEquipment(equipment);
  },

  async getByPattern(pattern: string) {
    if (!VALID_PATTERNS.includes(pattern)) {
      throw Object.assign(
        new Error(`Invalid movement pattern. Valid values: ${VALID_PATTERNS.join(', ')}`),
        { statusCode: 400 }
      );
    }
    return ExerciseRepository.findByPattern(pattern);
  },

  async getSubstitutions(exerciseId: string) {
    // Verify exercise exists
    const ex = await ExerciseRepository.findById(exerciseId);
    if (!ex) {
      throw Object.assign(new Error('Exercise not found'), { statusCode: 404 });
    }
    return ExerciseRepository.getSubstitutions(exerciseId);
  },

  async getTaxonomyOptions() {
    return ExerciseRepository.getTaxonomyOptions();
  },
};
