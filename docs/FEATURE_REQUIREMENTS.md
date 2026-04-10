# Feature Requirements — Sprint 1: Foundation

**Source Backlog**: `docs/Sprint1.md`  
**UI Mocks Analyzed**: `docs/ui-mocks/` (12 images)  
**Prototypes Analyzed**: `docs/prototypes/` (7 files)  
**Generated**: Sprint 1 — Types, MongoDB Data Layer, Registration, Dashboard  

---

## Table of Contents

1. [Epic 1.1 — Type Definitions + MongoDB Data Layer](#epic-11--type-definitions--mongodb-data-layer)
2. [Epic 1.2 — Registration Page](#epic-12--registration-page)
3. [Epic 1.3 — Dashboard Page](#epic-13--dashboard-page)
4. [Shared UI Shell Requirements](#shared-ui-shell-requirements)
5. [Dependency Map](#dependency-map)
6. [Definition of Done](#definition-of-done)

---

## Epic 1.1 — Type Definitions + MongoDB Data Layer

### User Story

> As a developer, I want a single source of truth for all TypeScript types and a MongoDB-backed data layer, so that every part of the app reads/writes real shared data the same way.

---

### Acceptance Criteria — Verbatim from Backlog

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

### Acceptance Criteria — Refined for Testability

| AC-ID | Testable Criterion |
|---|---|
| AC-1.1.1 | `src/types/index.ts` exports interfaces for `User`, `FeedbackItem`, `ActionItem`, and `Sprint`; each field listed in the DEV Session 1 schema table is present and typed (no `any`). A `tsc --noEmit` check with `strict: true` must pass. |
| AC-1.1.2 | Calling `connectDB()` twice in the same Node.js process returns the same Mongoose connection instance (connection state = `1`). A Jest unit test can verify `mongoose.connection.readyState === 1` after two calls. |
| AC-1.1.3 | Files `src/lib/models/User.ts`, `src/lib/models/Sprint.ts`, `src/lib/models/FeedbackItem.ts`, `src/lib/models/ActionItem.ts` each exist and export a Mongoose model. Each schema field matches the corresponding TypeScript interface field name and type. |
| AC-1.1.4 | `GET /api/users` returns HTTP 200 with a JSON array. `POST /api/users` with a valid body returns HTTP 201 and the created document. Missing required fields return HTTP 400. |
| AC-1.1.5 | `GET /api/sprints` returns HTTP 200 with the active sprint or an empty object. `POST /api/sprints` with a valid body returns HTTP 201 and the created document. |
| AC-1.1.6 | A `grep -r "mongodb+srv" src/` search returns zero results. The `connectDB()` function reads from `process.env.MONGODB_URI` exclusively. |
| AC-1.1.7 | Running `corepack yarn tsc --noEmit` produces exit code `0` with zero diagnostic messages. |

---

### Additional Type-Shape Requirements (derived from `src/types/index.ts` current state)

The existing `src/types/index.ts` must be **replaced/updated** to align with the MongoDB schema. The table below documents the required delta:

| Type | Current Field | Required Sprint 1 Field | Notes |
|---|---|---|---|
| `User` | `avatar: string` | No change — keep `avatar` | Prototype uses initials (e.g. "JD") as avatar |
| `User` | *(missing)* | `username: string` | Required by Registration form (AC-1.2.1) |
| `User` | *(missing)* | `pod: string` | Required by Registration form (AC-1.2.1) |
| `User` | *(missing)* | `isAdmin: boolean` | Required by AC-1.2.4 |
| `User` | *(missing)* | `createdAt: string` | Required by Mongoose model spec |
| `Sprint` | `isActive: boolean` | `status: "open" \| "closed"` | Matches `SprintSetup.tsx` Retro Status radio group; `isActive` derived as `status === "open"` |
| `Sprint` | *(missing)* | `goal: string` | Shown in `SetUpSprint.png` Sprint Goal field |
| `Sprint` | *(missing)* | `teamMemberIds: string[]` | Required by DEV Session 1 Sprint schema |
| `FeedbackItem` | `suggestedImprovement` | `suggestion` | Backlog DEV Session 1 schema names field `suggestion` |
| `FeedbackItem` | `upvotes: string[]` | `upvotedBy: string[]` + `upvotes: number` | Backlog schema uses both; upvotedBy for dedup, upvotes for display count |
| `ActionItem` | `deadline` | `dueDate` | Backlog schema names field `dueDate` |
| `ActionItem` | `feedbackId` | `sourceFeedbackId` | Backlog schema names field `sourceFeedbackId` |
| `ActionItem` | *(missing)* | `sourceQuote: string` | Shown in `ActionItems.png` "Source Feedback" quote block |
| `ActionItem` | `impactDescription` | `impactNote` | Backlog schema names field `impactNote` |
| `PointEvent` | *(present, stub)* | Keep stub shape | PointEvent is noted as stub in DEV Session 1 |
| `Badge` | *(present, stub)* | Keep stub shape | Badge is noted as stub in DEV Session 1 |

---

### Files to Create (Epic 1.1)

| File | Purpose |
|---|---|
| `src/types/index.ts` | **Update** — add `username`, `pod`, `isAdmin`, `createdAt` to `User`; align field names to match Mongoose schemas |
| `src/lib/db.ts` | **Create** — `connectDB()` singleton |
| `src/lib/models/User.ts` | **Create** — Mongoose schema |
| `src/lib/models/Sprint.ts` | **Create** — Mongoose schema |
| `src/lib/models/FeedbackItem.ts` | **Create** — Mongoose schema |
| `src/lib/models/ActionItem.ts` | **Create** — Mongoose schema |
| `src/app/api/users/route.ts` | **Create** — GET + POST handlers |
| `src/app/api/sprints/route.ts` | **Create** — GET + POST handlers |
| `src/services/userService.ts` | **Create** — `registerUser()`, `getCurrentUser()`, `getAllUsers()` |
| `src/__tests__/userApi.test.ts` | **Create** — API route unit tests |

---

## Epic 1.2 — Registration Page

### User Story

> As a new team member, I want to register with my name, username, and pod, so that my identity is saved to the shared database and I can start using the tool.

---

### Acceptance Criteria — Verbatim from Backlog

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

### Acceptance Criteria — Refined for Testability

| AC-ID | Testable Criterion |
|---|---|
| AC-1.2.1 | Navigating to `/` renders a page containing: a text input labeled "Your Name", a text input labeled "Username" (present in backlog but not in prototype mock — see note below), and a `<select>` labeled "Pod". All three are required. |
| AC-1.2.2 | The Pod `<select>` renders exactly three `<option>` elements with values `pod1`, `pod2`, `pod3` and display labels "Pod 1", "Pod 2", "Pod 3" respectively. No other pod options are present. |
| AC-1.2.3 | Submitting the form dispatches a `POST` request to `/api/users` with a JSON body containing `{ name, username, pod }`. `userService.registerUser()` is the sole caller of this endpoint from the client. |
| AC-1.2.4 | The `/api/users` `POST` handler counts existing users via `User.countDocuments()`; if count is `0` the new document is saved with `isAdmin: true`, else `isAdmin: false`. A test with mocked empty DB confirms first user is admin; a test with one existing user confirms second user is not admin. |
| AC-1.2.5 | On a successful `201` response, the returned user object is written to `sessionStorage` under a defined key (e.g. `retroboard_user`). `router.push('/dashboard')` is called. A Jest test mocks `sessionStorage.setItem` and `router.push` and asserts both are called after a successful submit. |
| AC-1.2.6 | On component mount, if `sessionStorage.getItem('retroboard_user')` returns a non-null value, `router.push('/dashboard')` is called without rendering the form. A test with pre-seeded `sessionStorage` confirms the redirect fires before render completes. |
| AC-UI-1.2.1 | *(See AC-UI rows below)* |
| AC-UI-1.2.2 | The "Join RetroBoard" button has the `disabled` attribute when any of the three input fields is empty. A Jest/RTL test fills 0, 1, and 2 fields and asserts button is disabled; fills all 3 and asserts button is enabled. |

> **Note on AC-1.2.1 vs. prototype**: The `docs/prototypes/Registration.tsx` prototype renders only "Your Name" + "Pod" (2 fields). The `Sprint1.md` backlog adds a **Username** field as the third required field. The backlog takes precedence per Sprint 1 definition. The mock image (`registration.png`) also shows only 2 fields — this divergence is a known prototype/backlog delta. The implemented page must include all 3 fields as specified in AC-1.2.1.

---

### UI Requirements — Registration Page (from `docs/ui-mocks/registration.png` + `docs/prototypes/Registration.tsx`)

| AC-ID | Visual / Layout Requirement |
|---|---|
| AC-UI-1.2.1 | Page background is full-screen dark (`bg-background`), vertically and horizontally centered |
| AC-UI-1.2.3 | A `Hexagon` icon (Lucide) displayed above the app name, inside a `w-12 h-12` amber/primary-tinted rounded square with a subtle glow shadow |
| AC-UI-1.2.4 | App name "RetroBoard" displayed in bold below the logo icon |
| AC-UI-1.2.5 | A `Card` component contains the form, max-width `480px`, centered on screen |
| AC-UI-1.2.6 | `CardHeader` shows title "Welcome to RetroBoard" (center-aligned) and subtitle "Set up your identity to get started." |
| AC-UI-1.2.7 | "Your Name" text input with placeholder "e.g. Jane Doe"; input has a destructive/red border when a name-conflict validation error is shown |
| AC-UI-1.2.8 | Inline validation error message "This name is already taken in Pod X." appears in `text-destructive` color directly below the Name input when a conflict is detected |
| AC-UI-1.2.9 | Pod selector uses a `Select` component (shadcn/ui) with trigger label "Select a pod" and items: Pod 1, Pod 2, Pod 3 |
| AC-UI-1.2.10 | Primary CTA button labeled "Join RetroBoard" is full-width (`w-full`), height `h-11`, with bold text |
| AC-UI-1.2.11 | Footer helper text below the button reads "Your name and pod are saved to the shared team database. No account required." in `text-muted-foreground text-xs` |
| AC-UI-1.2.12 | The entire card and content has an entrance animation: `animate-in fade-in slide-in-from-bottom-4 duration-500` |
| AC-UI-1.2.13 | Page is fully usable at mobile widths; the card takes `w-full` up to `max-w-[480px]` with `p-4` padding on the outer container |

---

### Files to Create/Modify (Epic 1.2)

| File | Action |
|---|---|
| `src/app/page.tsx` | **Replace** — current dashboard implementation; port Registration form from `docs/prototypes/Registration.tsx`, add Username field, wire to `userService.registerUser()` |
| `src/services/userService.ts` | **Create** — `registerUser()`, `getCurrentUser()`, `getAllUsers()` |
| `src/__tests__/registration.test.tsx` | **Create** — render, validation, submit, sessionStorage cache, redirect tests. _Note: file is physically written in DEV Session 3 (Sprint1.md) to keep session line counts balanced, but it covers Epic 1.2 ACs and is owned by this Epic._ |

---

## Epic 1.3 — Dashboard Page

### User Story

> As a registered team member, I want to see a dashboard with live sprint stats fetched from the database, so that I can quickly understand the team's retro health.

---

### Acceptance Criteria — Verbatim from Backlog

| AC-ID | Criterion |
|---|---|
| AC-1.3.1 | Dashboard renders at `/dashboard` |
| AC-1.3.2 | Shows current sprint name and date range (fetched from `GET /api/sprints`) |
| AC-1.3.3 | Shows stat cards: Total Feedback, Open Actions, Completed Actions, Completion Rate % |
| AC-1.3.4 | Completion Rate = `(completed + verified) / total actions * 100` via `actionService.getCompletionRate()` |
| AC-1.3.5 | If no sprint is active, shows the empty state (matches `docs/ui-mocks/dashboard-empty.png`) |
| AC-UI-1.3.1 | Layout matches `docs/ui-mocks/Dashboard.png` — 4 stat cards, sprint info, sidebar |

---

### Acceptance Criteria — Refined for Testability

| AC-ID | Testable Criterion |
|---|---|
| AC-1.3.1 | Navigating to `/dashboard` renders the page without redirect. A Jest/RTL test with mocked `sessionStorage` (valid user present) confirms the component renders. If `sessionStorage` has no user, the page redirects to `/`. |
| AC-1.3.2 | The dashboard fetches `GET /api/sprints` on mount (via `actionService` or direct fetch). The rendered page displays the sprint name (e.g. "Sprint 42") and the formatted date range (e.g. "Oct 24 – Nov 6, 2023"). A test with mocked API response asserts these strings appear in the DOM. |
| AC-1.3.3 | Four stat cards are rendered with labels: "Total Feedback", "Open Actions", "Completed Actions", "Completion Rate". Each card displays a numeric or percentage value derived from fetched data. A test with known mock data asserts correct label-value pairings. |
| AC-1.3.4 | `actionService.getCompletionRate(sprintId)` returns `Math.round((completed + verified) / total * 100)`. Edge cases: `total = 0` returns `0` (no divide-by-zero). Unit tests cover: all open (0%), all completed (100%), mixed (e.g. 2 completed + 1 verified / 5 total = 60%). |
| AC-1.3.5 | When `GET /api/sprints` returns no active sprint (empty array or no `status: "open"` entry), the dashboard renders the empty state with heading "No sprint data yet.", body text "Set up your first sprint to get started.", and a "Set Up Sprint →" button linking to `/sprint-setup`. The stat card grid is NOT rendered. |
| AC-UI-1.3.1 | *(See AC-UI rows below)* |

---

### UI Requirements — Dashboard Populated State (from `docs/ui-mocks/Dashboard.png` + `docs/prototypes/Dashboard.tsx`)

| AC-ID | Visual / Layout Requirement |
|---|---|
| AC-UI-1.3.1 | Page uses the `Shell` layout component (sidebar + main content area); sidebar is visible at all times |
| AC-UI-1.3.2 | Four stat cards are arranged in a 4-column grid (`grid-cols-4 gap-4`): "Feedback Count" (blue icon), "Total Upvotes" (emerald icon), "Action Items" (amber icon), "Completion Rate" (indigo icon) |
| AC-UI-1.3.3 | Each stat card renders: label in `text-sm text-muted-foreground`, icon in a `p-2 bg-secondary/50 rounded-md` wrapper, and the value in `text-3xl font-bold` |
| AC-UI-1.3.4 | "Recent Feedback" section is a left column (`col-span-1` of a 2-col grid), showing up to the most recent feedback cards with a color-coded left border (green = positive, red = negative, blue = idea) |
| AC-UI-1.3.5 | Each feedback preview card shows: truncated content (`line-clamp-2`), author avatar (first letter in circle), author name, and relative timestamp (e.g. "2h ago") |
| AC-UI-1.3.6 | "Activity Feed" section is the right column of the 2-col grid, rendered inside a `retro-card`; each entry shows user avatar, user name in bold, action description in muted, and relative timestamp |
| AC-UI-1.3.7 | Activity feed items are connected by a vertical timeline line: `before:absolute before:left-[15px] before:top-8 before:bottom-[-20px] before:w-px before:bg-border`; last item has no line |
| AC-UI-1.3.8 | Page entrance animation: `animate-in fade-in slide-in-from-bottom-4 duration-500` wraps the entire content area |

---

### UI Requirements — Dashboard Empty State (from `docs/ui-mocks/dashboard-empty.png` + `docs/prototypes/Dashboard.tsx`)

| AC-ID | Visual / Layout Requirement |
|---|---|
| AC-UI-1.3.9 | Empty state card uses `border-dashed border-2 border-border/50` style with `bg-secondary/10` background |
| AC-UI-1.3.10 | Empty state heading text: "No sprint data yet." in `text-xl font-bold` |
| AC-UI-1.3.11 | Empty state body text: "Set up your first sprint to get started." in `text-muted-foreground` |
| AC-UI-1.3.12 | Empty state CTA button: "Set Up Sprint →" styled with `bg-blue-600 hover:bg-blue-700 text-white font-medium`; navigates to `/sprint-setup` |
| AC-UI-1.3.13 | A second empty card below the first displays text: "Activity will appear here once your team starts submitting feedback." in `text-muted-foreground`, using `bg-secondary/5 border-border/50` |
| AC-UI-1.3.14 | The sidebar (visible in `dashboard-empty.png`) shows "Sprint Setup" as the first nav item, followed by "Dashboard" (active, highlighted), "Feedback Board", "Action Items"; user identity card at the bottom shows name and pod |

---

### Files to Create (Epic 1.3)

| File | Action |
|---|---|
| `src/app/dashboard/page.tsx` | **Create** — port from `docs/prototypes/Dashboard.tsx`; wire to real API fetches via `actionService` |
| `src/app/api/actions/route.ts` | **Create** — `GET /api/actions?sprintId=X`, `POST /api/actions` |
| `src/services/actionService.ts` | **Create** — `getActions()`, `getCompletionRate()`, `getOpenCount()`, `getCompletedCount()` |
| `src/__tests__/dashboard.test.tsx` | **Create** — render with mocked API data, render empty state, stat calculation |
| `src/components/layout/Shell.tsx` | **Create** — shared sidebar + main-content wrapper layout component; referenced by Dashboard, Feedback Board, Action Items, Sprint Setup pages. Not present in `src/components/` — must be created here before any page that uses it. |

---

## Shared UI Shell Requirements

These requirements apply to every page that uses the `Shell` layout component (visible in `Dashboard.png`, `FeedbackBoard.png`, `ActionItems.png`, `action-items-empty.png`, `feedback-board-empty.png`, `SetUpSprint.png`, `dashboard-empty.png`).

### Sidebar Layout (from `docs/prototypes/Sidebar.tsx` + all mocks)

| AC-ID | Requirement |
|---|---|
| AC-UI-SHELL-1 | Sidebar is `w-[240px]`, fixed height (`h-screen`), with a right border (`border-r border-border`) and `bg-sidebar` background color |
| AC-UI-SHELL-2 | Sidebar header: `Hexagon` icon (Lucide, `fill-primary`) in an amber-tinted `w-8 h-8 rounded-lg` container, followed by bold "RetroBoard" text |
| AC-UI-SHELL-3 | Sprint label displayed below the header as `text-xs font-medium text-muted-foreground uppercase tracking-wider`; value is the active sprint name (e.g. "SPRINT 42") |
| AC-UI-SHELL-4 | Navigation items in order (as shown in the mocks): Sprint Setup (Settings icon), Dashboard (LayoutDashboard icon), Feedback Board (MessageSquare icon), Action Items (CheckSquare icon) |
| AC-UI-SHELL-5 | Active nav item: `bg-secondary text-primary-foreground` background; `text-primary` icon; a `w-1 h-5 bg-primary rounded-r-full` accent bar on the left edge |
| AC-UI-SHELL-6 | Inactive nav item: `text-muted-foreground`; hover state: `hover:bg-secondary/50 hover:text-foreground` |
| AC-UI-SHELL-7 | User identity card at the bottom of the sidebar, separated by `border-t border-border`: avatar circle (initials), user full name in `text-sm font-medium`, pod label in `text-xs text-muted-foreground`; styled with `bg-secondary/30 border border-border/50 rounded-lg` |
| AC-UI-SHELL-8 | Sidebar nav items and user card are only shown after a user is registered (i.e. `sessionStorage` has a valid user object) |

---

## Dependency Map

### Epic 1.1 Dependencies

| Dependency | File / Resource | Type |
|---|---|---|
| TypeScript type shapes | `src/types/index.ts` (existing — must update) | **Modify** |
| MongoDB connection | `.env.local` → `MONGODB_URI` | **Environment variable** |
| Mongoose | `package.json` → `mongoose` (add via `corepack yarn add mongoose`) | **New dependency** |
| DB singleton | `src/lib/db.ts` (new) | **New file** |
| User Mongoose model | `src/lib/models/User.ts` (new) | **New file** |
| Sprint Mongoose model | `src/lib/models/Sprint.ts` (new) | **New file** |
| FeedbackItem Mongoose model | `src/lib/models/FeedbackItem.ts` (new) | **New file** |
| ActionItem Mongoose model | `src/lib/models/ActionItem.ts` (new) | **New file** |
| API route — users | `src/app/api/users/route.ts` (new) | **New file** |
| API route — sprints | `src/app/api/sprints/route.ts` (new) | **New file** |

### Epic 1.2 Dependencies

| Dependency | File / Resource | Type |
|---|---|---|
| User TypeScript type | `src/types/index.ts` — `User` interface (updated in Epic 1.1) | **Consumes** |
| User API route | `src/app/api/users/route.ts` (created in Epic 1.1) | **Consumes** |
| User service | `src/services/userService.ts` (new) | **New file** |
| Registration page | `src/app/page.tsx` (existing — must replace) | **Replace** |
| Prototype reference | `docs/prototypes/Registration.tsx` | **Read-only reference** |
| UI mock reference | `docs/ui-mocks/registration.png` | **Read-only reference** |
| shadcn/ui components | `Input`, `Label`, `Select`, `Button`, `Card` from `@/components/ui/` | **Consumes** |
| sessionStorage | Browser `sessionStorage` API | **Runtime** |
| Next.js router | `next/navigation` → `useRouter()` | **Runtime** |

### Epic 1.3 Dependencies

| Dependency | File / Resource | Type |
|---|---|---|
| Sprint TypeScript type | `src/types/index.ts` — `Sprint` interface (updated in Epic 1.1) | **Consumes** |
| ActionItem TypeScript type | `src/types/index.ts` — `ActionItem` interface (updated in Epic 1.1) | **Consumes** |
| FeedbackItem TypeScript type | `src/types/index.ts` — `FeedbackItem` interface (updated in Epic 1.1) | **Consumes** |
| Sprints API route | `src/app/api/sprints/route.ts` (created in Epic 1.1) | **Consumes** |
| Actions API route | `src/app/api/actions/route.ts` (new in Epic 1.3) | **New file** |
| Action service | `src/services/actionService.ts` (new) | **New file** |
| Dashboard page | `src/app/dashboard/page.tsx` (new) | **New file** |
| Shell layout component | `@/components/layout/Shell` (referenced in prototypes — must exist or be created) | **Consumes / Create** |
| Prototype reference | `docs/prototypes/Dashboard.tsx` | **Read-only reference** |
| UI mock references | `docs/ui-mocks/Dashboard.png`, `docs/ui-mocks/dashboard-empty.png` | **Read-only reference** |
| Sidebar component | `src/components/sidebar.tsx` (existing) | **Consumes** |
| retro-store | `src/store/retro-store.tsx` (existing — **do NOT modify** in Sprint 1; will be migrated to API-backed store in a later sprint) | **Isolate / Do not touch** |

> **Important isolation note**: `src/store/retro-store.tsx` currently uses `localStorage`-backed mock data. Sprint 1 creates new API routes and services that are independent of this store. The store should not be modified in Sprint 1; the new `src/app/dashboard/page.tsx` must fetch data directly from API routes, not from `useRetro()`.

---

## Definition of Done

The following checklist must be fully satisfied for Sprint 1 to be considered complete.

| # | Criterion |
|---|---|
| 1 | All AC-1.1.x acceptance criteria pass |
| 2 | All AC-1.2.x acceptance criteria pass |
| 3 | All AC-1.3.x acceptance criteria pass |
| 4 | All 18 REVIEWER checklist points pass |
| 5 | `corepack yarn build` — 0 errors |
| 6 | `corepack yarn test` — 0 failures |
| 7 | `MONGODB_URI` present in `.env.local`, absent from all committed files |
| 8 | Registration saves user to MongoDB Atlas (verified in Atlas dashboard) |
| 9 | Two users registered in different browsers see each other's data on the Dashboard |
| 10 | Dashboard shows correct live stats from MongoDB |
| 11 | Empty state renders when no sprint is active |
| 12 | `git commit -m "Sprint 1 complete: Foundation + MongoDB"` committed |

---

## Prototype-to-Backlog Delta Summary

The following discrepancies were discovered between the prototype files and the Sprint 1 backlog. These are flagged to prevent implementation errors:

| Delta | Prototype | Backlog | Resolution |
|---|---|---|---|
| Registration fields | `Registration.tsx` has 2 fields: Name + Pod | Backlog AC-1.2.1 requires 3 fields: Full Name + Username + Pod | **Backlog wins** — implement 3 fields |
| Registration mock | `registration.png` shows 2 fields (Name + Pod) | Backlog adds Username | **Backlog wins** — add Username field to layout |
| Dashboard route | `Dashboard.tsx` is at root level (no route defined) | Backlog AC-1.3.1 places Dashboard at `/dashboard` | **Backlog wins** — create `src/app/dashboard/page.tsx` |
| Root route (`/`) | Currently renders existing dashboard in `src/app/page.tsx` | Sprint 1 replaces root route with Registration page | **Backlog wins** — `src/app/page.tsx` becomes Registration |
| Sprint `status` field | `src/types/index.ts` uses `isActive: boolean` | DEV Session 1 Sprint schema uses `status: "open" \| "closed"` | **Backlog wins** — update type to use `status` |
| FeedbackItem `suggestion` | `src/types/index.ts` uses `suggestedImprovement` | DEV Session 1 schema uses `suggestion` | **Backlog wins** — update field name |
| ActionItem `dueDate` | `src/types/index.ts` uses `deadline` | DEV Session 1 schema uses `dueDate` | **Backlog wins** — update field name |
| Sprint MVP banner | `Dashboard.tsx` shows Sprint MVP with badges section | Sprint 1 backlog does not include MVP/badge logic | **Out of scope for Sprint 1** — omit Sprint MVP banner; it belongs to a future sprint |
| Shell component | Referenced as `@/components/layout/Shell` in prototypes | Not present in `src/components/` | **Must create** `src/components/layout/Shell.tsx` as part of Sprint 1 |
