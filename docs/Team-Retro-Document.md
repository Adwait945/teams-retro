# Teams Retro — Complete Project Reference Document

**Project**: Teams Retro — Async Gamified Retrospective Tool
**Author**: Cascade (compiled from all design sessions)
**Last Updated**: April 2026
**Project Root**: `C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro`

---

## Table of Contents

1. [Project Origin and Problem Statement](#1-project-origin-and-problem-statement)
2. [Target Users and Context](#2-target-users-and-context)
3. [Technology Stack](#3-technology-stack)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Scope Definitions (1, 2, 3)](#5-scope-definitions)
6. [Screens Built — Prototype Inventory](#6-screens-built--prototype-inventory)
7. [Architecture Decision](#7-architecture-decision)
8. [Data Model — All Types](#8-data-model--all-types)
9. [TypeScript Coding Constructs Reference](#9-typescript-coding-constructs-reference)
10. [Service Layer — Function Reference](#10-service-layer--function-reference)
11. [MongoDB Atlas Data Layer](#11-mongodb-atlas-data-layer)
12. [Product Design Decisions Log](#12-product-design-decisions-log)
13. [UI Screen Inventory and Status](#13-ui-screen-inventory-and-status)
14. [Development Workflow (MAWv5)](#14-development-workflow-mawv5)
15. [Terminal Commands Reference](#15-terminal-commands-reference)
16. [Growing Codebase — Bug Prevention and Context Window Strategy](#16-growing-codebase--bug-prevention-and-context-window-strategy)
17. [PROFESSOR Role — Plain English Code Explanations](#17-professor-role--plain-english-code-explanations)
18. [Credit Budget and Session Planning](#18-credit-budget-and-session-planning)
19. [Full Database Layer Reference](#19-full-database-layer-reference)
20. [Product Requirements Document (PRD)](#20-product-requirements-document-prd)

---

## 1. Project Origin and Problem Statement

Teams Retro was conceived to replace live retrospective meetings with an async, gamified tool. The core insight is:

> **Live retro meetings are inefficient.** Teams schedule 30–60 minute meetings where discussion is dominated by the loudest voices, action items are forgotten, and there is no measurable link between feedback submitted and improvements delivered.

### What This Tool Does Differently

- **Async feedback** — team members submit feedback any time during the sprint, not just in a meeting
- **Reframe rule** — "What Slowed Us Down" feedback requires a suggested improvement before submission (enforces constructive framing)
- **Closed feedback loop** — feedback can be converted to a tracked action item with an owner, due date, and a required verified impact statement
- **Gamification** (Scope 3) — points and badges reward participation and drive behavior change

### Success Metrics per Scope

| Scope | Success Metric |
|---|---|
| Scope 1 | Did the team submit feedback without scheduling a meeting? |
| Scope 2 | Did at least one action item get created, completed, and verified with documented impact? |
| Scope 3 | Did gamification increase participation rate vs. Scope 1/2 baseline? |

---

## 2. Target Users and Context

| Attribute | Detail |
|---|---|
| **Org unit** | 3 Agile pods × ~10 members each = ~30 users total |
| **Pod structure** | Pod 1, Pod 2, Pod 3 — each isolated (own feedback, actions, sprint data) |
| **Auth model** | Scope 1–2: Self-registration (name + pod, saved to localStorage). Scope 3: Session invite codes (magic link / 6-digit code per session) |
| **Device** | Desktop browser (corporate laptop) |
| **Network** | Internal — corporate network, OneDrive-synced file system |

### User Roles (Scope 2)

| Role | Who | Permissions |
|---|---|---|
| **Facilitator** | First user to register in a session, or whoever sets up the sprint | Set up sprint, add team members, open/close retro, verify impact |
| **Participant** | All other registered team members | Submit feedback, upvote, create/advance action items |

---

## 3. Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| **Framework** | Next.js | 14 | App Router (`src/app/`) |
| **UI Library** | React | 18 | Functional components + hooks only |
| **Language** | TypeScript | 5.3 | Strict mode; `.ts` for logic, `.tsx` for components |
| **Styling** | Tailwind CSS | 3.4 | Utility classes only — no `<style>` tags, no inline styles |
| **Component Library** | shadcn/ui | latest | Pre-built accessible components (Button, Card, Dialog, Input, etc.) |
| **Icons** | Lucide React | latest | SVG icon components |
| **State Management** | React Context | built-in | `RetroProvider` wraps entire app |
| **Persistence** | MongoDB Atlas | cloud-hosted | Org-whitelisted; replaces localStorage from Sprint 1 |
| **Backend API** | Next.js API Routes | built-in | `src/app/api/` — server-side MongoDB access only |
| **Package Manager** | Yarn 1.22.22 | via `corepack yarn` | `npm` is blocked on this machine — use `corepack yarn` for all commands |
| **Test Runner** | Vitest | latest (added by TEST agent) | `corepack yarn test` |
| **Version Control** | Git | system | Repo in `teams-retro/` — NOT in parent `Teams Retro/` |

### Toolchain Rule — CRITICAL
```
npm install        →  corepack yarn install
npm run dev        →  corepack yarn dev
npm run build      →  corepack yarn build
npm test           →  corepack yarn test
npm run lint       →  corepack yarn lint
npx vitest run     →  corepack yarn vitest run
npx tsc --noEmit   →  corepack yarn tsc --noEmit
npm install -D pkg →  corepack yarn add -D pkg
```

---

## 4. Project Folder Structure

```
Teams Retro/                         ← Parent container folder (OneDrive-synced)
└── teams-retro/                     ← THE project root (git init here)
    ├── .git/                        ← Git repository (hidden, do not touch)
    ├── .gitignore
    ├── .windsurf/                   ← Windsurf agent configuration
    │   ├── cascades/
    │   │   ├── product.rules        ← PRODUCT agent job description
    │   │   ├── architect.rules      ← ARCHITECT agent job description
    │   │   ├── test.rules           ← TEST agent job description
    │   │   ├── dev.rules            ← DEV agent job description
    │   │   └── reviewer.rules       ← REVIEWER agent job description
    │   └── hooks.json               ← Auto-runs corepack yarn install in worktrees
    ├── docs/                        ← All project documentation
    │   ├── Team-Retro-Document.md   ← THIS FILE — complete project reference
    │   ├── RetroProjectScopes.md    ← Detailed scope definitions (Scope 1/2/3)
    │   ├── WORKFLOW_PLAN_v6.md      ← MAWv5 workflow detail
    │   ├── SPRINT_1_BACKLOG.md      ← Human-written requirements (to be written)
    │   ├── FEATURE_REQUIREMENTS.md  ← Written by PRODUCT agent
    │   ├── ARCHITECTURE_DESIGN.md   ← Written by ARCHITECT agent
    │   ├── IMPLEMENTATION_PLAN.md   ← Written by ARCHITECT, checked off by DEV
    │   ├── TEST_SPEC.md             ← Written by TEST agent
    │   ├── IMPLEMENTATION_NOTES.md  ← Written by DEV agent
    │   ├── TEST_REPORT.md           ← Written by TEST agent (post-dev)
    │   ├── AUDIT_REPORT.md          ← Written by REVIEWER agent
    │   ├── ui-mocks/                ← Screenshots of all prototype screens
    │   └── prototypes/              ← Replit .tsx files (read-only reference)
    ├── src/                         ← PRODUCTION CODE ONLY (DEV agent writes here)
    │   ├── app/                     ← Next.js App Router pages
    │   │   ├── layout.tsx           ← Root layout (RetroProvider, Sidebar)
    │   │   ├── globals.css          ← Tailwind base + CSS variables
    │   │   ├── page.tsx             ← Dashboard (/)
    │   │   ├── feedback/page.tsx    ← Feedback Board (/feedback)
    │   │   ├── action-items/page.tsx← Action Items (/action-items)
    │   │   ├── leaderboard/page.tsx ← Leaderboard (Scope 3)
    │   │   └── digest/page.tsx      ← Sprint Digest (Scope 3)
    │   ├── components/              ← Reusable UI components
    │   │   ├── sidebar.tsx
    │   │   ├── feedback-card.tsx
    │   │   ├── feedback-form.tsx
    │   │   └── sprint-selector.tsx
    │   ├── services/                ← Business logic (TO BE CREATED by DEV)
    │   │   ├── feedbackService.ts
    │   │   ├── actionService.ts
    │   │   ├── sprintService.ts
    │   │   └── userService.ts
    │   ├── lib/
    │   │   ├── utils.ts             ← cn() helper (clsx + tailwind-merge)
    │   │   └── storage.ts           ← localStorage adapter (TO BE CREATED)
    │   ├── store/
    │   │   └── retro-store.tsx      ← RetroProvider context
    │   ├── types/
    │   │   └── index.ts             ← All TypeScript type definitions
    │   ├── data/
    │   │   └── mock-data.ts         ← Seed data for development
    │   └── __tests__/               ← Test files (TEST agent writes here)
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    ├── postcss.config.js
    └── next-env.d.ts
```

### Key Rule: What Goes Where

| Item | Location | Who Writes It |
|---|---|---|
| Visual prototypes | `docs/prototypes/` | Human (via Replit) |
| Screenshots | `docs/ui-mocks/` | Human (manual browser screenshot) |
| Requirements docs | `docs/*.md` | Agents + Human |
| Production code | `src/` | DEV agent only |
| Tests | `src/__tests__/` | TEST agent only |

---

## 5. Scope Definitions

### Scope 1 — Ultra-Lean (Week 1–2)
**Goal**: Prove async feedback works without a meeting.

**Pages**: Registration + Feedback Board only

**Key features**:
- Self-registration (name, username, pod)
- 3-column feedback board (Slowed Us Down / Should Try / Went Well)
- Feedback submission form with Reframe Rule
- Anonymous toggle
- Upvoting (1 vote per user per item, cannot upvote own)
- **MongoDB Atlas persistence** (real-time, shared across all users)

---

### Scope 2 — Core Loop ← CURRENT BUILD TARGET (Week 3–4)
**Goal**: Prove feedback turns into tracked, verified improvements.

**Pages**: Everything in Scope 1 + Action Items + Dashboard + Sprint Setup

**Key additions**:
- Convert feedback to Action Item (from Feedback Board)
- Create Action Item directly (from Action Items page)
- Status lifecycle: Open → In Progress → Completed → Verified
- Verify Impact modal (required impact note)
- Dashboard with real calculated stats
- Sprint setup (name, goal, dates, team members, open/close)
- Empty state screens for all pages
- Admin/Facilitator role (first user = admin; `isAdmin: boolean`)
- Anonymous feedback: `isAnonymous` stored but author hidden from display (Option A — author still earns points in Scope 3)

---

### Scope 3 — Full Gamified MVP (Week 5–6)
**Goal**: Prove gamification increases participation.

**Pages**: Everything in Scope 2 + Leaderboard + Sprint Digest

**Key additions**:
- Points system (submit=+10, upvote received=+5, convert=+50, complete=+100, verify=+150)
- Badges (6 types)
- Leaderboard with Sprint MVP
- Sprint Digest summary page
- Sprint selector (view historical sprints)
- Session invite codes (Approach B identity model — facilitator creates session, team joins via 6-digit code)
- MongoDB already in use from Scope 1 — Scope 3 just adds new collections (points, badges)
- Optional: Microsoft SSO

---

## 6. Screens Built — Prototype Inventory

All prototypes were built in Replit. Screenshots are in `docs/ui-mocks/`.

### Original 7 Screens (Phase 0 — v1)

| # | Screen | File | Screenshot | Status |
|---|---|---|---|---|
| 1 | Registration | `Registration.tsx` | `registration.png` | ✅ Done |
| 2 | Dashboard | `Dashboard.tsx` | `Dashboard.png` | ✅ Done |
| 3 | Feedback Board | `FeedbackBoard.tsx` | `FeedbackBoard.png` | ✅ Done |
| 4 | Submit Feedback Modal | *(inside FeedbackBoard.tsx)* | `SubmitFeedback.png` | ✅ Done |
| 5 | Convert to Action Modal | *(inside FeedbackBoard.tsx)* | `ConvertActionItem.png` | ✅ Done |
| 6 | Action Items | `ActionItems.tsx` | `ActionItems.png` | ✅ Done |
| 7 | Verify Impact Modal | *(inside ActionItems.tsx)* | `VerifyImpact.png` | ✅ Done |

### Additional Screens (Phase 0 — v2, in progress)

| # | Screen | File | Screenshot | Status |
|---|---|---|---|---|
| 8 | Dashboard Empty State | *(inside Dashboard.tsx)* | `dashboard-empty.png` | 🔲 Pending Replit build |
| 9 | Feedback Board Empty State | *(inside FeedbackBoard.tsx)* | `feedback-board-empty.png` | 🔲 Pending Replit build |
| 10 | Action Items Empty State | *(inside ActionItems.tsx)* | `action-items-empty.png` | 🔲 Pending Replit build |
| 11 | Sprint Setup Page | `SprintSetup.tsx` | `sprint-setup.png` | 🔲 Pending Replit build |
| 12 | New Action Item Modal | *(inside ActionItems.tsx)* | `new-action-item-modal.png` | 🔲 Pending Replit build |

### Modal Screenshot Protocol
> Hardcode `isOpen=true` → take screenshot in browser → tell Replit Agent to revert to `isOpen=false`. One modal at a time. The agent cannot take screenshots — that is always a manual browser action.

---

## 7. Architecture Decision

### Chosen Pattern: Component-Based Monolith with Service Layer

```
┌─────────────────────────────────────────────────┐
│  PRESENTATION LAYER (React Components)           │
│  app/  → full page components (one per route)   │
│  components/ → reusable UI pieces               │
└───────────────────┬─────────────────────────────┘
                    │ calls
┌───────────────────▼─────────────────────────────┐
│  SERVICE LAYER (Pure TypeScript functions)       │
│  services/feedbackService.ts                    │
│  services/actionService.ts                      │
│  services/sprintService.ts                      │
│  services/userService.ts                        │
│  → All business logic lives here, NOT in pages  │
└───────────────────┬─────────────────────────────┘
                    │ reads/writes
┌───────────────────▼─────────────────────────────┐
│  API LAYER (Next.js API Routes)                 │
│  app/api/users/route.ts                         │
│  app/api/feedback/route.ts                      │
│  app/api/actions/route.ts                       │
│  app/api/sprints/route.ts                       │
└───────────────────┬─────────────────────────────┘
                    │ connects
┌───────────────────▼─────────────────────────────┐
│  DATA LAYER (MongoDB Atlas)                     │
│  lib/db.ts  ← singleton connection              │
│  lib/models/*.ts  ← Mongoose schemas            │
│  Collections: users, feedback, actions, sprints │
└─────────────────────────────────────────────────┘
```

### Why This Pattern

| Concern | How This Architecture Solves It |
|---|---|
| **No bugs as codebase grows** | Business logic in service files — one bug = one file to fix, not 3 pages |
| **Context window limit compliance** | Each file targets 100–150 lines max. No file should exceed 200 lines |
| **Testability** | Service functions are pure — easy to unit test without rendering UI |
| **Real multi-user sharing** | MongoDB Atlas — all 30 users read/write the same data in real time from day 1 |
| **No throwaway code** | Service layer calls API routes from Sprint 1; no localStorage rewrite needed later |
| **Agent isolation** | DEV agent edits one file at a time; no cascading changes across the codebase |

### How This Architecture Solves the Two Core Concerns

#### 1. "Codebase should not introduce bugs as it grows"
The Service Layer is the key. All business logic (calculating completion rate, validating feedback, advancing action status) lives in small, pure functions in `services/`. Pages are dumb — they just call service functions and render the result. This means:

- A bug in "advance status" logic is in one file (`actionService.ts`), not scattered across 3 pages
- Each service function is independently testable
- The DEV agent edits one file at a time — no cascading changes

#### 2. "Context window limits should not collide with component size"
The component-based split enforces a natural size ceiling:

| File Type | Target Size | What It Contains |
|---|---|---|
| **Page file** | ~100–150 lines | Renders layout + calls services |
| **Service file** | ~80–120 lines | Pure functions for one domain |
| **Component file** | ~50–100 lines | One reusable UI piece |

> **Hard rule**: No single file should exceed ~200 lines. If it does, it needs to be split. The ARCHITECT agent enforces this as a non-negotiable constraint before the DEV agent begins any implementation.

### Rejected Patterns and Why

| Pattern | Why Rejected |
|---|---|
| Microservices | One team, one app, no scale problem yet |
| Micro-frontends | Only relevant for multiple independent frontend teams |
| Messaging-based | No async event-driven workflows at this stage |
| Pure N-tier | Too rigid for frontend iteration speed |

---

## 8. Data Model — All Types

All types live in `src/types/index.ts`.

### User
```typescript
type User = {
  id: string            // UUID — generated once at registration, never changes
  name: string          // "Jane Doe" — display name
  username: string      // "jdoe" — unique handle, lowercase, no spaces
  pod: string           // "Pod 1" | "Pod 2" | "Pod 3"
  isAdmin: boolean      // true = facilitator; first user to register gets true
}
```

### FeedbackItem
```typescript
type FeedbackItem = {
  id: string
  content: string                          // the feedback text
  category: "slowed" | "try" | "went-well" // which column it appears in
  authorId: string                         // UUID of submitting user
  isAnonymous: boolean                     // true = display "Anonymous", author hidden
                                           // but authorId still stored (Option A)
  upvotes: number                          // current upvote count
  upvotedBy: string[]                      // array of userIds who upvoted
                                           // (prevents double-voting)
  suggestion?: string                      // required when category = "slowed"
  createdAt: string                        // ISO date string
  sprintId: string                         // which sprint this belongs to
  podId: string                            // pod scoping
}
```

### ActionItem
```typescript
type ActionItem = {
  id: string
  title: string
  description?: string
  status: "open" | "in-progress" | "completed" | "verified"
  ownerId: string                  // userId responsible for completion
  sourceFeedbackId: string | null  // null if created directly on Action Items page
  sourceQuote: string | null       // copied text from feedback at creation time
  dueDate: string | null           // ISO date string
  impactNote: string | null        // required when advancing to "verified"
  createdAt: string
  createdById: string              // userId who created the action item
  sprintId: string
  podId: string
}
```

### Sprint
```typescript
type Sprint = {
  id: string
  name: string               // "Sprint 42"
  goal: string               // what the sprint was trying to achieve
  startDate: string          // ISO date string
  endDate: string            // ISO date string
  status: "open" | "closed"
  teamMemberIds: string[]    // array of userIds in this sprint
  podId: string
}
```

### PointEvent (Scope 3 only)
```typescript
type PointEvent = {
  id: string
  userId: string
  podId: string
  sprintId: string
  action: "submit_feedback" | "receive_upvote" | "convert_action"
        | "complete_action" | "verify_action"
  points: number
  referenceId: string   // ID of feedback or action that triggered this event
  createdAt: string
}
```

### Badge (Scope 3 only)
```typescript
type Badge = {
  id: string
  userId: string
  podId: string
  sprintId: string
  type: "feedback_machine" | "action_taker" | "innovator"
      | "problem_solver" | "consensus_builder" | "sprint_champion"
  earnedAt: string
}
```

### Points Values (Scope 3)
| Action | Points | Awarded To |
|---|---|---|
| Submit feedback | +10 | Submitter |
| Receive upvote on feedback | +5 | Feedback author |
| Convert feedback to action item | +50 | Converter |
| Complete an action item | +100 | Owner |
| Verify action item with impact | +150 | Verifier |

---

## 9. TypeScript Coding Constructs Reference

This section is a plain-English guide to the TypeScript patterns used across this codebase.

### Primitive Types

| TypeScript Type | What It Stores | Example |
|---|---|---|
| `string` | Text of any length | `"Jane Doe"`, `"sprint-42"` |
| `number` | Integer or decimal | `4` (upvotes), `85.5` (completion %) |
| `boolean` | True or false only | `isAnonymous: true`, `isAdmin: false` |
| `string[]` | Array (list) of strings | `upvotedBy: ["uuid1", "uuid2"]` |
| `string \| null` | String OR empty | `impactNote: null` until verified |
| `string?` | Optional string (may be absent) | `description?: string` on ActionItem |

### Union Types — Controlled Value Sets
Union types restrict a field to only a defined set of valid values. TypeScript throws an error if any other value is assigned.

```typescript
// Only these 3 values are valid for category:
category: "slowed" | "try" | "went-well"

// Only these 4 values are valid for status:
status: "open" | "in-progress" | "completed" | "verified"

// Only these 2 values for sprint status:
status: "open" | "closed"
```

### Key Variables by Domain

#### Identity
| Variable | Type | Notes |
|---|---|---|
| `id` | `string` | UUID — `crypto.randomUUID()` |
| `isAnonymous` | `boolean` | Stored always; hidden from display when true |
| `isAdmin` | `boolean` | First registrant in a session |

#### Feedback
| Variable | Type | Notes |
|---|---|---|
| `category` | `"slowed" \| "try" \| "went-well"` | Determines column |
| `upvotes` | `number` | Count only — derived from `upvotedBy.length` |
| `upvotedBy` | `string[]` | Prevents double-voting; cannot contain own `authorId` |
| `suggestion` | `string?` | Required only when `category === "slowed"` (Reframe Rule) |

#### Action Items
| Variable | Type | Notes |
|---|---|---|
| `status` | union string | 4-state lifecycle |
| `sourceFeedbackId` | `string \| null` | null = created directly on Action Items page |
| `sourceQuote` | `string \| null` | Copied at creation time, never recalculated |
| `impactNote` | `string \| null` | null until status = "verified" |

### Derived / Computed Values
These are **never stored** — always calculated on render from raw data:

```typescript
// Completion rate (shown on Dashboard)
const completionRate = Math.round(
  ((completed + verified) / total) * 100
)

// Total upvotes (shown on Dashboard)
const totalUpvotes = feedbackItems.reduce((sum, f) => sum + f.upvotes, 0)

// Filter feedback by category (Feedback Board columns)
const slowedItems = feedbackItems.filter(f => f.category === "slowed")

// Sort by upvotes descending (column ordering)
const sorted = [...feedbackItems].sort((a, b) => b.upvotes - a.upvotes)

// Check if current user already voted
const hasVoted = feedback.upvotedBy.includes(currentUser.id)

// Check if user can upvote (not own feedback, not already voted)
const canUpvote = feedback.authorId !== currentUser.id && !hasVoted
```

### React Hooks Used

| Hook | Purpose | Example |
|---|---|---|
| `useState` | Local component state | `const [isOpen, setIsOpen] = useState(false)` |
| `useContext` | Access global RetroProvider state | `const { feedback } = useRetroStore()` |
| `useEffect` | Side effects (fetch data on mount) | `useEffect(() => { fetchFeedback() }, [])` |
| `useMemo` | Derived computations (prevents recalculation) | `const sorted = useMemo(() => [...items].sort(...), [items])` |

---

## 10. Service Layer — Function Reference

All business logic lives in `src/services/`. Pages call these functions — they contain no logic themselves.

### userService.ts
```typescript
registerUser(name: string, username: string, pod: string): Promise<User>
  // Generates UUID, sets isAdmin=true if no users exist yet
  // POST /api/users → saved to MongoDB users collection
  // Returns the created User

getCurrentUser(): User | null
  // Reads sessionStorage["retro_current_user"] (client-only identity cache)
  // Returns null if not registered yet — triggers redirect to /

getAllUsers(): Promise<User[]>
  // GET /api/users → reads from MongoDB users collection
```

### feedbackService.ts
```typescript
submitFeedback(
  content: string,
  category: "slowed" | "try" | "went-well",
  isAnonymous: boolean,
  suggestion?: string
): FeedbackItem
  // Validates: content min 10 chars, max 500 chars
  // Validates: suggestion required if category === "slowed"
  // POST /api/feedback → saved to MongoDB feedback collection

upvoteFeedback(feedbackId: string, userId: string): FeedbackItem
  // Guards: cannot upvote own feedback
  // Guards: cannot upvote twice (checks upvotedBy array)
  // Increments upvotes, adds userId to upvotedBy
  // PATCH /api/feedback/[id]/upvote

getFeedbackByCategory(
  sprintId: string,
  category: "slowed" | "try" | "went-well"
): FeedbackItem[]
  // Filters by sprintId + category
  // GET /api/feedback?sprintId=&category=
  // Returns sorted by upvotes descending
```

### actionService.ts
```typescript
createActionItem(
  title: string,
  description: string,
  ownerId: string,
  sourceFeedbackId: string | null,
  dueDate: string | null
): ActionItem
  // sourceFeedbackId = null when created directly on Action Items page
  // Copies sourceQuote from feedback text at creation time
  // POST /api/actions → saved to MongoDB actions collection

advanceStatus(actionId: string): ActionItem
  // open → in-progress → completed
  // Does NOT advance to "verified" — that requires verifyImpact()
  // PATCH /api/actions/[id]/advance

verifyImpact(actionId: string, impactNote: string): ActionItem
  // Only valid when status === "completed"
  // Validates: impactNote min 20 chars
  // Sets status = "verified"
  // PATCH /api/actions/[id]/verify
```

### sprintService.ts
```typescript
createSprint(
  name: string,
  goal: string,
  startDate: string,
  endDate: string
): Sprint

addTeamMember(sprintId: string, userId: string): Sprint

setSprintStatus(sprintId: string, status: "open" | "closed"): Sprint

getActiveSprint(): Promise<Sprint | null>
  // GET /api/sprints?status=open
```

---

## 11. MongoDB Atlas Data Layer

> **Strategy change (April 2026)**: MongoDB Atlas replaces localStorage from Sprint 1. Org permission already confirmed. This eliminates the single biggest limitation of the original plan — data is now shared across all 30 users in real time, on any device.

### Connection Architecture

```
React Component
    ↓ fetch()
Next.js API Route  (src/app/api/*/route.ts)   ← server-side only
    ↓ mongoose
MongoDB Atlas  (cloud-hosted, org-whitelisted)
```

> **Security rule**: MongoDB credentials NEVER appear in client-side code. The connection string lives in `.env.local` only, accessed exclusively by Next.js API routes running on the server.

### Collections

| Collection | Maps to Type | Key fields |
|---|---|---|
| `users` | `User` | `_id`, `username`, `pod`, `isAdmin` |
| `sprints` | `Sprint` | `_id`, `name`, `status`, `teamMemberIds[]` |
| `feedback` | `FeedbackItem` | `_id`, `sprintId`, `category`, `upvotedBy[]` |
| `actions` | `ActionItem` | `_id`, `sprintId`, `status`, `sourceFeedbackId` |

### Files to Create (Sprint 1, Session 1)

| File | Purpose | Lines (target) |
|---|---|---|
| `src/lib/db.ts` | Singleton MongoDB connection via Mongoose | ~30 |
| `src/lib/models/User.ts` | Mongoose schema + model for User | ~40 |
| `src/lib/models/Sprint.ts` | Mongoose schema + model for Sprint | ~40 |
| `src/lib/models/FeedbackItem.ts` | Mongoose schema + model for FeedbackItem | ~50 |
| `src/lib/models/ActionItem.ts` | Mongoose schema + model for ActionItem | ~50 |
| `src/app/api/users/route.ts` | GET all users, POST new user | ~50 |
| `src/app/api/sprints/route.ts` | GET active sprint, POST new sprint | ~50 |

### API Route Pattern (consistent across all routes)

```typescript
// src/app/api/feedback/route.ts
export async function GET(req: Request) {
  await connectDB()         // lib/db.ts singleton
  const data = await FeedbackItem.find({ sprintId: ... })
  return Response.json(data)
}

export async function POST(req: Request) {
  await connectDB()
  const body = await req.json()
  const item = await FeedbackItem.create(body)
  return Response.json(item, { status: 201 })
}
```

### Client-Side Identity (sessionStorage only)

The current user's identity (`userId`, `username`, `pod`, `isAdmin`) is stored in `sessionStorage` after registration — this avoids re-fetching on every page load while keeping MongoDB as the source of truth. On refresh, if sessionStorage is empty, the user is redirected to `/` to re-register or identify themselves.

### .env.local Setup (you do this once)

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/teams-retro?retryWrites=true&w=majority
```

> Add `.env.local` to `.gitignore` — never commit this file.

---

## 12. Product Design Decisions Log

Every significant design decision made during the design sessions, with rationale.

### Decision 1: MongoDB Atlas from Sprint 1 (Revised April 2026)
**Original decision**: Use localStorage for Scope 1–2; real database in Scope 3.
**Revised decision**: Use MongoDB Atlas from Sprint 1 across all scopes.
**Rationale for revision**: Org permission for MongoDB was already confirmed, eliminating the infrastructure blocker. Using localStorage first would produce ~200 lines of throwaway code in Sprint 1 that would need to be deleted and rewritten in Scope 3. MongoDB from day 1 means every line of code written survives to production, and the team can actually share real-time data from the first working sprint — which was the entire point of the tool.
**Impact**: Sprint 1 Session 1 now creates `lib/db.ts`, `lib/models/`, and `app/api/` routes instead of `lib/storage.ts`. Session line count stays within the 400–600 quality threshold.

### Decision 2: Anonymous Feedback — Option A
**Decision**: `isAnonymous` is stored as a boolean on every FeedbackItem. When `true`, the author's name is hidden from display and replaced with "Anonymous." However, the `authorId` is still stored internally.
**Rationale**: Preserves psychological safety while still allowing the system to credit points (Scope 3) and enforce the one-upvote-per-user rule. Author earns points; team doesn't know which cards were theirs.
**Implementation note**: The display layer checks `isAnonymous` before rendering author name. The service layer always has the real `authorId`.

### Decision 3: Action Item Entry Points — Two Paths
**Decision**: Action items can be created from two entry points:
1. "Convert to Action" button on a Feedback Board card (pre-fills title and source quote)
2. "+ New Action Item" button on the Action Items page header (blank form)
**Rationale**: The Feedback Board path is the primary (organic) path. The Action Items page path is for facilitator-assigned work decided directly in discussion.

### Decision 4: Status Lifecycle — 4 Stages
**Decision**: `open → in-progress → completed → verified`
**Rationale**:
- `completed` = owner declares the work done
- `verified` = team/facilitator confirms it actually improved something
- These are deliberately separate because "done" ≠ "effective"
- Verification requires a written `impactNote` (min 20 chars)
- Who verifies: any registered user in Scope 2; facilitator only in Scope 3

### Decision 5: Upvoting — Upvote Only, No Downvotes
**Decision**: Upvote-only model. No downvoting.
**Rationale**: Downvoting creates political friction and negativity in a team setting. Upvote-only is the standard for retro tools (EasyRetro, FunRetro, Parabol). Upvotes float important items to the top — sufficient for the use case.
**Constraint**: One vote per user per item. Cannot vote on own feedback.

### Decision 6: Admin Role for Scope 2
**Decision**: First user to register in a session is assigned `isAdmin: true`. All others get `isAdmin: false`.
**Rationale**: Avoids a complex permission UI for MVP. Facilitator naturally opens the app first and sets up the sprint.
**Scope 3 upgrade**: Admin is set via session creation — facilitator creates session, gets admin role, shares invite code.

### Decision 7: Reframe Rule
**Decision**: When `category === "slowed"`, the `suggestion` field becomes required before the feedback can be submitted.
**Rationale**: Forces constructive framing. You cannot complain without proposing an improvement. This is the core behavioral design principle of the tool.
**UX note**: The suggestion field is labeled with a "Reframe Rule" indicator in the form.

### Decision 8: Scope 3 Identity Model (Approach B)
**Decision**: Scope 3 will use session invite codes instead of self-registration.
- Facilitator creates a session → gets a 6-digit code
- Team members navigate to the URL and enter the code
- No passwords, no accounts
**Rationale**: Solves the "how do I send login credentials to 30 people" problem. Industry standard (Parabol, Retrium, EasyRetro all use this model). Scope 2 uses Approach A (self-registration) which is localStorage-friendly.

### Decision 9: Column Sort Order
**Decision**: Cards in each Feedback Board column sort by upvotes descending (highest upvotes at the top).
**Rationale**: Surfaces the most important items automatically. The facilitator can see at a glance what the team considers most impactful.

### Decision 10: "Convert to Action" Visibility Threshold
**Decision**: The "→ Action" button on a feedback card is visible when `upvotes >= 3` OR when the current user `isAdmin === true`.
**Rationale**: Prevents every single feedback item from having a visible action button (clutters the UI). High-upvote items are community-validated as important. Admin can always convert any item.

---

## 13. UI Screen Inventory and Status

### Screens per Scope

| Screen | Scope 1 | Scope 2 | Scope 3 |
|---|:---:|:---:|:---:|
| Registration | ✅ | ✅ | ✅ (replaced by invite code) |
| Feedback Board | ✅ | ✅ | ✅ |
| Submit Feedback Modal | ✅ | ✅ | ✅ |
| Dashboard | ❌ | ✅ | ✅ |
| Convert to Action Modal | ❌ | ✅ | ✅ |
| Action Items | ❌ | ✅ | ✅ |
| Verify Impact Modal | ❌ | ✅ | ✅ |
| New Action Item Modal | ❌ | ✅ | ✅ |
| Sprint Setup | ❌ | ✅ | ✅ |
| Empty States (all pages) | ❌ | ✅ | ✅ |
| Leaderboard | ❌ | ❌ | ✅ |
| Sprint Digest | ❌ | ❌ | ✅ |

### Navigation Structure (Scope 2 Sidebar)

```
RetroBoard
├── Sprint Setup       (settings/calendar icon)
├── Dashboard          (layout dashboard icon)
├── Feedback Board     (message square icon)
└── Action Items       (check square icon)

[User avatar + name + pod at bottom]
```

---

## 16. Growing Codebase — Bug Prevention and Context Window Strategy

This section consolidates the architectural decisions specifically made to keep the codebase healthy as it grows over multiple sprints and agent-driven build cycles.

### The Two Problems Being Solved

| Problem | Root Cause | This Project's Solution |
|---|---|---|
| **Bugs multiply as codebase grows** | Business logic scattered across multiple page components — one change in logic requires edits in 3+ files | Service Layer — all logic in `services/*.ts`, pages only render |
| **Context window collisions** | Large files exceed what an AI agent can read + reason about in one session | File size ceiling — ARCHITECT enforces max ~200 lines per file |

### File Size Targets (Enforced by ARCHITECT Agent)

| File Category | Location | Target | Hard Max |
|---|---|---|---|
| Page components | `src/app/*/page.tsx` | 100–150 lines | 200 lines |
| Service functions | `src/services/*.ts` | 80–120 lines | 200 lines |
| Reusable components | `src/components/*.tsx` | 50–100 lines | 200 lines |
| Type definitions | `src/types/index.ts` | 50–80 lines | 200 lines |
| Storage adapter | `src/lib/storage.ts` | 40–60 lines | 100 lines |

### What Happens When a File Gets Too Large

If a service file grows beyond 200 lines, the ARCHITECT agent must split it:
- `feedbackService.ts` → `feedbackReadService.ts` + `feedbackWriteService.ts`
- `actionService.ts` → `actionStatusService.ts` + `actionCreateService.ts`

If a page component grows too large, extract UI sections into `src/components/`:
- `FeedbackBoard/page.tsx` → delegates to `<FeedbackColumn />`, `<FeedbackCard />`, `<FeedbackForm />`

### Why the DEV Agent Must Follow This

The DEV agent's context window is finite. If a file is 400 lines, the agent must read it multiple times and risks:
- Missing earlier logic when editing later parts
- Introducing subtle bugs through incomplete understanding
- Producing inconsistent variable names across the file

Small files = one agent session = full comprehension = no silent bugs.

### Sprint-Over-Sprint Growth Plan

| Sprint | Files Added | Expected Total Lines of Code |
|---|---|---|
| Sprint 1 | Types, 4 services, 3 pages, 3 components | ~800–1,200 lines |
| Sprint 2 | 2 more services, 2 pages, storage migration | ~1,400–1,800 lines |
| Sprint 3 | Backend API layer, auth, real DB | ~2,500–3,500 lines |

Even at Sprint 3 scale, no individual file should exceed 200 lines. The codebase grows wider (more files), not taller (bigger files).

---

## 17. PROFESSOR Role — Plain English Code Explanations

The PROFESSOR is a dedicated explanation mode added to the MAWv5 workflow. It is not a building agent — it never writes or modifies code. Its sole purpose is to make every line of code understandable to someone with no prior coding experience.

### When to Use It

| Timing | Example Invocation |
|---|---|
| **Before** a build | `[PROFESSOR] Explain what the DEV agent is about to build` |
| **During** a build | `[PROFESSOR] Explain this block in feedbackService.ts` |
| **After** a build | `[PROFESSOR] Walk me through what was just added to ActionItems.tsx` |
| **Any time** | `[PROFESSOR] Explain the FeedbackItem type in types/index.ts` |
| **Any time** | `[PROFESSOR] I just ran corepack yarn dev — explain what happened` |

### How It Explains Code

The PROFESSOR uses the **"Plain English / Descriptive Summary"** style — the same format shown in the example below.

For every logical block of code, it answers three questions in order:
1. **IS** — "This is the..." (what kind of thing is this?)
2. **DOES** — "It..." (what does it do when the app runs?)
3. **MATTERS** — "Without this..." (what breaks if this is missing?)

**Example output style:**

> **Server Setup**: This is the entry point of the application. It initializes Express and defines the port (8001). Think of this like turning the key to start a car — nothing else runs until this executes.
>
> **Middleware**: It uses `app.use(express.json())` to parse incoming JSON data from requests. Think of this as a translator — it converts raw text sent over the internet into a JavaScript object your code can actually use. Without this, every request body would arrive as unreadable gibberish.
>
> **Manager Integration**: It imports and creates an instance of `MongoContactsManager`. This triggers the database connection immediately when the server starts. It's the equivalent of opening a phone line to the database — without it, you could receive calls but have no one to answer them.

### Rules the PROFESSOR Always Follows

- **Never assumes prior knowledge** — every technical term is defined the first time it appears
- **Never modifies code** — read and explain only
- **Traces connections** — if a value starts in `types/index.ts`, gets used in `feedbackService.ts`, and is displayed in `FeedbackBoard/page.tsx`, the PROFESSOR follows that full path
- **Uses analogies** — real-world comparisons (restaurant order tickets, assembly lines, post boxes) to anchor abstract concepts
- **Goes block by block** — imports → type definitions → component body → return statement, one paragraph per logical group

### Where the Role Definition Lives

The full `professor.rules` file is at:
```
.windsurf/cascades/professor.rules
```
This file is auto-loaded when you tag a message `[PROFESSOR]` in any Cascade session in Windsurf.

---

## 14. Development Workflow (MAWv5)

The full workflow is documented in `MAWv5.md` (in `WindSurf Projects/` parent folder). Summary:

```
Phase 0 — Replit (Design Studio)
  Build prototypes → Take screenshots → Write SPRINT_1_BACKLOG.md → git push

Phase 1 — Windsurf Terminal + GitHub
  git init in teams-retro/ → Create GitHub repo → Connect remote → git push

Phase 2 — Windsurf Editor
  Create .windsurf/cascades/ rule files → Create hooks.json → Create docs/ placeholders

Phase 3 — Windsurf (5 Agents in sequence)
  PRODUCT → ARCHITECT → TEST → DEV → REVIEWER
  Each agent reads upstream docs, does its job, writes its output doc

Phase 4 — Windsurf Terminal → GitHub
  git push all agent output

Phase 5 — Replit (Smoke Test)
  git pull → run dev server → click through live preview → approve or send back
```

### Agent Responsibilities

| Agent | Reads | Writes | Constraint |
|---|---|---|---|
| PRODUCT | `SPRINT_1_BACKLOG.md` + screenshots | `FEATURE_REQUIREMENTS.md` | Cannot write code |
| ARCHITECT | `FEATURE_REQUIREMENTS.md` + prototypes | `ARCHITECTURE_DESIGN.md` + `IMPLEMENTATION_PLAN.md` | Cannot write implementation code |
| TEST | `ARCHITECTURE_DESIGN.md` | `TEST_SPEC.md` + `src/__tests__/*.test.tsx` | Tests must FAIL before DEV runs |
| DEV | All upstream docs + prototypes | `src/` code + `IMPLEMENTATION_NOTES.md` | Cannot modify tests; preserve visual layout |
| REVIEWER | Everything | `AUDIT_REPORT.md` | Cannot fix code — report only |

---

## 15. Terminal Commands Reference

All commands run from inside `teams-retro/` unless noted.

### Package Management
```bash
corepack yarn install              # Install all dependencies (first time or after package.json changes)
corepack yarn add <package>        # Add a runtime dependency
corepack yarn add -D <package>     # Add a dev dependency
```

### Development
```bash
corepack yarn dev                  # Start Next.js dev server (localhost:3000)
corepack yarn build                # Production build (checks for errors)
corepack yarn lint                 # Run ESLint
corepack yarn tsc --noEmit         # TypeScript type check (no output files)
```

### Testing
```bash
corepack yarn test                 # Run all tests
corepack yarn vitest run           # Run tests once (no watch mode)
corepack yarn vitest --coverage    # Run tests with coverage report
```

### Git — Daily Use
```bash
git status                         # See what files have changed
git add .                          # Stage all changes
git add <file>                     # Stage a specific file
git commit -m "message"            # Commit staged changes
git push origin main               # Push to GitHub
git pull origin main               # Pull latest from GitHub
git log --oneline -10              # See last 10 commits
```

### Git — Setup (Phase 1, one-time)
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git branch -M main                 # Rename branch to main
git remote add origin https://github.com/YOUR_USERNAME/teams-retro.git
git push -u origin main            # First push (sets upstream)
```

### Git — Worktrees (Phase 3, per agent)
```bash
git worktree add ../retro-product product-branch   # Create worktree for PRODUCT agent
git worktree add ../retro-architect architect-branch
git worktree add ../retro-test test-branch
git worktree add ../retro-dev dev-branch
git worktree add ../retro-reviewer reviewer-branch
git worktree list                  # List all active worktrees
git worktree remove ../retro-product  # Remove a worktree when done
```

### Folder Cleanup (one-time, already done)
```bash
# Remove misplaced .git from parent (PowerShell)
Remove-Item -Path "Teams Retro\.git" -Recurse -Force
Remove-Item -Path "Teams Retro\node_modules" -Recurse -Force
Remove-Item -Path "Teams Retro\yarn.lock" -Force
```

### Verification Commands
```bash
git remote -v                      # Confirm GitHub remote is connected
git log --oneline                  # Confirm commits exist
node --version                     # Should show v24.x
corepack yarn --version            # Should show 1.22.22
```

---

## 18. Credit Budget and Session Planning

### How Credits Work

- **Plan**: 1,000 credits/month
- **Cost per OPUS session**: 6 credits
- **Sessions available per month**: 1,000 ÷ 6 = **~166 sessions**

> The constraint is **not** credits — you have plenty. The real constraint is **context quality per session** (see Section 16).

---

### Full Sprint Delivery Cost

Each sprint runs 5 agents: PRODUCT → ARCHITECT → TEST → DEV (1–2 sessions) → REVIEWER.

| Sprint | PRODUCT | ARCHITECT | TEST | DEV Sessions | REVIEWER | Sprint Total | Credits |
|---|---|---|---|---|---|---|---|
| Sprint 1 — Foundation + MongoDB | 1 | 1 | 1 | 3 | 1 | **7 sessions** | 42 credits |
| Sprint 2 — Feedback Board | 1 | 1 | 1 | 2 | 1 | **6 sessions** | 36 credits |
| Sprint 3 — Action Items | 1 | 1 | 1 | 2 | 1 | **6 sessions** | 36 credits |
| Sprint 4 — Sprint Setup | 1 | 1 | 1 | 1 | 1 | **5 sessions** | 30 credits |
| Sprint 5 — Polish + Smoke Test | 1 | 1 | 1 | 1 | 1 | **5 sessions** | 30 credits |
| **Total** | 5 | 5 | 5 | **9** | 5 | **29 sessions** | **174 credits** |

> Sprint 1 has 3 DEV sessions instead of 2 because the MongoDB data layer (db connection, Mongoose models, API routes) is new work that didn't exist in the localStorage plan. Still well within budget.

**174 credits = ~17% of one month's budget** to deliver the full Scope 2 MVP.

Remaining budget: ~832 credits (~138 sessions) available for:
- Re-runs when a session produces poor output
- `[PROFESSOR]` explanation sessions
- Bug fix sessions after REVIEWER flags issues
- Scope 3 planning and future sprints

---

### Data → Engineering Flow (Corrected)

Replit **never pushes** to the real codebase. The flow is strictly one-directional:

```
Replit (Design Studio)
    ↓  manual download of 6 .tsx files
docs/prototypes/ in teams-retro/ (Windsurf local)
    ↓  Windsurf builds the real app (28 agent sessions across 5 sprints)
GitHub (pushed from Windsurf after each sprint)
    ↓  pull into Replit ONLY for Sprint 5 smoke test
Replit (Smoke Test only)
```

| Stage | Who acts | What happens |
|---|---|---|
| Phase 0 | You (in Replit) | Build prototypes, take screenshots, download 6 `.tsx` files |
| Phase 1–2 | You (in Windsurf terminal) | Create GitHub repo, push scaffold, install deps |
| Phase 3 | Cascade (5 agents per sprint) | Build real production app in worktrees |
| After each sprint | You | Review AUDIT_REPORT.md, merge, push to GitHub |
| Sprint 5 end | You (in Replit) | Pull from GitHub, smoke test, confirm app works |

---

## 19. Full Database Layer Reference

This section is the authoritative specification for everything that lives in MongoDB Atlas. DEV agents read this section — it is the single source of truth for schema design, API contracts, indexing strategy, and data integrity rules.

---

### 19.1 Connection Singleton — `src/lib/db.ts`

**Purpose**: Mongoose maintains a persistent connection pool. In a Next.js serverless environment, each API route invocation can create a new connection unless you cache the promise. `db.ts` prevents connection storms.

**Pattern**:
```typescript
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in .env.local')
}

let cached = (global as any).mongoose ?? { conn: null, promise: null }

export async function connectDB() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: 'teams-retro',
      bufferCommands: false,
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}
```

**Rules**:
- Every API route calls `await connectDB()` as its first line
- `MONGODB_URI` comes from `process.env` only — never hardcoded
- `dbName: 'teams-retro'` is set here once — not repeated in the URI or models
- If `MONGODB_URI` is missing at startup, the error surfaces immediately (fail fast)

---

### 19.2 Mongoose Schemas — Field-by-Field Reference

#### Collection: `users` — `src/lib/models/User.ts`

| Field | Type | Required | Default | Validation | Notes |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | auto | auto | — | MongoDB auto-generated |
| `id` | `String` | yes | `uuidv4()` | UUID format | Client-facing stable ID; used in all cross-references |
| `name` | `String` | yes | — | min 2, max 60 chars | Display name (e.g. "Adwait Kulkarni") |
| `username` | `String` | yes | — | min 3, max 30, lowercase, alphanumeric + underscore | Login identity; unique across the DB |
| `pod` | `String` | yes | — | enum: `"Pod 1"`, `"Pod 2"`, `"Pod 3"` | Pod membership; determines data scope |
| `isAdmin` | `Boolean` | yes | `false` | — | `true` only for the first user to register |
| `createdAt` | `Date` | yes | `Date.now` | — | Timestamp of registration |

**Unique index**: `username` (enforced at Mongoose schema level + Atlas index)

**Business rule enforced at API layer**: `isAdmin: true` is set when `POST /api/users` is called and `users` collection is empty. All subsequent POSTs receive `isAdmin: false`.

---

#### Collection: `sprints` — `src/lib/models/Sprint.ts`

| Field | Type | Required | Default | Validation | Notes |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | auto | auto | — | MongoDB auto-generated |
| `id` | `String` | yes | `uuidv4()` | UUID format | Client-facing stable ID |
| `name` | `String` | yes | — | min 3, max 80 chars | e.g. "Sprint 14 — Q2 Planning" |
| `goal` | `String` | yes | — | min 10, max 300 chars | Sprint goal statement |
| `startDate` | `String` | yes | — | ISO date string `YYYY-MM-DD` | Stored as string to avoid timezone issues |
| `endDate` | `String` | yes | — | ISO date string `YYYY-MM-DD`; must be ≥ startDate | — |
| `status` | `String` | yes | `"open"` | enum: `"open"`, `"closed"` | `"closed"` disables feedback submission |
| `teamMemberIds` | `[String]` | yes | `[]` | Array of valid `user.id` values | Members who participate in this sprint |
| `createdBy` | `String` | yes | — | Valid `user.id` | Must be an admin user |
| `createdAt` | `Date` | yes | `Date.now` | — | — |

**Index**: `status` (queried frequently via `GET /api/sprints?status=open`)

**Business rule**: Only one sprint can have `status: "open"` at a time. Enforced at API layer — opening a sprint closes all others via `updateMany`.

---

#### Collection: `feedback` — `src/lib/models/FeedbackItem.ts`

| Field | Type | Required | Default | Validation | Notes |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | auto | auto | — | MongoDB auto-generated |
| `id` | `String` | yes | `uuidv4()` | UUID format | Client-facing stable ID |
| `sprintId` | `String` | yes | — | Valid `sprint.id` | Links feedback to a sprint |
| `authorId` | `String` | yes | — | Valid `user.id` | Always stored; hidden from display if `isAnonymous: true` |
| `content` | `String` | yes | — | min 10, max 500 chars | The feedback text |
| `category` | `String` | yes | — | enum: `"went-well"`, `"slowed"`, `"try"` | Maps to the three lanes |
| `isAnonymous` | `Boolean` | yes | `false` | — | If `true`, display layer shows "Anonymous" instead of author name |
| `suggestion` | `String` | conditional | `null` | min 10, max 300 chars | **Required** when `category === "slowed"` (Reframe Rule); `null` otherwise |
| `upvotes` | `Number` | yes | `0` | min 0 | Denormalized count; incremented atomically |
| `upvotedBy` | `[String]` | yes | `[]` | Array of `user.id` values | Used to enforce one-vote-per-user and no-self-vote rules |
| `createdAt` | `Date` | yes | `Date.now` | — | — |

**Compound index**: `{ sprintId: 1, category: 1 }` — the most common query pattern

**Business rules enforced at API layer**:
- `suggestion` is required when `category === "slowed"` — validated before insert
- Upvote guard: `PATCH /api/feedback/[id]/upvote` checks `upvotedBy` array and `authorId` before incrementing
- Uses MongoDB `$inc` and `$push` atomically to prevent race conditions on upvote

---

#### Collection: `actions` — `src/lib/models/ActionItem.ts`

| Field | Type | Required | Default | Validation | Notes |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | auto | auto | — | MongoDB auto-generated |
| `id` | `String` | yes | `uuidv4()` | UUID format | Client-facing stable ID |
| `sprintId` | `String` | yes | — | Valid `sprint.id` | Links action to a sprint |
| `title` | `String` | yes | — | min 5, max 120 chars | Action item title |
| `description` | `String` | no | `""` | max 500 chars | Optional extended description |
| `ownerId` | `String` | yes | — | Valid `user.id` | Person responsible for completing this action |
| `status` | `String` | yes | `"open"` | enum: `"open"`, `"in-progress"`, `"completed"`, `"verified"` | Lifecycle state |
| `sourceFeedbackId` | `String` | no | `null` | Valid `feedback.id` or `null` | `null` when created directly; set when converted from feedback card |
| `sourceQuote` | `String` | no | `null` | max 500 chars | Snapshot of feedback content at conversion time; immutable after creation |
| `dueDate` | `String` | no | `null` | ISO date string or `null` | Optional target completion date |
| `impactNote` | `String` | conditional | `null` | min 20, max 500 chars | **Required** when advancing to `"verified"` |
| `createdAt` | `Date` | yes | `Date.now` | — | — |
| `updatedAt` | `Date` | yes | `Date.now` | — | Updated on every status change |

**Index**: `{ sprintId: 1, status: 1 }` — used for filtering by sprint and grouping by status

**Status transition rules** (enforced at API layer — no skipping):
```
open → in-progress   (PATCH /api/actions/[id]/advance)
in-progress → completed  (PATCH /api/actions/[id]/advance)
completed → verified     (PATCH /api/actions/[id]/verify  — requires impactNote ≥ 20 chars)
```
Any other transition (e.g. `open → verified`) returns HTTP 400.

---

### 19.3 Complete API Route Inventory

Every route follows this contract: `await connectDB()` first, try/catch around all DB operations, structured error response `{ error: string }` with correct HTTP status on failure.

#### `/api/users`

| Method | Path | Request Body | Response | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/users` | — | `User[]` | 200, 500 |
| `POST` | `/api/users` | `{ name, username, pod }` | `User` | 201, 400 (validation), 409 (duplicate username), 500 |

#### `/api/sprints`

| Method | Path | Request Body | Response | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/sprints` | query: `?status=open` | `Sprint \| null` | 200, 500 |
| `POST` | `/api/sprints` | `{ name, goal, startDate, endDate, createdBy }` | `Sprint` | 201, 400, 403 (non-admin), 500 |

#### `/api/sprints/[id]`

| Method | Path | Request Body | Response | Status Codes |
|---|---|---|---|---|
| `PATCH` | `/api/sprints/[id]` | `{ name?, goal?, startDate?, endDate?, teamMemberIds? }` | `Sprint` | 200, 400, 403, 404, 500 |

#### `/api/sprints/[id]/status`

| Method | Path | Request Body | Response | Status Codes |
|---|---|---|---|---|
| `PATCH` | `/api/sprints/[id]/status` | `{ status: "open" \| "closed" }` | `Sprint` | 200, 400, 403, 404, 500 |

#### `/api/feedback`

| Method | Path | Request Body | Response | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/feedback` | query: `?sprintId=&category=` | `FeedbackItem[]` sorted by `upvotes desc` | 200, 400 (missing sprintId), 500 |
| `POST` | `/api/feedback` | `{ sprintId, authorId, content, category, isAnonymous, suggestion? }` | `FeedbackItem` | 201, 400 (Reframe Rule violation), 500 |

#### `/api/feedback/[id]/upvote`

| Method | Path | Request Body | Response | Status Codes |
|---|---|---|---|---|
| `PATCH` | `/api/feedback/[id]/upvote` | `{ userId }` | `FeedbackItem` | 200, 400 (self-vote), 409 (already voted), 404, 500 |

#### `/api/actions`

| Method | Path | Request Body | Response | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/actions` | query: `?sprintId=` | `ActionItem[]` sorted by status order | 200, 400, 500 |
| `POST` | `/api/actions` | `{ sprintId, title, description?, ownerId, sourceFeedbackId?, sourceQuote?, dueDate? }` | `ActionItem` | 201, 400, 500 |

#### `/api/actions/[id]/advance`

| Method | Path | Request Body | Response | Status Codes |
|---|---|---|---|---|
| `PATCH` | `/api/actions/[id]/advance` | — | `ActionItem` | 200, 400 (invalid transition), 404, 500 |

#### `/api/actions/[id]/verify`

| Method | Path | Request Body | Response | Status Codes |
|---|---|---|---|---|
| `PATCH` | `/api/actions/[id]/verify` | `{ impactNote }` | `ActionItem` | 200, 400 (impactNote too short or wrong status), 404, 500 |

---

### 19.4 Index Strategy

| Collection | Index | Type | Reason |
|---|---|---|---|
| `users` | `username` | Unique | Duplicate username prevention; login lookup |
| `sprints` | `status` | Single field | `GET /api/sprints?status=open` runs on every page load |
| `feedback` | `{ sprintId, category }` | Compound | Primary read pattern for Feedback Board lanes |
| `feedback` | `upvotes` | Single field | Sort by upvotes descending |
| `actions` | `{ sprintId, status }` | Compound | Primary read pattern for Action Items list |

All indexes are defined in Mongoose schema options (`{ index: true }` or explicit `schema.index({...})`). Atlas auto-creates them on first app run.

---

### 19.5 Data Integrity Rules (Cross-Collection)

These rules cannot be enforced by MongoDB itself (no foreign keys) — they are enforced at the **API route layer only**. Service functions must go through API routes and never bypass them.

| Rule | Where enforced | How |
|---|---|---|
| `sprintId` on feedback must reference an existing sprint | `POST /api/feedback` | Lookup sprint before insert; 400 if not found |
| `sprintId` on actions must reference an existing sprint | `POST /api/actions` | Lookup sprint before insert; 400 if not found |
| `ownerId` on actions must reference an existing user | `POST /api/actions` | Lookup user before insert; 400 if not found |
| `authorId` on feedback must reference an existing user | `POST /api/feedback` | Lookup user before insert; 400 if not found |
| `sourceFeedbackId` on actions must reference existing feedback | `POST /api/actions` | Lookup feedback if not null; 400 if not found |
| Only one sprint can be `status: "open"` at a time | `PATCH /api/sprints/[id]/status` | `updateMany({ status: "open" }, { status: "closed" })` before opening new one |
| Admin-only actions (create sprint, open/close retro) | Sprint routes | Verify `createdBy` user has `isAdmin: true` |

---

### 19.6 Naming Conventions

| Convention | Rule | Example |
|---|---|---|
| Collection names | Lowercase plural | `users`, `sprints`, `feedback`, `actions` |
| Field names | `camelCase` | `sprintId`, `isAnonymous`, `upvotedBy` |
| Client-facing ID | `id` (string UUID) | Used in all service calls and React state |
| MongoDB internal ID | `_id` (ObjectId) | Excluded from API responses via `toJSON` transform |
| API response shape | Raw document converted via `.toObject()` with `{ versionKey: false }` | No `__v` field in responses |
| Date fields | ISO string (`YYYY-MM-DD`) for user-facing dates; `Date` for timestamps | `startDate: "2026-04-01"`, `createdAt: Date` |

**`_id` vs `id` transform** — add this to every Mongoose schema:
```typescript
schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; return ret }
})
```
This ensures API responses return `id` (the UUID string) and never expose MongoDB's internal `_id` or `__v` to the client.

---

### 19.7 Scope 3 Database Extensions (future — do not build yet)

When Scope 3 gamification is implemented, two new collections are added. No existing collections change.

| New Collection | Purpose | Key Fields |
|---|---|---|
| `points` | Track point events per user | `userId`, `eventType`, `points`, `sprintId`, `createdAt` |
| `badges` | Track badge awards per user | `userId`, `badgeId`, `awardedAt`, `sprintId` |

The `users` collection gains two read-only derived fields computed at query time (not stored):
- `totalPoints` — sum of all `points` documents for this user
- `badges[]` — array of badge IDs from the `badges` collection

No migration of existing data is required. MongoDB's schemaless nature means existing user documents simply don't have these fields until Scope 3 writes them.

---

## 20. Product Requirements Document (PRD)

**Document status**: Living document — updated after each sprint delivery.
**Audience**: Product Owner, Tech Lead, future contributors, any stakeholder evaluating the tool for wider rollout.

---

### 20.1 Executive Summary

Teams Retro is an internal web application that replaces synchronous sprint retrospective meetings with an async, gamified workflow. Built for Agile pods at 7-Eleven, it gives every team member a private, permanent channel to submit structured feedback during — not after — the sprint. The tool enforces constructive framing, closes the feedback-to-action loop with documented impact statements, and provides a facilitator with a real-time view of team health metrics. The Scope 2 MVP is fully functional for 30 users across 3 pods, persists all data in MongoDB Atlas, and requires zero per-user licensing cost.

---

### 20.2 User Personas

#### Persona 1 — The Facilitator ("Alex")

| Attribute | Detail |
|---|---|
| **Role** | Scrum Master / Team Lead |
| **Pod size** | ~10 direct team members |
| **Current pain** | Spends 45–60 min per sprint running live retro meetings; 2–3 people dominate; action items go into a Confluence page that nobody checks |
| **Goal** | Run a retro that produces concrete, tracked outcomes without scheduling a meeting |
| **Success looks like** | Every team member submitted at least one feedback item; at least one action was completed and verified with a written impact statement before the next sprint |
| **Frustration with existing tools** | Retrium and EasyRetro are blocked by IT; Confluence is write-only (no accountability); whiteboard retros leave no record |
| **What makes Alex trust this tool** | Can see who has and hasn't submitted feedback; can close the retro to lock submissions; can verify impact himself or delegate it |

---

#### Persona 2 — The Participant ("Jordan")

| Attribute | Detail |
|---|---|
| **Role** | Software Engineer / Individual Contributor |
| **Current pain** | Forgets what went wrong by the time the retro meeting happens; feels awkward voicing criticism in front of peers live |
| **Goal** | Submit feedback privately, any time during the sprint, without having to attend another meeting |
| **Success looks like** | Submitted feedback, saw it upvoted by teammates, watched it turn into an action item that actually got resolved |
| **Motivation** | Scope 3 — points and badges reward consistent participation; leaderboard creates healthy competition |
| **What breaks Jordan's trust** | Feedback disappears on refresh; can't tell if their upvote registered; no visible connection between feedback and action items |

---

#### Persona 3 — The Skeptic ("Morgan")

| Attribute | Detail |
|---|---|
| **Role** | Senior Engineer; 8+ years; has seen retro tools come and go |
| **Current attitude** | "Retros are a waste of time. We write things on sticky notes and nothing changes." |
| **Conversion path** | Scope 2: sees that an action item they created actually got to "Verified" with a real impact statement. Scope 3: earns a "First Verified Impact" badge — acknowledged publicly on the leaderboard. |
| **What the tool must NOT do** | Force participation. Morgan must be able to ignore it entirely and not be penalized. Organic engagement only. |
| **Conversion success metric** | Morgan submits at least 1 feedback item in Sprint 3 (without being asked) |

---

### 20.3 Market Research & Business Problem

#### The Cost of Ineffective Retros — Time Math

| Variable | Value |
|---|---|
| Team size | 30 users across 3 pods |
| Retro frequency | Every 2-week sprint = 26 per year |
| Average meeting length | 45 minutes |
| Preparation + context-switching overhead | +15 minutes per person |
| **Total person-hours per year** | 30 × 1 hr × 26 = **780 person-hours** |
| Burdened hourly rate (approximate) | $80/hr |
| **Annual cost of meeting-based retros** | **~$62,400/year** |

This is the cost of the problem Teams Retro solves — and this is only 3 pods. At org scale (hundreds of pods), the number becomes significant.

> **The tool doesn't need to eliminate all retro time to deliver ROI. It needs to reduce ineffective meeting time by 50% and increase action item completion rate by any measurable amount.**

---

#### Competitive Landscape

| Tool | Strengths | Why it doesn't fit |
|---|---|---|
| **Retrium** | Purpose-built retro tool, good UX | SaaS subscription, data leaves the org, IT approval required |
| **EasyRetro / FunRetro** | Simple, fast, free tier | No action item tracking, no closed-loop verification, blocked by IT proxy on some machines |
| **Parabol** | Open source, full-featured | Requires self-hosting with Docker/PostgreSQL — too much ops overhead for a pod-level tool |
| **Confluence** | Already installed, zero approval needed | Write-only; no upvoting, no action tracking, no gamification, no accountability |
| **Microsoft Teams + Forms** | Zero approval, familiar | No structured three-lane format; no feedback-to-action link; no gamification |
| **Custom Teams Retro** | Org-tailored, zero license cost, runs on approved stack | This is what we're building |

#### Why Custom Wins
1. **Zero licensing cost** — MongoDB Atlas M0 free tier handles 30 users indefinitely
2. **Data sovereignty** — all data stays in org-controlled MongoDB Atlas instance
3. **Stack approval** — MongoDB, React, Next.js are already on the org-approved technology list
4. **Tailored categories** — the three lanes (Went Well / Slowed Us Down / Should Try) map directly to how this org's pods talk about work
5. **Gamification** — no SaaS tool offers point/badge gamification integrated with action item completion
6. **ServiceNow integration readiness** — Scope 3 can push verified action items directly into ServiceNow as tickets via REST API, closing the loop from retro to work management

---

### 20.4 Technology Stack — The "Why" Narrative

#### Why Next.js over plain React (Create React App / Vite)

Next.js was chosen because MongoDB Atlas requires a server-side API layer — you cannot expose database credentials in a browser. Next.js API Routes (`src/app/api/`) run on the server, keeping `MONGODB_URI` in `.env.local` and never in the browser bundle. This is the single deciding factor. A plain React app would require a separate Express/Node server, doubling the deployment complexity for zero benefit at this scale.

**Additional benefits**: Built-in routing (`src/app/`), TypeScript support out of the box, `corepack yarn dev` starts both frontend and API in one command.

#### Why MongoDB Atlas over localStorage

| Factor | localStorage | MongoDB Atlas |
|---|---|---|
| Data sharing | Single device only | All 30 users, any device, real time |
| Persistence | Cleared by browser | Permanent until explicitly deleted |
| Throwaway code | ~200 lines rewritten at Scope 3 | Zero rewrite — same code runs in production |
| Cost | Free | Free (M0 tier, 512MB storage, sufficient for years of retro data) |
| Org approval | Not needed | Already approved (org whitelisted) |
| Setup time | Instant | ~10 minutes (Atlas cluster + .env.local) |

The decision to use MongoDB from Sprint 1 was made after confirming org permissions. The 10-minute setup cost is paid once; the benefit is permanent.

#### Why MongoDB Atlas over PostgreSQL / SQLite

| Factor | SQLite | PostgreSQL | MongoDB Atlas |
|---|---|---|---|
| Hosting | File on disk | Self-hosted or paid cloud | Atlas free tier |
| Schema changes | Migration files required | Migration files required | Add field to schema → done |
| Data shape | Relational tables | Relational tables | Documents (matches TypeScript objects 1:1) |
| Scope 3 extensions | New table + migration | New table + migration | New collection; existing docs unaffected |
| Org approval | Not on approved list | Approved but requires server provisioning | Cloud-hosted, already approved |

MongoDB's document model maps directly to the TypeScript types already designed. `FeedbackItem` in TypeScript = one document in the `feedback` collection. No ORM impedance mismatch, no JOIN queries.

#### Why Tailwind CSS + shadcn/ui over custom CSS

- **Tailwind**: utility classes enforce consistency without a design system. Every component uses the same spacing scale, color palette, and responsive breakpoints automatically.
- **shadcn/ui**: pre-built accessible components (Dialog, Button, Card, Input) that match the prototypes already built in Replit. The DEV agent doesn't need to build modal focus traps from scratch — shadcn handles ARIA, keyboard navigation, and accessibility out of the box.
- **No custom `<style>` tags**: the global CSS rule prevents style drift as the codebase grows across 5 sprints and multiple agent sessions.

#### Why Mongoose over the raw MongoDB Node.js driver

Mongoose adds schema validation, type safety, and the `toJSON` transform pattern. Without Mongoose, every API route would need manual validation code. With Mongoose, the schema IS the validation — required fields, enums, min/max lengths are all enforced at the model level before any document hits the database. The schemas also serve as living documentation (§19.2 of this document is generated directly from them).

#### Why Vitest over Jest

Vitest uses the same config file as Vite/Next.js (no separate `jest.config.ts`), runs faster because it skips Babel transformation, and supports `import.meta` natively. The test syntax is identical to Jest — the TEST agent writes tests that look exactly like Jest tests but run in the Vitest runtime. No migration cost if the team is familiar with Jest.

---

### 20.5 Telemetry Strategy

#### What to Measure

The goal is to know whether the tool is achieving its purpose — without tracking PII or requiring external analytics tools.

| Metric | Definition | Why it matters |
|---|---|---|
| **Participation rate** | `(users who submitted ≥ 1 feedback item) / total team members` per sprint | Primary health metric — are people actually using it? |
| **Feedback-to-action conversion rate** | `(feedback items converted to actions) / total feedback items` per sprint | Are the most important issues getting tracked? |
| **Action completion rate** | `(completed + verified actions) / total actions created` per sprint | Are things actually getting done? |
| **Time-to-verify** | Days from action creation to `status: "verified"` | How fast is the feedback loop closing? |
| **Reframe Rule compliance** | % of "Slowed Us Down" submissions that include a suggestion | Is the constructive framing rule working? |
| **Upvote distribution** | % of feedback items with ≥ 1 upvote | Are people reading and engaging with others' feedback? |

#### How to Measure It

All telemetry is internal — no third-party analytics (no Google Analytics, no Mixpanel). Events are written to a `events` collection in MongoDB Atlas by the API layer.

**Event schema** (Scope 3 implementation):
```typescript
{
  eventType: "feedback_submitted" | "feedback_upvoted" | "action_created"
           | "action_advanced" | "action_verified" | "sprint_opened" | "sprint_closed",
  userId: string,       // who triggered the event
  sprintId: string,     // which sprint
  entityId: string,     // feedbackId or actionId, if applicable
  timestamp: Date
}
```

**Privacy rules**:
- No PII stored in event payloads — `userId` only (not name, not username)
- Events are aggregated for display — individual user activity is never surfaced to other participants
- Facilitator dashboard shows aggregate stats only (participation rate, completion rate) — not per-person breakdowns

#### Facilitator Dashboard (Scope 2 — already built)
The Dashboard page already shows:
- Total Feedback count
- Open / Completed / Completion Rate stats

These are computed live from MongoDB queries — no event store needed for Scope 2.

---

### 20.6 Monetization Strategy

> **Current status**: Internal tool, zero monetization. This section documents intent if the tool is ever open-sourced or productized.

#### Why Document This Now
Even as an internal tool, defining the monetization model clarifies what features belong in the core product vs. what would be enterprise add-ons. It prevents scope creep during Scope 2/3 development.

#### Potential Model (if productized externally)

| Tier | Price | Limits | Features |
|---|---|---|---|
| **Free** | $0/month | ≤ 3 pods, ≤ 30 users | All Scope 2 features; MongoDB Atlas M0 |
| **Team** | $29/month per pod | Unlimited users per pod | All Scope 2 + 3 features; Atlas M10 for performance |
| **Enterprise** | Custom | Unlimited pods | SSO/SAML, audit logs, ServiceNow integration, dedicated Atlas cluster, SLA |

#### Why This Doesn't Apply Today
The tool runs on 7-Eleven's org-approved MongoDB Atlas instance. There is no hosting cost, no licensing cost, and no external user base. The value is internal productivity, not revenue.

#### Open-Source Strategy (12-month horizon)
After 6 months of internal validation across all 3 pods, publish the repo on GitHub under MIT license. Target audience: Agile teams at mid-size companies who want a self-hosted, customizable retro tool without SaaS pricing. The competitive advantage is the closed-loop feedback-to-action model + gamification, which no free open-source retro tool currently offers.

---

### 20.7 Go-To-Market (GTM) Strategy

#### Internal GTM — Phased Rollout

The tool is not launched to all 30 users on day one. The rollout is gated by sprint delivery and validated by real usage before expanding.

| Phase | Timing | Users | Success Gate |
|---|---|---|---|
| **Phase 1 — Single Pod Pilot** | After Sprint 2 | Pod 1 only (~10 users) | ≥ 70% participation rate in first sprint using the tool |
| **Phase 2 — Two Pod Expansion** | After Sprint 3 | Pods 1 + 2 (~20 users) | Pod 1 participation maintained; at least 1 action verified in Pod 1 |
| **Phase 3 — Full Rollout** | After Sprint 4 | All 3 pods (~30 users) | Both pods show ≥ 60% participation; facilitators comfortable with admin controls |
| **Phase 4 — Gamification** | Scope 3 | All pods | Baseline participation data from Phase 1–3 to measure gamification uplift |

#### Communication Plan

| Audience | Message | Channel | Timing |
|---|---|---|---|
| Pod 1 facilitator | "We're piloting a new async retro tool — no more retro meetings" | Direct conversation | 1 week before Phase 1 |
| Pod 1 team members | "You'll get a link + 2-minute setup — just register and submit one piece of feedback" | Teams message | Day of Phase 1 launch |
| All pods | "Pod 1 has been using it for 2 sprints — here's what they said" | Team all-hands or Teams channel | Before Phase 3 |

#### Onboarding Design

The tool is intentionally zero-friction for first-time users:
1. Open the link
2. Enter name, username, pod → registered in 30 seconds
3. Land on Dashboard → one clear CTA: "Go to Feedback Board"
4. Submit one feedback item → done

There is no tutorial, no onboarding flow, no email verification. The Reframe Rule (suggestion required for "Slowed Us Down") is the only point of friction — and it's intentional, because it forces constructive framing before the user can proceed.

#### Success Metrics for GTM

| Metric | Target | Measurement |
|---|---|---|
| Time to first feedback submission | < 3 minutes from first load | Manual observation during Phase 1 launch |
| Participation rate (Phase 1, Sprint 1) | ≥ 70% | MongoDB query: `users who submitted / total pod users` |
| Facilitator satisfaction | "Would use again" = 5/5 | Informal conversation after Sprint 1 |
| Action completion rate (Phase 1) | ≥ 1 verified action per sprint | Dashboard metric |
| Expansion trigger | Phase 2 starts | When Phase 1 success gates pass |
