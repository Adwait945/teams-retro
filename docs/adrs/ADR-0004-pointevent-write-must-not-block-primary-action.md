# ADR-0004: `PointEvent` Writes Must Not Block or Fail the Primary Action

## Context

Epic 7.1's testable criteria are explicit and repeated across every modified
route: AC-7.1.2 states "A test mocks `PointEvent.create` to throw and asserts
the endpoint still returns 201 with the feedback item." The same
data-integrity expectation implicitly applies to the other 4 write sites
(upvote, convert, advance, verify) — a user's core workflow (submitting
feedback, upvoting, converting an idea to an action, advancing/verifying an
action item) must never fail, 500, or roll back because the *secondary*
gamification side effect (recording a `PointEvent`, incrementing
`totalPoints`, evaluating badges) failed. This is a stronger guarantee than
"don't block" (ADR-0003's concern) — it's specifically about **fault
isolation**: a `PointEvent` write failure must not become an HTTP 500 for
the user.

## Decision

**Every `PointEvent`-writing code path is structured so the primary
Mongoose write (the `FeedbackItem`/`ActionItem` mutation) is fully
`await`ed and its response is constructed *before* the `PointEvent`
side-effect chain is even initiated — and the side-effect chain is never
`await`ed by the route handler, nor is any error from it allowed to
propagate to the handler's own try/catch.**

Concretely, the shape of every modified handler becomes:

```ts
// 1. Primary action — fully awaited, as today
const item = new FeedbackItemModel({ ...safeBody })
await item.save()

// 2. Side effect — fired, not awaited, errors self-contained
recordPointEvent({
  userId: item.authorId,
  podId: authorPod,
  action: 'submit_feedback',
  relatedId: String(item._id),
})
// recordPointEvent (src/lib/pointsEngine.ts) internally wraps its own
// promise chain in a top-level .catch() — it NEVER throws synchronously
// and NEVER returns a rejected promise to the caller; it returns void.

// 3. Primary response — unaffected by step 2's outcome
return NextResponse.json(item, { status: 201 })
```

The key architectural rule: **`recordPointEvent()` has a `void` return
type, not `Promise<void>`, from the route handler's point of view** — the
helper itself is `async` internally (needs `await connectDB()` etc.), but
it is invoked without `await` and its internal implementation guarantees
its own promise never rejects into an unhandled state (the `.catch()` is
inside `recordPointEvent`, not left to the caller to remember). This makes
it structurally impossible for a route handler to accidentally `await`
a rejecting promise, since the function signature itself discourages
awaiting a meaningful return value.

This decision is deliberately paired with ADR-0003 (fire-and-forget badge
evaluation) — the same `recordPointEvent()` helper is the single place both
NFRs are satisfied together, rather than each of the 5 route handlers
re-implementing try/catch-around-fire-and-forget logic independently (which
is both a duplication risk and a correctness risk, since a route handler
author could forget the `.catch()` and introduce an unhandled promise
rejection warning, or worse, accidentally `await` it and reintroduce
blocking behavior).

## Consequences

- `src/lib/pointsEngine.ts` becomes a small, critical piece of shared
  infrastructure: it is the *only* place a `PointEvent` is ever written in
  the entire codebase (route handlers never call
  `PointEvent.create()`/`PointEventModel` directly), enforcing the
  fault-isolation guarantee at a single choke point instead of by
  convention across 5 independently-written route files.
- Testability: AC-7.1.2's exact test shape ("mock `PointEvent.create` to
  throw and assert the endpoint still returns 201") becomes a test of
  `recordPointEvent()`'s internals in isolation *and* a test of each route
  handler's behavior when `recordPointEvent` is mocked to reject — TEST
  should write both layers (unit test on `pointsEngine.ts`'s
  swallow-and-log behavior, and integration tests on each route asserting
  the primary response is unaffected).
- Because failures are logged via `console.error`/`console.warn` (server-
  side only) and never surfaced to the client, there is currently no
  operator-facing alerting if `PointEvent` writes start failing silently in
  production (e.g. a schema validation bug). This is an accepted gap for
  Sprint 7 — flagged in Isolation Constraints / open items for REVIEWER as
  a future observability improvement, not a blocker for this sprint.
- `GET /api/points` and the badge engine's queries are the only consumers
  of `PointEvent` data; if writes silently fail, those read paths simply
  under-report (a user's points/badges lag reality) rather than crash —
  consistent with points/badges being explicitly secondary/non-critical
  per the sprint's own framing ("gamification layer").

## Alternatives Considered

- **Wrap the primary action's `await item.save()` and the `PointEvent`
  write in a single Mongoose transaction, roll back both on failure**:
  would guarantee `PointEvent` consistency with the primary write, but
  directly contradicts AC-7.1.2's explicit requirement that a `PointEvent`
  failure must NOT affect the 201 response — a transaction rollback would
  do the opposite (fail the primary action too). Also adds meaningful
  latency and requires a MongoDB replica set (transactions require it),
  which is an unconfirmed assumption about the Atlas cluster tier. Rejected.
- **`await` the `PointEvent` write but wrap it in a local try/catch inside
  each route handler**: achieves the same fault isolation but duplicates
  the try/catch-and-log boilerplate across 5 files and still adds the
  `PointEvent` write's latency to the response (contradicts ADR-0003's
  "must not block" NFR, which this ADR treats as inseparable from "must not
  fail"). Rejected in favor of centralizing both concerns in
  `recordPointEvent()`.
