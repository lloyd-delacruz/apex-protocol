import { WorkoutSet } from '@apex/shared';
import {
  calculateStatus,
  calculateReadiness,
  recommendNextWeight,
  calculateProgression,
} from '../services/progression';

// ─── calculateStatus ──────────────────────────────────────────────────────────

describe('calculateStatus', () => {
  it('returns ACHIEVED when reps equal repMax', () => {
    expect(calculateStatus(10, 6, 10)).toBe('ACHIEVED');
  });

  it('returns ACHIEVED when reps exceed repMax', () => {
    expect(calculateStatus(12, 6, 10)).toBe('ACHIEVED');
  });

  it('returns PROGRESS when reps are within range', () => {
    expect(calculateStatus(8, 6, 10)).toBe('PROGRESS');
    expect(calculateStatus(6, 6, 10)).toBe('PROGRESS');
    expect(calculateStatus(9, 6, 10)).toBe('PROGRESS');
  });

  it('returns FAILED when reps are below repMin', () => {
    expect(calculateStatus(5, 6, 10)).toBe('FAILED');
    expect(calculateStatus(0, 6, 10)).toBe('FAILED');
  });
});

// ─── calculateReadiness ───────────────────────────────────────────────────────

function makeSet(status: 'ACHIEVED' | 'PROGRESS' | 'FAILED'): WorkoutSet {
  return {
    id: '1',
    session_id: 's1',
    program_exercise_id: 'p1',
    set_number: 1,
    weight_kg: 80,
    reps: 10,
    rir: 2,
    status,
  };
}

describe('calculateReadiness', () => {
  it('returns 50 for empty sets array', () => {
    expect(calculateReadiness([])).toBe(50);
  });

  it('returns 100 when all sets are ACHIEVED', () => {
    const sets = [makeSet('ACHIEVED'), makeSet('ACHIEVED'), makeSet('ACHIEVED')];
    expect(calculateReadiness(sets)).toBe(100);
  });

  it('returns 10 when all sets are FAILED', () => {
    const sets = [makeSet('FAILED'), makeSet('FAILED'), makeSet('FAILED')];
    expect(calculateReadiness(sets)).toBe(10);
  });

  it('returns 60 when all sets are PROGRESS', () => {
    const sets = [makeSet('PROGRESS'), makeSet('PROGRESS')];
    expect(calculateReadiness(sets)).toBe(60);
  });

  it('averages correctly across mixed statuses', () => {
    // ACHIEVED(100) + FAILED(10) = 110 / 2 = 55
    const sets = [makeSet('ACHIEVED'), makeSet('FAILED')];
    expect(calculateReadiness(sets)).toBe(55);
  });

  it('clamps result to [0, 100]', () => {
    const sets = [makeSet('ACHIEVED')];
    const result = calculateReadiness(sets);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

// ─── recommendNextWeight ──────────────────────────────────────────────────────

describe('recommendNextWeight', () => {
  it('increases by 5% when readiness >= 90', () => {
    // 100kg * 1.05 = 105 → rounded to nearest 0.5 = 105
    expect(recommendNextWeight(100, 90)).toBe(105);
    expect(recommendNextWeight(100, 100)).toBe(105);
  });

  it('increases by 2.5% when readiness is 70–89', () => {
    // 100kg * 1.025 = 102.5
    expect(recommendNextWeight(100, 70)).toBe(102.5);
    expect(recommendNextWeight(100, 89)).toBe(102.5);
  });

  it('maintains weight when readiness is 50–69', () => {
    expect(recommendNextWeight(100, 50)).toBe(100);
    expect(recommendNextWeight(100, 69)).toBe(100);
  });

  it('decreases by 5% when readiness < 50', () => {
    // 100kg * 0.95 = 95
    expect(recommendNextWeight(100, 49)).toBe(95);
    expect(recommendNextWeight(100, 0)).toBe(95);
  });

  it('rounds weight to nearest 0.5 kg', () => {
    // 83kg * 1.05 = 87.15 → rounds to 87
    const result = recommendNextWeight(83, 90);
    expect(result % 0.5).toBe(0);
  });

  it('handles small weights correctly', () => {
    // 10kg * 1.025 = 10.25 → rounds to 10.5
    expect(recommendNextWeight(10, 70)).toBe(10.5);
  });
});

// ─── calculateProgression ────────────────────────────────────────────────────

describe('calculateProgression', () => {
  it('returns readiness and recommendedWeight', () => {
    const sets = [makeSet('ACHIEVED'), makeSet('ACHIEVED'), makeSet('ACHIEVED')];
    const result = calculateProgression(sets, 100);
    expect(result).toHaveProperty('readiness', 100);
    expect(result).toHaveProperty('recommendedWeight', 105);
  });

  it('returns lower weight when all sets failed', () => {
    const sets = [makeSet('FAILED'), makeSet('FAILED'), makeSet('FAILED')];
    const result = calculateProgression(sets, 100);
    expect(result.readiness).toBe(10);
    expect(result.recommendedWeight).toBe(95); // -5%
  });
});
