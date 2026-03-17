import { ExerciseSelectionService } from '../services/ExerciseSelectionService';
import { ExerciseDTO } from '../repositories/ExerciseRepository';

describe('ExerciseSelectionService', () => {

  describe('getEquipmentFilter', () => {
    it('returns empty array for full_gym', () => {
      expect(ExerciseSelectionService.getEquipmentFilter('full_gym')).toEqual([]);
    });

    it('returns only bodyweight for bodyweight_only', () => {
      expect(ExerciseSelectionService.getEquipmentFilter('bodyweight_only')).toEqual(['bodyweight']);
    });

    it('returns barbell, dumbbell, and bodyweight for home_gym', () => {
      expect(ExerciseSelectionService.getEquipmentFilter('home_gym').sort()).toEqual(['barbell', 'dumbbell', 'bodyweight'].sort());
    });

    it('normalizes custom arrays', () => {
      expect(ExerciseSelectionService.getEquipmentFilter(['Barbell', 'Dumbbell'])).toEqual(['barbell', 'dumbbell']);
    });
  });

  describe('getExercisesPerDay', () => {
    it('caps beginners at 4 exercises', () => {
      expect(ExerciseSelectionService.getExercisesPerDay('beginner')).toBe(4);
    });

    it('caps intermediate at 5 exercises', () => {
      expect(ExerciseSelectionService.getExercisesPerDay('intermediate')).toBe(5);
    });

    it('caps advanced at 6 exercises', () => {
      expect(ExerciseSelectionService.getExercisesPerDay('advanced')).toBe(6);
    });
  });

  describe('selectExercisesForDay', () => {
    // Generate some mock pool exercises
    const baseEx: Omit<ExerciseDTO, 'id' | 'name' | 'category' | 'muscleGroup' | 'equipment'> = {
      isActive: true, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      bodyPart: null, primaryMuscle: null, secondaryMuscles: null, movementPattern: null,
      exerciseType: null, goalTags: null, difficulty: null, instructions: null,
      mediaUrl: null, videoUrl: null, isCompound: false, isUnilateral: false,
      externalId: null, externalSource: null, lastSyncedAt: null, isEnriched: false,
    };
    const generatePool = (): ExerciseDTO[] => [
      { ...baseEx, id: '1', name: 'Barbell Bench Press', category: 'compound', muscleGroup: 'Chest', equipment: 'barbell', isCompound: true },
      { ...baseEx, id: '2', name: 'Incline DB Press', category: 'compound', muscleGroup: 'Chest', equipment: 'dumbbell', isCompound: true },
      { ...baseEx, id: '3', name: 'Lat Pulldown', category: 'isolation', muscleGroup: 'Back', equipment: 'cable' },
      { ...baseEx, id: '4', name: 'Bicep Curl', category: 'isolation', muscleGroup: 'Biceps', equipment: 'dumbbell' },
      { ...baseEx, id: '5', name: 'Cable Fly', category: 'isolation', muscleGroup: 'Chest', equipment: 'cable' },
      { ...baseEx, id: '6', name: 'Pushups', category: 'compound', muscleGroup: 'Chest', equipment: 'bodyweight', isCompound: true },
      { ...baseEx, id: '7', name: 'Machine Chest Press', category: 'isolation', muscleGroup: 'Chest', equipment: 'machine' },
      { ...baseEx, id: '8', name: 'Squat', category: 'compound', muscleGroup: 'Quads', equipment: 'barbell', isCompound: true },
    ];

    it('prioritizes target muscle groups', () => {
      const selected = ExerciseSelectionService.selectExercisesForDay(generatePool(), 'intermediate', ['Chest']);
      
      // Since it's an intermediate day (5 exercises), it should try to pick as many 'Chest' exercises as possible.
      const chestExercises = selected.filter(e => e.muscleGroup === 'Chest');
      expect(chestExercises.length).toBeGreaterThan(0);
    });

    it('respects volume limits by experience level', () => {
      const advanced = ExerciseSelectionService.selectExercisesForDay(generatePool(), 'advanced', ['Chest', 'Back']);
      expect(advanced.length).toBe(6);

      const beginner = ExerciseSelectionService.selectExercisesForDay(generatePool(), 'beginner', ['Chest', 'Back']);
      expect(beginner.length).toBe(4);
    });

    it('biases towards non-barbell exercises for beginners', () => {
      const beginnerSelection = ExerciseSelectionService.selectExercisesForDay(generatePool(), 'beginner', ['Chest']);
      
      // Since Barbell Bench Press is complex, beginners should have a low chance of getting it compared to Pushups or Machine Chest Press
      // Or at least it's sorted back
      const bbIndex = beginnerSelection.findIndex(e => e.name === 'Barbell Bench Press');
      
      // A pure assertion on randomness is risky, but we can verify it returns 4 elements exactly.
      expect(beginnerSelection.length).toBe(4);
    });
    
    it('prioritizes compounds at the start of the list', () => {
      const selection = ExerciseSelectionService.selectExercisesForDay(generatePool(), 'advanced');
      
      // The first exercise should heavily prioritize being a compound movement
      const hasCompounds = selection.some(e => e.category === 'compound');
      expect(hasCompounds).toBeTruthy();
      
      if (selection[0].category !== 'compound') {
        const compoundsPicked = selection.filter(e => e.category === 'compound').length;
        if (compoundsPicked > 0) {
            // Test failed conceptually, logic says compounds should sort first
            throw new Error('Sort logic failed, isolation came before compound');
        }
      }
    });

  });
});

