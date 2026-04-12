# Code Explainer — Sprint 1: Foundation

**Mode**: [PROFESSOR]  
**Sprint**: 1 — Types, MongoDB Data Layer, Registration, Dashboard  
**Sessions Covered**: Session 1, Session 2, Session 3 + 2 Hotfixes  
**Date**: April 11, 2026

---

## How to Read This Document

Each file entry follows a standard format:

- **What it IS** — the file's role in the system (one sentence)
- **What it DOES** — block-by-block walkthrough of the actual code
- **Why it EXISTS** — the architectural reason this file was created as a standalone unit
- **How it CONNECTS** — what other files import it or what it imports
- **Plain English Analogy** — a real-world metaphor for the non-technical reader

---

## Sprint 1 — Session 1: Types + DB Connection + Models

**Session Goal**: Establish the single source of truth for TypeScript types and the complete MongoDB data layer. No UI, no API routes — pure data foundation.

**Files delivered**:
- `src/types/index.ts`
- `src/lib/db.ts`
- `src/lib/models/User.ts`
- `src/lib/models/Sprint.ts`
- `src/lib/models/FeedbackItem.ts`
- `src/lib/models/ActionItem.ts`

---

### `src/types/index.ts`

**What it IS**: The single source of truth for every TypeScript type, interface, and constant used across the entire application.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `FeedbackCategory` union type | Defines the three legal values for a feedback item's category: `"slowed-us-down"`, `"should-try"`, `"went-well"`. A union type means TypeScript will error if any other string is used. |
| 2 | `User` interface | Describes the shape of a user document: `_id` (MongoDB ObjectId as string), `name`, `username`, `avatar`, `pod` (team sub-group), `isAdmin`, `totalPoints`, `badges[]`, `createdAt`. Every user object across the entire app — from API response to sessionStorage — is typed against this. |
| 3 | `Badge` interface | Describes a gamification badge: `id`, `name`, `description`, `icon` (Lucide icon name string), optional `earnedAt`, and `threshold` (points required). |
| 4 | `FeedbackItem` interface | Describes a single piece of team feedback: category, content, suggestion, authorId, anonymous flag, sprint scoping, upvote tracking (`upvotedBy: string[]` + `upvotes: number`), and an optional link to the action item it generated. |
| 5 | `ActionItem` interface | Describes a tracked improvement task with a 4-state lifecycle: `"open"` → `"in-progress"` → `"completed"` → `"verified"`. Includes source traceability back to the feedback that created it via `sourceFeedbackId` and `sourceQuote`. |
| 6 | `Sprint` interface | Describes a sprint: `name`, `goal`, `startDate`, `endDate`, `status` (`"open"` or `"closed"`), and `teamMemberIds[]`. |
| 7 | `PointEvent` + `PointAction` | Stubs for the gamification event log. `PointAction` is a union of the 5 actions that award points. |
| 8 | `POINT_VALUES` constant | Maps every `PointAction` to its integer point value (5–50 points). Defined once here so business rules are never scattered across components. |
| 9 | `CATEGORY_CONFIG` constant | Maps each `FeedbackCategory` to its display label, form prompt, and Tailwind color classes. Components import this instead of hard-coding colours. |
| 10 | `BADGES` constant | The complete badge catalogue as a static array — 5 badges from "First Voice" (5 pts) to "Retro Legend" (1000 pts). |

**Why it EXISTS**: Every type used by models, API routes, services, and UI components is defined here and nowhere else. This eliminates duplicate definitions and ensures that if a field name changes (e.g., `deadline` → `dueDate`), it only needs to change in one place.

**How it CONNECTS**:
- Imported by every Mongoose model (`User.ts`, `Sprint.ts`, etc.) via `import type { User } from '@/types'`
- Imported by every API route, service, and page component
- Nothing imports _into_ this file — it has zero dependencies

**Plain English Analogy**: This file is the **company glossary**. Every employee (component) must use the exact same definition of "Customer", "Order", and "Product". If the glossary says an Order has a `dueDate`, nobody is allowed to invent `deadline` on their own.

---

### `src/lib/db.ts`

**What it IS**: The MongoDB connection manager — a singleton that ensures exactly one database connection is reused across all API route invocations.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `declare global { var mongoose: ... }` | Extends Node's global namespace so the connection cache can survive across Next.js hot-reloads in development. Without this, TypeScript would reject `global.mongoose`. |
| 2 | `if (!global.mongoose) { ... = { conn: null, promise: null } }` | Initialises the cache on first load. `conn` holds the resolved Mongoose connection; `promise` holds the in-flight connection attempt. |
| 3 | `if (global.mongoose.conn) return ...` | **Cache hit**: if a connection already exists, return it immediately — no reconnect. |
| 4 | `if (!process.env.MONGODB_URI) throw new Error(...)` | Guard: fail loudly if the environment variable is missing rather than producing a cryptic connection error. |
| 5 | `if (!global.mongoose.promise) { global.mongoose.promise = mongoose.connect(...) }` | **Promise dedup**: if a connection is already in flight (e.g., two requests fired simultaneously), don't start a second one — reuse the same promise. |
| 6 | `global.mongoose.conn = await global.mongoose.promise` | Await resolution, store the connection, and return it. |

**Why it EXISTS**: Next.js API routes are serverless functions — each invocation could spin up a new Node.js module. Without this cache, every API call would open a new MongoDB connection, quickly exhausting the 500-connection Atlas free-tier limit. The global cache persists across invocations within the same Node process.

**How it CONNECTS**:
- Called by every API route handler as the first line: `await connectDB()`
- Imports `mongoose` (the npm package) directly
- Is imported by: `api/users/route.ts`, `api/sprints/route.ts`, `api/actions/route.ts`

**Plain English Analogy**: This is the **office receptionist for the database**. Instead of every employee calling the database directly (100 simultaneous calls = chaos), they all go through the receptionist who says: "We already have a line open — use that one."

---

### `src/lib/models/User.ts`

**What it IS**: The Mongoose model that maps the `User` TypeScript interface to a MongoDB collection named `users`.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `UserSchema` | Defines the MongoDB document structure: `name` (required String), `username` (required String), `pod` (required String), `isAdmin` (Boolean, default `false`), `avatar` (optional String), `totalPoints` (Number, default `0`), `createdAt` (Date, default `Date.now`). |
| 2 | `mongoose.models.User \|\| mongoose.model('User', UserSchema)` | The **model guard pattern**: if the model was already compiled (e.g., a hot-reload in dev), reuse it; otherwise compile a new one. Prevents the "Cannot overwrite model once compiled" error. |

**Why it EXISTS**: Mongoose schemas enforce data shape at the database layer — required fields, enum constraints, and defaults are validated before any document is written to MongoDB. The TypeScript interface (`User`) enforces shape at compile time; the Mongoose schema enforces it at runtime.

**How it CONNECTS**:
- Imports `mongoose` and `type { User } from '@/types'`
- Imported by `src/app/api/users/route.ts` as `UserModel`

**Plain English Analogy**: This is the **HR employee record template**. Every new hire form must have a name, username, and pod filled in. If you try to create a record without them, it gets rejected before it ever reaches the filing cabinet.

---

### `src/lib/models/Sprint.ts`

**What it IS**: The Mongoose model for sprint documents, enforcing the two-state lifecycle and required date fields.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `SprintSchema` | Fields: `name` (required), `goal` (optional), `startDate` (required Date), `endDate` (required Date), `status` (required, enum `['open', 'closed']`), `teamMemberIds` (String array, default `[]`). The `enum` constraint means MongoDB will reject any status value other than `'open'` or `'closed'`. |
| 2 | Model guard | Same `mongoose.models.Sprint \|\| mongoose.model(...)` pattern as User. |

**Why it EXISTS**: Sprints are the central organizing unit of the app — every feedback item, action item, and stat card is scoped to a sprint. The model ensures no sprint can be created without dates, and that status transitions are constrained to valid values.

**How it CONNECTS**:
- Imported by `src/app/api/sprints/route.ts` as `SprintModel`

**Plain English Analogy**: This is the **project charter template**. You cannot open a project without a name, start date, and end date. And the project can only be in one of two states: "active" or "closed" — not "maybe" or "pending".

---

### `src/lib/models/FeedbackItem.ts`

**What it IS**: The Mongoose model for individual pieces of team feedback, including upvote tracking and category enforcement.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `FeedbackItemSchema` | Fields: `sprintId` and `authorId` (required — scoping and authorship), `content` (required — the feedback text), `category` (required enum: `'slowed-us-down'`, `'should-try'`, `'went-well'`), `isAnonymous` (Boolean, default `false`), `suggestion` (optional improvement text), `upvotedBy: [String]` (array of user IDs who upvoted), `upvotes: Number` (denormalised count), `createdAt`, `actionItemId` (optional link to a resulting action item). |
| 2 | Model guard | Standard pattern. |

**Why it EXISTS**: Feedback is the primary user-generated content of the app. The schema's `enum` on `category` means the three feedback pillars are enforced at the database layer, not just the UI layer. The `upvotedBy` array prevents double-voting (check if userId already in array before adding).

**How it CONNECTS**:
- Not yet used by any API route in Sprint 1 (deferred to Sprint 2)
- Will be imported by a future `api/feedback/route.ts`

**Plain English Analogy**: This is the **suggestion box entry form**. It must identify which project it belongs to, who submitted it (or mark it anonymous), and categorise it under one of three buckets. You can thumb-up it once — the form tracks who already has.

---

### `src/lib/models/ActionItem.ts`

**What it IS**: The Mongoose model for action items — the concrete improvement tasks that emerge from feedback.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `ActionItemSchema` | Fields: `sprintId` and `ownerId` (required — scoping and accountability), `title` (required), `description` (optional), `status` (required enum: `'open'`, `'in-progress'`, `'completed'`, `'verified'`, default `'open'`), `sourceFeedbackId` and `sourceQuote` (traceability back to origin feedback), `dueDate`, `impactNote` (filled in when completing), `createdAt`, `completedAt`. |
| 2 | Model guard | Standard pattern. |

**Why it EXISTS**: Action items are the accountability mechanism of the app — they turn feedback into measurable outcomes. The 4-state status enum reflects the full improvement cycle: assign → start → complete → verify. The `sourceFeedbackId` field creates an audit trail from "we had a problem" to "we fixed it".

**How it CONNECTS**:
- Imported by `src/app/api/actions/route.ts` as `ActionItemModel`
- Stats computed by `src/services/actionService.ts`

**Plain English Analogy**: This is the **corrective action ticket** in a quality management system. It must be assigned to someone, scoped to a sprint, and can only be closed once a manager verifies the fix. It also records which original complaint triggered it.

---

## Sprint 1 — Session 2: API Routes + User Service + Registration

**Session Goal**: Connect the data layer to the outside world via HTTP API routes and build the user-facing registration flow. After this session, users can register, be stored in MongoDB, and be redirected to the dashboard.

**Files delivered**:
- `src/app/api/users/route.ts`
- `src/app/api/sprints/route.ts`
- `src/services/userService.ts`
- `src/app/page.tsx` (Registration Page)
- `src/app/layout.tsx`

---

### `src/app/api/users/route.ts`

**What it IS**: The Next.js App Router API route that handles reading and creating user records in MongoDB.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `export async function GET()` | Connects to DB, fetches all users via `UserModel.find({}).lean()` (`.lean()` returns plain JS objects instead of Mongoose documents — faster and serialisable to JSON), and returns a `200` JSON array. |
| 2 | `export async function POST(req: NextRequest)` | Connects to DB, parses `req.json()`, validates that `name`, `username`, and `pod` are all present (returns `400` with an error message if not), counts existing users to determine `isAdmin` (first user = admin), creates and saves a new `UserModel` document, returns the new user as `201`. |
| 3 | `try/catch` on both handlers | Returns `500` with `{ error: 'Database connection failed' }` if any database operation throws. Logs the raw error to the server console for debugging. *(Added in Hotfix A — see below.)* |

**Why it EXISTS**: Next.js App Router collocates API route logic with the `app/` directory using the file-based routing convention. Exporting a named async `GET` or `POST` function from a file at `app/api/users/route.ts` automatically registers it as a serverless handler at `GET /api/users` and `POST /api/users`.

**How it CONNECTS**:
- Imports `connectDB` from `@/lib/db` and `UserModel` from `@/lib/models/User`
- Called by `userService.ts` on the client side via `fetch('/api/users')`
- Tested in `src/__tests__/userApi.test.ts` (UA-1 through UA-6)

**Plain English Analogy**: This is the **front desk window at the HR department**. You can walk up and ask "who works here?" (GET) or hand in a new-hire form (POST). The desk checks the form is complete, stamps "Admin" on the first person who ever walks through, and files it.

---

### `src/app/api/sprints/route.ts`

**What it IS**: The API route that handles reading the active sprint and creating new sprints.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `export async function GET()` | Connects to DB, calls `SprintModel.findOne({ status: 'open' }).lean()` — returns only the single open sprint (there should only ever be one). Falls back to `[]` with `?? []` if none exists, returning a `200` with an empty array rather than `null`. |
| 2 | `export async function POST(req: NextRequest)` | Parses body, validates `name`, `startDate`, and `endDate` are present (400 if not), creates the sprint with `status` defaulting to `'open'` if not provided, saves, returns `201`. |
| 3 | `try/catch` on both handlers | Same `500` error guard pattern as the users route. *(Added in Hotfix A.)* |

**Why it EXISTS**: Sprints are the session container for all other data. The dashboard needs to know the active sprint to display stats. The Sprint Setup page needs to be able to create one. This route is the gateway to both operations.

**How it CONNECTS**:
- Imports `connectDB` and `SprintModel`
- Called by `src/app/dashboard/page.tsx` via `fetch('/api/sprints')`
- Will be called by a future Sprint Setup page

**Plain English Analogy**: This is the **project registry window**. You can ask "is there an active project right now?" (GET) or submit a new project brief (POST). Only one project can be active at a time — asking for the active one returns it directly.

---

### `src/services/userService.ts`

**What it IS**: A client-side service module that encapsulates all user-related operations: registration, caching, and retrieval from `sessionStorage`.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `const STORAGE_KEY = 'retroboard_user'` | The `sessionStorage` key is defined as a constant here and nowhere else. Every other file that needs this key imports it or uses the exported functions — no magic strings scattered around. |
| 2 | `registerUser(data)` | Calls `POST /api/users` with the registration payload. If the response is not OK, reads the error JSON and throws a typed `Error`. Returns the `User` object on success. |
| 3 | `getCurrentUser()` | Reads `sessionStorage` (with a `typeof window === 'undefined'` SSR guard), parses the stored JSON, and returns the `User` or `null`. Wraps the parse in a `try/catch` to handle corrupted storage values gracefully. |
| 4 | `cacheUser(user)` | Writes the `User` to `sessionStorage` as JSON. The same SSR guard prevents this from running during server-side rendering. |
| 5 | `getAllUsers()` | Calls `GET /api/users` and returns the array of all users. Used by admin features. |

**Why it EXISTS**: Service modules separate _how_ to talk to an API from _what_ to render. The registration page (`page.tsx`) shouldn't know the URL of the API endpoint, the storage key, or how to handle a 400 response — that's the service's job. This also makes the functions independently testable and mockable.

**How it CONNECTS**:
- Imported by `src/app/page.tsx` (Registration page)
- Imported by `src/app/dashboard/page.tsx`
- Mocked in `src/__tests__/registration.test.tsx` and `src/__tests__/dashboard.test.tsx`

**Plain English Analogy**: This is the **HR agent** who handles all the paperwork. You (the registration form) just tell the agent "I want to register Jane Doe in Pod 1." The agent knows which form to fill out, which counter to go to, and where to file the confirmation copy (sessionStorage).

---

### `src/app/page.tsx` — Registration Page

**What it IS**: The root page of the application (`/`) — a client-side registration form that gates access to the rest of the app.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `"use client"` directive | Marks this as a React Client Component. Required because it uses `useState`, `useEffect`, and browser APIs (`sessionStorage`). |
| 2 | State declarations | `name`, `username`, `pod` — form field values. `isLoading` — disables the button during submission. `error` — inline validation message. |
| 3 | `useEffect` (mount guard) | On mount, calls `getCurrentUser()`. If a user is already cached in `sessionStorage`, redirects to `/dashboard` immediately — no re-registration needed. This is the **session persistence** mechanism. |
| 4 | `isDisabled` computed value | `true` if any field is empty or the form is loading. Controls the `disabled` attribute on the submit button — zero JavaScript `if` statements needed in the JSX. |
| 5 | `handleSubmit` | Calls `registerUser()`, then `cacheUser()`, then `router.push('/dashboard')` on success. On failure, sets the `error` state to display the API's error message inline. |
| 6 | JSX — Logo block | Hexagon icon + "RetroBoard" heading, centred. |
| 7 | JSX — Card with form | Three controlled inputs: `name` (text), `username` (text), `pod` (select with three options: Pod 1, Pod 2, Pod 3). Labels use `htmlFor` matching `id` attributes — required for accessible `getByLabelText` test queries. |
| 8 | JSX — Submit button | Displays "Joining..." when loading. Disabled via `isDisabled`. Styled with Tailwind. |

**Why it EXISTS**: As the root route (`/`), `page.tsx` is the entry point for all new users. It serves as a lightweight identity checkpoint — no password, just name + username + pod — consistent with the app's "async team tool, not a full auth system" design philosophy.

**How it CONNECTS**:
- Imports from `userService.ts` (`registerUser`, `getCurrentUser`, `cacheUser`)
- On success, navigates to `/dashboard` via `useRouter`
- Tested in `src/__tests__/registration.test.tsx` (REG-1 through REG-8)

**Plain English Analogy**: This is the **sign-in sheet at the conference room door**. Before you can enter the meeting (dashboard), you write your name and team. If you already signed in earlier (session still active), you walk straight in — no need to sign again.

---

### `src/app/layout.tsx`

**What it IS**: The root Next.js layout — the HTML shell that wraps every single page in the application.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | Font setup | `Inter` loaded from `next/font/google` with the Latin subset. Applied to `<body>` via `inter.className`. Google Fonts are self-hosted by Next.js at build time — no external network request at runtime. |
| 2 | `metadata` export | Sets the browser tab title ("RetroFlow — Async Team Retrospectives") and meta description for SEO/social sharing. Next.js reads this and injects `<title>` and `<meta>` tags automatically. |
| 3 | `RootLayout` component | Renders `<html lang="en" className="dark">` — the `lang` attribute is an accessibility requirement; `className="dark"` activates Tailwind's dark mode globally *(see Hotfix B)*. |
| 4 | `<body>` with `RetroProvider` | Wraps all children in `RetroProvider` (the global Zustand/Context state store from `retro-store.tsx`). Every page in the app has access to the retro store without needing to import it individually. |
| 5 | `<main className="flex-1 overflow-y-auto">` | A flex child that scrolls independently. Pages rendered inside this maintain their own scroll context. |

**Why it EXISTS**: Next.js App Router requires a `layout.tsx` at the `app/` root. This file is the one place where global HTML attributes, fonts, metadata, and providers are set. Any change here affects every page simultaneously.

**How it CONNECTS**:
- Wraps every page: `page.tsx`, `dashboard/page.tsx`, and all future pages
- Imports `RetroProvider` from `@/store/retro-store`
- Imports global styles from `./globals.css`

**Plain English Analogy**: This is the **building itself** — walls, entrance, lighting. Every office (page) inside gets the same building features automatically. You don't redecorate the lobby for each office — you set it once here.

---

## Sprint 1 — Session 3: Shell + Action Service + Dashboard + Tests

**Session Goal**: Build the shared authenticated layout (`Shell`), the action item data service, the main dashboard page, the actions API route, and the complete Jest test suite (25 tests across 4 files).

**Files delivered**:
- `src/app/api/actions/route.ts`
- `src/services/actionService.ts`
- `src/components/layout/Shell.tsx`
- `src/app/dashboard/page.tsx`

---

### `src/app/api/actions/route.ts`

**What it IS**: The API route for reading and creating action items, with optional sprint-scoped filtering.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `export async function GET(req: NextRequest)` | Reads the optional `?sprintId=` query parameter from `req.nextUrl.searchParams`. If present, adds `{ sprintId }` to the Mongoose query — returning only actions for that sprint. If absent, returns all actions. Returns `200` JSON array. |
| 2 | `export async function POST(req: NextRequest)` | Validates that `sprintId`, `title`, and `ownerId` are all present (400 if not — these are the three fields that make an action item meaningful). Creates and saves the document, returns `201`. |
| 3 | `try/catch` on both handlers | Returns `500` with `{ error: 'Database connection failed' }` on any database failure. *(Added in Hotfix A.)* |

**Why it EXISTS**: Action items are the measurable output of the retrospective process. This route is the CRUD gateway that both the dashboard (reads) and future Sprint Setup/Action Items pages (reads + writes) will use.

**How it CONNECTS**:
- Imports `connectDB` and `ActionItemModel`
- Called by `actionService.ts` on the client side
- Tested indirectly through `actionService.test.ts`

**Plain English Analogy**: This is the **task board API window**. You can ask "show me all tasks for Sprint 5" (GET with sprintId) or "here's a new task that needs doing" (POST). The window rejects incomplete task cards — you must say who owns it and what it's called.

---

### `src/services/actionService.ts`

**What it IS**: A client-side service that fetches action items and provides pure computation functions for stat card values.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `getActions(sprintId?)` | Async function. Builds the URL conditionally: `/api/actions?sprintId=X` if a sprintId is provided, `/api/actions` otherwise. Fetches, throws on error, returns the JSON array typed as `ActionItem[]`. |
| 2 | `getCompletionRate(actions)` | Pure function. Filters for items with status `"completed"` or `"verified"` (both count as "done"), divides by total, multiplies by 100, rounds to nearest integer. Returns `0` for an empty array to avoid division by zero. |
| 3 | `getOpenCount(actions)` | Pure function. Counts items with status `"open"` or `"in-progress"` — items that still need work. |
| 4 | `getCompletedCount(actions)` | Pure function. Counts items with status `"completed"` or `"verified"` — items that are done. |

**Why it EXISTS**: Separating pure computation from data fetching is a key testability principle. `getCompletionRate`, `getOpenCount`, and `getCompletedCount` take plain arrays and return numbers — they are deterministic and have zero side effects. This means tests don't need to mock a network; they just pass arrays. The dashboard component calls these functions to derive its stat card values without embedding business logic in the JSX.

**How it CONNECTS**:
- Imported by `src/app/dashboard/page.tsx`
- Tested directly in `src/__tests__/actionService.test.ts` (DB-7 and edge cases)
- Calls `GET /api/actions` (the route above)

**Plain English Analogy**: This is the **project analyst**. One part of their job is going to the filing room and pulling the right folder of task cards (the fetch). The other part is sitting at their desk doing arithmetic — "of these 10 tasks, 6 are done, so 60% complete." The arithmetic is done independently of the filing.

---

### `src/components/layout/Shell.tsx`

**What it IS**: The shared authenticated layout — a full-height sidebar wrapper that is used by every page inside the app (dashboard, feedback, action items, etc.).

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `"use client"` directive | Required because it uses `useState`, `useEffect`, and `sessionStorage`. |
| 2 | `ShellProps` interface | Accepts `children: React.ReactNode` (the page content) and optional `sprintName?: string` (displayed as a label above the nav). |
| 3 | `NAV_ITEMS` array | The four navigation destinations: Sprint Setup, Dashboard, Feedback Board, Action Items — with their `href`, `label`, and Lucide icon component. Defined outside the component so it's not recreated on every render. |
| 4 | `usePathname()` | Reads the current URL path from Next.js navigation. Used to determine which nav item is "active". No prop drilling — the shell knows where it is. |
| 5 | `useEffect` — user hydration | On mount, reads `sessionStorage.getItem("retroboard_user")`, parses it, and sets `currentUser` state. Wrapped in `try/catch` to silently ignore corrupted storage. This is done in `useEffect` (not render) because `sessionStorage` is a browser API unavailable during SSR. |
| 6 | JSX — `<aside>` (sidebar) | Fixed 240px wide sidebar with: logo block, sprint name label, nav items list, user identity card at the bottom. |
| 7 | Nav item rendering | Maps `NAV_ITEMS`. Each item checks `pathname === item.href` for the active state. Active items get: highlighted background (`bg-secondary`), coloured icon, and a 4px left accent bar (an amber vertical stripe). |
| 8 | User identity card | Only rendered if `currentUser` is non-null. Shows a 2-letter avatar (first letter of each word in name), the user's full name, and their pod. Positioned at the bottom of the sidebar with `mt-auto`. |
| 9 | JSX — `<main>` | The scrollable content area to the right of the sidebar. `{children}` is rendered here — this is where each page's unique content appears. |

**Why it EXISTS**: The sidebar, logo, nav, and user card are shared across Dashboard, Feedback Board, Action Items, and Sprint Setup. Without a Shell component, these would have to be copy-pasted into each page. Shell follows the **layout composition** pattern — pages don't render their own chrome, they slot their content into Shell's `{children}`.

**How it CONNECTS**:
- Imported by `src/app/dashboard/page.tsx` (and future pages)
- Reads from `sessionStorage` using the same key (`retroboard_user`) written by `userService.ts`
- Uses `usePathname()` from `next/navigation`
- Uses `cn()` from `@/lib/utils` for conditional Tailwind class merging

**Plain English Analogy**: This is the **office building's lobby and hallways**. Every floor (page) has the same front desk (logo), the same room directory (nav), and the same employee badge scanner (user card) at the entrance. The floors differ only in the room contents. Shell provides the shared building structure; each page provides the room contents.

---

### `src/app/dashboard/page.tsx`

**What it IS**: The main dashboard page — the first page users see after registration, showing the active sprint and high-level stats.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `"use client"` directive | Required for hooks and browser API usage. |
| 2 | `formatDate(dateStr)` | A small local utility that formats ISO date strings into "Apr 1, 2026" style using `toLocaleDateString`. Kept local because it's only used by this component. |
| 3 | `StatCard` component | A small presentational card: a title, a large numeric/string value, an icon, and a `data-testid` attribute for test targeting. The 4 dashboard metrics are rendered using this reusable card. |
| 4 | State: `sprint`, `actions`, `isLoading` | `sprint: Sprint | null` — the active sprint (null = no sprint). `actions: ActionItem[]` — all action items for stat computation. `isLoading: boolean` — controls the loading spinner. |
| 5 | `useEffect` — auth guard | First action on mount: calls `getCurrentUser()`. If null, redirects to `/` immediately with `router.push('/')`. This is the **page guard** — unauthenticated users cannot access the dashboard. |
| 6 | `useEffect` — data load | `Promise.all` fires both `fetch('/api/sprints')` and `getActions()` simultaneously. The sprint response is normalised: handles both a single sprint object and an empty array (the API returns `[]` when no sprint exists). Sets `sprint` and `actions` state on success. |
| 7 | `completionRate` derived value | Computed from `getCompletionRate(actions)` on every render — no extra state needed. |
| 8 | Loading state render | Renders a `<Shell>` with a centred "Loading…" text while data is in flight. |
| 9 | Sprint active state | When `sprint` is not null, renders: sprint name + date range header, a 4-column stat card grid (Feedback Count, Total Upvotes, Action Items, Completion Rate), and two placeholder panels (Recent Feedback, Activity Feed — stubs for Sprint 2). |
| 10 | Empty state | When `sprint` is null, renders: a dashed-border empty state box with "No sprint data yet." and a "Set Up Sprint →" button that routes to `/sprint-setup`. A second placeholder panel for future activity. |

**Why it EXISTS**: The dashboard is the **home base** of the app — the first thing a logged-in user sees and the central status overview. It demonstrates the complete data flow: user guard → API fetch → stat computation → conditional rendering. It also establishes the pattern that all authenticated pages follow: wrap in `<Shell>`, guard with `getCurrentUser()`.

**How it CONNECTS**:
- Wraps content in `<Shell sprintName={sprint?.name}>` — passes the sprint name to the sidebar label
- Imports `getCurrentUser` from `userService.ts`
- Imports `getActions`, `getCompletionRate`, `getOpenCount`, `getCompletedCount` from `actionService.ts`
- Calls `fetch('/api/sprints')` directly (not via a service — the sprints service was not created in Sprint 1)
- Tested in `src/__tests__/dashboard.test.tsx` (DB-1 through DB-6)

**Plain English Analogy**: This is the **morning standup board in the team room**. When you walk in (navigate to `/dashboard`), it checks your badge (getCurrentUser). If you're not registered, it sends you back to the lobby. If you are, it pulls up the current sprint's scoreboard — tasks done, feedback count, completion rate. If no sprint has been created yet, the board is blank with a prompt to set one up.

---

## Hotfixes Applied After Session 3

### Hotfix A — try/catch Added to All 3 API Routes

**Files modified**: `src/app/api/users/route.ts`, `src/app/api/sprints/route.ts`, `src/app/api/actions/route.ts`

**What changed**: Every `GET` and `POST` handler body was wrapped in a `try/catch` block. On catch, the handler logs `console.error('[ROUTE /api/...]', err)` and returns `NextResponse.json({ error: 'Database connection failed' }, { status: 500 })`.

**Why this matters for production**:

Before the hotfix, an uncaught exception inside a route handler (e.g., MongoDB connection timeout, Atlas network error, invalid environment variable) would cause Next.js to return an unformatted `500 Internal Server Error` page — or worse, crash the serverless function with an unhandled rejection. This has two problems:

1. **User experience**: The client receives an HTML error page instead of a JSON `{ error: "..." }` it can parse and display gracefully.
2. **Debuggability**: Without the `console.error`, server-side errors are invisible in logs. The explicit log with the route prefix (`[GET /api/users]`) makes it trivial to identify which route failed in a production log stream (e.g., Replit console, Vercel logs).

The fix follows the **fail gracefully** principle: the app tells the client "something went wrong with the database" in a structured, parseable format rather than crashing silently or returning HTML.

---

### Hotfix B — `className="dark"` Added to `<html>` in `layout.tsx`

**File modified**: `src/app/layout.tsx` (line 19)

**What changed**: `<html lang="en">` → `<html lang="en" className="dark">`

**Why this was needed for Tailwind dark mode**:

Tailwind CSS v3 has two strategies for dark mode:

- `darkMode: "media"` — activates dark styles based on the OS preference (`prefers-color-scheme: dark`)
- `darkMode: ["class"]` — activates dark styles only when a `dark` class is present on the `<html>` element

This project's `tailwind.config.ts` uses `darkMode: ["class"]`. This means every `dark:bg-background`, `dark:text-foreground`, and `dark:border-border` Tailwind utility class used throughout the components is **completely inert** unless the `<html>` element has `className="dark"`.

In Session 2, `layout.tsx` was rewritten to remove the global sidebar. During that rewrite, the `dark` class was not carried forward. The result: the entire application rendered in Tailwind's default light mode even though all component styles were written for dark mode — every `dark:` prefixed class silently did nothing.

Adding `className="dark"` to `<html>` is the single change that unlocks every dark-mode utility class across every component simultaneously, with no component-level changes required.

---

*End of CODE_EXPLAINER.md — Sprint 1 Foundation*

---

# Code Explainer — Sprint 2 + Sprint 3: Feedback Board + Action Items

**Mode**: [PROFESSOR]
**Sprints covered**: Sprint 2 (Sessions 1 + 2) + Sprint 3 (Sessions 1 + 2)
**Date**: April 12, 2026

---

## Sprint 2 — Session 1 Code Explanation

**Session Goal**: Build the complete read-only Feedback Board — a 3-column layout that fetches feedback from MongoDB, displays cards sorted by upvote count, and shows per-column empty states.

**Files delivered**: `src/app/api/feedback/route.ts`, `src/services/feedbackService.ts`, `src/components/FeedbackCard.tsx`, `src/components/FeedbackColumn.tsx`, `src/__tests__/feedbackService.test.ts`, `src/app/feedback/page.tsx` (replaced)

---

### `src/app/api/feedback/route.ts`

**What it IS**: The Next.js API route that handles reading and creating feedback items in MongoDB, with a "Reframe Rule" guard on POST.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `GET(req)` | Reads optional `sprintId` and `category` query params. Builds a dynamic Mongoose query object and calls `FeedbackItemModel.find(query).lean()`. Returns `200` JSON array. Both filters are optional — you can request one lane, an entire sprint, or all feedback. |
| 2 | `POST(req)` | Validates `category`, `content`, `sprintId`, `authorId` all present (400 if not). Then applies the **Reframe Rule**: if `category === 'slowed-us-down'` and `suggestion` is empty, returns `422` with a named error. Only if both guards pass does it create, save, and return `201`. |
| 3 | `try/catch` on both | Returns structured `500` JSON on any database failure — client always receives parseable JSON, never an HTML crash page. |

**Why it EXISTS**: Upvoting and submitting are write operations that must be enforced server-side. The Reframe Rule lives here so even a client that bypasses UI validation cannot post a `slowed-us-down` item without a suggestion.

**How it CONNECTS**: Called by `feedbackService.ts` → tested in `feedbackService.test.ts` (FS-5 through FS-8).

**Plain English Analogy**: The **suggestion box administrator** — checks every submitted note has a category, a project, and (for complaints) a proposed fix before filing it.

---

### `src/services/feedbackService.ts`

**What it IS**: The client-side service module for all feedback data operations — four read/display helpers (Session 1) plus two write helpers (Session 2, described below).

**What it DOES** (Session 1 additions):

| Block | Code | Explanation |
|---|---|---|
| 1 | `getFeedback(sprintId?)` | Optional sprintId: if absent, first fetches `/api/sprints` to find the active sprint, then calls `/api/feedback?sprintId=X`. |
| 2 | `getFeedbackByLane(sprintId, category)` | Calls `GET /api/feedback?sprintId=X&category=Y`. Used by the board page via `Promise.all` to populate all three columns in parallel. |
| 3 | `sortByUpvotes(items)` | Pure function. Shallow-copies and sorts descending by `upvotes`. Does not mutate the input array. |
| 4 | `getAuthorDisplay(item, authorName?)` | Pure function. Returns `'Anonymous'` if `item.isAnonymous`, else `authorName ?? 'Unknown'`. Centralises display-name logic. |

**Why it EXISTS**: Decouples "how to talk to the API" from the components. If the endpoint changes, only this file needs updating.

**How it CONNECTS**: Imported by `feedback/page.tsx` (fetch functions) and `FeedbackColumn.tsx` / `FeedbackCard.tsx` (pure functions). Mocked in `feedbackBoard.test.tsx`. Tested directly in `feedbackService.test.ts`.

**Plain English Analogy**: The **librarian for feedback data** — you say "bring me the `should-try` shelf for Sprint 42, sorted by most popular" and the librarian handles the filing cabinet access.

---

### `src/components/FeedbackCard.tsx`

**What it IS**: A single feedback card component displaying one `FeedbackItem`'s content, optional suggestion block, author identity, and upvote button.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `BORDER_CLASS` lookup | Maps each `FeedbackCategory` to a left-border CSS class. Defined at module scope — computed once, not per render. |
| 2 | Props interface | `item`, `authorName`, `onUpvote`, and (Sprint 3 S2 addition) `onConvert?`. |
| 3 | Content + suggestion blocks | `item.content` always shown. Suggestion block rendered conditionally only when `item.suggestion` is non-empty. |
| 4 | Footer row | Left: author avatar (anonymous icon or initial letter) + display name from `getAuthorDisplay`. Right: upvote button (`data-testid="upvote-btn"`) showing `item.upvotes`. |

**Why it EXISTS**: Atomic unit of the Feedback Board. Extracting it keeps `FeedbackColumn` to a simple `.map()` call and makes the card independently testable.

**How it CONNECTS**: Rendered by `FeedbackColumn`. Receives `onUpvote` and (Sprint 3 S2) `onConvert` forwarded from `FeedbackColumn` ← `feedback/page.tsx`.

**Plain English Analogy**: The **physical sticky note** on the retro board — coloured stripe on the left edge, message in the middle, thumbs-up counter in the corner.

---

### `src/components/FeedbackColumn.tsx`

**What it IS**: A single column of the Feedback Board — category header, count badge, sorted card list, and per-column empty state.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `COLUMN_CONFIG` lookup | Maps each category to title, Tailwind colours, glow shadow, and empty-state message. Config-driven — no `if/else` chains in JSX. |
| 2 | Props interface | `category`, `items[]`, `onUpvote(itemId)`, `currentUserId`, and (Sprint 3 S2 addition) `onConvert?`. |
| 3 | `sortByUpvotes(items)` | Called in the component body — column always displays cards sorted descending regardless of fetch order. |
| 4 | Empty state | Dashed-border box with per-category message when `sorted.length === 0`. |
| 5 | Card list | Maps `sorted`, renders `<FeedbackCard>` for each. Partially applies `item._id` into `onUpvote` so the card calls `onUpvote()` without knowing its own ID. |

**Why it EXISTS**: The board has three identical-structured columns differing only in colour and label. Config-driven design means adding a fourth category requires only one new entry in `COLUMN_CONFIG`.

**How it CONNECTS**: Rendered three times by `feedback/page.tsx`. Imports and renders `FeedbackCard`. Imports `sortByUpvotes` from `feedbackService.ts`.

**Plain English Analogy**: The **labelled swim-lane** on the retro board — the "What Slowed Us Down?" column holds a sorted stack of sticky notes (FeedbackCards). The board holds the columns.

---

### `src/__tests__/feedbackService.test.ts`

**What it IS**: Jest test file for `feedbackService.ts` pure functions and the `GET /api/feedback` + `POST /api/feedback` route handlers.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `@jest-environment node` | Required for `NextRequest`/`NextResponse` which are Node.js constructs unavailable in jsdom. |
| 2 | Mocks | `@/lib/db` → `connectDB` resolves immediately. `@/lib/models/FeedbackItem` → fake constructor with `mockSave` on instance and `find(...).lean()` wrapping `mockFind` statically. |
| 3 | `makeFeedbackItem(overrides?)` | Factory — complete default item, only pass fields relevant to each test. |
| 4 | FS-1, FS-2 (`sortByUpvotes`) | Sorted descending; original array not mutated. |
| 5 | FS-3, FS-4 (`getAuthorDisplay`) | Anonymous → `'Anonymous'`; named → `authorName`. |
| 6 | FS-5 (GET) | `mockFind` returns two items → route returns `200` + `Array.isArray`. |
| 7 | FS-6, FS-7, FS-8 (POST) | Valid `went-well` → `201`; `slowed-us-down` + empty suggestion → `422` + Reframe Rule error + `mockSave` NOT called; `slowed-us-down` + non-empty suggestion → `201`. |

**Why it EXISTS**: Validates both pure computation logic (no mocks needed) and server-side business rules (Reframe Rule enforced at API layer). Safety net: if sort direction changes or 422 guard is relaxed, a test fails immediately.

**Plain English Analogy**: The **quality inspector's checklist** — uses fake filing cabinets (mocks) to verify the sorting machine, the Reframe Rule gate, and the save flow without touching a real database.

---

### `src/app/feedback/page.tsx` — Session 1 version

**What it IS**: The Feedback Board page — the authenticated three-column view that owns data fetching, modal control, and upvote/convert coordination.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | State | `sprint`, `slowedDown`/`shouldTry`/`wentWell` arrays, `showModal`, `showConvertModal` (S3-S2), `convertTarget` (S3-S2), `users` (S3-S2), `isLoading`. |
| 2 | `refetch(sprintId)` | `useCallback` wrapping `Promise.all` with three `getFeedbackByLane` calls. Stable reference prevents `useEffect` infinite loops. |
| 3 | `useEffect` | Auth guard → redirect if no user. Fetches `/api/sprints`, resolves active sprint, fetches `/api/users` (S3-S2, with `Array.isArray` guard), calls `refetch`. |
| 4 | `handleUpvote` (S2) | Calls `upvoteFeedback`, then `refetch`. 403/409 silently caught. |
| 5 | `handleConvert` / `handleConvertSubmit` (S3-S2) | Sets `convertTarget` + opens modal; calls `createAction` + closes modal. |
| 6 | `onSubmitFeedback` (S2) | Calls `addFeedback` + `refetch`. |
| 7 | Render | Loading state → 3 `<FeedbackColumn>` instances → `<SubmitFeedbackModal>` → `<ConvertActionModal>` (S3-S2). |

**Why it EXISTS**: Owns the data lifecycle for the entire Feedback Board — auth guard, sprint resolution, per-lane parallel fetch, refetch after mutations, and modal coordination.

**How it CONNECTS**: Wraps content in `<Shell>`. Uses `getFeedbackByLane`, `addFeedback`, `upvoteFeedback`. Renders `FeedbackColumn` × 3, `SubmitFeedbackModal`, `ConvertActionModal`. Tested FB-1 through FB-16.

**Plain English Analogy**: The **retro facilitator** — checks badges (auth), pulls the sticky notes (fetch by lane), coordinates the "submit a note" and "convert to task" forms (modals).

---

## Sprint 2 — Session 2 Code Explanation

**Session Goal**: Add the Submit Feedback modal (write path) and the upvote system (PATCH route + service + re-fetch).

**Files created**: `src/components/SubmitFeedbackModal.tsx`, `src/app/api/feedback/[id]/upvote/route.ts`, `src/__tests__/feedbackBoard.test.tsx`

**Files modified**: `feedbackService.ts` (added `addFeedback`, `upvoteFeedback`), `feedback/page.tsx` (wired modal + upvote handler), `FeedbackCard.tsx` (added `data-testid="upvote-btn"`)

---

### `src/components/SubmitFeedbackModal.tsx`

**What it IS**: A controlled modal dialog for submitting a new feedback item, with dynamic Reframe Rule enforcement.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | Props | `open`, `onClose`, `onSubmit(payload): Promise<void>`, `sprintId`. Modal is "dumb" — collects data and delegates the API call to the parent. |
| 2 | State | `category`, `content`, `suggestion`, `isAnonymous`, `isSubmitting`. All reset in `handleClose()`. |
| 3 | `if (!open) return null` | Complete DOM removal when closed — screen readers never encounter a hidden modal. |
| 4 | `submitDisabled` | `!content.trim() \|\| (isSlowed && !suggestion.trim()) \|\| isSubmitting`. Three conditions for disable: empty content, Reframe Rule violation, or in-flight submission. |
| 5 | Backdrop + dialog | `fixed inset-0 z-50` backdrop with click-outside-to-close. `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `data-testid="submit-feedback-modal"`. |
| 6 | Category radios | `role="radiogroup"`. Selecting `slowed-us-down` highlights the label with a subtle background. |
| 7 | Suggestion field | Only rendered when `isSlowed`. Red-bordered textarea + "REFRAME RULE: REQUIRED" badge. |
| 8 | Submit button | `data-testid="modal-submit-btn"`, `disabled={submitDisabled}`. |

**Why it EXISTS**: The submit flow requires form state, validation, and conditional rendering — too complex to inline in the page. Extracts the concern cleanly; the modal's only contract is "call `onSubmit` with a payload."

**How it CONNECTS**: Rendered by `feedback/page.tsx`. `onSubmit` = `onSubmitFeedback` which calls `addFeedback()`. Tested FB-5 through FB-10.

**Plain English Analogy**: The **suggestion form overlay** — guides you through picking a category, writing your note, and (for complaints) forcing a fix proposal. Hands the completed form to the facilitator (page handler) and clears itself.

---

### `src/app/api/feedback/[id]/upvote/route.ts`

**What it IS**: The PATCH API route that records a single upvote, with guards against self-voting and duplicate voting.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `userId` + 400 guard | `userId` required in request body. Every upvote must be attributable to a user. |
| 2 | `findById` + 404 guard | Returns 404 if item not found. |
| 3 | Self-vote — 403 | `item.authorId === userId` → `403 "Cannot upvote own feedback"`. |
| 4 | Duplicate — 409 | `item.upvotedBy.includes(userId)` → `409 "Already upvoted"`. Server-side check — not trusted from client. |
| 5 | Increment + save | `item.upvotedBy.push(userId)`, `item.upvotes += 1`, `item.save()`. Returns `{ upvotes }` as `200`. |

**Why it EXISTS**: Upvote integrity must be server-enforced. `upvotedBy` is the authoritative deduplication set; `upvotes` is a cached integer for fast display.

**How it CONNECTS**: Called by `upvoteFeedback(itemId, userId)` in `feedbackService.ts`. Tested indirectly via mocked `upvoteFeedback` in FB-11, FB-12.

**Plain English Analogy**: The **voting booth clerk** — checks you're not voting for your own proposal (403), haven't already voted (409), then stamps the proposal with one more vote and records your name.

---

### `feedbackService.ts` — Session 2 additions

> **Modification note** — two functions added to the file created in Session 1:

**`addFeedback(payload)`**: Client-side Reframe Rule guard (throws before fetch if `slowed-us-down` + empty suggestion). Calls `POST /api/feedback`. On `422`, reads and re-throws the server error message for display.

**`upvoteFeedback(itemId, userId)`**: Calls `PATCH /api/feedback/{id}/upvote` with `{ userId }`. On non-OK response reads the JSON error and throws. The page handler catches all errors silently — 403 and 409 produce no visible UI change, which is correct UX for these cases.

---

### `src/__tests__/feedbackBoard.test.tsx`

**What it IS**: The React Testing Library integration test file for the full `FeedbackBoardPage` — testing the complete journey from loading through submit and upvote.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | Top-level mocks | `next/navigation`, `@/services/userService`, `@/services/feedbackService`, `@/components/layout/Shell`. Hoisted before any import resolves. Shell mock prevents sidebar's own `sessionStorage` reads from interfering. |
| 2 | `makeFeedbackItem(overrides?)` | Factory pattern — create a complete valid item with defaults, merge only what each test needs. |
| 3 | `waitForBoardLoaded()` | Waits for `data-testid="open-modal-btn"`. Only appears after `isLoading = false` — correct loaded-state sentinel. |
| 4 | `beforeEach` | Clears mocks + `sessionStorage`. `getCurrentUser` → `mockUser`. `getFeedbackByLane` → `[]`. `global.fetch` → returns `mockSprint` for all URLs. |
| 5 | FB-1–4 | Rendering: valid session renders board; no session redirects; three headers present; empty lane messages shown. |
| 6 | FB-5–6 | Modal visibility: click Submit → modal appears; Cancel → disappears. |
| 7 | FB-7–10 | Reframe Rule UI: `slowed-us-down` shows suggestion field + badge; `went-well` hides them; slowed + empty suggestion → submit disabled; slowed + non-empty → enabled. |
| 8 | FB-11–12 | Error handling: own-feedback upvote → silently swallowed, count unchanged; duplicate upvote → 409 silent, count stays at 4. FB-12 uses a call-counter mock because RTL's `waitFor` polling exhausts `mockResolvedValueOnce` chains. |
| 9 | FB-13 | Successful upvote → board re-fetches from API; count increments via re-fetch, not locally. |
| 10 | `describe('Sprint 3 — Convert to Action flow')` | Scoped block with URL-discriminating fetch mock (returns `[mockUser]` for `/api/users`, `mockSprint` for others). FB-14: `should-try` card has `convert-btn`. FB-15: exactly 1 convert button for 2 cards (went-well has none). FB-16: click → `convert-action-modal` appears + title pre-filled + submit disabled. |

**Why it EXISTS**: The board involves async loading, conditional rendering, modal state, error handling, and inter-component callbacks. Integration tests catch failures that unit tests miss.

**Plain English Analogy**: The **mystery shopper** — walks through the entire suggestion box experience, testing column labels, form validation, upvote rejection, and the Convert to Action flow end-to-end.

---

## Sprint 3 — Session 1 Code Explanation

**Session Goal**: Build the complete Action Items page — an authenticated list view with status stats, a "New Action Item" modal, and the full advance/verify lifecycle — backed by new API routes, an extended action service, and a comprehensive test suite.

**Files created**: `src/components/ActionItemCard.tsx`, `src/components/NewActionItemModal.tsx`, `src/app/actions/page.tsx`, `src/app/api/actions/[id]/advance/route.ts`, `src/app/api/actions/[id]/verify/route.ts`

**Files modified**: `src/app/api/actions/route.ts` (hardened), `src/services/actionService.ts` (4 new functions + updated `getCompletionRate`), `src/__tests__/actionService.test.ts` (appended AS-1 through AS-VG-1)

---

### `src/app/api/actions/route.ts` — Sprint 3 Session 1 changes

> **Modification note** — file created Sprint 1 Session 3. Sprint 3 hardened it:

- **GET**: Added `400` guard for missing `sprintId` (previously returned all actions if absent). Added `.limit(100)` to prevent unbounded result sets.
- **POST**: Forced `status: 'open'` on every new item regardless of what the client sends. Required `title, ownerId, sprintId` trio (previously only `sprintId` + `title`). Replaced `console.error` with `void err`.
- **catch blocks**: Both now use `void err` (silently discards the error reference) instead of `console.error` to comply with the "no console in src/" convention.

---

### `src/services/actionService.ts` — Sprint 3 Session 1 additions

> **Modification note** — file created Sprint 1 Session 3 with `getActions`, `getCompletionRate`, `getOpenCount`, `getCompletedCount`. Sprint 3 extended it:

**`getCompletionRate` — updated**: Changed from counting `"completed" || "verified"` to counting `"verified"` only. Rationale: a task is only truly validated when a human has written an impact statement. This is a **breaking change** — two Sprint 1 tests now fail intentionally and must not be reverted.

**`CreateActionPayload` interface** (new): Exports the typed shape for creating an action item. Defined once here so both `NewActionItemModal` and `ConvertActionModal` use the same payload type.

**`getActionsByStatus(items)` — new**: Pure function. Sorts action items in canonical display order `open → in-progress → completed → verified` using a `STATUS_ORDER` lookup map. Within the same status, sorts by `createdAt` ascending. Does not mutate the input array.

**`createAction(payload)` — new**: Client-side guard (throws if `title` blank or `ownerId` empty before any fetch), then `POST /api/actions`. Returns the created `ActionItem`.

**`advanceStatus(itemId)` — new**: `PATCH /api/actions/{id}/advance` with no body. Returns the updated item. Transition logic lives on the server route, not here.

**`verifyImpact(itemId, impactNote)` — new**: Client-side guard (throws if `impactNote` blank), then `PATCH /api/actions/{id}/verify` with `{ impactNote }`. The guard fires before any network call — tested by AS-VG-1.

**Plain English Analogy**: The service is now the **complete project manager's toolkit** — a sorting tray (`getActionsByStatus`), a "file a new ticket" function (`createAction`), a "move this ticket forward" function (`advanceStatus`), and a "sign off with written proof" function (`verifyImpact`).

---

### `src/components/ActionItemCard.tsx`

**What it IS**: A single action item card displaying the full state of one `ActionItem` — title, status badge, description, source feedback quote, verified impact note, owner, due date, and contextual action buttons.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `STATUS_DISPLAY` + `STATUS_COLOR` lookups | Map each status value to a human-readable label and Tailwind colour class. Module-scope — zero conditional logic in JSX for colours. |
| 2 | Props | `item: ActionItem`, `ownerName: string` (resolved from `usersMap` in page), `onAdvance(itemId)`, `onVerify(item)`. |
| 3 | Due date logic | `dueDateLabel` is `'Due Today'` if due date matches today's ISO string, `'Due This Sprint'` if a future date exists, or `''` if no due date. |
| 4 | `showSourceFeedback` flag | True only when both `sourceFeedbackId` and `sourceQuote` are non-empty — prevents an empty block on directly-created items. |
| 5 | `showImpactNote` flag | True only when `status === 'verified'` AND `impactNote` exists. Impact block only appears on verified items. |
| 6 | Header | `<h3>` with `item.title` + coloured status badge. |
| 7 | Source Feedback block | Labelled box with `&ldquo;{item.sourceQuote}&rdquo;` — curly quotes. Shown when `showSourceFeedback`. |
| 8 | Verified Impact block | Purple-tinted box with impact statement. Shown only when `showImpactNote`. |
| 9 | Advance Status button | `data-testid="advance-btn"`. Rendered only for `open` or `in-progress` items. Calls `onAdvance(item._id)`. |
| 10 | Verify Impact button | `data-testid="verify-btn"`. Rendered only for `completed` items. Calls `onVerify(item)` passing the full item so the modal can pre-populate. |

**Why it EXISTS**: Action items have rich information and status-dependent buttons. Embedding this in a page `.map()` would produce hundreds of lines of page JSX. Extracting it keeps each concern isolated and testable.

**How it CONNECTS**: Rendered by `actions/page.tsx`. Tested via AI-5 through AI-8, AI-13.

**Plain English Analogy**: The **Kanban task card** — shows who owns it, when it's due, and what state it's in. If it's in-progress, there's a "Move Forward" arrow; if done, a "Sign Off" stamp space; if signed off, the written proof is printed at the bottom.

---

### `src/components/NewActionItemModal.tsx`

**What it IS**: A controlled modal for manually creating a new action item — title, description, owner, and optional due date.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | Props | `open`, `sprintId`, `users: Pick<User, '_id' \| 'name'>[]`, `onClose`, `onSubmit(payload): Promise<void>`. Only the two user fields needed for the dropdown are passed. |
| 2 | `submitDisabled` | `!title.trim() \|\| !ownerId \|\| isSubmitting`. Both title and owner required — submit disabled until both filled. |
| 3 | `handleSubmit` | Calls `onSubmit({ ..., sourceFeedbackId: '', sourceQuote: '', sprintId })`. Empty source fields distinguish direct items from converted ones. |
| 4 | Dialog markup | `role="dialog"`, `aria-modal="true"`, `data-testid="new-action-modal"`. Backdrop click-to-close. |
| 5 | Owner `<select>` | Maps `users[]` into `<option>` elements. `ownerId` is required — button stays disabled until a non-empty value is selected. |
| 6 | Submit button | `data-testid="new-action-submit-btn"`. |

**Why it EXISTS**: Manual action item creation (not from feedback) is a key workflow. Extracting the modal keeps the page thin. The `sourceFeedbackId: ''` convention distinguishes direct from converted items — the card's source block only appears when this field is non-empty.

**How it CONNECTS**: Rendered by `actions/page.tsx`. `onSubmit` = `handleCreateAction` → `createAction()`. Tested AI-14.

**Plain English Analogy**: The **blank new-task form** a team lead fills out when adding an improvement task directly. Must have a title and an owner. Once submitted, appears on the board.

---

### `src/app/actions/page.tsx`

**What it IS**: The Action Items page — the authenticated view for tracking, advancing, and verifying improvement tasks for the active sprint.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | State | `sprint`, `actions`, `users`, `showNewModal`, `showVerifyModal`, `verifyTarget`, `isLoading`, `error`. Both loading and error states required by convention. |
| 2 | `refetch(sprintId)` | `useCallback` calling `getActions(sprintId)` then `getActionsByStatus(items)`. Stable reference prevents `useEffect` loops. |
| 3 | `useEffect` | Auth guard → redirect if no user. `AbortController` passed to both fetch calls — cancelled on unmount. Fetches sprint, then users, then calls `refetch`. |
| 4 | `usersMap` | `{ [userId]: name }` built by iterating `users[]`. Used in render as `usersMap[item.ownerId] ?? 'Unknown'` — no per-render lookup function needed. |
| 5 | `handleAdvance` | Calls `advanceStatus`, then `refetch`. 409 (already completed) silently swallowed. |
| 6 | `handleVerify` | Sets `verifyTarget = item`, `showVerifyModal = true`. |
| 7 | `handleVerifySubmit` | Calls `verifyImpact`, then `refetch`. `showVerifyModal = false` in `finally` — modal always closes even on error. |
| 8 | `handleCreateAction` | Calls `createAction`, then `refetch`. |
| 9 | Status bar | Five coloured pill badges. "Completed" shows `completedCount - verifiedCount`. `completionRate` from `getCompletionRate`. |
| 10 | Empty state | Shown when `actions.length === 0`. Two CTA buttons: "Go to Feedback Board" + "New Action Item". |
| 11 | List + modals | `actions.map(item => <ActionItemCard>)`. `<NewActionItemModal>` + `<VerifyImpactModal>` mounted always, controlled by `open` prop. |

**Why it EXISTS**: The accountability screen of the app — where the team tracks whether improvements are actually happening. Owns the full data lifecycle for action items and coordinates cards and modals.

**How it CONNECTS**: Wraps in `<Shell>`. Imports `ActionItemCard`, `NewActionItemModal`, `VerifyImpactModal`. Imports 7 functions from `actionService.ts`. Tested AI-1 through AI-14.

**Plain English Analogy**: The **project status wall** — a live board showing every open task, owner, and progress. Team members advance tasks forward or sign off that fixes worked. The page coordinates all state changes.

---

### `src/app/api/actions/[id]/advance/route.ts`

**What it IS**: The PATCH route that advances an action item one step through the lifecycle: `open → in-progress → completed`. Cannot advance past `completed`.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `ADVANCE_MAP` | `{ 'open': 'in-progress', 'in-progress': 'completed' }`. Looking up `completed` or `verified` returns `undefined`. |
| 2 | `findById` + 404 guard | Standard lookup. |
| 3 | `!nextStatus` → 409 | If status is `completed` or `verified`, returns `409 "Cannot advance: item is already completed or verified"`. |
| 4 | Update + save | `item.status = nextStatus`, `item.save()`, returns full updated item as `200`. |

**Why it EXISTS**: Status transition logic belongs server-side — a malicious client cannot send `status: "verified"` directly and bypass the impact-note requirement in the verify route.

**How it CONNECTS**: Called by `advanceStatus(itemId)` in `actionService.ts`. Tested AS-8, AS-9, AS-10.

**Plain English Analogy**: The **Kanban column gate** — moves a card one column right. Once a card reaches "Done", the gate locks. Moving to "Verified" requires the separate verify process.

---

### `src/app/api/actions/[id]/verify/route.ts`

**What it IS**: The PATCH route that marks a `completed` action item as `verified` by recording a non-empty impact note.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `impactNote` + 400 guard | Missing or whitespace-only → `400 "impactNote is required"`. Evidence is not optional. |
| 2 | `findById` + 404 guard | Standard lookup. |
| 3 | Status check + 409 guard | `item.status !== 'completed'` → `409 "Cannot verify: item must be in completed status"`. Cannot verify open or in-progress items. |
| 4 | Set verified + save | `item.status = 'verified'`, `item.impactNote = impactNote.trim()`. Returns updated item as `200`. |

**Why it EXISTS**: Verification is a distinct event from completion — "we said we fixed it" (completed) vs "we measured it worked" (verified). Requiring `impactNote` and only allowing transition from `completed` enforces the accountability model.

**How it CONNECTS**: Called by `verifyImpact(itemId, impactNote)` in `actionService.ts`. Tested AS-11, AS-12, AS-13.

**Plain English Analogy**: The **quality sign-off window** — stamps "VERIFIED" only if the task was already complete AND you hand in a written note proving the improvement worked.

---

### `src/__tests__/actionService.test.ts` — Sprint 3 additions

> **Extension note** — file existed from Sprint 1 with DB-7 and four legacy tests. Sprint 3 appended AS-1 through AS-VG-1.

**Mock architecture**: `jest.mock('@/lib/models/ActionItem', ...)` uses a factory that declares `mockSave`, `mockFind`, `mockFindById` *inside* the factory, exposes them via `__mockSave`, `__mockFind`, `__mockFindById` properties on the constructor, and retrieves them in tests via `jest.requireMock()`. This solves Jest's hoisting problem: factory functions run before module imports, so module-scope variables are not yet initialised when the factory runs.

| Test group | Tests | What is validated |
|---|---|---|
| `getActionsByStatus` | AS-1, AS-2 | AS-1: four items in mixed order → sorted `open→in-progress→completed→verified`. AS-2: original array not mutated. |
| `getCompletionRate Sprint 3` | AS-3 | 2 verified / 5 total → `40`. Confirms `verified`-only counting. |
| `GET /api/actions` | AS-4, AS-5 | With `sprintId` → `200` + array; no `sprintId` → `400`. |
| `POST /api/actions` | AS-6, AS-7 | Valid payload → `201` + `mockSave` called; missing `title` → `400`, no save. |
| `PATCH advance` | AS-8–10 | open→in-progress `200`; in-progress→completed `200`; completed→`409` (no save). |
| `PATCH verify` | AS-11–13 | completed + valid note → `200` + `verified` + `impactNote` stored; empty note → `400`; non-completed → `409`. |
| `verifyImpact service` | AS-VG-1 | Throws before `fetch` when `impactNote` empty — client-side guard fires first. |

**Plain English Analogy**: The **automated inspection checklist for the task back-end** — verifies one-step-at-a-time advancement, mandatory impact notes, and that the client-side guard refuses to call the server with a blank note.

---

## Sprint 3 — Session 2 Code Explanation

**Session Goal**: Close the feedback-to-action-item loop with the "Convert to Action" flow and replace the verify modal stub with the real `VerifyImpactModal`.

**Files created**: `src/components/ConvertActionModal.tsx`, `src/components/VerifyImpactModal.tsx`, `src/__tests__/actionItems.test.tsx`

**Files modified** (short "What changed" notes):
- `src/components/FeedbackCard.tsx` — added `onConvert?` prop + "Convert to Action" button
- `src/components/FeedbackColumn.tsx` — added `onConvert?` prop forwarding
- `src/app/feedback/page.tsx` — wired `ConvertActionModal`, users fetch, convert handlers
- `src/app/actions/page.tsx` — replaced stub with real `<VerifyImpactModal>`
- `src/__tests__/feedbackBoard.test.tsx` — appended FB-14/15/16 in scoped describe block

---

### `src/components/ConvertActionModal.tsx`

**What it IS**: A controlled modal that converts a `should-try` feedback item into a new action item, pre-filling the title from feedback content and requiring an owner assignment.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | Props | `open`, `feedbackItem: FeedbackItem \| null`, `sprintId`, `users: Pick<User, '_id' \| 'name'>[]`, `onClose`, `onSubmit(payload: CreateActionPayload): Promise<void>`. |
| 2 | `useEffect([feedbackItem])` | When `feedbackItem` changes (new card's Convert button clicked), sets `title = feedbackItem.content`. This is the **pre-fill** mechanism — modal opens with the feedback text already in the title field. |
| 3 | `if (!open \|\| !feedbackItem) return null` | Double guard — don't render if closed or if no source item. |
| 4 | `submitDisabled` | `!title.trim() \|\| !ownerId \|\| isSubmitting`. Both title and owner required. |
| 5 | `handleSubmit` | Calls `onSubmit({ ..., sourceFeedbackId: feedbackItem._id, sourceQuote: feedbackItem.content, sprintId })`. Sets both source fields — creates the traceability link displayed in `ActionItemCard`'s "Source Feedback" block. |
| 6 | Source quote blockquote | `border-l-4 border-blue-500` with feedback content in italic. Shows the user what they are converting. |
| 7 | Owner `<select>` | Same pattern as `NewActionItemModal`. Required. |
| 8 | Submit button | `data-testid="convert-action-submit-btn"`. Amber-coloured to distinguish from other Submit buttons. |

**Why it EXISTS**: The convert flow bridges the Feedback Board and the Action Items page. Without it, teams manually copy feedback into action item forms and lose the audit trail. With it, one click pre-fills the form and permanently records which feedback triggered which action.

**How it CONNECTS**: Rendered by `feedback/page.tsx`. `onSubmit` = `handleConvertSubmit` → `createAction()`. `feedbackItem` = `convertTarget` state set by `handleConvert(item)`. Tested FB-16.

**Plain English Analogy**: The **"turn this suggestion into a task" form** — suggestion text is pre-copied into the title box. Pick an owner, click Create. The task card will forever show where it came from.

---

### `src/components/VerifyImpactModal.tsx`

**What it IS**: A controlled modal for writing an impact statement that marks a `completed` action item as `verified` — the final step of the improvement lifecycle.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | Props | `open`, `item: ActionItem \| null`, `onClose`, `onSubmit(itemId: string, impactNote: string): Promise<void>`. |
| 2 | `if (!open \|\| !item) return null` | Double guard — same pattern as `ConvertActionModal`. |
| 3 | `submitDisabled` | `!impactNote.trim() \|\| impactNote.length > 300 \|\| isSubmitting`. Empty, over limit, or submitting. The `> 300` check mirrors `maxLength={300}` — both needed because `maxLength` can be bypassed by pasting. |
| 4 | `handleSubmit` | Calls `onSubmit(item._id, impactNote)`. Page handler calls `verifyImpact(itemId, impactNote)` → verify API route. |
| 5 | Item title display | Renders `item.title` above the form — user can see which task they are verifying. |
| 6 | Source quote (conditional) | `item.sourceQuote !== ''` → shows amber left-border blockquote with original feedback. Only appears for converted items. |
| 7 | Impact textarea | `maxLength={300}`, placeholder with measurable outcome example. |
| 8 | Character counter | `{impactNote.length} / 300` — live update. Provides feedback before the user hits the limit. |
| 9 | Submit button | `data-testid="verify-impact-submit-btn"`. Amber. Text: "Confirm Verified". |

**Why it EXISTS**: Verification is the most consequential lifecycle step — the formal record that an improvement was real and measurable. The 300-char limit forces conciseness. The impact note is stored permanently and displayed on `ActionItemCard` thereafter.

**How it CONNECTS**: Rendered by `actions/page.tsx` (replaced the stub). `onSubmit` = `handleVerifySubmit`. `item` = `verifyTarget` state. Tested AI-9 through AI-12.

**Plain English Analogy**: The **sign-off form for a completed improvement** — you must submit written proof of impact (max 300 chars). Once submitted, the proof is permanently attached to the task card.

---

### `FeedbackCard.tsx` — Sprint 3 Session 2 changes

> **What changed**: Added optional `onConvert?: (item: FeedbackItem) => void` to props. When `onConvert` is defined AND `item.category === 'should-try'`, renders a `data-testid="convert-btn"` amber button. Calls `onConvert(item)`. The `category === 'should-try'` guard ensures only suggestion cards show the button — not `slowed-us-down` or `went-well`.

---

### `FeedbackColumn.tsx` — Sprint 3 Session 2 changes

> **What changed**: Added `onConvert?: (item: FeedbackItem) => void` to props. Transparent pass-through: receives `onConvert` from the page and forwards it to each `<FeedbackCard>`. Because the prop is optional, all existing `FeedbackColumn` usages without `onConvert` continue to work unchanged.

---

### `feedback/page.tsx` — Sprint 3 Session 2 changes

> **What changed**: Added `ConvertActionModal` + `createAction` imports. Added three state variables: `showConvertModal`, `convertTarget: FeedbackItem | null`, `users: Pick<User, '_id' | 'name'>[]`. Added `GET /api/users` fetch inside `load()` guarded by `Array.isArray` (prevents TypeError when the existing test mock returns a non-array for all URLs). Added `handleConvert(item)` and `handleConvertSubmit(payload)`. Passed `onConvert={handleConvert}` to all three `<FeedbackColumn>` instances. Added `<ConvertActionModal>` at the bottom of the return tree.

**Key design decision — `Array.isArray` guard**: The outer `feedbackBoard.test.tsx` `beforeEach` mocks `global.fetch` returning `mockSprint` (a plain object) for ALL URLs. Without the guard, `usersData.map(...)` would throw a `TypeError` in all FB-1–FB-13 tests. The guard (`if (Array.isArray(usersData))`) allows the page to gracefully skip user population when the response isn't an array — correct in test (skips) and correct in production (maps real array).

---

### `actions/page.tsx` — Sprint 3 Session 2 changes

> **What changed**: Added `VerifyImpactModal` import. Replaced the one-line stub `{showVerifyModal && <div data-testid="verify-modal-stub" />}` with the full `<VerifyImpactModal open={showVerifyModal} item={verifyTarget} onClose={...} onSubmit={handleVerifySubmit} />`. The `handleVerifySubmit` function was already wired in Session 1 — Session 2 connected it to the real modal.

---

### `feedbackBoard.test.tsx` — Sprint 3 Session 2 changes

> **What changed**: Appended a `describe('Sprint 3 — Convert to Action flow', ...)` block at the end of the file. This scoped block has its own `beforeEach` that overrides `global.fetch` with a URL-discriminating mock: `/api/users` → returns `[mockUser]` (an array, matching the real endpoint); all other URLs → return `mockSprint`. Necessary because `feedback/page.tsx` now fetches `/api/users` — the outer `beforeEach` mock would return `mockSprint` (a plain object) for this URL, producing an empty `users` array even with the `Array.isArray` guard, which is the correct outer-test behaviour but the wrong inner-test behaviour (FB-16 needs a real user in the owner dropdown).

---

### `src/__tests__/actionItems.test.tsx`

**What it IS**: The React Testing Library integration test file for `ActionItemsPage` — AI-1 through AI-14 covering the full page lifecycle.

**What it DOES**:

| Block | Code | Explanation |
|---|---|---|
| 1 | `@jest-environment jsdom` | Explicit jsdom environment — renders React components in a browser-like DOM. |
| 2 | Top-level mocks | `next/navigation`, `@/services/userService`, `@/services/actionService`, `@/components/layout/Shell`. Same pattern as `feedbackBoard.test.tsx`. |
| 3 | `makeActionItem(overrides?)` | Factory — default open item, only pass the fields each test needs. |
| 4 | `waitForPageLoaded()` | Waits for `data-testid="open-new-action-btn"`. This button only renders once `isLoading === false` and no error — correct loaded-state sentinel. `shell` was deliberately not used because Shell renders in both loading and loaded states. |
| 5 | `beforeEach` | Clears mocks + `sessionStorage`. `getCurrentUser` → `mockUser`. `getActions` → `[]`. `global.fetch` URL-discriminating mock: `/api/users` → `[mockUser]`, all others → `mockSprint`. |
| 6 | AI-1 | Valid session → `shell` renders, no redirect. |
| 7 | AI-2 | No session → `router.push('/')` called. |
| 8 | AI-3 | Empty `getActions` → empty state heading + body present. |
| 9 | AI-4 | "Go to Feedback Board" → `router.push('/feedback')`. |
| 10 | AI-5 | `getActions` returns items → card titles rendered. |
| 11 | AI-6 | Click `advance-btn` → `advanceStatus` called with correct `itemId` + `getActions` re-called. |
| 12 | AI-7 | Card with `status='completed'` → `verify-btn` present, `advance-btn` absent. |
| 13 | AI-8 | Card with `status='verified'` → neither `advance-btn` nor `verify-btn` present. |
| 14 | AI-9 | Click `verify-btn` → `data-testid="verify-impact-modal"` appears in DOM. |
| 15 | AI-10 | Verify modal — submit disabled when `impactNote` empty. |
| 16 | AI-11 | Verify modal — submit disabled when `impactNote.length > 300`. |
| 17 | AI-12 | Valid impact note → submit → `verifyImpact` called → modal closes → `getActions` re-called. |
| 18 | AI-13 | Card with `sourceFeedbackId` non-empty → "Source Feedback" block present; card without → absent. Source quote matched by regex (`/Adopt a No Meeting Thursday policy/`) because `ActionItemCard` wraps quotes in `&ldquo;...&rdquo;` (curly quotes) which break exact string matching. |
| 19 | AI-14 | Click `open-new-action-btn` → `new-action-modal` appears; submit disabled; type title + select owner via combobox → submit enabled; Cancel → modal removed. Owner selection is required alongside title because `submitDisabled = !title.trim() \|\| !ownerId`. |

**Why it EXISTS**: Covers the complete action items page lifecycle end-to-end — auth guard, loading states, status-specific button visibility, modal interactions, and re-fetch after mutations. Integration tests catch failures that card/modal unit tests miss.

**How it CONNECTS**: Renders `ActionItemsPage` from `src/app/actions/page.tsx`. All service and navigation dependencies mocked. `VerifyImpactModal` and `NewActionItemModal` rendered as real components (not mocked) so their internal validation logic is exercised.

**Plain English Analogy**: The **mystery shopper for the task board** — checks that empty states appear when there are no tasks, that only the right buttons show for each status, that the verify form rejects empty notes, and that manually creating a task requires both a title and an owner.

---

*End of CODE_EXPLAINER.md — Sprint 2 + Sprint 3*
