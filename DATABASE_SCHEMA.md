# Apex Protocol: Database Schema Documentation

This document defines the database design for **Apex Protocol**, a high-performance training platform tracking workout programs, live sessions, granular set performance, and user progression.

## Domains
1. [Identity & Authentication](#1-identity--authentication)
2. [Profiles & Onboarding](#2-profiles--onboarding)
3. [Equipment & Environment](#3-equipment--environment)
4. [Program Templates](#4-program-templates)
5. [Exercise Library](#5-exercise-library)
6. [Workout Execution (Runtime)](#6-workout-execution-runtime)
7. [Progress & Analytics](#7-progress--analytics)
8. [Architecture & Logic Notes](#architecture--logic-notes)

---

## 1. Identity & Authentication

### 1.1 roles
Stores system roles for access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique role identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Role name (admin, user, coach) |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

### 1.2 users
Core user accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique user identifier |
| role_id | UUID | FK → roles.id | User role |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| password_hash | TEXT | NOT NULL | Hashed password |
| first_name | VARCHAR(100) | NULL | First name |
| last_name | VARCHAR(100) | NULL | Last name |
| is_active | BOOLEAN | DEFAULT true | Active status |
| deleted_at | TIMESTAMP | NULL | Soft-delete timestamp |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

### 1.3 refresh_tokens
Auth session refresh tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique token identifier |
| user_id | UUID | FK → users.id | Token owner |
| token_hash | TEXT | NOT NULL | Hashed refresh token |
| expires_at | TIMESTAMP | NOT NULL | Expiration |
| revoked_at | TIMESTAMP | NULL | Revocation time |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |

---

## 2. Profiles & Onboarding

### 2.1 user_profiles
Stable user profile and health data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, UNIQUE | Profile owner |
| gender | VARCHAR(50) | NULL | Training profile field |
| date_of_birth| DATE | NULL | DOB |
| height_value | NUMERIC(6,2) | NULL | Height |
| height_unit | VARCHAR(10) | DEFAULT cm | Unit |
| weight_value | NUMERIC(6,2) | NULL | Current weight |
| weight_unit | VARCHAR(10) | DEFAULT kg | Unit |
| preferred_weight_unit | VARCHAR(10) | DEFAULT lb | Default workout unit |
| apple_health_connected | BOOLEAN | DEFAULT false | Health connection state |
| last_health_sync_at | TIMESTAMP | NULL | Last sync |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

### 2.2 onboarding_profiles
Onboarding responses used for program generation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique record |
| user_id | UUID | FK → users.id, NULL | Nullable until signup |
| goal | VARCHAR(50) | NULL | strength, muscle, fatigue_mgmt, etc. |
| consistency | VARCHAR(50) | NULL | Training consistency level |
| experience | VARCHAR(50) | NULL | Training experience |
| environment | VARCHAR(50) | NULL | gym, home, etc. |
| workouts_per_week | INTEGER | NULL | Preferred frequency |
| specific_days | JSONB | NULL | Array of selected days |
| body_stats_snapshot | JSONB | NULL | weight/BF at onboarding |
| notification_opt_in | BOOLEAN | DEFAULT false | Preview opt-in |
| notification_time | TIME | NULL | Preferred reminder time |
| completed_at | TIMESTAMP | NULL | Completion date |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

### 2.3 notification_preferences
User notification settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique record |
| user_id | UUID | FK → users.id, UNIQUE | Owner |
| workout_preview_enabled | BOOLEAN | DEFAULT false | Preview/reminder toggle |
| workout_preview_time | TIME | NULL | Preferred reminder time |
| push_enabled | BOOLEAN | DEFAULT false | General push flag |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

---

## 3. Equipment & Environment

### 3.1 equipment_profiles
Equipment presets or user-specific gym setups.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NULL | Owner if user-specific |
| onboarding_profile_id | UUID | FK → onboarding_profiles.id, NULL | Source onboarding |
| name | VARCHAR(255) | NOT NULL | Profile name (Commercial Gym, Home, etc.) |
| environment_type | VARCHAR(50) | NULL | Category |
| is_default | BOOLEAN | DEFAULT false | Default flag |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

### 3.2 equipment_profile_items
Individual pieces of equipment in a profile.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique item record |
| equipment_profile_id | UUID | FK → equipment_profiles.id | Parent profile |
| equipment_code | VARCHAR(100) | NOT NULL | Canonical code (e.g. barbell) |
| label | VARCHAR(255) | NOT NULL | Display name |
| metadata | JSONB | NULL | Optional range info |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |

---

## 4. Program Templates

### 4.1 programs
Reusable training programs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Program name |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly ID |
| goal | VARCHAR(50) | NULL | Target goal (strength, hypertrophy) |
| difficulty | VARCHAR(50) | NULL | Beginner, Intermediate, Advanced |
| split_type | VARCHAR(100) | NULL | PPL, Full Body, Upper/Lower |
| total_weeks | INTEGER | NOT NULL | Duration |
| is_system_generated | BOOLEAN | DEFAULT false | Generated by AI/onboarding |
| is_active | BOOLEAN | DEFAULT true | Availability |
| deleted_at | TIMESTAMP | NULL | Soft-delete timestamp |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

### 4.2 program_months
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique month identifier |
| program_id | UUID | FK → programs.id | Parent program |
| month_number | INTEGER | NOT NULL | Sequence (1, 2, 3) |
| name | VARCHAR(255) | NOT NULL | Label |

### 4.3 program_weeks
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique week identifier |
| program_month_id | UUID | FK → program_months.id | Parent month |
| week_number | INTEGER | NOT NULL | Week in month |
| absolute_week_number | INTEGER | NOT NULL | Absolute week in program |

### 4.4 workout_days
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique day identifier |
| program_week_id | UUID | FK → program_weeks.id | Parent week |
| name | VARCHAR(255) | NULL | User-facing workout name |
| day_code | VARCHAR(20) | NOT NULL | Mon, Tue, etc. |
| phase | VARCHAR(50) | NOT NULL | Strength, Hypertrophy, etc. |
| workout_type | VARCHAR(100) | NOT NULL | Upper, Lower, etc. |
| estimated_duration_min| INTEGER | NULL | Planned session duration |
| sort_order | INTEGER | NOT NULL | Position in week |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

### 4.5 exercise_prescriptions
Prescribed exercises for a workout day template.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique record |
| workout_day_id | UUID | FK → workout_days.id | Parent day |
| exercise_id | UUID | FK → exercises.id | Selected exercise |
| target_set_count | INTEGER | NULL | Working sets |
| warmup_set_count | INTEGER | DEFAULT 0 | Warm-up sets |
| target_rep_range | VARCHAR(50) | NULL | e.g. 8-12 |
| target_weight | NUMERIC(8,2) | NULL | Suggested starting weight |
| weight_unit | VARCHAR(20) | DEFAULT lb | lb or kg |
| rest_seconds | INTEGER | NULL | Suggested rest |
| is_focus_exercise | BOOLEAN | DEFAULT false | Primary movement flag |
| sort_order | INTEGER | NOT NULL | Order in workout |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

---

## 5. Exercise Library

### 5.1 exercises
The core exercise catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(255) | UNIQUE, NOT NULL | Exercise name |
| slug | VARCHAR(255) | UNIQUE, NULL | URL-friendly identifier |
| muscle_group | VARCHAR(100) | NULL | Primary muscle group |
| muscle_groups | JSONB | NULL | Array of target muscle groups |
| body_part | VARCHAR(100) | NULL | Upper Body, Lower Body, etc. |
| exercise_type | VARCHAR(100) | NULL | compound, isolation, cardio, mobility |
| movement_pattern | VARCHAR(100) | NULL | squat, hinge, push, etc. |
| instructions | TEXT | NULL | Step-by-step notes |
| media_url | TEXT | NULL | Image/GIF URL |
| thumbnail_url | TEXT | NULL | Small preview image |
| is_compound | BOOLEAN | DEFAULT false | Multi-joint flag |
| is_weighted | BOOLEAN | DEFAULT false | Weighted exercise flag |
| is_bodyweight | BOOLEAN | DEFAULT false | Bodyweight flag |
| is_cardio | BOOLEAN | DEFAULT false | Cardio flag |
| is_mobility | BOOLEAN | DEFAULT false | Mobility flag |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

### 5.2 exercise_media
Normalized table for additional exercise assets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique media record |
| exercise_id | UUID | FK → exercises.id | Parent exercise |
| media_type | VARCHAR(50) | NOT NULL | image, gif, video |
| url | TEXT | NOT NULL | Media URL |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |

### 5.3 exercise_substitutions
Stores possible substitute exercises.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique record identifier |
| exercise_id | UUID | FK → exercises.id | Original exercise |
| substitute_exercise_id | UUID | FK → exercises.id | Substitute exercise |
| priority_rank | INTEGER | DEFAULT 1 | Ranking of preference |
| notes | TEXT | NULL | Optional substitution logic |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |

### 5.4 user_exercise_weights
Stores per-user working weights.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique record |
| user_id | UUID | FK → users.id | User |
| exercise_id | UUID | FK → exercises.id | Exercise |
| current_weight | NUMERIC(8,2) | NOT NULL | Latest confirmed weight |
| weight_unit | VARCHAR(20) | DEFAULT kg | lb or kg |
| preferred_increment_pct| DOUBLE PRECISION | DEFAULT 2.5 | Default progression increment |
| confirmed_at | TIMESTAMP | NOT NULL | Date of confirmation |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

### 5.5 exercise_preferences
User-specific preferences to influence recommendation engine.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique preference identifier |
| user_id | UUID | FK → users.id | User |
| exercise_id | UUID | FK → exercises.id | Exercise |
| preference_type | VARCHAR(30) | NOT NULL | more_often, less_often, exclude |
| source | VARCHAR(50) | NULL | UI / engine / onboarding |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

---

## 6. Workout Execution (Runtime)

### 6.1 workout_sessions
Live or historical workout instances.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id | Owner |
| workout_day_id | UUID | FK → workout_days.id, NULL | Template source |
| status | VARCHAR(30) | NOT NULL | in_progress, completed, abandoned |
| started_at | TIMESTAMP | NOT NULL | Session start |
| finished_at | TIMESTAMP | NULL | Session end |
| duration_sec | INTEGER | NULL | Total duration |
| elapsed_active_sec | INTEGER | NULL | Active time excluding pauses |
| total_volume | NUMERIC(12,2) | NULL | Total weight shifted |
| estimated_calories | NUMERIC(8,2) | NULL | Estimated burn |
| completed_exercise_count | INTEGER | DEFAULT 0 | Count finished |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

### 6.2 workout_session_exercises
Exercises performed in a live session.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| workout_session_id | UUID | FK → workout_sessions.id | Parent session |
| exercise_prescription_id | UUID | FK → specifications.id, NULL | Template source |
| exercise_id | UUID | FK → exercises.id | Actual exercise |
| order_index | INTEGER | NOT NULL | Sequence order |
| is_focus_exercise | BOOLEAN | DEFAULT false | Primary movement |
| recommended_rest_sec | INTEGER | NULL | Rest duration |
| was_replaced | BOOLEAN | DEFAULT false | substitution flag |
| replacement_reason | VARCHAR(100) | NULL | Optional reason |
| completed_at | TIMESTAMP | NULL | Completion time |

### 6.3 logged_sets
Set-level execution data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| workout_session_exercise_id | UUID | FK → session_exercises.id | Parent entry |
| set_type | VARCHAR(20) | NOT NULL | warmup, working |
| set_order | INTEGER | NOT NULL | Sequence |
| target_reps | INTEGER | NULL | Planned reps |
| actual_reps | INTEGER | NULL | Completed reps |
| target_weight | NUMERIC(8,2) | NULL | Planned weight |
| actual_weight | NUMERIC(8,2) | NULL | Completed weight |
| unit | VARCHAR(20) | DEFAULT lb | Weight unit |
| rir | INTEGER | NULL | Reps in reserve |
| completed | BOOLEAN | DEFAULT false | Completion flag |
| skipped | BOOLEAN | DEFAULT false | Skipped flag |
| rest_after_sec | INTEGER | NULL | Actual rest taken |
| completed_at | TIMESTAMP | NULL | Completion timestamp |

### 6.4 workout_session_events
Timer and interaction telemetry.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique event identifier |
| workout_session_id | UUID | FK → workout_sessions.id | Parent session |
| workout_session_exercise_id | UUID | FK → session_exercises.id, NULL | Related exercise |
| event_type | VARCHAR(50) | NOT NULL | rest_started, rest_completed, etc. |
| payload | JSONB | NULL | Additional metadata |
| occurred_at | TIMESTAMP | NOT NULL | Event time |

### 6.5 workout_summaries
Snapshots of completed workouts for history views.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique summary identifier |
| workout_session_id | UUID | FK → workout_sessions.id, UNIQUE | Source session |
| user_id | UUID | FK → users.id | Owner |
| workout_name | VARCHAR(255) | NOT NULL | Snapshot title |
| performed_at | TIMESTAMP | NOT NULL | Finish time |
| total_volume | NUMERIC(12,2) | NULL | Total volume |
| summary_payload | JSONB | NULL | Snapshot display data |

---

## 7. Progress & Analytics

### 7.1 weekly_progress
Aggregated weekly consistency.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique record |
| user_id | UUID | FK → users.id | Owner |
| week_start_date | DATE | NOT NULL | Tracking week (Monday) |
| weekly_goal | INTEGER | NOT NULL | Target sessions |
| workouts_completed | INTEGER | DEFAULT 0 | Count finished |
| remaining_to_goal | INTEGER | DEFAULT 0 | Workouts left to hit goal |
| streak_count | INTEGER | DEFAULT 0 | Current habit streak |
| milestone_state | JSONB | NULL | State tracking for badges/locks |
| created_at | TIMESTAMP | NOT NULL | Created timestamp |
| updated_at | TIMESTAMP | NOT NULL | Updated timestamp |

### 7.2 body_metrics
Historical physiological data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id | Owner |
| entry_date | DATE | NOT NULL | Date |
| body_weight | NUMERIC(6,2) | NULL | Weight |
| calories | INTEGER | NULL | Daily calories |
| protein_grams | INTEGER | NULL | Protein intake |

### 7.3 training_logs (Legacy/Snapshots)
Backward-compatible flattened records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| workout_session_id | UUID | FK → workout_sessions.id | source session |
| weight | NUMERIC(8,2) | NULL | Top set weight |
| status | VARCHAR(20) | NULL | ACHIEVED, PROGRESS, FAILED |

---

## Architecture & Logic Notes

### Progression Logic
- **ACHIEVED**: All sets >= planned upper rep range.
- **PROGRESS**: All sets >= lower rep range; not all >= upper.
- **FAILED**: Any set < lower rep range.
- **Next weight**: Computed as `current_weight + increment` only if status is ACHIEVED.

### Volume Calculation
- **set_volume** = `actual_weight` * `actual_reps`
- **total_volume** = `sum(all completed weighted working sets)`

### Template vs Runtime
Planned workouts (templates) in `exercise_prescriptions` are decoupled from live execution in `workout_session_exercises`. This allows users to substitute exercises or modify set counts on the fly without altering the underlying program.

---

## Seeding Recommendations

### Initial Core Data
- **roles**: admin, user, coach.
- **equipment_presets**: Commercial Gym, Small Gym, Home Gym, Minimal Home, Bodyweight Only.
- **exercises**: Bench Press, Squat, Deadlift, Pull-up, OHP, etc.
- **program**: "Apex Protocol 12 Week Base Program" with 12 weeks of assigned days.

### Sample User State
- One development user account.
- One onboarding profile context.
- One generated program assignment.
- One mock workout session (completed).

---

## Migration Strategy (Evolutionary)

If evolving from the legacy flattened schema, follow this sequence:
1. **Maintain** template tables (`programs`, `workout_days`, `prescriptions`).
2. **Add** runtime tables (`workout_sessions`, `session_exercises`, `logged_sets`).
3. **Add** profiling layer (`onboarding_profiles`, `user_profiles`, `equipment_profiles`).
4. **Backfill** nullable foreign keys to link historical `training_logs` to `workout_sessions`.
5. **Deprecate** direct `training_logs` writes only after session-based logging is verified stable.