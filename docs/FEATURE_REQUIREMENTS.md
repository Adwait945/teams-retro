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

---

# Feature Requirements — Sprint 7: Points Engine, Badge Engine, Leaderboard Rebuild, Dashboard Enhancement

**Source Backlog**: `docs/SPRINT_7_BACKLOG.md`
**UI Mocks Analyzed**: `docs/ui-mocks/` (12 images — none Sprint-7-specific; see Delta section)
**Prototypes Analyzed**: `docs/prototypes/` (7 files — none Sprint-7-specific; see Delta section)
**Generated**: Sprint 7 — Points Engine, Badge Engine, Leaderboard Page Rebuild, Dashboard Enhancement (Digest Merge)
**Builds on**: Sprint 1 Foundation (above) and subsequent Scope 2 "Always-On Retro" work (commit `dfd4875`), not re-documented here — see this file's Sprint 1 section and repo history for that context.

---

## Table of Contents

1. [Pre-Flight](#pre-flight-sprint-7)
2. [Type System Changes (Epic 7.1 prerequisite)](#type-system-changes-epic-71-prerequisite)
3. [Epic 7.1 — Points Engine](#epic-71--points-engine)
4. [Epic 7.2 — Badge Engine](#epic-72--badge-engine)
5. [Epic 7.3 — Leaderboard Page (Full Rebuild)](#epic-73--leaderboard-page-full-rebuild)
6. [Epic 7.4 — Dashboard Enhancement (Retro Digest Merge)](#epic-74--dashboard-enhancement-retro-digest-merge)
7. [Prototype/Backlog Delta Summary](#prototypebacklog-delta-summary-sprint-7)
8. [Dependency Map](#dependency-map-sprint-7)
9. [Definition of Done](#definition-of-done-sprint-7)

---

## Pre-Flight (Sprint 7)

The backlog's Pre-Flight cleanup table was verified before this document was written:

| Item | Verification Command | Result |
|---|---|---|
| `src/store/retro-store.tsx` deleted | `find src -iname "retro-store*"` | No matches — confirmed clean |
| `RetroProvider` import/wrapper removed from layout | `grep -n "RetroProvider\|retro-store" src/app/layout.tsx` | No matches — confirmed clean |
| No orphaned `retro-store`/`useRetro`/`SprintSelector` references anywhere | `grep -rl "retro-store\|useRetro\|SprintSelector" src/` | No matches — confirmed clean |
| `src/app/leaderboard/` exists as empty directory | Directory listing | Confirmed — empty, ready for Epic 7.3 |
| `src/app/digest/` exists as empty directory | Directory listing | Confirmed empty — per backlog, digest content merges into Dashboard (Epic 7.4); this directory is expected to remain unused/removed, not populated with a page |

DEV does not need to re-run the Pre-Flight grep checks as a blocking gate — they are pre-verified — but the backlog's instruction to run `grep -rl "retro-store\|useRetro\|SprintSelector" src/` as the first action of Epic 7.1 and halt on any unexpected result still stands as a safety net and should be executed by DEV regardless.

---

## Type System Changes (Epic 7.1 prerequisite)

### User Story

> As a developer, I need `src/types/index.ts` to reflect the real Scope 3 data shapes for points and badges (not the Sprint-1-era stub versions), so that every epic in this sprint builds against correct, shared types instead of re-deriving them ad hoc.

### Acceptance Criteria — Verbatim from Backlog

- Remove entirely: the current stub `Badge` interface (with `threshold: number`), the current stub `PointAction` union (`"submit-feedback" | "feedback-upvoted" | "create-action-item" | "complete-action-item" | "verify-improvement"`), the current stub `POINT_VALUES`, and the current stub `BADGES` array.
- Replace with: a new `PointAction` union (`"submit_feedback" | "receive_upvote" | "remove_upvote" | "convert_action" | "complete_action" | "verify_action"`), a new `POINT_VALUES: Record<PointAction, number>` map, a new `PointEvent` interface (`_id`, `userId`, `podId`, `action`, `points`, `relatedId?`, `createdAt`), a new `BadgeType` union (6 values), a new `Badge` interface (`_id`, `userId`, `podId`, `type`, `earnedAt`), and a new `BADGE_DEFINITIONS: Record<BadgeType, {...}>` map.
- `User.badges: Badge[]` field is removed from the `User` interface; badges are fetched via `GET /api/badges?userId=X`, not embedded.
- `User.totalPoints` stays, but is now documented as a derived/cached field updated by the points engine, not manually set.

### Acceptance Criteria — Refined for Testability

| AC-ID | Testable Criterion |
|---|---|
| AC-TYPES-1 | `src/types/index.ts` no longer exports a `Badge` interface with a `threshold` field, a `PointAction` union containing hyphenated values (`"submit-feedback"` etc.), or the old `POINT_VALUES`/`BADGES` constants. A `grep -n "threshold: number\|submit-feedback\|feedback-upvoted\|create-action-item\|complete-action-item\|verify-improvement" src/types/index.ts` returns zero matches after the change. |
| AC-TYPES-2 | `PointAction` is exactly the 6-member union `"submit_feedback" \| "receive_upvote" \| "remove_upvote" \| "convert_action" \| "complete_action" \| "verify_action"` (underscored, not hyphenated). A type-level test (or `tsc` compile check against a literal array of all 6 values) confirms exhaustiveness — no 7th value compiles, no member is missing. |
| AC-TYPES-3 | `POINT_VALUES` is a `Record<PointAction, number>` with exactly these values: `submit_feedback: 10, receive_upvote: 5, remove_upvote: -5, convert_action: 50, complete_action: 100, verify_action: 150`. A unit test asserts `POINT_VALUES.remove_upvote === -5` (signed, not absolute) and `Object.keys(POINT_VALUES).length === 6`. |
| AC-TYPES-4 | `PointEvent` interface has fields `_id: string`, `userId: string`, `podId: string`, `action: PointAction`, `points: number`, `relatedId?: string`, `createdAt: string`. No `description` or `timestamp` fields remain (those were Sprint-1-stub-only). |
| AC-TYPES-5 | `BadgeType` is exactly the 6-member union `"feedback_machine" \| "action_taker" \| "innovator" \| "problem_solver" \| "consensus_builder" \| "pod_champion"`. |
| AC-TYPES-6 | `Badge` interface has fields `_id: string`, `userId: string`, `podId: string`, `type: BadgeType`, `earnedAt: string`. No `id`, `name`, `description`, `icon`, or `threshold` fields remain on `Badge` itself (those move to `BADGE_DEFINITIONS`, keyed by `BadgeType`, not embedded per-instance). |
| AC-TYPES-7 | `BADGE_DEFINITIONS` is a `Record<BadgeType, { name: string; icon: string; description: string; kind: "permanent" \| "living" }>` with exactly 6 keys matching `BadgeType`, and `pod_champion` is the only entry with `kind: "living"` — all other 5 are `kind: "permanent"`. A unit test asserts this. |
| AC-TYPES-8 | `User` interface no longer has a `badges` field. `grep -n "badges: Badge\[\]" src/types/index.ts` returns zero matches. `User.totalPoints: number` remains present and unchanged in type (still a plain `number`, not optional). |
| AC-TYPES-9 | `npx tsc --noEmit` passes with 0 errors after the type rewrite AND after all 4 epics' code changes are applied (this is a whole-sprint gate, not just a types-file gate, since downstream files must compile against the new shapes). |
| AC-TYPES-10 | Every other field/interface in `src/types/index.ts` not explicitly named in this section (`FeedbackCategory`, `User` minus `badges`, `FeedbackItem`, `ActionItem`, `CATEGORY_CONFIG`) is left byte-for-byte unchanged — this is a targeted replacement, not a rewrite of the whole file. |

### Prototype/Backlog Delta (Type System Changes)

No prototype or mock touches these types directly (they are backend-only shapes). No delta to flag here beyond the general missing-reference-docs issue noted in the Dependency Map / Delta Summary section below.

---

## Epic 7.1 — Points Engine

### User Story

> As a pod member, I want every point-earning action I take (submitting feedback, getting upvoted, converting feedback to an action, completing or verifying an action item) to be recorded as a durable, queryable event, so that the app can show accurate point totals per user per time window without recomputing from scratch or losing history.

### Acceptance Criteria — Verbatim from Backlog

- AC-1: `src/lib/models/PointEvent.ts` Mongoose model created matching the revised `PointEvent` interface, with `mongoose.models.PointEvent ||` guard pattern.
- AC-2: `POST /api/feedback` (on creation) — after successful feedback save, create a `PointEvent` for the author: `action: "submit_feedback"`, `points: 10`.
- AC-3: `PATCH /api/feedback/[id]/upvote` — when an upvote is added, create a `PointEvent` for the feedback author: `action: "receive_upvote"`, `points: 5`. When an upvote is removed (toggle-off), create a `PointEvent` for the feedback author: `action: "remove_upvote"`, `points: -5`. (This also fixes Bug B1 from Scope 2 if not already fixed — verify the toggle logic itself works before adding point events on top of it.)
- AC-4: `POST /api/actions` (convert-from-feedback flow only, admin-initiated) — after creation, create a `PointEvent` for the feedback author (not the admin who clicked convert): `action: "convert_action"`, `points: 50`. If the feedback is anonymous, the event still targets the true `authorId` — points are always attributed, only display is anonymized (per Decision A1/S3-1).
- AC-5: Standalone action item creation (no source feedback) does not trigger a `convert_action` point event — only conversions from existing feedback do.
- AC-6: `PATCH /api/actions/[id]/advance` — when status transitions to `"completed"`, create a `PointEvent` for the action's `ownerId`: `action: "complete_action"`, `points: 100`.
- AC-7: `PATCH /api/actions/[id]/verify` — when status transitions to `"verified"`, create a `PointEvent` for the user who performed the verification: `action: "verify_action"`, `points: 150`.
- AC-8: `GET /api/points?pod=X&window=7d|30d|all` returns, per user in the pod: `{ userId, name, avatar, windowPoints, allTimePoints }`, sorted descending by `windowPoints`.
- AC-9: `windowPoints` is calculated by summing all `PointEvent.points` for that user where `createdAt` falls within the requested window. `allTimePoints` sums all events regardless of window.
- AC-10: Regressing an action item's status (Bug B2 fix territory) does not trigger a negative point event for `complete_action` or `verify_action` — once earned, those points stand even if the item is later regressed. (Only upvote removal has a clawback; action item point events are not clawed back on regression.)

### Acceptance Criteria — Refined for Testability

| AC-ID | Testable Criterion |
|---|---|
| AC-7.1.1 | `src/lib/models/PointEvent.ts` exists, exports `mongoose.models.PointEvent \|\| mongoose.model('PointEvent', PointEventSchema)`. Schema fields exactly match the `PointEvent` TS interface: `userId` (String, required), `podId` (String, required), `action` (String, required, enum = the 6 `PointAction` values), `points` (Number, required, signed — no `min: 0` constraint since `remove_upvote` is negative), `relatedId` (String, optional), `createdAt` (Date, default `Date.now`). A Jest test imports the model twice in the same process and confirms no `OverwriteModelError` is thrown. |
| AC-7.1.2 | Given the current `POST /api/feedback` handler at `src/app/api/feedback/route.ts` (which validates `category`/`content`/`authorId`, rejects `slowed-us-down` without `suggestion` with 422, then does `item.save()` and returns 201), after this epic the handler must additionally write one `PointEvent` with `userId: authorId`, `action: "submit_feedback"`, `points: 10`, `relatedId: item._id` — after the `item.save()` succeeds. A test mocks `PointEvent.create` to throw and asserts the endpoint still returns 201 with the feedback item (per AC data-integrity NFR below), while a separate test mocks it to succeed and asserts it was called once with the correct shape. |
| AC-7.1.3 | Given the current `PATCH /api/feedback/[id]/upvote` handler (which toggles `upvotedBy`/`upvotes` and returns `{ upvotes, upvotedBy, toggled }`), after this epic: when `toggled === true` (upvote added), one `PointEvent` is written with `userId: item.authorId`, `action: "receive_upvote"`, `points: 5`, `relatedId: item._id`. When `toggled === false` (upvote removed), one `PointEvent` is written with `userId: item.authorId`, `action: "remove_upvote"`, `points: -5`, `relatedId: item._id`. A test exercising both branches (first upvote, then a second call from the same user to remove it) asserts exactly one `PointEvent` per call with the correct signed `points` value. Existing self-upvote-forbidden (403) and not-found (404) behavior is unchanged. |
| AC-7.1.4 | Given the current `POST /api/actions` handler (validates `title`/`ownerId`, saves the item, and if `body.sourceFeedbackId` is present pushes the new action's id onto that feedback's `actionItemIds`), after this epic: if `sourceFeedbackId` is present, the handler looks up that `FeedbackItem`'s `authorId` and writes one `PointEvent` with `userId: <feedback.authorId>`, `action: "convert_action"`, `points: 50`, `relatedId: action._id` — even when `feedback.isAnonymous === true` (the event always targets the true author id; only display-layer anonymization applies elsewhere). A test creates a feedback item with `isAnonymous: true` authored by user X, converts it via a different `ownerId`/admin, and asserts the `PointEvent.userId` is X, not the admin. |
| AC-7.1.5 | When `POST /api/actions` body has no `sourceFeedbackId` (standalone action item), no `PointEvent` with `action: "convert_action"` is created. A test posts a standalone action and asserts `PointEvent.create` was not called with `action: "convert_action"` (it may still be called 0 times total for this endpoint, since standalone creation earns no points per the backlog). |
| AC-7.1.6 | Given the current `PATCH /api/actions/[id]/advance` handler (maps `open → in-progress → completed`, sets `completedAt` on transition to `completed`, 409s if already `completed`/`verified`), after this epic: only the transition that lands on `nextStatus === "completed"` writes one `PointEvent` with `userId: item.ownerId`, `action: "complete_action"`, `points: 100`, `relatedId: item._id`. The `open → in-progress` transition writes no `PointEvent`. A test advances an item through both transitions and asserts exactly one `PointEvent` write, occurring only on the second call. |
| AC-7.1.7 | Given the current `PATCH /api/actions/[id]/verify` handler (requires non-empty `impactNote`, 409s unless `item.status === "completed"`, sets `status: "verified"` and `impactNote`), after this epic: on successful verification, one `PointEvent` is written with `userId: <verifier>`, `action: "verify_action"`, `points: 150`, `relatedId: item._id`. Since the current handler body does not accept a `userId`/verifier field, this is a **required request-body/route addition**: the verify endpoint must accept a `userId` (the acting verifier) in the request body in addition to `impactNote`, defaulting to a 400 if missing — flagged explicitly since it changes the existing route's accepted payload shape (see Prototype/Backlog Delta below). A test posts `{ impactNote, userId }` and asserts the `PointEvent.userId` equals the posted `userId`, not `item.ownerId`. |
| AC-7.1.8 | `GET /api/points?pod=X&window=7d\|30d\|all` returns HTTP 200 with a JSON array of `{ userId, name, avatar, windowPoints, allTimePoints }` objects, one per user in pod `X`, sorted descending by `windowPoints`. Invalid `window` values return HTTP 400 (reusing the existing `getWindowFilter()` validation pattern from `src/lib/utils/windowFilter.ts`, which already recognizes exactly `'7d' \| '30d' \| 'all'`). Missing `pod` query param returns HTTP 400. A test seeds 3 users with varying `PointEvent` histories and asserts correct ordering and correct per-window sums. |
| AC-7.1.9 | `windowPoints` for a user equals `sum(PointEvent.points)` where `PointEvent.userId === user._id` and `PointEvent.createdAt` falls inside the window computed by `getWindowFilter(window)`; `allTimePoints` equals `sum(PointEvent.points)` for that user with no date filter. A user with a `+10`, a `+5`, and a `-5` event nets `windowPoints: 10` if all three fall in-window — confirming negative `remove_upvote` events are netted, not excluded. |
| AC-7.1.10 | Given the current `PATCH /api/actions/[id]/regress` handler (which only mutates `status` and clears `completedAt` on `completed → in-progress`; never touches `verified`, and 400s if called on `verified` or `open`), after this epic the regress handler is **unmodified** with respect to `PointEvent` writes — it must not write any `PointEvent` of any kind. A test regresses a `completed` action back to `in-progress` and asserts zero `PointEvent.create` calls, confirming the `complete_action` points earned earlier remain un-clawed-back (no compensating negative event is written). |

### UI Requirements

None — Epic 7.1 is backend-only per the backlog's own "UI Reference: None" statement. No `AC-UI-*` entries apply.

### Prototype/Backlog Delta (Epic 7.1)

- **Verify endpoint payload shape**: the current `src/app/api/actions/[id]/verify/route.ts` accepts only `{ impactNote }` in the request body. AC-7 requires crediting "the user who performed the verification," which the current route has no way to identify — there is no `userId`/verifier field in the existing payload or response. This is not a contradiction between a prototype and the backlog (no verify-flow prototype exists), but it is a **delta between the current implementation and the new AC** that ARCHITECT/DEV must resolve explicitly: the verify route's accepted body must be extended to include a verifier identity (e.g. `userId`), which is a breaking change to any existing caller of that endpoint. Flagged here so TEST writes assertions against the *new* required shape, not the current one.
- **Bug B1 / Bug B2 references**: the backlog references "Bug B1" (upvote toggle) and "Bug B2" (regression) as prior known issues from Scope 2, but no bug-tracking doc is present under `docs/` to confirm their exact prior symptoms. Based on direct reading of the current route files, the upvote toggle logic in `src/app/api/feedback/[id]/upvote/route.ts` and the regress logic in `src/app/api/actions/[id]/regress/route.ts` both appear functionally correct as currently written (toggle correctly flips `upvotedBy`/`upvotes`; regress correctly walks `completed → in-progress → open` and blocks `verified`/`open` boundaries). Treat AC-3's "verify the toggle logic itself works" instruction as already satisfied by the current code; no separate bug-fix AC is needed beyond adding the point-event writes on top.

---

## Epic 7.2 — Badge Engine

### User Story

> As a pod member, I want to automatically earn recognizable badges when I hit meaningful milestones (volume of feedback, completed actions, upvoted ideas, etc.), and I want to see who currently holds the pod's top "Pod Champion" title, so that the gamification layer reflects real, verifiable achievement rather than a static list.

### Acceptance Criteria — Verbatim from Backlog

- AC-1: `src/lib/models/Badge.ts` Mongoose model created matching the revised `Badge` interface.
- AC-2: Unique index on `{ userId: 1, type: 1, podId: 1 }` for the 5 permanent badge types — prevents duplicate awards.
- AC-3: Unique index on `{ type: 1, podId: 1 }` scoped specifically to `type: "pod_champion"` — enforces only one Pod Champion badge document per pod at any time (see AC-9 for the mechanism that keeps this true).
- AC-4: `src/lib/badgeEngine.ts` created — exports `evaluateBadges(userId: string, podId: string): Promise<void>`, called after every `PointEvent` write from Epic 7.1.
- AC-5: Feedback Machine — query count of `PointEvent` where `userId = X`, `action = "submit_feedback"`, `createdAt` within trailing 30 days. If count ≥ 10 and user doesn't already hold this badge, create it.
- AC-6: Action Taker — query count of `PointEvent` where `userId = X`, `action = "complete_action"`, `createdAt` within trailing 30 days. If count ≥ 3 and user doesn't already hold this badge, create it.
- AC-7: Innovator — sum `upvotes` across all `FeedbackItem` where `authorId = X` and `category = "should-try"`. If sum ≥ 20 and user doesn't already hold this badge, create it. (All-time, not windowed.)
- AC-8: Problem Solver — find `ActionItem` where `ownerId = X`, `status` in `("completed", "verified")`, then look up `sourceFeedbackId` and check if that feedback's `category = "slowed-us-down"`. If any match exists and user doesn't already hold this badge, create it.
- AC-9: Consensus Builder — find any `FeedbackItem` where `authorId = X` and `upvotes ≥ 10`. If at least one exists and user doesn't already hold this badge, create it.
- AC-10: Pod Champion (living badge) — after evaluating the other 5, calculate the current #1 ranked user in the pod for the trailing 30-day window (reuse the same aggregation as `GET /api/points`). If the current #1 differs from whoever currently holds the `pod_champion` badge in this pod, delete the old badge document and create a new one for the new #1. If they're the same, do nothing. Tie-break rule: if two users have identical 30-day totals, the one whose qualifying `PointEvent` reached that total first (earlier `createdAt`) keeps/receives the badge.
- AC-11: `GET /api/badges?userId=X` returns all badges (permanent + living, if applicable) held by that user.
- AC-12: `GET /api/badges?podId=X` returns all badges held by anyone in the pod (used by Leaderboard to attach badge chips to each entry in one query rather than N+1).

### Acceptance Criteria — Refined for Testability

| AC-ID | Testable Criterion |
|---|---|
| AC-7.2.1 | `src/lib/models/Badge.ts` exists, exports `mongoose.models.Badge \|\| mongoose.model('Badge', BadgeSchema)`. Schema fields match the `Badge` TS interface: `userId` (String, required), `podId` (String, required), `type` (String, required, enum = the 6 `BadgeType` values), `earnedAt` (Date, default `Date.now`). |
| AC-7.2.2 | The Badge schema declares `BadgeSchema.index({ userId: 1, type: 1, podId: 1 }, { unique: true, partialFilterExpression: { type: { $ne: 'pod_champion' } } })` (or equivalent) so the 5 permanent types cannot be duplicated per user/pod, but this index does not block `pod_champion` documents (which are keyed differently). A test attempts to insert two `feedback_machine` badges for the same `userId`/`podId` and asserts the second insert throws a duplicate-key error (Mongo error code `11000`). |
| AC-7.2.3 | The Badge schema declares a second unique index `{ type: 1, podId: 1 }` scoped via `partialFilterExpression: { type: 'pod_champion' }` so at most one `pod_champion` document can exist per `podId` at any time. A test inserts one `pod_champion` badge for pod A, then attempts a second `pod_champion` insert for the same pod (different `userId`) and asserts a duplicate-key error — proving the engine must delete-then-recreate rather than insert a second doc (per AC-10's own delete/recreate mechanism). |
| AC-7.2.4 | `src/lib/badgeEngine.ts` exports `async function evaluateBadges(userId: string, podId: string): Promise<void>`. Calling it performs the checks in AC-7.2.5 through AC-7.2.10 sequentially (or concurrently) and returns once all are settled; it never throws for the "already holds badge" no-op case. |
| AC-7.2.5 | Feedback Machine: `PointEvent.countDocuments({ userId, action: 'submit_feedback', createdAt: { $gte: <30 days ago> } })`. When count reaches exactly 10 (not 9, not 11-only), and no existing `feedback_machine` badge exists for this `userId`/`podId`, a new `Badge` document is created with `type: 'feedback_machine'`. A test seeds 9 qualifying events and asserts no badge; seeds a 10th and asserts a badge is created; calls `evaluateBadges` again and asserts still only 1 badge document (idempotent). |
| AC-7.2.6 | Action Taker: `PointEvent.countDocuments({ userId, action: 'complete_action', createdAt: { $gte: <30 days ago> } })` ≥ 3 creates `action_taker` badge (once). Same idempotency assertion pattern as AC-7.2.5. |
| AC-7.2.7 | Innovator: `FeedbackItem.aggregate` (or equivalent) summing `upvotes` for all docs where `authorId === userId AND category === 'should-try'`, with **no date filter** (all-time, confirmed against backlog's explicit "(All-time, not windowed.)" note). Sum ≥ 20 creates `innovator` badge (once). A test with 3 should-try items totaling exactly 20 upvotes across items created more than 30 days ago still triggers the badge (proving it is not window-limited). |
| AC-7.2.8 | Problem Solver: query `ActionItem` where `ownerId === userId AND status in ['completed', 'verified']`; for each match, look up the referenced `FeedbackItem` via `sourceFeedbackId` and check `category === 'slowed-us-down'`. First match creates `problem_solver` badge (once). An `ActionItem` with no `sourceFeedbackId` (standalone) is correctly skipped/excluded rather than throwing on a null lookup. |
| AC-7.2.9 | Consensus Builder: `FeedbackItem.exists({ authorId: userId, upvotes: { $gte: 10 } })` creates `consensus_builder` badge (once) if true and not already held. |
| AC-7.2.10 | Pod Champion: after the 5 permanent checks, the engine computes the current #1 ranked user for `podId` in the trailing-30-day window using the same aggregation/sum logic as `GET /api/points` (AC-7.1.9). If a `pod_champion` badge already exists for `podId` and its `userId` differs from the newly computed #1, the old document is deleted and a new one is created for the new #1 (two-step delete+create, not an atomic upsert, consistent with the backlog's explicit "delete the old badge document and create a new one" wording). If the existing holder is still #1, no write occurs. Tie-break: when two users have identical `windowPoints` sums, the tie is broken by the earlier `createdAt` among each user's `PointEvent`s that caused their total to first reach the tied value — the existing current holder is preferred in a true tie unless a strictly earlier-qualifying challenger is computed. A test constructs two users with identical 30-day totals but different event timestamps and asserts the earlier-timestamped user is awarded/retains the badge. |
| AC-7.2.11 | `GET /api/badges?userId=X` returns HTTP 200 with a JSON array of all `Badge` documents (any type, including `pod_champion` if held) where `userId === X`. Missing `userId` query param and no `podId` alternative supplied returns HTTP 400. |
| AC-7.2.12 | `GET /api/badges?podId=X` returns HTTP 200 with a JSON array of all `Badge` documents where `podId === X`, across all users — used for a single-query badge-chip lookup on the Leaderboard (Epic 7.3 AC-8) rather than N+1 per-user calls. A test seeds badges for 3 different users in the same pod and asserts all 3 come back in one call. |

### UI Requirements

None — Epic 7.2 is backend-only per the backlog's own "UI Reference: None — backend only" statement. No `AC-UI-*` entries apply.

### Prototype/Backlog Delta (Epic 7.2)

- No prototype or mock exists for badge logic (it is backend-only). No visual delta to flag.
- **Notification/toast on badge earn is explicitly out of scope** per the backlog — flagging here so TEST does not write assertions expecting any UI feedback when a badge is created during this sprint.
- **Async, non-blocking invocation**: the backlog's NFR states `evaluateBadges` must be fired via `.catch()` rather than `await`ed inline in request handlers. This has a testability implication worth flagging: TEST must design badge-engine tests to call `evaluateBadges` directly (unit-level) rather than asserting on badge side effects synchronously within an HTTP request/response test, since the production code path will not guarantee badge evaluation has completed by the time the HTTP response is returned.

---

## Epic 7.3 — Leaderboard Page (Full Rebuild)

### User Story

> As a pod member, I want to see a ranked leaderboard of my pod showing everyone's points and earned badges over a selectable time window, so that I can see how the team's contributions compare and stay motivated by visible recognition.

### Acceptance Criteria — Verbatim from Backlog

- AC-1: `src/app/leaderboard/page.tsx` created, wrapped in `Shell` (the real layout component used by Dashboard/Feedback/Actions/Pod Settings — not any old sidebar component).
- AC-2: Page fetches `GET /api/points?pod={user.pod}&window={activeWindow}` and `GET /api/badges?podId={user.pod}` on load and on window toggle change.
- AC-3: Time window toggle: This Week / This Month / All-Time — same pattern as the Dashboard toggle from Scope 2. Changing it re-fetches and re-ranks the full list.
- AC-4: Rank #1 card — gold gradient background, Trophy icon, name, avatar, badge chips (including 👑 Pod Champion if they currently hold it), window points, all-time points.
- AC-5: Rank #2 card — silver gradient, Medal icon, same fields.
- AC-6: Rank #3 card — bronze gradient, Medal icon, same fields.
- AC-7: Ranks 4+ — plain card, numeric rank, avatar initials, name, badge chips, points. No gradient.
- AC-8: Badge chips render from the `GET /api/badges?podId=X` result, matched to each user by `userId`, using `BADGE_DEFINITIONS` for icon/name/description (tooltip on hover shows description).
- AC-9: "Points Guide" sidebar card lists all 6 `PointAction` values from `POINT_VALUES` with their point amounts and plain-language labels (e.g. "Submit feedback" not "submit_feedback").
- AC-10: "Badges" sidebar card lists all 6 badges from `BADGE_DEFINITIONS` with icon, name, and earn condition description — this is a static reference list, not filtered to only earned badges.
- AC-11: Empty state — if the pod has zero `PointEvent` records (e.g., brand new pod), show a friendly empty state: "No activity yet — submit feedback or complete an action item to appear on the leaderboard" rather than a blank list.
- AC-12: Current logged-in user's own row is visually highlighted (subtle border or background tint) so they can find themselves in a longer list without counting.

### Acceptance Criteria — Refined for Testability

| AC-ID | Testable Criterion |
|---|---|
| AC-7.3.1 | `src/app/leaderboard/page.tsx` exists, default-exports a client component, and its top-level JSX is wrapped in `<Shell>...</Shell>` imported from `@/components/layout/Shell` (matching the exact import path used by `src/app/dashboard/page.tsx`). No `@ts-nocheck` pragma anywhere in the file. No import of any deleted `retro-store`/`useRetro`/old sidebar module. |
| AC-7.3.2 | On mount, and again whenever `activeWindow` changes, the page issues `fetch('/api/points?pod=' + encodeURIComponent(user.pod) + '&window=' + activeWindow)` and `fetch('/api/badges?podId=' + encodeURIComponent(user.pod))` (badges call does not need to depend on `activeWindow` since badge-holding is not itself windowed, though the Pod Champion badge's holder can change independently). A test with mocked `fetch` asserts both endpoints are called once on initial mount and the points endpoint is called again (badges endpoint may or may not re-fire — not required) when the window toggle changes. |
| AC-7.3.3 | Three toggle buttons render with exact copy "This Week", "This Month", "All-Time", matching the `data-testid="tab-7d"` / `tab-30d` / `tab-all` pattern and active/inactive class-swap already used in `src/app/dashboard/page.tsx` (`bg-primary text-primary-foreground` active vs. `bg-secondary/50 text-muted-foreground` inactive). Clicking a toggle updates `activeWindow` state and triggers a re-fetch/re-render of the ranked list ordering. |
| AC-7.3.4 | The user at array index 0 of the sorted `GET /api/points` response (already sorted descending by `windowPoints` per AC-7.1.8) renders inside a card with a gold-gradient class (e.g. `bg-gradient-to-br from-yellow-400 ...` — exact Tailwind stops left to DEV/ARCHITECT, but must be visually distinct from ranks 2–3), a Trophy icon (`lucide-react`), the user's `name`, `avatar`, all matched badge chips (including a 👑 chip specifically if a `pod_champion` badge with this `userId` is present in the badges response), `windowPoints`, and `allTimePoints`. If the points array is empty, no rank-1 card renders (see AC-7.3.11 empty state instead). |
| AC-7.3.5 | Index 1 (if present) renders in a silver-gradient card with a Medal icon and the same field set as AC-7.3.4. |
| AC-7.3.6 | Index 2 (if present) renders in a bronze-gradient card with a Medal icon and the same field set. |
| AC-7.3.7 | Indices 3+ render as plain (no gradient) cards showing numeric rank (`index + 1`), avatar initials, name, badge chips, and `windowPoints` (at minimum — `allTimePoints` display for 4+ is not mandated by the backlog AC text, so either showing or omitting it here is acceptable, but the two mandatory point fields for ranks 1–3 must both appear per AC-4/5/6). |
| AC-7.3.8 | For each rendered user row, badge chips are derived by filtering the `GET /api/badges?podId=X` response to `badge.userId === row.userId`, then looking up `BADGE_DEFINITIONS[badge.type]` for `icon`/`name`/`description`. Hovering (or focusing, for keyboard/a11y) a chip reveals the `description` text via a tooltip/title mechanism. A user with zero badges renders zero chips (not an empty-state placeholder chip). |
| AC-7.3.9 | A "Points Guide" card renders exactly 6 rows, one per key of `POINT_VALUES`, each showing a plain-language label (not the raw snake_case action string) and the numeric point value (including the `-5` sign for `remove_upvote` displayed as e.g. "−5" or "-5", not hidden or shown as a bare 5). Suggested label mapping (final copy owned by DEV/ARCHITECT, but must be human-readable, not `POINT_VALUES` keys verbatim): `submit_feedback → "Submit feedback"`, `receive_upvote → "Receive an upvote"`, `remove_upvote → "Upvote removed"`, `convert_action → "Feedback converted to action"`, `complete_action → "Complete an action item"`, `verify_action → "Verify an action's impact"`. |
| AC-7.3.10 | A "Badges" card renders exactly 6 entries, one per key of `BADGE_DEFINITIONS`, each showing `icon`, `name`, and `description`, regardless of whether the current pod/user has earned them (static reference list — not filtered by `GET /api/badges` results). |
| AC-7.3.11 | When `GET /api/points?pod=X&window=Y` returns an empty array (zero users with any `PointEvent` history — practically: a pod where every user's `windowPoints` and `allTimePoints` are both 0, since `GET /api/points` per AC-7.1.8 returns "per user in the pod" not "per user with events," so the empty-state condition is specifically "all returned users have `allTimePoints === 0`" — clarified here because AC-11's literal "zero PointEvent records" condition must be checked against actual returned data shape, not assumed as an empty array), the page renders the empty-state copy: "No activity yet — submit feedback or complete an action item to appear on the leaderboard" instead of any rank cards. |
| AC-7.3.12 | The row/card corresponding to `row.userId === currentUser._id` (from `getCurrentUser()` / session, same pattern as Dashboard) receives an additional visually-distinguishing class (e.g. a distinct `ring` or `border` or `bg-*/10` tint) not applied to other rows, regardless of that user's rank. A test renders the leaderboard with the logged-in user at rank 5 and asserts that row (and only that row) carries the highlight class/attribute. |

### UI Requirements (Epic 7.3 — no mock exists, per backlog's own instruction to follow established patterns)

| AC-ID | Visual / Layout Requirement |
|---|---|
| AC-UI-7.3.1 | Page is wrapped in `Shell` exactly as `src/app/dashboard/page.tsx` is — sidebar always visible, main content area receives the leaderboard. |
| AC-UI-7.3.2 | Page entrance uses the same `animate-in fade-in slide-in-from-bottom-4 duration-500` wrapper class already established on Dashboard's content root. |
| AC-UI-7.3.3 | Window toggle buttons reuse the exact visual pattern (padding, rounded corners, active/inactive color swap) from `src/app/dashboard/page.tsx`'s toggle row (`px-4 py-2 rounded-md text-sm font-medium transition-colors`, active = `bg-primary text-primary-foreground`, inactive = `bg-secondary/50 text-muted-foreground hover:bg-secondary`). |
| AC-UI-7.3.4 | Rank cards use the same base card shell as Dashboard's stat cards and Action Items' status pills: `rounded-xl border border-border bg-card p-4 shadow-sm` as the base, with gradient/gold/silver/bronze treatments layered on top for ranks 1–3 only. Card radius and spacing must be visually consistent with existing Dashboard/Action Items cards, not a new bespoke style. |
| AC-UI-7.3.5 | Overall page layout is a two-column arrangement: primary column with the ranked list (ordered list or equivalent semantic structure per the NFR), secondary/sidebar column containing the "Points Guide" and "Badges" reference cards — mirroring the two-column pattern already used on Dashboard (main content + Activity Feed). |
| AC-UI-7.3.6 | Ranked list uses `<ol>` (or `role="list"` + `aria-*` rank annotations) rather than an unordered `<div>` soup, so screen readers announce rank order — satisfying the backlog's accessibility NFR. |

### Prototype/Backlog Delta (Epic 7.3)

- **No prototype or mock exists for the Leaderboard.** The backlog explicitly acknowledges this ("No existing mock — this replaces the deleted `docs/prototypes` reference. Follow the visual pattern already established in Dashboard's stat cards and Action Items' status pills") and instructs matching established visual patterns instead. This PRODUCT document treats the *current, real* `src/app/dashboard/page.tsx` toggle/card implementation (read directly, not assumed) as the pattern of record — see AC-UI-7.3.3/7.3.4 above, which cite the exact classes currently in use.
- **Missing reference docs**: the backlog's frontmatter cites `MVP_SCOPE_DECISIONS.md` (Scope 3 section, decisions S3-1 through S3-8) and `PRODUCT_THINKING_SESSION.md` as source docs, and several ACs reference specific decisions by ID (e.g. "per Decision A1/S3-1" in Epic 7.1 AC-4, "per Decision S3-6" in Epic 7.2 Out of Scope, "per Decision S3-8" in Epic 7.4 AC-3). **Neither file exists anywhere under `docs/` in this repository.** This document has treated the backlog's own inline prose as the authoritative statement of what each cited decision requires (e.g. S3-1's content is taken to be exactly what Epic 7.1 AC-4 says: "points are always attributed, only display is anonymized"), rather than inventing additional decision content that might exist in the missing docs. **Open question for ARCHITECT/REVIEWER**: confirm whether `MVP_SCOPE_DECISIONS.md` and `PRODUCT_THINKING_SESSION.md` should be recovered/recreated, or whether the backlog's citations are stale references to docs that were intentionally retired — this PRODUCT document cannot resolve that ambiguity and flags it rather than guessing.

---

## Epic 7.4 — Dashboard Enhancement (Retro Digest Merge)

### User Story

> As a pod member, I want the Dashboard I already visit daily to also surface the pod's current MVP, category trends, top-voted ideas, and recently verified improvements, so that I don't need a separate Digest page to get the full picture of the pod's retro health.

### Acceptance Criteria — Verbatim from Backlog

- AC-1: New section "Pod MVP" added below the existing metrics grid — shows trophy icon, current time-window #1 user's name and avatar, their window points. Pulls from the same `GET /api/points` call the Leaderboard uses (Dashboard makes its own call with the active window).
- AC-2: New section "Category Breakdown" — 3 mini cards (Slowed Down / Should Try / Went Well), each showing the count of feedback in that category within the active window, plus a delta indicator vs. the prior equivalent period.
- AC-3: Delta calculation: for "This Week," compare to the 7 days prior to the current 7-day window. For "This Month," compare to the 30 days prior. For "All-Time," hide the delta entirely (no meaningful prior period exists) per Decision S3-8.
- AC-4: If the prior period has zero data, display the delta as the full current count with an upward arrow (e.g., "+12 ↑") rather than a percentage or "+12 vs 0."
- AC-5: New section "Top Voted Feedback" — top 5 `FeedbackItem` by `upvotes` count, filtered to `createdAt` within the active window, showing category color, truncated content, and upvote count.
- AC-6: New section "Verified Improvements" — all `ActionItem` where `status = "verified"` and `createdAt` (or `completedAt`) within the active window, showing title and the `impactNote` in the emerald inset block style already established in Action Items (Decision V1).
- AC-7: All four new sections respect the existing time window toggle — switching windows re-fetches and re-renders all of them, not just the original metrics grid.
- AC-8: Existing Scope 2 Dashboard sections (metrics grid, activity feed) are unchanged — this epic only adds sections below them, does not modify existing logic.

### Acceptance Criteria — Refined for Testability

| AC-ID | Testable Criterion |
|---|---|
| AC-7.4.1 | Below the existing metrics grids and above (or alongside) the existing "Activity Feed" section in `src/app/dashboard/page.tsx`, a new "Pod MVP" section renders a Trophy icon, the name and avatar of `GET /api/points?pod=X&window=activeWindow` index-0 (the current #1), and that user's `windowPoints`. The Dashboard performs its own independent `fetch` call to `/api/points` (does not reuse a Leaderboard-page hook/context, since Dashboard and Leaderboard are separate routes/mounts). If the points array is empty, the section shows a neutral empty state rather than crashing on `array[0]` being undefined. |
| AC-7.4.2 | A "Category Breakdown" section renders exactly 3 mini cards labeled to match `CATEGORY_CONFIG` labels ("What slowed us down?", "What should we try?", "What went well?" — reusing `src/types/index.ts`'s existing `CATEGORY_CONFIG.label` strings, or a shorter alias, but must be traceable to the 3 `FeedbackCategory` values `slowed-us-down`/`should-try`/`went-well`), each showing the count of `FeedbackItem`s in that category within `activeWindow` (reusing the already-fetched `feedbackItems` array and the existing `getWindowFilter` server-side filtering, or an equivalent client-side count against the window-filtered fetch already in place) plus a delta indicator per AC-7.4.3/7.4.4. |
| AC-7.4.3 | Delta is computed by fetching (or deriving from a second query) the count of same-category feedback items in the immediately preceding period of equal length: for `7d`, the window `[now - 14d, now - 7d)`; for `30d`, the window `[now - 60d, now - 30d)`. For `all`, no delta is computed or fetched at all — the delta UI element is not rendered (not rendered-but-hidden via CSS; actually absent from the DOM), per AC-3's explicit "hide the delta entirely" instruction and Decision S3-8 as cited in the backlog. A test toggling to "All-Time" asserts no delta text/element exists in any of the 3 category cards. |
| AC-7.4.4 | When the prior-period count for a category is `0` and the current-period count is `N > 0`, the delta renders as `"+N ↑"` (literal plus sign, count, up-arrow) — not a percentage, not `"+N vs 0"`, not `"∞%"`. When prior period count is also `0` and current is `0`, the delta may render as `"0"` or be omitted (backlog does not specify this sub-case explicitly; either is acceptable as long as it does not divide by zero or render `NaN`/`Infinity`). When prior count is `> 0`, the delta may render as a signed percentage or signed count (exact format left to DEV, but must never divide by zero). |
| AC-7.4.5 | A "Top Voted Feedback" section renders up to 5 `FeedbackItem`s, filtered to `createdAt` within `activeWindow`, sorted descending by `upvotes`, each showing a category-color indicator (reusing `CATEGORY_CONFIG[category].color`/`bgColor`/`borderColor`), truncated `content` (e.g. `line-clamp-2` per the established Sprint-1 pattern), and the numeric `upvotes` count. If fewer than 5 qualify, render exactly that many (no padding with empty placeholders). If zero qualify, render the section's own empty-state message (see NFR below) rather than an empty list with just a heading. |
| AC-7.4.6 | A "Verified Improvements" section renders all `ActionItem`s where `status === "verified"` and either `completedAt` or `createdAt` (per the backlog's own "(or `completedAt`)" alternative — since `ActionItem` has both fields per `src/types/index.ts`, and `completedAt` is the more semantically correct anchor for "when this became verified-worthy," DEV should prefer `completedAt` when present, falling back to `createdAt` if absent) falls within `activeWindow`. Each entry shows `title` and `impactNote` rendered inside an emerald-tinted inset block matching the existing Action Items verified-state styling (`bg-emerald-50`-family classes, consistent with `CATEGORY_CONFIG['went-well']` emerald tokens already defined in `src/types/index.ts`). Items with `status === "verified"` but a missing/empty `impactNote` should not occur per the existing verify route's validation (`impactNote` is required to reach `verified` status), so no separate empty-`impactNote` UI case needs to be designed. |
| AC-7.4.7 | Changing `activeWindow` (the same `'7d' \| '30d' \| 'all'` state already driving the existing metrics grid) triggers re-fetch/re-derivation of all 4 new sections' data, not just the pre-existing metrics grid and activity feed. A test toggles the window and asserts fresh `fetch` calls occur for the points endpoint (Pod MVP) and that category/top-voted/verified sections' rendered content changes to reflect newly window-filtered mock data. |
| AC-7.4.8 | The existing metrics grids (Total Feedback / category breakdown counts / action-status counts / completion & verification rate) and the existing "Activity Feed" section in the current `src/app/dashboard/page.tsx` remain structurally and behaviorally unchanged — same `data-testid` attributes (`metric-feedback-total`, `metric-actions-total`, `metric-completion-rate`, `activity-feed`, etc.), same computation logic. A diff-level check: none of the currently-passing Dashboard tests (if any exist under `src/__tests__/`) should need modification solely because of Epic 7.4 — only new tests are added. |

### UI Requirements (Epic 7.4 — no mock exists, per backlog's own instruction to follow established patterns)

| AC-ID | Visual / Layout Requirement |
|---|---|
| AC-UI-7.4.1 | New sections are appended below the existing metrics grids, using the same `rounded-xl border border-border bg-card p-4 shadow-sm` (or the `p-5` variant already used for "Activity Feed") card shell already present in `src/app/dashboard/page.tsx`, so the new sections are visually indistinguishable in styling language from the existing ones. |
| AC-UI-7.4.2 | "Pod MVP" section uses a Trophy icon (`lucide-react`), consistent with the icon library already in use elsewhere (`lucide-react` is the project's icon package per root `CLAUDE.md`). |
| AC-UI-7.4.3 | "Category Breakdown" mini cards reuse `CATEGORY_CONFIG`'s existing `color`/`bgColor`/`borderColor` tokens per category (amber for slowed-us-down, blue for should-try, emerald for went-well) rather than inventing a new color scheme. |
| AC-UI-7.4.4 | "Verified Improvements" impact-note block matches the "emerald inset block style already established in Action Items (Decision V1)" per the backlog — since no Action Items source file was directly re-verified as part of this PRODUCT pass beyond `CATEGORY_CONFIG`, DEV/ARCHITECT should locate the actual existing emerald inset markup in the Action Items page/component during implementation and reuse those exact classes rather than approximating them. |
| AC-UI-7.4.5 | Each of the 4 new sections shows its own independent loading skeleton/placeholder (per the NFR below) rather than a single dashboard-wide spinner gating all sections on the slowest query — a deviation from the current Dashboard's single top-level `isLoading` gate, which today blocks the entire page (see `src/app/dashboard/page.tsx` lines 116–124). This is a **structural change to the existing loading pattern**, flagged explicitly since AC-8/AC-7.4.8 says existing sections' logic is unchanged, but the loading *gate* mechanism must become more granular to accommodate the new NFR — ARCHITECT should decide whether this means per-section local loading state or a shared-but-independently-resolving data-fetching pattern. |

### Prototype/Backlog Delta (Epic 7.4)

- **No prototype or mock exists for these Dashboard additions.** The backlog explicitly says "No new mock provided — match established patterns," consistent with what was found in `docs/prototypes/` and `docs/ui-mocks/` (neither contains a Digest-merge or MVP-section mock). This document instructs matching the *actual current* `src/app/dashboard/page.tsx` styling (verified by direct read above), not the Sprint-1-era `docs/prototypes/Dashboard.tsx` prototype, since that prototype predates Scope 2/3 and shows a different (now-superseded) Dashboard shape including a "Sprint MVP" banner that Sprint 1 explicitly ruled out of scope (see this file's Sprint 1 Delta Summary). Epic 7.4's "Pod MVP" section is a distinct, backlog-driven concept (points-based, not the old prototype's sprint-scoped MVP banner) and should not be implemented by resurrecting the old prototype code.
- **Loading-state architecture change**: see AC-UI-7.4.5 above — flagged as a delta between the backlog's explicit "independent skeleton per section" NFR and the current single-gate `isLoading` pattern in the real Dashboard code.
- **Missing `MVP_SCOPE_DECISIONS.md`/`PRODUCT_THINKING_SESSION.md`**: Decision S3-8 (all-time delta suppression) is cited by AC-3 but the source document does not exist in the repo. As with the Epic 7.3 delta note, this document treats the backlog's own inline description of S3-8 as authoritative and flags the missing source doc as an open question rather than inventing further content for it.

---

## Dependency Map (Sprint 7)

### Epic 7.1 (Points Engine) Dependencies

| Dependency | File / Resource | Type |
|---|---|---|
| Type shapes | `src/types/index.ts` — `PointEvent`, `PointAction`, `POINT_VALUES` (rewritten per Type System Changes section) | **Modify (prerequisite)** |
| Feedback creation route | `src/app/api/feedback/route.ts` (read; current `POST` handler confirmed) | **Modify** |
| Feedback upvote route | `src/app/api/feedback/[id]/upvote/route.ts` (read; current toggle logic confirmed) | **Modify** |
| Action creation route | `src/app/api/actions/route.ts` (read; current `POST` handler confirmed, including `sourceFeedbackId` push-back to feedback) | **Modify** |
| Action advance route | `src/app/api/actions/[id]/advance/route.ts` (read; current status-map confirmed) | **Modify** |
| Action verify route | `src/app/api/actions/[id]/verify/route.ts` (read; current payload shape confirmed — requires extension, see Delta note) | **Modify** |
| Action regress route | `src/app/api/actions/[id]/regress/route.ts` (read; confirmed unmodified, no point-event writes) | **Read-only reference / no change** |
| Window filter utility | `src/lib/utils/windowFilter.ts` (existing `getWindowFilter()`, reused for `GET /api/points`) | **Consumes** |
| New model | `src/lib/models/PointEvent.ts` | **New file** |
| New route | `src/app/api/points/route.ts` (implied by `GET /api/points` AC-8; not yet named as a file in the backlog but required) | **New file** |
| DB connection | `src/lib/db.ts` (`connectDB()` singleton, established Sprint 1) | **Consumes** |

### Epic 7.2 (Badge Engine) Dependencies

| Dependency | File / Resource | Type |
|---|---|---|
| Type shapes | `src/types/index.ts` — `BadgeType`, `Badge`, `BADGE_DEFINITIONS` | **Consumes (post-rewrite)** |
| Points data | `src/lib/models/PointEvent.ts` (Epic 7.1) | **Consumes** |
| Feedback data | `src/lib/models/FeedbackItem.ts` (existing, `upvotes`/`category`/`authorId` fields) | **Consumes** |
| Action data | `src/lib/models/ActionItem.ts` (existing, `ownerId`/`status`/`sourceFeedbackId` fields) | **Consumes** |
| New model | `src/lib/models/Badge.ts` | **New file** |
| New engine | `src/lib/badgeEngine.ts` (`evaluateBadges()`) | **New file** |
| New route | `src/app/api/badges/route.ts` (implied by `GET /api/badges?userId=X` / `?podId=X`; not explicitly named in backlog but required) | **New file** |
| Invocation sites | All 5 route files modified in Epic 7.1 must additionally fire-and-forget call `evaluateBadges()` after their `PointEvent` write | **Modify (extends Epic 7.1 changes)** |

### Epic 7.3 (Leaderboard) Dependencies

| Dependency | File / Resource | Type |
|---|---|---|
| Points API | `GET /api/points` (Epic 7.1) | **Consumes** |
| Badges API | `GET /api/badges?podId=X` (Epic 7.2) | **Consumes** |
| `Shell` layout component | `src/components/layout/Shell.tsx` (created Sprint 1, established since) | **Consumes, not modified** |
| Session/current-user pattern | `src/services/userService.ts` — `getCurrentUser()` (established pattern, used identically in Dashboard) | **Consumes** |
| Visual pattern reference | `src/app/dashboard/page.tsx` (toggle buttons, card shell classes — read directly, used as the styling source of truth in absence of a mock) | **Read-only reference** |
| New page | `src/app/leaderboard/page.tsx` (currently empty directory, confirmed) | **New file** |
| Type shapes | `src/types/index.ts` — `PointAction`, `POINT_VALUES`, `BadgeType`, `BADGE_DEFINITIONS` | **Consumes** |

### Epic 7.4 (Dashboard Enhancement) Dependencies

| Dependency | File / Resource | Type |
|---|---|---|
| Points API | `GET /api/points` (Epic 7.1) — for "Pod MVP" | **Consumes** |
| Existing Dashboard | `src/app/dashboard/page.tsx` (read in full; existing metrics grid, activity feed, window-toggle state, and API-fetch pattern confirmed at lines 52–235) | **Modify (extend, do not rewrite)** |
| Feedback API | `GET /api/feedback?window=X` (existing, already used by Dashboard) | **Consumes (extended usage — additional category/top-voted derivations)** |
| Actions API | `GET /api/actions?window=X` (existing, already used by Dashboard) | **Consumes (extended usage — verified-improvements derivation)** |
| Category config | `src/types/index.ts` — `CATEGORY_CONFIG` (existing, unmodified) | **Consumes** |
| Action Items emerald-block styling | Existing Action Items page/component (exact file not re-verified in this PRODUCT pass — DEV/ARCHITECT to locate) | **Read-only reference (to be located)** |
| Window filter utility | `src/lib/utils/windowFilter.ts` (existing; also needs a "prior period" variant for delta calc — new derived logic, not necessarily a new exported function, ARCHITECT's call) | **Consumes / possibly extend** |

### Cross-Epic / Sprint-Wide Dependencies

| Dependency | File / Resource | Type |
|---|---|---|
| `User` model | `src/lib/models/User.ts` (read; confirmed it already has no `badges` field embedded, and already has `totalPoints: { type: Number, default: 0 }` — consistent with the Type System Changes section's instruction that `totalPoints` is derived/cached, not manually set) | **Consumes; possibly needs a sync mechanism if `totalPoints` is meant to mirror `allTimePoints` — flagged as an open question below** |
| MongoDB Atlas connection | `src/lib/db.ts` (`connectDB()`) | **Consumes, unmodified** |
| Missing reference docs | `MVP_SCOPE_DECISIONS.md`, `PRODUCT_THINKING_SESSION.md` (cited by backlog, absent from `docs/`) | **Unresolved — see Delta notes in Epics 7.1/7.3/7.4** |

**Open question flagged for ARCHITECT**: the backlog's Type System Changes section says `User.totalPoints` "stays but is now a derived/cached field updated by the points engine, not manually set" — but no AC in Epic 7.1 or 7.2 explicitly states *when or how* `User.totalPoints` gets written (e.g., incremented alongside every `PointEvent` write, or recomputed lazily, or left stale/unused now that `GET /api/points` computes `allTimePoints` live from `PointEvent` aggregation). This document does not invent an AC for this since the backlog is silent on the mechanism — ARCHITECT should resolve whether `User.totalPoints` needs an explicit write path in Epic 7.1 or is intentionally left as a vestigial/future field.

---

## Definition of Done (Sprint 7)

Mirrors and refines the backlog's own Sprint 7 Definition of Done and Smoke Test Checklist:

| # | Criterion |
|---|---|
| 1 | Type System Changes section's AC-TYPES-1 through AC-TYPES-10 all pass |
| 2 | All Epic 7.1 (AC-7.1.1–AC-7.1.10) acceptance criteria pass |
| 3 | All Epic 7.2 (AC-7.2.1–AC-7.2.12) acceptance criteria pass |
| 4 | All Epic 7.3 (AC-7.3.1–AC-7.3.12, AC-UI-7.3.1–7.3.6) acceptance criteria pass |
| 5 | All Epic 7.4 (AC-7.4.1–AC-7.4.8, AC-UI-7.4.1–7.4.5) acceptance criteria pass |
| 6 | Pre-Flight cleanup re-confirmed clean at sprint close (no orphaned `retro-store`/`useRetro`/`SprintSelector` references anywhere in `src/`) |
| 7 | `PointEvent` and `Badge` Mongoose models created with correct unique indexes (AC-7.2.2, AC-7.2.3) |
| 8 | Old threshold-based `Badge`/`POINT_VALUES`/`BADGES` stub fully removed from `src/types/index.ts`, replaced per the Type System Changes spec |
| 9 | Leaderboard page renders real data, no `@ts-nocheck`, no references to deleted scaffold |
| 10 | Dashboard shows all 4 new sections (Pod MVP, Category Breakdown, Top Voted Feedback, Verified Improvements), respecting the existing time-window toggle |
| 11 | `npx tsc --noEmit` — 0 errors |
| 12 | `npm run build` — 0 errors |
| 13 | `npm test` — 0 failures |
| 14 | Manual smoke test (all 14 steps in the backlog's Smoke Test Checklist) passes — seeded `PointEvent`s rank correctly on Leaderboard, a badge is awarded when a threshold is crossed, Pod Champion transfers correctly when a different user takes #1, All-Time view hides Category Breakdown deltas, fresh/empty pod shows Leaderboard empty state |
| 15 | Open questions flagged in this document (verify-route payload shape change, `User.totalPoints` write mechanism, missing `MVP_SCOPE_DECISIONS.md`/`PRODUCT_THINKING_SESSION.md`) are explicitly resolved or consciously deferred by ARCHITECT before DEV begins, not silently guessed at during implementation |
| 16 | Committed and pushed to `main` (REVIEWER-gated, per the repo's MAWv6.1 pipeline — REVIEWER is the only role authorized to approve the push) |
