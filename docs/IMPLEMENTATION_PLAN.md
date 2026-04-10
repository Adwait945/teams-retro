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
