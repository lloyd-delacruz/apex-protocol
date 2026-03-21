# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CLAUDE.md - Apex Protocol AI Development Rules (Mobile-First)

This document defines the strict development rules for AI agents working on the Apex Protocol project.

All generated code must be:

- production-ready
- consistent
- scalable
- secure
- maintainable

---

## 0. Development Commands

### Starting Services

```bash
# Start both backend + mobile together
npm run dev

# Start individually
npm run dev:backend       # backend on port 4001 (ts-node-dev, hot reload)
npm run dev:mobile        # Expo (choose i=iOS / a=Android / w=web)
```

### Building

```bash
# IMPORTANT: Build shared package first — backend and mobile depend on its dist/
npm run build:shared      # packages/shared → dist/

npm run build:backend     # backend TypeScript → dist/
```

### Type Checking

```bash
npm run type-check                        # all workspaces
cd backend && npm run type-check          # backend only
cd apps/mobile && npm run type-check      # mobile only
```

### Backend Tests

```bash
cd backend
npm test                  # run all tests (Jest)
npm run test:watch        # watch mode
npm run test:coverage     # with coverage report
npx jest src/__tests__/AuthService.test.ts   # single test file
```

### Database (run from `backend/`)

```bash
npm run db:generate       # regenerate Prisma client after schema changes
npm run db:migrate        # apply migrations in dev (creates migration file)
npm run db:migrate:deploy # apply migrations in production (no prompt)
npm run db:seed           # seed the database
npm run db:reset          # wipe and re-migrate (destructive)
npm run db:studio         # open Prisma Studio UI
```

### Exercise Data (run from `backend/`)

```bash
npm run exercises:import      # import exercises from external source
npm run exercises:fix-media   # fix exercise media URLs
```

### Environment Setup

Backend: copy `backend/.env.example` → `backend/.env`

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/apex_protocol"
JWT_SECRET=<random string>
PORT=4001
```

Mobile: copy `apps/mobile/.env.example` → `apps/mobile/.env`

```
EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:4001   # e.g., http://10.0.0.170:4001
```

> **Physical device note:** Leave `EXPO_PUBLIC_API_URL` unset and Expo will attempt to auto-detect your LAN IP via `Constants.expoGoConfig.debuggerHost`. If auto-detection fails (common on some networks), set it explicitly to your machine's LAN IP.

---

## 1. Project Overview

**Project Name:** Apex Protocol

Apex Protocol is a **mobile-first training performance system** that tracks:

- workout programs
- strength progression
- hypertrophy performance
- reps in reserve (RIR)
- body metrics
- training status (achieved / progress / failed)

The system is designed as a **mobile application (primary)** supported by a backend API.

---

## 2. Core System Architecture

This is a mobile-first architecture:

```
Mobile App (Client)
  → Backend API
    → PostgreSQL Database

Optional future:
  → Python services (analytics / ML)
```

---

## 3. Technology Stack

### Mobile (Primary Client)

- React Native
- Expo

### Backend

- Node.js (primary API)
- FastAPI (optional for ML / analytics)

### Database

- PostgreSQL
- Prisma ORM

### Infrastructure

- Docker
- REST APIs
- JWT Authentication

---

## 4. Repository Structure

```
apex-protocol/
├── apps/mobile/   → React Native app (iOS + Android)
├── backend/       → API + business logic
├── packages/      → shared code/types
└── docs/          → architecture + specs
```

> No `web/` or `frontend/` folder — web has been removed.

---

## 5. Mandatory AI Behavior

Before generating any code:

1. Read this entire `CLAUDE.md`
2. Identify which layer is affected:
   - mobile
   - backend
   - database
3. Follow the rules for that layer

Never skip this process.

---

## 6. Mobile Development Rules (React Native)

### Framework

- React Native + Expo ONLY

### UI Requirements

- mobile-first design
- clean, minimal, modern UI
- high usability for frequent gym use

### UX Principles

- fast interactions (1–2 taps max per action)
- large touch targets
- minimal input friction
- offline-friendly where possible

### Design System

Use centralized design tokens. Current brand values:

| Token | Value | Usage |
|-------|-------|-------|
| Background dark | `#0A0A0F` | Screen backgrounds |
| Background mid | `#1A1A26` | Card backgrounds |
| Primary (cyan) | `#00C2FF` | CTAs, highlights |
| Text primary | `#FFFFFF` | Headings |
| Text secondary | `#A0A0B0` | Labels, captions |
| Spacing unit | 8px | Base; use multiples: 4/8/16/24/32 |

- Use gradient backgrounds: `#0A0A0F` → `#1A1A26`
- Bold italics for hero/emphasis text
- No random inline styles — always reference design tokens

### Path Alias

Mobile uses `@/*` → `src/*` (configured in `apps/mobile/tsconfig.json`). Use this for all internal imports within the mobile app (e.g., `import { colors } from '@/theme'`).

### Component Rules

- reusable components only
- no duplicated UI logic
- separate UI from logic
- use `ScreenErrorState` for full-screen error handling (already exists at `apps/mobile/src/components/ScreenErrorState.tsx`)

### Performance Rules

- avoid unnecessary re-renders
- use memoization where needed
- lazy load heavy screens

---

## 7. Navigation Rules

Use: **React Navigation**

`AppNavigator.tsx` has been removed. Navigation is now split across:

- `MainNavigator.tsx` — root navigator, handles Auth/Onboarding/Main switching
- `BodyNavigator.tsx` — nested stack inside the Body tab
- `WorkoutNavigator.tsx` — nested stack inside the Workout tab
- `SessionNavigator.tsx` — workout session flow navigator

### Current Navigation Structure

```
Root (MainNavigator)
├── Auth Stack (unauthenticated)
│   └── Login
├── Onboarding Stack (authenticated, not onboarded)
│   └── Onboarding (15 steps)
└── Main Tab Navigator (authenticated + onboarded)
    ├── Dashboard (icon: home)
    ├── Workout   (icon: barbell) → WorkoutNavigator (nested stack)
    │   ├── WorkoutScreen
    │   ├── PlanDetailsScreen
    │   ├── ExerciseSelectionScreen
    │   └── SessionNavigator → session flow
    ├── Progress  (icon: trending-up)
    ├── Body      (icon: body) → BodyNavigator (nested stack)
    │   ├── BodyScreen
    │   ├── TargetsScreen
    │   ├── BodyWeightDetailScreen
    │   ├── BodyFatDetailScreen
    │   ├── BodyMeasurementsScreen
    │   ├── BodyPhotosScreen
    │   └── BodyStatisticsScreen
    └── Log       (icon: calendar)
```

All navigation types are defined in `apps/mobile/src/navigation/types.ts`.

---

## 8. Data Hooks Pattern

All data-fetching hooks must follow this pattern:

```typescript
function useXxx(): { data: T | null; loading: boolean; error: string | null; refresh: () => void }
```

Existing hooks (do not duplicate):

| Hook | File | Purpose |
|------|------|---------|
| `useMetrics` | `hooks/useMetrics.ts` | Body metrics (weight, calories, sleep, mood) |
| `useProfile` | `hooks/useProfile.ts` | Onboarding profile data |
| `useProgress` | `hooks/useProgress.ts` | Dashboard analytics (strength, volume, adherence) |
| `useProgression` | `hooks/useProgression.ts` | Weight progression prompts with optimistic updates |
| `useWorkout` | `hooks/useWorkout.ts` | Today's workout data |
| `useExercises` | `hooks/useExercises.ts` | Exercise library with search/filter |

`useProgression` uses optimistic updates with ref-based rollback — follow this same pattern for any new mutation hooks.

---

## 9. Auth Context

Global auth state is managed in `apps/mobile/src/context/AuthContext.tsx`.

```typescript
AuthUser: {
  id, email, name, firstName, lastName,
  onboardingComplete, subscriptionActive
}
```

Key methods: `login()`, `register()`, `logout()`, `loginDev()` (dev only).

- Session is auto-restored on app launch via `api.auth.me()`
- 401/403 responses trigger a global unauthorized handler that clears tokens and alerts the user
- Always use `AuthContext` — never manage tokens manually in screens

Onboarding state is managed separately in `apps/mobile/src/context/OnboardingContext.tsx` — use this for onboarding step data, never duplicate onboarding state into AuthContext.

---

## 10. Backend Development Rules

Backend is the **single source of truth**.

```
backend/src/
├── routes/         → request routing (one file per domain)
├── services/       → business logic
├── repositories/   → DB access (Prisma queries)
├── middleware/     → auth, rate limiting, validation
├── config/         → configuration setup
├── db/             → Prisma client setup
└── scripts/        → one-off data import/fix scripts
```

---

## 11. API Design Standards

RESTful APIs only.

### Current Registered Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/programs` | List programs |
| GET | `/api/programs/assigned` | Get assigned program |
| POST | `/api/programs/generate` | Generate program from profile |
| POST | `/api/programs/:id/assign` | Assign a program to user |
| GET | `/api/workouts/today` | Get today's workout |
| GET | `/api/profiles/onboarding` | Get onboarding profile |
| POST | `/api/profiles/onboarding` | Save onboarding profile |
| POST | `/api/profiles/user` | Save user profile fields |
| GET | `/api/metrics/latest` | Latest body metrics |
| GET | `/api/metrics/history` | Paginated metrics history |
| GET | `/api/metrics/recovery` | Recovery score |
| GET | `/api/analytics/dashboard` | Dashboard analytics |
| GET | `/api/progression/pending` | Pending progression prompts |
| POST | `/api/progression/confirm` | Confirm weight increase |
| POST | `/api/progression/dismiss` | Dismiss progression prompt |
| POST | `/api/training-log` | Log an exercise session |
| GET | `/api/training-log/history` | Paginated training history |
| GET | `/api/training-log/exercise/:exerciseId` | Exercise progression history |
| GET | `/api/exercises` | Exercise library |
| GET | `/api/workouts/session` | Active workout session |
| POST | `/api/workouts/session` | Start/update workout session |

### Response Format

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## 12. API Client

> **Critical:** `@apex/shared` must be built (`npm run build:shared`) before the backend or mobile app can import from it. The package exports from `dist/`, not `src/`. During tests, `jest.config.js` maps `@apex/shared` directly to the source to avoid this requirement.

The API client is a factory defined in `packages/shared/src/api/client.ts` and instantiated in `apps/mobile/src/lib/api.ts`.

Mobile-specific behavior:
- Auto-resolves base URL from Expo debugger host (for physical devices on LAN)
- Fallback: `http://localhost:4001` (simulators only)
- Tokens stored in `AsyncStorage`
- 15-second request timeout
- Network errors returned as user-friendly messages

Do NOT use raw `fetch()` in screens or hooks. Always use the centralized `api` client.

---

## 13. Authentication Rules

Use: **JWT (access + refresh tokens)**

Security:

- passwords must be hashed (bcrypt)
- never store plaintext passwords
- always validate tokens
- never manage tokens outside of `AuthContext` + `api` client

---

## 14. Database Rules

- **Database:** PostgreSQL
- **ORM:** Prisma

### Core Tables

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

### Required Fields (every table)

```
id
created_at
updated_at
```

### Rules

- use foreign keys
- normalize data properly
- avoid duplicated fields

---

## 15. Workout Logic (CRITICAL)

Backend must compute all workout logic. Mobile never computes status or progression.

### Training Log Input Schema (Zod)

```typescript
{
  exerciseId: string,
  sessionDate: string,       // YYYY-MM-DD
  programId: string,
  workoutDayId: string,
  weight: number,
  weightUnit: 'kg' | 'lb',
  set1Reps: number,
  set2Reps: number,
  set3Reps: number,
  set4Reps?: number,
  rir: number,
  notes?: string
}
```

### Status Logic

| Status | Condition |
|--------|-----------|
| `ACHIEVED` | All sets hit upper rep target |
| `PROGRESS` | All sets hit minimum rep target |
| `FAILED` | Any set below minimum threshold |

### Progression Logic

- `readyToIncrease`: true when status is ACHIEVED
- `nextWeight`: `current weight + increment`, rounded to nearest 0.5

---

## 16. Onboarding Flow

The onboarding screen (`OnboardingScreen.tsx`) has **15 steps** with a progress bar:

| Step | Content |
|------|---------|
| 1 | Welcome |
| 2 | Primary goal (strength / muscle / body comp / weight loss / fitness / performance) |
| 3 | Consistency level |
| 4 | Experience level (beginner → advanced) |
| 5 | Training environment (commercial gym → bodyweight only) |
| 6 | Equipment selection (multiselect, at least 1 required) |
| 7 | Calibration intro (informational) |
| 8 | Best lifts (optional — 5-rep max for squat, bench, deadlift, OH press) |
| 9 | Weekly training goal (days per week, optional) |
| 10 | Notifications opt-in (optional) |
| 11 | Body stats — Apple Health sync or manual entry (optional) |
| 12 | Finalization (triggers server-side program generation + assignment) |
| 13 | Program summary (display only) |
| 14 | Conversion — value proposition / premium features (display only) |
| 15 | Paywall (7-day trial, yearly/monthly billing) |

Do not add or remove steps without updating this table.

---

## 17. Security Rules

All backend code must include:

- input validation (Zod or Joi)
- JWT verification
- rate limiting
- SQL injection protection
- sanitized outputs

Never expose:

- stack traces
- internal errors
- database queries

---

## 18. Performance Rules

Must follow:

- indexed queries
- pagination for large datasets
- avoid N+1 queries
- efficient DB access

Avoid:

- unnecessary API calls
- large payloads
- blocking operations

---

## 19. Mobile ↔ Backend Communication

Mobile must:

- never contain business logic
- always rely on backend calculations
- handle loading + error states properly (use `ScreenErrorState` for full-screen errors)

Use:

- centralized API client (`apps/mobile/src/lib/api.ts`)
- retry logic for failed requests

---

## 20. Offline Strategy (IMPORTANT)

Mobile app should:

- cache recent workouts
- allow temporary offline logging (AsyncStorage for active session)
- sync when connection returns

`WorkoutScreen.tsx` already persists in-progress sessions to AsyncStorage for resumability.

---

## 21. Documentation Rules

Every new module must include:

- purpose
- inputs
- outputs
- dependencies

---

## 22. Local Development

### Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 4001 | `http://localhost:4001` |

**Mobile (Expo):**

- use LAN IP for real devices
- do NOT use `localhost`
- API base URL auto-resolved from Expo debugger host in `apps/mobile/src/lib/api.ts`

---

## 23. Hard Constraints

AI must **NEVER**:

- generate insecure authentication
- store plaintext passwords
- mix business logic into UI
- duplicate components
- ignore architecture layers
- add unused dependencies
- hardcode exercise/image mappings in the frontend
- duplicate navigation files (AppNavigator is deleted — use MainNavigator)
- manage auth tokens outside of AuthContext

---

## 24. Development Philosophy

Apex Protocol is built as a **high-performance, production-grade fitness system**.

Focus on:

- simplicity
- speed
- accuracy
- scalability

Every feature must:

- solve a real user problem
- be intuitive
- be fast
