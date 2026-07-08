# ADR-0006: `podId` Derivation — No `Pod` Entity, No Existing Pod-Scoped Queries

## Context

Sprint 7's types add `podId: string` to both `PointEvent` and `Badge`, and
`GET /api/points?pod=X` / `GET /api/badges?podId=X` are explicitly
pod-scoped per Epic 7.1 AC-8 and Epic 7.2 AC-11/AC-12. However, a direct
read of the current codebase surfaces a pre-existing gap: **there is no
`Pod` domain entity** (confirmed — `CLAUDE.md` and `src/types/index.ts`
agree there is no `Sprint`/`Pod` collection), and the only "pod" concept in
the system is the free-text `User.pod: string` field set at registration.
Critically:

- `GET /api/users` (`src/app/api/users/route.ts`) only filters by
  `username`, never by `pod` — it returns ALL users in the database
  regardless of pod, and Dashboard's existing call
  `fetch('/api/users?pod=${user.pod}')` (line 73 of
  `src/app/dashboard/page.tsx`) is **silently ignored** by the route today;
  it happens to work by accident only because there is currently a single
  pod's worth of test data.
- `GET /api/feedback` and `GET /api/actions` have **no pod filter at all**
  — `FeedbackItem` and `ActionItem` schemas have no `podId`/`pod` field.
  Every pod currently sees every other pod's feedback and action items.

This is a **pre-existing cross-pod data isolation gap**, not something
introduced by Sprint 7. It is out of this sprint's explicit scope (no AC in
`FEATURE_REQUIREMENTS.md` asks ARCHITECT to fix `FeedbackItem`/`ActionItem`
pod-scoping), but Sprint 7 is the first sprint whose correctness genuinely
depends on `podId` meaning something precise, since `GET /api/points?pod=X`
must return exactly the users in pod X, and badge documents must be scoped
per-pod (the unique index `{ type: 1, podId: 1 }` on `pod_champion`
literally depends on `podId` being correct and consistently derived).

## Decision

**`podId` is always and only `User.pod`** — the same free-text string
already collected at registration (e.g. `"Pod 1"`, `"pod2"`). No new `Pod`
collection or ID scheme is introduced. Every Sprint 7 write/read path
derives `podId` as follows:

1. **`PointEvent.podId`** — set to the `User.pod` of the point-event's
   `userId` (the credited user, not the acting user, where they differ —
   e.g. `convert_action` credits the feedback author, so `podId` is the
   *author's* pod, looked up via `User.findById(feedback.authorId)`, not
   the admin-initiator's pod).
2. **`Badge.podId`** — always equals the `podId` passed into
   `evaluateBadges(userId, podId)`, which itself is threaded through from
   the `PointEvent.podId` that triggered evaluation (see ADR-0003's
   chaining).
3. **`GET /api/points?pod=X`** — first resolves the set of users in pod X
   via `User.find({ pod: X })`, then aggregates `PointEvent` sums scoped to
   those `userId`s (not by filtering `PointEvent.podId === X` directly,
   even though that would usually give the same answer — filtering by the
   resolved user-id set is more robust against any future edge case where a
   user changes pods after earning points, since `PointEvent.podId` is a
   point-in-time snapshot, not a live join).
4. **`GET /api/users?pod=X`** (a pre-existing, currently-broken query
   param) — **this ADR fixes it as an in-scope side effect**, since Sprint
   7's `getPodLeaderboard()` needs a correct pod-scoped user list and the
   Dashboard already assumes this param works. Adding `pod` filtering to
   `GET /api/users` is a minimal, additive, backward-compatible change (the
   route already accepts and ignores the param — honoring it changes
   behavor from "return all users" to "return only this pod's users" when
   the param is present, which is a bug fix, not a breaking change, since
   no caller currently relies on the param being ignored).

**Explicitly out of scope for Sprint 7**: adding `podId` to `FeedbackItem`
or `ActionItem`, or pod-scoping `GET /api/feedback`/`GET /api/actions`.
Those collections remain global-read exactly as they are today. This means
Epic 7.4's "Top Voted Feedback" and "Verified Improvements" Dashboard
sections will, like the rest of the app today, show cross-pod data — this
is a **pre-existing behavior, not a regression introduced by this sprint**,
and is flagged below for REVIEWER/PRODUCT as a gap worth a dedicated future
sprint (multi-pod data isolation), not something ARCHITECT should silently
scope-creep into Sprint 7's already-large surface area.

## Consequences

- `GET /api/users?pod=X` behavior change (bug fix): any existing caller
  that relied on the param being ignored (there are none found in a
  full-repo grep as of this writing) would see a behavior change. Flagged
  in the Breaking Change Register even though risk is assessed as low.
- The Leaderboard and Dashboard Pod MVP sections will now correctly show
  only the logged-in user's pod's members and points — this is a
  user-visible *fix*, not a regression, but worth calling out since it
  changes what the Leaderboard shows compared to what would happen if
  `GET /api/users`'s pod filter remained broken (in which case the
  Leaderboard would either show every user in the database, or ARCHITECT
  would have had to work around the bug some other way).
- Because `FeedbackItem`/`ActionItem` remain pod-unscoped, "Top Voted
  Feedback" and "Verified Improvements" sections technically show pod-wide
  *and* cross-pod data identically — no worse than today's Feedback Board/
  Action Items pages, which already exhibit this gap. This is documented
  here so REVIEWER doesn't mistake it for a new Sprint 7 defect.

## Alternatives Considered

- **Introduce a `Pod` entity with a real `_id`** and retrofit
  `FeedbackItem`/`ActionItem`/`User` to reference it: correct long-term
  fix, but a significant scope expansion explicitly prohibited by this
  sprint's constraints ("Do NOT design a `Sprint` domain entity" and, by
  the same reasoning applied to `CLAUDE.md`'s "always-on" philosophy,
  introducing a new top-level entity outside the sprint's stated Epics is
  not ARCHITECT's call to make unilaterally). Rejected for Sprint 7;
  recommended as a future PRODUCT-scoped sprint.
- **Filter `PointEvent`/`Badge` reads by `PointEvent.podId`/`Badge.podId`
  directly instead of resolving the user set first**: simpler, but
  fragile if a user's `pod` field is ever edited after they've earned
  points (their historical `PointEvent.podId` values would still reflect
  their old pod, causing them to vanish from their new pod's leaderboard
  while still appearing on their old one via stale documents). Resolving
  the current user set first and aggregating by `userId` avoids this
  drift. Rejected as the primary strategy, though `PointEvent.podId`/
  `Badge.podId` are still stored (per the type spec) for auditability and
  as a secondary index option.
