# System App Design And Testing (SADAT)
# Apex Protocol — End-to-End Workflow

---

## Purpose

This document defines the **complete user workflow** for Apex Protocol, from first launch to ongoing training.

It is used to:
- guide AI agent development
- validate feature completeness
- ensure UX consistency
- test the full product flow

---

## Core Architecture

The system operates across 3 layers:

1. **Onboarding Layer** — captures user intent and generates a personalized program
2. **Program Layer** — stores and schedules structured workouts
3. **Execution Layer** — tracks live workout performance and progression

---

## Workflow Overview

```
App Launch
  ↓
Auth Check
  ├── No token → /login
  └── Token valid
        ├── Onboarding incomplete → /onboarding
        └── Onboarding complete → /dashboard
```

---

## 1. Authentication

### Step 1: App Launch

System checks `localStorage` for `apex_token`.

```
Decision:
  Token missing → /login
  Token present → check onboarding flag
```

---

### Step 2: Login / Register

Route: `/`

User selects:
- **Sign In** — authenticate with existing credentials
- **Create Account** — register new account

System calls:
- `POST /api/auth/login` or `POST /api/auth/register`

On success:
- Store `apex_token` (access) and refresh token
- Create `user` record
- Create `user_profile` record
- Create empty `onboarding_profile` record

```
Decision:
  Auth failed → show error, stay on /
  Auth success → check onboarding_complete flag
    ├── onboarding_complete = false → /onboarding
    └── onboarding_complete = true → /dashboard
```

---

## 2. Onboarding Flow (15 Steps)

Route: `/onboarding`

State managed by `OnboardingProvider`.
Progress auto-saved to `localStorage` key `apex_onboarding_state`.
Progress synced to backend via `POST /api/profiles/onboarding`.

Progress bar displays: `(currentStep / 15) * 100%`

---

### Screen 1: Welcome

Type: Informational

- Display app name and value proposition
- No data collected

```
Action: Continue
  → Screen 2
```

---

### Screen 2: Goal Selection

Type: Required

Options:
- `strength`
- `muscle`
- `body_composition`
- `weight_loss`
- `general_fitness`
- `performance`

Save: `onboarding_profiles.goal`

```
Action: Select + Continue
  → Screen 3
```

---

### Screen 3: Consistency

Type: Required

Options:
- `brand_new` — never trained
- `returning` — trained before, restarting
- `inconsistent` — trains occasionally
- `consistent` — trains regularly
- `very_consistent` — trains 4+ days/week

Save: `onboarding_profiles.consistency`

```
Action: Select + Continue
  → Screen 4
```

---

### Screen 4: Experience Level

Type: Required

Options:
- `beginner`
- `intermediate`
- `advanced`

Save: `onboarding_profiles.experience`

```
Action: Select + Continue
  → Screen 5
```

---

### Screen 5: Training Environment

Type: Required

Options:
- `commercial_gym`
- `small_gym`
- `home_gym`
- `minimal_home`
- `bodyweight_only`
- `custom`

Save: `onboarding_profiles.environment`

```
Action: Select + Continue
  → Screen 6
```

---

### Screen 6: Equipment Selection

Type: Required (at least 1 item)

User selects specific equipment available.

System creates:
- `equipment_profile` record
- `equipment_profile_items` records

Save: `onboarding_profiles.equipment[]`

```
Action: Select items + Continue
  └── Validation: at least 1 item selected
        ├── Fail → show error
        └── Pass → Screen 7
```

---

### Screen 7: Calibration Intro

Type: Informational

Explains the purpose of the next screen (entering best lifts for auto-calibration).

No data collected.

```
Action: Continue
  → Screen 8
```

---

### Screen 8: Best Lifts (Optional)

Type: Optional

User enters personal bests for key exercises:
- Exercise name / key
- Reps performed
- Weight used
- Unit (kg / lbs)

Save: `onboarding_profiles.best_lifts[]`

Used by progression engine to seed starting weights.

```
Action: Enter lifts + Continue
        OR Skip → Screen 9
```

---

### Screen 9: Weekly Training Goal

Type: Optional

User sets:
- `workoutsPerWeek` (2–7 days)
- `specificDays` (array of selected weekdays)

Save:
- `onboarding_profiles.workouts_per_week`
- `onboarding_profiles.specific_days`

```
Action: Select + Continue
        OR Skip → Screen 10
```

---

### Screen 10: Notifications

Type: Optional

User sets:
- Notifications enabled (true/false)
- Preferred reminder time

Save: `notification_preferences`

```
Action: Set preferences + Continue
        OR Skip → Screen 11
```

---

### Screen 11: Body Stats

Type: Optional

User inputs:
- Gender
- Date of birth
- Height
- Weight
- Preferred unit (kg / lbs)

Save:
- `user_profiles` (gender, DOB, height, weight, units)
- `onboarding_profiles.body_stats_snapshot`

```
Action: Enter stats + Continue
        OR Skip → Screen 12
```

---

### Screen 12: Finalization (Program Generation)

Type: Required — triggers backend program generation

System calls:
```
POST /api/programs/generate
  body: { goal, experience, consistency, environment, equipment, workoutsPerWeek, specificDays, bestLifts }
```

Backend creates:
- `program` record
- `program_weeks` records
- `workout_days` records
- `exercise_prescriptions` records (filtered by equipment and goal)

Then:
```
POST /api/programs/{generated_id}/assign
```

Creates: `user_program_assignment` record

```
Decision:
  Generation failed → show error, allow retry
  Generation success → Screen 13
```

---

### Screen 13: Program Summary

Type: Display

Shows the generated program:
- Program name
- Total weeks
- Days per week
- Workout day types

No data collected.

```
Action: Continue
  → Screen 14
```

---

### Screen 14: Conversion

Type: Display / Value proposition

Shows premium features and benefits.

No data collected.

```
Action: Continue
  → Screen 15
```

---

### Screen 15: Paywall

Type: Required to proceed

User selects a subscription tier.

On completion:
- Set `apex_subscription_active = true` in localStorage
- Set `apex_onboarding_complete = true` in localStorage

```
Decision:
  Skip (dev bypass) → set flags, redirect to /workout
  Subscribe → process payment, set flags, redirect to /workout
```

---

## 3. Dashboard

Route: `/dashboard`

Displayed for all returning authenticated users.

System fetches:
- `GET /api/workouts/today` — today's scheduled workout
- `GET /api/analytics/dashboard` — volume, adherence, streaks
- `GET /api/training-log/history` — recent sessions (28-day window)

UI displays:
- Greeting with user name
- Current streak count and weekly goal
- Weekly stats (total volume, sessions, completion %)
- Today's workout card (workout type, top exercises)
- Recent session history (last 3)

```
Decision:
  Workout scheduled today → show workout card with "Ignite" button
  Rest day → show rest day message
  No program assigned → prompt to generate program
```

```
Action: Click "Ignite" → /dashboard/workout
        Click exercise in history → /dashboard/progress
```

---

## 4. Workout Execution

Route: `/dashboard/workout`

---

### Step A: Load Today's Workout

System calls:
```
GET /api/workouts/today
```

Returns:
- `workout_day` record with `dayCode`, `workoutType`, `phase`
- `exercise_prescriptions` with target sets, reps, weights

```
Decision:
  No program assigned → redirect to /dashboard with prompt
  Rest day → show rest day screen
  Workout available → render workout card
```

UI shows:
- Workout name and type
- Estimated duration
- Exercise list (name, muscle group, sets × reps, media image)

---

### Step B: Start Workout

User clicks **Ignite Protocol**.

System calls:
```
POST /api/workouts/session/start
  body: { workoutDayId, programId }
```

Returns: `sessionId`

System creates:
- `workout_sessions` record (`status = in_progress`, `started_at = now()`)
- `workout_session_exercises` records for each prescribed exercise

Timer starts counting elapsed seconds.

---

### Step C: Live Workout Execution

State: `active`

UI displays per exercise:
- Exercise name, muscle group
- Target sets × reps
- Media image
- Expandable logging interface

Real-time stats:
- Total volume (kg)
- Sets completed
- Completion percentage

**Logging a Set:**

User expands exercise → enters weight and reps → taps "Log Set".

Creates: `logged_sets` record
```
{
  setType: working | warmup,
  targetReps,
  actualReps,
  targetWeight,
  actualWeight,
  RIR,
  RPE,
  completed: true
}
```

```
Action per set:
  Log set → update live stats → optionally trigger rest timer
```

**Rest Timer:**

Default: 90 seconds

Creates: `workout_session_events` record (type: rest_start / rest_end)

```
Decision:
  Timer ends → notify user (vibration/sound), show "Start Next Set"
  User skips → dismiss timer
```

**Replace Exercise:**

User opens exercise options → selects "Replace".

System:
- Calls `GET /api/exercises/{id}/substitutions`
- Shows alternative exercises

On selection:
- Updates `workout_session_exercises.exercise_id`
- Sets `was_replaced = true`

**Add Exercise:**

User taps "Add Exercise" → opens exercise library search.

System calls:
```
GET /api/exercises?query=&equipment=&muscleGroup=
```

On selection:
- Inserts new `workout_session_exercises` record
- Exercise appears at bottom of active list

**Remove Exercise:**

User opens exercise options → selects "Remove".

Removes exercise from active session view (not deleted from prescriptions).

---

### Step D: Finish Workout

User taps **Finish Workout**.

System executes sequentially:

1. For each exercise with logged sets:
```
POST /api/training-log
  body: {
    exerciseId,
    sessionDate,
    weight,
    set1Reps, set2Reps, set3Reps, set4Reps,
    RIR,
    programId,
    programWeekId,
    workoutDayId,
    exercisePrescriptionId
  }
```

Backend computes per log:
- `totalReps`
- `status` (achieved / progress / failed)
- `readyToIncrease` (boolean)
- `nextWeight` (progression recommendation)

2. Finish session:
```
POST /api/workouts/session/finish
  body: { sessionId }
```

Backend updates:
```
workout_sessions.status = completed
workout_sessions.finished_at = now()
workout_sessions.duration_sec = finished_at - started_at
workout_sessions.total_volume = sum of (weight × reps) across all sets
workout_sessions.completed_exercise_count = count
```

Backend also updates:
```
weekly_progress.workouts_completed += 1
weekly_progress.remaining_to_goal -= 1
weekly_progress.streak_count (if consecutive day)
```

---

### Step E: Workout Summary

State: `completed`

Displayed inline on the same page (no route change).

Shows:
- Duration
- Total volume (kg)
- Exercises completed
- Sets logged
- Estimated calories

```
Action: Close summary → /dashboard
```

---

## 5. Returning User Flow

Route: `/dashboard`

System checks on load:
```
GET /api/workouts/today
  Decision:
    Workout scheduled → show today's card
    Rest day → show rest message
    Program complete → prompt to generate new program

GET /api/analytics/dashboard
  Populates: streak, weekly goal progress, volume stats
```

User repeats:

```
Dashboard → Ignite → Execute → Finish → Summary → Dashboard
```

---

## 6. Progression Logic

Triggered after each training log is created.

Backend evaluates per exercise:

| Condition | Status |
|---|---|
| All sets reached upper rep target | `achieved` |
| Sets within target rep range | `progress` |
| Below lower rep threshold | `failed` |

If `readyToIncrease = true`:
- Suggestion created for user to confirm weight increase
- Accessible via `GET /api/progression/pending`

User confirms:
```
POST /api/progression/confirm
  → creates user_exercise_weights record with new weight
  → new weight used as default next session
```

User dismisses:
```
POST /api/progression/dismiss
  → no weight change
```

---

## 7. Key Decision Map

```
App Launch
  └── Token? No → Login
      Token? Yes
        └── Onboarding complete? No → /onboarding
            Onboarding complete? Yes → /dashboard

/dashboard
  └── Program assigned? No → prompt generate
      Workout today? No → rest day screen
      Workout today? Yes → show workout card
        └── Click Ignite → /dashboard/workout

/dashboard/workout
  └── [Idle] Load workout
      └── Start → [Active] live execution
          └── Log sets, replace/add exercises, rest timers
              └── Finish → [Summary] inline display
                  └── Close → /dashboard
```

---

## 8. API Endpoint Summary

| Action | Method | Endpoint |
|---|---|---|
| Login | POST | `/api/auth/login` |
| Register | POST | `/api/auth/register` |
| Get current user | GET | `/api/auth/me` |
| Save onboarding | POST | `/api/profiles/onboarding` |
| Save user profile | POST | `/api/profiles/user` |
| Get today's workout | GET | `/api/workouts/today` |
| Start session | POST | `/api/workouts/session/start` |
| Finish session | POST | `/api/workouts/session/finish` |
| Log training | POST | `/api/training-log` |
| Get history | GET | `/api/training-log/history` |
| Generate program | POST | `/api/programs/generate` |
| Assign program | POST | `/api/programs/{id}/assign` |
| List exercises | GET | `/api/exercises` |
| Get substitutions | GET | `/api/exercises/{id}/substitutions` |
| Pending progressions | GET | `/api/progression/pending` |
| Confirm progression | POST | `/api/progression/confirm` |
| Dashboard analytics | GET | `/api/analytics/dashboard` |

---

## 9. Data Flow Per Layer

```
Onboarding Layer
  Input:  goal, experience, consistency, environment, equipment, days, stats
  Output: onboarding_profile, equipment_profile, user_profile, generated program

Program Layer
  Input:  onboarding_profile + equipment_profile
  Output: program → program_weeks → workout_days → exercise_prescriptions

Execution Layer
  Input:  workout_day + exercise_prescriptions
  Output: workout_session → workout_session_exercises → logged_sets → training_log → workout_summary
```

---

## 10. Testing Checklist

### Authentication
- [ ] Login returns valid token
- [ ] Invalid credentials show error
- [ ] Token expiry triggers refresh
- [ ] No token redirects to login

### Onboarding
- [ ] All 15 screens render in order
- [ ] Required screens block progression without selection
- [ ] Optional screens allow skip
- [ ] State persists across page refresh (localStorage)
- [ ] Equipment selection filters exercises correctly
- [ ] Program generation succeeds and creates full structure
- [ ] Paywall completion sets flags and redirects to workout

### Dashboard
- [ ] Correct workout loads for today
- [ ] Rest day detected and displayed
- [ ] Streak count is accurate
- [ ] Weekly stats reflect actual training data
- [ ] Recent sessions appear

### Workout Execution
- [ ] Session created on start with correct IDs
- [ ] All prescribed exercises load
- [ ] Sets can be logged with weight and reps
- [ ] Rest timer triggers and counts down
- [ ] Exercise replacement updates session correctly
- [ ] Exercise addition inserts to session
- [ ] Volume updates in real time
- [ ] Finish writes training logs for all exercises
- [ ] Session status updates to completed

### Progression
- [ ] Status computed correctly (achieved / progress / failed)
- [ ] Ready to increase flag triggers correctly
- [ ] Confirming progression updates user_exercise_weights
- [ ] Next session uses confirmed weight as default

### Completion
- [ ] Summary shows correct duration, volume, sets
- [ ] Weekly progress increments
- [ ] Streak updates if consecutive day
- [ ] Closing summary returns to dashboard
