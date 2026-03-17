import { ProgramTemplateService, GoalType } from '../services/ProgramTemplateService';

describe('ProgramTemplateService', () => {
  describe('getRepRangeForGoal', () => {
    it('returns lower reps for strength', () => {
      expect(ProgramTemplateService.getRepRangeForGoal('strength')).toBe('3-5');
    });

    it('returns moderate reps for hypertrophy', () => {
      expect(ProgramTemplateService.getRepRangeForGoal('hypertrophy')).toBe('8-12');
    });

    it('returns higher reps for fat_loss', () => {
      expect(ProgramTemplateService.getRepRangeForGoal('fat_loss')).toBe('10-15');
    });

    it('returns highest reps for endurance', () => {
      expect(ProgramTemplateService.getRepRangeForGoal('endurance')).toBe('15-20');
    });

    it('returns default reps for unknown goals', () => {
      expect(ProgramTemplateService.getRepRangeForGoal('unknown' as GoalType)).toBe('8-12');
    });
  });

  describe('getWeeklySplit', () => {
    it('returns 2-day full body split', () => {
      const split = ProgramTemplateService.getWeeklySplit(2, 'strength');
      expect(split.length).toBe(2);
      expect(split[0].workoutType).toBe('Full Body A');
      expect(split[1].workoutType).toBe('Full Body B');
    });

    it('returns 3-day PPL for hypertrophy', () => {
      const split = ProgramTemplateService.getWeeklySplit(3, 'hypertrophy');
      expect(split.length).toBe(3);
      expect(split[0].workoutType).toBe('Push');
      expect(split[1].workoutType).toBe('Pull');
      expect(split[2].workoutType).toBe('Legs');
    });

    it('returns 3-day Full Body by default', () => {
      const split = ProgramTemplateService.getWeeklySplit(3, 'general');
      expect(split.length).toBe(3);
      expect(split[0].workoutType).toBe('Full Body A');
    });

    it('returns 4-day Upper/Lower split', () => {
      const split = ProgramTemplateService.getWeeklySplit(4, 'strength');
      expect(split.length).toBe(4);
      expect(split[0].workoutType).toContain('Upper');
      expect(split[1].workoutType).toContain('Lower');
    });

    it('returns 5-day Hybrid split', () => {
      const split = ProgramTemplateService.getWeeklySplit(5, 'hypertrophy');
      expect(split.length).toBe(5);
      expect(split[0].workoutType).toBe('Upper Body');
      expect(split[2].workoutType).toBe('Push');
    });

    it('returns 6-day PPL split', () => {
      const split = ProgramTemplateService.getWeeklySplit(6, 'athletic');
      expect(split.length).toBe(6);
      expect(split[0].workoutType).toBe('Push A');
      expect(split[5].workoutType).toBe('Legs B');
    });

    it('capitalizes the phase string cleanly', () => {
      const split = ProgramTemplateService.getWeeklySplit(4, 'fat_loss');
      expect(split[0].phase).toBe('Fat loss'); // Notice how capitalization logic handles the string
    });
  });
});
