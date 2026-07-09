# Teams Retro

Async retrospective tool for engineering pods. Team members submit feedback
(what slowed us down / what should we try / what went well) on a rolling
basis, upvote it, convert it into action items, track those items to
completion, and earn points/badges on a leaderboard. There is **no Sprint
entity** in the domain model — the app is **always-on and time-window
based**, not sprint-cycle based. Don't introduce sprint-scoped data
structures into `src/` even though `docs/` uses "Sprint N" to label planning
artifacts.

## Tech stack
- Next.js 14 (App Router), React 18, TypeScript 5
- MongoDB Atlas via Mongoose 8 (`src/lib/models/`)
- Tailwind CSS 3 (`tailwindcss-animate`, `class-variance-authority`, `clsx`,
  `tailwind-merge`)
- `recharts` for charts, `lucide-react` for icons, `date-fns` for dates
- Jest 29 + React Testing Library for tests (`src/__tests__/`)
- Package manager: **npm** (not yarn/pnpm — always use `npm run <script>` /
  `npx`)

## npm scripts (from package.json — use these exactly)
| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev` | Start local dev server (localhost:3000) |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Run the production build |
| `npm run lint` | `next lint` | ESLint |
| `npm test` | `jest` | Run the Jest test suite |
| `npx tsc --noEmit` | — | Type-check without emitting (not a package.json script, run directly) |

There is no dedicated `test:watch` or `test:coverage` script; use
`npm test -- --watch` or `npm test -- --coverage` if needed.

## Project structure
- `src/app/` — App Router pages: `dashboard/`, `feedback/`, `action-items/`,
  `leaderboard/`, `digest/`, `pod-settings/`, `sprint-setup/`
- `src/app/api/` — Route handlers: `feedback/`, `actions/`, `users/`
- `src/lib/models/` — Mongoose schemas: `FeedbackItem.ts`, `ActionItem.ts`,
  `User.ts`
- `src/lib/utils/` — shared utility functions
- `src/components/` — shared UI components (`src/components/layout/` for
  shell/layout components)
- `src/types/index.ts` — the single source of truth for domain types
  (`User`, `FeedbackItem`, `ActionItem`, `PointEvent`, `PointAction`,
  `BadgeType`, `Badge`, plus `POINT_VALUES`, `CATEGORY_CONFIG`,
  `BADGE_DEFINITIONS` constants). Never rename or invent fields here from a
  subagent role — extend it deliberately and only in DEV.
- `src/services/`, `src/store/`, `src/data/` — service/state/fixture layers
- `src/__tests__/` — Jest/RTL tests, mirrors `src/` structure

## Data model conventions
- **Always-on, time-window based**: feedback and action items are not scoped
  to a `Sprint` object. "Sprint N" in `docs/` refers only to a *planning*
  iteration for this repo's own delivery process, not an app-level entity.
- `FeedbackItem.category` is one of `"slowed-us-down" | "should-try" |
  "went-well"`; `"slowed-us-down"` requires a `suggestion`.
- `ActionItem.status` progresses `open → in-progress → completed → verified`.
- Points are awarded via `PointAction` events (`POINT_VALUES` in
  `src/types/index.ts`) and roll up into `User.totalPoints` and `Badge`
  unlocks (`BADGES` thresholds).

## File size convention
**No file under `src/` should exceed 200 lines.** If an implementation would
cross that limit, split it into smaller, single-responsibility modules
instead of writing one large file.

## Styling convention
Tailwind utility classes only — no inline `style` attributes, no `<style>`
blocks. `src/app/layout.tsx` sets `className="dark"` on `<html>`;
`tailwind.config.ts` uses `darkMode: ["class"]`. Preserve both if you touch
either file.

## Multi-agent workflow (MAWv6.1)
This repo uses a six-role ATDD pipeline driven by Claude Code subagents and
skills under `.claude/agents/` and `.claude/skills/`:

`PRODUCT → ARCHITECT → TEST → DEV → PROFESSOR → REVIEWER`

| Role | Reads | Writes |
|---|---|---|
| PRODUCT | `docs/SPRINT_N_BACKLOG.md` | `docs/FEATURE_REQUIREMENTS.md` |
| ARCHITECT | `docs/FEATURE_REQUIREMENTS.md` | `docs/ARCHITECTURE_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/adrs/ADR-NNNN-*.md` |
| TEST | `docs/IMPLEMENTATION_PLAN.md` | `docs/TEST_SPEC.md`, failing tests in `src/__tests__/` |
| DEV | `docs/IMPLEMENTATION_PLAN.md`, `docs/TEST_SPEC.md` | code in `src/`, `docs/IMPLEMENTATION_NOTES.md` |
| PROFESSOR | `docs/IMPLEMENTATION_NOTES.md` | `docs/CODE_EXPLAINER.md` |
| REVIEWER | everything above | `docs/AUDIT_REPORT.md`, `docs/TECH_DEBT.md` |

REVIEWER runs a 28-point audit and is the **only** role authorized to approve
a push to `main`. Invoke a stage with its matching skill (`/product`,
`/architect`, `/test`, `/dev`, `/professor`, `/reviewer`) or check overall
progress with `/sprint-status`.

## Environment variables
Never edit `.env` directly — only `.env.example` (names only, no secrets).
A pre-tool-use hook in `.claude/settings.json` blocks direct writes to any
`.env*` file other than `.env.example` via the Edit/Write/MultiEdit/
NotebookEdit tools — if `.env.local` genuinely needs writing (e.g. to set
`MONGODB_URI` locally), use `Bash` with a heredoc instead; the hook only
matches the edit-family tools, not Bash.

## Session Log
`docs/SESSION_LOG.md` holds judgment calls, non-obvious decisions, and open
threads from prior sessions that aren't fully captured in ADRs,
`docs/IMPLEMENTATION_NOTES.md`, or `docs/TECH_DEBT.md` — read it at the start
of a session if it exists. When the user says "update SESSION_LOG before we
clear" (or similar, e.g. before ending a session or running `/clear`),
append a new dated entry summarizing this session's judgment calls: things
decided under ambiguity, bugs found that weren't obvious from the code,
precedents worth repeating, and anything left open. Keep entries terse and
example-grounded — this file is a memory aid for picking up correctly next
time, not a full session transcript (that's what git history and the other
`docs/` files are for).
