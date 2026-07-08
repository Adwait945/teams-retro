# ADR-0003: Fire-and-Forget Invocation Pattern for `evaluateBadges()`

## Context

Epic 7.2 AC-4 requires `src/lib/badgeEngine.ts`'s `evaluateBadges(userId,
podId): Promise<void>` to be called "after every `PointEvent` write from
Epic 7.1" — five call sites: `POST /api/feedback`, `PATCH
/api/feedback/[id]/upvote` (both toggle directions), `POST /api/actions`
(convert-from-feedback only), `PATCH /api/actions/[id]/advance` (on
`completed` transition), `PATCH /api/actions/[id]/verify`. The Epic 7.2 NFR
(Prototype/Backlog Delta section) states badge evaluation "must not block...
use `.catch()` to log failures, don't `await` it." `evaluateBadges()` itself
runs up to 6 sub-checks (5 permanent badge queries + the Pod Champion
recomputation), several of which are non-trivial aggregations
(`FeedbackItem.aggregate` for Innovator, an `ActionItem` + `FeedbackItem`
join for Problem Solver) — this is deliberately kept off the request's
critical path.

## Decision

**Every route handler invokes `evaluateBadges()` as an un-awaited call
immediately after its (also un-awaited, see ADR-0004) `PointEvent` write,
using the pattern:**

```ts
// after the point-earning primary action's response payload is prepared,
// but written to a local variable, not yet returned:
writePointEvent(payload)
  .then(() => evaluateBadges(payload.userId, payload.podId))
  .catch((err) => console.error('[points/badges] side-effect failed:', err))

return NextResponse.json(result, { status: 201 })
```

Key structural decisions:

1. **`evaluateBadges()` is chained onto the `PointEvent` write's promise via
   `.then()`, not fired in parallel with it.** Badge thresholds (e.g.
   Feedback Machine's `countDocuments` over `submit_feedback` events) must
   see the *just-written* `PointEvent` to evaluate correctly — firing both
   promises in parallel risks `evaluateBadges()` querying
   `PointEvent.countDocuments` before the write commits, undercounting by
   one and potentially delaying a badge award by one action. Chaining
   guarantees ordering without requiring the request handler to `await`
   either.
2. **A single `.catch()` covers both operations** — since `evaluateBadges()`
   is chained after the `PointEvent` write, one `.catch()` at the end of the
   chain handles failures from either step, satisfying the "log failures via
   `.catch()`" NFR with one code path per call site rather than two nested
   try/catches.
3. **The route handler's `return NextResponse.json(...)` statement executes
   before this chain settles.** The primary HTTP response (the created
   feedback item, the upvote toggle result, the advanced/verified action
   item, etc.) is unaffected by `PointEvent`/badge outcomes, satisfying both
   this ADR and ADR-0004's data-integrity requirement.
4. **Each route handler is responsible for constructing its own `podId`**
   before firing the chain — since neither `FeedbackItem` nor `ActionItem`
   carries a `podId` field (there is no `Pod` entity; `podId` is always the
   acting/target user's `user.pod` string, looked up via a `User.findById`
   the handler already needs to determine `userId` in most cases — see Data
   Flow section in the Architecture Design for exact per-route derivation).

## Consequences

- Test strategy implication (already flagged by PRODUCT in the Prototype/
  Backlog Delta note): HTTP-level integration tests for the 5 modified
  routes **cannot** assert on badge side effects synchronously, since the
  response returns before `evaluateBadges()` resolves. TEST must write
  `badgeEngine.test.ts` as direct unit tests calling `evaluateBadges()`
  in isolation (per Epic 7.2's own AC-7.2.5 through AC-7.2.10 testable
  criteria, which are already written against direct `evaluateBadges()`
  calls, not HTTP responses).
- A slow or failing badge evaluation (e.g. a transient Mongo timeout on the
  Pod Champion aggregation) never surfaces as a user-facing error and never
  delays the primary action's response — consistent with the sprint's
  design intent that gamification is a secondary, best-effort layer.
- Because the chain is fired-and-forgotten from the handler's perspective,
  Next.js's serverless/edge runtime could, in principle, terminate the
  function before the chain settles (a known limitation of fire-and-forget
  patterns in serverless environments). This is an accepted risk for this
  sprint — the app runs on a persistent Node.js server per the existing
  `connectDB()` singleton pattern (not deployed to Vercel Edge Functions),
  so in-process promises reliably complete before the process would ever
  recycle mid-request. If the deployment target changes to an edge/
  serverless model that guarantees early termination, a future ADR should
  revisit this (e.g. via `waitUntil()`-style APIs).
- Every one of the 5 Epic 7.1 route handlers gets a nearly identical
  6-line chain-and-catch block. Rather than duplicating this 5 times,
  `src/lib/pointsEngine.ts` (see ADR "service-layer for points/badges" in
  the Architecture Design's Component Inventory) exports a single helper,
  `recordPointEvent(input): void`, that internally performs the
  `PointEvent.create().then(() => evaluateBadges(...)).catch(...)` chain and
  the `User.totalPoints` `$inc` (ADR-0001) — so each route handler makes
  one synchronous-looking call (`recordPointEvent({ userId, podId, action,
  relatedId })`) without awaiting it, keeping route handlers under the
  200-line cap and avoiding copy-pasted chains.

## Alternatives Considered

- **`await` both `PointEvent.create()` and `evaluateBadges()` inline,
  wrapped in a try/catch that swallows errors**: functionally similar
  end-state (primary response unaffected by failures) but adds real latency
  to every point-earning request equal to the sum of the `PointEvent` write
  and the (potentially expensive) badge evaluation — directly contradicts
  the "must not block" NFR wording, which specifically calls out avoiding
  `await`. Rejected.
- **Fire `PointEvent.create()` and `evaluateBadges()` as two independent,
  unchained un-awaited promises**: avoids the ordering guarantee described
  above; risks off-by-one undercounting in badge threshold checks under
  concurrent/rapid actions. Rejected in favor of the `.then()` chain.
- **Queue-based deferred processing (e.g. write a `PendingBadgeCheck`
  collection, evaluate via a cron/worker)**: over-engineered for this
  sprint's scale and introduces new infrastructure (a job runner) not
  present anywhere else in the stack. Rejected — in-process `.then()`
  chaining is sufficient given the single-Node-process deployment model.
