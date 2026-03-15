## Overview

This document defines the database design for **Apex Protocol**, a performance training platform for tracking:

- workout programs
- exercise prescriptions
- training logs
- progression logic
- body metrics
- authentication and users

The database is designed for:

- PostgreSQL
- normalized structure
- scalability
- maintainability
- future SaaS expansion

---

## Design Principles

The schema is built with these principles:

1. **Separation of concerns**  
   Program templates are separate from user training logs.

2. **Normalized data model**  
   Exercises, programs, workout days, and logs are stored in separate but related tables.

3. **Auditability**  
   Core tables include timestamps for traceability.

4. **Extensibility**  
   The structure supports future features such as:
   - coach accounts
   - shared templates
   - exercise substitutions
   - notifications
   - analytics
   - mobile sync

---

## High-Level Entity Relationships

```text
users
  ├── roles
  ├── refresh_tokens
  ├── body_metrics
  ├── training_logs
  └── user_program_assignments

programs
  ├── program_months
  │    ├── program_weeks
  │    │    ├── workout_days
  │    │    │    └── exercise_prescriptions
  │    │    │          └── exercises
  │    └── ...
  └── ...

exercises
  └── exercise_substitutions
Core Tables
1. roles

Stores system roles for access control.

Column	Type	Constraints	Description
id	UUID	PK	Unique role identifier
name	VARCHAR(50)	UNIQUE, NOT NULL	Role name (admin, user, coach)
created_at	TIMESTAMP	NOT NULL	Created timestamp
updated_at	TIMESTAMP	NOT NULL	Updated timestamp
2. users

Stores user accounts.

Column	Type	Constraints	Description
id	UUID	PK	Unique user identifier
role_id	UUID	FK → roles.id, NOT NULL	User role
email	VARCHAR(255)	UNIQUE, NOT NULL	User email
password_hash	TEXT	NOT NULL	Hashed password
first_name	VARCHAR(100)	NULL	First name
last_name	VARCHAR(100)	NULL	Last name
is_active	BOOLEAN	DEFAULT true	Active status
created_at	TIMESTAMP	NOT NULL	Created timestamp
updated_at	TIMESTAMP	NOT NULL	Updated timestamp

Indexes

unique index on email

index on role_id

3. refresh_tokens

Stores refresh tokens for auth sessions.

Column	Type	Constraints	Description
id	UUID	PK	Unique token identifier
user_id	UUID	FK → users.id, NOT NULL	Token owner
token_hash	TEXT	NOT NULL	Hashed refresh token
expires_at	TIMESTAMP	NOT NULL	Expiration
revoked_at	TIMESTAMP	NULL	Revocation time
created_at	TIMESTAMP	NOT NULL	Created timestamp

Indexes

index on user_id

index on expires_at

4. programs

Stores reusable training programs.

Column	Type	Constraints	Description
id	UUID	PK	Unique program identifier
name	VARCHAR(255)	NOT NULL	Program name
slug	VARCHAR(255)	UNIQUE, NOT NULL	URL-friendly unique identifier
description	TEXT	NULL	Program description
total_weeks	INTEGER	NOT NULL	Total number of weeks
is_active	BOOLEAN	DEFAULT true	Program availability
created_at	TIMESTAMP	NOT NULL	Created timestamp
updated_at	TIMESTAMP	NOT NULL	Updated timestamp
5. program_months

Stores month blocks within a program.

Column	Type	Constraints	Description
id	UUID	PK	Unique month identifier
program_id	UUID	FK → programs.id, NOT NULL	Parent program
month_number	INTEGER	NOT NULL	Month sequence (1, 2, 3)
name	VARCHAR(255)	NOT NULL	Month label
description	TEXT	NULL	Month description
created_at	TIMESTAMP	NOT NULL	Created timestamp
updated_at	TIMESTAMP	NOT NULL	Updated timestamp

Unique Constraint

(program_id, month_number)

6. program_weeks

Stores weeks within a program month.

Column	Type	Constraints	Description
id	UUID	PK	Unique week identifier
program_month_id	UUID	FK → program_months.id, NOT NULL	Parent month
week_number	INTEGER	NOT NULL	Week sequence inside month
absolute_week_number	INTEGER	NOT NULL	Overall week number in the full program
created_at	TIMESTAMP	NOT NULL	Created timestamp
updated_at	TIMESTAMP	NOT NULL	Updated timestamp

Unique Constraints

(program_month_id, week_number)

(program_month_id, absolute_week_number) can be omitted if absolute week is globally unique per program flow

7. workout_days

Stores workout day templates within a week.

Column	Type	Constraints	Description
id	UUID	PK	Unique workout day identifier
program_week_id	UUID	FK → program_weeks.id, NOT NULL	Parent week
day_code	VARCHAR(20)	NOT NULL	Day label (Mon, Tue, etc.)
phase	VARCHAR(50)	NOT NULL	Strength, Hypertrophy, Cardio, Rest
workout_type	VARCHAR(100)	NOT NULL	Upper Strength, Lower Hypertrophy, etc.
sort_order	INTEGER	NOT NULL	Day order inside week
notes	TEXT	NULL	Optional notes
created_at	TIMESTAMP	NOT NULL	Created timestamp
updated_at	TIMESTAMP	NOT NULL	Updated timestamp

Indexes

index on program_week_id

index on sort_order

8. exercises

Stores the exercise library.

Column	Type	Constraints	Description
id	UUID	PK	Unique exercise identifier
name	VARCHAR(255)	UNIQUE, NOT NULL	Exercise name
category	VARCHAR(100)	NULL	compound, isolation, cardio, etc.
muscle_group	VARCHAR(100)	NULL	Main target muscle
equipment	VARCHAR(100)	NULL	barbell, dumbbell, machine, etc.
is_active	BOOLEAN	DEFAULT true	Active exercise flag
created_at	TIMESTAMP	NOT NULL	Created timestamp
updated_at	TIMESTAMP	NOT NULL	Updated timestamp
9. exercise_substitutions

Stores possible substitute exercises.

Column	Type	Constraints	Description
id	UUID	PK	Unique record identifier
exercise_id	UUID	FK → exercises.id, NOT NULL	Original exercise
substitute_exercise_id	UUID	FK → exercises.id, NOT NULL	Substitute exercise
priority_rank	INTEGER	DEFAULT 1	Ranking of substitution preference
notes	TEXT	NULL	Optional substitution logic
created_at	TIMESTAMP	NOT NULL	Created timestamp

Unique Constraint

(exercise_id, substitute_exercise_id)

10. exercise_prescriptions

Stores exercise templates assigned to a workout day.

Column	Type	Constraints	Description
id	UUID	PK	Unique prescription identifier
workout_day_id	UUID	FK → workout_days.id, NOT NULL	Parent workout day
exercise_id	UUID	FK → exercises.id, NOT NULL	Referenced exercise
target_rep_range	VARCHAR(50)	NULL	Example: 4-6, 8-12, 12-15
increment_value	NUMERIC(6,2)	DEFAULT 0	Suggested weight increase
increment_unit	VARCHAR(20)	DEFAULT 'lb'	lb or kg
notes	TEXT	NULL	Prescription notes
sort_order	INTEGER	NOT NULL	Exercise order in workout
created_at	TIMESTAMP	NOT NULL	Created timestamp
updated_at	TIMESTAMP	NOT NULL	Updated timestamp

Indexes

index on workout_day_id

index on exercise_id

index on sort_order

11. user_program_assignments

Assigns a program to a user.

Column	Type	Constraints	Description
id	UUID	PK	Unique assignment identifier
user_id	UUID	FK → users.id, NOT NULL	Assigned user
program_id	UUID	FK → programs.id, NOT NULL	Assigned program
assigned_at	TIMESTAMP	NOT NULL	Assignment date
start_date	DATE	NULL	Start date
end_date	DATE	NULL	End date
is_active	BOOLEAN	DEFAULT true	Active assignment
created_at	TIMESTAMP	NOT NULL	Created timestamp
updated_at	TIMESTAMP	NOT NULL	Updated timestamp

Indexes

index on user_id

index on program_id

12. training_logs

Stores actual user performance for a prescribed exercise.

Column	Type	Constraints	Description
id	UUID	PK	Unique log identifier
user_id	UUID	FK → users.id, NOT NULL	User performing workout
program_id	UUID	FK → programs.id, NULL	Program context
program_week_id	UUID	FK → program_weeks.id, NULL	Week context
workout_day_id	UUID	FK → workout_days.id, NULL	Workout day context
exercise_prescription_id	UUID	FK → exercise_prescriptions.id, NULL	Template source
exercise_id	UUID	FK → exercises.id, NOT NULL	Logged exercise
session_date	DATE	NOT NULL	Date of session
weight	NUMERIC(8,2)	NULL	Weight used
weight_unit	VARCHAR(20)	DEFAULT 'lb'	Weight unit
set_1_reps	INTEGER	NULL	Reps in set 1
set_2_reps	INTEGER	NULL	Reps in set 2
set_3_reps	INTEGER	NULL	Reps in set 3
set_4_reps	INTEGER	NULL	Reps in set 4
rir	INTEGER	NULL	Reps in reserve
total_reps	INTEGER	NULL	Calculated total reps
lower_rep	INTEGER	NULL	Parsed lower rep threshold
upper_rep	INTEGER	NULL	Parsed upper rep threshold
ready_to_increase	BOOLEAN	NULL	Progression flag
next_weight	NUMERIC(8,2)	NULL	Suggested next weight
status	VARCHAR(20)	NULL	ACHIEVED, PROGRESS, FAILED
notes	TEXT	NULL	Session notes
created_at	TIMESTAMP	NOT NULL	Created timestamp
updated_at	TIMESTAMP	NOT NULL	Updated timestamp

Indexes

index on user_id

index on session_date

index on exercise_id

index on status

13. body_metrics

Stores daily or periodic body/recovery metrics.

Column	Type	Constraints	Description
id	UUID	PK	Unique metric entry
user_id	UUID	FK → users.id, NOT NULL	Owner
entry_date	DATE	NOT NULL	Entry date
body_weight	NUMERIC(6,2)	NULL	Body weight
body_weight_unit	VARCHAR(20)	DEFAULT 'kg'	Unit
calories	INTEGER	NULL	Daily calories
protein_grams	INTEGER	NULL	Protein intake
sleep_hours	NUMERIC(4,2)	NULL	Sleep duration
hunger_score	INTEGER	NULL	Hunger 1–10
binge_urge_score	INTEGER	NULL	Binge urge 1–10
mood_score	INTEGER	NULL	Mood 1–10
training_performance_score	INTEGER	NULL	Performance 1–10
notes	TEXT	NULL	Optional notes
created_at	TIMESTAMP	NOT NULL	Created timestamp
updated_at	TIMESTAMP	NOT NULL	Updated timestamp

Unique Constraint

(user_id, entry_date)

Progression Logic Notes

The following fields in training_logs should be computed by the backend service layer, not trusted from the client:

total_reps

lower_rep

upper_rep

ready_to_increase

next_weight

status

Logic Rules
Parse rep range

Examples:

4-6 → lower = 4, upper = 6

8-12 → lower = 8, upper = 12

12-15 → lower = 12, upper = 15

Total reps
total_reps = set_1_reps + set_2_reps + set_3_reps + set_4_reps
Ready to increase
ready_to_increase = true if all completed sets >= upper_rep
Status
ACHIEVED = all sets >= upper_rep
PROGRESS = all sets >= lower_rep but not all >= upper_rep
FAILED = any set < lower_rep
Next weight
if ready_to_increase = true:
    next_weight = weight + increment_value
else:
    next_weight = weight
Cardio / Rest rows

For non-lifting prescriptions:

rep range may be null

progression fields may remain null

status may remain null

Recommended Enums

These can be implemented as PostgreSQL enums or validated string fields.

role_name

admin

user

coach

phase

Strength

Hypertrophy

Cardio

Rest

status

ACHIEVED

PROGRESS

FAILED

increment_unit / weight_unit

lb

kg

Suggested Indexing Strategy

High-priority indexes:

users.email

refresh_tokens.user_id

training_logs.user_id

training_logs.exercise_id

training_logs.session_date

body_metrics.user_id

body_metrics.entry_date

exercise_prescriptions.workout_day_id

workout_days.program_week_id

Composite indexes to consider:

(user_id, session_date) on training_logs

(user_id, exercise_id, session_date) on training_logs

(user_id, entry_date) on body_metrics

Soft Delete Strategy

Recommended for these tables:

users

programs

exercises

Possible implementation:

deleted_at TIMESTAMP NULL

Not necessary for:

training_logs

body_metrics

refresh_tokens

Those are better treated as historical records.

Seeding Recommendations

Initial seed data should include:

roles

admin

user

coach

exercises

Bench Press

Weighted Pull-ups

Overhead Press

Barbell Row

Back Squat

Romanian Deadlift

Leg Press

Hamstring Curl

Incline DB Press

Lat Pulldown

DB Shoulder Press

Lateral Raise

Cable Row

Fly Machine

Deadlift

Bulgarian Split Squat

Hip Thrust

Leg Extension

Seated Ham Curl

Calf Raise

Zone 2 Cardio

HIIT

Walk + Stretch

program

Apex Protocol 12 Week Base Program

program structure

3 months

12 weeks

all workout days

all exercise prescriptions

sample user

one development user account

Future Expansion

This schema is designed to support future additions such as:

coach-to-athlete relationships

shared templates

custom user programs

exercise history charts

notifications and reminders

training adherence analytics

wearable integrations

AI-generated recommendations