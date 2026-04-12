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

---

## Sprint 2: Feedback Board

**Mode**: [ARCHITECT]  
**Sprint**: 2 — Feedback Board Layout, Submit Feedback, Upvote, Reframe Rule  
**References**: `retro-product/docs/FEATURE_REQUIREMENTS.md` (Sprint 2), `retro-dev/docs/prototypes/FeedbackBoard.tsx`  
**Extends**: Sprint 1 design above — all Sprint 1 files remain unchanged unless explicitly noted  
**Date**: April 11, 2026

---

### Pre-Flight Audit (Sprint 2)

#### Existing Code State at Sprint 2 Start

| File | State | Sprint 2 Action |
|---|---|---|
| `src/types/index.ts` | `FeedbackItem` uses `suggestion: string`, `upvotes: number`, `upvotedBy: string[]` — **not** `suggestedImprovement` | **Do not rename** — all Sprint 2 code uses `suggestion` as the field name |
| `src/lib/models/FeedbackItem.ts` | Mongoose schema uses `suggestion` field (matches `types/index.ts`) | **Read-only** — consumed by new API route; no changes |
| `src/lib/db.ts` | `connectDB()` singleton — fully operational | **Consumed** by new feedback API routes |
| `src/app/api/sprints/route.ts` | `GET /api/sprints` returns active sprint | **Consumed** by `feedbackService` to resolve `sprintId` |
| `src/components/layout/Shell.tsx` | `Shell` wraps pages with sidebar; reads `sessionStorage['retroboard_user']`; `usePathname()` drives active nav | **Do not modify** — consumed as-is by `/feedback` page |
| `src/app/feedback/` | Directory exists (old mock page) | **Replace** `page.tsx` — new implementation |
| `src/app/api/feedback/` | Does not exist | **Create** — `route.ts` + `[id]/upvote/route.ts` |
| `src/services/feedbackService.ts` | Does not exist | **Create** |
| `src/components/FeedbackCard.tsx` | Does not exist | **Create** |
| `src/components/FeedbackColumn.tsx` | Does not exist | **Create** |
| `src/components/SubmitFeedbackModal.tsx` | Does not exist | **Create** |

#### Critical Field-Name Resolution

The Sprint 2 `FEATURE_REQUIREMENTS.md` (§Type Alignment Note) states `suggestedImprovement` takes precedence. However, the **actual implemented** `src/types/index.ts` and `src/lib/models/FeedbackItem.ts` in `retro-dev` both use `suggestion`. **The live code wins.** All Sprint 2 files must use `suggestion` as the field name throughout — API request bodies, service payloads, component props, and test assertions. No rename is performed.

| FEATURE_REQUIREMENTS.md says | Actual `src/types/index.ts` | Resolution |
|---|---|---|
| `suggestedImprovement` | `suggestion: string` | Use `suggestion` — live code wins |
| `upvotes: string[]` (array of IDs) | `upvotes: number`, `upvotedBy: string[]` | Use `upvotes: number` for display, `upvotedBy` for dedup guard |

#### Prototype-to-Backlog Delta (Sprint 2 Resolved)

| Delta | Resolution |
|---|---|
| CTA button label: "Submit Feedback" (prototype/mock) vs "+ Add Feedback" (backlog) | **Mock wins** — implement as "Submit Feedback" with `Plus` icon |
| Suggestion field always visible in prototype | **Backlog + mock win** — conditional: visible only when `category === "slowed-us-down"` |
| "Convert to Action Item" button visible in prototype | **Out of scope Sprint 2** — omit entirely |
| Radio values in prototype (`"slowed"`, `"try"`, `"well"`) | **Backlog wins** — use exact `FeedbackCategory` string values: `"slowed-us-down"`, `"should-try"`, `"went-well"` |

---

### New Files — Sprint 2

| File | Action | Epic |
|---|---|---|
| `src/app/api/feedback/route.ts` | **Create** — `GET /api/feedback?sprintId=X&category=Y`, `POST /api/feedback` with Reframe Rule 422 guard | 2.1 |
| `src/app/api/feedback/[id]/upvote/route.ts` | **Create** — `PATCH`: 403 self-vote, 409 duplicate, increment `upvotes` + push to `upvotedBy` | 2.2 |
| `src/services/feedbackService.ts` | **Create** — `getFeedback()`, `getFeedbackByLane()`, `sortByUpvotes()`, `getAuthorDisplay()`, then extended with `addFeedback()`, `upvoteFeedback()` | 2.1 + 2.2 |
| `src/components/FeedbackCard.tsx` | **Create** — `FeedbackItem` card with content, `suggestion` block, named/anonymous author, upvote button | 2.1 |
| `src/components/FeedbackColumn.tsx` | **Create** — lane wrapper: colored header, count badge, scrollable card list, per-lane empty state | 2.1 |
| `src/app/feedback/page.tsx` | **Replace** — 3-column board, data fetch, `SubmitFeedbackModal` integration, session guard | 2.1 + 2.2 |
| `src/components/SubmitFeedbackModal.tsx` | **Create** — `Dialog`, lane `RadioGroup`, content `Textarea`, anonymous `Checkbox`, conditional suggestion field + Reframe Rule badge | 2.2 |
| `src/__tests__/feedbackService.test.ts` | **Create** — service unit tests + API route mock tests | 2.1 |
| `src/__tests__/feedbackBoard.test.tsx` | **Create** — page render, modal, Reframe Rule, upvote guards | 2.2 |

#### Sprint 1 Files Consumed (Read-Only)

| File | How Consumed |
|---|---|
| `src/lib/db.ts` | `connectDB()` called in both feedback API route handlers |
| `src/lib/models/FeedbackItem.ts` | Queried in `GET /api/feedback`; created in `POST /api/feedback`; updated in `PATCH upvote` |
| `src/app/api/sprints/route.ts` | `feedbackService.getFeedback()` fetches active sprint to resolve `sprintId` |
| `src/components/layout/Shell.tsx` | Wraps `src/app/feedback/page.tsx` as `<Shell sprintName={...}>` |
| `src/types/index.ts` | `FeedbackItem`, `FeedbackCategory`, `CATEGORY_CONFIG` consumed by all Sprint 2 components and services |
| `src/services/userService.ts` | `getCurrentUser()` used by feedback page for session guard |

---

### Component Boundaries (Sprint 2)

| Component | Owns | Does NOT Own |
|---|---|---|
| `src/app/feedback/page.tsx` | Session guard, open-sprint fetch, `showModal` boolean state, re-fetch trigger after submit | API calls (delegates to `feedbackService`), card rendering |
| `FeedbackColumn.tsx` | Single-lane layout, header strip, empty state, sorted card list | Fetch logic, upvote dispatch |
| `FeedbackCard.tsx` | Card UI: content, `suggestion` block, author display, upvote button + count | Upvote HTTP call (delegates via `onUpvote` prop callback to parent page) |
| `SubmitFeedbackModal.tsx` | Form state: `category`, `content`, `suggestion`, `isAnonymous`; Reframe Rule disable logic; `onSubmit` callback invocation | Direct API calls (parent provides `onSubmit` handler that calls `feedbackService.addFeedback`) |
| `feedbackService.ts` | All `fetch()` calls to feedback API; `sortByUpvotes()`; `getAuthorDisplay()`; Reframe Rule throw guard in `addFeedback()` | UI rendering, Mongoose imports |
| `api/feedback/route.ts` | `GET` (filter by sprintId + category), `POST` (create + Reframe Rule 422), `connectDB()` | Business-logic computations |
| `api/feedback/[id]/upvote/route.ts` | `PATCH` upvote; 403 self-vote guard; 409 duplicate guard; DB update | Client session management |

---

### Data Flow (Sprint 2)

#### Feedback Board Load Flow

```
User lands on /feedback (feedback/page.tsx)
  → useEffect on mount:
      1. userService.getCurrentUser() → null → router.push('/') [guard]
      2. feedbackService.getFeedback() → GET /api/sprints → resolve active sprintId
      3. For each lane (parallel or sequential):
           feedbackService.getFeedbackByLane(sprintId, category)
             → GET /api/feedback?sprintId=X&category=Y
               → connectDB()
               → FeedbackItem.find({ sprintId, category }).lean()
               → return array
           feedbackService.sortByUpvotes(items) → sorted array
      4. Set state: { slowedDown[], shouldTry[], wentWell[] }
  → Render: <Shell> → 3x <FeedbackColumn> → <FeedbackCard>[] per lane
```

#### Submit Feedback Flow

```
User clicks "Submit Feedback" button
  → setShowModal(true)
  → <SubmitFeedbackModal open={true}> renders

User fills form:
  category (RadioGroup) — FeedbackCategory string value
  content (Textarea)
  suggestion (Textarea) — required if category === "slowed-us-down"
  isAnonymous (Checkbox)

User clicks "Submit Feedback" in modal:
  → [CLIENT GUARD 1] SubmitFeedbackModal submit button disabled if:
      category === "slowed-us-down" && suggestion.trim() === ""
  → parent onSubmit handler called with { category, content, suggestion, isAnonymous, sprintId }
  → [CLIENT GUARD 2] feedbackService.addFeedback():
      if category === "slowed-us-down" && !suggestion.trim()
        → throw Error("Reframe Rule: suggestion is required for slowed-us-down feedback")
        → fetch() is NOT called
      else → POST /api/feedback { category, content, suggestion, isAnonymous, sprintId, authorId }
        → [SERVER GUARD] POST handler:
            if category === "slowed-us-down" && !body.suggestion?.trim()
              → return 422 { error: "Reframe Rule: suggestion is required for slowed-us-down feedback" }
            else → new FeedbackItem({ ...body }).save() → return 201
  → on 201: setShowModal(false); re-fetch all lanes
```

#### Upvote Flow

```
User clicks upvote button on FeedbackCard
  → onUpvote(item._id) callback fires on page
  → feedbackService.upvoteFeedback(itemId, currentUser._id)
      → PATCH /api/feedback/{id}/upvote  { userId: currentUser._id }
        → connectDB()
        → item = FeedbackItem.findById(id)
        → [SERVER GUARD 1] if item.authorId === userId → return 403 { error: "Cannot upvote own feedback" }
        → [SERVER GUARD 2] if item.upvotedBy.includes(userId) → return 409 { error: "Already upvoted" }
        → item.upvotedBy.push(userId)
        → item.upvotes += 1
        → item.save()
        → return 200 { upvotes: item.upvotes }
  → on 200: re-fetch all lanes (count reflects MongoDB value, not local increment)
  → on 403/409: handle gracefully — count does NOT increment; show no error or silent no-op
```

---

### Reframe Rule — Enforcement Architecture

The Reframe Rule is a first-class business rule enforced at **three layers**:

| Layer | Mechanism | When Triggered |
|---|---|---|
| **Client — UI** | Submit button `disabled` when `category === "slowed-us-down" && suggestion.trim() === ""` | Prevents form submission before any network call |
| **Client — Service** | `feedbackService.addFeedback()` throws if Reframe Rule violated; `fetch()` is never called | Second line of defense; testable in isolation without rendering |
| **Server — API** | `POST /api/feedback` returns HTTP 422 if `category === "slowed-us-down"` and `suggestion` is absent or empty | Final authoritative guard; protects direct API calls bypassing the client |

**Reframe Rule does NOT apply to**: `"should-try"` and `"went-well"` categories. A `POST` with `suggestion: ""` for these categories returns 201.

---

### API Route Specifications (Sprint 2)

#### `GET /api/feedback`

Query params: `sprintId` (optional), `category` (optional — must be valid `FeedbackCategory` if provided)  
Logic: `FeedbackItem.find(query).lean()` where query is built from provided params  
Returns: HTTP 200 + JSON array (empty array if no results)

#### `POST /api/feedback`

Body: `{ category, content, suggestion?, isAnonymous, sprintId, authorId }`  
Required: `category`, `content`, `sprintId`, `authorId`  
Reframe Rule: if `category === "slowed-us-down"` and `!suggestion?.trim()` → **HTTP 422** `{ error: "Reframe Rule: suggestion is required for slowed-us-down feedback" }`  
Success: HTTP 201 + created document

#### `PATCH /api/feedback/[id]/upvote`

Body: `{ userId }`  
Required: `userId`  
Guards (in order):
1. `item.authorId === userId` → **HTTP 403** `{ error: "Cannot upvote own feedback" }`
2. `item.upvotedBy.includes(userId)` → **HTTP 409** `{ error: "Already upvoted" }`
3. Valid: push `userId` to `upvotedBy`, increment `upvotes`, save → **HTTP 200** `{ upvotes: item.upvotes }`
4. Item not found → **HTTP 404**

---

### Service Layer (Sprint 2)

#### `src/services/feedbackService.ts`

All functions are client-side only. No Mongoose imports.

```
getFeedback(sprintId?: string): Promise<FeedbackItem[]>
  → resolves active sprintId if not provided (GET /api/sprints)
  → GET /api/feedback?sprintId=X
  → returns array

getFeedbackByLane(sprintId: string, category: FeedbackCategory): Promise<FeedbackItem[]>
  → GET /api/feedback?sprintId=X&category=Y
  → returns array for that lane

sortByUpvotes(items: FeedbackItem[]): FeedbackItem[]
  → returns new array sorted by item.upvotes descending (does not mutate)

getAuthorDisplay(item: FeedbackItem, authorName?: string): string
  → if item.isAnonymous === true → return "Anonymous"
  → else → return authorName ?? "Unknown"

addFeedback(payload: { category, content, suggestion, isAnonymous, sprintId }): Promise<FeedbackItem>
  → [Reframe Rule Guard] if category === "slowed-us-down" && !suggestion.trim()
      throw new Error("Reframe Rule: suggestion is required for slowed-us-down feedback")
  → POST /api/feedback { ...payload, authorId: currentUser._id }
  → on 201 → return created FeedbackItem
  → on 422 → throw error from response body

upvoteFeedback(itemId: string, userId: string): Promise<{ upvotes: number }>
  → PATCH /api/feedback/{itemId}/upvote { userId }
  → on 200 → return { upvotes }
  → on 403 → throw Error("Cannot upvote own feedback")
  → on 409 → throw Error("Already upvoted")
```

---

### UI Layer (Sprint 2)

#### `src/app/feedback/page.tsx`

- `"use client"` directive
- Session guard on mount: `userService.getCurrentUser()` → null → `router.push('/')`
- Fetches active sprint from `GET /api/sprints` to get `sprintId`
- Fetches all 3 lanes via `feedbackService.getFeedbackByLane()` (can be parallel with `Promise.all`)
- State: `slowedDown: FeedbackItem[]`, `shouldTry: FeedbackItem[]`, `wentWell: FeedbackItem[]`, `showModal: boolean`, `sprint: Sprint | null`
- `refetch()` function that re-fetches all 3 lanes — called after successful submit or upvote
- Wraps content in `<Shell sprintName={sprint?.name}>`
- **Does not import** from `retro-store.tsx`

#### `src/components/FeedbackColumn.tsx`

Props:
```typescript
interface FeedbackColumnProps {
  category: FeedbackCategory
  items: FeedbackItem[]
  onUpvote: (itemId: string) => void
  currentUserId: string
}
```

- Header: colored title, glow dot, count badge (always shows `items.length`, shows `0` in empty state)
- Card list: `items` sorted by `upvotes` descending via `feedbackService.sortByUpvotes()`
- Empty state: per-lane placeholder text (per AC-UI-2.1.19/20) when `items.length === 0`
- Column color mapping: `"slowed-us-down"` → red, `"should-try"` → blue, `"went-well"` → emerald

#### `src/components/FeedbackCard.tsx`

Props:
```typescript
interface FeedbackCardProps {
  item: FeedbackItem
  authorName: string   // resolved from parent; "Anonymous" if isAnonymous
  onUpvote: () => void
}
```

- Content `<p>` element
- Conditional `suggestion` block: rendered only when `item.suggestion` is truthy (label "SUGGESTED IMPROVEMENT" + quoted text)
- Author display: avatar circle with initial (named) or `User` icon at `opacity-50` (anonymous) + name text
- Upvote button: `ThumbsUp` icon + `item.upvotes` count
- **No** "Convert to Action Item" button (out of scope Sprint 2)

#### `src/components/SubmitFeedbackModal.tsx`

Props:
```typescript
interface SubmitFeedbackModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { category: FeedbackCategory; content: string; suggestion: string; isAnonymous: boolean }) => Promise<void>
  sprintId: string
}
```

- Internal state: `category: FeedbackCategory` (default `"went-well"`), `content: string`, `suggestion: string`, `isAnonymous: boolean`, `isSubmitting: boolean`
- Suggestion field + Reframe Rule badge: rendered only when `category === "slowed-us-down"`
- Submit button disabled when:
  - `content.trim() === ""`  **OR**
  - `(category === "slowed-us-down" && suggestion.trim() === "")`  **OR**
  - `isSubmitting === true`
- Radio `value` attributes: `"slowed-us-down"`, `"should-try"`, `"went-well"` (exact `FeedbackCategory` strings)
- On submit: call `onSubmit(payload)` → await → `onClose()` on success

---

### Global UI Infrastructure — Dark Mode Confirmation

`src/app/layout.tsx` carries `className="dark"` on the `<html>` element (established in Sprint 1). This dark theme propagates automatically to all pages including `/feedback`. The Feedback Board's dark card styles (`text-slate-200`, `bg-secondary/20`, `bg-slate-700`, etc.) depend on this global dark class being present. **No changes to `layout.tsx` are required for Sprint 2.**

---

### Isolation Constraints (Sprint 2)

| Constraint | Rule |
|---|---|
| `src/store/retro-store.tsx` | Never imported by any Sprint 2 file |
| `src/components/sidebar.tsx` | Never touched |
| `src/components/layout/Shell.tsx` | **Never modified** — consumed as-is |
| `src/lib/models/FeedbackItem.ts` | **Never modified** — consumed by API routes only |
| `src/types/index.ts` | **Never modified** — field name `suggestion` used as-is |
| Field name `suggestion` | All Sprint 2 code uses `suggestion` — never `suggestedImprovement` |
| Upvote count source | After any upvote, count is always re-fetched from MongoDB — never incremented locally in React state |
| "Convert to Action Item" | Omitted entirely — not in scope until Sprint 3 |

---

---

# Architecture Design — Sprint 3: Action Items

**Mode**: [ARCHITECT]  
**Sprint**: 3 — Action Items: Create, Lifecycle, Convert from Feedback, Verify Impact  
**Date**: April 2026  
**Rule**: Sprint 1 and Sprint 2 sections above are read-only. Append only.

---

## Pre-Flight Audit (Sprint 3)

### Sprint 2 Files Consumed (Read-Only in Sprint 3)

| File | State After Sprint 2 | Sprint 3 Usage |
|---|---|---|
| `src/services/feedbackService.ts` | 6 exports: `getFeedback`, `getFeedbackByLane`, `sortByUpvotes`, `getAuthorDisplay`, `addFeedback`, `upvoteFeedback` | **Read-only** — `feedbackService` is not modified in Sprint 3 |
| `src/components/FeedbackCard.tsx` | Has `onUpvote: () => void` prop, `data-testid="upvote-btn"` | **Modified** — add optional `onConvert?: (item: FeedbackItem) => void` prop + conditional "Convert to Action" button |
| `src/components/FeedbackColumn.tsx` | Has `onUpvote: (itemId: string) => void` prop | **Modified** — add optional `onConvert?: (item: FeedbackItem) => void` prop; forward to `FeedbackCard` |
| `src/app/feedback/page.tsx` | Fully wired with `SubmitFeedbackModal`, `handleUpvote`, `refetch` | **Modified** — add `showConvertModal`, `convertTarget`, `handleConvert`, wire `<ConvertActionModal>` |
| `src/app/api/feedback/route.ts` | GET + POST implemented | **Read-only** |
| `src/app/api/feedback/[id]/upvote/route.ts` | PATCH upvote implemented | **Read-only** |
| `src/components/SubmitFeedbackModal.tsx` | Plain HTML modal, `data-testid="submit-feedback-modal"` | **Read-only** |
| `src/components/FeedbackColumn.tsx` | Complete | **Modified** (onConvert prop only) |

### Sprint 1 Files Consumed (Read-Only in Sprint 3)

| File | Sprint 3 Usage |
|---|---|
| `src/lib/db.ts` | `connectDB()` called in all 3 new API route handlers |
| `src/lib/models/ActionItem.ts` | Primary Mongoose model — all Sprint 3 CRUD; already has `status` enum, `sourceFeedbackId`, `sourceQuote`, `impactNote`, `completedAt` |
| `src/lib/models/User.ts` | `User.find({}, { name: 1, _id: 1 }).lean()` — owner dropdown population |
| `src/services/userService.ts` | `getCurrentUser()` — session guard in `actions/page.tsx` |
| `src/app/api/users/route.ts` | `GET /api/users` — consumed by owner dropdowns in both modals |
| `src/app/api/sprints/route.ts` | Sprint resolution on mount (same pattern as `feedback/page.tsx`) |
| `src/components/layout/Shell.tsx` | Wraps `actions/page.tsx`; `sprintName` prop |
| `src/types/index.ts` | `ActionItem`, `User`, `Sprint` consumed by all Sprint 3 files; **no modifications** |

### New Files Created in Sprint 3

| File | Action | Epic |
|---|---|---|
| `src/app/api/actions/route.ts` | **Create** — `GET /api/actions?sprintId=X`, `POST /api/actions` | 3.1 |
| `src/app/api/actions/[id]/advance/route.ts` | **Create** — `PATCH` advance status one step | 3.2 |
| `src/app/api/actions/[id]/verify/route.ts` | **Create** — `PATCH` set verified + impactNote | 3.2 |
| `src/services/actionService.ts` | **Create** — 6 exported functions | 3.1 + 3.2 |
| `src/components/ActionItemCard.tsx` | **Create** — card UI with all states | 3.1 + 3.2 |
| `src/components/NewActionItemModal.tsx` | **Create** — plain HTML modal for direct create | 3.1 |
| `src/components/ConvertActionModal.tsx` | **Create** — plain HTML modal, pre-filled from FeedbackItem | 3.2 |
| `src/components/VerifyImpactModal.tsx` | **Create** — plain HTML modal, char counter, Verification Gate | 3.2 |
| `src/app/actions/page.tsx` | **Create** — Action Items page | 3.1 + 3.2 |
| `src/__tests__/actionService.test.ts` | **Create** — service unit tests + API route tests | 3.1 + 3.2 |
| `src/__tests__/actionItems.test.tsx` | **Create** — component integration tests | 3.1 + 3.2 |

### Modified Files (Minimal, Additive)

| File | Change |
|---|---|
| `src/components/FeedbackCard.tsx` | Add optional prop `onConvert?: (item: FeedbackItem) => void`; add "Convert to Action" button rendered only when `item.category === 'should-try' && onConvert !== undefined` |
| `src/components/FeedbackColumn.tsx` | Add optional prop `onConvert?: (item: FeedbackItem) => void`; forward to each `<FeedbackCard>` |
| `src/app/feedback/page.tsx` | Add `showConvertModal: boolean`, `convertTarget: FeedbackItem \| null` state; add `handleConvert(item)` handler; wire `<ConvertActionModal>`; pass `onConvert={handleConvert}` to columns |

---

## API Route Specifications (Sprint 3)

### `GET /api/actions`

| Field | Value |
|---|---|
| **Method** | GET |
| **Path** | `/api/actions` |
| **Query params** | `sprintId: string` (required) |
| **Response 200** | `ActionItem[]` — all items for the sprint, unordered (sorting is client-side in `getActionsByStatus`) |
| **Response 400** | `{ error: 'sprintId is required' }` |
| **Response 500** | `{ error: 'Internal server error' }` |
| **DB call** | `ActionItemModel.find({ sprintId }).lean()` |

### `POST /api/actions`

| Field | Value |
|---|---|
| **Method** | POST |
| **Path** | `/api/actions` |
| **Request body** | `{ title: string, description: string, ownerId: string, dueDate: string, sourceFeedbackId: string, sourceQuote: string, sprintId: string }` |
| **Response 201** | Created `ActionItem` document as JSON |
| **Response 400** | `{ error: 'title, ownerId, and sprintId are required' }` |
| **Response 500** | `{ error: 'Internal server error' }` |
| **DB call** | `new ActionItemModel({ ...body, status: 'open' })` → `.save()` |
| **Notes** | `status` is always set to `'open'` server-side; client cannot override initial status |

### `PATCH /api/actions/[id]/advance`

| Field | Value |
|---|---|
| **Method** | PATCH |
| **Path** | `/api/actions/[id]/advance` |
| **Request body** | None (empty body) |
| **Response 200** | Updated `ActionItem` as JSON (with new `status`) |
| **Response 404** | `{ error: 'Action item not found' }` |
| **Response 409** | `{ error: 'Cannot advance a verified or completed item' }` — when `status === 'verified'` or `status === 'completed'` |
| **Response 500** | `{ error: 'Internal server error' }` |
| **Transition map** | `'open'` → `'in-progress'`; `'in-progress'` → `'completed'`; `'completed'` → 409; `'verified'` → 409 |
| **DB call** | `ActionItemModel.findById(params.id)` → mutate `status` → `.save()` |

### `PATCH /api/actions/[id]/verify`

| Field | Value |
|---|---|
| **Method** | PATCH |
| **Path** | `/api/actions/[id]/verify` |
| **Request body** | `{ impactNote: string }` |
| **Response 200** | Updated `ActionItem` as JSON (with `status: 'verified'`, `impactNote`, `completedAt`) |
| **Response 400** | `{ error: 'impactNote is required and must be non-empty' }` |
| **Response 404** | `{ error: 'Action item not found' }` |
| **Response 409** | `{ error: 'Action item must be completed before verifying' }` — when `status !== 'completed'` |
| **Response 500** | `{ error: 'Internal server error' }` |
| **DB call** | `ActionItemModel.findById(params.id)` → `status = 'verified'`, `impactNote = body.impactNote`, `completedAt = new Date()` → `.save()` |

---

## Service Layer Specifications (Sprint 3)

**File**: `src/services/actionService.ts`  
**No `"use client"` directive** — plain Node/browser-compatible module (same pattern as `feedbackService.ts`)

### Function signatures

```ts
export async function getActions(sprintId: string): Promise<ActionItem[]>
// GET /api/actions?sprintId=X → throws on non-OK

export function getActionsByStatus(items: ActionItem[]): ActionItem[]
// Pure sort: order by STATUS_ORDER[status] asc, then createdAt asc within each group
// STATUS_ORDER: { 'open': 0, 'in-progress': 1, 'completed': 2, 'verified': 3 }

export async function createAction(payload: {
  title: string
  description: string
  ownerId: string
  dueDate: string
  sourceFeedbackId: string
  sourceQuote: string
  sprintId: string
}): Promise<ActionItem>
// Validation: throws if title.trim() === '' or ownerId === ''
// POST /api/actions → throws on non-OK; returns created ActionItem

export async function advanceStatus(itemId: string): Promise<ActionItem>
// PATCH /api/actions/[itemId]/advance → throws on non-OK (including 409)

export async function verifyImpact(itemId: string, impactNote: string): Promise<ActionItem>
// Validation: throws if impactNote.trim() === '' (before fetch — mirrors Reframe Rule pattern)
// PATCH /api/actions/[itemId]/verify with { impactNote } → throws on non-OK

export function getCompletionRate(items: ActionItem[]): number
// Returns: verifiedCount / totalCount * 100, rounded to nearest integer
// Returns 0 if items is empty
```

### Verification Gate enforcement layers

| Layer | Where | Rule |
|---|---|---|
| **Client** | `VerifyImpactModal.tsx` | Submit button `disabled` when `impactNote.trim() === ''` or `impactNote.length > 300` |
| **Service** | `actionService.verifyImpact()` | `throw new Error('impactNote is required')` before any `fetch()` call |
| **API** | `PATCH /api/actions/[id]/verify` | `if (!body.impactNote?.trim()) return 400` |
| **API** | `PATCH /api/actions/[id]/verify` | `if (item.status !== 'completed') return 409` |

---

## Component Boundaries (Sprint 3)

| Component | Owns | Does NOT Own |
|---|---|---|
| `src/app/actions/page.tsx` | Session guard, sprint resolution, `showNewModal`, `showVerifyModal`, `verifyTarget`, `showConvertModal` state (on feedback page), `refetch` trigger | API calls (delegates to `actionService`), card rendering |
| `ActionItemCard.tsx` | Card UI: status badge, due date label, owner avatar+name, title, description, SOURCE FEEDBACK block, "Advance Status" / "Verify Impact" / no-button rendering | HTTP calls (delegates via `onAdvance` and `onVerify` props) |
| `NewActionItemModal.tsx` | Form state: `title`, `description`, `ownerId`, `dueDate`; submit-disabled logic; user list for owner dropdown | `fetch('/api/users')` — parent fetches users and passes as prop; or modal fetches internally on open |
| `ConvertActionModal.tsx` | Form state with pre-filled `title` from `item.content`; `description`, `ownerId`, `dueDate`; displays source quote blockquote | Direct API calls (parent provides `onSubmit`) |
| `VerifyImpactModal.tsx` | Form state: `impactNote`; char counter `impactNote.length`; submit-disabled logic (empty or >300) | Direct API calls (parent provides `onSubmit` that calls `actionService.verifyImpact`) |
| `actionService.ts` | All `fetch()` calls to `/api/actions/*`; `getActionsByStatus()` sort; `getCompletionRate()`; Verification Gate throw guard | UI rendering, Mongoose imports |

### `ActionItemCard` prop interface

```ts
interface ActionItemCardProps {
  item: ActionItem
  ownerName: string          // resolved from ownerId by parent page
  onAdvance: (itemId: string) => void
  onVerify: (item: ActionItem) => void   // opens VerifyImpactModal with item
  'data-testid'?: string
}
```

### `NewActionItemModal` prop interface

```ts
interface NewActionItemModalProps {
  open: boolean
  sprintId: string
  users: Pick<User, '_id' | 'name'>[]   // fetched by parent page on mount
  onClose: () => void
  onSubmit: (payload: CreateActionPayload) => Promise<void>
}
```

### `ConvertActionModal` prop interface

```ts
interface ConvertActionModalProps {
  open: boolean
  feedbackItem: FeedbackItem | null
  sprintId: string
  users: Pick<User, '_id' | 'name'>[]
  onClose: () => void
  onSubmit: (payload: CreateActionPayload) => Promise<void>
}
```

### `VerifyImpactModal` prop interface

```ts
interface VerifyImpactModalProps {
  open: boolean
  item: ActionItem | null
  onClose: () => void
  onSubmit: (itemId: string, impactNote: string) => Promise<void>
}
```

### `FeedbackCard` prop interface (Sprint 3 addition)

```ts
// Add to existing FeedbackCardProps:
onConvert?: (item: FeedbackItem) => void   // optional — if undefined, button hidden
```

### `FeedbackColumn` prop interface (Sprint 3 addition)

```ts
// Add to existing FeedbackColumnProps:
onConvert?: (item: FeedbackItem) => void   // forwarded to each FeedbackCard
```

---

## Data Flow (Sprint 3)

### Action Items Page Load

```
User lands on /actions (actions/page.tsx)
  → useEffect on mount:
      1. getCurrentUser() → null → router.push('/') [session guard]
      2. GET /api/sprints → resolve active sprintId
      3. GET /api/users → resolve user list for owner dropdowns
      4. actionService.getActions(sprintId) → GET /api/actions?sprintId=X
           → connectDB()
           → ActionItemModel.find({ sprintId }).lean()
      5. actionService.getActionsByStatus(items) → sorted array
      6. setState: { actions[], users[], sprint }
  → Render: status bar (4 counts) + card list or empty state
```

### Advance Status Flow

```
User clicks "Advance Status" on ActionItemCard
  → page.handleAdvance(itemId)
      → actionService.advanceStatus(itemId)
           → PATCH /api/actions/[id]/advance
                → findById → mutate status → save → return updated item
      → refetch() (re-calls getActions + getActionsByStatus)
  → Card re-renders with new status badge
  → If new status === 'completed': "Advance Status" replaced by "Verify Impact"
```

### Verify Impact Flow

```
User clicks "Verify Impact" on ActionItemCard (status === 'completed')
  → page sets verifyTarget = item, showVerifyModal = true
  → <VerifyImpactModal> opens with item
  → User types impactNote (char counter updates live)
  → User clicks "Confirm Verified"
      → actionService.verifyImpact(itemId, impactNote)
           → throws if impactNote.trim() === '' (Verification Gate — service layer)
           → PATCH /api/actions/[id]/verify { impactNote }
                → 400 if empty (API layer guard)
                → 409 if status !== 'completed'
                → status = 'verified', impactNote saved, completedAt = now → 200
      → modal closes → refetch()
  → Card re-renders: "Verified" badge, impactNote displayed, no action button
```

### Convert Feedback to Action Flow

```
User clicks "Convert to Action" on FeedbackCard (should-try lane only)
  → feedback/page.tsx: setConvertTarget(item), setShowConvertModal(true)
  → <ConvertActionModal> opens with feedbackItem pre-populated
  → User edits title (optional), selects owner, sets due date
  → User clicks "Create Action Item"
      → actionService.createAction({
          title, description, ownerId, dueDate,
          sourceFeedbackId: item._id,
          sourceQuote: item.content,
          sprintId
        })
           → POST /api/actions → 201 Created
      → modal closes → (no feedback page refetch needed)
  → Created ActionItem appears on /actions page
```

---

## Global UI Infrastructure Confirmation (Sprint 3)

`src/app/layout.tsx` carries `className="dark"` on the `<html>` element. This dark theme propagates to `/actions` page automatically. All Sprint 3 component styles use Tailwind dark-mode token classes consistent with Sprint 1 and Sprint 2 patterns. **No changes to `layout.tsx` required for Sprint 3.**

Modal pattern: **plain HTML + Tailwind** (no shadcn/ui), matching Sprint 2 `SubmitFeedbackModal.tsx`. `role="dialog"` + `aria-modal="true"` on modal container div. All modals use `data-testid` hooks for reliable RTL querying.

---

## Isolation Constraints (Sprint 3)

| Constraint | Rule |
|---|---|
| `src/store/retro-store.tsx` | Never imported by any Sprint 3 file |
| `src/lib/models/ActionItem.ts` | **Never modified** — consumed by API routes as-is; schema already has all required fields |
| `src/lib/models/FeedbackItem.ts` | **Never modified** — Sprint 3 does not update `actionItemId` on FeedbackItem (linkage via `ActionItem.sourceFeedbackId` only) |
| `src/types/index.ts` | **Never modified** — `ActionItem` type already defines all required fields |
| `src/services/feedbackService.ts` | **Never modified** — consumed read-only by Sprint 3 |
| `src/app/api/feedback/route.ts` | **Never modified** |
| `src/app/api/feedback/[id]/upvote/route.ts` | **Never modified** |
| `src/components/SubmitFeedbackModal.tsx` | **Never modified** |
| `data-testid` hooks | All Sprint 3 modals must include `data-testid` on the container and submit button — same pattern as Sprint 2 |
| Status field values | Always kebab-case: `"open"`, `"in-progress"`, `"completed"`, `"verified"` — never PascalCase |
| `ActionItem._id` | Use `item._id` — never `item.id` |

---

## Sprint 3 Session 2 — [ARCHITECT] Pre-flight Audit

**Mode**: [ARCHITECT]  
**Date**: April 2026  
**Scope**: Session 2 tasks S3-S2-1 through S3-S2-8  
**Session 1 deviation source**: `retro-dev/docs/IMPLEMENTATION_NOTES.md` §Sprint 3 Session 1

---

### Task Status After Session 1

| Task | Description | Status | Action |
|---|---|---|---|
| S3-S2-1 | `src/app/api/actions/[id]/advance/route.ts` | ✅ **DONE** — created in Session 1 | **SKIP** — do NOT recreate or overwrite |
| S3-S2-2 | `src/app/api/actions/[id]/verify/route.ts` | ✅ **DONE** — created in Session 1 | **SKIP** — do NOT recreate or overwrite |
| S3-S2-3 | `src/components/ConvertActionModal.tsx` | ❌ Does not exist | **CREATE** |
| S3-S2-4 | `src/components/VerifyImpactModal.tsx` | ❌ Does not exist | **CREATE** |
| S3-S2-5 | `FeedbackCard.tsx` + `FeedbackColumn.tsx` `onConvert` prop | ❌ Prop not yet added | **MODIFY** (additive only) |
| S3-S2-6 | Wire `ConvertActionModal` into `feedback/page.tsx` | ❌ Not yet wired | **MODIFY** (additive only) |
| S3-S2-7 | Replace `verify-modal-stub` in `actions/page.tsx` | ❌ Stub still in place (line 232) | **MODIFY** (surgical replacement) |
| S3-S2-8 | `src/__tests__/actionItems.test.tsx` | ❌ Does not exist | **CREATE** |

---

### File Inventory: CREATE vs MODIFY vs SKIP vs READ-ONLY

| File | Action | Reason |
|---|---|---|
| `src/app/api/actions/[id]/advance/route.ts` | **SKIP** | Session 1 complete — 35-line PATCH handler, `ADVANCE_MAP`, 404/409/500 guards |
| `src/app/api/actions/[id]/verify/route.ts` | **SKIP** | Session 1 complete — 39-line PATCH handler, `impactNote` validation, 400/404/409/500 guards |
| `src/components/ConvertActionModal.tsx` | **CREATE** | New file; ~120 lines; Session 1 did not touch |
| `src/components/VerifyImpactModal.tsx` | **CREATE** | New file; ~90 lines; Session 1 did not touch |
| `src/components/FeedbackCard.tsx` | **MODIFY** | Add optional `onConvert?` prop — 3 lines; must not break existing `onUpvote` prop or any FB-1–FB-13 test |
| `src/components/FeedbackColumn.tsx` | **MODIFY** | Forward optional `onConvert?` — 3 lines; must not break existing column tests |
| `src/app/feedback/page.tsx` | **MODIFY** | Add `showConvertModal`, `convertTarget`, `users` state; `handleConvert`; `handleConvertSubmit`; `GET /api/users` fetch; wire `<ConvertActionModal>` |
| `src/app/actions/page.tsx` | **MODIFY** | Surgical: add `VerifyImpactModal` import; replace line 232 stub with real component |
| `src/__tests__/actionItems.test.tsx` | **CREATE** | New file; test cases AI-1 through AI-14 |
| `src/__tests__/feedbackBoard.test.tsx` | **MODIFY** | Append FB-14, FB-15, FB-16 — never modify existing tests |
| `src/services/actionService.ts` | **READ-ONLY** | All exports already present after Session 1; no changes needed in Session 2 |
| `src/app/api/actions/route.ts` | **READ-ONLY** | GET + POST fully implemented in Session 1 |
| `src/services/feedbackService.ts` | **READ-ONLY** | No changes in Session 2 |
| `src/types/index.ts` | **READ-ONLY** | No changes needed |

---

### Task S3-S2-1 and S3-S2-2 — SKIP Confirmation

**Evidence from IMPLEMENTATION_NOTES.md §Sprint 3 Session 1**:
- `src/app/api/actions/[id]/advance/route.ts` — 35 lines, `ADVANCE_MAP`, 404/409/500 guards ✅
- `src/app/api/actions/[id]/verify/route.ts` — 38 lines, `impactNote` trim validation, `status === 'completed'` gate, 400/404/409/500 guards ✅

Both routes exactly match the S3-S2-1 / S3-S2-2 task specs in IMPLEMENTATION_PLAN.md. Session 2 must NOT recreate or overwrite these files.

**Test coverage already written**: AS-8 through AS-13 in `actionService.test.ts` test both routes. These tests pass in the Session 1 completion gate (58/60 — the 2 failures are the `getCompletionRate` regression, not route tests).

---

### Task S3-S2-3 — `ConvertActionModal.tsx` — No Conflicts

**Dependency check against Session 1 output**:

| Dependency | Source | Status |
|---|---|---|
| `CreateActionPayload` interface | `src/services/actionService.ts` (Session 1) | ✅ Exported — `title`, `description`, `ownerId`, `dueDate`, `sourceFeedbackId`, `sourceQuote`, `sprintId` |
| `createAction(payload)` async function | `src/services/actionService.ts` (Session 1) | ✅ Exported — throws on empty title before fetch |
| `FeedbackItem` type import | `src/types/index.ts` | ✅ No change needed |
| `User` type import | `src/types/index.ts` | ✅ No change needed |

**No conflicts with Session 1 output.** The `ConvertActionModal` is a new file with no dependencies on Session 1 components (only on service + types).

**Critical implementation note**: `title` state must be initialized from `feedbackItem.content` via a `useEffect` that runs when `feedbackItem` changes — not just in initial `useState`. This handles the case where the user closes and reopens the modal with a different feedback item:

```ts
const [title, setTitle] = useState(feedbackItem?.content ?? '')
useEffect(() => {
  if (feedbackItem) setTitle(feedbackItem.content)
}, [feedbackItem])
```

---

### Task S3-S2-4 — `VerifyImpactModal.tsx` — `onSubmit` Signature Confirmation

**`handleVerifySubmit` in `actions/page.tsx` (Session 1, line 101)**:

```ts
async function handleVerifySubmit(itemId: string, impactNote: string) {
  try {
    await verifyImpact(itemId, impactNote)
    if (sprint) await refetch(sprint._id)
  } catch {
    // silent no-op
  } finally {
    setShowVerifyModal(false)
  }
}
```

**`VerifyImpactModalProps.onSubmit` spec (Task S3-S2-4)**:

```ts
onSubmit: (itemId: string, impactNote: string) => Promise<void>
```

✅ **Signatures match exactly.** `handleVerifySubmit` accepts `(itemId: string, impactNote: string)` and returns `Promise<void>` (implicit — async function with no explicit return). No signature change needed.

**`onClose` in `actions/page.tsx` Task S3-S2-7** will be:
```tsx
onClose={() => { setShowVerifyModal(false); setVerifyTarget(null) }}
```
This resets both `showVerifyModal` and `verifyTarget` to clean state. `handleVerifySubmit` already calls `setShowVerifyModal(false)` in `finally`, so both close paths are covered.

**Impact statement reset**: `VerifyImpactModal` must reset its `impactNote` state to `''` on close (via internal `handleClose` function) to prevent stale state when the modal is reopened for a different item.

---

### Task S3-S2-5 — `onConvert` Prop — Breaking Change Risk Analysis

**Current `FeedbackCardProps` interface** (`FeedbackCard.tsx` line 13–17):

```ts
interface FeedbackCardProps {
  item: FeedbackItem
  authorName: string
  onUpvote: () => void
}
```

**Current `FeedbackColumnProps` interface** (`FeedbackColumn.tsx` line 39–44):

```ts
interface FeedbackColumnProps {
  category: FeedbackCategory
  items: FeedbackItem[]
  onUpvote: (itemId: string) => void
  currentUserId: string
}
```

**Proposed addition** (additive, no breaking change):

```ts
// FeedbackCardProps — add:
onConvert?: (item: FeedbackItem) => void

// FeedbackColumnProps — add:
onConvert?: (item: FeedbackItem) => void
```

**Breaking change analysis**:

| Risk | Analysis |
|---|---|
| Existing `FeedbackBoardPage` in `feedback/page.tsx` | Does NOT pass `onConvert` to `<FeedbackColumn>` until Task S3-S2-6. With `onConvert?` optional, all three `<FeedbackColumn>` instances remain valid TypeScript — no compile error. |
| FB-1 through FB-13 tests | All tests mock `feedbackService` and do not rely on `FeedbackCard` or `FeedbackColumn` props interfaces. The `feedbackBoard.test.tsx` tests render `FeedbackBoardPage` which does not pass `onConvert` to columns — `onConvert` is `undefined`, guard `item.category === 'should-try' && onConvert` evaluates to `false`, convert button is NOT rendered. FB-1–FB-13 cannot be broken by this addition. |
| `FeedbackColumn` forwarding `onConvert={onConvert}` to `FeedbackCard` | When `onConvert` is `undefined` (existing call sites), `undefined` is a valid value for an optional prop. No runtime error. |

✅ **Safe. No existing test will break.** The `onConvert?` optional pattern is the canonical approach.

---

### Task S3-S2-6 — `feedback/page.tsx` Users Fetch — No Conflict with Sprint Fetch

**Current `useEffect` in `feedback/page.tsx`**:
- Calls `GET /api/sprints` only
- No `users` state, no `GET /api/users` call

**Session 2 addition**: Add `users` state + `GET /api/users` fetch inside the same `useEffect`, after the sprint fetch:

```ts
// After setSprint(activeSprint):
const usersRes = await fetch('/api/users')
if (!usersRes.ok) throw new Error('Failed to fetch users')
const usersData: User[] = await usersRes.json()
setUsers(usersData.map((u) => ({ _id: u._id, name: u.name })))
```

**Conflict check with existing `global.fetch` mock in `feedbackBoard.test.tsx`**:

The existing `beforeEach` in `feedbackBoard.test.tsx`:

```ts
;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => mockSprint,
})
```

This mock returns `mockSprint` for ALL `fetch` calls — including the new `GET /api/users` call. `mockSprint` is a sprint object, not a users array. The `setUsers(usersData.map(...))` call will attempt `.map()` on an object — **this will throw at runtime in tests**.

**Fix required in `feedbackBoard.test.tsx` `beforeEach`**: The mock must be upgraded to a URL-discriminating implementation (same pattern used in `actionItems.test.tsx`):

```ts
;(global.fetch as jest.Mock) = jest.fn().mockImplementation((url: string) => {
  if ((url as string).includes('/api/users')) {
    return Promise.resolve({ ok: true, json: async () => [] })
  }
  return Promise.resolve({ ok: true, json: async () => mockSprint })
})
```

This is a **test file modification required in Session 2** — it must be appended to `feedbackBoard.test.tsx` as an amendment to `beforeEach`. It does not modify any test case (only the shared setup), so it does not violate the "never modify existing tests" rule. However, because `beforeEach` is shared, this change must be carefully scoped.

**Recommended approach**: Add a `beforeEach` override at the top of a new `describe('Sprint 3 — Convert flow (FB-14/15/16)')` block inside `feedbackBoard.test.tsx`. This keeps the Sprint 1/2 tests' `beforeEach` completely untouched and limits the URL-discriminating mock to only the Sprint 3 convert-flow tests.

---

### Task S3-S2-7 — Stub Replacement — Exact Line

**Stub location in `actions/page.tsx` (confirmed, line 232)**:

```tsx
{/* Verify Impact Modal — Session 2 stub */}
{showVerifyModal && <div data-testid="verify-modal-stub" />}
```

**Replacement**:

```tsx
<VerifyImpactModal
  open={showVerifyModal}
  item={verifyTarget}
  onClose={() => { setShowVerifyModal(false); setVerifyTarget(null) }}
  onSubmit={handleVerifySubmit}
/>
```

**Import to add** (top of file, after `NewActionItemModal` import):

```ts
import VerifyImpactModal from '@/components/VerifyImpactModal'
```

**Reason `<VerifyImpactModal>` does not need a conditional wrapper**: The component's own `if (!open || !item) return null` guard handles the closed state. Removing the `{showVerifyModal && ...}` wrapper and replacing with an always-rendered `<VerifyImpactModal open={showVerifyModal} item={verifyTarget} ...>` is the correct pattern (same as `NewActionItemModal` on line 223 which is always rendered with `open` prop).

---

### Task S3-S2-8 — `actionItems.test.tsx` Mock Pattern Confirmation

**Session 1 exports from `actionService.ts`** (confirmed live):

```ts
export interface CreateActionPayload { ... }
export async function getActions(sprintId?: string): Promise<ActionItem[]>
export function getCompletionRate(actions: ActionItem[]): number
export function getOpenCount(actions: ActionItem[]): number
export function getCompletedCount(actions: ActionItem[]): number
export function getActionsByStatus(items: ActionItem[]): ActionItem[]
export async function createAction(payload: CreateActionPayload): Promise<ActionItem>
export async function advanceStatus(itemId: string): Promise<ActionItem>
export async function verifyImpact(itemId: string, impactNote: string): Promise<ActionItem>
```

All 8 functions are exported. The `actionService` mock in `actionItems.test.tsx` must include all of them (no forward-declaration needed — all exports exist). This differs from the Sprint 2 `feedbackService` mock which forward-declared `addFeedback`/`upvoteFeedback`.

**`actions/page.tsx` uses `users` state** (already populated from `GET /api/users` in `useEffect`). The `global.fetch` mock in `actionItems.test.tsx` `beforeEach` already handles `/api/users` via the URL-discriminating implementation — confirmed correct in the TEST_PLAN.md Sprint 3 section.

**`data-testid="open-new-action-btn"`** — confirmed on `actions/page.tsx` line 156. Test AI-14 must use `getByTestId('open-new-action-btn')` not `getByRole('button', { name: /new action item/i })` — the button contains a `<Plus>` Lucide icon as a child, making the accessible name computation unreliable in jsdom (same reasoning as Sprint 2 `open-modal-btn`).

---

### Session 2 [ARCHITECT] Pre-flight Summary

| Check | Status |
|---|---|
| S3-S2-1 and S3-S2-2 confirmed DONE — skip | ✅ |
| S3-S2-3 `ConvertActionModal` — no dependency conflicts | ✅ |
| S3-S2-4 `VerifyImpactModal` — `onSubmit` signature matches `handleVerifySubmit` | ✅ `(itemId: string, impactNote: string) => Promise<void>` |
| S3-S2-5 `onConvert?` is optional — safe addition, no breaking change | ✅ |
| S3-S2-6 `users` fetch — requires URL-discriminating `fetch` mock in `feedbackBoard.test.tsx` | ⚠️ **Scoped** — add inside `describe('Sprint 3 — Convert flow')` block only |
| S3-S2-7 stub replacement — exact line 232, replace with always-rendered component | ✅ `<VerifyImpactModal open={showVerifyModal} item={verifyTarget} ...>` |
| S3-S2-8 mock pattern — all 8 `actionService` exports exist; no forward-declaration needed | ✅ |
| `data-testid="open-new-action-btn"` confirmed on `actions/page.tsx` line 156 | ✅ |
| `data-testid="verify-modal-stub"` on line 232 — to be removed in S3-S2-7 | ✅ |

---

---

# Sprint 4 — Architecture Design

**Mode**: [ARCHITECT]  
**Date**: April 2026  
**Scope**: Epic 4.1 — Sprint Setup + Admin Controls (single DEV session)  
**Prerequisite**: Sprint 3 complete and merged

---

## Component Boundaries (Sprint 4)

```
sprint-setup/page.tsx          ← "use client"; session + admin guard; page orchestrator
  └── sprintService.ts         ← fetch wrapper: getActiveSprint, createSprint, updateSprint, openRetro, closeRetro
  └── userService.ts           ← getAllUsers() reused (no duplication)
  └── Shell.tsx                ← layout wrapper (read-only — Sprint 1)

api/sprints/[id]/route.ts      ← NEW: PATCH — update sprint fields
api/sprints/[id]/status/route.ts ← NEW: PATCH — toggle status open/closed
api/users/route.ts             ← MODIFY: add optional ?username query filter

feedback/page.tsx              ← MODIFY: add sprint.status === 'closed' guard on Submit button
```

---

## Data Flow (Sprint 4)

### Page Mount (admin)
```
sprint-setup/page.tsx
  → Promise.all([
      sprintService.getActiveSprint(),   → GET /api/sprints → SprintModel.findOne({status:'open'})
      userService.getAllUsers()           → GET /api/users   → UserModel.find({})
    ])
  → setSprint(activeSprint)
  → setResolvedMembers(allUsers.filter(u => sprint.teamMemberIds.includes(u._id)))
  → populate form fields
```

### Save Changes (update existing sprint)
```
sprint-setup/page.tsx handleSave()
  → sprintService.updateSprint(id, { name, goal, startDate, endDate, teamMemberIds })
      → PATCH /api/sprints/[id]
          → SprintModel.findById(id) → update fields → save() → 200
  → if (localStatus !== sprint.status):
      sprintService.openRetro(id) | closeRetro(id)
          → PATCH /api/sprints/[id]/status
              → SprintModel.findById(id) → item.status = status → save() → 200
  → setSprint(updatedSprint) → show "Sprint saved." for 2s
```

### Save Changes (create new sprint)
```
sprint-setup/page.tsx handleSave()
  → sprintService.createSprint({ name, goal, startDate, endDate })
      → POST /api/sprints → SprintModel({ ...body, status: 'open' }) → save() → 201
  → setSprintId(returned._id) → setIsNewSprint(false) → show "Sprint saved."
```

### Add Member
```
sprint-setup/page.tsx handleAddMember(username)
  → GET /api/users?username={username}
      → UserModel.find({ username }) → [] | [User]
  → empty → setMemberError("User not found")
  → found._id in teamMemberIds → setMemberError("User already added")
  → found, new → setResolvedMembers([...prev, {_id, name, pod}])
                  setTeamMemberIds([...prev, found._id])
```

### Closed Retro Guard (feedback/page.tsx)
```
feedback/page.tsx
  sprint.status === 'closed'
    → open-modal-btn disabled + aria-label="Feedback submission is closed"
    → onClick guard: if (sprint?.status === 'closed') return
```

---

## New Files: CREATE

### `src/app/api/sprints/[id]/route.ts` (~50 lines)

**Method**: `PATCH`  
**AC**: AC-4.1.2, AC-4.1.3, AC-4.1.7

```ts
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse>
```

**Logic**:
1. `await connectDB()`
2. `const body = await req.json()` — extract `{ name, goal, startDate, endDate, teamMemberIds }`
3. If body has no recognized fields → 400 `{ error: 'No updatable fields provided' }`
4. `SprintModel.findById(params.id)` → 404 if not found
5. Apply only provided fields: `if (body.name !== undefined) item.name = body.name` etc.
6. `await item.save()` → return `NextResponse.json(item, { status: 200 })`
7. `try/catch` → `void err` → 500

**Fields updatable**: `name`, `goal`, `startDate`, `endDate`, `teamMemberIds`  
**Fields NOT updatable here**: `status` — use `/status` route

---

### `src/app/api/sprints/[id]/status/route.ts` (~30 lines)

**Method**: `PATCH`  
**AC**: AC-4.1.4, AC-4.1.7

```ts
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse>
```

**Logic**:
1. `await connectDB()`
2. `const { status } = await req.json()`
3. If `status !== 'open' && status !== 'closed'` → 400 `{ error: "status must be 'open' or 'closed'" }`
4. `SprintModel.findById(params.id)` → 404 if not found
5. `item.status = status` → `await item.save()` → return `NextResponse.json(item, { status: 200 })`
6. `try/catch` → `void err` → 500

---

### `src/services/sprintService.ts` (~80 lines)

**AC**: AC-4.1.7, AC-4.1.10

```ts
import type { Sprint } from '@/types'

export async function getActiveSprint(): Promise<Sprint | null>
export async function createSprint(payload: {
  name: string
  goal?: string
  startDate: string
  endDate: string
}): Promise<Sprint>
export async function updateSprint(
  id: string,
  payload: Partial<Pick<Sprint, 'name' | 'goal' | 'startDate' | 'endDate' | 'teamMemberIds'>>
): Promise<Sprint>
export async function openRetro(id: string): Promise<Sprint>
export async function closeRetro(id: string): Promise<Sprint>
```

**`getActiveSprint` normalisation**: `GET /api/sprints` returns either a sprint object or `[]`. Service normalises:
```ts
const data = await res.json()
return Array.isArray(data) ? null : (data as Sprint)
```

**Error pattern**: All functions throw `new Error(json.error ?? 'Request failed')` on non-2xx.

---

### `src/app/sprint-setup/page.tsx` (~150 lines)

**AC**: AC-4.1.1 through AC-4.1.10

**State**:
```ts
const [sprint, setSprint] = useState<Sprint | null>(null)
const [isNewSprint, setIsNewSprint] = useState(false)
const [isLoading, setIsLoading] = useState(true)
const [loadError, setLoadError] = useState(false)
const [isSaving, setIsSaving] = useState(false)
const [saveError, setSaveError] = useState('')
const [saveSuccess, setSaveSuccess] = useState(false)

// Form fields (controlled)
const [name, setName] = useState('')
const [goal, setGoal] = useState('')
const [startDate, setStartDate] = useState('')
const [endDate, setEndDate] = useState('')
const [localStatus, setLocalStatus] = useState<'open' | 'closed'>('open')

// Members
const [teamMemberIds, setTeamMemberIds] = useState<string[]>([])
const [resolvedMembers, setResolvedMembers] = useState<{ _id: string; name: string; pod: string }[]>([])
const [usernameInput, setUsernameInput] = useState('')
const [memberError, setMemberError] = useState('')
const [isAddingMember, setIsAddingMember] = useState(false)
```

**`dateError` derived** (not state):
```ts
const dateError = startDate && endDate && endDate < startDate
  ? 'End date must be on or after start date'
  : ''
```

**`saveDisabled` derived**:
```ts
const saveDisabled = !name.trim() || !startDate || !endDate || !!dateError || isSaving
```

**Admin vs read-only branch**:
```tsx
const isAdmin = currentUser?.isAdmin === true
return isAdmin ? <AdminView ... /> : <ReadOnlyView ... />
```

Both branches wrapped in `<Shell sprintName={sprint?.name}>`.

**`handleSave` flow** (admin only):
```ts
async function handleSave() {
  setIsSaving(true)
  setSaveError('')
  try {
    let updated: Sprint
    if (isNewSprint) {
      updated = await createSprint({ name, goal, startDate, endDate })
      setIsNewSprint(false)
    } else {
      updated = await updateSprint(sprint!._id, { name, goal, startDate, endDate, teamMemberIds })
    }
    if (localStatus !== updated.status) {
      updated = localStatus === 'open'
        ? await openRetro(updated._id)
        : await closeRetro(updated._id)
    }
    setSprint(updated)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  } catch (err) {
    setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
  } finally {
    setIsSaving(false)
  }
}
```

---

## Modified Files

### `src/app/api/users/route.ts` — Add `?username` query filter

**Current**: `GET` handler does `UserModel.find({}).lean()` — no query filtering.  
**Change required**: Add optional `username` query param filter.

```ts
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const username = req.nextUrl.searchParams.get('username')
    const query = username ? { username } : {}
    const users = await UserModel.find(query).lean()
    return NextResponse.json(users, { status: 200 })
  } catch (err) {
    console.error('[GET /api/users]', err)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
```

**Breaking change risk**: `GET /api/users` with no query param returns all users — **unchanged behaviour**. Existing Sprint 1–3 call sites (`userService.getAllUsers()`, `feedback/page.tsx`, `actions/page.tsx`) all call without a `?username` param — **no regression**.

**Test impact**: The `feedbackBoard.test.tsx` `global.fetch` mock already handles `/api/users` via URL-discriminating mock (Sprint 3 Session 2 FB-14/15/16 block). Sprint 4 mock will need to handle `/api/users?username=X` additionally — addressed in Phase 3.

---

### `src/app/feedback/page.tsx` — Closed retro guard

**Surgical change** — additive only. Two modifications:

1. Button `disabled` prop:
```tsx
<button
  onClick={() => { if (sprint?.status !== 'closed') setShowModal(true) }}
  data-testid="open-modal-btn"
  disabled={sprint?.status === 'closed'}
  aria-label={sprint?.status === 'closed' ? 'Feedback submission is closed' : undefined}
  className={`... ${sprint?.status === 'closed' ? 'opacity-50 cursor-not-allowed' : ''}`}
>
```

2. `onClick` guard prevents modal from opening even if `disabled` is bypassed.

**FB-1 through FB-16 regression check**: All existing tests have `mockSprint.status = 'open'`. The `disabled` prop evaluates to `false`. `onClick` guard evaluates to `false` (sprint is not closed). **Zero regression risk.** ✅

---

## Files READ-ONLY (Sprint 4)

| File | Reason |
|---|---|
| `src/app/api/sprints/route.ts` | GET + POST complete; `console.error` calls are pre-existing (out of Sprint 4 scope per F8) |
| `src/lib/models/Sprint.ts` | Schema complete — all required fields present |
| `src/types/index.ts` | `Sprint` and `User` interfaces complete — no changes needed |
| `src/services/userService.ts` | `getAllUsers()` reused as-is |
| All Sprint 1–3 source files not listed as MODIFY | Read-only |

---

## Isolation Constraints (Sprint 4)

| Constraint | Rule |
|---|---|
| `src/app/api/sprints/route.ts` | **Never modified** — existing GET + POST untouched |
| `src/lib/models/Sprint.ts` | **Never modified** — no schema additions in Sprint 4 |
| `src/types/index.ts` | **Never modified** — no new type additions |
| `sprintService.ts` | Must NOT duplicate `getAllUsers()` from `userService` — call `userService.getAllUsers()` from the page |
| `sprint-setup/page.tsx` | **No shadcn imports** — all `@/components/ui/*` components forbidden |
| Status values | Always `"open"` or `"closed"` — no other values in Sprint 4 |
| `console.error` in new routes | **Forbidden** — use `void err` pattern (same as Sprint 3 routes) |
| `feedback/page.tsx` modification | Additive only — `disabled` prop + `onClick` guard — no state, no refetch, no new imports |

---

## Shell Sidebar Navigation Update (Sprint 4)

The `Shell.tsx` sidebar must be updated to include a **Sprint Setup** nav item at `/sprint-setup`, visible to all logged-in users (non-admins can still view the read-only page). The nav item uses the Lucide `Settings` icon.

**Risk**: `Shell.tsx` is a Sprint 1 file. The modification is additive only — adding one nav item entry to the `NAV_ITEMS` array. No existing nav items are moved or removed.

**`data-testid`**: Not required on the nav item itself (Shell nav was tested in Sprint 1; Sprint 4 tests do not test Shell internals).

---

## Sprint 4 Architecture Summary

| Check | Status |
|---|---|
| New API routes: `sprints/[id]/route.ts`, `sprints/[id]/status/route.ts` | ✅ CREATE — no conflicts with existing `sprints/route.ts` (different path segments) |
| `sprintService.ts` — 5 functions, no overlap with existing services | ✅ CREATE |
| `sprint-setup/page.tsx` — plain HTML only, no shadcn | ✅ CREATE |
| `api/users/route.ts` — add `?username` filter | ✅ MODIFY (additive, backward-compatible) |
| `feedback/page.tsx` — closed retro guard | ✅ MODIFY (additive, no regression to FB-1–16) |
| `Shell.tsx` — add Sprint Setup nav item | ✅ MODIFY (additive, one array entry) |
| `Sprint` type: no changes | ✅ READ-ONLY |
| `User` type: `isAdmin` already present | ✅ READ-ONLY |
| Sprint model: all fields present | ✅ READ-ONLY |
| `userService.getAllUsers()` reused from page — no duplication | ✅ |
| `console.error` pre-existing in `sprints/route.ts` — out of scope | ✅ Not flagged |

---

---

# Sprint 5 — Architecture Design

**Mode**: [ARCHITECT]  
**Date**: April 2026  
**Theme**: Polish, Error Handling & Smoke Test  
**Rule**: No new components, no new API routes, no new state patterns. All changes are surgical edits to existing files — additive only.

---

## Pre-Flight Audit (per-file SKIP/MODIFY)

| File | Verdict | Reason |
|---|---|---|
| `src/lib/db.ts` | **SKIP** | Already throws on missing `MONGODB_URI`. `mongoose.connect` errors propagate naturally to callers. No structured throw needed beyond what exists. |
| `src/app/api/*/route.ts` (all 9) | **SKIP** | All have `try/catch` with `void err` or `console.error` + 500 JSON response. Coverage is complete and consistent. |
| `src/app/dashboard/page.tsx` | **MODIFY** | Auth guard ✅ present. Error state ❌ missing — catch is silent. Empty state ⚠️ missing `data-testid`. Setup button ⚠️ missing `data-testid`. |
| `src/app/feedback/page.tsx` | **MODIFY** | Auth guard ✅ present. Error state ❌ missing — no `catch` block in `load()`. Empty state ❌ missing for `sprint === null`. |
| `src/app/actions/page.tsx` | **MODIFY** | Auth guard ✅. Error state ✅ (`setError`). Empty state ⚠️ missing 3 `data-testid` values. |
| `src/app/sprint-setup/page.tsx` | **SKIP** | Planned in Sprint 4 with auth guard + error state. Sprint 5 adds no changes. |
| `src/components/SubmitFeedbackModal.tsx` | **MODIFY** | `role="dialog"` ✅, `aria-labelledby` ✅, `data-testid` on container ✅, submit disabled ✅, close btn testid ✅. Missing: focus trap, return focus, 6 input testids, 1 cancel btn testid. |
| `src/components/NewActionItemModal.tsx` | **MODIFY** | `role="dialog"` ✅, `aria-labelledby` ✅, `data-testid` on container ✅, submit disabled ✅. Missing: focus trap, return focus, close btn testid, cancel btn testid, 4 input testids. |
| `src/components/ConvertActionModal.tsx` | **MODIFY** | Same as `NewActionItemModal`. Missing: focus trap, return focus, close btn testid, cancel btn testid, 4 input testids. |
| `src/components/VerifyImpactModal.tsx` | **MODIFY** | `role="dialog"` ✅, `aria-labelledby` ✅, `data-testid` on container ✅, submit disabled ✅. Missing: focus trap, return focus, close btn testid, cancel btn testid, 1 textarea testid. |
| `src/__tests__/errorHandling.test.tsx` | **CREATE** | Does not exist. New file covering EH-1 through EH-10. |

---

## Component Boundary Diagram (Sprint 5 — changes only)

```
Pages (MODIFY)                     Components (MODIFY)
─────────────────────────          ─────────────────────────────────────
dashboard/page.tsx                 SubmitFeedbackModal.tsx
  + loadError state                  + modalRef (focus trap)
  + catch → setLoadError(true)       + triggerRef (return focus)
  + data-testid="load-error"         + useEffect [open] → focus trap
  + data-testid="dashboard-          + useEffect [open] → capture trigger
      empty-state"                   + 6 data-testid on inputs/textareas
  + data-testid="dashboard-          + data-testid="sfm-cancel-btn"
      setup-btn"
                                   NewActionItemModal.tsx
feedback/page.tsx                    + modalRef, triggerRef
  + loadError state                  + focus trap useEffect
  + catch → setLoadError(true)       + return focus useEffect
  + data-testid="load-error"         + data-testid="nam-close-btn"
  + data-testid="feedback-           + data-testid="nam-cancel-btn"
      empty-state"                   + 4 data-testid on inputs

actions/page.tsx                   ConvertActionModal.tsx
  + data-testid="actions-            + same pattern as NewActionItemModal
      empty-state"
  + data-testid="actions-          VerifyImpactModal.tsx
      goto-feedback-btn"             + modalRef, triggerRef
  + data-testid="actions-            + focus trap useEffect
      empty-new-btn"                 + return focus useEffect
                                     + data-testid="vim-close-btn"
                                     + data-testid="vim-cancel-btn"
                                     + data-testid="vim-impact"

New Test File
─────────────────────────
src/__tests__/errorHandling.test.tsx
  EH-1 through EH-10
```

---

## Data Flow — Error Handling (Sprint 5 additions)

```
load() in dashboard/page.tsx
  try {
    fetch('/api/sprints') ──→ may throw (network) or return !ok
    getActions()          ──→ may throw
  } catch {
    setLoadError(true)    ←─ NEW
  } finally {
    setIsLoading(false)
  }

Render:
  isLoading → Loading spinner
  loadError → <div data-testid="load-error">  ←─ NEW
  sprint === null → <div data-testid="dashboard-empty-state">  ←─ testid NEW
  sprint !== null → full dashboard

(feedback/page.tsx follows identical pattern)
```

---

## Focus Trap Architecture

All 4 modals receive an **identical** `useEffect` pattern. No shared utility hook — inline per component to keep isolation clean and avoid creating new abstractions.

```
Modal open event
  ↓
useEffect([open]) fires
  ↓
querySelectorAll(focusable selector)
  → captures [first, last] focusable elements
  ↓
addEventListener('keydown', handleKeyDown)
  → Tab on last → focus first
  → Shift+Tab on first → focus last
  ↓
first.focus() — initial focus moves into modal
  ↓
Modal close event (handleClose called)
  ↓
removeEventListener (returned from useEffect cleanup)
  ↓
triggerRef.current?.focus() — focus returns to opener
```

**Why no shared hook**: Sprint 5 is additive-only; creating a new `useFocusTrap` hook would introduce a new abstraction beyond the AC scope. Inline pattern is minimal, readable, and testable.

---

## Isolation Constraints (Sprint 5)

| Constraint | Rule |
|---|---|
| API routes | READ-ONLY — no changes |
| `src/lib/db.ts` | READ-ONLY — no changes |
| `src/services/*` | READ-ONLY — no changes |
| `src/types/index.ts` | READ-ONLY — no changes |
| `src/lib/models/*` | READ-ONLY — no changes |
| `Shell.tsx` | READ-ONLY — Sprint 4 already added Sprint Setup nav |
| `src/components/ActionItemCard.tsx` | READ-ONLY — no interactive elements missing testids |
| `src/components/FeedbackColumn.tsx` | READ-ONLY — no interactive elements missing testids |
| `src/components/FeedbackCard.tsx` | READ-ONLY — no interactive elements missing testids |
| Sprint 1–4 test files | READ-ONLY — never modify existing tests |
| `src/app/sprint-setup/page.tsx` | READ-ONLY (Sprint 4 builds it) |

---

## Architecture Summary — Sprint 5

| Dimension | Decision |
|---|---|
| New files | 1 (`errorHandling.test.tsx`) |
| Modified files | 7 (`dashboard`, `feedback`, `actions` pages + 4 modals) |
| New components | 0 |
| New API routes | 0 |
| New services | 0 |
| New shared hooks | 0 |
| New types | 0 |
| Pattern introduced | Focus trap + return focus (inline `useEffect`, 4× reused) |
| Error state pattern | Same as `actions/page.tsx` — `loadError` state + early return render |
| Auth guard pattern | Same as existing 3 pages — no changes needed |
| Regression risk | Low — additive only; no logic refactoring |
