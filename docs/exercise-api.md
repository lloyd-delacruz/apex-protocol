# Exercise API — Reference

## Base URL

`http://localhost:4000/api`

All endpoints require authentication (Bearer token). In development, auth is bypassed automatically using the seeded `dev@apexprotocol.io` user.

---

## Exercise Metadata Fields

Every exercise response includes these fields:

| Field              | Type       | Notes                                          |
|--------------------|------------|------------------------------------------------|
| `id`               | string     | UUID                                           |
| `name`             | string     | Unique exercise name                           |
| `category`         | string?    | Legacy category field                          |
| `muscleGroup`      | string?    | Legacy muscle group field                      |
| `equipment`        | string?    | e.g. `barbell`, `dumbbell`, `bodyweight`       |
| `bodyPart`         | string?    | e.g. `Upper Body`, `Lower Body`, `Core`        |
| `primaryMuscle`    | string?    | e.g. `Quads`, `Chest`, `Lats`                  |
| `secondaryMuscles` | string[]   | JSON array of secondary muscles                |
| `movementPattern`  | string?    | e.g. `squat`, `hinge`, `horizontal_push`       |
| `exerciseType`     | string?    | e.g. `compound`, `isolation`, `cardio`         |
| `goalTags`         | string[]   | e.g. `["strength", "hypertrophy"]`             |
| `difficulty`       | string?    | `beginner`, `intermediate`, or `advanced`      |
| `instructions`     | string?    | Step-by-step instructions as a numbered string |
| `mediaUrl`         | string?    | URL to animated GIF                            |
| `videoUrl`         | string?    | URL to video                                   |
| `isCompound`       | boolean    | True for multi-joint compound movements        |
| `isUnilateral`     | boolean    | True for single-limb exercises                 |
| `isActive`         | boolean    | False for deactivated/archived exercises       |
| `isEnriched`       | boolean    | Computed: true when imported from ExerciseDB   |
| `externalId`       | string?    | ID from the external source (e.g. ExerciseDB)  |
| `externalSource`   | string?    | e.g. `exercisedb`                              |
| `lastSyncedAt`     | datetime?  | When this record was last synced externally     |
| `createdAt`        | datetime   |                                                |
| `updatedAt`        | datetime   |                                                |

---

## Endpoints

### List exercises

`GET /api/exercises`

Returns paginated exercises. Supports all filter parameters below.

**Query params:**

| Param             | Type    | Default | Description                           |
|-------------------|---------|---------|---------------------------------------|
| `search`          | string  |         | Name contains (case-insensitive)      |
| `goal`            | string  |         | Filter by goal tag                    |
| `equipment`       | string  |         | Exact match (case-insensitive)        |
| `movementPattern` | string  |         | Exact match                           |
| `bodyPart`        | string  |         | Exact match                           |
| `primaryMuscle`   | string  |         | Contains match                        |
| `muscleGroup`     | string  |         | Contains match                        |
| `exerciseType`    | string  |         | Exact match                           |
| `difficulty`      | string  |         | Exact match                           |
| `isCompound`      | boolean |         | `true` or `false`                     |
| `isUnilateral`    | boolean |         | `true` or `false`                     |
| `limit`           | number  | 50      | Max 200                               |
| `offset`          | number  | 0       |                                       |

**Response:**
```json
{
  "success": true,
  "data": {
    "exercises": [...],
    "total": 1284
  },
  "error": null
}
```

---

### Search by name

`GET /api/exercises/search?q=squat`

Returns up to 30 matching exercises. `q` is required and must be non-empty.

---

### Filter exercises

`GET /api/exercises/filter`

Same query params as the list endpoint. Identical behaviour — provided as a semantic alias for filter-focused clients.

---

### Taxonomy (filter options)

`GET /api/exercises/taxonomy`

Returns all distinct values available for each filterable field. Use this to populate filter dropdowns in the frontend.

**Response:**
```json
{
  "success": true,
  "data": {
    "equipment":        ["band", "barbell", "bodyweight", "cable", "dumbbell", ...],
    "movementPatterns": ["anti_rotation", "cardio", "carry", "hinge", "horizontal_pull", ...],
    "bodyParts":        ["Cardio", "Core", "Lower Body", "Upper Body"],
    "exerciseTypes":    ["cardio", "compound", "isolation"],
    "difficulties":     ["advanced", "beginner", "intermediate"],
    "goalTags":         ["endurance", "fat_loss", "general_fitness", "hypertrophy", "strength"]
  },
  "error": null
}
```

---

### Exercises by goal

`GET /api/exercises/by-goal/:goal`

Valid goals: `strength`, `hypertrophy`, `fat_loss`, `endurance`, `athletic_performance`, `general_fitness`, `mobility_recovery`

---

### Exercises by equipment

`GET /api/exercises/by-equipment/:equipment`

Example: `/api/exercises/by-equipment/barbell`

---

### Exercises by movement pattern

`GET /api/exercises/by-pattern/:pattern`

Valid patterns: `squat`, `hinge`, `lunge_single_leg`, `horizontal_push`, `vertical_push`, `horizontal_pull`, `vertical_pull`, `rotation`, `anti_rotation`, `carry`, `cardio`, `mobility`, `balance`

---

### Single exercise

`GET /api/exercises/:id`

Returns full exercise detail with a `substitutions` array.

**Response:**
```json
{
  "success": true,
  "data": {
    "exercise": {
      "id": "...",
      "name": "Back Squat",
      "isEnriched": true,
      ...
      "substitutions": [
        {
          "id": "...",
          "priorityRank": 1,
          "notes": "Use if barbell unavailable",
          "substituteExercise": { ... }
        }
      ]
    }
  },
  "error": null
}
```

---

### Substitutions

`GET /api/exercises/:id/substitutions`

Returns the substitution list for a given exercise. Returns `404` if the exercise does not exist.

---

## Admin: Exercise Import

`POST /api/admin/exercises/import`

Triggers an import/sync from the ExerciseDB API. Requires authentication and `admin` role (in production). In development, both checks are bypassed.

**Body params (all optional):**

| Param       | Type    | Default | Description                                        |
|-------------|---------|---------|---------------------------------------------------|
| `bodyPart`  | string  |         | Import only this body-part category                |
| `equipment` | string  |         | Import only this equipment type                    |
| `pageSize`  | number  | 100     | Exercises per API page (1–1300)                    |
| `maxPages`  | number  | all     | Maximum pages to fetch                             |
| `delayMs`   | number  | 500     | Delay between API requests (ms)                    |

When `bodyPart` is set it takes priority over `equipment`. When neither is set, the full library is imported.

**Response:**
```json
{
  "success": true,
  "data": {
    "imported":   142,
    "updated":    87,
    "skipped":    1054,
    "failed":     2,
    "errorCount": 2,
    "errors": [
      { "externalId": "0781", "name": "Some Exercise", "error": "Missing required field" }
    ]
  },
  "error": null
}
```

---

## CLI Import

Run the CLI import script directly from the backend directory:

```bash
# Import full ExerciseDB library
npm run import:exercises

# Import a specific body part
npx ts-node src/scripts/importExercises.ts --bodyPart chest

# Import a specific equipment type
npx ts-node src/scripts/importExercises.ts --equipment barbell

# Custom pagination
npx ts-node src/scripts/importExercises.ts --pageSize 100 --maxPages 5 --delayMs 750
```

Requires `EXERCISEDB_API_KEY` and `EXERCISEDB_API_HOST` in your `.env` file.

---

## Classification System

`ExerciseClassificationService` assigns the six taxonomy fields using a priority-ordered pipeline:

| Priority | Signal                          | Used for                          |
|----------|---------------------------------|-----------------------------------|
| 1        | Exercise name keyword matching  | movementPattern (primary)         |
| 2        | rawBodyPart + rawTarget         | movementPattern (fallback)        |
| 3        | movementPattern + name          | isCompound, isUnilateral, exerciseType |
| 4        | exerciseType + equipment        | difficulty, goalTags              |

**Movement patterns assigned by name keywords (examples):**

| Keywords matched                          | Pattern           |
|-------------------------------------------|-------------------|
| squat, goblet squat, leg press            | squat             |
| deadlift, rdl, hip thrust, nordic curl    | hinge             |
| split squat, bulgarian, lunge, step-up    | lunge_single_leg  |
| bench press, push-up, dip, chest fly      | horizontal_push   |
| overhead press, shoulder press, shrug     | vertical_push     |
| pull-up, lat pulldown, pulldown           | vertical_pull     |
| row, face pull, reverse fly, bicep curl   | horizontal_pull   |
| plank, dead bug, bird dog, ab wheel       | anti_rotation     |
| russian twist, woodchop, pallof press     | rotation          |
| farmer walk, suitcase carry               | carry             |
| stretch, foam roll, mobility              | mobility          |
| running, cycling, burpee, jump rope       | cardio            |

**Difficulty logic:**
- `advanced` — olympic lifts, muscle-ups, planche, L-sits
- `intermediate` — barbell/kettlebell, compound bodyweight (pull-ups, push-ups)
- `beginner` — machines, isolation movements, assisted exercises

**Goal tags by exercise type:**
- `compound + barbell` → `strength, hypertrophy, general_fitness`
- `compound (other)` → `hypertrophy, general_fitness`
- `cardio` → `endurance, fat_loss, general_fitness`
- `core` → `general_fitness, athletic_performance`
- `mobility` → `mobility_recovery, general_fitness`
- `isolation` → `hypertrophy, general_fitness`

**Re-classify existing exercises via API:**

```bash
POST /api/admin/exercises/reclassify
{
  "onlyImported": true,   # default true — skip hand-authored exercises
  "dryRun": false,        # set true to preview without writing
  "limit": 100            # optional — process only N exercises
}
```

---

## Deduplication Strategy

The import service uses a three-tier deduplication strategy:

1. **Match on `(externalId, externalSource)`** — exact re-import, all fields updated
2. **Match on name (case-insensitive)** — enrich existing local exercise with sync metadata only; hand-authored taxonomy is preserved
3. **No match** — create new record

This ensures hand-curated exercises are never overwritten by automated imports.
