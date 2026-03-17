/**
 * ExerciseClassificationService
 *
 * Purpose:
 *   Assigns movementPattern, exerciseType, goalTags, difficulty, isCompound,
 *   and isUnilateral to an exercise using a priority-ordered heuristic pipeline.
 *
 * Classification pipeline (highest confidence first):
 *   1. Name-based keyword matching   — most reliable; covers known exercise names
 *   2. rawTarget + rawBodyPart       — fallback using ExerciseDB taxonomy fields
 *   3. Safe defaults                 — when no signal is available
 *
 * Extension guide:
 *   - To add a movement pattern keyword: append to NAME_PATTERN_RULES
 *   - To add a unilateral keyword:       append to UNILATERAL_KEYWORDS
 *   - To add an isolation override:      append to ISOLATION_OVERRIDES
 *   - To add advanced/beginner signals:  append to ADVANCED_KEYWORDS / BEGINNER_KEYWORDS
 *
 * Inputs:   ClassificationInput — name, rawBodyPart, rawTarget, equipment
 * Outputs:  ClassificationResult — all six classification fields
 * Dependencies: none (pure functions, no I/O)
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ClassificationInput {
  /** Exercise name — primary classification signal. */
  name: string;
  /**
   * ExerciseDB raw body-part category (e.g. "upper legs", "chest", "back").
   * Used as fallback when name matching is insufficient.
   */
  rawBodyPart?: string | null;
  /**
   * ExerciseDB raw target muscle (e.g. "quads", "hamstrings", "lats").
   * Disambiguates movement pattern within the same body part.
   */
  rawTarget?: string | null;
  /**
   * Apex Protocol normalized equipment (e.g. "barbell", "dumbbell", "machine").
   * Used to refine difficulty and goalTags.
   */
  equipment?: string | null;
}

export interface ClassificationResult {
  movementPattern: string | null;
  exerciseType:    string;
  goalTags:        string[];
  difficulty:      string;
  isCompound:      boolean;
  isUnilateral:    boolean;
}

// ─── Movement pattern rules ───────────────────────────────────────────────────
//
// Processed in order — first match wins.
// Rules that are more specific (multi-word keywords) should come before
// broader single-word keywords at the same level of specificity.

interface PatternRule {
  keywords: string[];
  pattern:  string;
}

const NAME_PATTERN_RULES: PatternRule[] = [
  // ── Olympic / power lifting ──────────────────────────────────────────────
  { keywords: ['snatch', 'hang snatch', 'power snatch'],                         pattern: 'hinge' },
  { keywords: ['clean and jerk', 'split jerk', 'push jerk'],                    pattern: 'hinge' },
  { keywords: ['hang clean', 'power clean', 'muscle clean', 'clean pull'],       pattern: 'hinge' },

  // ── Cardio ───────────────────────────────────────────────────────────────
  { keywords: ['running', 'jogging', 'sprint', 'treadmill'],                    pattern: 'cardio' },
  { keywords: ['cycling', 'biking', 'stationary bike', 'spin bike', 'air bike', 'assault bike'], pattern: 'cardio' },
  { keywords: ['rowing machine', 'ski erg', 'skierg', 'rower'],                 pattern: 'cardio' },
  { keywords: ['jump rope', 'jumping rope', 'skipping rope', 'burpee', 'jumping jack', 'mountain climber'], pattern: 'cardio' },
  { keywords: ['elliptical', 'stair climber', 'stepmill'],                      pattern: 'cardio' },

  // ── Leg isolation (before general hinge/squat keywords) ──────────────────
  { keywords: ['leg extension', 'knee extension'],                              pattern: 'squat'  },
  { keywords: ['leg curl', 'hamstring curl', 'lying curl', 'seated leg curl'],  pattern: 'hinge'  },
  { keywords: ['calf raise', 'standing calf', 'seated calf', 'donkey calf', 'tibialis raise'], pattern: 'hinge' },

  // ── Squat patterns ───────────────────────────────────────────────────────
  // ── Lunge / single-leg (before squat — multi-word terms like "split squat"
  //    and "pistol squat" would otherwise match the generic 'squat' keyword first)
  { keywords: ['split squat', 'bulgarian', 'pistol squat', 'skater squat', 'single leg squat', 'single-leg squat'], pattern: 'lunge_single_leg' },
  { keywords: ['lunge', 'step-up', 'step up'],                                 pattern: 'lunge_single_leg' },

  // ── Squat patterns ───────────────────────────────────────────────────────
  { keywords: ['squat', 'goblet squat', 'hack squat', 'leg press', 'sissy squat', 'wall sit'], pattern: 'squat' },

  // ── Hinge patterns ───────────────────────────────────────────────────────
  { keywords: ['deadlift', 'rdl', 'romanian deadlift', 'stiff-leg', 'sumo dead', 'trap bar dead'], pattern: 'hinge' },
  { keywords: ['hip thrust', 'glute bridge', 'glute-bridge', 'hip extension'],  pattern: 'hinge' },
  { keywords: ['good morning', 'kettlebell swing', 'kb swing', 'cable pull-through', 'pull-through'], pattern: 'hinge' },
  { keywords: ['back extension', 'hyperextension', 'nordic curl', 'nordic hamstring', 'reverse hyper'], pattern: 'hinge' },

  // ── Horizontal push (chest / anterior pushing) ───────────────────────────
  { keywords: ['bench press', 'chest press', 'dumbbell press', 'incline press', 'decline press', 'floor press'], pattern: 'horizontal_push' },
  { keywords: ['push-up', 'pushup', 'push up'],                                 pattern: 'horizontal_push' },
  { keywords: ['dip'],                                                           pattern: 'horizontal_push' },
  { keywords: ['chest fly', 'chest flye', 'cable fly', 'cable flye', 'cable crossover', 'pec deck', 'svend press'], pattern: 'horizontal_push' },
  { keywords: ['close grip bench', 'close-grip bench'],                         pattern: 'horizontal_push' },

  // ── Tricep isolation → assigned to horizontal_push day ───────────────────
  { keywords: ['skull crusher', 'ez bar curl', 'lying tricep'],                 pattern: 'horizontal_push' },
  { keywords: ['tricep', 'triceps extension', 'triceps pushdown', 'triceps kickback', 'overhead tricep', 'tricep pushdown', 'tricep kickback'], pattern: 'horizontal_push' },
  { keywords: ['pushdown', 'push-down', 'pressdown', 'press-down'],             pattern: 'horizontal_push' },

  // ── Vertical push (shoulder / overhead pushing) ──────────────────────────
  { keywords: ['overhead press', 'ohp', 'shoulder press', 'military press', 'arnold press', 'push press'], pattern: 'vertical_push' },
  { keywords: ['z press', 'landmine press', 'seated press'],                    pattern: 'vertical_push' },
  { keywords: ['lateral raise', 'side raise', 'side lateral', 'cable lateral'], pattern: 'vertical_push' },
  { keywords: ['front raise', 'front deltoid'],                                 pattern: 'vertical_push' },
  { keywords: ['upright row'],                                                   pattern: 'vertical_push' },
  { keywords: ['shrug', 'barbell shrug', 'dumbbell shrug', 'trap bar shrug'],   pattern: 'vertical_push' },

  // ── Vertical pull (lat-dominant pulling) ─────────────────────────────────
  { keywords: ['pull-up', 'pullup', 'pull up', 'chin-up', 'chinup', 'chin up', 'muscle-up', 'muscle up'], pattern: 'vertical_pull' },
  { keywords: ['lat pulldown', 'lat pull-down', 'pulldown', 'pull-down', 'pull down'], pattern: 'vertical_pull' },
  { keywords: ['straight arm pulldown', 'straight-arm pulldown'],               pattern: 'vertical_pull' },

  // ── Horizontal pull (row-dominant pulling) ───────────────────────────────
  { keywords: ['bent over row', 'barbell row', 'dumbbell row', 'cable row', 't-bar row', 'seal row', 'chest-supported row', 'inverted row', 'seated row'], pattern: 'horizontal_pull' },
  { keywords: ['face pull', 'rear delt fly', 'rear fly', 'reverse fly', 'reverse flye', 'band pull-apart', 'pull apart'], pattern: 'horizontal_pull' },
  { keywords: ['row'],                                                           pattern: 'horizontal_pull' },

  // ── Bicep isolation → assigned to horizontal_pull day ────────────────────
  { keywords: ['bicep curl', 'biceps curl', 'hammer curl', 'preacher curl', 'concentration curl', 'spider curl', 'zottman curl', 'incline curl'], pattern: 'horizontal_pull' },
  { keywords: ['curl'],                                                          pattern: 'horizontal_pull' },

  // ── Carry ─────────────────────────────────────────────────────────────────
  { keywords: ['farmer walk', "farmer's walk", 'suitcase carry', 'yoke carry', 'waiter walk', 'rack walk', 'carry'], pattern: 'carry' },

  // ── Anti-rotation / core stability ───────────────────────────────────────
  { keywords: ['plank', 'dead bug', 'bird dog', 'pallof press', 'hollow hold', 'hollow body', 'ab wheel', 'rollout', 'l-sit', 'l sit', 'front lever', 'back lever'], pattern: 'anti_rotation' },
  { keywords: ['crunch', 'sit-up', 'situp', 'sit up', 'leg raise', 'knee raise', 'toe touch', 'v-up', 'v up', 'ab crunch', 'cable crunch', 'decline crunch'], pattern: 'anti_rotation' },

  // ── Rotational core ──────────────────────────────────────────────────────
  { keywords: ['russian twist', 'woodchop', 'wood chop', 'cable twist', 'landmine rotation', 'oblique twist', 'med ball twist', 'rotational'], pattern: 'rotation' },

  // ── Mobility / flexibility ────────────────────────────────────────────────
  { keywords: ['stretch', 'foam roll', 'hip flexor stretch', 'pigeon pose', 'thoracic rotation', 'band distraction', 'ankle mobility', 'shoulder mobility'], pattern: 'mobility' },

  // ── Balance ──────────────────────────────────────────────────────────────
  { keywords: ['balance board', 'bosu balance', 'single leg balance', 'proprioception'], pattern: 'balance' },
];

// ─── Body-part + target fallback rules ───────────────────────────────────────
//
// Used when name-based matching returns null.
// Processed in order — more specific (with targetKeyword) before general.

interface BodyPartRule {
  bodyPart:      string;   // ExerciseDB raw bodyPart (lowercase)
  targetKeyword?: string;  // Optional: match if rawTarget contains this substring
  pattern:       string;
}

const BODY_PART_FALLBACK: BodyPartRule[] = [
  { bodyPart: 'cardio',      pattern: 'cardio'           },
  { bodyPart: 'chest',       pattern: 'horizontal_push'  },
  { bodyPart: 'shoulders',   pattern: 'vertical_push'    },
  { bodyPart: 'back',        targetKeyword: 'lats',       pattern: 'vertical_pull'  },
  { bodyPart: 'back',        targetKeyword: 'teres',      pattern: 'vertical_pull'  },
  { bodyPart: 'back',        targetKeyword: 'spine',      pattern: 'hinge'          },
  { bodyPart: 'back',        targetKeyword: 'erector',    pattern: 'hinge'          },
  { bodyPart: 'back',        pattern: 'horizontal_pull'  },
  { bodyPart: 'upper legs',  targetKeyword: 'quads',      pattern: 'squat'          },
  { bodyPart: 'upper legs',  targetKeyword: 'hamstring',  pattern: 'hinge'          },
  { bodyPart: 'upper legs',  targetKeyword: 'glutes',     pattern: 'hinge'          },
  { bodyPart: 'upper legs',  targetKeyword: 'adductor',   pattern: 'squat'          },
  { bodyPart: 'upper legs',  pattern: 'squat'            },
  { bodyPart: 'lower legs',  pattern: 'hinge'            },
  { bodyPart: 'waist',       targetKeyword: 'abs',        pattern: 'anti_rotation'  },
  { bodyPart: 'waist',       targetKeyword: 'obliques',   pattern: 'rotation'       },
  { bodyPart: 'waist',       pattern: 'anti_rotation'    },
];

// ─── Unilateral detection ─────────────────────────────────────────────────────
//
// If any of these appear in the exercise name, isUnilateral = true.

const UNILATERAL_KEYWORDS: string[] = [
  'single leg', 'single-leg', 'single arm', 'single-arm',
  'one arm', 'one-arm', 'one leg', 'one-leg',
  'unilateral',
  'lunge',
  'split squat', 'bulgarian',
  'step-up', 'step up',
  'pistol squat', 'pistol',
  'skater squat',
  'single leg squat', 'single-leg squat',
  'suitcase',     // suitcase carry is unilateral by design
  'single cable',
];

// ─── Compound classification ──────────────────────────────────────────────────
//
// Patterns that represent multi-joint compound movements.

const COMPOUND_PATTERNS = new Set([
  'squat', 'hinge', 'lunge_single_leg',
  'horizontal_push', 'vertical_push',
  'horizontal_pull', 'vertical_pull',
  'carry',
]);

// Name keywords that indicate isolation despite being in a compound-pattern category
// (e.g. "Leg Extension" has pattern=squat but is clearly isolation).

const ISOLATION_OVERRIDES: string[] = [
  'leg extension', 'knee extension',
  'leg curl', 'hamstring curl',
  'calf raise', 'standing calf', 'seated calf', 'donkey calf', 'tibialis raise',
  'lateral raise', 'side raise', 'front raise', 'rear delt fly', 'rear fly',
  'reverse fly', 'reverse flye', 'face pull',
  'chest fly', 'chest flye', 'cable fly', 'cable flye', 'pec deck', 'svend',
  'concentration curl', 'preacher curl', 'spider curl', 'hammer curl',
  'skull crusher', 'tricep kickback', 'tricep extension', 'tricep pushdown',
  'pushdown', 'push-down', 'pressdown',
  'cable curl', 'bicep curl', 'biceps curl', 'zottman',
  'shrug',
  'wrist curl', 'forearm curl',
];

// ─── Difficulty classification ────────────────────────────────────────────────

const ADVANCED_KEYWORDS: string[] = [
  'snatch', 'clean and jerk', 'split jerk', 'push jerk', 'clean pull',
  'hang clean', 'power clean', 'muscle clean',
  'muscle-up', 'muscle up',
  'planche', 'handstand push-up', 'handstand push up', 'handstand press',
  'one arm pull-up', 'one-arm pull-up', 'one arm chin',
  'pistol squat',
  'l-sit', 'l sit',
  'front lever', 'back lever',
  'ring dip', 'ring push',
];

const BEGINNER_KEYWORDS: string[] = [
  'assisted',
  'machine',
  'beginner',
  'basic',
  'modified',
  'seated machine',
  'leg press',        // generally machine-based
];

// Equipment-based difficulty defaults (applied after name keywords are exhausted).
// Map from Apex Protocol normalized equipment value → difficulty.
const EQUIPMENT_DIFFICULTY: Record<string, string> = {
  barbell:        'intermediate',
  kettlebell:     'intermediate',
  machine:        'beginner',
  cardio_machine: 'beginner',
  cable:          'beginner',
  dumbbell:       'beginner',
  band:           'beginner',
  bodyweight:     'beginner', // bumped to intermediate for compound (see logic below)
  mixed:          'beginner',
  none:           'beginner',
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Normalize a string for comparison: lowercase and trim. */
function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** Returns true if the normalized name contains any of the given keywords. */
function nameContainsAny(name: string, keywords: string[]): boolean {
  const n = normalize(name);
  return keywords.some((k) => n.includes(k));
}

/** Pattern matching step 1: keyword scan over exercise name. */
function patternFromName(name: string): string | null {
  const n = normalize(name);
  for (const rule of NAME_PATTERN_RULES) {
    if (rule.keywords.some((k) => n.includes(k))) {
      return rule.pattern;
    }
  }
  return null;
}

/** Pattern matching step 2: ExerciseDB body part + target muscle fallback. */
function patternFromBodyPart(rawBodyPart: string, rawTarget: string): string | null {
  const bp = normalize(rawBodyPart);
  const t  = normalize(rawTarget);
  for (const rule of BODY_PART_FALLBACK) {
    if (rule.bodyPart !== bp) continue;
    if (rule.targetKeyword && !t.includes(rule.targetKeyword)) continue;
    return rule.pattern;
  }
  return null;
}

function classifyIsUnilateral(name: string): boolean {
  return nameContainsAny(name, UNILATERAL_KEYWORDS);
}

function classifyIsCompound(movementPattern: string | null, name: string): boolean {
  if (!movementPattern) return false;
  if (!COMPOUND_PATTERNS.has(movementPattern)) return false;
  // Downgrade to isolation if the exercise name indicates single-joint movement
  if (nameContainsAny(name, ISOLATION_OVERRIDES)) return false;
  return true;
}

function classifyExerciseType(
  movementPattern: string | null,
  isCompound: boolean,
  name: string,
): string {
  if (movementPattern === 'cardio') return 'cardio';
  if (movementPattern === 'mobility') return 'mobility';
  if (movementPattern === 'anti_rotation' || movementPattern === 'rotation') return 'core';

  const n = normalize(name);
  const plyometricKeywords = [
    'jump squat', 'box jump', 'broad jump', 'plyometric', 'depth jump',
    'bounding', 'hurdle', 'power jump', 'med ball slam', 'slam ball',
  ];
  if (plyometricKeywords.some((k) => n.includes(k))) return 'plyometric';

  return isCompound ? 'compound' : 'isolation';
}

function classifyDifficulty(
  name: string,
  equipment: string | null | undefined,
  isCompound: boolean,
): string {
  // 1. Name-based overrides — highest confidence
  if (nameContainsAny(name, ADVANCED_KEYWORDS)) return 'advanced';
  if (nameContainsAny(name, BEGINNER_KEYWORDS)) return 'beginner';

  const eq = equipment ? normalize(equipment) : null;

  // 2. Barbell and kettlebell → intermediate regardless of compound/isolation
  if (eq === 'barbell' || eq === 'kettlebell') return 'intermediate';

  // 3. Machine-based → beginner (supported range of motion)
  if (eq === 'machine' || eq === 'cardio_machine') return 'beginner';

  // 4. Compound movements with non-machine equipment → intermediate
  if (isCompound) return 'intermediate';

  // 5. Isolation with cable, dumbbell, band, bodyweight → beginner
  return 'beginner';
}

function classifyGoalTags(
  exerciseType: string,
  isCompound: boolean,
  equipment: string | null | undefined,
  movementPattern: string | null,
): string[] {
  if (exerciseType === 'cardio') return ['endurance', 'fat_loss', 'general_fitness'];
  if (exerciseType === 'mobility') return ['mobility_recovery', 'general_fitness'];
  if (exerciseType === 'core') return ['general_fitness', 'athletic_performance'];
  if (exerciseType === 'plyometric') return ['athletic_performance', 'general_fitness'];

  const eq = equipment ? normalize(equipment) : null;

  // Barbell compound movements are optimal for absolute strength
  if (isCompound && eq === 'barbell') {
    return ['strength', 'hypertrophy', 'general_fitness'];
  }

  // Other compound movements (dumbbell, cable, bodyweight) — hypertrophy + fitness
  if (isCompound) return ['hypertrophy', 'general_fitness'];

  // Isolation movements — purely hypertrophy and general fitness
  return ['hypertrophy', 'general_fitness'];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const ExerciseClassificationService = {
  /**
   * Classify a single exercise.
   *
   * The pipeline runs in priority order:
   *   1. Name keywords              → movementPattern
   *   2. rawBodyPart + rawTarget    → movementPattern (fallback)
   *   3. movementPattern + name     → isCompound, isUnilateral, exerciseType
   *   4. exerciseType + equipment   → difficulty, goalTags
   */
  classify(input: ClassificationInput): ClassificationResult {
    const { name, rawBodyPart, rawTarget, equipment } = input;

    // ── Step 1 + 2: movement pattern ──────────────────────────────────────
    const movementPattern =
      patternFromName(name) ??
      (rawBodyPart && rawTarget ? patternFromBodyPart(rawBodyPart, rawTarget) : null);

    // ── Step 3: compound / unilateral ─────────────────────────────────────
    const isUnilateral = classifyIsUnilateral(name);
    const isCompound   = classifyIsCompound(movementPattern, name);
    const exerciseType = classifyExerciseType(movementPattern, isCompound, name);

    // ── Step 4: difficulty and goal tags ──────────────────────────────────
    const difficulty = classifyDifficulty(name, equipment, isCompound);
    const goalTags   = classifyGoalTags(exerciseType, isCompound, equipment, movementPattern);

    return { movementPattern, exerciseType, goalTags, difficulty, isCompound, isUnilateral };
  },

  /**
   * Classify a batch of exercises.
   * Returns a parallel array of ClassificationResult in the same order as inputs.
   */
  classifyBatch(inputs: ClassificationInput[]): ClassificationResult[] {
    return inputs.map((input) => ExerciseClassificationService.classify(input));
  },
};
