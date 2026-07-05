# Sprint 7 Backlog — Points Engine, Badge Engine, Leaderboard Rebuild, Dashboard Enhancement

**Sprint Goal**: Complete Scope 3's gamification core — points, badges, and a real leaderboard — so the app proves its north star metric (Verified Improvements per Pod per 30 Days) with a visible, competitive layer on top.

**Builds on**: Scope 2 (Always-On Retro), fully merged as of commit `dfd4875`.

**Reference docs**: `MVP_SCOPE_DECISIONS.md` (Scope 3 section, decisions S3-1 through S3-8), `PRODUCT_THINKING_SESSION.md`

---

## Pre-Flight — Required Before Epic 7.1 Starts

The following cleanup must be verified complete before this sprint begins. It is not new work — it closes out leftover scaffold issues discovered during the Sprint 6 review.

| Item | Status | Verification |
|---|---|---|
| `src/store/retro-store.tsx` deleted | Done (user-confirmed) | `find src -iname "retro-store*"` returns nothing |
| `src/app/leaderboard/page.tsx` deleted | Done (user-confirmed) | Will be recreated fresh in Epic 7.3 |
| `src/app/digest/page.tsx` deleted | Done (user-confirmed) | Digest content merges into Dashboard in Epic 7.4 — no separate page |
| `src/app/layout.tsx` — remove `RetroProvider` import/wrapper | **Must verify** | `grep -n "RetroProvider\|retro-store" src/app/layout.tsx` returns nothing |
| `src/components/sidebar.tsx`, `feedback-card.tsx`, `feedback-form.tsx`, `sprint-selector.tsx` deleted | **Should verify** | `grep -rl "retro-store\|useRetro" src/` returns nothing |
| `src/types/index.ts` — old `PointEvent`, `Badge`, `POINT_VALUES`, `BADGES` stubs | **Will be replaced in Epic 7.1** | See Type System Changes below |

**DEV must run** `grep -rl "retro-store\|useRetro\|SprintSelector" src/` **as the first action in Epic 7.1** and halt with a report if anything unexpected turns up.

---

## Type System Changes Required (Epic 7.1 prerequisite)

The current `src/types/index.ts` has stub versions of `PointEvent`, `Badge`, `POINT_VALUES`, and `BADGES` that predate all Scope 3 decisions. These are being replaced, not extended.

**Remove entirely:**
```typescript
export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt?: string
  threshold: number          // ← threshold-based badges are wrong model, remove
}

export type PointAction =
  | "submit-feedback"
  | "feedback-upvoted"
  | "create-action-item"
  | "complete-action-item"
  | "verify-improvement"

export const POINT_VALUES: Record<PointAction, number> = { ... }  // wrong values
export const BADGES: Badge[] = [ ... ]                              // threshold-based, wrong
```

**Replace with:**
```typescript
export type PointAction =
  | "submit_feedback"
  | "receive_upvote"
  | "remove_upvote"
  | "convert_action"
  | "complete_action"
  | "verify_action"

export const POINT_VALUES: Record<PointAction, number> = {
  submit_feedback: 10,
  receive_upvote: 5,
  remove_upvote: -5,
  convert_action: 50,
  complete_action: 100,
  verify_action: 150,
}

export interface PointEvent {
  _id: string
  userId: string          // who is credited with the points (see Epic 7.1 AC for author-crediting rule)
  podId: string
  action: PointAction
  points: number           // signed — negative for remove_upvote clawback
  relatedId?: string       // feedbackId or actionItemId this event originated from
  createdAt: string
}

export type BadgeType =
  | "feedback_machine"
  | "action_taker"
  | "innovator"
  | "problem_solver"
  | "consensus_builder"
  | "pod_champion"

export interface Badge {
  _id: string
  userId: string
  podId: string
  type: BadgeType
  earnedAt: string
}

export const BADGE_DEFINITIONS: Record<BadgeType, { name: string; icon: string; description: string; kind: "permanent" | "living" }> = {
  feedback_machine:   { name: "Feedback Machine",   icon: "🗣️", description: "Submit 10+ feedback items in any 30-day window", kind: "permanent" },
  action_taker:       { name: "Action Taker",       icon: "🏃", description: "Complete 3+ action items in any 30-day window", kind: "permanent" },
  innovator:          { name: "Innovator",          icon: "💡", description: "Receive 20+ upvotes on 'Should Try' feedback (all-time)", kind: "permanent" },
  problem_solver:     { name: "Problem Solver",     icon: "🔧", description: "Own and complete an action item from 'Slowed Us Down' feedback", kind: "permanent" },
  consensus_builder:  { name: "Consensus Builder",  icon: "🤝", description: "Have a feedback item reach 10+ upvotes", kind: "permanent" },
  pod_champion:       { name: "Pod Champion",       icon: "👑", description: "Currently #1 on the pod leaderboard (30-day window)", kind: "living" },
}
```

**`User` interface** — `badges: Badge[]` field (line 11) should be removed from the User type; badges are fetched via a separate query (`GET /api/badges?userId=X`), not embedded. `totalPoints` stays but is now a derived/cached field updated by the points engine, not manually set.

---

## Epic 7.1: Points Engine

### Description
A backend system that records a signed point value every time a user performs a point-earning action, and exposes a queryable total per user per time window. This is the foundation every other epic in this sprint depends on.

### Acceptance Criteria
- AC-1: `src/lib/models/PointEvent.ts` Mongoose model created matching the revised `PointEvent` interface, with `mongoose.models.PointEvent ||` guard pattern.
- AC-2: `POST /api/feedback` (on creation) — after successful feedback save, create a `PointEvent` for the author: `action: "submit_feedback"`, `points: 10`.
- AC-3: `PATCH /api/feedback/[id]/upvote` — when an upvote is **added**, create a `PointEvent` for the feedback author: `action: "receive_upvote"`, `points: 5`. When an upvote is **removed** (toggle-off), create a `PointEvent` for the feedback author: `action: "remove_upvote"`, `points: -5`. (This also fixes Bug B1 from Scope 2 if not already fixed — verify the toggle logic itself works before adding point events on top of it.)
- AC-4: `POST /api/actions` (convert-from-feedback flow only, admin-initiated) — after creation, create a `PointEvent` for the **feedback author** (not the admin who clicked convert): `action: "convert_action"`, `points: 50`. If the feedback is anonymous, the event still targets the true `authorId` — points are always attributed, only display is anonymized (per Decision A1/S3-1).
- AC-5: Standalone action item creation (no source feedback) does **not** trigger a `convert_action` point event — only conversions from existing feedback do.
- AC-6: `PATCH /api/actions/[id]/advance` — when status transitions to `"completed"`, create a `PointEvent` for the action's `ownerId`: `action: "complete_action"`, `points: 100`.
- AC-7: `PATCH /api/actions/[id]/verify` — when status transitions to `"verified"`, create a `PointEvent` for the user who performed the verification: `action: "verify_action"`, `points: 150`.
- AC-8: `GET /api/points?pod=X&window=7d|30d|all` returns, per user in the pod: `{ userId, name, avatar, windowPoints, allTimePoints }`, sorted descending by `windowPoints`.
- AC-9: `windowPoints` is calculated by summing all `PointEvent.points` for that user where `createdAt` falls within the requested window. `allTimePoints` sums all events regardless of window.
- AC-10: Regressing an action item's status (Bug B2 fix territory) does **not** trigger a negative point event for `complete_action` or `verify_action` — once earned, those points stand even if the item is later regressed. (Only upvote removal has a clawback; action item point events are not clawed back on regression.)

### Non-Functional Requirements
- Performance: `GET /api/points` for a 10-user pod with 90 days of history should respond in under 300ms (single aggregation query, not N+1 per-user lookups).
- Data integrity: every `PointEvent` write must be wrapped so a failure to write the point event does not roll back or block the primary action (e.g., feedback submission succeeds even if the point event write fails — log the error, don't throw).

### UI Reference
None — this epic is backend-only. No UI changes.

### Out of Scope
- Badge evaluation (Epic 7.2)
- Any UI display of points (Epic 7.3, 7.4)
- Historical backfill of point events for data created before this sprint (existing feedback/actions from Scope 2 will not retroactively generate PointEvents — the leaderboard will reflect activity from this sprint forward, or from seed data)

### Dependencies
- `src/types/index.ts` rewritten per the Type System Changes section above
- Existing `src/app/api/feedback/route.ts`, `src/app/api/feedback/[id]/upvote/route.ts`, `src/app/api/actions/route.ts`, `src/app/api/actions/[id]/advance/route.ts`, `src/app/api/actions/[id]/verify/route.ts` — all modified, not replaced

---

## Epic 7.2: Badge Engine

### Description
An evaluator that runs after every point-earning event and checks whether the acting user (or, for the living badge, the whole pod) now qualifies for a badge. Five badges are permanent, one-time achievements; the sixth (Pod Champion) is a living title that transfers between users.

### Acceptance Criteria
- AC-1: `src/lib/models/Badge.ts` Mongoose model created matching the revised `Badge` interface.
- AC-2: Unique index on `{ userId: 1, type: 1, podId: 1 }` for the 5 permanent badge types — prevents duplicate awards.
- AC-3: Unique index on `{ type: 1, podId: 1 }` scoped specifically to `type: "pod_champion"` — enforces only one Pod Champion badge document per pod at any time (see AC-9 for the mechanism that keeps this true).
- AC-4: `src/lib/badgeEngine.ts` created — exports `evaluateBadges(userId: string, podId: string): Promise<void>`, called after every `PointEvent` write from Epic 7.1.
- AC-5: **Feedback Machine** — query count of `PointEvent` where `userId = X`, `action = "submit_feedback"`, `createdAt` within trailing 30 days. If count ≥ 10 and user doesn't already hold this badge, create it.
- AC-6: **Action Taker** — query count of `PointEvent` where `userId = X`, `action = "complete_action"`, `createdAt` within trailing 30 days. If count ≥ 3 and user doesn't already hold this badge, create it.
- AC-7: **Innovator** — sum `upvotes` across all `FeedbackItem` where `authorId = X` and `category = "should-try"`. If sum ≥ 20 and user doesn't already hold this badge, create it. (All-time, not windowed.)
- AC-8: **Problem Solver** — find `ActionItem` where `ownerId = X`, `status` in `("completed", "verified")`, then look up `sourceFeedbackId` and check if that feedback's `category = "slowed-us-down"`. If any match exists and user doesn't already hold this badge, create it.
- AC-9: **Consensus Builder** — find any `FeedbackItem` where `authorId = X` and `upvotes ≥ 10`. If at least one exists and user doesn't already hold this badge, create it.
- AC-10: **Pod Champion (living badge)** — after evaluating the other 5, calculate the current #1 ranked user in the pod for the trailing 30-day window (reuse the same aggregation as `GET /api/points`). If the current #1 differs from whoever currently holds the `pod_champion` badge in this pod, delete the old badge document and create a new one for the new #1. If they're the same, do nothing. Tie-break rule: if two users have identical 30-day totals, the one whose qualifying `PointEvent` reached that total first (earlier `createdAt`) keeps/receives the badge.
- AC-11: `GET /api/badges?userId=X` returns all badges (permanent + living, if applicable) held by that user.
- AC-12: `GET /api/badges?podId=X` returns all badges held by anyone in the pod (used by Leaderboard to attach badge chips to each entry in one query rather than N+1).

### Non-Functional Requirements
- The badge evaluation call must not block or slow down the primary API response the user is waiting on — fire the evaluation asynchronously (don't `await` it in the request handler; use `.catch()` to log failures) so a point-earning action always returns quickly.
- Idempotency: running `evaluateBadges` twice in a row for the same user/state must not create duplicate badge documents (enforced by the unique indexes in AC-2/AC-3, but also verify no error is thrown on the duplicate-key case — catch and ignore that specific error code).

### UI Reference
None — backend only.

### Out of Scope
- Any notification or toast when a badge is earned (future enhancement, not this sprint)
- Badge revocation for the 5 permanent badges (they are never removed once earned, per Decision S3-6)

### Dependencies
- Epic 7.1 (Points Engine) must be complete — badge evaluation reads `PointEvent` data
- `src/types/index.ts` — `BadgeType`, `Badge`, `BADGE_DEFINITIONS` from the Type System Changes section

---

## Epic 7.3: Leaderboard Page (Full Rebuild)

### Description
A completely new `/leaderboard` page — the previous file was leftover pre-Sprint-1 scaffold code (`// @ts-nocheck`, imported the deleted `retro-store`) and has been deleted. This is a ground-up build against the real Points and Badge APIs.

### Acceptance Criteria
- AC-1: `src/app/leaderboard/page.tsx` created, wrapped in `Shell` (the real layout component used by Dashboard/Feedback/Actions/Pod Settings — not any old sidebar component).
- AC-2: Page fetches `GET /api/points?pod={user.pod}&window={activeWindow}` and `GET /api/badges?podId={user.pod}` on load and on window toggle change.
- AC-3: Time window toggle: **This Week / This Month / All-Time** — same pattern as the Dashboard toggle from Scope 2. Changing it re-fetches and re-ranks the full list.
- AC-4: Rank #1 card — gold gradient background, Trophy icon, name, avatar, badge chips (including 👑 Pod Champion if they currently hold it), window points, all-time points.
- AC-5: Rank #2 card — silver gradient, Medal icon, same fields.
- AC-6: Rank #3 card — bronze gradient, Medal icon, same fields.
- AC-7: Ranks 4+ — plain card, numeric rank, avatar initials, name, badge chips, points. No gradient.
- AC-8: Badge chips render from the `GET /api/badges?podId=X` result, matched to each user by `userId`, using `BADGE_DEFINITIONS` for icon/name/description (tooltip on hover shows description).
- AC-9: "Points Guide" sidebar card lists all 6 `PointAction` values from `POINT_VALUES` with their point amounts and plain-language labels (e.g. "Submit feedback" not "submit_feedback").
- AC-10: "Badges" sidebar card lists all 6 badges from `BADGE_DEFINITIONS` with icon, name, and earn condition description — this is a static reference list, not filtered to only earned badges.
- AC-11: Empty state — if the pod has zero `PointEvent` records (e.g., brand new pod), show a friendly empty state: "No activity yet — submit feedback or complete an action item to appear on the leaderboard" rather than a blank list.
- AC-12: Current logged-in user's own row is visually highlighted (subtle border or background tint) so they can find themselves in a longer list without counting.

### Non-Functional Requirements
- Accessibility: rank cards use semantic markup (ordered list or equivalent) so screen readers announce rank order correctly, not just visual position.
- Performance: page should render the initial list within 1s on a pod of up to 15 users given the aggregation approach from Epic 7.1 AC-9.

### UI Reference
- No existing mock — this replaces the deleted `docs/prototypes` reference. Follow the visual pattern already established in Dashboard's stat cards and Action Items' status pills for consistency (gradients, spacing, card radius).

### Out of Scope
- Multi-pod leaderboard comparison (deferred, see MVP_SCOPE_DECISIONS.md Scope 4+ list)
- Historical "leaderboard as of date X" time travel — only current-moment window calculations

### Dependencies
- Epic 7.1 (Points Engine) and Epic 7.2 (Badge Engine) must both be complete
- `Shell` component (`src/components/layout/Shell.tsx`) — reused, not modified
- Pre-Flight cleanup confirmed (old leaderboard file already deleted per user)

---

## Epic 7.4: Dashboard Enhancement (Retro Digest Merge)

### Description
The standalone Retro Digest page has been cut from scope (see MVP_SCOPE_DECISIONS.md — Scope Cut: Retro Digest → Merged into Dashboard). Its highest-value sections are added to the existing Scope 2 Dashboard, which already has the 7d/30d/all-time toggle wired.

### Acceptance Criteria
- AC-1: New section "Pod MVP" added below the existing metrics grid — shows trophy icon, current time-window #1 user's name and avatar, their window points. Pulls from the same `GET /api/points` call the Leaderboard uses (Dashboard makes its own call with the active window).
- AC-2: New section "Category Breakdown" — 3 mini cards (Slowed Down / Should Try / Went Well), each showing the count of feedback in that category within the active window, plus a delta indicator vs. the prior equivalent period.
- AC-3: Delta calculation: for "This Week," compare to the 7 days prior to the current 7-day window. For "This Month," compare to the 30 days prior. For "All-Time," **hide the delta entirely** (no meaningful prior period exists) per Decision S3-8.
- AC-4: If the prior period has zero data, display the delta as the full current count with an upward arrow (e.g., "+12 ↑") rather than a percentage or "+12 vs 0."
- AC-5: New section "Top Voted Feedback" — top 5 `FeedbackItem` by `upvotes` count, filtered to `createdAt` within the active window, showing category color, truncated content, and upvote count.
- AC-6: New section "Verified Improvements" — all `ActionItem` where `status = "verified"` and `createdAt` (or `completedAt`) within the active window, showing title and the `impactNote` in the emerald inset block style already established in Action Items (Decision V1).
- AC-7: All four new sections respect the existing time window toggle — switching windows re-fetches and re-renders all of them, not just the original metrics grid.
- AC-8: Existing Scope 2 Dashboard sections (metrics grid, activity feed) are unchanged — this epic only adds sections below them, does not modify existing logic.

### Non-Functional Requirements
- Loading state: each new section shows its own skeleton/loading placeholder independently rather than blocking the whole dashboard on the slowest query.
- Empty states: "Top Voted Feedback" and "Verified Improvements" each need their own empty-state message when no qualifying data exists in the window (e.g., "No verified improvements in this window yet").

### UI Reference
- Follow the existing Dashboard card styling from Scope 2 for visual consistency. No new mock provided — match established patterns.

### Out of Scope
- Teams integration notifications referencing these new sections (Teams integration is cut to Scope 4 entirely)
- Any admin-only view of this data — all pod members see the same Dashboard

### Dependencies
- Epic 7.1 (Points Engine) for the Pod MVP section
- Existing Dashboard time-window toggle logic from Scope 2 (`src/app/dashboard/page.tsx`) — extended, not rewritten

---

## Build Order

1. **Type system rewrite** — `src/types/index.ts` (Types Changes section above)
2. **Epic 7.1** — Points Engine (models, API modifications, points endpoint)
3. **Epic 7.2** — Badge Engine (depends on 7.1's PointEvent data)
4. **Epic 7.3** — Leaderboard page (depends on both 7.1 and 7.2)
5. **Epic 7.4** — Dashboard enhancement (depends on 7.1 only; can run in parallel with 7.3 if using separate dev sessions)

## Sprint 7 Definition of Done

- [ ] All AC-7.x acceptance criteria pass across all 4 epics
- [ ] Pre-Flight cleanup verified (no orphaned `retro-store`/`useRetro`/`SprintSelector` references anywhere in `src/`)
- [ ] `PointEvent` and `Badge` Mongoose models created with correct unique indexes
- [ ] Old threshold-based `Badge`/`POINT_VALUES`/`BADGES` stub fully removed from `src/types/index.ts`, replaced per spec
- [ ] Leaderboard page renders real data, no `@ts-nocheck`, no references to deleted scaffold
- [ ] Dashboard shows all 4 new sections, respecting time window toggle
- [ ] `tsc --noEmit` — 0 errors
- [ ] Build passes — 0 errors
- [ ] All tests passing
- [ ] Manual smoke test: seed a few PointEvents manually (or via a quick script), confirm Leaderboard ranks correctly, confirm a badge is awarded when threshold is crossed, confirm Pod Champion transfers when a different user takes #1
- [ ] Committed and pushed to `main`

---

## Smoke Test Checklist

| Step | Action | Expected Result |
|---|---|---|
| 1 | Submit feedback as User A | `PointEvent` created: `submit_feedback`, +10, for User A |
| 2 | User B upvotes User A's feedback | `PointEvent` created: `receive_upvote`, +5, for User A |
| 3 | User B removes their upvote | `PointEvent` created: `remove_upvote`, -5, for User A |
| 4 | Admin converts a feedback item (authored by User C) to an action item | `PointEvent` created: `convert_action`, +50, for User C (not admin) |
| 5 | User D creates a standalone action item (no source feedback) | No `convert_action` point event created |
| 6 | Action item owned by User E is advanced to "completed" | `PointEvent` created: `complete_action`, +100, for User E |
| 7 | Action item is verified with an impact note | `PointEvent` created: `verify_action`, +150, for the verifier |
| 8 | Visit `/leaderboard` | Real ranked list appears, no console errors, no `@ts-nocheck` warnings |
| 9 | Toggle time window on Leaderboard | List re-ranks correctly |
| 10 | User A submits 10 feedback items within 30 days | "Feedback Machine" badge appears on their Leaderboard card |
| 11 | Two different users take turns being #1 | Pod Champion badge (👑) moves — only ever shown on current #1, never on both simultaneously |
| 12 | Visit `/dashboard` | Pod MVP, Category Breakdown, Top Voted, and Verified Improvements sections all render |
| 13 | Toggle Dashboard time window to "All-Time" | Category Breakdown deltas are hidden (not shown as "N/A" or "0%" — hidden entirely) |
| 14 | Fresh pod with zero activity | Leaderboard shows empty state, not a blank screen or error |
