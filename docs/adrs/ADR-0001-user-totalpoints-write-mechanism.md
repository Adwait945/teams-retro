# ADR-0001: `User.totalPoints` Write Mechanism

## Context

`src/types/index.ts`'s Type System Changes (Sprint 7) keep `User.totalPoints:
number` on the `User` interface but redefine it as "a derived/cached field
updated by the points engine, not manually set." Meanwhile `GET /api/points`
(Epic 7.1 AC-8/AC-9) computes `allTimePoints` live by summing `PointEvent`
documents for each user, with no date filter. The backlog is silent on
whether `User.totalPoints` needs its own write path in Sprint 7, or whether
it becomes vestigial now that `GET /api/points` can always compute the same
number on demand.

Two candidate designs:

1. **Atomic increment on every `PointEvent` write** — each of the 5
   points-engine call sites (`POST /api/feedback`, `PATCH
   /api/feedback/[id]/upvote` ×2 branches, `POST /api/actions`, `PATCH
   /api/actions/[id]/advance`, `PATCH /api/actions/[id]/verify`) also runs
   `User.findByIdAndUpdate(userId, { $inc: { totalPoints: points } })`
   immediately after (or alongside) the `PointEvent.create()` call.
2. **Leave `totalPoints` unmaintained in Sprint 7** — treat it as a legacy
   field that predates the points engine, do not write to it from any new
   code path, and let `GET /api/points`'s live-aggregated `allTimePoints` be
   the single source of truth for anything Sprint 7 renders (Leaderboard,
   Dashboard Pod MVP).

## Decision

**Adopt Option 1 with an explicit non-blocking caveat**: every `PointEvent`
write site also performs `User.findByIdAndUpdate(pointEvent.userId, { $inc:
{ totalPoints: pointEvent.points } })` in the same fire-and-forget style as
the `PointEvent` write itself (see ADR-0004) — i.e. it must not block or
fail the primary HTTP response. This keeps `User.totalPoints` a live,
incrementally-maintained cache that mirrors `allTimePoints`, useful for any
future feature (e.g. a lightweight profile widget) that wants a single-field
read without running the `PointEvent` aggregation in `GET /api/points`.

Sprint 7's own UI (Leaderboard, Dashboard Pod MVP) **does not read
`User.totalPoints`** — it always calls `GET /api/points` for
`windowPoints`/`allTimePoints`, per AC-7.1.8/AC-7.4.1. `User.totalPoints` is
therefore write-only from Sprint 7's perspective: written for future-proofing,
not read by any Sprint 7 component. This avoids a second source of truth
diverging silently from `PointEvent` history — if the increment ever drifts
(e.g. due to a partial failure), no Sprint 7 UI is affected, and a future
sprint can add a reconciliation job (`sum(PointEvent.points) → totalPoints`)
if it becomes load-bearing.

Concretely: `$inc` is used (not `findById` + `save()`) to avoid read-modify-
write races under concurrent requests, since multiple point-earning actions
for the same user can occur close together (e.g. two upvotes landing near-
simultaneously).

## Consequences

- `User.totalPoints` and `sum(PointEvent.points)` should converge in the
  common case, but are not guaranteed byte-identical at every instant (the
  `$inc` call can fail independently of the `PointEvent.create()` call,
  per the fire-and-forget NFR — see ADR-0004). This is an accepted
  eventual-consistency trade-off, not a bug.
- No migration/backfill is needed in Sprint 7: existing `User` documents
  already default `totalPoints: 0`, and there is no pre-Sprint-7
  `PointEvent` history to reconcile against.
- Future sprints that want `User.totalPoints` to be authoritative (e.g. for
  a fast-path profile card) should add a periodic reconciliation script
  rather than trusting the `$inc` stream in perpetuity.
- Adds one additional Mongoose write per point-earning action (6 total
  write sites across Epic 7.1), each wrapped in the same non-blocking
  pattern as the corresponding `PointEvent` write.

## Alternatives Considered

- **Leave `totalPoints` unmaintained**: simpler (no extra write), but leaves
  a public, documented `User` field permanently stale/misleading (`0` for
  every user forever) with no code path ever populating it — confusing for
  future maintainers and a foot-gun for anyone who reads `User.totalPoints`
  assuming Sprint 7 wired it up. Rejected in favor of keeping the field
  meaningful, at the cost of one extra non-blocking write per action.
- **Recompute `totalPoints` lazily on every `GET /api/users`**: would
  guarantee correctness but requires an aggregation on every user list
  fetch (used by Dashboard's activity feed author map, Feedback/Action
  owner dropdowns) — unnecessary cost on hot, frequently-called read paths
  that don't need point data at all. Rejected.
