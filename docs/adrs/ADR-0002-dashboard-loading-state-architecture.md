# ADR-0002: Dashboard Loading-State Architecture for Epic 7.4

## Context

The current `src/app/dashboard/page.tsx` (lines 58, 62-90, 116-124) uses a
single top-level `isLoading` boolean that gates the *entire* page behind one
"Loading…" screen until three parallel fetches (`/api/feedback`,
`/api/actions`, `/api/users`) all resolve. Epic 7.4 (Dashboard Enhancement)
adds four new sections — Pod MVP, Category Breakdown, Top Voted Feedback,
Verified Improvements — three of which reuse already-fetched data
(`feedbackItems`, `actionItems`) and one of which (Pod MVP) requires a new,
independent fetch to `GET /api/points`.

The backlog's own NFR (AC-UI-7.4.5) explicitly asks for "independent loading
skeletons per section" rather than one dashboard-wide spinner gating all
sections on the slowest query — a deviation from the current single-gate
model. AC-7.4.8 simultaneously requires that the *existing* sections
(metrics grid, activity feed) remain "structurally and behaviorally
unchanged," including their current `data-testid`s and computation logic.

## Decision

**Adopt a hybrid model: keep the existing single `isLoading` gate for the
pre-existing sections untouched, and add one independent `isLoadingPoints`
boolean scoped only to the new Pod MVP section**, which is the only new
section with its own network call. The other three new sections (Category
Breakdown, Top Voted Feedback, Verified Improvements) are pure derivations
from `feedbackItems`/`actionItems`, which are already fetched by the
existing `Promise.all` — they have no independent network latency to skeleton
against, so they render as soon as the existing top-level `isLoading` clears,
identically timed to the metrics grid and activity feed.

Concretely:

- The existing `useEffect` in `dashboard/page.tsx` adds a 4th parallel fetch
  — `fetch(/api/points?pod=X&window=activeWindow)` — to the same
  `Promise.all([...])` array that already fetches feedback/actions/users.
  This means Pod MVP data arrives at the *same time* as everything else in
  the common case, and the page's overall `isLoading` gate naturally covers
  it too.
- **However**, because AC-UI-7.4.5 explicitly asks for independent
  skeletons (not one shared gate), the Pod MVP section additionally tracks
  its own `pointsData: PointsRow[] | null` state, initialized to `null`. If
  `pointsData === null` while the rest of the page has already rendered
  (this can only happen on a *window toggle re-fetch*, not initial mount,
  since initial mount is still covered by the shared `isLoading` gate), the
  Pod MVP section renders a local skeleton (`animate-pulse` block) instead
  of blocking the whole page.
- On `activeWindow` change (AC-7.4.7), the existing `useEffect` re-runs and
  re-fetches all 4 sources. To honor the "independent per-section skeleton"
  NFR concretely (not just for initial mount), the re-fetch is restructured
  so `/api/points` is fetched via its own `useEffect` keyed on
  `[activeWindow]`, separate from the `Promise.all` for
  feedback/actions/users. This is the **one structural change**: extracting
  the points fetch into its own effect + own loading boolean
  (`isLoadingPoints`), while the pre-existing effect/fetch/`isLoading` for
  feedback/actions/users is left byte-for-byte as-is per AC-7.4.8.

This means: on initial mount, all sections show the single "Loading…" screen
(unchanged behavior, satisfies AC-7.4.8's "existing sections... unchanged"
literally, since the shared gate is untouched). On a *window toggle*, the
existing sections re-render immediately once their fetch resolves (no
loading screen reappears today, and this is unchanged), while Pod MVP shows
its own small inline skeleton if `/api/points` is still in flight — this is
the incremental, additive behavior AC-UI-7.4.5 asks for, scoped to the one
section that actually has independent network latency.

## Consequences

- Only one new `useEffect` and one new boolean (`isLoadingPoints`) are added
  to `dashboard/page.tsx`; the existing `isLoading`/`loadError`/fetch logic
  for feedback/actions/users is untouched, keeping the diff minimal and
  AC-7.4.8-compliant (no existing `data-testid` or computation logic moves).
- Category Breakdown / Top Voted Feedback / Verified Improvements do not
  need their own loading booleans since they have no independent fetch —
  they are synchronous derivations of state that's already gated by the
  existing `isLoading`. This satisfies the spirit of "independent skeleton
  per section" for the one section (Pod MVP) that actually needs it, without
  inventing skeleton UI for sections that have no asynchronous boundary of
  their own.
- `dashboard/page.tsx` grows by roughly one `useEffect` block (~15 lines)
  and one small conditional skeleton block per Pod MVP — stays well under
  the 200-line cap when the file is split (see Component Inventory: Pod MVP
  is extracted into its own component file, not inlined).
- If a future sprint wants full per-section skeletons for Category
  Breakdown / Top Voted / Verified Improvements too, this ADR's model
  extends cleanly — each would need its own fetch, which today they don't
  have (they piggyback on shared page-level fetches).

## Alternatives Considered

- **Full refactor to N independent fetch-and-loading hooks per section**
  (e.g. a `useSectionData(url)` hook reused 4+ times): fully satisfies the
  literal NFR for every section, but requires converting the existing
  combined `feedbackItems`/`actionItems`/`usersMap` fetch into 3 separate
  fetches, which is a larger structural change to code AC-7.4.8 says must
  stay "structurally and behaviorally unchanged." Rejected as
  over-engineering relative to what the backlog actually needs (only Pod
  MVP has genuinely independent latency).
- **Do nothing — reuse the single `isLoading` gate for Pod MVP too**:
  simplest, avoids any structural change, but directly contradicts
  AC-UI-7.4.5's explicit instruction and would fail if TEST writes an
  assertion for an independent Pod MVP skeleton. Rejected.
