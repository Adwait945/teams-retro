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

## Sprint 7

**Mode**: [ARCHITECT]
**Sprint**: 7 — Points Engine, Badge Engine, Leaderboard Rebuild, Dashboard Enhancement
**Generated from**: `docs/FEATURE_REQUIREMENTS.md` (Sprint 7 section), direct read of
`src/types/index.ts`, `src/lib/models/*`, `src/lib/db.ts`, `src/lib/utils/windowFilter.ts`,
`src/components/layout/Shell.tsx`, all Epic 7.1-touched API routes, `src/app/dashboard/page.tsx`,
`src/services/*`
**ADRs**: `ADR-0001` through `ADR-0006` (see `docs/adrs/`)
**Note on `retro-store.tsx`/Sprint-1-era isolation notes above**: superseded for the routes/pages
this sprint touches (`Shell.tsx` is now the real, in-use layout — the old isolation table's
"Sprint 1" framing predates Scope 2/3 migration of `/feedback`, `/action-items` onto `Shell`).

### Table of Contents

1. [Component Inventory](#component-inventory-sprint-7)
2. [Data Flow](#data-flow-sprint-7)
3. [API Specs](#api-specs-sprint-7)
4. [Business Rule Enforcement](#business-rule-enforcement-sprint-7)
5. [Isolation Constraints](#isolation-constraints-sprint-7)
6. [Breaking Change Register](#breaking-change-register-sprint-7)
7. [Open Questions Resolved](#open-questions-resolved-sprint-7)

---

### Component Inventory (Sprint 7)

#### Types (prerequisite — modify only, no new file)

| File | Change |
|---|---|
| `src/types/index.ts` | Targeted rewrite per PRODUCT's Type System Changes spec verbatim: remove old `Badge`/`PointAction`/`POINT_VALUES`/`BADGES`; add new `PointAction` (6 underscored values), `POINT_VALUES`, `PointEvent` (`_id, userId, podId, action, points, relatedId?, createdAt`), `BadgeType` (6 values), `Badge` (`_id, userId, podId, type, earnedAt`), `BADGE_DEFINITIONS`. Remove `User.badges`. `User.totalPoints` untouched in type (still `number`). All other exports (`FeedbackCategory`, `FeedbackItem`, `ActionItem`, `CATEGORY_CONFIG`) byte-for-byte unchanged. |

#### New Mongoose Models

| File | Purpose | Lines (target) |
|---|---|---|
| `src/lib/models/PointEvent.ts` | Schema: `userId` (String, required), `podId` (String, required), `action` (String, required, enum 6 values), `points` (Number, required, signed), `relatedId` (String, optional), `createdAt` (Date, default `Date.now`). Guard pattern per existing model convention. Index: `{ userId: 1, createdAt: -1 }` for the windowed-sum query pattern (non-unique, performance only). | ~25 |
| `src/lib/models/Badge.ts` | Schema: `userId`, `podId` (String, required), `type` (String, required, enum 6 `BadgeType` values), `earnedAt` (Date, default `Date.now`). Two indexes: (1) unique `{ userId: 1, type: 1, podId: 1 }` with `partialFilterExpression: { type: { $ne: 'pod_champion' } }`; (2) unique `{ type: 1, podId: 1 }` with `partialFilterExpression: { type: 'pod_champion' }`. | ~30 |

#### New Server-Only Engine Modules (`src/lib/`, see ADR-0005)

| File | Exports | Purpose | Lines (target) |
|---|---|---|---|
| `src/lib/pointsEngine.ts` | `recordPointEvent(input): void`, `getPodLeaderboard(podId, window): Promise<PointsRow[]>` | Central, sole writer of `PointEvent` documents; fault-isolated + fire-and-forget per ADR-0004; increments `User.totalPoints` per ADR-0001; chains `evaluateBadges()` per ADR-0003; shared leaderboard aggregation reused by `GET /api/points` and Pod Champion badge check. | ~130 |
| `src/lib/badgeEngine.ts` | `evaluateBadges(userId, podId): Promise<void>` | Orchestrates the 6 badge checks (5 permanent + Pod Champion). Imports check functions from `badgeChecks.ts` if the 200-line cap requires the split (see below). | ~150 (or ~70 if split) |
| `src/lib/badgeChecks.ts` *(conditional split)* | `checkFeedbackMachine`, `checkActionTaker`, `checkInnovator`, `checkProblemSolver`, `checkConsensusBuilder` (5 pure async functions, one per permanent badge, each returns `boolean` "qualifies") | Extracted only if `badgeEngine.ts` would otherwise exceed 200 lines once Pod Champion tie-break logic (AC-7.2.10) is included. DEV should create this split proactively — the 5 checks plus orchestration plus Pod Champion logic is estimated to exceed 200 lines in a single file. | ~110 |

#### New API Routes

| File | Method/Path | Purpose |
|---|---|---|
| `src/app/api/points/route.ts` | `GET /api/points?pod=X&window=7d\|30d\|all` | Returns ranked per-user points for a pod/window. Delegates to `pointsEngine.getPodLeaderboard()`. |
| `src/app/api/badges/route.ts` | `GET /api/badges?userId=X` or `GET /api/badges?podId=X` | Returns `Badge` documents filtered by whichever query param is present. |

#### Modified API Routes (Epic 7.1 — add `recordPointEvent()` call; Epic 7.2 — none directly, badges fire via `pointsEngine`)

| File | Change |
|---|---|
| `src/app/api/feedback/route.ts` (`POST`) | After `await item.save()`, call `recordPointEvent({ userId: item.authorId, podId: <author's User.pod>, action: 'submit_feedback', relatedId: String(item._id) })`. Requires one `User.findById(item.authorId)` lookup for `podId` (or the client-supplied `authorId`'s pod, cached from the request if the author is the requester — simplest: always look up via `User.findById`, since this handler has no session/auth context to trust a client-supplied pod). |
| `src/app/api/feedback/[id]/upvote/route.ts` (`PATCH`) | After `await item.save()` in the "added" branch: `recordPointEvent({ userId: item.authorId, podId: <author's pod>, action: 'receive_upvote', relatedId: String(item._id) })`. In the "removed" branch: same but `action: 'remove_upvote'`. `points` sign comes from `POINT_VALUES[action]` inside `recordPointEvent` — callers never pass a literal point value. |
| `src/app/api/actions/route.ts` (`POST`) | After the existing `sourceFeedbackId` push-back block, if `safeBody.sourceFeedbackId` is present: look up that `FeedbackItem`, resolve its `authorId`'s `User.pod`, and call `recordPointEvent({ userId: feedback.authorId, podId, action: 'convert_action', relatedId: String(action._id) })` — targets the true author even when `feedback.isAnonymous === true` (ADR-0006 / Decision A1/S3-1). No call at all when `sourceFeedbackId` is absent (standalone creation). |
| `src/app/api/actions/[id]/advance/route.ts` (`PATCH`) | Only when `nextStatus === 'completed'`, after `await item.save()`: `recordPointEvent({ userId: item.ownerId, podId: <owner's pod>, action: 'complete_action', relatedId: String(item._id) })`. |
| `src/app/api/actions/[id]/verify/route.ts` (`PATCH`) | **Request body extended** — now accepts `{ impactNote, userId }` (see Breaking Change Register). Validates `userId` present (400 if missing) in addition to existing `impactNote` validation. After `await item.save()`: `recordPointEvent({ userId: body.userId, podId: <verifier's pod>, action: 'verify_action', relatedId: String(item._id) })` — credits the verifier, not `item.ownerId`. |
| `src/app/api/actions/[id]/regress/route.ts` | **Unmodified** — confirmed no `PointEvent` write of any kind, per AC-7.1.10. |
| `src/app/api/users/route.ts` (`GET`) | Bug fix (ADR-0006): honor an existing-but-ignored `pod` query param — `const pod = req?.nextUrl?.searchParams?.get('pod'); const query = pod ? { pod } : (username ? { username } : {})`. Additive, backward compatible when `pod` param absent. |

#### New/Modified UI Components

| File | Props / Interface | Parent | Data Source |
|---|---|---|---|
| `src/app/leaderboard/page.tsx` | none (page component) | Next.js router (`/leaderboard`) | `GET /api/points`, `GET /api/badges?podId=X`, `getCurrentUser()` |
| `src/components/leaderboard/RankCard.tsx` | `{ rank: number; row: PointsRow; badges: Badge[]; isCurrentUser: boolean }` | `leaderboard/page.tsx` | Props only (pure) |
| `src/components/leaderboard/PointsGuideCard.tsx` | none | `leaderboard/page.tsx` | `POINT_VALUES` (static import) |
| `src/components/leaderboard/BadgesReferenceCard.tsx` | none | `leaderboard/page.tsx` | `BADGE_DEFINITIONS` (static import) |
| `src/components/dashboard/PodMvpSection.tsx` | `{ pointsData: PointsRow[] \| null; isLoading: boolean }` | `dashboard/page.tsx` | Props (fetched by parent) |
| `src/components/dashboard/CategoryBreakdownSection.tsx` | `{ current: FeedbackItem[]; prior: FeedbackItem[] \| null; window: '7d'\|'30d'\|'all' }` | `dashboard/page.tsx` | Props (derived from already-fetched `feedbackItems` + a prior-period fetch) |
| `src/components/dashboard/TopVotedFeedbackSection.tsx` | `{ items: FeedbackItem[] }` | `dashboard/page.tsx` | Props (derived, sorted/sliced from `feedbackItems`) |
| `src/components/dashboard/VerifiedImprovementsSection.tsx` | `{ items: ActionItem[] }` | `dashboard/page.tsx` | Props (derived from `actionItems`) |
| `src/app/dashboard/page.tsx` | *(modified)* | — | Adds the 4 new sections below existing metrics grid + activity feed; adds independent `/api/points` fetch (ADR-0002); existing sections/testids untouched |

**Rationale for extracting Dashboard sections into `src/components/dashboard/*`**: `dashboard/page.tsx` is
already ~235 lines. Inlining 4 new sections would blow well past the 200-line cap. Each section is a small,
single-responsibility presentational component that receives already-fetched/derived data as props — no
component below does its own fetching except implicitly via parent-supplied props, keeping the fetch/derive
logic centralized in the page per the Sprint 1 "pages own data fetching" convention.

---

### Data Flow (Sprint 7)

#### Points Pipeline (write path — e.g. `submit_feedback`)

```
POST /api/feedback (route handler)
  → connectDB()
  → validate body → new FeedbackItemModel(...).save()   [PRIMARY — awaited]
  → User.findById(authorId) → resolve podId              [awaited, needed for podId]
  → recordPointEvent({ userId, podId, action: 'submit_feedback', relatedId })  [NOT awaited]
        (inside pointsEngine.ts, all internal, never surfaces to caller)
        → PointEvent.create({ userId, podId, action, points: POINT_VALUES[action], relatedId })
        → .then(() => User.findByIdAndUpdate(userId, { $inc: { totalPoints: points } }))
        → .then(() => evaluateBadges(userId, podId))     [chained per ADR-0003]
        → .catch(err => console.error(...))               [fault isolation per ADR-0004]
  → return NextResponse.json(item, { status: 201 })       [UNAFFECTED by the above]
```

#### Points Pipeline (read path — Leaderboard / Dashboard Pod MVP)

```
GET /api/points?pod=X&window=Y
  → connectDB()
  → validate window via getWindowFilter(window)  [reused utility, 400 on invalid]
  → validate pod present  [400 if missing]
  → pointsEngine.getPodLeaderboard(pod, window)
        → User.find({ pod }).lean()                      [resolve pod's user set — ADR-0006]
        → for each user: PointEvent aggregate sum where userId ∈ set,
          split into windowPoints (createdAt in window) and allTimePoints (no filter)
        → sort by windowPoints desc
  → return [{ userId, name, avatar, windowPoints, allTimePoints }, ...]
```

`src/app/leaderboard/page.tsx` and `src/app/dashboard/page.tsx` (Pod MVP section) both independently
`fetch()` this endpoint — no shared client-side cache/hook (ADR-0005: each page owns its own fetch,
consistent with existing Dashboard/Feedback Board precedent).

#### Badge Pipeline

```
evaluateBadges(userId, podId)   [invoked only via the chain above — never awaited by route handlers]
  → connectDB()
  → run 5 permanent checks (badgeChecks.ts), each:
        query PointEvent / FeedbackItem / ActionItem per Epic 7.2 AC-5..AC-9
        if qualifies AND no existing Badge{userId,type,podId} → Badge.create(...)
        (unique index is the hard backstop against double-award races)
  → Pod Champion check:
        pointsEngine.getPodLeaderboard(podId, '30d') → currentTop = result[0]
        existing = Badge.findOne({ podId, type: 'pod_champion' })
        if !existing → Badge.create({ userId: currentTop.userId, podId, type: 'pod_champion' })
        else if existing.userId !== currentTop.userId → tie-break check (earliest qualifying
          PointEvent.createdAt among tied totals) → delete existing, create new
        else → no-op
  → resolves (Promise<void>) — never throws for "already holds badge" no-ops
```

`GET /api/badges?userId=X` and `GET /api/badges?podId=X` are pure reads with no engine involvement —
straight `Badge.find({...}).lean()` queries in the route handler.

---

### API Specs (Sprint 7)

#### `GET /api/points`

| | |
|---|---|
| Query params | `pod` (required, string — the `User.pod` value), `window` (optional, `'7d'\|'30d'\|'all'`, default behavior mirrors `getWindowFilter(null)` → treated as `'all'` if omitted, but the AC requires the param be present in practice; ARCHITECT recommends **requiring `window` explicitly** — 400 if the param is missing entirely, to avoid ambiguous default behavior diverging from the Leaderboard's own explicit toggle state) |
| Response 200 | `{ userId: string; name: string; avatar: string; windowPoints: number; allTimePoints: number }[]`, sorted desc by `windowPoints` |
| 400 | `{ error: string }` — missing `pod`, missing/invalid `window` |
| 500 | `{ error: string }` — DB failure |

#### `GET /api/badges`

| | |
|---|---|
| Query params | Exactly one of `userId` or `podId` (string) |
| Response 200 | `Badge[]` (as defined in `src/types/index.ts`), `_id` normalized to string |
| 400 | `{ error: string }` — neither `userId` nor `podId` supplied |
| 500 | `{ error: string }` — DB failure |

#### `POST /api/feedback` (modified — response/status unchanged, side effect added)

| | |
|---|---|
| Request body | Unchanged: `{ category, content, authorId, isAnonymous?, suggestion? }` |
| Response 201 | Unchanged: the created `FeedbackItem` |
| 400 / 422 | Unchanged |
| **New side effect** | `recordPointEvent(...)` fired post-save, not reflected in response body or status — verified only via mocking `PointEvent.create`/`recordPointEvent` in tests, not via response shape |

#### `PATCH /api/feedback/[id]/upvote` (modified — response/status unchanged, side effect added)

| | |
|---|---|
| Request body | Unchanged: `{ userId }` |
| Response 200 | Unchanged: `{ upvotes, upvotedBy, toggled }` |
| 400 / 403 / 404 | Unchanged |
| **New side effect** | `recordPointEvent(..., action: 'receive_upvote' \| 'remove_upvote')` fired post-save based on `toggled` |

#### `POST /api/actions` (modified — response/status unchanged, side effect conditional)

| | |
|---|---|
| Request body | Unchanged: `{ title, ownerId, description?, sourceFeedbackId?, sourceQuote?, dueDate? }` |
| Response 201 | Unchanged: the created `ActionItem` |
| 400 | Unchanged |
| **New side effect** | `recordPointEvent(..., action: 'convert_action')` fired **only if** `sourceFeedbackId` present; no side effect for standalone creation |

#### `PATCH /api/actions/[id]/advance` (modified — response/status unchanged, side effect conditional)

| | |
|---|---|
| Request body | Unchanged: none (no body read today) |
| Response 200 | Unchanged: the updated `ActionItem` |
| 404 / 409 | Unchanged |
| **New side effect** | `recordPointEvent(..., action: 'complete_action')` fired **only when** `nextStatus === 'completed'` |

#### `PATCH /api/actions/[id]/verify` — **BREAKING CHANGE**

| | |
|---|---|
| Request body | **Changed**: `{ impactNote: string; userId: string }` (was `{ impactNote: string }`) |
| Response 200 | Unchanged: the updated `ActionItem` |
| 400 | **New case added**: missing/empty `userId` → `{ error: 'userId is required' }` (alongside existing missing `impactNote` 400) |
| 404 / 409 | Unchanged |
| **New side effect** | `recordPointEvent({ userId: body.userId, ..., action: 'verify_action' })` fired post-save — credits the request's `userId`, not `item.ownerId` |

#### `GET /api/users` (modified — bug fix, additive)

| | |
|---|---|
| Query params | **Now honored**: `pod` (previously silently ignored); `username` (unchanged, existing behavior) |
| Response 200 | Unchanged shape: `User[]` |
| Behavior change | When `?pod=X` is supplied, returns only users where `pod === X` (previously returned all users regardless) — see ADR-0006 |

---

### Business Rule Enforcement (Sprint 7)

| Rule (AC) | Enforcement Point |
|---|---|
| AC-TYPES-1..10 (type shapes) | `src/types/index.ts` compile-time shapes; `npx tsc --noEmit` gate |
| AC-7.1.1 (PointEvent schema) | `src/lib/models/PointEvent.ts` Mongoose schema (`enum`, `required`) |
| AC-7.1.2/3/4/6/7 (point-event writes per action) | Route handlers (call sites), actual point math in `POINT_VALUES` (types file), write mechanics in `pointsEngine.recordPointEvent` |
| AC-7.1.5 (no convert_action for standalone) | `POST /api/actions` handler — `if (safeBody.sourceFeedbackId)` guard |
| AC-7.1.8/9 (GET /api/points shape + math) | `src/app/api/points/route.ts` (validation, shape) + `pointsEngine.getPodLeaderboard` (aggregation math) |
| AC-7.1.10 (no clawback on regress) | Enforced by omission — `regress/route.ts` is never modified to call `recordPointEvent`; verified by a negative test asserting zero `PointEvent` writes |
| AC-7.2.1/2/3 (Badge schema + unique indexes) | `src/lib/models/Badge.ts` — `partialFilterExpression` indexes are the hard backstop against duplicate awards, not just application logic |
| AC-7.2.4 (evaluateBadges signature/invocation) | `src/lib/badgeEngine.ts` signature; invocation is exclusively via `pointsEngine.recordPointEvent`'s internal chain (ADR-0003) — no route handler calls `evaluateBadges` directly |
| AC-7.2.5..9 (5 permanent badge thresholds) | `src/lib/badgeChecks.ts` (or inline in `badgeEngine.ts` if unsplit) — one function per badge, each does its own existence check before create (belt-and-suspenders with the unique index) |
| AC-7.2.10 (Pod Champion delete+recreate + tie-break) | `src/lib/badgeEngine.ts` — explicit two-step delete-then-create (never an upsert), reusing `pointsEngine.getPodLeaderboard` |
| AC-7.2.11/12 (GET /api/badges) | `src/app/api/badges/route.ts` — param validation (400 if neither `userId` nor `podId`) |
| AC-7.3.1..12, AC-UI-7.3.* (Leaderboard) | `src/app/leaderboard/page.tsx` + `src/components/leaderboard/*` — client-side rendering logic; window toggle re-fetch; empty state condition (`allTimePoints === 0` for all rows, per PRODUCT's AC-7.3.11 clarification) |
| AC-7.4.1..8, AC-UI-7.4.* (Dashboard additions) | `src/app/dashboard/page.tsx` (fetch/derive orchestration) + `src/components/dashboard/*` (rendering); delta math (AC-7.4.3/4) lives in a small pure helper `src/lib/utils/categoryDelta.ts` (new, ~30 lines) to keep `dashboard/page.tsx` under the line cap and to make the divide-by-zero-safe delta formula independently unit-testable |
| Points/badges must not block or fail primary action | `pointsEngine.recordPointEvent` (ADR-0004) — enforced structurally (`void` return, internal `.catch()`), verified by TEST mocking `PointEvent.create` to throw and asserting 201/200 responses are unaffected |
| Fire-and-forget badge evaluation | `pointsEngine.recordPointEvent`'s internal `.then()` chain into `evaluateBadges` (ADR-0003) — never awaited by any route handler |

---

### Isolation Constraints (Sprint 7)

| Constraint | Rule |
|---|---|
| `src/app/feedback/page.tsx`, `src/app/action-items/page.tsx` | **UI unchanged** — Epic 7.1 only touches the underlying API route handlers (server-side side effects), never the page components or their existing tests. `feedbackBoard.test.tsx` / `actionItems.test.tsx` assertions on response *shape* remain valid since response shapes are unchanged for every route except `verify`. |
| `src/app/dashboard/page.tsx` existing sections | Metrics grid + Activity Feed: same `data-testid`s, same computation logic, same `isLoading`/`loadError` gate for the pre-existing fetch (ADR-0002) — AC-7.4.8 is a hard constraint, not a suggestion. |
| `src/components/layout/Shell.tsx` | **Not modified.** Leaderboard imports and wraps in it exactly as Dashboard/Feedback/Actions do; no new nav item is added to `BASE_NAV`/`POD_SETTINGS_NAV` in this sprint (out of scope — Leaderboard is reachable via direct URL `/leaderboard` in Sprint 7; adding a sidebar nav entry is a candidate follow-up but not blocking Definition of Done, since no AC in `FEATURE_REQUIREMENTS.md` Sprint 7 section requires a nav link). **Flagged for DEV/REVIEWER**: verify with PRODUCT whether a nav link should be added; if required, it is a 1-line addition to `BASE_NAV` in `Shell.tsx` and should be called out explicitly as a Shell modification if done. |
| `src/lib/models/FeedbackItem.ts`, `ActionItem.ts`, `User.ts` | **Schema fields unchanged** except the two new indexes on the two new models — no field added to these three existing schemas (in particular, no `podId` added to `FeedbackItem`/`ActionItem` per ADR-0006's explicit scope boundary). |
| `src/lib/db.ts`, `src/lib/utils/windowFilter.ts` | **Reused, not modified.** `getWindowFilter` already recognizes exactly `'7d'|'30d'|'all'`, matching Sprint 7's needs with no changes required. |
| `src/app/api/actions/[id]/regress/route.ts` | **Not modified at all** (confirmed no `PointEvent` writes, per AC-7.1.10). |
| Existing test files | `src/__tests__/actionItems.test.tsx`, `feedbackBoard.test.tsx`, `dashboard.test.tsx`, `actionService.test.ts`, `feedbackService.test.ts`, `userApi.test.ts` should require **zero modifications** except: (a) any test that calls `verifyImpact`/`POST .../verify` with the old `{ impactNote }`-only body will need updating for the new required `userId` field — this is the one intentional, unavoidable existing-test touch, confined to `actionItems.test.tsx`'s verify-flow assertions and `src/services/actionService.ts`'s `verifyImpact()` signature. |

---

### Breaking Change Register (Sprint 7)

| # | Change | Risk | Mitigation |
|---|---|---|---|
| 1 | `PATCH /api/actions/[id]/verify` request body gains a required `userId` field | **High** — any existing caller sending only `{ impactNote }` now gets a 400 | `src/services/actionService.ts`'s `verifyImpact(itemId, impactNote)` signature must become `verifyImpact(itemId, impactNote, userId)`; the one call site (`VerifyImpactModal`'s submit handler, wired via `actions/page.tsx`'s `handleVerifySubmit`) must be updated to pass `getCurrentUser()._id` as the new argument. DEV must grep for all callers of `verifyImpact(` before changing the signature. |
| 2 | `GET /api/users?pod=X` behavior changes from "ignored" to "enforced" | **Low** — no existing caller currently depends on the param being ignored (confirmed via repo-wide read); Dashboard's existing call already sends `?pod=X` expecting it to filter | None needed beyond the fix itself; flagged for REVIEWER visibility since it's a query-param semantics change even though no test currently locks in the broken behavior |
| 3 | `src/types/index.ts` — `Badge`, `PointAction`, `POINT_VALUES`, `BADGES`, `User.badges` removed/renamed | **Medium, contained** — any file importing the old shapes fails `tsc --noEmit` until updated. A repo-wide grep confirms **no current file outside `src/types/index.ts` itself references `BADGES`, the old `PointAction` values, or `User.badges`** — Sprint 1-7 code never consumed the stub gamification types, so this is a clean removal with no downstream breakage expected. | DEV re-runs `npx tsc --noEmit` as the Type System Changes completion gate before starting Epic 7.1, per the Pre-Flight section of `FEATURE_REQUIREMENTS.md`. |
| 4 | New required indexes on `Badge` collection | **Low** — new collection, no existing data to conflict with unique constraints | N/A — only a risk if DEV seeds test/demo data with duplicate `(userId, type, podId)` combinations before the index exists; ensure model file (with indexes) is created before any seed script runs |

---

### Open Questions Resolved (Sprint 7)

| # | Question (from PRODUCT) | Resolution |
|---|---|---|
| 1 | Missing `MVP_SCOPE_DECISIONS.md`/`PRODUCT_THINKING_SESSION.md` | Not recovered/recreated. Backlog's inline prose (as already captured verbatim in `FEATURE_REQUIREMENTS.md`) is treated as authoritative for Decisions S3-1, S3-6, S3-8 referenced by Epics 7.1/7.2/7.4. Recommend PRODUCT confirm at next planning cycle whether these should be formally recreated as standalone docs or the citations should be scrubbed from future backlogs — not a blocker for Sprint 7 delivery. |
| 2 | Verify route payload shape | Resolved — see Breaking Change Register #1 and the `PATCH /api/actions/[id]/verify` API Spec above. `{ impactNote, userId }`, `userId` required, 400 if missing. |
| 3 | `User.totalPoints` write mechanism | Resolved via ADR-0001 — atomic `$inc` on every `PointEvent` write, write-only from Sprint 7 UI's perspective (no Sprint 7 component reads it; `GET /api/points` is the read source of truth). |
| 4 | Dashboard loading-state architecture | Resolved via ADR-0002 — hybrid model: existing single `isLoading` gate untouched for pre-existing sections; new, independent `isLoadingPoints` boolean scoped only to the Pod MVP section (the only new section with its own network call). |
| 5 | Fire-and-forget badge evaluation invocation | Resolved via ADR-0003 — `evaluateBadges()` is never called directly by route handlers; it's chained via `.then()` inside `pointsEngine.recordPointEvent()`, itself un-awaited by every call site. |
| 6 (new, ARCHITECT-surfaced) | `podId` derivation / pod-scoping of existing collections | Resolved via ADR-0006 — `podId` is always `User.pod`; `GET /api/users` pod-filter bug fixed as an in-scope side effect; `FeedbackItem`/`ActionItem` pod-scoping explicitly deferred to a future sprint, not silently expanded into Sprint 7. |
| 7 (new, ARCHITECT-surfaced) | Whether points/badges warrant a `src/services/` file | Resolved via ADR-0005 — no; `src/lib/pointsEngine.ts`/`badgeEngine.ts` are server-only, following the `db.ts`/`models/` convention; Leaderboard/Dashboard call `fetch()` directly, consistent with existing Dashboard precedent. |
| 8 (new, ARCHITECT-surfaced) | Whether Leaderboard needs a `Shell.tsx` nav link | **Not resolved by ARCHITECT** — flagged in Isolation Constraints above as a question for PRODUCT/REVIEWER; not blocking Sprint 7 Definition of Done since no AC requires it, but likely a fast follow. |
