# Campus Event and RSVP Tracker

## Project Overview
Campus Event and RSVP Tracker is a web application for university event management. It supports event publishing, student RSVP workflows, and attendance tracking with a backend designed for team-based development.

This README is written for a 5-person team and should be treated as the shared implementation contract for setup, branching, pull requests, and release readiness.

## Team Structure (5 Members)
Use clear ownership so parallel work does not conflict.

1. Frontend Lead
   Owns React pages, routing, UI components, and frontend integration.
2. Backend Lead
   Owns API contracts, controllers, route structure, middleware, and validation.
3. Database and Data Flow Lead
   Owns schema changes, indexes, seeding, and migration-safe data updates.
4. QA and Test Lead
   Owns test scenarios, API smoke tests, regression checks, and release verification.
5. DevOps and Documentation Lead
   Owns environment consistency, scripts, developer onboarding, and docs quality.

If a task touches two domains, assign a primary owner and a reviewer before coding.

## Current Stack
Frontend
1. React 19
2. React Router 7
3. Vite

Backend
1. Node.js
2. Express
3. Mongoose
4. JWT Authentication

Database
1. MongoDB (local development default)

## Repository Layout
```text
campus-event-rsvp-tracker/
|- frontend/
|- backend/
|  |- controllers/
|  |- middlewares/
|  |- models/
|  |- routes/
|  |- scripts/         # db seed/init scripts
|  |- tests/
|- README.md
```

## Branching Strategy for Team Work
Use short-lived feature branches and keep main stable.

1. Base branch
   `main` is always deployable.
2. Branch naming
   `feature/<scope>-<short-name>`
   `fix/<scope>-<short-name>`
   `chore/<scope>-<short-name>`
3. Examples
   `feature/backend-rsvp-endpoint`
   `feature/frontend-events-page`
   `fix/backend-auth-validation`

## Commit Message Standard
Use a lightweight conventional format:
`type(scope): summary`

1. Types
   `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
2. Examples
   `feat(backend): add event details endpoint`
   `fix(auth): reject invalid token format`
   `docs(readme): add team collaboration guide`

## Pull Request Standard (Mandatory)
Every PR should include:

1. What changed
2. Why it changed
3. How it was tested
4. Risk and rollback notes
5. Screenshots or sample API responses if relevant

Minimum review policy:
1. At least 1 reviewer for regular changes
2. At least 2 reviewers for schema/API contract changes
3. Do not self-merge without at least one approved review

## Local Setup
### Prerequisites
1. Node.js 18+
2. npm 9+
3. MongoDB local server running on `127.0.0.1:27017` or your custom URI

### Install Dependencies
From project root:

```bash
npm run install:all
```

### Environment Setup
Backend environment file:
`backend/.env`

Required variables:

```env
PORT=5050
MONGODB_URI=mongodb://127.0.0.1:27017/eventDB
JWT_SECRET=dev-jwt-secret-change-me
FRONTEND_ORIGINS=http://localhost:5173
```

Notes:
1. `FRONTEND_ORIGINS` is a comma-separated allowlist used by backend CORS checks.
2. For multiple local clients, use values like `http://localhost:5173,http://127.0.0.1:5173`.

Reference template:
`backend/.env.example`

Initialize backend env from template:

```bash
cp backend/.env.example backend/.env
```

Validate backend environment before running dev server:

```bash
npm --prefix backend run check:env
```

## Run the Project
From project root:

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

Default URLs:
1. Frontend: `http://localhost:5173`
2. Backend health: `http://localhost:5050/api/health`

## Database Initialization and Seed Data
The backend includes an idempotent seed script.

Command:

```bash
npm --prefix backend run db:seed
```

What it does:
1. Connects to MongoDB
2. Syncs indexes
3. Upserts sample student roster records, users, events, RSVPs, and attendance records

## Student Roster Intake (PDF)
The Student collection is the trusted roster source for registration.

Security policy:
1. Original roster PDFs contain sensitive student data and must not be committed.
2. Store PDFs locally in `backend/data/source_docs/`.
3. Real PDF files are ignored by `.gitignore`.

Default file name:
1. `backend/data/source_docs/students.pdf`
2. `backend/data/Finalized Members 1 - Sheet1.pdf` (current canonical roster)

Import command:

```bash
npm --prefix backend run db:import:students -- data/source_docs/students.pdf
```

Strict replace import command (recommended):

```bash
npm --prefix backend run db:import:students:finalized:replace
```

Expected parsed row format inside PDF text:
1. `2001/18, John Student, john.student@campus.edu`
2. `John Student, 2001/18, john.student@campus.edu`

Student ID format policy:
1. Registration and login require `student_id` in `1234/18` format.
2. Registration is allowed only when that exact `student_id` exists in Student roster data.

Import output summary includes:
1. Rows parsed
2. Inserted
3. Updated
4. Skipped (unchanged)
5. Invalid rows

Seeded test accounts:
1. `1001/18` / `Password123!` (Admin - Genene)
2. `1002/18` / `Password123!` (Admin - Henok)
3. `1003/18` / `Password123!` (Admin - Maya)
4. `1004/18` / `Password123!` (Admin - Bedriya)
5. `1005/18` / `Password123!` (Admin - Hana)
6. `2001/18` / `Password123!` (Student)
7. `2002/18` / `Password123!` (Student)

Authentication note:
1. Login uses `student_id + password`.
2. Registration is allowed only when `student_id` exists in the Student roster.
3. Registration decision is based on `student_id` existence only, but saved profile data comes from the submitted `name` and `email`.
4. Signup requires at least one interest (`interest_categories` and/or `interest_keywords`) for personalized event notifications.
5. Register/login attempts are minimally tracked (`action`, `student_id`, `success`, `reason`, `created_at`).

Supported fixed interest categories:
1. `Academic`
2. `Sports`
3. `Arts`
4. `Social`
5. `Tech`
6. `Free Food`
7. `Wellness`

Interest notification behavior:
1. When an event is published, users whose interests match event category/tags receive an in-app notification.
2. Matching uses fixed category overlap and custom keyword overlap.
3. Event creators are excluded from interest-match broadcast notifications.
4. Email delivery is not enabled yet in this phase (in-app notifications only).

Admin authorization policy:
1. Admins are manually authorized via seeded admin accounts in `backend/scripts/seed.js`.
2. To authorize a new admin, update admin entries in seed data and rerun `npm --prefix backend run db:seed`.
3. Role changes take effect after the user signs in again (new JWT role claim).

Event moderation workflow:
1. Students can create events, but submissions default to `Pending` review.
2. Admins review `Pending` events and either approve (`Published`) or reject (`Rejected`) with required feedback.
3. Rejected event owners can update and resubmit to move status back to `Pending`.
4. Public event feeds expose only `Published` and `Ongoing` events.

Seed profile summary:
1. 7 total users
2. 5 admins
3. 2 students

## Available Scripts
Root scripts:
1. `npm run install:all`
2. `npm run dev:frontend`
3. `npm run dev:backend`
4. `npm run build:frontend`
5. `npm run lint:frontend`

Backend scripts:
1. `npm --prefix backend run dev`
2. `npm --prefix backend run start`
3. `npm --prefix backend run check:env`
4. `npm --prefix backend run test`
5. `npm --prefix backend run db:init`
6. `npm --prefix backend run db:seed`
7. `npm --prefix backend run db:check:students`
8. `npm --prefix backend run db:import:students -- data/source_docs/students.pdf`
9. `npm --prefix backend run db:import:students:replace`
10. `npm --prefix backend run db:import:students:finalized:replace`
11. `npm --prefix backend run db:import:students:finalized:dry-run`

## Current API Surface (Backend)
Base URL: `/api`

Auth routes:
1. `POST /auth/register`
2. `POST /auth/login`
3. `GET /auth/protected`

Auth payloads:
1. Register request body: `name`, `email`, `student_id`, `password`, `interest_categories` (array), optional `interest_keywords` (array)
2. Login request body: `student_id`, `password`

Event routes:
1. `GET /events`
2. `GET /events/:id`
3. `POST /events` (requires Authorization header)
4. `POST /events/upload-image` (requires Authorization header)
5. `PATCH /events/:id` (requires Authorization header, owner)
6. `PATCH /events/:id/resubmit` (requires Authorization header, rejected owner only)
7. `PATCH /events/:id/review` (requires Authorization header, Admin only)
8. `GET /events/review/pending` (requires Authorization header, Admin only)
9. `DELETE /events/:id` (requires Authorization header, owner)

System routes:
1. `GET /api/health`
2. `GET /`

## Complete Team Setup and Testing Guide
Use this section as the single onboarding + QA runbook for all teammates.

### Step 1: Install required software
Required tools:
1. Git
2. Node.js 18 or newer
3. npm 9 or newer
4. MongoDB Community Server

Quick verification commands:

```bash
git --version
node -v
npm -v
mongod --version
```

### Step 2: Clone and install dependencies
From your machine:

```bash
git clone <your-repo-url>
cd campus-event-rsvp-tracker
npm run install:all
```

What this installs:
1. Frontend dependencies from `frontend/package.json`
2. Backend dependencies from `backend/package.json`

### Step 3: Configure backend environment
Initialize backend env file:

```bash
cp backend/.env.example backend/.env
```

Required `.env` values:

```env
PORT=5050
MONGODB_URI=mongodb://127.0.0.1:27017/eventDB
JWT_SECRET=dev-jwt-secret-change-me
FRONTEND_ORIGINS=http://localhost:5173
```

Validate configuration:

```bash
npm --prefix backend run check:env
```

### Step 4: Start MongoDB and seed baseline data
Ensure MongoDB server is running, then seed:

```bash
npm --prefix backend run db:seed
```

Optional roster import command if needed:

```bash
npm --prefix backend run db:import:students:finalized:replace
```

### Step 5: Run automated tests
Run all backend tests:

```bash
npm --prefix backend run test
```

Run backend integration-only suite:

```bash
npm --prefix backend run test:integration
```

Run frontend unit tests:

```bash
npm --prefix frontend run test:run
```

Run frontend production build check:

```bash
npm --prefix frontend run build
```

### Step 6: Run app locally for manual QA
Start backend and frontend in separate terminals:

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

URLs:
1. Frontend: `http://localhost:5173`
2. Backend health: `http://localhost:5050/api/health`

### Step 7: Manual end-to-end test checklist
Use these checks before opening a PR.

Auth and profile checks:
1. Register a new student account with `name`, `email`, `student_id`, `password`, and at least one interest.
2. Confirm login works with `student_id + password`.
3. Open profile settings and update name, email, and interests.

Moderation checks:
1. Student creates event and sees `Pending` status.
2. Admin logs in and opens review queue.
3. Admin rejects once with a reason.
4. Student resubmits.
5. Admin approves.
6. Confirm event appears in public feeds (`Published`/`Ongoing` only).

Interest notification checks:
1. Publish an event tagged with a category or keyword matching another user interests.
2. Confirm matching users receive in-app "New event for your interests" notification.
3. Confirm non-matching users do not receive that notification.
4. Confirm event creator is excluded from interest broadcast notification.

RSVP and notification checks:
1. RSVP to a published event.
2. Confirm RSVP confirmation notification appears.
3. Cancel RSVP and confirm cancellation notification appears.

### Step 8: Suggested QA ownership split for 5 teammates
1. Frontend Lead: signup/profile forms, route guards, and UI behavior.
2. Backend Lead: auth/event/notification endpoint behavior.
3. Database Lead: seed/import correctness and schema/index checks.
4. QA Lead: executes this full checklist and records defects.
5. DevOps and Docs Lead: verifies env consistency and updates README.

## Testing and Quality Gates
Backend API smoke tests location:
1. `backend/tests/api.test.js`

Team gate before merge:
1. Backend tests pass.
2. Frontend tests pass.
3. Frontend build passes.
4. No unresolved editor/lint errors in changed files.
5. README and env docs updated if behavior changed.
6. PR reviewed and approved.

## Team Implementation Rules
These rules should be followed for all upcoming implementations.

1. Do not change API response shapes without documenting it in PR notes.
2. Schema/index changes require reviewer acknowledgement from backend and database owners.
3. Every new endpoint must include at least one test case.
4. Keep feature branches small and focused.
5. Do not commit secrets.
6. Update README sections whenever commands, endpoints, or setup flows change.

## Suggested Team Sprint Flow
For each sprint cycle:

1. Planning
   Lock scope and split tickets by owner.
2. Build
   Implement in feature branches with daily pulls from `main`.
3. Integrate
   Pair frontend-backend owners to verify contracts early.
4. Validate
   QA owner runs smoke scenarios and regression checks.
5. Merge
   Merge only reviewed PRs with passing checks.

## Project Charter
Project charter document:
https://docs.google.com/document/d/1V2aqEorsikDaCRW1CAQ3osSluMpUpIewOEMrVOVfXCA/edit?usp=sharing

## License
This project is licensed under the MIT License. See `LICENSE`.
