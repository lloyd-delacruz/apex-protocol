# Apex Protocol

**Apex Protocol** is a structured **performance training platform** designed to track strength progression, hypertrophy training, and body metrics using a data-driven system.

The goal is to transform traditional workout logging into a **progressive overload intelligence system** that helps athletes train more effectively.

Apex Protocol is designed to run across:

- Web applications
- iOS applications
- Android applications

using a shared architecture.

---

# Core Concept

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

# Training Status System

Each exercise session receives a performance status:

| Status | Meaning |
|------|------|
| ACHIEVED | All sets reached the upper rep target |
| PROGRESS | Reps are within the target range |
| FAILED | Reps fell below the lower rep threshold |

Color coding is used to visualize training outcomes.


🟢 ACHIEVED
🟡 PROGRESS
🔴 FAILED


---

# 12 Week Training Structure

The system follows a structured **three phase training cycle**.

| Phase | Weeks | Objective |
|------|------|------|
| Phase 1 | Weeks 1–4 | Foundation & Rep Progression |
| Phase 2 | Weeks 5–8 | Load & Volume Progression |
| Phase 3 | Weeks 9–12 | Strength & Intensity Peak |

---

# Weekly Training Schedule


Mon — Upper Strength
Tue — Lower Strength
Wed — Cardio + Core
Thu — Upper Hypertrophy
Fri — Lower Hypertrophy
Sat — Cardio
Sun — Rest / Mobility


---

# Training Metrics

Each exercise session tracks the following fields:

| Metric | Description |
|------|------|
Weight | Load used for the exercise |
Set 1–4 | Reps performed per set |
RIR | Reps In Reserve (training intensity indicator) |
Total Reps | Sum of all sets |
Lower Rep | Minimum rep threshold |
Upper Rep | Maximum rep target |
Ready | Determines progression eligibility |
Next Week Weight | Recommended load increase |
Status | Training outcome classification |

---

# Example Progression

Example session:


Bench Press
Target: 4–6 reps

Weight: 90 lbs

Set 1: 6
Set 2: 6
Set 3: 6
Set 4: 6


Status:


ACHIEVED


Next recommended weight:


95 lbs


If rep targets are not reached, the system marks the session as **PROGRESS** or **FAILED**.

---

# Body Metrics Tracking

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

# Technology Stack

Apex Protocol is designed as a **full stack cross platform system**.

## Frontend

React  
Next.js  
Tailwind CSS  

## Mobile

React Native  
Expo  

Supports:

- iOS
- Android

## Backend

Node.js  
FastAPI (optional services)

## Database

PostgreSQL

## Infrastructure

Docker  
REST APIs  
JWT Authentication

---

# Project Structure


apex-protocol/

frontend/
Web application interface

mobile/
React Native mobile application

backend/
API services and business logic

database/
schema definitions and migrations

docs/
architecture and design documentation

brand_assets/
logos, color palettes, brand guidelines


---

# Backend Architecture

Backend services follow a modular structure.


backend/

controllers/
services/
repositories/
models/
routes/
middleware/
utils/
config/


Responsibilities:

Controllers → handle HTTP requests  
Services → business logic  
Repositories → database access  
Models → data structures  

---

# API Design

Example endpoints:


GET /api/programs
GET /api/workouts
POST /api/training-log
POST /api/body-metrics


Authentication endpoints:


POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout


---

# Database Schema (Core Tables)

The database uses PostgreSQL.

Core tables include:


users
workout_programs
workout_weeks
workout_days
exercise_prescriptions
training_logs
body_metrics
exercises


Each table includes standard audit fields:


id
created_at
updated_at


---

# Development Philosophy

Apex Protocol prioritizes:

**Progressive Overload**


increase weight
increase reps
improve performance


**Recovery Awareness**


sleep
nutrition
stress management


**Consistency**


4 strength sessions
2 conditioning sessions
1 recovery day


The goal is **sustainable performance improvement without burnout**.

---

# Roadmap

Planned platform features include:

- mobile workout logging
- progress analytics dashboard
- strength trend visualization
- exercise substitution system
- AI training recommendations
- coaching accounts
- multi athlete support

---

# Target Users

Apex Protocol is designed for:

- intermediate lifters
- strength athletes
- physique athletes
- coaches
- data driven training enthusiasts

---

# Local Development

## Ports

| Service | URL |
|---------|-----|
| Application (Web + API) | http://localhost:4000 |

The web client runs on `http://localhost:4000` and automatically proxies `/api` requests to the backend (which runs internally on a hidden port like 4001).
All local access (web browsing and API calls) MUST use `http://localhost:4000`. No other localhost ports should be accessed directly.
To override the API URL for staging/production, set `NEXT_PUBLIC_API_URL` in your environment.

---

# License

MIT License