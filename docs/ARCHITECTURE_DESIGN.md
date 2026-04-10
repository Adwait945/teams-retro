# Architecture Design — Sprint 1: Foundation

**Mode**: [ARCHITECT]  
**Sprint**: 1 — Types, MongoDB Data Layer, Registration, Dashboard  
**Generated from**: `docs/FEATURE_REQUIREMENTS.md`, `docs/Sprint1.md`, prototype audit, existing codebase audit  
**Date**: April 10, 2026

---

## Table of Contents

1. [Pre-Flight Audit](#pre-flight-audit)
2. [System Overview](#system-overview)
3. [Folder Structure](#folder-structure)
4. [Component Boundaries](#component-boundaries)
5. [Data Flow](#data-flow)
6. [Type System Design](#type-system-design)
7. [MongoDB / Mongoose Layer](#mongodb--mongoose-layer)
8. [API Routes](#api-routes)
9. [Service Layer](#service-layer)
10. [UI Layer](#ui-layer)
11. [Layout Architecture — Shell.tsx](#layout-architecture--shelltsx)
12. [Session & Auth Model](#session--auth-model)
13. [Isolation Constraints](#isolation-constraints)
14. [Breaking Change Register](#breaking-change-register)
15. [Dependency Map Summary](#dependency-map-summary)

---

## Pre-Flight Audit

### Existing Codebase State

| File | Current State | Sprint 1 Action |
|---|---|---|
| `src/types/index.ts` | Has `User`, `FeedbackItem`, `ActionItem`, `Sprint`, `PointEvent`, `Badge` — but fields diverge from backlog schema | **Update** — align all field names to backlog schema |
| `src/app/page.tsx` | Renders the current mock-data dashboard (`useRetro()`) | **Replace** — becomes Registration page |
| `src/app/layout.tsx` | Wraps all pages with `<RetroProvider>` + `<Sidebar>` globally | **Problem flag — see Breaking Change #1** |
| `src/components/sidebar.tsx` | Reads from `useRetro()` (mock store); nav links to `/`, `/feedback`, `/action-items` | **Do not touch** — isolated from Sprint 1 pages |
| `src/store/retro-store.tsx` | `localStorage`-backed mock context provider | **Do not touch** — Sprint 1 pages bypass this store entirely |
| `src/lib/utils.ts` | `cn()` utility only | No change |
| `src/data/mock-data.ts` | Mock seed data | No change |
| `src/app/api/` | Does not exist | **Create** — `users/`, `sprints/`, `actions/` routes |
| `src/lib/db.ts` | Does not exist | **Create** — Mongoose singleton |
| `src/lib/models/` | Does not exist | **Create** — 4 Mongoose model files |
| `src/services/` | Does not exist | **Create** — `userService.ts`, `actionService.ts` |
| `src/components/layout/Shell.tsx` | Does not exist | **Create** — shared layout wrapper for all post-login pages |

### Dependency Gaps (Missing from package.json)

| Package | Reason Needed | Install Command |
|---|---|---|
| `mongoose` | MongoDB ODM for all DB models and connection | `corepack yarn add mongoose` |
| `@types/mongoose` | ~~TypeScript types~~ | **Do NOT install** — Mongoose 9.x ships its own TypeScript definitions. Installing `@types/mongoose` will cause type conflicts and is deprecated. |
| Testing framework | `@jest`, `@testing-library/react` not in `package.json` | Confirm test setup before DEV Session 2 |

### Prototype-to-Backlog Delta (Resolved)

| Delta | Resolution |
|---|---|
| Registration: 2 fields in prototype vs. 3 in backlog | **Backlog wins** — implement Name + Username + Pod |
| `src/types/index.ts`: `isActive: boolean` on Sprint | **Backlog wins** — change to `status: "open" \| "closed"` |
| `FeedbackItem.suggestedImprovement` | **Backlog wins** — rename to `suggestion` |
| `ActionItem.deadline` | **Backlog wins** — rename to `dueDate` |
| `ActionItem.feedbackId` | **Backlog wins** — rename to `sourceFeedbackId` |
| `ActionItem.impactDescription` | **Backlog wins** — rename to `impactNote` |
| Dashboard at root `/` | **Backlog wins** — root `/` becomes Registration; Dashboard at `/dashboard` |
| Sprint MVP banner in prototype | **Out of scope for Sprint 1** — omit entirely |
| `Shell` component missing | **Must create** `src/components/layout/Shell.tsx` |

---

## System Overview

Sprint 1 establishes a **three-tier architecture**: a Next.js 14 App Router frontend, a Next.js API Routes backend, and a MongoDB Atlas database accessed via Mongoose.

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Client)                                           │
│  ┌─────────────────┐   ┌──────────────────────────────────┐│
│  │ /  Registration │   │ /dashboard  Dashboard Page       ││
│  │ (page.tsx)      │   │ (dashboard/page.tsx)             ││
│  │                 │   │                                  ││
│  │  userService    │   │  actionService  userService      ││
│  └────────┬────────┘   └──────────┬───────────────────────┘│
└───────────┼──────────────────────┼─────────────────────────┘
            │ fetch()              │ fetch()
            ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js API Routes (Server — runs in Node.js)             │
│  /api/users    /api/sprints    /api/actions                 │
│  (route.ts)    (route.ts)      (route.ts)                   │
│       │              │               │                      │
│       └──────────────┴───────────────┘                      │
│                      │                                      │
│              connectDB() singleton                          │
│              src/lib/db.ts                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ Mongoose
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  MongoDB Atlas — database: teams-retro                      │
│  collections: users  sprints  feedbackitems  actionitems    │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

The following is the **target** folder structure after Sprint 1 completes. New files are marked `[NEW]`. Modified files are marked `[MOD]`. Untouched files are marked `[—]`.

```
src/
├── app/
│   ├── api/
│   │   ├── users/
│   │   │   └── route.ts           [NEW] GET + POST /api/users
│   │   ├── sprints/
│   │   │   └── route.ts           [NEW] GET + POST /api/sprints
│   │   └── actions/
│   │       └── route.ts           [NEW] GET + POST /api/actions
│   ├── dashboard/
│   │   └── page.tsx               [NEW] Dashboard page at /dashboard
│   ├── globals.css                [—]
│   ├── layout.tsx                 [MOD] Remove global <Sidebar>; remove <RetroProvider> wrap
│   └── page.tsx                   [MOD] Replace with Registration page
│
├── components/
│   ├── layout/
│   │   └── Shell.tsx              [NEW] Sidebar + main content wrapper
│   ├── feedback-card.tsx          [—]
│   ├── feedback-form.tsx          [—]
│   ├── sidebar.tsx                [—] Existing mock sidebar — do not touch
│   └── sprint-selector.tsx        [—]
│
├── lib/
│   ├── db.ts                      [NEW] connectDB() singleton
│   ├── models/
│   │   ├── User.ts                [NEW] Mongoose schema
│   │   ├── Sprint.ts              [NEW] Mongoose schema
│   │   ├── FeedbackItem.ts        [NEW] Mongoose schema
│   │   └── ActionItem.ts          [NEW] Mongoose schema
│   └── utils.ts                   [—]
│
├── services/
│   ├── userService.ts             [NEW] registerUser(), getCurrentUser(), getAllUsers()
│   └── actionService.ts           [NEW] getActions(), getCompletionRate(), getOpenCount(), getCompletedCount()
│
├── store/
│   └── retro-store.tsx            [—] DO NOT TOUCH
│
├── types/
│   └── index.ts                   [MOD] Align field names to backlog schema
│
└── __tests__/
    ├── userApi.test.ts            [NEW] API route tests for /api/users
    ├── registration.test.tsx      [NEW] Registration page render + behavior tests
    └── dashboard.test.tsx         [NEW] Dashboard page render + stat calculation tests
```

---

## Component Boundaries

### Boundary Rules

1. **Sprint 1 new pages** (`page.tsx` at `/`, `dashboard/page.tsx`) must **never** import from `src/store/retro-store.tsx` or call `useRetro()`.
2. **`src/components/layout/Shell.tsx`** is the sole layout boundary for all post-login pages. It owns the sidebar and main content region. Pages render as `children` inside Shell.
3. **`src/components/sidebar.tsx`** (existing) is untouched. It is only referenced by `layout.tsx` — which itself will be modified to no longer inject it globally (see Breaking Change #1).
4. **`src/services/`** files are the only callers of `fetch()` against internal API routes from the client side. Pages do not call `fetch()` directly.
5. **API routes** (`src/app/api/`) are the only callers of `connectDB()` and Mongoose models. Services and pages never import Mongoose directly.

### Component Responsibility Matrix

| Component | Owns | Does NOT Own |
|---|---|---|
| `Shell.tsx` | Sidebar rendering, nav state, user identity card from sessionStorage | API calls, business logic |
| `page.tsx` (Registration) | Form state, validation, redirect on success/cached session | DB calls (delegates to `userService`) |
| `dashboard/page.tsx` | Stat rendering, empty state, sprint header display | DB calls (delegates to `actionService`, `userService`) |
| `userService.ts` | `fetch()` calls to `/api/users`, sessionStorage read/write | UI rendering, Mongoose |
| `actionService.ts` | `fetch()` calls to `/api/actions`, completion rate math | UI rendering, Mongoose |
| `api/users/route.ts` | DB read/write for User collection, isAdmin logic | Client session management |
| `api/sprints/route.ts` | DB read/write for Sprint collection | Client session management |
| `api/actions/route.ts` | DB read/write for ActionItem collection | Completion rate math (belongs in service) |
| `lib/db.ts` | Mongoose connection singleton | Business logic |
| `lib/models/*.ts` | Mongoose schema + model export | TypeScript interfaces (those live in `types/index.ts`) |

---

## Data Flow

### Registration Flow

```
User fills form (/page.tsx)
  → calls userService.registerUser({ name, username, pod })
    → POST /api/users  { name, username, pod }
      → connectDB()
      → User.countDocuments()  →  isAdmin = count === 0
      → new UserModel({ ...body, isAdmin }).save()
      → returns 201 + user document
    ← 201 + { _id, name, username, pod, isAdmin, createdAt }
  ← user object
  → sessionStorage.setItem('retroboard_user', JSON.stringify(user))
  → router.push('/dashboard')
```

### Dashboard Load Flow

```
User lands on /dashboard (dashboard/page.tsx)
  → reads sessionStorage['retroboard_user']
  → if null → router.push('/') (redirect to registration)
  → if present:
      parallel:
        → actionService.getActions(sprintId?)    → GET /api/actions?sprintId=X
        → fetch GET /api/sprints  (find status: "open")
      ← sprint data + action items
  → compute stats client-side:
      totalFeedback  (from sprint's feedback count — or GET /api/feedback in future sprint)
      openActions    = actionService.getOpenCount(actions)
      completedActions = actionService.getCompletedCount(actions)
      completionRate = actionService.getCompletionRate(actions)
  → if no active sprint → render empty state
  → else → render stat cards + recent feedback + activity feed
```

### Session Cache Model

```
sessionStorage key: 'retroboard_user'
value: JSON string of { _id, name, username, pod, isAdmin, createdAt }

Shell.tsx reads this on mount to:
  - display user name + pod in identity card
  - conditionally show nav items (AC-UI-SHELL-8)

Registration page reads this on mount to:
  - skip form and redirect to /dashboard if already cached (AC-1.2.6)
```

---

## Type System Design

### Required Changes to `src/types/index.ts`

The file is a **targeted update** — all existing constants (`POINT_VALUES`, `CATEGORY_CONFIG`, `BADGES`) and stubs (`PointEvent`, `Badge`) are preserved. Only interface fields are modified.

#### `User` Interface (updated)

```typescript
export interface User {
  _id: string           // MongoDB ObjectId as string
  name: string
  username: string      // [NEW] required by AC-1.2.1
  avatar: string        // keep — derived as initials in UI
  pod: string           // [NEW] required by AC-1.2.1
  isAdmin: boolean      // [NEW] required by AC-1.2.4
  totalPoints: number   // keep — used by existing store (not Sprint 1 API)
  badges: Badge[]       // keep — stub shape
  createdAt: string     // [NEW] required by Mongoose model spec
}
```

#### `Sprint` Interface (updated)

```typescript
export interface Sprint {
  _id: string
  name: string
  goal: string          // [NEW] shown in SetUpSprint.png
  startDate: string
  endDate: string
  status: "open" | "closed"   // [MOD] replaces isActive: boolean
  teamMemberIds: string[]     // [NEW] required by DEV Session 1 schema
}
```

#### `FeedbackItem` Interface (updated)

```typescript
export interface FeedbackItem {
  _id: string
  category: FeedbackCategory
  content: string
  suggestion: string          // [MOD] was suggestedImprovement
  authorId: string
  isAnonymous: boolean
  sprintId: string
  upvotedBy: string[]         // [MOD] was upvotes: string[]
  upvotes: number             // [NEW] display count
  createdAt: string
  actionItemId?: string
}
```

#### `ActionItem` Interface (updated)

```typescript
export interface ActionItem {
  _id: string
  title: string
  description: string
  ownerId: string
  sourceFeedbackId: string    // [MOD] was feedbackId
  sourceQuote: string         // [NEW] shown in ActionItems.png
  sprintId: string
  status: "open" | "in-progress" | "completed" | "verified"
  dueDate: string             // [MOD] was deadline
  createdAt: string
  completedAt?: string
  impactNote?: string         // [MOD] was impactDescription
}
```

#### `PointEvent` and `Badge` — No change (keep as stubs)

> **Note**: The `retro-store.tsx` uses the old field names (`suggestedImprovement`, `deadline`, `feedbackId`, `impactDescription`, `isActive`, `upvotes: string[]`). Because `retro-store.tsx` is isolated and not touched in Sprint 1, this **will cause TypeScript errors** at the store level. Mitigation strategy: add `// @ts-ignore` comments to the specific lines in `retro-store.tsx` that reference renamed fields. Do not modify store logic. See Breaking Change #2.

---

## MongoDB / Mongoose Layer

### Connection Singleton — `src/lib/db.ts`

Pattern: cached global connection to prevent multiple Mongoose connections in Next.js hot-reload / serverless environments.

```
Global cache: global.mongoose = { conn, promise }

connectDB():
  if cached conn exists → return cached conn
  if promise pending → await existing promise
  else → mongoose.connect(process.env.MONGODB_URI) → cache + return
```

- `MONGODB_URI` read exclusively from `process.env` — never hardcoded
- TypeScript global augmentation for `global.mongoose` type safety

### Model File Pattern

Each model file in `src/lib/models/` follows this structure:

```
import mongoose from 'mongoose'
import { TypeName } from '@/types'    // for field reference only

const Schema = new mongoose.Schema({ ... }, { timestamps: false })
export default mongoose.models.TypeName || mongoose.model<TypeName>('TypeName', Schema)
```

The `mongoose.models.TypeName ||` guard prevents "Cannot overwrite model once compiled" errors in Next.js hot reload.

### Schema Specifications

#### `User.ts`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | Yes | |
| `username` | String | Yes | |
| `pod` | String | Yes | |
| `isAdmin` | Boolean | Yes | Default: false |
| `avatar` | String | No | Derived from initials in UI |
| `totalPoints` | Number | No | Default: 0 |
| `createdAt` | Date | Yes | Default: Date.now |

#### `Sprint.ts`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | Yes | |
| `goal` | String | No | |
| `startDate` | Date | Yes | |
| `endDate` | Date | Yes | |
| `status` | String | Yes | Enum: `["open", "closed"]` |
| `teamMemberIds` | [String] | No | Default: [] |

#### `FeedbackItem.ts`

| Field | Type | Required | Notes |
|---|---|---|---|
| `sprintId` | String | Yes | |
| `authorId` | String | Yes | |
| `content` | String | Yes | |
| `category` | String | Yes | Enum: `["slowed-us-down", "should-try", "went-well"]` |
| `isAnonymous` | Boolean | Yes | Default: false |
| `suggestion` | String | No | |
| `upvotedBy` | [String] | No | Default: [] |
| `upvotes` | Number | No | Default: 0 |
| `createdAt` | Date | Yes | Default: Date.now |

#### `ActionItem.ts`

| Field | Type | Required | Notes |
|---|---|---|---|
| `sprintId` | String | Yes | |
| `title` | String | Yes | |
| `description` | String | No | |
| `ownerId` | String | Yes | |
| `status` | String | Yes | Enum: `["open", "in-progress", "completed", "verified"]` |
| `sourceFeedbackId` | String | No | |
| `sourceQuote` | String | No | |
| `dueDate` | Date | No | |
| `impactNote` | String | No | |
| `createdAt` | Date | Yes | Default: Date.now |
| `completedAt` | Date | No | |

---

## API Routes

### Route Design Principles

- All routes are Next.js App Router `route.ts` files using `NextRequest` / `NextResponse`
- Every handler calls `await connectDB()` as the first operation
- Validation: missing required fields return HTTP 400 with `{ error: "message" }`
- No authentication middleware in Sprint 1 — auth is future scope

### `GET /api/users`

Returns all users as a JSON array. HTTP 200.

### `POST /api/users`

Body: `{ name, username, pod }`  
Logic: `count = await User.countDocuments()` → `isAdmin = count === 0`  
Returns: HTTP 201 + created document.  
Error: HTTP 400 if name/username/pod missing.

### `GET /api/sprints`

Returns the active sprint (`status: "open"`) or empty array `[]`. HTTP 200.

### `POST /api/sprints`

Body: `{ name, goal, startDate, endDate, teamMemberIds? }`  
Returns: HTTP 201 + created document.

### `GET /api/actions`

Query param: `?sprintId=X` (optional)  
Returns: all action items for sprint (or all if no sprintId). HTTP 200.

### `POST /api/actions`

Body: `{ sprintId, title, ownerId, status, sourceFeedbackId?, dueDate?, ... }`  
Returns: HTTP 201 + created document.

---

## Service Layer

### `src/services/userService.ts`

Client-side only. No Mongoose imports.

```
STORAGE_KEY = 'retroboard_user'

registerUser(data: { name, username, pod }): Promise<User>
  → POST /api/users
  → on 201: return user object

getCurrentUser(): User | null
  → JSON.parse(sessionStorage.getItem(STORAGE_KEY))

getAllUsers(): Promise<User[]>
  → GET /api/users
  → return array
```

### `src/services/actionService.ts`

Client-side only. No Mongoose imports.

```
getActions(sprintId?: string): Promise<ActionItem[]>
  → GET /api/actions?sprintId=sprintId

getCompletionRate(actions: ActionItem[]): number
  → completed = actions.filter(s === "completed" || s === "verified").length
  → total = actions.length
  → total === 0 → return 0
  → return Math.round((completed / total) * 100)

getOpenCount(actions: ActionItem[]): number
  → actions.filter(s === "open" || s === "in-progress").length

getCompletedCount(actions: ActionItem[]): number
  → actions.filter(s === "completed" || s === "verified").length
```

---

## UI Layer

### Registration Page — `src/app/page.tsx`

- **Route**: `/`
- **"use client"** directive required (form state + sessionStorage + router)
- On mount: check `sessionStorage['retroboard_user']` → redirect to `/dashboard` if present
- Form fields: Full Name (text input), Username (text input), Pod (shadcn `Select`)
- Submit button disabled until all 3 fields are non-empty
- On submit: calls `userService.registerUser()` → on success: write to sessionStorage → `router.push('/dashboard')`
- Inline error: if duplicate name detected (future — API returns 409 or similar), show destructive border + `text-destructive` message below name field
- **Does not use `useRetro()`** — no store dependency
- CSS framework: Tailwind utility classes only, shadcn/ui components (`Card`, `Input`, `Label`, `Select`, `Button`)

### Dashboard Page — `src/app/dashboard/page.tsx`

- **Route**: `/dashboard`
- **"use client"** directive required (hooks, sessionStorage)
- Wraps content in `<Shell>` component
- On mount: guard — if no `sessionStorage['retroboard_user']`, redirect to `/`
- Data fetch: parallel `GET /api/sprints` + `actionService.getActions(sprintId)` via `useEffect`
- Active sprint: first entry with `status: "open"`; if none → render empty state
- Stat cards (4): Feedback Count, Total Upvotes, Action Items, Completion Rate
- Empty state: dashed-border card with "No sprint data yet." heading + "Set Up Sprint →" button → `/sprint-setup`
- **Does not use `useRetro()`** — no store dependency
- Sprint MVP banner: **omitted** (out of scope Sprint 1)

---

## Layout Architecture — Shell.tsx

### Location

`src/components/layout/Shell.tsx`

### Purpose

`Shell` is the **shared layout wrapper** for all post-registration pages: Dashboard, Feedback Board, Action Items, Sprint Setup. It renders the sidebar (per the prototype spec) and a main content `<main>` region. Pages pass their content as `children`.

### Props Interface

```typescript
interface ShellProps {
  children: React.ReactNode
}
```

### Internal Structure

```
<div className="flex h-screen overflow-hidden bg-background">
  <aside>  ← Sidebar (w-[240px], h-screen, border-r)
    Logo block (Hexagon icon + "RetroBoard")
    Sprint label (text-xs, muted, uppercase)
    Nav items (Sprint Setup, Dashboard, Feedback Board, Action Items)
    User identity card (bottom, border-t)
  </aside>
  <main className="flex-1 overflow-y-auto p-6">
    {children}
  </main>
</div>
```

### Sidebar Nav Items (order per AC-UI-SHELL-4)

| Order | Label | Icon | Route |
|---|---|---|---|
| 1 | Sprint Setup | `Settings` | `/sprint-setup` |
| 2 | Dashboard | `LayoutDashboard` | `/dashboard` |
| 3 | Feedback Board | `MessageSquare` | `/feedback` |
| 4 | Action Items | `CheckSquare` | `/action-items` |

### Active Nav State Detection

Uses `usePathname()` from `next/navigation`. Active item gets `bg-secondary text-primary-foreground` + left accent bar `w-1 h-5 bg-primary rounded-r-full`.

### User Identity Card

Reads `sessionStorage['retroboard_user']` on mount. Shows initials avatar, full name, pod label. Only rendered if user object is present (AC-UI-SHELL-8).

### Sprint Label

Shell receives sprint data from its parent page via prop, or fetches it independently. For Sprint 1, the dashboard page passes the active sprint name as a prop.  
**Revised approach**: Shell accepts an optional `sprintName?: string` prop. If not provided, it renders the label as empty/placeholder. This keeps Shell self-contained without requiring its own fetch.

### Shell vs. existing `src/components/sidebar.tsx`

| | `src/components/sidebar.tsx` | `src/components/layout/Shell.tsx` |
|---|---|---|
| Data source | `useRetro()` mock store | `sessionStorage` |
| Nav items | Dashboard, Feedback, Action Items, Leaderboard, Sprint Digest | Sprint Setup, Dashboard, Feedback Board, Action Items |
| Used by | `src/app/layout.tsx` (global) | Each Sprint 1+ page explicitly |
| Sprint 1 action | Do not touch | Create new |

---

## Session & Auth Model

Sprint 1 uses **browser sessionStorage** as a lightweight identity cache. There is no JWT, no cookie-based auth, and no NextAuth in Sprint 1.

```
Key:   retroboard_user
Value: JSON string — { _id, name, username, pod, isAdmin, createdAt }
Scope: Tab session — cleared on browser close
```

**Guard pattern** (used on every post-registration page):
```typescript
useEffect(() => {
  const user = userService.getCurrentUser()
  if (!user) router.push('/')
}, [])
```

This is a client-side guard only. Server-side protection is out of scope for Sprint 1.

---

## Isolation Constraints

The following are **hard boundaries** — DEV sessions must not cross them:

| Constraint | Rule |
|---|---|
| `src/store/retro-store.tsx` | **Do not modify**. Sprint 1 pages never import from this file. |
| `src/data/mock-data.ts` | **Do not modify**. Mock data used only by existing pages. |
| `src/components/sidebar.tsx` | **Do not modify**. Used by `layout.tsx` for existing mock pages. |
| `src/app/layout.tsx` | **Must modify** (see Breaking Change #1) — but only the minimum required change. |
| `src/app/feedback/`, `src/app/action-items/`, `src/app/leaderboard/`, `src/app/digest/` | **Do not touch**. These existing pages continue to use the mock store and old layout. |
| `process.env.MONGODB_URI` | Never hardcode. No `mongodb+srv://` string in any committed file. |

---

## Breaking Change Register

### Breaking Change #1 — `src/app/layout.tsx` global sidebar conflict

**Problem**: The current `layout.tsx` injects `<Sidebar />` (the mock store sidebar) globally for every route. If left unchanged, the Registration page at `/` will render with the old sidebar. The new `Shell.tsx` also includes its own sidebar, meaning Dashboard will render two sidebars.

**Proposed Resolution**: Modify `layout.tsx` to remove the global `<Sidebar>` and the wrapping `<div className="flex h-screen overflow-hidden">`. The `<RetroProvider>` wrapper can remain for now (it does not conflict with Sprint 1 pages that ignore it). Each post-login page uses `<Shell>` directly.

**Impact**: Existing pages (`/feedback`, `/action-items`, `/leaderboard`, `/digest`) will lose their sidebar. This is an **accepted regression** in Sprint 1, as those pages are not in scope. They will be re-wrapped with `<Shell>` in future sprints.

**Minimum change**: Remove `<Sidebar />` import + JSX and the outer `<div className="flex h-screen overflow-hidden">` from `layout.tsx`. Keep `<RetroProvider>` and `<main>` wrapper intact.

### Breaking Change #2 — `src/types/index.ts` field renames and `retro-store.tsx`

**Problem**: `retro-store.tsx` references old field names: `suggestedImprovement`, `deadline`, `feedbackId`, `impactDescription`, `isActive`, `upvotes: string[]`. After updating `types/index.ts`, TypeScript will report errors in the store file.

**Proposed Resolution**: Add a `// @ts-nocheck` or targeted `// @ts-ignore` comments to `retro-store.tsx` for the affected lines, with a `// TODO Sprint 2: migrate store to API-backed` comment. This satisfies `tsc --noEmit` (AC-1.1.7) without modifying store logic.

**Alternative**: Keep old field names as deprecated optional fields alongside new names on the interfaces (union approach). This is more verbose but avoids suppressing TS errors. **Preferred approach**: `// @ts-ignore` on specific lines in the store — minimal footprint.

---

## Dependency Map Summary

```
src/app/page.tsx (Registration)
  └── src/services/userService.ts
        └── fetch → /api/users
              └── src/lib/db.ts
                    └── MongoDB Atlas
              └── src/lib/models/User.ts
        └── sessionStorage

src/app/dashboard/page.tsx (Dashboard)
  └── src/components/layout/Shell.tsx
  └── src/services/actionService.ts
        └── fetch → /api/actions
              └── src/lib/db.ts
              └── src/lib/models/ActionItem.ts
  └── fetch → /api/sprints
        └── src/lib/db.ts
        └── src/lib/models/Sprint.ts
  └── sessionStorage (via userService.getCurrentUser())

src/types/index.ts
  └── consumed by all models, services, pages, and tests

src/components/layout/Shell.tsx
  └── sessionStorage (user identity card)
  └── next/navigation usePathname (active nav)
  └── consumed by: dashboard/page.tsx (Sprint 1), future pages

ISOLATED (do not touch):
  src/store/retro-store.tsx
  src/components/sidebar.tsx
  src/app/feedback/
  src/app/action-items/
  src/app/leaderboard/
  src/app/digest/
```
