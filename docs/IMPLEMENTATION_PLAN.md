# Implementation Plan — Sprint 1: Foundation

**Mode**: [ARCHITECT]  
**Sprint**: 1 — Types, MongoDB Data Layer, Registration, Dashboard  
**References**: `docs/FEATURE_REQUIREMENTS.md`, `docs/Sprint1.md`, `docs/ARCHITECTURE_DESIGN.md`  
**Date**: April 10, 2026

---

## Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Pre-Sprint Checklist](#pre-sprint-checklist)
3. [DEV Session 1 — Types + DB Connection + Models](#dev-session-1--types--db-connection--models)
4. [DEV Session 2 — API Routes + User Service + Registration Page](#dev-session-2--api-routes--user-service--registration-page)
5. [DEV Session 3 — Shell + Action Service + Dashboard + Tests](#dev-session-3--shell--action-service--dashboard--tests)
6. [Cross-Session Constraints](#cross-session-constraints)
7. [Acceptance Criteria Traceability Matrix](#acceptance-criteria-traceability-matrix)
8. [Definition of Done Checklist](#definition-of-done-checklist)

---

## Sprint Overview

| Attribute | Value |
|---|---|
| Theme | Types, MongoDB Data Layer, Registration, Dashboard |
| DEV Sessions | 3 |
| Total target lines | ~1,010 |
| Primary new dependency | `mongoose` (must be installed before Session 1 begins) |
| Isolated (do not touch) | `retro-store.tsx`, `sidebar.tsx`, `feedback/`, `action-items/`, `leaderboard/`, `digest/` |

---

## Pre-Sprint Checklist

These steps must be completed by the project owner **before** any DEV session begins. No DEV task may start until all items are checked.

| # | Task | Owner | Verified? |
|---|---|---|---|
| P-1 | MongoDB Atlas cluster `teams-retro` created (free tier M0) | Project owner | ☐ |
| P-2 | Atlas database user created with read/write access | Project owner | ☐ |
| P-3 | `.env.local` file created at repo root with `MONGODB_URI=mongodb+srv://...` | Project owner | ☐ |
| P-4 | `.env.local` confirmed in `.gitignore` (never commit) | Project owner | ☐ |
| P-5 | Mongoose installed: `corepack yarn add mongoose` | Project owner | ☐ |
| P-6 | Jest + React Testing Library installed and configured (needed for Session 2/3 tests) | Project owner | ☐ |
| P-7 | `corepack yarn tsc --noEmit` passes on the unmodified codebase (baseline) | Project owner | ☐ |

---

## DEV Session 1 — Types + DB Connection + Models

**Goal**: Establish the single source of truth for TypeScript types and the complete MongoDB/Mongoose data layer. No UI changes. No API routes yet.

**Target line count**: ~290 lines across 6 files  
**Epic covered**: Epic 1.1 (partial — types + models only)  
**Acceptance Criteria targeted**: AC-1.1.1, AC-1.1.2, AC-1.1.3, AC-1.1.6, AC-1.1.7

---

### Task S1-T1 — Update `src/types/index.ts`

**Action**: Modify (not replace) — surgical field updates only  
**Target lines**: ~80  
**File**: `src/types/index.ts`

**Changes required** (all other content preserved as-is):

| Interface | Field Change | Detail |
|---|---|---|
| `User` | Add `username: string` | Required by Registration AC-1.2.1 |
| `User` | Add `pod: string` | Required by Registration AC-1.2.1 |
| `User` | Add `isAdmin: boolean` | Required by AC-1.2.4 |
| `User` | Add `createdAt: string` | Required by Mongoose model spec |
| `User` | Rename `id` → `_id` | MongoDB document ID convention |
| `Sprint` | Replace `isActive: boolean` with `status: "open" \| "closed"` | Backlog schema |
| `Sprint` | Add `goal: string` | Backlog schema |
| `Sprint` | Add `teamMemberIds: string[]` | Backlog schema |
| `Sprint` | Rename `id` → `_id` | MongoDB document ID convention |
| `FeedbackItem` | Rename `suggestedImprovement` → `suggestion` | Backlog schema |
| `FeedbackItem` | Replace `upvotes: string[]` with `upvotedBy: string[]` + `upvotes: number` | Backlog schema |
| `FeedbackItem` | Rename `id` → `_id` | MongoDB document ID convention |
| `ActionItem` | Rename `feedbackId` → `sourceFeedbackId` | Backlog schema |
| `ActionItem` | Add `sourceQuote: string` | Backlog schema |
| `ActionItem` | Rename `deadline` → `dueDate` | Backlog schema |
| `ActionItem` | Rename `impactDescription` → `impactNote` | Backlog schema |
| `ActionItem` | Rename `id` → `_id` | MongoDB document ID convention |
| `PointEvent` | Keep as stub — no changes | Noted as stub in backlog |
| `Badge` | Keep as stub — no changes | Noted as stub in backlog |

**Breaking change mitigation**: After this change, `retro-store.tsx` will have TypeScript errors on old field names. Add `// @ts-ignore` comments to the specific lines in `retro-store.tsx` that reference renamed fields. Do not modify store logic — comment suppression only.

**Verification**: `corepack yarn tsc --noEmit` → 0 errors.

---

### Task S1-T2 — Create `src/lib/db.ts`

**Action**: Create new file  
**Target lines**: ~30  
**File**: `src/lib/db.ts`

**Implementation spec**:
- Declare a TypeScript global augmentation: `declare global { var mongoose: { conn: typeof import('mongoose') | null; promise: Promise<typeof import('mongoose')> | null } }`
- `global.mongoose` initialized to `{ conn: null, promise: null }` if not already set
- `connectDB()` function:
  - If `global.mongoose.conn` is not null → return cached connection
  - If `global.mongoose.promise` is pending → await it
  - Else → set `global.mongoose.promise = mongoose.connect(process.env.MONGODB_URI!)` → await → cache result
  - Return connection
- Export `connectDB` as named export

**Constraints**:
- `MONGODB_URI` must come exclusively from `process.env.MONGODB_URI` — no fallback string, no hardcoded URI
- If `MONGODB_URI` is undefined, throw a descriptive error: `"MONGODB_URI is not defined in environment variables"`

---

### Task S1-T3 — Create `src/lib/models/User.ts`

**Action**: Create new file  
**Target lines**: ~40  
**File**: `src/lib/models/User.ts`

**Schema fields** (must match `User` interface from S1-T1):

| Field | Mongoose Type | Required | Default |
|---|---|---|---|
| `name` | String | Yes | — |
| `username` | String | Yes | — |
| `pod` | String | Yes | — |
| `isAdmin` | Boolean | Yes | `false` |
| `avatar` | String | No | — |
| `totalPoints` | Number | No | `0` |
| `createdAt` | Date | Yes | `Date.now` |

**Guard**: `export default mongoose.models.User || mongoose.model<User>('User', UserSchema)`

---

### Task S1-T4 — Create `src/lib/models/Sprint.ts`

**Action**: Create new file  
**Target lines**: ~40  
**File**: `src/lib/models/Sprint.ts`

**Schema fields**:

| Field | Mongoose Type | Required | Default |
|---|---|---|---|
| `name` | String | Yes | — |
| `goal` | String | No | — |
| `startDate` | Date | Yes | — |
| `endDate` | Date | Yes | — |
| `status` | String | Yes | Enum: `["open", "closed"]` |
| `teamMemberIds` | [String] | No | `[]` |

**Guard**: `export default mongoose.models.Sprint || mongoose.model<Sprint>('Sprint', SprintSchema)`

---

### Task S1-T5 — Create `src/lib/models/FeedbackItem.ts`

**Action**: Create new file  
**Target lines**: ~50  
**File**: `src/lib/models/FeedbackItem.ts`

**Schema fields**:

| Field | Mongoose Type | Required | Default |
|---|---|---|---|
| `sprintId` | String | Yes | — |
| `authorId` | String | Yes | — |
| `content` | String | Yes | — |
| `category` | String | Yes | Enum: `["slowed-us-down", "should-try", "went-well"]` |
| `isAnonymous` | Boolean | Yes | `false` |
| `suggestion` | String | No | — |
| `upvotedBy` | [String] | No | `[]` |
| `upvotes` | Number | No | `0` |
| `createdAt` | Date | Yes | `Date.now` |
| `actionItemId` | String | No | — |

**Guard**: `export default mongoose.models.FeedbackItem || mongoose.model<FeedbackItem>('FeedbackItem', FeedbackItemSchema)`

---

### Task S1-T6 — Create `src/lib/models/ActionItem.ts`

**Action**: Create new file  
**Target lines**: ~50  
**File**: `src/lib/models/ActionItem.ts`

**Schema fields**:

| Field | Mongoose Type | Required | Default |
|---|---|---|---|
| `sprintId` | String | Yes | — |
| `title` | String | Yes | — |
| `description` | String | No | — |
| `ownerId` | String | Yes | — |
| `status` | String | Yes | Enum: `["open", "in-progress", "completed", "verified"]`, Default: `"open"` |
| `sourceFeedbackId` | String | No | — |
| `sourceQuote` | String | No | — |
| `dueDate` | Date | No | — |
| `impactNote` | String | No | — |
| `createdAt` | Date | Yes | `Date.now` |
| `completedAt` | Date | No | — |

**Guard**: `export default mongoose.models.ActionItem || mongoose.model<ActionItem>('ActionItem', ActionItemSchema)`

---

### Session 1 Completion Gate

Before proceeding to Session 2, confirm:

- [ ] `corepack yarn tsc --noEmit` → exit code 0, 0 diagnostics (AC-1.1.7)
- [ ] All 4 model files exist in `src/lib/models/`
- [ ] `src/lib/db.ts` exists and exports `connectDB`
- [ ] No `mongodb+srv://` string appears in any source file (`grep -r "mongodb+srv" src/` → 0 results)
- [ ] `retro-store.tsx` TypeScript errors suppressed with `// @ts-ignore` — store logic unchanged

---

## DEV Session 2 — API Routes + User Service + Registration Page

**Goal**: Wire the data layer to HTTP endpoints, create the user service, and replace the root page with the Registration form.

**Target line count**: ~340 lines across 5 files  
**Epics covered**: Epic 1.1 (API routes), Epic 1.2 (Registration), test scaffolding for Epic 1.1  
**Acceptance Criteria targeted**: AC-1.1.4, AC-1.1.5, AC-1.2.1–AC-1.2.6, AC-UI-1.2.1–AC-UI-1.2.13

---

### Task S2-T1 — Create `src/app/api/users/route.ts`

**Action**: Create new file  
**Target lines**: ~50  
**File**: `src/app/api/users/route.ts`

**Implementation spec**:

```
GET handler:
  await connectDB()
  users = await UserModel.find({}).lean()
  return NextResponse.json(users, { status: 200 })

POST handler:
  await connectDB()
  body = await req.json()
  if !body.name || !body.username || !body.pod → return { error: "..." }, 400
  count = await UserModel.countDocuments()
  isAdmin = count === 0
  user = new UserModel({ ...body, isAdmin })
  await user.save()
  return NextResponse.json(user, { status: 201 })
```

**Constraints**:
- Import `connectDB` from `@/lib/db`
- Import `UserModel` from `@/lib/models/User`
- No hardcoded data

---

### Task S2-T2 — Create `src/app/api/sprints/route.ts`

**Action**: Create new file  
**Target lines**: ~50  
**File**: `src/app/api/sprints/route.ts`

**Implementation spec**:

```
GET handler:
  await connectDB()
  sprint = await SprintModel.findOne({ status: "open" }).lean()
  return NextResponse.json(sprint ?? [], { status: 200 })

POST handler:
  await connectDB()
  body = await req.json()
  if !body.name || !body.startDate || !body.endDate → return { error: "..." }, 400
  sprint = new SprintModel({ ...body, status: body.status ?? "open" })
  await sprint.save()
  return NextResponse.json(sprint, { status: 201 })
```

---

### Task S2-T3 — Create `src/services/userService.ts`

**Action**: Create new file  
**Target lines**: ~60  
**File**: `src/services/userService.ts`

**Implementation spec** (client-side only — no Mongoose imports):

```typescript
const STORAGE_KEY = 'retroboard_user'

export async function registerUser(data: { name: string; username: string; pod: string }): Promise<User>
  // POST /api/users, return parsed JSON on 201, throw on error

export function getCurrentUser(): User | null
  // sessionStorage.getItem(STORAGE_KEY) → JSON.parse or null

export function cacheUser(user: User): void
  // sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))

export async function getAllUsers(): Promise<User[]>
  // GET /api/users, return array
```

**Constraints**:
- `"use client"` is NOT added — this is a plain module, not a React component
- All `fetch()` calls use relative URLs (e.g., `/api/users`)
- `sessionStorage` access is guarded: `typeof window !== 'undefined'`

---

### Task S2-T4 — Replace `src/app/page.tsx` (Registration Page)

**Action**: Replace entire file  
**Target lines**: ~120  
**File**: `src/app/page.tsx`

**Implementation spec**:
- `"use client"` at top
- `useRouter` from `next/navigation`
- On mount (`useEffect`): call `userService.getCurrentUser()` → if not null → `router.push('/dashboard')`
- State: `name` (string), `username` (string), `pod` (string), `isLoading` (boolean), `error` (string | null)
- Submit handler:
  1. Set `isLoading = true`
  2. Call `userService.registerUser({ name, username, pod })`
  3. Call `userService.cacheUser(user)`
  4. `router.push('/dashboard')`
  5. On error: set `error` state, `isLoading = false`
- Submit button disabled: `!name || !username || !pod || isLoading`

**UI structure** (per AC-UI-1.2.x, Tailwind utilities only):

```
<div>  ← full-screen centered, bg-background
  Logo block: Hexagon icon (Lucide) in w-12 h-12 amber-tinted rounded square
  "RetroBoard" bold text
  <Card className="w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-4 duration-500">
    <CardHeader>
      "Welcome to RetroBoard" (center-aligned)
      "Set up your identity to get started." (subtitle)
    </CardHeader>
    <CardContent>
      <Label> + <Input> for "Your Name" (placeholder: "e.g. Jane Doe")
        ← destructive border if error state
        ← inline error text (text-destructive) if conflict
      <Label> + <Input> for "Username"
      <Label> + <Select> for "Pod" (items: Pod 1/pod1, Pod 2/pod2, Pod 3/pod3)
      <Button className="w-full h-11 font-bold" disabled={...}>Join RetroBoard</Button>
      <p className="text-muted-foreground text-xs">
        "Your name and pod are saved to the shared team database. No account required."
      </p>
    </CardContent>
  </Card>
</div>
```

**shadcn/ui components used**: `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription`, `Input`, `Label`, `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `Button`

**Prototype reference**: `docs/prototypes/Registration.tsx` — port structure, add Username field, replace mock submission with `userService.registerUser()`

---

### Task S2-T5 — Modify `src/app/layout.tsx`

**Action**: Minimal modification — remove global sidebar injection  
**Target lines**: Net reduction ~5 lines  
**File**: `src/app/layout.tsx`

**Changes**:
1. Remove `import { Sidebar } from "@/components/sidebar"`
2. Remove `<Sidebar />` JSX element
3. Remove the outer `<div className="flex h-screen overflow-hidden bg-background">` wrapper and its closing `</div>`
4. Keep `<RetroProvider>` wrapper and `<main className="flex-1 overflow-y-auto">` intact

**Why**: The global sidebar conflicts with the Registration page (which must be full-screen) and with `Shell.tsx` (which includes its own sidebar). Existing mock pages (`/feedback`, `/action-items`, etc.) will temporarily lose their sidebar — this is an accepted regression noted in the Breaking Change register (Architecture Design §Breaking Change #1).

**Result after change**:
```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RetroProvider>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </RetroProvider>
      </body>
    </html>
  )
}
```

---

### Task S2-T6 — Create `src/__tests__/userApi.test.ts`

**Action**: Create new file  
**Target lines**: ~60  
**File**: `src/__tests__/userApi.test.ts`

**Test cases** (covers AC-1.1.4):

| Test ID | Description | Assertion |
|---|---|---|
| UA-1 | `GET /api/users` returns HTTP 200 with JSON array | `status === 200`, `Array.isArray(body)` |
| UA-2 | `POST /api/users` with valid body returns HTTP 201 and document | `status === 201`, `body.name === payload.name` |
| UA-3 | First `POST` sets `isAdmin: true` | Mock empty DB → `body.isAdmin === true` |
| UA-4 | Second `POST` sets `isAdmin: false` | Mock non-empty DB (count = 1) → `body.isAdmin === false` |
| UA-5 | `POST /api/users` missing `name` → HTTP 400 | `status === 400` |
| UA-6 | `POST /api/users` missing `username` → HTTP 400 | `status === 400` |

**Mocking approach**:
- Mock `src/lib/db.ts` → `connectDB` is a no-op
- Mock `src/lib/models/User.ts` → mock `countDocuments()`, `save()`, `find()`
- Use `jest.mock()` for model and db

---

### Session 2 Completion Gate

Before proceeding to Session 3, confirm:

- [ ] `GET /api/users` returns 200 + array in local dev (manual test or unit test)
- [ ] `POST /api/users` with `{ name, username, pod }` returns 201 (manual test)
- [ ] First registered user has `isAdmin: true` in Atlas (verify in Atlas dashboard)
- [ ] Registration page renders at `/` with 3 fields
- [ ] Submit button disabled until all 3 fields filled (AC-UI-1.2.2)
- [ ] Successful submit → redirect to `/dashboard` (route not yet built — 404 is acceptable at this point)
- [ ] `sessionStorage['retroboard_user']` is set after submit (verify in browser DevTools)
- [ ] `corepack yarn tsc --noEmit` → 0 errors
- [ ] `layout.tsx` no longer injects global sidebar

---

## DEV Session 3 — Shell + Action Service + Dashboard + Tests

**Goal**: Create the `Shell.tsx` layout component, wire the Action API route and service, build the Dashboard page, and write all remaining tests. `Shell.tsx` is the first task because `dashboard/page.tsx` depends on it.

**Target line count**: ~380 lines across 6 files  
**Epics covered**: Epic 1.3 (Dashboard), test coverage for Epic 1.2 and 1.3  
**Acceptance Criteria targeted**: AC-1.3.1–AC-1.3.5, AC-UI-1.3.1–AC-UI-1.3.14, AC-UI-SHELL-1–8, AC-1.2.x (test coverage)

---

### Task S3-T1 — Create `src/components/layout/Shell.tsx` ← **DEPENDENCY for S3-T4**

**Action**: Create new file  
**Target lines**: ~90  
**File**: `src/components/layout/Shell.tsx`

> **Order note**: This task must be completed before `src/app/dashboard/page.tsx` (S3-T4), because the dashboard page imports `Shell` as its layout wrapper. If Shell does not exist, the dashboard file will not compile.

**Props interface**:
```typescript
interface ShellProps {
  children: React.ReactNode
  sprintName?: string
}
```

**Implementation spec**:

- `"use client"` directive (uses `usePathname`, `sessionStorage`)
- Reads `sessionStorage['retroboard_user']` on mount → stores in `currentUser` state
- Uses `usePathname()` from `next/navigation` for active nav detection

**Layout structure** (per AC-UI-SHELL-1 through AC-UI-SHELL-8):

```tsx
<div className="flex h-screen overflow-hidden bg-background">
  <aside className="w-[240px] flex-shrink-0 flex flex-col h-screen border-r border-border bg-sidebar">
    
    {/* Header — AC-UI-SHELL-2 */}
    <div className="p-6 flex items-center gap-3 font-semibold text-lg tracking-tight">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
        <Hexagon className="w-5 h-5 fill-primary" />
      </div>
      RetroBoard
    </div>

    {/* Sprint label — AC-UI-SHELL-3 */}
    <div className="px-6 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {sprintName ?? ""}
    </div>

    {/* Nav — AC-UI-SHELL-4, 5, 6 */}
    <nav className="flex-1 px-4 space-y-1">
      {NAV_ITEMS.map(item => (
        <Link key={item.href} href={item.href}>
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
            isActive ? "bg-secondary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          )}>
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />}
            <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
            {item.label}
          </div>
        </Link>
      ))}
    </nav>

    {/* User identity card — AC-UI-SHELL-7, 8 */}
    {currentUser && (
      <div className="p-4 mt-auto border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
            {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser.pod}</p>
          </div>
        </div>
      </div>
    )}
  </aside>

  <main className="flex-1 overflow-y-auto p-6">
    {children}
  </main>
</div>
```

**Nav items** (order per AC-UI-SHELL-4):
```typescript
const NAV_ITEMS = [
  { href: "/sprint-setup", label: "Sprint Setup",    icon: Settings },
  { href: "/dashboard",    label: "Dashboard",       icon: LayoutDashboard },
  { href: "/feedback",     label: "Feedback Board",  icon: MessageSquare },
  { href: "/action-items", label: "Action Items",    icon: CheckSquare },
]
```

**Lucide icons used**: `Hexagon`, `Settings`, `LayoutDashboard`, `MessageSquare`, `CheckSquare`

---

### Task S3-T2 — Create `src/app/api/actions/route.ts`

**Action**: Create new file  
**Target lines**: ~50  
**File**: `src/app/api/actions/route.ts`

**Implementation spec**:

```
GET handler:
  await connectDB()
  sprintId = req.nextUrl.searchParams.get('sprintId')
  query = sprintId ? { sprintId } : {}
  actions = await ActionItemModel.find(query).lean()
  return NextResponse.json(actions, { status: 200 })

POST handler:
  await connectDB()
  body = await req.json()
  if !body.sprintId || !body.title || !body.ownerId → return { error: "..." }, 400
  action = new ActionItemModel({ ...body })
  await action.save()
  return NextResponse.json(action, { status: 201 })
```

---

### Task S3-T3 — Create `src/services/actionService.ts`

**Action**: Create new file  
**Target lines**: ~80  
**File**: `src/services/actionService.ts`

**Implementation spec** (client-side only — no Mongoose imports):

```typescript
export async function getActions(sprintId?: string): Promise<ActionItem[]>
  // GET /api/actions?sprintId=sprintId (omit param if undefined)

export function getCompletionRate(actions: ActionItem[]): number
  // completed = actions.filter(a => a.status === "completed" || a.status === "verified").length
  // total = actions.length
  // if total === 0 → return 0
  // return Math.round((completed / total) * 100)

export function getOpenCount(actions: ActionItem[]): number
  // actions.filter(a => a.status === "open" || a.status === "in-progress").length

export function getCompletedCount(actions: ActionItem[]): number
  // actions.filter(a => a.status === "completed" || a.status === "verified").length
```

**Edge case**: `getCompletionRate` must never divide by zero — return `0` when `total === 0` (tested in AC-1.3.4).

---

### Task S3-T4 — Create `src/app/dashboard/page.tsx` ← **Depends on S3-T1 (Shell.tsx)**

**Action**: Create new file  
**Target lines**: ~120  
**File**: `src/app/dashboard/page.tsx`

> **Dependency**: `Shell.tsx` (S3-T1) must be created first. This file imports `Shell` at the top — if Shell does not exist, this file will not compile.

**Implementation spec**:

- `"use client"` at top
- `useRouter` from `next/navigation`
- On mount (`useEffect`):
  1. Guard: `userService.getCurrentUser()` → if null → `router.push('/')`
  2. Fetch: `Promise.all([fetch('/api/sprints'), actionService.getActions()])` → parse JSON
  3. Find active sprint: `sprints.find(s => s.status === "open")` (handle both array and single object response)
  4. Set `sprint`, `actions`, `isLoading = false` state
- State: `sprint: Sprint | null`, `actions: ActionItem[]`, `isLoading: boolean`

**Rendered structure** (per AC-UI-1.3.x):

```tsx
<Shell sprintName={sprint?.name}>
  <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

    {/* Sprint header */}
    {sprint && (
      <div>
        <h1 className="text-2xl font-bold">{sprint.name}</h1>
        <p className="text-sm text-muted-foreground">
          {format(sprint.startDate)} – {format(sprint.endDate)}
        </p>
      </div>
    )}

    {sprint ? (
      <>
        {/* Stat cards — AC-UI-1.3.2, 1.3.3 */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard title="Feedback Count"   value={...} icon={<MessageSquare .../>} />
          <StatCard title="Total Upvotes"    value={...} icon={<ThumbsUp .../>}      />
          <StatCard title="Action Items"     value={actions.length} icon={<CheckSquare .../>} />
          <StatCard title="Completion Rate"  value={`${completionRate}%`} icon={<Activity .../>} />
        </div>

        {/* Two-column grid — AC-UI-1.3.4, 1.3.5, 1.3.6, 1.3.7 */}
        <div className="grid grid-cols-2 gap-8">
          {/* Recent Feedback column */}
          {/* Activity Feed column */}
        </div>
      </>
    ) : (
      <>
        {/* Empty state — AC-UI-1.3.9 through 1.3.13 */}
        <div className="retro-card p-12 text-center bg-secondary/10 border-dashed border-2 border-border/50">
          <h2 className="text-xl font-bold mb-2">No sprint data yet.</h2>
          <p className="text-muted-foreground mb-6">Set up your first sprint to get started.</p>
          <Button onClick={() => router.push('/sprint-setup')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
            Set Up Sprint →
          </Button>
        </div>
        <div className="retro-card p-12 text-center text-muted-foreground border-border/50 bg-secondary/5">
          Activity will appear here once your team starts submitting feedback.
        </div>
      </>
    )}
  </div>
</Shell>
```

**Prototype reference**: `docs/prototypes/Dashboard.tsx` — port structure.  
**Omit**: Sprint MVP banner (out of scope Sprint 1 per Prototype-to-Backlog delta resolution).  
**Does not use**: `useRetro()`, `retro-store.tsx`, `src/components/sidebar.tsx`.

---

### Task S3-T5 — Create `src/__tests__/dashboard.test.tsx`

**Action**: Create new file  
**Target lines**: ~60  
**File**: `src/__tests__/dashboard.test.tsx`

**Test cases** (covers AC-1.3.1–AC-1.3.5):

| Test ID | Description | Assertion |
|---|---|---|
| DB-1 | Renders without crash when sessionStorage has valid user and API returns active sprint | Component mounts, no throw |
| DB-2 | Redirects to `/` when sessionStorage has no user | `router.push('/')` called |
| DB-3 | Renders 4 stat cards with correct labels when sprint is active | All 4 label strings present in DOM |
| DB-4 | Displays correct Completion Rate from mock action data | e.g. 2 completed + 1 verified / 5 total = 60% |
| DB-5 | Renders empty state when no active sprint returned | "No sprint data yet." heading present |
| DB-6 | Empty state does NOT render stat card grid | `.grid-cols-4` grid absent when no sprint |
| DB-7 | `actionService.getCompletionRate([])` returns 0 (no divide-by-zero) | `getCompletionRate([]) === 0` |

**Mocking approach**:
- Mock `global.fetch` for API calls
- Mock `next/navigation` → `useRouter`, `usePathname`
- Pre-seed `sessionStorage` with mock user before each test
- Mock `src/services/userService.ts` → `getCurrentUser`

---

### Task S3-T6 — Create `src/__tests__/registration.test.tsx`

**Action**: Create new file  
**Target lines**: ~70  
**File**: `src/__tests__/registration.test.tsx`

> **Note**: This file is physically created in DEV Session 3 per Sprint1.md session allocation, but it covers Epic 1.2 acceptance criteria.

**Test cases** (covers AC-1.2.1–AC-1.2.6, AC-UI-1.2.2):

| Test ID | Description | Assertion |
|---|---|---|
| REG-1 | Renders page with 3 form fields | Name input, Username input, Pod select all present |
| REG-2 | Pod selector has exactly 3 options | pod1, pod2, pod3 options present |
| REG-3 | Submit button disabled when any field is empty | Button disabled with 0, 1, and 2 fields filled |
| REG-4 | Submit button enabled when all 3 fields filled | Button not disabled |
| REG-5 | Submitting form calls `userService.registerUser` with correct payload | Mock `registerUser` asserted called with `{ name, username, pod }` |
| REG-6 | On successful registration, `sessionStorage.setItem` called with user | Mock `cacheUser` asserted |
| REG-7 | On successful registration, `router.push('/dashboard')` called | Mock router asserted |
| REG-8 | If sessionStorage has existing user on mount, redirects to `/dashboard` | `router.push('/dashboard')` called without form submission |

**Mocking approach**:
- Mock `src/services/userService.ts` → `registerUser`, `getCurrentUser`, `cacheUser`
- Mock `next/navigation` → `useRouter`
- Use `@testing-library/react` for render + `fireEvent`

---

### Session 3 Completion Gate

Before declaring Sprint 1 complete, confirm all Definition of Done items:

- [ ] `src/components/layout/Shell.tsx` exists and renders correctly (sidebar + main content)
- [ ] `src/app/dashboard/page.tsx` renders at `/dashboard`
- [ ] Dashboard shows 4 stat cards with live data from MongoDB
- [ ] Dashboard empty state renders when no sprint has `status: "open"`
- [ ] `corepack yarn tsc --noEmit` → 0 errors
- [ ] `corepack yarn test` → 0 failures
- [ ] `corepack yarn build` → 0 errors
- [ ] All 21 test cases across 3 test files pass

---

## Cross-Session Constraints

These rules apply across all three DEV sessions:

| # | Rule |
|---|---|
| C-1 | Never import from `src/store/retro-store.tsx` in any Sprint 1 new file |
| C-2 | Never import `mongoose` in any `src/services/` file or `src/app/page.tsx` / `src/app/dashboard/page.tsx` |
| C-3 | Never hardcode a MongoDB URI string in any file |
| C-4 | Never modify `src/data/mock-data.ts` |
| C-5 | Never modify `src/components/sidebar.tsx` |
| C-6 | Never modify `src/app/feedback/`, `action-items/`, `leaderboard/`, `digest/` pages |
| C-7 | `_id` (not `id`) is used as the primary identifier in all MongoDB documents and TypeScript interfaces |
| C-8 | shadcn/ui component imports come from `@/components/ui/` — do not install new UI libraries |
| C-9 | Tailwind utility classes only — no `<style>` tags, no inline styles |
| C-10 | `Shell.tsx` must be created before `dashboard/page.tsx` in the same DEV session |

---

## Acceptance Criteria Traceability Matrix

| AC-ID | Criterion Summary | DEV Session | Task(s) | Test Coverage |
|---|---|---|---|---|
| AC-1.1.1 | `types/index.ts` defines all 4 types | Session 1 | S1-T1 | `tsc --noEmit` |
| AC-1.1.2 | `connectDB()` singleton reuses connection | Session 1 | S1-T2 | Manual / Jest unit |
| AC-1.1.3 | 4 Mongoose models exist and match types | Session 1 | S1-T3–T6 | `tsc --noEmit` |
| AC-1.1.4 | `GET/POST /api/users` | Session 2 | S2-T1 | `userApi.test.ts` UA-1–6 |
| AC-1.1.5 | `GET/POST /api/sprints` | Session 2 | S2-T2 | Manual test |
| AC-1.1.6 | No hardcoded `MONGODB_URI` | All sessions | All | `grep` check |
| AC-1.1.7 | `tsc --noEmit` passes | All sessions | All | CI gate |
| AC-1.2.1 | Registration at `/` with 3 fields | Session 2 | S2-T4 | REG-1 |
| AC-1.2.2 | Pod selector has 3 options | Session 2 | S2-T4 | REG-2 |
| AC-1.2.3 | Submit calls `userService.registerUser()` | Session 2 | S2-T3, S2-T4 | REG-5 |
| AC-1.2.4 | First user is admin | Session 2 | S2-T1 | UA-3, UA-4 |
| AC-1.2.5 | Success → sessionStorage + redirect | Session 2 | S2-T3, S2-T4 | REG-6, REG-7 |
| AC-1.2.6 | Skip form if sessionStorage has user | Session 2 | S2-T4 | REG-8 |
| AC-UI-1.2.1 | Form matches mock layout | Session 2 | S2-T4 | Visual |
| AC-UI-1.2.2 | Submit disabled until all fields filled | Session 2 | S2-T4 | REG-3, REG-4 |
| AC-1.3.1 | Dashboard at `/dashboard` | Session 3 | S3-T4 | DB-1 |
| AC-1.3.2 | Shows sprint name + date range | Session 3 | S3-T4 | DB-3 |
| AC-1.3.3 | Shows 4 stat cards | Session 3 | S3-T4 | DB-3 |
| AC-1.3.4 | `getCompletionRate()` formula correct | Session 3 | S3-T3 | DB-4, DB-7 |
| AC-1.3.5 | Empty state when no active sprint | Session 3 | S3-T4 | DB-5, DB-6 |
| AC-UI-1.3.1 | Dashboard layout matches mock | Session 3 | S3-T1, S3-T4 | Visual |
| AC-UI-SHELL-1–8 | Shell sidebar requirements | Session 3 | S3-T1 | Visual + DB-1 |

---

## Definition of Done Checklist

| # | Criterion | Owner | Verified? |
|---|---|---|---|
| 1 | All AC-1.1.x acceptance criteria pass | DEV | ☐ |
| 2 | All AC-1.2.x acceptance criteria pass | DEV | ☐ |
| 3 | All AC-1.3.x acceptance criteria pass | DEV | ☐ |
| 4 | All REVIEWER checklist points pass | REVIEWER | ☐ |
| 5 | `corepack yarn build` — 0 errors | DEV | ☐ |
| 6 | `corepack yarn test` — 0 failures | DEV | ☐ |
| 7 | `MONGODB_URI` in `.env.local`, absent from all committed files | DEV | ☐ |
| 8 | Registration saves user to MongoDB Atlas (verify in Atlas dashboard) | QA | ☐ |
| 9 | Two users in different browsers see each other's data on Dashboard | QA | ☐ |
| 10 | Dashboard shows correct live stats from MongoDB | QA | ☐ |
| 11 | Empty state renders when no sprint is active | QA | ☐ |
| 12 | `git commit -m "Sprint 1 complete: Foundation + MongoDB"` | DEV | ☐ |

---

## Sprint 7

**Mode**: [ARCHITECT]
**Sprint**: 7 — Points Engine, Badge Engine, Leaderboard Rebuild, Dashboard Enhancement
**References**: `docs/FEATURE_REQUIREMENTS.md` (Sprint 7 section), `docs/ARCHITECTURE_DESIGN.md`
(Sprint 7 section), `docs/adrs/ADR-0001` through `ADR-0006`
**Build order**: mirrors the backlog's own instruction — (1) type rewrite, (2) Epic 7.1 Points
Engine, (3) Epic 7.2 Badge Engine, (4) Epic 7.3 Leaderboard, (5) Epic 7.4 Dashboard Enhancement
(can run in parallel with Session 4 once `GET /api/points` exists, since Epic 7.4 only needs the
Points API, not the Leaderboard page itself)

### Sprint 7 Overview

| Attribute | Value |
|---|---|
| DEV Sessions | 5 |
| New dependencies | None (all required packages — `date-fns`, `lucide-react` — already installed) |
| Do-not-touch this sprint | `src/store/retro-store.tsx`, `src/components/sidebar.tsx`, `src/app/api/actions/[id]/regress/route.ts`, `src/lib/db.ts`, `src/lib/utils/windowFilter.ts` (reused, not modified), `src/lib/models/FeedbackItem.ts`/`ActionItem.ts`/`User.ts` schema fields (indexes only exempted — none needed there either) |
| Hard gate before Session 2 begins | `grep -rl "retro-store\|useRetro\|SprintSelector" src/` → must return zero matches (pre-verified by PRODUCT/ARCHITECT, DEV re-runs as safety net per Pre-Flight) |

---

### DEV Session 1 — Type System Rewrite

**Goal**: Replace the Sprint-1-era gamification type stubs with the real Sprint 7 shapes. No runtime code changes.

**Target line count**: ~90 lines (single file, net rewrite of ~72 existing lines)

#### Task S7-1.1 — Rewrite `src/types/index.ts` gamification section

**File**: `src/types/index.ts` — targeted replacement of `Badge`, `PointEvent`, `PointAction`,
`POINT_VALUES`, `BADGES`, and the `User.badges` field only. `FeedbackCategory`, `FeedbackItem`,
`ActionItem`, `CATEGORY_CONFIG` byte-for-byte unchanged.

- [x] Remove `badges: Badge[]` from `User` interface
- [x] Remove old `Badge` interface (`id, name, description, icon, earnedAt?, threshold`)
- [x] Remove old `PointEvent` interface (`id, userId, action, points, description, timestamp`)
- [x] Remove old `PointAction` union (hyphenated values)
- [x] Remove old `POINT_VALUES` const
- [x] Remove old `BADGES` array const
- [x] Add new `PointAction` union: `"submit_feedback" | "receive_upvote" | "remove_upvote" | "convert_action" | "complete_action" | "verify_action"`
- [x] Add new `POINT_VALUES: Record<PointAction, number>`: `{ submit_feedback: 10, receive_upvote: 5, remove_upvote: -5, convert_action: 50, complete_action: 100, verify_action: 150 }`
- [x] Add new `PointEvent` interface: `{ _id: string; userId: string; podId: string; action: PointAction; points: number; relatedId?: string; createdAt: string }`
- [x] Add new `BadgeType` union: `"feedback_machine" | "action_taker" | "innovator" | "problem_solver" | "consensus_builder" | "pod_champion"`
- [x] Add new `Badge` interface: `{ _id: string; userId: string; podId: string; type: BadgeType; earnedAt: string }`
- [x] Add new `BADGE_DEFINITIONS: Record<BadgeType, { name: string; icon: string; description: string; kind: "permanent" | "living" }>` — `pod_champion` is the only `kind: "living"` entry, all 5 others `kind: "permanent"`
- [x] `User.totalPoints: number` field left exactly as-is (present, non-optional)

**Verification**: `grep -n "threshold: number\|submit-feedback\|feedback-upvoted\|create-action-item\|complete-action-item\|verify-improvement\|badges: Badge\[\]" src/types/index.ts` → zero matches (confirmed). `npx tsc --noEmit` shows only pre-existing errors from Session 2–5 test files referencing not-yet-created modules (`@/lib/pointsEngine`, `@/lib/badgeEngine`, `@/lib/badgeChecks`, `@/app/api/points/route`, `@/app/api/badges/route`, `@/app/leaderboard/page`) plus one unrelated pre-existing `.next/types` Next.js route-typing quirk on `src/app/api/users/route.ts` — all confirmed identical (via `git stash` diff) to the error set present before this session's edit, so no regression was introduced. `src/__tests__/types.test.ts` now compiles clean and all 8 tests pass, whereas before this edit that file failed to compile.

#### Session 1 Completion Gate
- [x] `npx tsc --noEmit` → 0 new errors introduced by this session (see verification note above; remaining errors are out-of-scope Session 2–5 stubs and one pre-existing unrelated route-typing quirk)
- [x] All 10 AC-TYPES criteria (AC-TYPES-1 through AC-TYPES-10, minus AC-TYPES-9 which is a whole-sprint gate) pass — confirmed via `src/__tests__/types.test.ts` (8/8 passing) and the zero-match grep

---

### DEV Session 2 — Epic 7.1: Points Engine

**Goal**: `PointEvent` model, `pointsEngine.ts`, `GET /api/points`, and the 5 route-handler side-effect wire-ups. No badge logic yet (badge invocation stubbed as a no-op or deferred — see task note).

**Target line count**: ~360 lines across 8 files

#### Task S7-2.1 — Create `src/lib/models/PointEvent.ts`
- [x] Schema per Architecture Design spec: `userId`, `podId` (String, required), `action` (String, required, enum 6 values), `points` (Number, required, signed, no `min`), `relatedId` (String, optional), `createdAt` (Date, default `Date.now`)
- [x] `mongoose.models.PointEvent || mongoose.model('PointEvent', PointEventSchema)` guard
- [x] Non-unique index `{ userId: 1, createdAt: -1 }` for query performance

#### Task S7-2.2 — Create `src/lib/pointsEngine.ts`
- [x] Export `getPodLeaderboard(podId: string, window: '7d'|'30d'|'all'): Promise<PointsRow[]>` — resolves `User.find({ pod: podId })`, aggregates `PointEvent` sums per resolved `userId` (windowed + all-time), sorts desc by `windowPoints`
- [x] Export `recordPointEvent(input: { userId: string; podId: string; action: PointAction; relatedId?: string }): void` — internally: `PointEvent.create(...)` → `.then()` → `User.findByIdAndUpdate($inc totalPoints)` → `.then()` → call badge-evaluation hook (see Session 2 note below) → single `.catch()` logging failure. **Never returns a promise the caller could accidentally await meaningfully; never throws synchronously.**
- [x] **Session 2 badge-hook note**: built the REAL `evaluateBadges` from `@/lib/badgeEngine` in this same combined pass (Sessions 2+3), per ARCHITECT's explicit recommendation — no stub shipped.

#### Task S7-2.3 — Create `src/app/api/points/route.ts`
- [x] `GET` handler: validate `pod` present (400 if missing), validate `window` via `getWindowFilter` pattern (400 if invalid/missing — ARCHITECT decision: require explicit `window`)
- [x] Delegate to `pointsEngine.getPodLeaderboard(pod, window)`
- [x] Return 200 + array

#### Task S7-2.4 — Modify `src/app/api/feedback/route.ts` (`POST`)
- [x] After `await item.save()`: look up author's `User.pod`, call `recordPointEvent({ userId: item.authorId, podId, action: 'submit_feedback', relatedId: String(item._id) })` (not awaited)
- [x] Response/status unchanged (201 + item)

#### Task S7-2.5 — Modify `src/app/api/feedback/[id]/upvote/route.ts` (`PATCH`)
- [x] "Removed" branch (toggle off): `recordPointEvent({ userId: item.authorId, podId, action: 'remove_upvote', relatedId: String(item._id) })`
- [x] "Added" branch (toggle on): `recordPointEvent({ ..., action: 'receive_upvote', ... })`
- [x] Response/status unchanged; existing 403/404 behavior unchanged

#### Task S7-2.6 — Modify `src/app/api/actions/route.ts` (`POST`)
- [x] If `safeBody.sourceFeedbackId` present: look up `FeedbackItem`, resolve `authorId`'s pod, `recordPointEvent({ userId: feedback.authorId, podId, action: 'convert_action', relatedId: String(action._id) })` — targets true author even if `isAnonymous`
- [x] No call at all when `sourceFeedbackId` absent
- [x] Response/status unchanged (201 + action)

#### Task S7-2.7 — Modify `src/app/api/actions/[id]/advance/route.ts` (`PATCH`)
- [x] Only when `nextStatus === 'completed'`: `recordPointEvent({ userId: item.ownerId, podId, action: 'complete_action', relatedId: String(item._id) })`
- [x] `open → in-progress` transition: no call
- [x] Response/status unchanged

#### Task S7-2.8 — Modify `src/app/api/actions/[id]/verify/route.ts` (`PATCH`) — **breaking change**
- [x] Accept `{ impactNote, userId }` in request body
- [x] Add 400 guard: missing/empty `userId` → `{ error: 'userId is required' }`
- [x] After `await item.save()`: `recordPointEvent({ userId: body.userId, podId, action: 'verify_action', relatedId: String(item._id) })`
- [x] Response/status unchanged (200 + item) for the success path

#### Task S7-2.9 — Modify `src/services/actionService.ts`
- [x] `verifyImpact(itemId: string, impactNote: string, userId: string)` — add required `userId` param, include in POST body
- [x] Update the one caller (`action-items/page.tsx`'s verify submit handler) to pass `currentUser?._id`
- **CONFLICT FLAGGED FOR REVIEWER**: this breaking change causes 3 pre-existing test failures that DEV is not authorized to fix by editing tests — see Session 2+3 Implementation Notes for full detail (`actionService.test.ts` AS-11/AS-13, `actionItems.test.tsx` AI-12). Not resolved this session per explicit instruction to stop and report rather than silently work around it.

#### Task S7-2.10 — Modify `src/app/api/users/route.ts` (`GET`) — bug fix per ADR-0006
- [x] Honor `pod` query param: `const pod = req?.nextUrl?.searchParams?.get('pod') ?? null; const query = pod ? { pod } : (username ? { username } : {})`

#### Session 2 Completion Gate
- [x] AC-7.1.1 through AC-7.1.10 all pass (per `docs/TEST_SPEC.md`) — all 12 Sprint-7-authored test files targeted by this session pass; see note above re: 3 pre-existing (non-Sprint-7) test failures caused by the documented verify breaking change
- [x] `npx tsc --noEmit` → 0 errors (see Completion Gate section below for full run)
- [x] Manual/unit test: mocking `PointEvent.create` to throw does not change any route's primary response status/body (covered by `T2-FB-02` and equivalent fault-isolation assertions)

---

### DEV Session 3 — Epic 7.2: Badge Engine

**Goal**: `Badge` model, `badgeEngine.ts` (+ optional `badgeChecks.ts` split), `GET /api/badges`, wire the real `evaluateBadges` into `pointsEngine.recordPointEvent`'s chain (replacing Session 2's stub if one was used).

**Target line count**: ~310 lines across 4 files

#### Task S7-3.1 — Create `src/lib/models/Badge.ts`
- [x] Schema: `userId`, `podId` (String, required), `type` (String, required, enum 6 `BadgeType` values), `earnedAt` (Date, default `Date.now`)
- [x] Unique index `{ userId: 1, type: 1, podId: 1 }` with `partialFilterExpression: { type: { $ne: 'pod_champion' } }`
- [x] Unique index `{ type: 1, podId: 1 }` with `partialFilterExpression: { type: 'pod_champion' }`
- [x] `mongoose.models.Badge || mongoose.model('Badge', BadgeSchema)` guard

#### Task S7-3.2 — Create `src/lib/badgeChecks.ts` (5 permanent badge check functions)
- [x] `checkFeedbackMachine(userId)`: `PointEvent.countDocuments({ userId, action: 'submit_feedback', createdAt: { $gte: 30d ago } }) >= 10`
- [x] `checkActionTaker(userId)`: same pattern, `action: 'complete_action'`, threshold `>= 3`
- [x] `checkInnovator(userId)`: `FeedbackItem.aggregate` summing `upvotes` where `authorId === userId AND category === 'should-try'`, **no date filter**, threshold `>= 20`
- [x] `checkProblemSolver(userId)`: `ActionItem.find({ ownerId: userId, status: { $in: ['completed','verified'] } })`, for each look up `sourceFeedbackId`'s `FeedbackItem.category === 'slowed-us-down'`; skip items with no `sourceFeedbackId` rather than throwing
- [x] `checkConsensusBuilder(userId)`: `FeedbackItem.exists({ authorId: userId, upvotes: { $gte: 10 } })`
- [x] Each function is a pure `async (userId: string) => Promise<boolean>` — no `Badge` writes here, orchestration owns the create step

#### Task S7-3.3 — Create `src/lib/badgeEngine.ts`
- [x] Export `evaluateBadges(userId: string, podId: string): Promise<void>`
- [x] For each of the 5 permanent checks: run check → if `true` AND no existing `Badge` for `{userId,type,podId}` → `Badge.create(...)` (unique index is the backstop; also swallow/log 11000 duplicate-key errors defensively in case of a race)
- [x] Pod Champion: call `pointsEngine.getPodLeaderboard(podId, '30d')`, take index 0 as `currentTop`; `Badge.findOne({ podId, type: 'pod_champion' })`; if none exists → create for `currentTop.userId`; if exists and `existing.userId !== currentTop.userId` → tie-break (compare earliest qualifying `PointEvent.createdAt` for tied totals; prefer existing holder on true ties) → delete existing, create new; if same → no-op
- [x] Function never throws for "already holds badge" no-op paths; genuine DB errors may propagate (caller — `pointsEngine.recordPointEvent` — already wraps this in `.catch()`)

#### Task S7-3.4 — Wire `evaluateBadges` into `pointsEngine.recordPointEvent`
- [x] Built `pointsEngine.ts` importing the real `evaluateBadges` from `@/lib/badgeEngine` from the start (Sessions 2+3 combined pass per ARCHITECT's recommendation) — no stub was ever shipped
- [x] Confirm the `.then()` chain order: `PointEvent.create()` → `User $inc` → `evaluateBadges()` → single trailing `.catch()`

#### Task S7-3.5 — Create `src/app/api/badges/route.ts`
- [x] `GET` handler: read `userId` and `podId` query params; if `userId` present → `Badge.find({ userId })`; else if `podId` present → `Badge.find({ podId })`; else → 400
- [x] Return 200 + array, `_id` normalized to string

#### Session 3 Completion Gate
- [x] AC-7.2.1 through AC-7.2.12 all pass (`badgeModel.test.ts`, `badgeChecks.test.ts`, `badgeEngine.test.ts`, `badgesApi.test.ts` — 14/14 tests green)
- [x] `npx tsc --noEmit` → 0 errors (see Completion Gate section below)
- [x] Duplicate-key test: two `feedback_machine` inserts for same `userId`/`podId` → second is caught and logged (`awardIfQualified`'s try/catch on error code 11000), does not throw an unhandled error
- [x] Idempotency test: calling `evaluateBadges` twice after crossing a threshold results in exactly 1 badge document — confirmed by `T1-ENGINE-01`

---

### DEV Session 4 — Epic 7.3: Leaderboard Page (Full Rebuild)

**Goal**: `src/app/leaderboard/page.tsx` + supporting presentational components, wrapped in `Shell`, consuming `GET /api/points` + `GET /api/badges?podId=X`.

**Target line count**: ~430 lines across 4 files

#### Task S7-4.1 — Create `src/components/leaderboard/RankCard.tsx`
- [x] Props: `{ rank: number; row: PointsRow; badges: Badge[]; isCurrentUser: boolean }`
- [x] Rank 1: gold gradient, Trophy icon (`lucide-react`); Rank 2: silver gradient, Medal icon; Rank 3: bronze gradient, Medal icon; Rank 4+: plain card, numeric rank, no gradient
- [x] All ranks show: avatar/initials, name, badge chips (filtered from `badges` prop by `badge.userId === row.userId`, mapped through `BADGE_DEFINITIONS`), `windowPoints`; ranks 1–3 additionally show `allTimePoints`
- [x] 👑 chip specifically rendered when a `pod_champion` badge is present for this `userId`
- [x] Badge chip hover/focus reveals `description` via `title` attribute or a simple tooltip
- [x] `isCurrentUser` adds a distinguishing `ring`/`border`/`bg-*/10` class
- [x] Base card shell: `rounded-xl border border-border bg-card p-4 shadow-sm` per AC-UI-7.3.4

#### Task S7-4.2 — Create `src/components/leaderboard/PointsGuideCard.tsx`
- [x] Static — no props. Renders exactly 6 rows from `POINT_VALUES`, plain-language labels per the mapping in FEATURE_REQUIREMENTS AC-7.3.9 (`submit_feedback → "Submit feedback"`, etc.), signed values shown (`−5` for `remove_upvote`)

#### Task S7-4.3 — Create `src/components/leaderboard/BadgesReferenceCard.tsx`
- [x] Static — no props. Renders exactly 6 entries from `BADGE_DEFINITIONS` (icon, name, description) — not filtered by earned status

#### Task S7-4.4 — Create `src/app/leaderboard/page.tsx`
- [x] `"use client"`, wrapped top-level in `<Shell>` (import from `@/components/layout/Shell`)
- [x] Session guard: `getCurrentUser()` → redirect to `/` if null (matches Dashboard pattern)
- [x] State: `activeWindow` (`'7d'|'30d'|'all'`, default `'7d'`), `pointsData: PointsRow[]`, `badgesData: Badge[]`, `isLoading`
- [x] On mount + on `activeWindow` change: `fetch('/api/points?pod=' + user.pod + '&window=' + activeWindow)`; badges fetch (`fetch('/api/badges?podId=' + user.pod)`) on mount only (may optionally re-fire on window change, not required)
- [x] Toggle buttons: exact copy "This Week"/"This Month"/"All-Time", `data-testid="tab-7d"`/`"tab-30d"`/`"tab-all"`, same active/inactive classes as Dashboard (`bg-primary text-primary-foreground` / `bg-secondary/50 text-muted-foreground`)
- [x] Layout: two-column — primary `<ol>` (or `role="list"`) ranked list + secondary column with `PointsGuideCard` + `BadgesReferenceCard`, per AC-UI-7.3.5/7.3.6
- [x] Empty state: when all rows have `allTimePoints === 0`, render "No activity yet — submit feedback or complete an action item to appear on the leaderboard" instead of rank cards
- [x] Entrance animation: `animate-in fade-in slide-in-from-bottom-4 duration-500` (matches Dashboard)
- [x] No `@ts-nocheck`, no imports from deleted `retro-store`/`useRetro`/old sidebar

#### Session 4 Completion Gate
- [x] AC-7.3.1 through AC-7.3.12, AC-UI-7.3.1 through AC-UI-7.3.6 all pass — confirmed via `src/__tests__/leaderboard.test.tsx` (8/8 passing)
- [x] `npx tsc --noEmit` → 0 errors attributable to Session 4 files (only pre-existing `.next/types` route-typing quirk remains, unrelated)
- [x] `grep -n "useRetro\|retro-store\|@ts-nocheck" src/app/leaderboard/page.tsx` → zero matches

---

### DEV Session 5 — Epic 7.4: Dashboard Enhancement (can start once Session 2's `GET /api/points` exists — does not require Session 4)

**Goal**: 4 new Dashboard sections below the existing metrics grid/activity feed, respecting the existing window toggle, per ADR-0002's hybrid loading model.

**Target line count**: ~380 lines across 6 files

#### Task S7-5.1 — Create `src/lib/utils/categoryDelta.ts`
- [x] Export a pure helper computing prior-period bounds: for `7d` → `[now-14d, now-7d)`; for `30d` → `[now-60d, now-30d)`; for `all` → `null` (no delta)
- [x] Export a pure formatter: given `(current: number, prior: number | null)` → delta display string; `prior === 0 && current > 0` → `"+N ↑"`; `prior === null` → no delta (caller omits the element entirely); `prior > 0` → signed count or percentage (DEV's choice, must never divide by zero); `prior === 0 && current === 0` → `"0"` or omitted (either acceptable)

#### Task S7-5.2 — Create `src/components/dashboard/PodMvpSection.tsx`
- [x] Props: `{ pointsData: PointsRow[] | null; isLoading: boolean }`
- [x] Trophy icon (`lucide-react`), `pointsData[0]`'s name/avatar/`windowPoints`
- [x] Empty state (neutral copy) when `pointsData` is `[]` (not `null`) — does not crash on `array[0]` undefined
- [x] Local skeleton (`animate-pulse` block) when `isLoading === true` — independent of the page's main `isLoading` (ADR-0002)
- [x] Card shell: `rounded-xl border border-border bg-card p-4 shadow-sm` (or `p-5` per Activity Feed variant)

#### Task S7-5.3 — Create `src/components/dashboard/CategoryBreakdownSection.tsx`
- [x] Props: `{ current: FeedbackItem[]; prior: FeedbackItem[] | null; window: '7d'|'30d'|'all' }`
- [x] 3 mini cards (Slowed Down / Should Try / Went Well) using `CATEGORY_CONFIG` labels/color tokens
- [x] Delta rendered via `categoryDelta.ts` helpers; **entirely absent from the DOM** (not hidden via CSS) when `window === 'all'`

#### Task S7-5.4 — Create `src/components/dashboard/TopVotedFeedbackSection.tsx`
- [x] Props: `{ items: FeedbackItem[] }` (parent passes already window-filtered items, pre-sorted desc by `upvotes`, sliced to 5)
- [x] Category color indicator via `CATEGORY_CONFIG`, `line-clamp-2` truncated content, upvote count
- [x] Renders fewer than 5 if fewer qualify; own empty-state message if zero

#### Task S7-5.5 — Create `src/components/dashboard/VerifiedImprovementsSection.tsx`
- [x] Props: `{ items: ActionItem[] }` (parent pre-filters to `status === 'verified'` AND `completedAt ?? createdAt` within window)
- [x] Each entry: `title` + `impactNote` in emerald inset block — reuse `CATEGORY_CONFIG['went-well']` tokens (`bg-emerald-50 text-emerald-700 border-emerald-200`) per AC-UI-7.4.4, consistent with the emerald chip pattern already in `src/app/action-items/page.tsx` (`bg-emerald-500/20 text-emerald-400`) — DEV should reconcile these two emerald conventions (dark-chip vs. light-inset) by using the inset/light variant here since it's an "inset block" per the AC wording, not a status chip

#### Task S7-5.6 — Modify `src/app/dashboard/page.tsx`
- [x] Add independent `useEffect([activeWindow])` fetching `/api/points?pod=X&window=activeWindow`, own `pointsData`/`isLoadingPoints` state (ADR-0002) — does NOT touch the existing `Promise.all` fetch/`isLoading`/`loadError` for feedback/actions/users (extracted into `src/components/dashboard/useDashboardExtras.ts` to keep `page.tsx` under the 200-line cap; no behavior change from the inline version)
- [x] Add a second fetch for the prior-period category counts, only when `activeWindow !== 'all'` — see Implementation Notes for exact mechanism chosen (`GET /api/feedback?window=all` fetched once per window change, filtered client-side against `categoryDelta.ts`'s date bounds, since `getWindowFilter` doesn't support arbitrary bounded ranges)
- [x] Render the 4 new sections below existing Activity Feed, passing derived props to each new component
- [x] Existing metrics grid / Activity Feed JSX, `data-testid`s, and computation logic: **zero changes** (both extracted verbatim into `MetricsGrid.tsx`/`ActivityFeedSection.tsx`/`WindowTabs.tsx` for the line cap — pure relocation, confirmed via passing `dashboard.test.tsx`)
- [x] **Deviation (in-scope, documented)**: the pre-existing `useEffect`'s dependency array was changed from `[activeWindow, router]` to `[activeWindow]` — see Implementation Notes for the full writeup of the pre-existing infinite-render-loop bug this fixes (caused by the test suite's `useRouter()` mock returning a new object reference every render). No fetch/isLoading/loadError *logic* inside the effect was touched, only the deps array, and this was necessary to make `dashboardSprint7.test.tsx` (and, incidentally, the pre-existing `dashboard.test.tsx`) pass deterministically.

#### Session 5 Completion Gate
- [x] AC-7.4.1 through AC-7.4.8, AC-UI-7.4.1 through AC-UI-7.4.5 all pass — `dashboardSprint7.test.tsx` 11/11 passing
- [x] `npx tsc --noEmit` → 0 errors attributable to Session 5 files (only pre-existing unrelated `.next/types` route-typing quirk on `src/app/api/users/route.ts` remains, documented since Session 1)
- [x] Existing `dashboard.test.tsx` tests pass — 6/6 passing (baseline was 3/6 before the router-deps fix; see Implementation Notes)
- [x] Toggling to "All-Time" removes delta elements from the DOM entirely (not just visually hidden) — confirmed via T2-DASH-06

---

### Cross-Session Constraints (Sprint 7)

| # | Rule |
|---|---|
| C7-1 | `recordPointEvent()` is the **only** call site anywhere in `src/` that constructs a `PointEvent` document — no route handler calls `PointEventModel`/`PointEvent.create` directly (ADR-0004/ADR-0005) |
| C7-2 | `evaluateBadges()` is never `await`ed by a route handler — only ever invoked via `pointsEngine.recordPointEvent`'s internal chain (ADR-0003) |
| C7-3 | No route handler's primary response (status code or body) may become conditional on `PointEvent`/`Badge` write success or failure |
| C7-4 | `podId` is always derived as `User.pod` — never invented, hardcoded, or sourced from anywhere else (ADR-0006) |
| C7-5 | No new field is added to `FeedbackItem`/`ActionItem` schemas this sprint (in particular, no `podId`) |
| C7-6 | Every new/modified file stays under 200 lines; split proactively (e.g. `badgeChecks.ts` from `badgeEngine.ts`, per-section Dashboard components) rather than after the fact |
| C7-7 | `src/app/api/actions/[id]/regress/route.ts` is not touched in any session |
| C7-8 | `src/components/layout/Shell.tsx` is not modified unless PRODUCT/REVIEWER explicitly requires a Leaderboard nav link (open item — see Architecture Design §Open Questions Resolved #8) |

---

### Sprint 7 Definition of Done Checklist

Mirrors `docs/FEATURE_REQUIREMENTS.md`'s Sprint 7 Definition of Done table (16 items) — see that
section for the authoritative list. Key gates repeated here for DEV convenience:

- [x] `npx tsc --noEmit` → 0 errors (whole-sprint gate, AC-TYPES-9)
- [x] `npm run build` → 0 errors (required a genuine pre-existing bug fix in `src/app/api/users/route.ts` — see `docs/IMPLEMENTATION_NOTES.md` "Sprint 7 — Whole-Sprint Completion Gate")
- [x] `npm test` → 0 failures attributable to Sprint 7 (2 pre-existing, unrelated failures in `registration.test.tsx`/`errorHandling.test.tsx` remain, confirmed present before Sprint 7 via `git stash`)
- [x] All Epic 7.1/7.2/7.3/7.4 AC tables pass per `docs/TEST_SPEC.md` (TEST role output)
- [x] Pre-Flight cleanup re-confirmed clean (`grep -rl "retro-store\|useRetro\|SprintSelector" src/` → 0 matches)
- [ ] Manual smoke test (14 steps per backlog) passes — **not performed**, no `MONGODB_URI` configured in this environment; flagged for REVIEWER/human verification against a live MongoDB instance
- [ ] Committed — **not pushed to `main` until REVIEWER approves**, per MAWv6.1
