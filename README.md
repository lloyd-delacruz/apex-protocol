# Apex Protocol

**Apex Protocol** is a structured **performance training platform** designed to track strength progression, hypertrophy training, and body metrics using a data-driven system.

The goal is to transform traditional workout logging into a **progressive overload intelligence system** that helps athletes train more effectively.

Apex Protocol is designed to run across:

- iOS applications
- Android applications

using a shared mobile-first architecture.

---

## Core Concept

Apex Protocol tracks **training performance and recovery signals** to determine whether an athlete is progressing effectively.

Each exercise session evaluates performance using structured metrics such as:

- weight lifted
- reps per set
- reps in reserve (RIR)
- total reps
- rep target ranges
- progression readiness
- next session weight recommendation

The system classifies performance automatically to guide training decisions.

---

## Training Status System

Each exercise session receives a performance status:

| Status | Meaning |
|--------|---------|
| ACHIEVED | All sets reached the upper rep target |
| PROGRESS | Reps are within the target range |
| FAILED | Reps fell below the lower rep threshold |

Color coding is used to visualize training outcomes:

- **ACHIEVED** - green
- **PROGRESS** - yellow
- **FAILED** - red

---

## 12 Week Training Structure

The system follows a structured **three phase training cycle**.

| Phase | Weeks | Objective |
|-------|-------|-----------|
| Phase 1 | Weeks 1-4 | Foundation & Rep Progression |
| Phase 2 | Weeks 5-8 | Load & Volume Progression |
| Phase 3 | Weeks 9-12 | Strength & Intensity Peak |

---

## Weekly Training Schedule

```
Mon - Upper Strength
Tue - Lower Strength
Wed - Cardio + Core
Thu - Upper Hypertrophy
Fri - Lower Hypertrophy
Sat - Cardio
Sun - Rest / Mobility
```

---

## Training Metrics

Each exercise session tracks the following fields:

| Metric | Description |
|--------|-------------|
| Weight | Load used for the exercise |
| Set 1-4 | Reps performed per set |
| RIR | Reps In Reserve (training intensity indicator) |
| Total Reps | Sum of all sets |
| Lower Rep | Minimum rep threshold |
| Upper Rep | Maximum rep target |
| Ready | Determines progression eligibility |
| Next Week Weight | Recommended load increase |
| Status | Training outcome classification |

---

## Example Progression

Example session:

```
Bench Press
Target: 4-6 reps

Weight: 90 lbs

Set 1: 6
Set 2: 6
Set 3: 6
Set 4: 6

Status: ACHIEVED
Next recommended weight: 95 lbs
```

If rep targets are not reached, the system marks the session as **PROGRESS** or **FAILED**.

---

## Body Metrics Tracking

In addition to workout data, Apex Protocol tracks recovery indicators.

These include:

- body weight
- calories
- protein intake
- sleep duration
- hunger level
- binge urge
- mood
- training performance

These metrics help correlate **training output with recovery quality**.

---

## Technology Stack

Apex Protocol is designed as a **mobile-first cross platform system**.

### Mobile (Primary)

- React Native
- Expo
- iOS and Android

### Backend

- Node.js
- FastAPI (optional services)

### Database

- PostgreSQL
- Prisma ORM

### Infrastructure

- Docker
- REST APIs
- JWT Authentication

---

## Project Structure

```
apex-protocol/
├── apps/mobile/   -> React Native app (iOS + Android)
├── backend/       -> API services and business logic
├── packages/      -> shared code and types
└── docs/          -> architecture and design documentation
```

---

## Backend Architecture

Backend services follow a modular structure.

```
backend/
├── controllers/   -> handle HTTP requests
├── services/      -> business logic
├── repositories/  -> database access
├── models/        -> data structures
├── routes/
├── middleware/
├── utils/
└── config/
```

---

## API Design

Example endpoints:

```
GET  /api/programs
GET  /api/workouts/today
POST /api/training-log
POST /api/metrics
```

Authentication endpoints:

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

All responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## Database Schema (Core Tables)

The database uses PostgreSQL with Prisma ORM.

Core tables:

```
users
workout_programs
workout_weeks
workout_days
exercise_prescriptions
training_logs
body_metrics
exercises
```

Each table includes standard audit fields:

```
id
created_at
updated_at
```

---

## Development Philosophy

Apex Protocol prioritizes:

**Progressive Overload**

- increase weight
- increase reps
- improve performance

**Recovery Awareness**

- sleep
- nutrition
- stress management

**Consistency**

- 4 strength sessions
- 2 conditioning sessions
- 1 recovery day

The goal is **sustainable performance improvement without burnout**.

---

## Roadmap

Planned platform features include:

- mobile workout logging
- progress analytics dashboard
- strength trend visualization
- exercise substitution system
- AI training recommendations
- coaching accounts
- multi athlete support

---

## Target Users

Apex Protocol is designed for:

- intermediate lifters
- strength athletes
- physique athletes
- coaches
- data driven training enthusiasts

---

## Local Development

### Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 4001 | `http://localhost:4001` |

**Mobile (Expo):** use your machine's LAN IP (and port 8081/8082) for real devices — do NOT use `localhost` in the API URL.

---

## Exercise Library

Apex Protocol includes a curated exercise library of 500+ exercises sourced from the **RapidAPI ExerciseDB** API, enriched with taxonomy metadata via an automated classification pipeline.

### RapidAPI Integration

Exercise data is fetched from ExerciseDB via RapidAPI.

The integration uses:

- `ExerciseDbService` - HTTP client for the API (no database writes)
- `ExerciseImportService` - normalises and persists exercises with deduplication
- `ExerciseClassificationService` - assigns taxonomy via heuristic pipeline

### Required Environment Variables

Set these in `backend/.env` before running import commands:

| Variable | Description |
|----------|-------------|
| `EXERCISEDB_API_KEY` | Your RapidAPI API key |
| `EXERCISEDB_API_HOST` | API host - `exercisedb.p.rapidapi.com` |
| `EXERCISEDB_BASE_URL` | Base URL - `https://exercisedb.p.rapidapi.com` |

Example `backend/.env`:

```
EXERCISEDB_API_KEY=your_rapidapi_key_here
EXERCISEDB_API_HOST=exercisedb.p.rapidapi.com
EXERCISEDB_BASE_URL=https://exercisedb.p.rapidapi.com
```

### Import Commands

Run these from the `backend/` directory:

```bash
# Import the full exercise library (~1300 exercises, paginated)
npm run exercises:import

# Or run directly with ts-node
npx ts-node-dev --transpile-only src/scripts/importExercises.ts
```

The import script is safe to re-run. It uses a three-tier deduplication strategy:

1. Match by `(externalId, externalSource)` - exact re-sync of previously imported exercise
2. Match by name - enrich an existing hand-authored exercise with media/metadata
3. No match - create new exercise record

### Importing a Subset

The `ExerciseImportService` supports targeted imports:

```typescript
// Import exercises by body part (e.g. for testing)
await ExerciseImportService.importByBodyPart('chest');

// Import exercises by equipment type
await ExerciseImportService.importByEquipment('barbell');
```

### Exercise Taxonomy Fields

Each exercise is automatically classified with these enriched fields:

| Field | Values | Description |
|-------|--------|-------------|
| `movementPattern` | squat, hinge, lunge_single_leg, horizontal_push, vertical_push, horizontal_pull, vertical_pull, rotation, anti_rotation, carry, cardio, mobility | Primary movement classification |
| `exerciseType` | compound, isolation, cardio, core, mobility, plyometric | Exercise category |
| `difficulty` | beginner, intermediate, advanced | Difficulty tier |
| `bodyPart` | Upper Body, Lower Body, Core, Full Body, Cardio | Body region |
| `primaryMuscle` | e.g. Quadriceps, Pectorals, Latissimus Dorsi | Primary target muscle |
| `secondaryMuscles` | JSON array of strings | Secondary muscles involved |
| `goalTags` | strength, hypertrophy, fat_loss, endurance, athletic_performance, general_fitness, mobility_recovery | Training goal tags |
| `isCompound` | true / false | Multi-joint movement flag |
| `isUnilateral` | true / false | Single-limb movement flag |
| `equipment` | barbell, dumbbell, cable, machine, kettlebell, band, bodyweight, cardio_machine, mixed, none | Equipment required |

### Exercise API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exercises` | List all exercises (paginated, filterable) |
| GET | `/api/exercises/search?q=` | Full-text name search |
| GET | `/api/exercises/filter` | Multi-field filtering |
| GET | `/api/exercises/taxonomy` | Distinct values for all filter fields |
| GET | `/api/exercises/by-goal/:goal` | Filter by training goal |
| GET | `/api/exercises/by-equipment/:equipment` | Filter by equipment |
| GET | `/api/exercises/by-pattern/:pattern` | Filter by movement pattern |
| GET | `/api/exercises/:id` | Single exercise with substitutions |
| GET | `/api/exercises/:id/substitutions` | Substitution options only |

### Supported Query Parameters

For `/api/exercises` and `/api/exercises/filter`:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `search` | `?search=squat` | Name search (case-insensitive) |
| `goal` | `?goal=strength` | Filter by goal tag |
| `equipment` | `?equipment=barbell` | Filter by equipment |
| `movementPattern` | `?movementPattern=hinge` | Filter by movement pattern |
| `bodyPart` | `?bodyPart=Lower+Body` | Filter by body region |
| `difficulty` | `?difficulty=beginner` | Filter by difficulty |
| `isCompound` | `?isCompound=true` | Compound-only filter |
| `isUnilateral` | `?isUnilateral=true` | Unilateral-only filter |
| `limit` | `?limit=20` | Page size (default 50, max 200) |
| `offset` | `?offset=40` | Pagination offset |

---

## License

MIT License
