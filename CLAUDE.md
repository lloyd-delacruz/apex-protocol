# CLAUDE.md — Apex Protocol AI Development Rules

This file defines the **development rules for AI agents** working on the **Apex Protocol** project.

The purpose is to ensure that all generated code is:

- production quality
- consistent
- scalable
- secure
- maintainable

This document governs:

- Frontend (Web)
- Mobile (React Native)
- Backend APIs
- Database design
- System architecture

---

# Project Overview

**Project Name**

Apex Protocol

Apex Protocol is a **training performance system** that tracks:

- workout programs
- strength progression
- hypertrophy performance
- reps in reserve (RIR)
- body metrics
- training status (achieved / progress / failed)

The system is designed to support:

- Web dashboard
- iOS application
- Android application

---

# Technology Stack

Frontend Web

React  
Next.js  
Tailwind CSS  

Mobile

React Native  
Expo  

Backend

Node.js  
FastAPI (Python services if needed)  

Database

PostgreSQL

Infrastructure

Docker  
REST APIs  
JWT Authentication

---

# Repository Structure


apex-protocol/

frontend/
mobile/
backend/
database/
docs/


Frontend → Web interface  
Mobile → iOS and Android app  
Backend → APIs and business logic  
Database → schema + migrations  
Docs → architecture documentation

---

# Mandatory AI Behavior

Before generating any code:

1. Read this entire CLAUDE.md file.
2. Check project structure.
3. Identify if the task affects:

   - frontend
   - mobile
   - backend
   - database

4. Follow the rules defined in the relevant section.

Never skip these steps.

---

# Design Rules (Frontend + Mobile)

## Reference Design Rule

If a reference design or screenshot exists:

- Match layout exactly
- Match spacing exactly
- Match typography exactly
- Match colors exactly

Do not:

- redesign
- add sections
- improve layout

Your goal is **visual accuracy**.

---

# If No Design Exists

When designing from scratch:

Follow modern UI principles:

- clear hierarchy
- consistent spacing
- high contrast
- minimal design
- responsive layout
- mobile-first

Avoid generic templates.

---

# Brand Assets

Always check the folder:


brand_assets/


Assets may include:

- logo
- color palette
- typography
- images

If assets exist:

- use them
- do not invent colors
- do not replace logos

---

# Frontend Rules (Web)

Framework

React + Next.js

Styling

Tailwind CSS

Default Output

- responsive layout
- semantic HTML
- accessibility compliant

Avoid:

- inline random styling
- excessive dependencies
- unnecessary libraries

---

# UI Design Guardrails

## Colors

Never use default Tailwind colors as primary brand colors:


blue-500
indigo-500


Define custom palette.

---

## Typography

Headings and body text must use different fonts.

Example

Heading → display / serif  
Body → clean sans serif

Rules

- tight letter spacing on headings
- large line height on body text

---

## Shadows

Avoid flat shadows like:


shadow-md


Prefer layered shadows:


shadow-[0_20px_40px_rgba(0,0,0,0.08)]


---

## Animation Rules

Allowed properties

- transform
- opacity

Never use


transition-all


---

# React Native Rules (iOS + Android)

The mobile app must use:

React Native  
Expo

The UI must:

- match the web design system
- share design tokens
- maintain platform consistency

Do not use platform-specific UI unless required.

Always ensure:

- touch-friendly UI
- proper spacing
- accessible font sizes

---

# Responsive Design Rules

Every interface must support:

Mobile  
Tablet  
Desktop

Layout priority


Mobile → Tablet → Desktop


Never design desktop first.

---

# Image Handling

Placeholder images must use:


https://placehold.co/WIDTHxHEIGHT


Example


https://placehold.co/1200x800


---

# Backend Development Rules

Backend services power:

- workout logging
- program tracking
- body metrics
- authentication
- analytics

Backend must follow **clean architecture**.

---

# Backend Architecture


backend/

controllers/
services/
repositories/
models/
routes/
middleware/
utils/
config/


Controllers

Handle HTTP requests.

Services

Contain business logic.

Repositories

Handle database operations.

Models

Define data structures.

---

# API Design

APIs must follow REST standards.

Example


GET /api/programs
GET /api/workouts
POST /api/training-log
POST /api/body-metrics


All responses must follow consistent structure:


{
"success": true,
"data": {},
"error": null
}


---

# Authentication Rules

Authentication uses:

JWT tokens

Required endpoints:


POST /auth/login
POST /auth/register
POST /auth/refresh
POST /auth/logout


Passwords must be:

- hashed
- salted

Never store plaintext passwords.

---

# Database Rules

Database

PostgreSQL

Tables include:


users
workout_programs
workout_weeks
workout_days
exercise_prescriptions
training_logs
body_metrics
exercises


All tables must include:


id
created_at
updated_at


Use foreign keys properly.

---

# Workout Progression Logic

Backend must compute:

- lower rep target
- upper rep target
- total reps
- readiness for progression
- next weight recommendation

Status logic:

ACHIEVED

All sets reached upper rep.

PROGRESS

Reps within target range.

FAILED

Below lower rep threshold.

---

# Security Rules

All backend code must include:

- input validation
- JWT verification
- rate limiting
- SQL injection protection
- structured error responses

Never expose internal errors.

---

# Performance Rules

Avoid:

- unnecessary queries
- blocking operations
- large payload responses

Prefer:

- indexed queries
- pagination
- caching when needed

---

# Documentation Rules

All new modules must include documentation.

Every service must include:

- purpose
- inputs
- outputs
- dependencies

---

# Local Development

## Ports

| Service | Local Port | URL |
|---------|------------|-----|
| Web Client | 4000 | `http://localhost:4000` |
| Mobile API | 4001 | `http://localhost:4001` (or LAN IP) |
| Backend API | 4001 | `http://localhost:4001` |

- **Web Client (4000)**: Serves the Next.js frontend and proxies `/api/*` requests to port 4001 internally.
- **Mobile Client**: Connects directly to the Backend API on port 4001. If testing on a physical device via Expo Go, you MUST use your machine's LAN IP (e.g. `http://192.168.1.XX:4001`) instead of `localhost`.
- **Backend (4001)**: The source of truth for all API requests.

---

# Hard Constraints

AI must never:

- generate insecure authentication
- store plaintext passwords
- add UI elements not requested
- redesign reference layouts
- invent brand assets
- use transition-all
- use Tailwind default blue or indigo as primary brand colors

---

# Development Philosophy

Apex Protocol prioritizes:

- clarity
- performance
- maintainability
- scalability
- user experience

The system should evolve into a **professional performance training platform**.