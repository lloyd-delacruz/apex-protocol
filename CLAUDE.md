# CLAUDE.md - Apex Protocol AI Development Rules (Mobile-First)

This document defines the strict development rules for AI agents working on the Apex Protocol project.

All generated code must be:

- production-ready
- consistent
- scalable
- secure
- maintainable

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

- use centralized design tokens (colors, spacing, typography)
- consistent spacing system (4 / 8 / 16 / 24 / 32)
- no random inline styles

### Component Rules

- reusable components only
- no duplicated UI logic
- separate UI from logic

### Performance Rules

- avoid unnecessary re-renders
- use memoization where needed
- lazy load heavy screens

---

## 7. Navigation Rules

Use: **Expo Router** or **React Navigation**

Structure:

```
Auth Flow (Login / Register)
Main App (Tabs)
  ├── Dashboard
  ├── Workouts
  ├── Progress
  └── Profile
Deep Screens (Stack)
```

---

## 8. Backend Development Rules

Backend is the **single source of truth**.

```
backend/
├── controllers/    → handle requests
├── services/       → business logic
├── repositories/   → DB access
├── models/
├── routes/
├── middleware/
├── utils/
└── config/
```

---

## 9. API Design Standards

RESTful APIs only.

```
GET  /api/programs
GET  /api/workouts
POST /api/training-log
POST /api/body-metrics
```

Response format:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## 10. Authentication Rules

Use: **JWT (access + refresh tokens)**

```
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

Security:

- passwords must be hashed (bcrypt)
- never store plaintext passwords
- always validate tokens

---

## 11. Database Rules

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

## 12. Workout Logic (CRITICAL)

Backend must compute:

- rep ranges
- progression readiness
- next weight recommendation

### Status Logic

| Status | Condition |
|--------|-----------|
| `ACHIEVED` | All sets hit upper rep target |
| `PROGRESS` | Within rep range |
| `FAILED` | Below minimum threshold |

---

## 13. Security Rules

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

## 14. Performance Rules

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

## 15. Mobile ↔ Backend Communication

Mobile must:

- never contain business logic
- always rely on backend calculations
- handle loading + error states properly

Use:

- centralized API client
- retry logic for failed requests

---

## 16. Offline Strategy (IMPORTANT)

Mobile app should:

- cache recent workouts
- allow temporary offline logging
- sync when connection returns

---

## 17. Documentation Rules

Every new module must include:

- purpose
- inputs
- outputs
- dependencies

---

## 18. Local Development

### Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 4001 | `http://localhost:4001` |

**Mobile (Expo):**

- use LAN IP for real devices
- do NOT use `localhost`

---

## 19. Hard Constraints

AI must **NEVER**:

- generate insecure authentication
- store plaintext passwords
- mix business logic into UI
- duplicate components
- ignore architecture layers
- add unused dependencies

---

## 20. Development Philosophy

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
