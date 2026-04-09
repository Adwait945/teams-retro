# Sprint 1 — Foundation

**Theme**: Types, MongoDB Data Layer, Registration, Dashboard  
**Scope**: Scope 2 MVP  
**DEV Sessions**: 3  
**Prerequisite**: Phase 0 complete (prototypes + screenshots in docs/); `.env.local` with `MONGODB_URI` set

> **Strategy note**: MongoDB Atlas replaces localStorage from this sprint. Every line written here survives to production — no throwaway code.

---

## Sprint Goal
A user can register with their name, username, and pod. Data is saved to MongoDB Atlas and shared across all users in real time. After registering, the user lands on a Dashboard showing live sprint stats pulled from the database.

---

## Pre-Sprint Setup (YOU do this before agents start)

1. Log into [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster named `teams-retro` (free tier M0 is sufficient)
3. Create a database user with read/write access
4. Get the connection string: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/teams-retro`
5. Create `teams-retro/.env.local`:
```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/teams-retro?retryWrites=true&w=majority
```
6. Confirm `.env.local` is in `.gitignore` (it should already be — never commit this file)
7. Install Mongoose: `corepack yarn add mongoose`

---

## Epics & User Stories

### Epic 1.1 — Type Definitions + MongoDB Data Layer

**User Story**: As a developer, I want a single source of truth for all TypeScript types and a MongoDB-backed data layer, so that every part of the app reads/writes real shared data the same way.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-1.1.1 | `src/types/index.ts` defines User, FeedbackItem, ActionItem, Sprint types as documented in Team-Retro-Document.md §8 |
| AC-1.1.2 | `src/lib/db.ts` exports a singleton `connectDB()` function; calling it multiple times reuses the existing connection |
| AC-1.1.3 | Mongoose models exist for all 4 types in `src/lib/models/` with schemas matching `src/types/index.ts` |
| AC-1.1.4 | `src/app/api/users/route.ts` handles `GET /api/users` and `POST /api/users` |
| AC-1.1.5 | `src/app/api/sprints/route.ts` handles `GET /api/sprints` and `POST /api/sprints` |
| AC-1.1.6 | `MONGODB_URI` is read from `process.env` only — never hardcoded |
| AC-1.1.7 | `corepack yarn tsc --noEmit` passes with 0 errors |

---

### DEV Session 1 — Types + DB Connection + Models

**Files to write** (target ~260 lines):

| File | Lines (target) | Notes |
|---|---|---|
| `src/types/index.ts` | ~80 | User, FeedbackItem, ActionItem, Sprint, PointEvent (stub), Badge (stub) |
| `src/lib/db.ts` | ~30 | `connectDB()` singleton using mongoose.connect + cached connection |
| `src/lib/models/User.ts` | ~40 | Mongoose schema: id, name, username, pod, isAdmin, createdAt |
| `src/lib/models/Sprint.ts` | ~40 | Mongoose schema: id, name, goal, startDate, endDate, status, teamMemberIds |
| `src/lib/models/FeedbackItem.ts` | ~50 | Mongoose schema: id, sprintId, authorId, content, category, isAnonymous, suggestion, upvotedBy, upvotes |
| `src/lib/models/ActionItem.ts` | ~50 | Mongoose schema: id, sprintId, title, description, ownerId, status, sourceFeedbackId, sourceQuote, dueDate, impactNote |
| **Total** | **~290 lines** | ✅ Fits comfortably in one session |

---

### DEV Session 2 — API Routes + User Service

**Files to write** (target ~310 lines):

| File | Lines (target) | Notes |
|---|---|---|
| `src/app/api/users/route.ts` | ~50 | GET: return all users. POST: create user, set isAdmin=true if first user |
| `src/app/api/sprints/route.ts` | ~50 | GET: return active sprint. POST: create sprint |
| `src/services/userService.ts` | ~60 | registerUser() → POST /api/users; getCurrentUser() → sessionStorage cache; getAllUsers() → GET /api/users |
| `src/app/page.tsx` | ~120 | Registration form, validation, redirect — ported from `docs/prototypes/Registration.tsx` |
| `src/__tests__/userApi.test.ts` | ~60 | API route unit tests: POST creates user, first user is admin, GET returns list |
| **Total** | **~340 lines** | ✅ Fits in one session |

---

### Epic 1.2 — Registration Page

**User Story**: As a new team member, I want to register with my name, username, and pod, so that my identity is saved to the shared database and I can start using the tool.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-1.2.1 | Registration page renders at `/` with fields: Full Name, Username, Pod selector |
| AC-1.2.2 | Pod selector options: Pod 1, Pod 2, Pod 3 |
| AC-1.2.3 | Submit calls `userService.registerUser()` which POSTs to `/api/users` |
| AC-1.2.4 | First user to register receives `isAdmin: true`; all subsequent users receive `isAdmin: false` |
| AC-1.2.5 | After successful registration, user identity is cached in `sessionStorage` and user is redirected to `/dashboard` |
| AC-1.2.6 | If `sessionStorage` already has a user, skip registration and redirect to `/dashboard` |
| AC-UI-1.2.1 | Form matches `docs/ui-mocks/registration.png` — layout, labels, button text |
| AC-UI-1.2.2 | Submit button is disabled until all 3 fields are filled |

---

### Epic 1.3 — Dashboard Page

**User Story**: As a registered team member, I want to see a dashboard with live sprint stats fetched from the database, so that I can quickly understand the team's retro health.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-1.3.1 | Dashboard renders at `/dashboard` |
| AC-1.3.2 | Shows current sprint name and date range (fetched from `GET /api/sprints`) |
| AC-1.3.3 | Shows stat cards: Total Feedback, Open Actions, Completed Actions, Completion Rate % |
| AC-1.3.4 | Completion Rate = `(completed + verified) / total actions * 100` via `actionService.getCompletionRate()` |
| AC-1.3.5 | If no sprint is active, shows the empty state (matches `docs/ui-mocks/dashboard-empty.png`) |
| AC-UI-1.3.1 | Layout matches `docs/ui-mocks/Dashboard.png` — 4 stat cards, sprint info, sidebar |

---

### DEV Session 3 — Action Service + Dashboard

**Files to write** (target ~380 lines):

| File | Lines (target) | Notes |
|---|---|---|
| `src/app/api/actions/route.ts` | ~50 | GET: return actions by sprintId. POST: create action |
| `src/services/actionService.ts` | ~80 | getActions(), getCompletionRate(), getOpenCount(), getCompletedCount() — all via fetch() to API routes |
| `src/app/dashboard/page.tsx` | ~120 | Stat cards, sprint header, empty state — ported from `docs/prototypes/Dashboard.tsx` |
| `src/__tests__/dashboard.test.tsx` | ~60 | Render with mocked API data, render empty state, stat calculation |
| `src/__tests__/registration.test.tsx` | ~70 | Render, form validation, submit calls registerUser, sessionStorage cache, redirect |
| **Total** | **~380 lines** | ✅ Fits in one session |

---

## Sprint 1 Definition of Done

- [ ] All AC-1.x acceptance criteria pass
- [ ] All 18 REVIEWER checklist points pass
- [ ] `corepack yarn build` — 0 errors
- [ ] `corepack yarn test` — 0 failures
- [ ] `MONGODB_URI` in `.env.local`, never in committed code
- [ ] Registration saves user to MongoDB Atlas (verify in Atlas dashboard)
- [ ] Two users registered in different browsers see each other's data
- [ ] Dashboard shows correct live stats from MongoDB
- [ ] Empty state renders when no sprint is active
- [ ] Committed: `git commit -m "Sprint 1 complete: Foundation + MongoDB"`
