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

## Sprint 2 Implementation Plan

**Mode**: [ARCHITECT]  
**Sprint**: 2 — Feedback Board Layout, Submit Feedback, Upvote, Reframe Rule  
**References**: `retro-product/docs/FEATURE_REQUIREMENTS.md` (Sprint 2), `docs/ARCHITECTURE_DESIGN.md` §Sprint 2  
**Extends**: Sprint 1 plan above — all Sprint 1 files remain unchanged unless explicitly noted  
**Date**: April 11, 2026

---

### Sprint 2 Overview

| Attribute | Value |
|---|---|
| Theme | Feedback Board — Read, Submit, Upvote, Reframe Rule |
| DEV Sessions | 2 |
| Target line count | ~530 lines across 9 files |
| New dependencies | None — all shadcn/ui components already available |
| Critical field-name rule | Use `suggestion` (not `suggestedImprovement`) — matches live `src/types/index.ts` |
| Isolated (do not touch) | `Shell.tsx`, `FeedbackItem.ts` (model), `types/index.ts`, `retro-store.tsx`, `sidebar.tsx` |

---

### Pre-Sprint Checklist (Sprint 2)

| # | Task | Owner | Verified? |
|---|---|---|---|
| S2P-1 | Sprint 1 Definition of Done fully checked — MongoDB connected, registration working, dashboard live | Project owner | ☐ |
| S2P-2 | `corepack yarn tsc --noEmit` passes on current codebase (Sprint 1 baseline) | DEV | ☐ |
| S2P-3 | `corepack yarn test` passes all Sprint 1 tests (21 tests, 0 failures) | DEV | ☐ |
| S2P-4 | At least one sprint with `status: "open"` exists in MongoDB Atlas (required for feedback scoping) | Project owner | ☐ |
| S2P-5 | Confirm `src/app/feedback/` directory exists with old mock `page.tsx` — will be replaced in Session 1 | DEV | ☐ |

---

### DEV Session 1 — Feedback Board Read (Epic 2.1)

**Goal**: Build the complete read-only Feedback Board — 3-column layout, card rendering, per-lane empty state, sorted by upvotes. The "Submit Feedback" button is present but opens a stub/noop modal (modal is implemented in Session 2).

**Target line count**: ~290 lines across 6 files  
**Epic covered**: Epic 2.1  
**Acceptance Criteria targeted**: AC-2.1.1–AC-2.1.5, AC-UI-2.1.1–AC-UI-2.1.23, AC-UI-SHELL-FB-1–5

---

- [x] **Create `src/app/api/feedback/route.ts`** — `GET /api/feedback?sprintId=X&category=Y` + `POST /api/feedback` with Reframe Rule 422 guard

  **GET handler spec**:
  - `await connectDB()`
  - Build query from `req.nextUrl.searchParams`: `{ ...(sprintId && { sprintId }), ...(category && { category }) }`
  - `FeedbackItem.find(query).lean()` → return HTTP 200 + JSON array

  **POST handler spec**:
  - `await connectDB()`
  - Parse body: `{ category, content, suggestion, isAnonymous, sprintId, authorId }`
  - Validate required fields (`category`, `content`, `sprintId`, `authorId`) → missing → HTTP 400
  - **Reframe Rule guard**: `if (category === 'slowed-us-down' && !body.suggestion?.trim())` → return HTTP 422 `{ error: 'Reframe Rule: suggestion is required for slowed-us-down feedback' }`
  - `new FeedbackItemModel({ ...body }).save()` → return HTTP 201 + created document

  **Constraint**: Import `connectDB` from `@/lib/db`; import `FeedbackItemModel` from `@/lib/models/FeedbackItem`. No Mongoose in service layer.

---

- [x] **Create `src/services/feedbackService.ts`** — `getFeedback()`, `getFeedbackByLane()`, `sortByUpvotes()`, `getAuthorDisplay()`

  **Target lines**: ~70 (read functions only; `addFeedback` and `upvoteFeedback` added in Session 2)

  | Function | Signature | Behaviour |
  |---|---|---|
  | `getFeedback` | `(sprintId?: string) => Promise<FeedbackItem[]>` | If `sprintId` not provided, fetches `GET /api/sprints` first to resolve active sprint `_id`; then `GET /api/feedback?sprintId=X` |
  | `getFeedbackByLane` | `(sprintId: string, category: FeedbackCategory) => Promise<FeedbackItem[]>` | `GET /api/feedback?sprintId=X&category=Y` → return array |
  | `sortByUpvotes` | `(items: FeedbackItem[]) => FeedbackItem[]` | Returns new array sorted by `item.upvotes` descending; does NOT mutate input |
  | `getAuthorDisplay` | `(item: FeedbackItem, authorName?: string) => string` | `item.isAnonymous === true` → `"Anonymous"`; else → `authorName ?? "Unknown"` |

  **Constraint**: No `"use client"` directive on this file (plain module). No Mongoose imports. `sessionStorage` access guarded with `typeof window !== 'undefined'`.

---

- [x] **Create `src/components/FeedbackCard.tsx`** — content, `suggestion` block, named/anonymous author, upvote button + count

  **Target lines**: ~70

  **Props interface**:
  ```typescript
  interface FeedbackCardProps {
    item: FeedbackItem
    authorName: string
    onUpvote: () => void
  }
  ```

  **Rendering spec**:
  - Root: `<div className="retro-card p-4 {borderClass} group">` where `borderClass` maps `category` → `border-left-red` / `border-left-blue` / `border-left-emerald`
  - Content: `<p className="text-sm leading-relaxed mb-4 text-slate-200">{item.content}</p>`
  - Suggestion block (conditional — only when `item.suggestion` is truthy):
    ```
    <div className="mb-4 bg-secondary/50 rounded p-3 border border-border/50">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Suggested Improvement</div>
      <p className="text-xs text-slate-300 italic">"{item.suggestion}"</p>
    </div>
    ```
  - Footer row: `flex items-center justify-between`
  - Named author: circular avatar with `authorName[0]` initial + `authorName` text
  - Anonymous author: circular avatar with `<User className="w-3 h-3 opacity-50" />` + "Anonymous" text
  - Upvote button: `<button className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50 hover:bg-secondary text-xs font-medium transition-colors" onClick={onUpvote}>`
  - Upvote count: `{item.upvotes}` (integer from MongoDB — not `upvotedBy.length`)
  - **Omit**: "Convert to Action Item" button (out of scope Sprint 2)

---

- [x] **Create `src/components/FeedbackColumn.tsx`** — header with count badge, scrollable card list, per-lane empty state

  **Target lines**: ~55

  **Props interface**:
  ```typescript
  interface FeedbackColumnProps {
    category: FeedbackCategory
    items: FeedbackItem[]
    onUpvote: (itemId: string) => void
    currentUserId: string
  }
  ```

  **Column config** (drives colors, glow, titles, empty text):

  | `category` | Title | Color class | Dot glow shadow | Empty text |
  |---|---|---|---|---|
  | `"slowed-us-down"` | "What Slowed Us Down?" | `text-red-500` | `shadow-[0_0_8px_rgba(239,68,68,0.8)]` | "No blockers reported yet. Be the first to share." |
  | `"should-try"` | "What Should We Try?" | `text-blue-500` | `shadow-[0_0_8px_rgba(59,130,246,0.8)]` | "No suggestions yet. What would help the team?" |
  | `"went-well"` | "What Went Well?" | `text-emerald-500` | `shadow-[0_0_8px_rgba(16,185,129,0.8)]` | "Nothing logged yet. Share a win!" |

  **Rendering spec**:
  - Column container: `flex flex-col bg-secondary/20 rounded-xl border border-border/50 overflow-hidden`
  - Header: `p-4 border-b border-border/50 bg-secondary/40 flex items-center justify-between shrink-0`
  - Header title: `font-semibold {colorClass} flex items-center gap-2`; preceded by `<span className="w-2 h-2 rounded-full {bgColorClass} {glowShadow}" />`
  - Count badge: `<span className="text-xs font-medium bg-secondary px-2 py-1 rounded text-muted-foreground">{items.length}</span>`
  - Card list area: `<div className="p-4 overflow-y-auto space-y-4">`
  - Sorted cards: call `feedbackService.sortByUpvotes(items)` — pass sorted result to `FeedbackCard` elements
  - Empty state: `<div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center text-sm text-muted-foreground bg-secondary/10 min-h-[120px] flex items-center justify-center">{emptyText}</div>`

---

- [x] **Create `src/app/feedback/page.tsx`** — 3-column board layout, data fetch on mount, "Submit Feedback" button (opens modal — modal is stub/noop in Session 1)

  **Target lines**: ~65 (grows ~30 lines in Session 2 when modal is fully wired)

  **Implementation spec**:
  - `"use client"` directive
  - Session guard: `useEffect` → `userService.getCurrentUser()` → null → `router.push('/')`
  - Data fetch: on mount, resolve active sprint → `Promise.all` fetching all 3 lanes via `feedbackService.getFeedbackByLane()`
  - State: `sprint: Sprint | null`, `slowedDown: FeedbackItem[]`, `shouldTry: FeedbackItem[]`, `wentWell: FeedbackItem[]`, `showModal: boolean` (starts `false`), `isLoading: boolean`
  - `refetch()` async function — re-fetches all 3 lanes; called after successful submit (Session 2) or upvote
  - Wraps content in `<Shell sprintName={sprint?.name}>`
  - Page header: `h1` "Feedback Board" + subtitle + "Submit Feedback" button (`onClick={() => setShowModal(true)}`)
  - Column grid: `<div className="flex-1 grid grid-cols-3 gap-6 min-h-0">`
  - Three `<FeedbackColumn>` components — one per lane
  - **Session 1 stub**: `{showModal && <div data-testid="modal-stub" />}` — replaced with real modal in Session 2
  - Entrance animation wrapper: `<div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-0">`
  - **Does not import** from `retro-store.tsx`

---

- [x] **Create `src/__tests__/feedbackService.test.ts`** — `sortByUpvotes`, `getAuthorDisplay`, API route mock tests

  **Target lines**: ~60

  **Test cases**:

  | Test ID | Description | Covers |
  |---|---|---|
  | FS-1 | `sortByUpvotes([{upvotes:3},{upvotes:8},{upvotes:1}])` → returns `[8,3,1]` order | AC-2.1.4 |
  | FS-2 | `sortByUpvotes` does not mutate the original array | AC-2.1.4 |
  | FS-3 | `getAuthorDisplay({isAnonymous:true}, "Jane")` → returns `"Anonymous"` | AC-2.1.3 |
  | FS-4 | `getAuthorDisplay({isAnonymous:false}, "Jane")` → returns `"Jane"` | AC-2.1.3 |
  | FS-5 | `GET /api/feedback?sprintId=X&category=went-well` → returns 200 + array | AC-2.1.1 |
  | FS-6 | `POST /api/feedback` with valid `went-well` payload → returns 201 | AC-RR-5 |
  | FS-7 | `POST /api/feedback` with `slowed-us-down` + empty `suggestion` → returns 422 | AC-RR-4 |
  | FS-8 | `POST /api/feedback` with `slowed-us-down` + non-empty `suggestion` → returns 201 | AC-RR-4/5 |

  **Mocking approach** (matching Sprint 1 `userApi.test.ts` pattern):
  - `@jest-environment node` directive
  - Mock `@/lib/db` → `connectDB` is no-op
  - Mock `@/lib/models/FeedbackItem` → mock `find()`, `save()`, `findById()`
  - Direct import of `GET`, `POST` from `@/app/api/feedback/route`
  - Unit tests for `sortByUpvotes` and `getAuthorDisplay` import directly from service (no mocking needed)

---

### Session 1 Completion Gate

Before proceeding to Session 2, confirm:

- [x] `GET /api/feedback?sprintId=X&category=went-well` returns 200 + array (manual test or unit test FS-5)
- [x] `POST /api/feedback` with `slowed-us-down` + empty `suggestion` → 422 confirmed (FS-7)
- [x] `/feedback` page renders 3 columns with correct headers in the browser
- [x] Each column shows per-lane empty state when no feedback exists for that lane
- [x] Upvote button is visible on each card (no-op click for now)
- [x] "Submit Feedback" button is present and visible (modal is stub only)
- [x] `corepack yarn tsc --noEmit` → 0 errors (verified via node tsc)
- [x] `corepack yarn test` → Sprint 1 tests still pass (0 regressions) — 33/33 pass

---

### DEV Session 2 — Submit + Upvote (Epic 2.2)

**Goal**: Complete the Submit Feedback modal with full Reframe Rule enforcement, wire the upvote PATCH route, extend `feedbackService`, and write all Sprint 2 tests.

**Target line count**: ~240 lines across 6 files  
**Epic covered**: Epic 2.2  
**Acceptance Criteria targeted**: AC-2.2.1–AC-2.2.6, AC-RR-1–6, AC-UI-2.2.1–2.2.12

---

- [x] **Create `src/components/SubmitFeedbackModal.tsx`** — `Dialog`, lane `RadioGroup`, content `Textarea`, anonymous `Checkbox`, conditional suggestion field, Reframe Rule badge, footer buttons

  **Target lines**: ~80

  **Props interface**:
  ```typescript
  interface SubmitFeedbackModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (payload: { category: FeedbackCategory; content: string; suggestion: string; isAnonymous: boolean }) => Promise<void>
    sprintId: string
  }
  ```

  **Internal state**: `category: FeedbackCategory` (default `"went-well"`), `content: string`, `suggestion: string`, `isAnonymous: boolean`, `isSubmitting: boolean`

  **Reframe Rule wiring**:
  - Suggestion textarea + REFRAME RULE badge: rendered only when `category === "slowed-us-down"`
  - Submit button `disabled` expression: `!content.trim() || (category === 'slowed-us-down' && !suggestion.trim()) || isSubmitting`

  **Radio values** (must match exact `FeedbackCategory` strings):
  - `value="slowed-us-down"` → label `🔴 What Slowed Us Down?` in `text-red-500 font-medium`
  - `value="should-try"` → label `💡 What Should We Try?` in `text-blue-500 font-medium`
  - `value="went-well"` → label `✅ What Went Well?` in `text-emerald-500 font-medium`

  **Selected lane highlight**: `"slowed-us-down"` option row gets `bg-secondary/30 p-2 rounded-md border border-border/50` when selected

  **shadcn/ui components**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `RadioGroup`, `RadioGroupItem`, `Label`, `Textarea`, `Checkbox`, `Button`

  **Submit handler**:
  ```
  setIsSubmitting(true)
  await onSubmit({ category, content, suggestion, isAnonymous })
  setIsSubmitting(false)
  onClose()
  ```
  Reset state on close (`onOpenChange` fires `onClose` → parent sets `open=false`).

---

- [x] **Wire modal into `src/app/feedback/page.tsx`** — open/close state, `onSubmit` handler, re-fetch after submit

  **Changes to Session 1 stub**:
  - Remove `{showModal && <div data-testid="modal-stub" />}`
  - Add `import SubmitFeedbackModal from '@/components/SubmitFeedbackModal'`
  - Add `onSubmitFeedback` handler:
    ```
    async function onSubmitFeedback(payload) {
      const currentUser = userService.getCurrentUser()!
      await feedbackService.addFeedback({ ...payload, sprintId: sprint!._id, authorId: currentUser._id })
      await refetch()
    }
    ```
  - Add `<SubmitFeedbackModal open={showModal} onClose={() => setShowModal(false)} onSubmit={onSubmitFeedback} sprintId={sprint?._id ?? ''} />`

---

- [x] **Create `src/app/api/feedback/[id]/upvote/route.ts`** — `PATCH`: 403 self-vote, 409 duplicate, increment `upvotes` + push to `upvotedBy`

  **Target lines**: ~50

  **PATCH handler spec**:
  ```
  await connectDB()
  { userId } = await req.json()
  if !userId → return 400

  item = await FeedbackItemModel.findById(params.id)
  if !item → return 404

  if item.authorId === userId → return 403 { error: "Cannot upvote own feedback" }
  if item.upvotedBy.includes(userId) → return 409 { error: "Already upvoted" }

  item.upvotedBy.push(userId)
  item.upvotes += 1
  await item.save()
  return 200 { upvotes: item.upvotes }
  ```

  **Route signature**: `export async function PATCH(req: NextRequest, { params }: { params: { id: string } })`

---

- [x] **Update `src/services/feedbackService.ts`** — add `addFeedback()` and `upvoteFeedback()`

  **Target lines**: ~40 additional (added to Session 1 base)

  | Function | Signature | Behaviour |
  |---|---|---|
  | `addFeedback` | `(payload: { category, content, suggestion, isAnonymous, sprintId, authorId?: string }) => Promise<FeedbackItem>` | Reframe Rule guard (throw before fetch if violated); `POST /api/feedback`; on 201 → return item; on 422 → throw |
  | `upvoteFeedback` | `(itemId: string, userId: string) => Promise<{ upvotes: number }>` | `PATCH /api/feedback/{itemId}/upvote { userId }`; on 200 → return `{ upvotes }`; on 403/409 → throw with message from response |

---

- [x] **Wire upvote button in `FeedbackCard.tsx`** — connects to `feedbackService.upvoteFeedback()` + triggers re-fetch via `onUpvote` prop

  The upvote `<button>` already calls `onUpvote()` (the prop callback set in Session 1). The parent page's `onUpvote` handler must be filled in:
  ```
  async function handleUpvote(itemId: string) {
    const currentUser = userService.getCurrentUser()!
    try {
      await feedbackService.upvoteFeedback(itemId, currentUser._id)
      await refetch()   // always re-fetch — never increment locally
    } catch {
      // 403/409: silent no-op
    }
  }
  ```
  Pass `handleUpvote` as the `onUpvote` prop to each `FeedbackColumn`.

---

- [x] **Create `src/__tests__/feedbackBoard.test.tsx`** — modal open/close, Reframe Rule, upvote guards

  **Target lines**: ~70

  **Test cases**:

  | Test ID | Description | Covers |
  |---|---|---|
  | FB-1 | Renders `/feedback` with mocked session user — mounts without redirect | AC-2.1.1, AC-UI-SHELL-FB-5 |
  | FB-2 | No session user → redirects to `/` | AC-UI-SHELL-FB-5 |
  | FB-3 | Three column headers present: "What Went Well?", "What Slowed Us Down?", "What Should We Try?" | AC-2.1.2 |
  | FB-4 | Empty API response → per-lane empty state messages render; no `FeedbackCard` elements | AC-2.1.5 |
  | FB-5 | Clicking "Submit Feedback" button → `SubmitFeedbackModal` opens (`DialogTitle` visible) | AC-2.2.1 |
  | FB-6 | Modal close (×) → modal removed from DOM | AC-2.2.1 |
  | FB-7 | Modal: selecting "slowed-us-down" → suggestion textarea appears + "REFRAME RULE: REQUIRED" badge visible | AC-RR-1, AC-RR-6 |
  | FB-8 | Modal: selecting "went-well" → suggestion textarea NOT in DOM | AC-RR-1 |
  | FB-9 | Modal: "slowed-us-down" + empty suggestion → Submit button disabled | AC-RR-2 |
  | FB-10 | Modal: "slowed-us-down" + non-empty suggestion → Submit button enabled | AC-RR-2 |
  | FB-11 | Upvote button on own feedback → no PATCH call issued (or 403 response handled gracefully — count unchanged) | AC-2.2.5 |
  | FB-12 | Upvote button clicked twice → second click returns 409, count does not increment | AC-2.2.5 |
  | FB-13 | Successful upvote → board re-fetches; displayed count matches API response value, not a local increment | AC-2.2.6 |

  **Mocking approach** (matching Sprint 1 `dashboard.test.tsx` pattern):
  - Mock `next/navigation` → `useRouter: () => ({ push: mockPush })`, `usePathname: () => '/feedback'`
  - Mock `@/services/userService` → `getCurrentUser: jest.fn()`
  - Mock `@/services/feedbackService` → `getFeedbackByLane: jest.fn()`, `addFeedback: jest.fn()`, `upvoteFeedback: jest.fn()`, `sortByUpvotes: jest.fn().mockImplementation(items => items)`
  - Mock `@/components/layout/Shell` → `default: ({ children }) => <div data-testid="shell">{children}</div>`
  - Pre-seed `sessionStorage` with `mockUser` in `beforeEach`
  - Mock `global.fetch` for upvote PATCH responses

---

### Session 2 Completion Gate

Before declaring Sprint 2 complete, confirm all Definition of Done items:

- [ ] Feedback can be submitted in all 3 lanes (verified in browser with live MongoDB)
- [ ] "What Slowed Us Down?" cannot be submitted without a Suggestion — submit button disabled client-side; POST returns 422 server-side
- [ ] Modal closes and board re-fetches after successful submit
- [ ] Upvote count persists in MongoDB after page refresh
- [ ] Double-vote returns 409 and count does not increment
- [ ] Self-vote returns 403 and count does not increment
- [ ] Anonymous feedback shows "Anonymous" as author; `authorId` not exposed to other clients
- [ ] Empty state renders correctly in all 3 lanes when no feedback exists
- [x] `corepack yarn tsc --noEmit` → 0 errors
- [x] `corepack yarn test` → 0 failures (Sprint 1 + Sprint 2 tests combined)
- [ ] `corepack yarn build` → 0 errors
- [ ] `git commit -m "Sprint 2 complete: Feedback Board"` committed

---

### Sprint 2 Acceptance Criteria Traceability Matrix

| AC-ID | Criterion Summary | DEV Session | Task(s) | Test Coverage |
|---|---|---|---|---|
| AC-2.1.1 | `/feedback` renders with Shell layout; session guard | Session 1 | page.tsx | FB-1, FB-2 |
| AC-2.1.2 | Three column headers present, correct text | Session 1 | FeedbackColumn.tsx | FB-3 |
| AC-2.1.3 | Each card: content, author, upvote count, upvote button | Session 1 | FeedbackCard.tsx | feedbackService.test FS-3/4 |
| AC-2.1.4 | Cards sorted by upvote count descending | Session 1 | feedbackService `sortByUpvotes` | FS-1, FS-2 |
| AC-2.1.5 | Empty state per lane when no feedback | Session 1 | FeedbackColumn.tsx | FB-4 |
| AC-2.2.1 | "Submit Feedback" button opens modal; × closes it | Session 2 | page.tsx + modal | FB-5, FB-6 |
| AC-2.2.2 | Modal has 3-option RadioGroup, Content textarea, anonymous checkbox, conditional suggestion | Session 2 | SubmitFeedbackModal.tsx | FB-7, FB-8 |
| AC-2.2.3 | Reframe Rule: suggestion required for slowed-us-down | Session 2 | Modal + service + API | FB-7, FB-9, FB-10, FS-7 |
| AC-2.2.4 | Submit calls `addFeedback()`; modal closes on 201; board re-fetches | Session 2 | page.tsx + feedbackService | FB-5 (extended) |
| AC-2.2.5 | Upvote: 403 self-vote, 409 duplicate | Session 2 | upvote route.ts | FB-11, FB-12 |
| AC-2.2.6 | Upvote count from MongoDB, not local state | Session 2 | page.tsx `handleUpvote` | FB-13 |
| AC-RR-1 | Suggestion field conditionally rendered | Session 2 | SubmitFeedbackModal.tsx | FB-7, FB-8 |
| AC-RR-2 | Submit button disabled when suggestion empty | Session 2 | SubmitFeedbackModal.tsx | FB-9, FB-10 |
| AC-RR-3 | `addFeedback()` throws without calling fetch | Session 2 | feedbackService.ts | FS-7 (service unit test) |
| AC-RR-4 | API returns 422 for slowed-us-down + empty suggestion | Session 1 | feedback/route.ts | FS-7 |
| AC-RR-5 | API returns 201 for other lanes with empty suggestion | Session 1 | feedback/route.ts | FS-6 |
| AC-RR-6 | "REFRAME RULE: REQUIRED" badge visible in modal | Session 2 | SubmitFeedbackModal.tsx | FB-7 |
| AC-UI-SHELL-FB-1–5 | Shell sidebar on `/feedback`, active nav, session guard | Session 1 | page.tsx (Shell wrap) | FB-1, FB-2 |

---

---

# Implementation Plan — Sprint 3: Action Items

**Mode**: [ARCHITECT]  
**Sprint**: 3 — Action Items: Create, Lifecycle, Convert from Feedback, Verify Impact  
**Date**: April 2026  
**Rule**: Sprint 1 and Sprint 2 sections above are read-only. Append only.  
**Prerequisite**: Sprint 2 complete — 46/46 tests passing, 0 TypeScript errors.

---

## Sprint 3 Overview

| Session | Goal | Target Lines | ACs Covered |
|---|---|---|---|
| Session 1 | Action Items List + Create (Epic 3.1) | ~500 | AC-3.1.1–3.1.7 |
| Session 2 | Convert from Feedback + Verify Impact (Epic 3.2) | ~360 | AC-3.2.1–3.2.6 |

---

## DEV Session 1 — Action Items List + Create

**Goal**: Build the Action Items page with status bar, card list, empty state, and the New Action Item modal.

---

### Task S3-S1-1: Create `src/app/api/actions/route.ts`

**Target lines**: ~60  
**AC**: AC-3.1.2, AC-3.1.6

- [x] Import `NextRequest`, `NextResponse` from `'next/server'`; `connectDB` from `'@/lib/db'`; `ActionItemModel` from `'@/lib/models/ActionItem'`
- [x] `GET` handler: extract `sprintId` from `req.nextUrl.searchParams`; return 400 if missing; `connectDB()`; `ActionItemModel.find({ sprintId }).lean()`; return `NextResponse.json(items, { status: 200 })`
- [x] `POST` handler: parse body; validate `title`, `ownerId`, `sprintId` required → 400; `new ActionItemModel({ ...body, status: 'open' })`; `.save()`; return `NextResponse.json(item, { status: 201 })`
- [x] Both handlers wrapped in `try/catch` → return 500 on error

**Exact function signatures**:
```ts
export async function GET(req: NextRequest): Promise<NextResponse>
export async function POST(req: NextRequest): Promise<NextResponse>
```

---

### Task S3-S1-2: Create `src/services/actionService.ts`

**Target lines**: ~110  
**AC**: AC-3.1.2, AC-3.1.3, AC-3.1.6

- [x] No `"use client"` directive — plain module
- [x] Import `ActionItem` type from `'@/types'`
- [x] `getActions(sprintId: string): Promise<ActionItem[]>` — `GET /api/actions?sprintId=X`; throw on non-OK
- [x] `getActionsByStatus(items: ActionItem[]): ActionItem[]` — pure sort using `STATUS_ORDER = { 'open': 0, 'in-progress': 1, 'completed': 2, 'verified': 3 }`; stable sort: primary key `STATUS_ORDER[item.status]`, secondary key `item.createdAt` ascending
- [x] `createAction(payload): Promise<ActionItem>` — validate `title.trim() !== ''` and `ownerId !== ''` (throw before fetch); `POST /api/actions`; throw on non-OK; return parsed JSON
- [x] `advanceStatus(itemId: string): Promise<ActionItem>` — `PATCH /api/actions/${itemId}/advance`; throw on non-OK
- [x] `verifyImpact(itemId: string, impactNote: string): Promise<ActionItem>` — throw `'impactNote is required'` before fetch if `impactNote.trim() === ''`; `PATCH /api/actions/${itemId}/verify` with `{ impactNote }`; throw on non-OK
- [x] `getCompletionRate(items: ActionItem[]): number` — `items.length === 0 ? 0 : Math.round(items.filter(i => i.status === 'verified').length / items.length * 100)`

**Exact exports**:
```ts
export async function getActions(sprintId: string): Promise<ActionItem[]>
export function getActionsByStatus(items: ActionItem[]): ActionItem[]
export async function createAction(payload: CreateActionPayload): Promise<ActionItem>
export async function advanceStatus(itemId: string): Promise<ActionItem>
export async function verifyImpact(itemId: string, impactNote: string): Promise<ActionItem>
export function getCompletionRate(items: ActionItem[]): number
```

Where `CreateActionPayload` is:
```ts
interface CreateActionPayload {
  title: string
  description: string
  ownerId: string
  dueDate: string
  sourceFeedbackId: string
  sourceQuote: string
  sprintId: string
}
```

---

### Task S3-S1-3: Create `src/components/ActionItemCard.tsx`

**Target lines**: ~90  
**AC**: AC-3.1.2, AC-3.2.3, AC-3.2.4, AC-3.2.6

- [x] `"use client"` directive
- [x] Import `ActionItem` from `'@/types'`
- [x] Props interface:
  ```ts
  interface ActionItemCardProps {
    item: ActionItem
    ownerName: string
    onAdvance: (itemId: string) => void
    onVerify: (item: ActionItem) => void
  }
  ```
- [x] Status badge map:
  ```ts
  const STATUS_DISPLAY: Record<ActionItem['status'], string> = {
    'open': 'Open',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'verified': 'Verified',
  }
  ```
- [x] Due date label: compare `item.dueDate.slice(0, 10)` to `new Date().toISOString().slice(0, 10)` → `"Due Today"` or `"Due This Sprint"`; render nothing if `dueDate` is empty string
- [x] Owner avatar: `ownerName.charAt(0).toUpperCase()` in a rounded div
- [x] SOURCE FEEDBACK block: render only when `item.sourceFeedbackId !== '' && item.sourceQuote !== ''`; label `"SOURCE FEEDBACK"` in small caps; quote in italic text
- [x] Impact note block: render only when `item.status === 'verified' && item.impactNote`
- [x] Buttons:
  - `"Advance Status"` — rendered when `status === 'open' || status === 'in-progress'`; `onClick={() => onAdvance(item._id)}`; `data-testid="advance-btn"`
  - `"Verify Impact"` — rendered when `status === 'completed'`; `onClick={() => onVerify(item)}`; `data-testid="verify-btn"`
  - No button when `status === 'verified'`

---

### Task S3-S1-4: Create `src/components/NewActionItemModal.tsx`

**Target lines**: ~110  
**AC**: AC-3.1.4, AC-3.1.5, AC-3.1.6

- [x] `"use client"` directive
- [x] Import `User` from `'@/types'`
- [x] Props:
  ```ts
  interface NewActionItemModalProps {
    open: boolean
    sprintId: string
    users: Pick<User, '_id' | 'name'>[]
    onClose: () => void
    onSubmit: (payload: CreateActionPayload) => Promise<void>
  }
  ```
- [x] Internal state: `title`, `description`, `ownerId`, `dueDate`, `isSubmitting`
- [x] `if (!open) return null`
- [x] `data-testid="new-action-modal"` on container div; `role="dialog"`, `aria-modal="true"`, `aria-labelledby="nam-title"`
- [x] Title input: `placeholder="e.g. Add automated test coverage"`, `id="nam-title-input"`
- [x] Description textarea: `placeholder="What needs to be done and why?"`
- [x] Owner `<select>`: default `<option value="">Select owner</option>` followed by `users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)`
- [x] Due date `<input type="date">`
- [x] `submitDisabled = !title.trim() || !ownerId || isSubmitting`
- [x] Submit button: `data-testid="new-action-submit-btn"`, text `"Create Action Item"`, `disabled={submitDisabled}`
- [x] `handleClose`: resets all state → calls `onClose()`
- [x] `handleSubmit`: `e.preventDefault()` → `setIsSubmitting(true)` → `await onSubmit({ title, description, ownerId, dueDate, sourceFeedbackId: '', sourceQuote: '', sprintId })` → `handleClose()` → finally `setIsSubmitting(false)`

---

### Task S3-S1-5: Create `src/app/actions/page.tsx`

**Target lines**: ~130  
**AC**: AC-3.1.1–3.1.7

- [x] `"use client"` directive
- [x] Imports: `useState`, `useEffect`, `useCallback` from `'react'`; `useRouter` from `'next/navigation'`; `Shell`; `ActionItemCard`; `NewActionItemModal`; `getCurrentUser` from `'@/services/userService'`; `getActions`, `getActionsByStatus` from `'@/services/actionService'`; `ActionItem`, `Sprint`, `User` types
- [x] State: `sprint: Sprint | null`, `actions: ActionItem[]`, `users: Pick<User, '_id' | 'name'>[]`, `showNewModal: boolean`, `showVerifyModal: boolean`, `verifyTarget: ActionItem | null`, `isLoading: boolean`
- [x] `refetch` useCallback: `getActions(sprint._id)` → `getActionsByStatus(items)` → `setActions`
- [x] `useEffect` on mount: session guard → `GET /api/sprints` → resolve active sprint → `GET /api/users` → set users → `refetch()`
- [x] `handleAdvance(itemId)`: `advanceStatus(itemId)` → `refetch()` (catch silently)
- [x] `handleVerify(item)`: `setVerifyTarget(item)`, `setShowVerifyModal(true)`
- [x] `handleVerifySubmit(itemId, impactNote)`: `verifyImpact(itemId, impactNote)` → `refetch()` → `setShowVerifyModal(false)`
- [x] Status bar: 4 pill badges with counts computed from `actions` array
- [x] Owner resolution: compute `usersMap: Record<string, string>` (`userId → name`) from `users` array; pass `ownerName={usersMap[item.ownerId] ?? 'Unknown'}` to each `ActionItemCard`
- [x] Empty state: renders when `actions.length === 0` and `!isLoading`; heading `"No action items yet."`; body `"Convert feedback from the Feedback Board, or add one directly."`; `"Go to Feedback Board"` button → `router.push('/feedback')`; `"+ New Action Item"` button → `setShowNewModal(true)`
- [x] Loading state: same Shell wrap, spinner or `"Loading..."` text
- [x] Wire `<NewActionItemModal open={showNewModal} ... />`
- [x] Wire `<VerifyImpactModal open={showVerifyModal} item={verifyTarget} ... />` — **stub only in Session 1**: `{showVerifyModal && <div data-testid="verify-modal-stub" />}` (Session 2 replaces with real component)

---

### Task S3-S1-6: Create `src/__tests__/actionService.test.ts`

**Target lines**: ~120  
**AC**: AC-3.1.2, AC-3.1.3, AC-3.1.6, AC-3.2.3, AC-3.2.5, AC-3.2.6

- [x] `@jest-environment node` for API route tests
- [x] Mock `@/lib/db` → `connectDB` no-op
- [x] Mock `@/lib/models/ActionItem` with `MockActionItemModel` (constructor + `save`, `find`, `findById` stubs) — same pattern as Sprint 2 `FeedbackItem` mock
- [x] `makeActionItem(overrides)` factory: default `{ _id: 'ai-1', title: 'Test', description: '', ownerId: 'user-1', status: 'open', sourceFeedbackId: '', sourceQuote: '', sprintId: 'sprint-1', dueDate: '', createdAt: new Date().toISOString() }`
- [x] **AS-1**: `getActionsByStatus` — mixed-status array returns correct order (open first, then in-progress, completed, verified)
- [x] **AS-2**: `getActionsByStatus` — does not mutate original array
- [x] **AS-3**: `getCompletionRate` — 2 verified out of 5 → 40; 0 items → 0
- [x] **AS-4**: `GET /api/actions?sprintId=sprint-1` → 200 + array
- [x] **AS-5**: `GET /api/actions` (no sprintId) → 400
- [x] **AS-6**: `POST /api/actions` with valid payload → 201
- [x] **AS-7**: `POST /api/actions` missing `title` → 400
- [x] **AS-8**: `PATCH /api/actions/[id]/advance` from `open` → returns item with `status: 'in-progress'`
- [x] **AS-9**: `PATCH /api/actions/[id]/advance` from `in-progress` → returns item with `status: 'completed'`
- [x] **AS-10**: `PATCH /api/actions/[id]/advance` when `status === 'completed'` → 409
- [x] **AS-11**: `PATCH /api/actions/[id]/verify` with non-empty `impactNote` and `status === 'completed'` → 200 + `status: 'verified'` + `impactNote` in response
- [x] **AS-12**: `PATCH /api/actions/[id]/verify` with empty `impactNote` → 400
- [x] **AS-13**: `PATCH /api/actions/[id]/verify` when `status !== 'completed'` → 409
- [x] **AS-VG-1**: `actionService.verifyImpact(id, '')` throws before calling `fetch`; `global.fetch` never called

---

### Session 1 Completion Gate

Before proceeding to Session 2, confirm:

- [ ] `corepack yarn tsc --noEmit` → 0 errors
- [ ] `corepack yarn test` → 0 failures (Sprint 1 + 2 regressions: 0; AS-1 through AS-VG-1 passing)
- [ ] Action Items page renders at `/actions` with Shell wrapper
- [ ] Empty state renders correctly with both CTA buttons
- [ ] "+ New Action Item" opens modal; "Create Action Item" button disabled until title + owner selected
- [ ] Creating action item calls `POST /api/actions`; modal closes; list re-fetches
- [ ] Status summary bar shows correct counts per status group
- [ ] Cards sorted Open → In Progress → Completed → Verified

---

## DEV Session 2 — Convert from Feedback + Verify Impact

**Goal**: Add "Convert to Action" button on `should-try` feedback cards, wire `ConvertActionModal`, implement `VerifyImpactModal`, add advance API routes.

---

### Task S3-S2-1: Create `src/app/api/actions/[id]/advance/route.ts`

**Target lines**: ~45  
**AC**: AC-3.2.3

- [ ] Import `NextRequest`, `NextResponse`; `connectDB`; `ActionItemModel`
- [ ] `PATCH` handler: `connectDB()`; `ActionItemModel.findById(params.id)`; 404 if not found
- [ ] Transition map: `const NEXT_STATUS = { 'open': 'in-progress', 'in-progress': 'completed' }`
- [ ] If `status === 'completed' || status === 'verified'` → return 409 `{ error: 'Cannot advance a verified or completed item' }`
- [ ] `item.status = NEXT_STATUS[item.status]`; `await item.save()`; return `NextResponse.json(item, { status: 200 })`
- [ ] `try/catch` → 500

**Exact signature**:
```ts
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse>
```

---

### Task S3-S2-2: Create `src/app/api/actions/[id]/verify/route.ts`

**Target lines**: ~50  
**AC**: AC-3.2.6

- [ ] Import same as advance route
- [ ] `PATCH` handler: `connectDB()`; parse body → extract `impactNote`
- [ ] 400 if `!impactNote?.trim()`
- [ ] `ActionItemModel.findById(params.id)`; 404 if not found
- [ ] 409 if `item.status !== 'completed'` → `{ error: 'Action item must be completed before verifying' }`
- [ ] `item.status = 'verified'`; `item.impactNote = impactNote`; `item.completedAt = new Date()`; `await item.save()`; return `NextResponse.json(item, { status: 200 })`
- [ ] `try/catch` → 500

---

### Task S3-S2-3: Create `src/components/ConvertActionModal.tsx`

**Target lines**: ~120  
**AC**: AC-3.2.1, AC-3.2.2

- [ ] `"use client"` directive
- [ ] Import `FeedbackItem`, `User` from `'@/types'`
- [ ] Props:
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
- [ ] `if (!open || !feedbackItem) return null`
- [ ] `data-testid="convert-action-modal"` on container; `role="dialog"`, `aria-modal="true"`
- [ ] Title: `"Convert to Action Item"`; subtitle: `"Create an action item from this high-voted feedback."`
- [ ] Source quote blockquote: `feedbackItem.content` in italic, `border-l-4 border-blue-500` left border
- [ ] Initialize `title` state to `feedbackItem.content` (re-initialize via `useEffect` on `feedbackItem` change)
- [ ] Description textarea: `placeholder="Details on how to implement this..."`
- [ ] Assigned To `<select>`: default `<option value="">Select owner</option>`
- [ ] Due date `<input type="date">`
- [ ] `submitDisabled = !title.trim() || !ownerId || isSubmitting`
- [ ] Submit button: `data-testid="convert-action-submit-btn"`, text `"Create Action Item"`, amber/orange background (`bg-amber-500 hover:bg-amber-600 text-white`)
- [ ] `handleSubmit`: `await onSubmit({ title, description, ownerId, dueDate, sourceFeedbackId: feedbackItem._id, sourceQuote: feedbackItem.content, sprintId })` → `handleClose()`

---

### Task S3-S2-4: Create `src/components/VerifyImpactModal.tsx`

**Target lines**: ~90  
**AC**: AC-3.2.4, AC-3.2.5, AC-3.2.6

- [ ] `"use client"` directive
- [ ] Import `ActionItem` from `'@/types'`
- [ ] Props:
  ```ts
  interface VerifyImpactModalProps {
    open: boolean
    item: ActionItem | null
    onClose: () => void
    onSubmit: (itemId: string, impactNote: string) => Promise<void>
  }
  ```
- [ ] `if (!open || !item) return null`
- [ ] `data-testid="verify-impact-modal"` on container; `role="dialog"`, `aria-modal="true"`
- [ ] Title: `"Verify Impact"`; subtitle: `"Describe how this action item made a real difference for the team."`
- [ ] Source quote blockquote: render only when `item.sourceQuote !== ''`; orange left border (`border-l-4 border-amber-500`)
- [ ] Impact Statement textarea: `placeholder="e.g. Deployments now take 5 minutes instead of 45…"`, `maxLength={300}`, `onChange` updates `impactNote` state
- [ ] Character counter: `<span>{impactNote.length} / 300</span>` — updates live
- [ ] `submitDisabled = !impactNote.trim() || impactNote.length > 300 || isSubmitting`
- [ ] Submit button: `data-testid="verify-impact-submit-btn"`, text `"Confirm Verified"`, amber background
- [ ] `handleSubmit`: `await onSubmit(item._id, impactNote)` → `handleClose()`

---

### Task S3-S2-5: Add `onConvert` prop to `FeedbackCard.tsx` and `FeedbackColumn.tsx`

**Target lines added**: ~15 total across both files  
**AC**: AC-3.2.1

**`FeedbackCard.tsx`**:
- [ ] Add to props interface: `onConvert?: (item: FeedbackItem) => void`
- [ ] Render `"Convert to Action"` button only when `item.category === 'should-try' && onConvert !== undefined`:
  ```tsx
  {item.category === 'should-try' && onConvert && (
    <button
      onClick={() => onConvert(item)}
      data-testid="convert-btn"
      className="..."
    >
      Convert to Action
    </button>
  )}
  ```

**`FeedbackColumn.tsx`**:
- [ ] Add to props interface: `onConvert?: (item: FeedbackItem) => void`
- [ ] Forward to each `<FeedbackCard onConvert={onConvert} />`

---

### Task S3-S2-6: Wire `ConvertActionModal` into `feedback/page.tsx`

**Target lines added**: ~20  
**AC**: AC-3.2.2

- [ ] Add imports: `ConvertActionModal`, `createAction` from `'@/services/actionService'`, `FeedbackItem` type (already imported)
- [ ] Add state: `showConvertModal: boolean`, `convertTarget: FeedbackItem | null`, `users: Pick<User, '_id' | 'name'>[]`
- [ ] Fetch users in `useEffect` alongside sprint fetch: `GET /api/users` → set `users`
- [ ] `handleConvert(item: FeedbackItem)`: `setConvertTarget(item)`, `setShowConvertModal(true)`
- [ ] `handleConvertSubmit(payload)`: `await createAction(payload)` → `setShowConvertModal(false)` (no feedback refetch needed)
- [ ] Pass `onConvert={handleConvert}` to all three `<FeedbackColumn>` instances
- [ ] Wire `<ConvertActionModal open={showConvertModal} feedbackItem={convertTarget} sprintId={sprint?._id ?? ''} users={users} onClose={() => setShowConvertModal(false)} onSubmit={handleConvertSubmit} />`

---

### Task S3-S2-7: Replace `verify-modal-stub` in `actions/page.tsx` with real `<VerifyImpactModal>`

**Target lines**: ~10  
**AC**: AC-3.2.4, AC-3.2.5, AC-3.2.6

- [ ] Import `VerifyImpactModal`
- [ ] Remove `{showVerifyModal && <div data-testid="verify-modal-stub" />}`
- [ ] Replace with `<VerifyImpactModal open={showVerifyModal} item={verifyTarget} onClose={() => { setShowVerifyModal(false); setVerifyTarget(null) }} onSubmit={handleVerifySubmit} />`

---

### Task S3-S2-8: Create `src/__tests__/actionItems.test.tsx`

**Target lines**: ~150  
**AC**: AC-3.1.1, AC-3.1.4, AC-3.1.7, AC-3.2.1, AC-3.2.2, AC-3.2.3, AC-3.2.4, AC-3.2.5, AC-3.2.6

- [ ] `jest-environment-jsdom` (default)
- [ ] Mock `next/navigation` → `useRouter: () => ({ push: mockPush })`, `usePathname: () => '/actions'`
- [ ] Mock `@/services/userService` → `getCurrentUser: jest.fn()`
- [ ] Mock `@/services/actionService` → `getActions: jest.fn()`, `getActionsByStatus: jest.fn().mockImplementation(items => [...items])`, `createAction: jest.fn()`, `advanceStatus: jest.fn()`, `verifyImpact: jest.fn()`, `getCompletionRate: jest.fn()`
- [ ] Mock `@/components/layout/Shell` → passthrough wrapper with `data-testid="shell"`
- [ ] Mock `global.fetch` for sprint + user fetches

**Test cases**:
- [ ] **AI-1**: Page mounts with valid session user → Shell renders, no redirect
- [ ] **AI-2**: No session user → `router.push('/')` called
- [ ] **AI-3**: Empty `getActions` return → empty state text `"No action items yet."` present
- [ ] **AI-4**: "Go to Feedback Board" button in empty state → `router.push('/feedback')`
- [ ] **AI-5**: `getActions` returns items → `ActionItemCard` elements render (verify by card title text)
- [ ] **AI-6**: "Advance Status" button click → `advanceStatus` called with correct `itemId` → `getActions` re-fetched
- [ ] **AI-7**: `ActionItemCard` with `status === 'completed'` → "Verify Impact" button present, "Advance Status" absent
- [ ] **AI-8**: `ActionItemCard` with `status === 'verified'` → neither "Advance Status" nor "Verify Impact" button present
- [ ] **AI-9**: "Verify Impact" click → `data-testid="verify-impact-modal"` appears in DOM
- [ ] **AI-10**: `VerifyImpactModal` — submit disabled when `impactNote` is empty
- [ ] **AI-11**: `VerifyImpactModal` — submit disabled when `impactNote.length > 300`
- [ ] **AI-12**: `VerifyImpactModal` — typing non-empty impact note → submit enabled → click submit → `verifyImpact` called → modal closes → `getActions` re-fetched
- [ ] **AI-13**: SOURCE FEEDBACK block present when `sourceFeedbackId !== ''`; absent when `sourceFeedbackId === ''`

---

### Session 2 Completion Gate

Before declaring Sprint 3 complete, confirm all Definition of Done items:

- [ ] `corepack yarn tsc --noEmit` → 0 errors
- [ ] `corepack yarn test` → 0 failures (Sprint 1 + 2 regressions: 0; AS-1 through AS-VG-1 + AI-1 through AI-13 all passing)
- [ ] Full lifecycle in browser: create → Open → In Progress → Completed → Verified
- [ ] Converting `should-try` feedback opens `ConvertActionModal` pre-filled with feedback content
- [ ] Converting `went-well` or `slowed-us-down` card: "Convert to Action" button not visible
- [ ] Verify Impact: submit disabled when impact note empty; "Confirm Verified" transitions to Verified
- [ ] SOURCE FEEDBACK block visible when `sourceFeedbackId` set; hidden for direct creates
- [ ] `impactNote` text displays on verified cards
- [ ] `corepack yarn build` → 0 errors
- [ ] `git commit -m "Sprint 3 complete: Action Items"` committed

---

## Sprint 3 Acceptance Criteria Traceability Matrix

| AC-ID | Criterion Summary | Session | Task(s) | Test Coverage |
|---|---|---|---|---|
| AC-3.1.1 | `/actions` renders with Shell; session guard | S1 | S3-S1-5 | AI-1, AI-2 |
| AC-3.1.2 | Lists all action items with title, owner, status, due date | S1 | S3-S1-3, S3-S1-5 | AI-5, AS-4 |
| AC-3.1.3 | Items sorted: Open → In Progress → Completed → Verified | S1 | S3-S1-2, S3-S1-5 | AS-1, AS-2 |
| AC-3.1.4 | "+ New Action Item" button opens modal | S1 | S3-S1-4, S3-S1-5 | AI-1 (implicit) |
| AC-3.1.5 | Modal fields: Title, Description, Owner, Due Date | S1 | S3-S1-4 | AI-3 (new-action-modal present) |
| AC-3.1.6 | Creating calls `createAction()` → POST `/api/actions`; `sourceFeedbackId: ''` | S1 | S3-S1-2, S3-S1-5 | AS-6, AS-7 |
| AC-3.1.7 | Empty state with both CTA buttons | S1 | S3-S1-5 | AI-3, AI-4 |
| AC-3.2.1 | "Convert to Action" on `should-try` cards only | S2 | S3-S2-5 | AI-13 (implicit via convert-btn testid) |
| AC-3.2.2 | Convert modal pre-fills title from feedback; sets `sourceFeedbackId` + `sourceQuote` | S2 | S3-S2-3, S3-S2-6 | AI-9 (convert-action-modal testid) |
| AC-3.2.3 | Advance Status: open→in-progress→completed | S2 | S3-S2-1, S3-S1-2 | AS-8, AS-9, AS-10, AI-6 |
| AC-3.2.4 | "Verify Impact" button when status = Completed | S2 | S3-S1-3, S3-S2-7 | AI-7 |
| AC-3.2.5 | Verify Impact modal: non-empty statement required | S2 | S3-S2-4 | AI-10, AI-11, AS-12 |
| AC-3.2.6 | Verification: status=verified, impactNote persisted | S2 | S3-S2-2, S3-S2-4 | AS-11, AS-13, AI-12 |

---

---

# Sprint 4 — Implementation Plan

**Goal**: Sprint Setup page + Admin Controls (Epic 4.1). Single DEV session.  
**Target**: ~410 lines across 6 new/modified files  
**Prerequisite**: Sprint 3 complete and merged

---

## DEV Session 1 — Sprint Setup + Admin Controls

**Files to write/modify** (target ~410 lines total):

| Task | File | Action | Target lines | AC coverage |
|---|---|---|---|---|
| S4-1 | `src/app/api/sprints/[id]/route.ts` | CREATE | ~50 | AC-4.1.2, AC-4.1.3, AC-4.1.7 |
| S4-2 | `src/app/api/sprints/[id]/status/route.ts` | CREATE | ~30 | AC-4.1.4, AC-4.1.7 |
| S4-3 | `src/services/sprintService.ts` | CREATE | ~80 | AC-4.1.7, AC-4.1.10 |
| S4-4 | `src/app/sprint-setup/page.tsx` | CREATE | ~150 | AC-4.1.1–AC-4.1.10 |
| S4-5 | `src/app/api/users/route.ts` | MODIFY | ~+8 | AC-4.1.3 (username lookup) |
| S4-6 | `src/app/feedback/page.tsx` | MODIFY | ~+5 | AC-4.1.5 (closed guard) |
| S4-7 | `src/components/layout/Shell.tsx` | MODIFY | ~+3 | AC-4.1.1 (nav link) |
| S4-8 | `src/__tests__/sprintService.test.ts` | CREATE | ~70 | SS-1–SS-8 |
| S4-9 | `src/__tests__/sprintSetup.test.tsx` | CREATE | ~70 | SS-9–SS-17 |

---

### Task S4-1: Create `src/app/api/sprints/[id]/route.ts`

**Target lines**: ~50  
**AC**: AC-4.1.2, AC-4.1.3, AC-4.1.7

- [ ] Import `NextRequest`, `NextResponse`; `connectDB`; `SprintModel`
- [ ] `PATCH` handler: `connectDB()`; parse body; extract `{ name, goal, startDate, endDate, teamMemberIds }`
- [ ] Validate at least one recognized field is present; 400 `{ error: 'No updatable fields provided' }` if body is effectively empty
- [ ] `SprintModel.findById(params.id)`; 404 if not found
- [ ] Apply only provided fields with `if (body.X !== undefined) item.X = body.X` for each of the 5 updatable fields
- [ ] `await item.save()`; return `NextResponse.json(item, { status: 200 })`
- [ ] `try/catch` → `void err` → 500
- [ ] `status` field is **NOT** handled here — use `/status` route

**Exact signature**:
```ts
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse>
```

---

### Task S4-2: Create `src/app/api/sprints/[id]/status/route.ts`

**Target lines**: ~30  
**AC**: AC-4.1.4, AC-4.1.7

- [ ] Import `NextRequest`, `NextResponse`; `connectDB`; `SprintModel`
- [ ] `PATCH` handler: `connectDB()`; parse body; extract `{ status }`
- [ ] Validate `status` is `'open'` or `'closed'`; 400 `{ error: "status must be 'open' or 'closed'" }` otherwise
- [ ] `SprintModel.findById(params.id)`; 404 if not found
- [ ] `item.status = status`; `await item.save()`; return `NextResponse.json(item, { status: 200 })`
- [ ] `try/catch` → `void err` → 500

---

### Task S4-3: Create `src/services/sprintService.ts`

**Target lines**: ~80  
**AC**: AC-4.1.7, AC-4.1.10

- [ ] Import `Sprint` from `'@/types'`
- [ ] `getActiveSprint()`: `GET /api/sprints` → normalise: `Array.isArray(data) ? null : data as Sprint`; throw on non-2xx
- [ ] `createSprint(payload)`: `POST /api/sprints` with body `{ name, goal, startDate, endDate }`; throw on non-2xx; return `Sprint`
- [ ] `updateSprint(id, payload)`: `PATCH /api/sprints/${id}` with body as `payload`; throw on non-2xx; return `Sprint`
- [ ] `openRetro(id)`: `PATCH /api/sprints/${id}/status` body `{ status: 'open' }`; throw on non-2xx; return `Sprint`
- [ ] `closeRetro(id)`: `PATCH /api/sprints/${id}/status` body `{ status: 'closed' }`; throw on non-2xx; return `Sprint`
- [ ] All functions: `headers: { 'Content-Type': 'application/json' }` on PATCH/POST; `throw new Error(json.error ?? 'Request failed')` on non-2xx

**Exact signatures**:
```ts
export async function getActiveSprint(): Promise<Sprint | null>
export async function createSprint(payload: {
  name: string; goal?: string; startDate: string; endDate: string
}): Promise<Sprint>
export async function updateSprint(
  id: string,
  payload: Partial<Pick<Sprint, 'name' | 'goal' | 'startDate' | 'endDate' | 'teamMemberIds'>>
): Promise<Sprint>
export async function openRetro(id: string): Promise<Sprint>
export async function closeRetro(id: string): Promise<Sprint>
```

---

### Task S4-4: Create `src/app/sprint-setup/page.tsx`

**Target lines**: ~150  
**AC**: AC-4.1.1 through AC-4.1.10

- [ ] `"use client"` directive
- [ ] Imports: `useState`, `useEffect`; `useRouter`; `Shell`; `getCurrentUser` from `userService`; `getAllUsers` from `userService`; `getActiveSprint`, `createSprint`, `updateSprint`, `openRetro`, `closeRetro` from `sprintService`; `Trash2` from `lucide-react`; `Sprint`, `User` from `'@/types'`
- [ ] Session guard: `getCurrentUser()` → null → `router.push('/')` in `useEffect`
- [ ] State: `sprint`, `isNewSprint`, `isLoading`, `loadError`, `isSaving`, `saveError`, `saveSuccess`, `name`, `goal`, `startDate`, `endDate`, `localStatus`, `teamMemberIds`, `resolvedMembers`, `usernameInput`, `memberError`, `isAddingMember`
- [ ] Derived: `dateError` (string), `saveDisabled` (boolean)
- [ ] `useEffect` on mount:
  - `const user = getCurrentUser(); if (!user) { router.push('/'); return }`
  - `Promise.all([getActiveSprint(), getAllUsers()])` → populate state or set `isNewSprint = true`
  - `finally { setIsLoading(false) }` — catch sets `loadError = true`
- [ ] Loading state: return `<Shell sprintName=""><div>Loading...</div></Shell>`
- [ ] `isAdmin = currentUser?.isAdmin === true`
- [ ] Admin view (`data-testid="admin-view"`):
  - Sprint Name `<input>` `data-testid="sprint-name-input"`
  - Sprint Goal `<textarea>` `data-testid="sprint-goal-input"`
  - Start Date `<input type="date">` `data-testid="start-date-input"`
  - End Date `<input type="date">` `data-testid="end-date-input"`
  - Date error `<p data-testid="date-error">` — conditional
  - Retro Status section `data-testid="retro-status-section"`:
    - Open radio `<input type="radio" data-testid="status-open">`
    - Closed radio `<input type="radio" data-testid="status-closed">`
  - Member rows: `data-testid="member-row"` + `data-testid="remove-member-btn"` on trash button
  - Add Member: `data-testid="username-input"` + `data-testid="add-member-btn"` + `data-testid="member-error"`
  - Save button `data-testid="save-btn"` — label: `isNewSprint ? "Save & Open Retro" : "Save Changes"`
  - Cancel button `data-testid="cancel-btn"`
  - Save success `<span data-testid="save-success">Sprint saved.</span>` — conditional
  - Save error `<p data-testid="save-error">` — conditional
- [ ] Non-admin view (`data-testid="readonly-view"`):
  - Sprint name, goal, dates as `<p>` text
  - Status as read-only badge
  - Member rows without trash icon
  - No Add Member form, no Save/Cancel buttons
- [ ] `handleSave`: update or create sprint; call openRetro/closeRetro if status changed; setSaveSuccess; setTimeout 2s
- [ ] `handleAddMember(username)`: fetch `/api/users?username=${username}`; check not found / duplicate; update state
- [ ] `handleRemoveMember(id)`: filter from `resolvedMembers` and `teamMemberIds`
- [ ] `handleCancel`: reset all form state to last loaded sprint values
- [ ] All inputs/textarea: `bg-secondary/50 border border-border/50 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-500/50`

---

### Task S4-5: Modify `src/app/api/users/route.ts` — Add `?username` filter

**Target lines added**: ~+8  
**AC**: AC-4.1.3

- [ ] Change `GET` signature from `GET()` to `GET(req: NextRequest)`
- [ ] Add: `const username = req.nextUrl.searchParams.get('username')`
- [ ] Add: `const query = username ? { username } : {}`
- [ ] Change: `UserModel.find({})` → `UserModel.find(query)`
- [ ] Keep existing `console.error` (pre-existing pattern in users route — consistent with file)
- [ ] Verify: `GET /api/users` with no param still returns all users (backward-compatible)

---

### Task S4-6: Modify `src/app/feedback/page.tsx` — Closed retro guard

**Target lines modified**: ~+5  
**AC**: AC-4.1.5

- [ ] Change `open-modal-btn` `onClick` from `() => setShowModal(true)` to `() => { if (sprint?.status !== 'closed') setShowModal(true) }`
- [ ] Add `disabled={sprint?.status === 'closed'}` prop to button
- [ ] Add `aria-label={sprint?.status === 'closed' ? 'Feedback submission is closed' : undefined}` prop
- [ ] Add conditional class: append `sprint?.status === 'closed' ? ' opacity-50 cursor-not-allowed' : ''` to className
- [ ] No new imports, no new state, no refetch changes

---

### Task S4-7: Modify `src/components/layout/Shell.tsx` — Add Sprint Setup nav item

**Target lines added**: ~+3  
**AC**: AC-4.1.1 (nav link), AC-UI-4.1.6

- [ ] Add import for `Settings` from `lucide-react` (if not already imported)
- [ ] Add nav item entry: `{ href: '/sprint-setup', label: 'Sprint Setup', icon: Settings }` to the `NAV_ITEMS` array (or equivalent nav list)
- [ ] Position: after "Action Items" nav item (matching mock's gear icon position at top of sidebar)

---

### Task S4-8: Create `src/__tests__/sprintService.test.ts`

**Target lines**: ~70  
**AC**: AC-4.1.7 (service + API route unit tests)  
**Jest environment**: `@jest-environment node`

- [ ] Mock `@/lib/db` → `connectDB: jest.fn()`
- [ ] Mock `@/lib/models/Sprint` — `findOne`, `findById`, `save`, constructor
- [ ] Mock `global.fetch` for service function tests

**Test cases** (SS-1 through SS-8):
- [ ] **SS-1**: `getActiveSprint()` — fetch returns sprint object → returns `Sprint`
- [ ] **SS-2**: `getActiveSprint()` — fetch returns `[]` → returns `null`
- [ ] **SS-3**: `createSprint(payload)` — fetch returns 201 → returns new `Sprint`
- [ ] **SS-4**: `updateSprint(id, payload)` — fetch returns 200 → returns updated `Sprint`
- [ ] **SS-5**: `openRetro(id)` — fetch PATCH `/status` with `{ status: 'open' }` → returns `Sprint`
- [ ] **SS-6**: `closeRetro(id)` — fetch PATCH `/status` with `{ status: 'closed' }` → returns `Sprint`
- [ ] **SS-7**: `PATCH /api/sprints/[id]` route — 404 when sprint not found
- [ ] **SS-8**: `PATCH /api/sprints/[id]/status` route — 400 when status is invalid enum value

---

### Task S4-9: Create `src/__tests__/sprintSetup.test.tsx`

**Target lines**: ~70  
**AC**: AC-4.1.1, AC-4.1.2, AC-4.1.4, AC-4.1.5, AC-4.1.6

- [ ] `jest-environment-jsdom` (default)
- [ ] Mock `next/navigation` → `useRouter: () => ({ push: mockPush })`, `usePathname: () => '/sprint-setup'`
- [ ] Mock `@/services/userService` → `getCurrentUser: jest.fn()`, `getAllUsers: jest.fn()`
- [ ] Mock `@/services/sprintService` → `getActiveSprint: jest.fn()`, `createSprint: jest.fn()`, `updateSprint: jest.fn()`, `openRetro: jest.fn()`, `closeRetro: jest.fn()`
- [ ] Mock `@/components/layout/Shell` → passthrough wrapper

**Test cases** (SS-9 through SS-17):
- [ ] **SS-9**: No session user → `router.push('/')` called
- [ ] **SS-10**: Admin user + sprint loaded → `data-testid="admin-view"` present; `data-testid="readonly-view"` absent
- [ ] **SS-11**: Non-admin user + sprint loaded → `data-testid="readonly-view"` present; `data-testid="admin-view"` absent
- [ ] **SS-12**: Admin view — Save button `data-testid="save-btn"` is disabled when Sprint Name is empty
- [ ] **SS-13**: Admin view — Save button enabled after typing sprint name + valid dates
- [ ] **SS-14**: Admin view — `endDate < startDate` → `data-testid="date-error"` present; save button disabled
- [ ] **SS-15**: Admin view — clicking Save calls `updateSprint` (when sprint loaded); `data-testid="save-success"` appears after
- [ ] **SS-16**: Admin view — `data-testid="status-open"` and `data-testid="status-closed"` radios present
- [ ] **SS-17**: `feedback/page.tsx` — `data-testid="open-modal-btn"` is disabled when sprint `status === 'closed'`

> **SS-17 note**: This test is in `sprintSetup.test.tsx` but tests `feedback/page.tsx` behaviour. It imports `FeedbackPage` directly, mocks `getCurrentUser`, `getFeedbackByLane`, and `global.fetch` (returning `{ status: 'closed', _id: 'sp1', name: 'Sprint 42' }` for `/api/sprints`). Asserts `getByTestId('open-modal-btn')` has `disabled` attribute.

---

### Session 1 Completion Gate

Before declaring Sprint 4 complete, confirm all Definition of Done items:

- [ ] `corepack yarn tsc --noEmit` → 0 errors
- [ ] `corepack yarn test` → 0 failures (Sprint 1–3 regressions: 0; SS-1 through SS-17 all passing)
- [ ] Admin flow in browser: create sprint → Save → sprint persisted in MongoDB → reload shows sprint data
- [ ] Closed retro: set status to Closed → visit `/feedback` → "Submit Feedback" button is disabled
- [ ] Non-admin: log in as non-admin → visit `/sprint-setup` → read-only view renders (no form inputs)
- [ ] Add Member: type a valid username → click "+ Add Member" → member appears in list
- [ ] Add Member error: type unknown username → "User not found" error displayed
- [ ] `GET /api/users?username=X` returns only matching user
- [ ] `corepack yarn build` → 0 errors
- [ ] `git commit -m "Sprint 4 complete: Sprint Setup + Admin Controls"` committed

---

## Sprint 4 Acceptance Criteria Traceability Matrix

| AC-ID | Criterion Summary | Task(s) | Test Coverage |
|---|---|---|---|
| AC-4.1.1 | `/sprint-setup` renders; session guard; Shell wrapper; nav link | S4-4, S4-7 | SS-9, SS-10 |
| AC-4.1.2 | Admin sets Name, Goal, Start Date, End Date; save button label; date validation | S4-1, S4-4 | SS-12, SS-13, SS-14, SS-15 |
| AC-4.1.3 | Add members by username lookup; duplicate check; remove | S4-4, S4-5 | SS-10 (member-row present) |
| AC-4.1.4 | Open/close radio toggle; status persisted on Save | S4-2, S4-3, S4-4 | SS-16, SS-5, SS-6 |
| AC-4.1.5 | Closed retro disables Submit Feedback button | S4-6 | SS-17 |
| AC-4.1.6 | Non-admin sees read-only view | S4-4 | SS-11 |
| AC-4.1.7 | Sprint data persists via sprintService (create + update) | S4-1, S4-2, S4-3 | SS-3, SS-4, SS-7, SS-8, SS-15 |
| AC-4.1.8 | All `data-testid` values present | S4-4, S4-6 | All SS tests use testids |
| AC-4.1.9 | Loading + error states | S4-4 | SS-10 (loading resolves) |
| AC-4.1.10 | `Promise.all` fetch strategy; `getActiveSprint` normalisation | S4-3, S4-4 | SS-1, SS-2 |
