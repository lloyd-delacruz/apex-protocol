/**
 * ExerciseClassificationService — Unit Tests
 *
 * Verifies the full classification pipeline:
 *   - name-based movementPattern matching
 *   - bodyPart + target fallback
 *   - isUnilateral detection
 *   - isCompound detection (including isolation overrides)
 *   - exerciseType classification
 *   - difficulty classification
 *   - goalTags assignment
 *
 * These are pure unit tests — no database or network access.
 */

import {
  ExerciseClassificationService,
  ClassificationInput,
} from '../services/ExerciseClassificationService';

// Helper to classify with minimal input
function classify(name: string, opts: Partial<ClassificationInput> = {}) {
  return ExerciseClassificationService.classify({ name, ...opts });
}

// ─── Movement pattern — name-based ────────────────────────────────────────────

describe('movementPattern — name-based matching', () => {
  describe('squat patterns', () => {
    test.each([
      ['Barbell Back Squat',      'squat'],
      ['Front Squat',             'squat'],
      ['Goblet Squat',            'squat'],
      ['Box Squat',               'squat'],
      ['Leg Press',               'squat'],
      ['Hack Squat',              'squat'],
      ['Wall Sit',                'squat'],
      ['Leg Extension',           'squat'],  // isolation but squat-day pattern
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });

  describe('hinge patterns', () => {
    test.each([
      ['Deadlift',                        'hinge'],
      ['Romanian Deadlift',               'hinge'],
      ['Barbell RDL',                     'hinge'],
      ['Sumo Deadlift',                   'hinge'],
      ['Trap Bar Deadlift',               'hinge'],
      ['Hip Thrust',                      'hinge'],
      ['Barbell Glute Bridge',            'hinge'],
      ['Good Morning',                    'hinge'],
      ['Kettlebell Swing',                'hinge'],
      ['Back Extension',                  'hinge'],
      ['Nordic Curl',                     'hinge'],
      ['Leg Curl',                        'hinge'],
      ['Seated Leg Curl',                 'hinge'],
      ['Standing Calf Raise',             'hinge'],
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });

  describe('lunge / single-leg patterns', () => {
    test.each([
      ['Walking Lunge',           'lunge_single_leg'],
      ['Reverse Lunge',           'lunge_single_leg'],
      ['Bulgarian Split Squat',   'lunge_single_leg'],
      ['Step-Up',                 'lunge_single_leg'],
      ['Barbell Step Up',         'lunge_single_leg'],
      ['Pistol Squat',            'lunge_single_leg'],
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });

  describe('horizontal push patterns', () => {
    test.each([
      ['Barbell Bench Press',     'horizontal_push'],
      ['Incline Dumbbell Press',  'horizontal_push'],
      ['Decline Bench Press',     'horizontal_push'],
      ['Push-Up',                 'horizontal_push'],
      ['Pushup',                  'horizontal_push'],
      ['Chest Dip',               'horizontal_push'],
      ['Cable Fly',               'horizontal_push'],
      ['Pec Deck',                'horizontal_push'],
      ['Tricep Pushdown',         'horizontal_push'],
      ['Skull Crusher',           'horizontal_push'],
      ['Overhead Tricep Extension','horizontal_push'],
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });

  describe('vertical push patterns', () => {
    test.each([
      ['Barbell Overhead Press',  'vertical_push'],
      ['Dumbbell Shoulder Press', 'vertical_push'],
      ['Arnold Press',            'vertical_push'],
      ['Push Press',              'vertical_push'],
      ['Lateral Raise',           'vertical_push'],
      ['Front Raise',             'vertical_push'],
      ['Upright Row',             'vertical_push'],
      ['Barbell Shrug',           'vertical_push'],
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });

  describe('vertical pull patterns', () => {
    test.each([
      ['Pull-Up',                 'vertical_pull'],
      ['Chin-Up',                 'vertical_pull'],
      ['Lat Pulldown',            'vertical_pull'],
      ['Assisted Pull-Up',        'vertical_pull'],
      ['Straight Arm Pulldown',   'vertical_pull'],
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });

  describe('horizontal pull patterns', () => {
    test.each([
      ['Barbell Bent Over Row',     'horizontal_pull'],
      ['Dumbbell Row',              'horizontal_pull'],
      ['Cable Row',                 'horizontal_pull'],
      ['T-Bar Row',                 'horizontal_pull'],
      ['Seated Row',                'horizontal_pull'],
      ['Inverted Row',              'horizontal_pull'],
      ['Face Pull',                 'horizontal_pull'],
      ['Rear Delt Fly',             'horizontal_pull'],
      ['Reverse Fly',               'horizontal_pull'],
      ['Bicep Curl',                'horizontal_pull'],
      ['Hammer Curl',               'horizontal_pull'],
      ['Preacher Curl',             'horizontal_pull'],
      ['Cable Curl',                'horizontal_pull'],
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });

  describe('core / anti-rotation patterns', () => {
    test.each([
      ['Plank',                   'anti_rotation'],
      ['Side Plank',              'anti_rotation'],
      ['Dead Bug',                'anti_rotation'],
      ['Bird Dog',                'anti_rotation'],
      ['Pallof Press',            'anti_rotation'],
      ['Hollow Hold',             'anti_rotation'],
      ['Ab Wheel Rollout',        'anti_rotation'],
      ['Cable Crunch',            'anti_rotation'],
      ['Hanging Leg Raise',       'anti_rotation'],
      ['V-Up',                    'anti_rotation'],
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });

  describe('rotational patterns', () => {
    test.each([
      ['Russian Twist',           'rotation'],
      ['Cable Woodchop',          'rotation'],
      ['Landmine Rotation',       'rotation'],
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });

  describe('carry patterns', () => {
    test.each([
      ["Farmer's Walk",           'carry'],
      ['Farmer Walk',             'carry'],
      ['Suitcase Carry',          'carry'],
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });

  describe('mobility patterns', () => {
    test.each([
      ['Hip Flexor Stretch',      'mobility'],
      ['Thoracic Rotation Stretch','mobility'],
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });

  describe('cardio patterns', () => {
    test.each([
      ['Treadmill Running',       'cardio'],
      ['Stationary Bike',         'cardio'],
      ['Rowing Machine',          'cardio'],
      ['Ski Erg',                 'cardio'],
      ['Burpee',                  'cardio'],
      ['Jump Rope',               'cardio'],
    ])('%s → %s', (name, expected) => {
      expect(classify(name).movementPattern).toBe(expected);
    });
  });
});

// ─── Movement pattern — bodyPart + target fallback ────────────────────────────

describe('movementPattern — bodyPart + target fallback', () => {
  test.each([
    ['Unknown Push Exercise',   'chest',       'pectorals',   'horizontal_push'],
    ['Unknown Shoulder Move',   'shoulders',   'delts',       'vertical_push'  ],
    ['Unknown Lat Exercise',    'back',        'lats',        'vertical_pull'  ],
    ['Unknown Back Exercise',   'back',        'upper back',  'horizontal_pull'],
    ['Unknown Spine Exercise',  'back',        'spine',       'hinge'          ],
    ['Unknown Quad Exercise',   'upper legs',  'quads',       'squat'          ],
    ['Unknown Hamstring Move',  'upper legs',  'hamstrings',  'hinge'          ],
    ['Unknown Glute Exercise',  'upper legs',  'glutes',      'hinge'          ],
    ['Cardio Machine X',        'cardio',      'cardiovascular', 'cardio'      ],
    ['Abs Exercise',            'waist',       'abs',         'anti_rotation'  ],
    ['Oblique Exercise',        'waist',       'obliques',    'rotation'       ],
  ])('%s (bodyPart=%s, target=%s) → %s', (name, rawBodyPart, rawTarget, expected) => {
    expect(classify(name, { rawBodyPart, rawTarget }).movementPattern).toBe(expected);
  });

  it('name matching takes priority over bodyPart fallback', () => {
    // "Bench Press" should always be horizontal_push even if bodyPart says "back"
    const result = classify('Incline Bench Press', { rawBodyPart: 'back', rawTarget: 'lats' });
    expect(result.movementPattern).toBe('horizontal_push');
  });
});

// ─── isUnilateral ─────────────────────────────────────────────────────────────

describe('isUnilateral', () => {
  it.each([
    ['Walking Lunge',            true ],
    ['Bulgarian Split Squat',    true ],
    ['Single Leg Deadlift',      true ],
    ['Single-Arm Dumbbell Row',  true ],
    ['Suitcase Carry',           true ],
    ['Step-Up',                  true ],
    ['Pistol Squat',             true ],
    ['Barbell Back Squat',       false],
    ['Deadlift',                 false],
    ['Bench Press',              false],
    ['Pull-Up',                  false],
  ])('%s → isUnilateral=%s', (name, expected) => {
    expect(classify(name).isUnilateral).toBe(expected);
  });
});

// ─── isCompound ───────────────────────────────────────────────────────────────

describe('isCompound', () => {
  it.each([
    // True compound multi-joint movements
    ['Barbell Back Squat',      'barbell',    true ],
    ['Deadlift',                'barbell',    true ],
    ['Barbell Bench Press',     'barbell',    true ],
    ['Barbell Overhead Press',  'barbell',    true ],
    ['Barbell Bent Over Row',   'barbell',    true ],
    ['Pull-Up',                 'bodyweight', true ],
    ['Push-Up',                 'bodyweight', true ],
    // Isolation exercises that match "compound" patterns but are single-joint
    ['Leg Extension',           'machine',    false],
    ['Leg Curl',                'machine',    false],
    ['Standing Calf Raise',     'machine',    false],
    ['Lateral Raise',           'dumbbell',   false],
    ['Front Raise',             'dumbbell',   false],
    ['Bicep Curl',              'dumbbell',   false],
    ['Tricep Pushdown',         'cable',      false],
    ['Cable Fly',               'cable',      false],
    ['Pec Deck',                'machine',    false],
    // Non-compound patterns
    ['Russian Twist',           'bodyweight', false],
    ['Plank',                   'bodyweight', false],
    ['Treadmill Running',       'cardio_machine', false],
  ])('%s (equipment=%s) → isCompound=%s', (name, equipment, expected) => {
    expect(classify(name, { equipment }).isCompound).toBe(expected);
  });
});

// ─── exerciseType ─────────────────────────────────────────────────────────────

describe('exerciseType', () => {
  it.each([
    ['Barbell Back Squat',    'barbell',    'compound'  ],
    ['Deadlift',              'barbell',    'compound'  ],
    ['Bicep Curl',            'dumbbell',   'isolation' ],
    ['Lateral Raise',         'dumbbell',   'isolation' ],
    ['Treadmill Running',     'cardio_machine', 'cardio'],
    ['Plank',                 'bodyweight', 'core'      ],
    ['Russian Twist',         'bodyweight', 'core'      ],
    ['Dead Bug',              'bodyweight', 'core'      ],
    ['Hip Flexor Stretch',    null,         'mobility'  ],
  ])('%s → %s', (name, equipment, expected) => {
    expect(classify(name, { equipment: equipment ?? undefined }).exerciseType).toBe(expected);
  });
});

// ─── difficulty ───────────────────────────────────────────────────────────────

describe('difficulty', () => {
  it.each([
    // Advanced — name keywords
    ['Power Snatch',            'barbell',    'advanced'      ],
    ['Hang Clean',              'barbell',    'advanced'      ],
    ['Muscle-Up',               'bodyweight', 'advanced'      ],
    ['L-Sit',                   'bodyweight', 'advanced'      ],
    // Beginner — machine or assisted
    ['Leg Press',               'machine',    'beginner'      ],
    ['Assisted Pull-Up',        'machine',    'beginner'      ],
    ['Cable Curl',              'cable',      'beginner'      ],  // isolation + cable
    ['Pec Deck',                'machine',    'beginner'      ],
    // Intermediate — barbell/kettlebell
    ['Barbell Back Squat',      'barbell',    'intermediate'  ],
    ['Romanian Deadlift',       'barbell',    'intermediate'  ],
    ['Kettlebell Swing',        'kettlebell', 'intermediate'  ],
    // Intermediate — compound bodyweight
    ['Pull-Up',                 'bodyweight', 'intermediate'  ],
    ['Push-Up',                 'bodyweight', 'intermediate'  ],
    ['Dip',                     'bodyweight', 'intermediate'  ],
    // Intermediate — compound dumbbell
    ['Dumbbell Row',            'dumbbell',   'intermediate'  ],
    // Beginner — isolation dumbbell
    ['Dumbbell Lateral Raise',  'dumbbell',   'beginner'      ],
    ['Hammer Curl',             'dumbbell',   'beginner'      ],
  ])('%s (equipment=%s) → %s', (name, equipment, expected) => {
    expect(classify(name, { equipment }).difficulty).toBe(expected);
  });
});

// ─── goalTags ─────────────────────────────────────────────────────────────────

describe('goalTags', () => {
  it('barbell compound → strength + hypertrophy + general_fitness', () => {
    const { goalTags } = classify('Barbell Back Squat', { equipment: 'barbell' });
    expect(goalTags).toEqual(expect.arrayContaining(['strength', 'hypertrophy', 'general_fitness']));
  });

  it('bodyweight compound → hypertrophy + general_fitness (no strength tag)', () => {
    const { goalTags } = classify('Pull-Up', { equipment: 'bodyweight' });
    expect(goalTags).toEqual(expect.arrayContaining(['hypertrophy', 'general_fitness']));
    expect(goalTags).not.toContain('strength');
  });

  it('cardio → endurance + fat_loss + general_fitness', () => {
    const { goalTags } = classify('Treadmill Running', { equipment: 'cardio_machine' });
    expect(goalTags).toEqual(expect.arrayContaining(['endurance', 'fat_loss', 'general_fitness']));
  });

  it('mobility → mobility_recovery + general_fitness', () => {
    const { goalTags } = classify('Hip Flexor Stretch');
    expect(goalTags).toEqual(expect.arrayContaining(['mobility_recovery', 'general_fitness']));
  });

  it('core → general_fitness + athletic_performance', () => {
    const { goalTags } = classify('Plank');
    expect(goalTags).toEqual(expect.arrayContaining(['general_fitness', 'athletic_performance']));
  });

  it('isolation → hypertrophy + general_fitness', () => {
    const { goalTags } = classify('Bicep Curl', { equipment: 'dumbbell' });
    expect(goalTags).toEqual(expect.arrayContaining(['hypertrophy', 'general_fitness']));
  });
});

// ─── Full classification integration checks ───────────────────────────────────

describe('full classification — known exercises', () => {
  it('Barbell Back Squat', () => {
    const r = classify('Barbell Back Squat', { equipment: 'barbell', rawBodyPart: 'upper legs', rawTarget: 'quads' });
    expect(r.movementPattern).toBe('squat');
    expect(r.exerciseType).toBe('compound');
    expect(r.isCompound).toBe(true);
    expect(r.isUnilateral).toBe(false);
    expect(r.difficulty).toBe('intermediate');
    expect(r.goalTags).toContain('strength');
  });

  it('Romanian Deadlift', () => {
    const r = classify('Romanian Deadlift', { equipment: 'barbell', rawBodyPart: 'upper legs', rawTarget: 'hamstrings' });
    expect(r.movementPattern).toBe('hinge');
    expect(r.isCompound).toBe(true);
    expect(r.difficulty).toBe('intermediate');
  });

  it('Barbell Bench Press', () => {
    const r = classify('Barbell Bench Press', { equipment: 'barbell', rawBodyPart: 'chest', rawTarget: 'pectorals' });
    expect(r.movementPattern).toBe('horizontal_push');
    expect(r.isCompound).toBe(true);
    expect(r.difficulty).toBe('intermediate');
    expect(r.goalTags).toContain('strength');
  });

  it('Walking Lunge', () => {
    const r = classify('Walking Lunge', { equipment: 'bodyweight', rawBodyPart: 'upper legs', rawTarget: 'quads' });
    expect(r.movementPattern).toBe('lunge_single_leg');
    expect(r.isUnilateral).toBe(true);
    expect(r.isCompound).toBe(true);
  });

  it('Cable Bicep Curl', () => {
    const r = classify('Cable Bicep Curl', { equipment: 'cable', rawBodyPart: 'upper arms', rawTarget: 'biceps' });
    expect(r.movementPattern).toBe('horizontal_pull');
    expect(r.isCompound).toBe(false);
    expect(r.exerciseType).toBe('isolation');
    expect(r.difficulty).toBe('beginner');
  });

  it('Plank', () => {
    const r = classify('Plank', { equipment: 'bodyweight', rawBodyPart: 'waist', rawTarget: 'abs' });
    expect(r.movementPattern).toBe('anti_rotation');
    expect(r.exerciseType).toBe('core');
    expect(r.isCompound).toBe(false);
  });

  it('Treadmill Running', () => {
    const r = classify('Treadmill Running', { equipment: 'cardio_machine', rawBodyPart: 'cardio', rawTarget: 'cardiovascular system' });
    expect(r.movementPattern).toBe('cardio');
    expect(r.exerciseType).toBe('cardio');
    expect(r.goalTags).toContain('endurance');
  });

  it('Lat Pulldown', () => {
    const r = classify('Lat Pulldown', { equipment: 'cable', rawBodyPart: 'back', rawTarget: 'lats' });
    expect(r.movementPattern).toBe('vertical_pull');
    expect(r.isCompound).toBe(true);
    expect(r.exerciseType).toBe('compound');
  });

  it('Bulgarian Split Squat', () => {
    const r = classify('Bulgarian Split Squat', { equipment: 'dumbbell' });
    expect(r.movementPattern).toBe('lunge_single_leg');
    expect(r.isUnilateral).toBe(true);
    expect(r.isCompound).toBe(true);
  });
});

// ─── classifyBatch ────────────────────────────────────────────────────────────

describe('classifyBatch', () => {
  it('returns results in the same order as inputs', () => {
    const inputs = [
      { name: 'Deadlift', equipment: 'barbell' },
      { name: 'Bicep Curl', equipment: 'dumbbell' },
      { name: 'Plank', equipment: 'bodyweight' },
    ];
    const results = ExerciseClassificationService.classifyBatch(inputs);
    expect(results).toHaveLength(3);
    expect(results[0].movementPattern).toBe('hinge');
    expect(results[1].movementPattern).toBe('horizontal_pull');
    expect(results[2].movementPattern).toBe('anti_rotation');
  });

  it('handles empty array', () => {
    expect(ExerciseClassificationService.classifyBatch([])).toEqual([]);
  });
});
