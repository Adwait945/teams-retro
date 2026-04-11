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
