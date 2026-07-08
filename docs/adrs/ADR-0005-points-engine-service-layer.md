# ADR-0005: Points/Badges Get a Dedicated `src/lib/pointsEngine.ts`, Not a `src/services/` File

## Context

The codebase has an established `src/services/` convention
(`userService.ts`, `actionService.ts`, `feedbackService.ts`) — but per the
Component Responsibility Matrix in `docs/ARCHITECTURE_DESIGN.md` (Sprint 1),
"**`src/services/`** files are the only callers of `fetch()` against
internal API routes from the client side... Pages do not call `fetch()`
directly," and "**API routes**... are the only callers of `connectDB()` and
Mongoose models. Services and pages never import Mongoose directly." In
other words, `src/services/*` is a **client-side** boundary (browser fetch
wrappers), while `src/lib/*` is the **server-side** Mongoose/DB boundary
(`src/lib/db.ts`, `src/lib/models/`, `src/lib/utils/windowFilter.ts`).

Epic 7.1/7.2 need a piece of logic that: (a) runs exclusively on the server
(inside API route handlers, never in the browser), (b) writes directly to
Mongoose models (`PointEvent`, `User`, and reads `Badge`), and (c) is
explicitly named `src/lib/badgeEngine.ts` by the backlog itself (AC-7.2.4).
This does not fit the existing `src/services/` pattern at all — it fits the
`src/lib/` pattern the codebase already uses for `db.ts` and
`utils/windowFilter.ts`.

## Decision

**Points-engine logic lives in `src/lib/pointsEngine.ts` (new), badge logic
lives in `src/lib/badgeEngine.ts` (new, as literally named by the backlog),
and neither gets a `src/services/pointsService.ts` /
`src/services/badgeService.ts` counterpart in this sprint.** Both are
server-only modules, imported exclusively by `src/app/api/*/route.ts` files
(and by each other — `pointsEngine.ts`'s `recordPointEvent()` calls
`badgeEngine.ts`'s `evaluateBadges()` per ADR-0003's chaining requirement),
matching the existing `db.ts`/`models/`/`utils/` server-side boundary rather
than the client-side `services/` boundary.

The Leaderboard page and Dashboard's Pod MVP section, by contrast, **do**
follow the existing client-side pattern: they call `fetch('/api/points...')`
and `fetch('/api/badges...')` directly (matching how `dashboard/page.tsx`
already calls `fetch()` directly for `/api/feedback`/`/api/actions` rather
than routing through a `services/` wrapper for those specific calls — the
existing codebase is already inconsistent about whether pages call `fetch`
directly or via a service wrapper, e.g. `dashboard/page.tsx` calls `fetch`
directly while `feedback/page.tsx` uses `feedbackService.getFeedbackByWindow`).
Given this precedent and the sprint's tight scope, Leaderboard/Dashboard
call `fetch()` directly for points/badges rather than introducing a new
`services/pointsService.ts` purely for two GET wrappers — this is a
pragmatic, low-ceremony choice consistent with the codebase's actual
(not idealized) conventions, not a new architectural pattern.

`src/lib/pointsEngine.ts` exports:
- `recordPointEvent(input: { userId: string; podId: string; action:
  PointAction; relatedId?: string }): void` — the fire-and-forget,
  fault-isolated helper described in ADR-0004, internally performing the
  `PointEvent.create()`, the `User.totalPoints` `$inc` (ADR-0001), and the
  chained `evaluateBadges()` call (ADR-0003).
- `getPodLeaderboard(podId: string, window: '7d' | '30d' | 'all'):
  Promise<PointsRow[]>` — the shared aggregation used by both `GET
  /api/points` and `badgeEngine.ts`'s Pod Champion check (AC-7.2.10
  explicitly requires reusing "the same aggregation/sum logic as `GET
  /api/points`" — extracting it here is what makes that reuse possible
  without the route handler and the badge engine duplicating aggregation
  code).

`src/lib/badgeEngine.ts` exports only `evaluateBadges(userId: string, podId:
string): Promise<void>` per AC-7.2.4's exact signature, and internally calls
`getPodLeaderboard()` from `pointsEngine.ts` for its Pod Champion check.

## Consequences

- `src/lib/` gains two new files beyond the models: `pointsEngine.ts` and
  `badgeEngine.ts`. Both are capped at 200 lines; if `pointsEngine.ts`'s
  6 badge sub-checks plus `recordPointEvent`/`getPodLeaderboard` exceed
  that, the 5 permanent-badge check functions are split into
  `src/lib/badgeChecks.ts` (pure functions, one per badge type) imported by
  `badgeEngine.ts`'s orchestration — see the Component Inventory in the
  Architecture Design doc for the exact file split.
- No new `src/services/pointsService.ts` file exists after this sprint —
  if a future sprint wants to introduce one (e.g. to support optimistic UI
  updates or client-side caching of points data), that is a new decision
  for that sprint, not implied by this one.
- API routes (`points/route.ts`, `badges/route.ts`) remain the only files
  that translate `pointsEngine.ts`/`badgeEngine.ts` server logic into HTTP
  responses — consistent with the existing "API routes are the only
  callers of Mongoose models" rule, since `pointsEngine.ts`/
  `badgeEngine.ts` are themselves Mongoose-adjacent (they import models
  directly), they sit on the server side of that boundary alongside
  `db.ts`, not the client side alongside `services/`.

## Alternatives Considered

- **`src/services/pointsService.ts` + `src/services/badgeService.ts`,
  Mongoose imported directly from services**: would violate the Sprint 1
  Component Responsibility Matrix's explicit rule that services never
  import Mongoose directly — rejected as an architectural regression.
- **`src/services/pointsService.ts` as a thin client-fetch wrapper (like
  `feedbackService.ts`), with the actual Mongoose logic still in
  `src/lib/pointsEngine.ts`**: viable and arguably more consistent with
  `feedbackService.ts`'s pattern, but adds a file whose only job is
  wrapping two `fetch()` calls the Leaderboard/Dashboard pages could just
  as easily make directly (as Dashboard already does today for
  `/api/feedback`/`/api/actions`). Rejected for this sprint as unnecessary
  ceremony; revisit if a 3rd or 4th consumer of `/api/points`/`/api/badges`
  emerges and the duplication becomes real.
