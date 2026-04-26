# Sprint 6 — Always-On Retro: Full Rearchitecture

**Theme**: Remove sprint-gating, adopt always-on feed, rebuild dashboard with time-window lenses  
**Scope**: Scope 2 Revised (locked in MVP_SCOPE_REVIEW_DECISIONS.md)  
**DEV Sessions**: 3  
**Prerequisite**: Sprints 1–5 complete and merged to main

---

## Sprint Goal

The app transitions from a sprint-gated model to an always-on continuous improvement feed. All sprint dependencies are removed from the data layer, API, and UI. The dashboard shows rolling pod-level metrics across three time windows. The feedback board and action items page are always open with no gating. A new Pod Settings page replaces Sprint Setup for admin functions.

---

## Epics & User Stories

---

### Epic 6.1 — Remove Sprint Model (Data Layer + API)

**User Story**: As a developer, I want all sprint dependencies removed from the data layer and API, so that the app no longer requires an open sprint to function.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-6.1.1 | The `Sprint` Mongoose model file is deleted and no longer imported anywhere in the codebase |
| AC-6.1.2 | The `sprints` MongoDB collection is no longer written to or read from by any API route |
| AC-6.1.3 | All `/api/sprints`, `/api/sprints/[id]`, and `/api/sprints/[id]/status` route files are deleted |
| AC-6.1.4 | The `/api/debug/sprints` route file is deleted |
| AC-6.1.5 | The `Sprint` TypeScript interface is removed from `src/types/index.ts` |
| AC-6.1.6 | The `sprintId` field is removed from the `FeedbackItem` TypeScript interface |
| AC-6.1.7 | The `sprintId` field is removed from the `ActionItem` TypeScript interface |
| AC-6.1.8 | The `FeedbackItem` interface replaces `actionItemId?: string` with `actionItemIds: string[]` |
| AC-6.1.9 | `ActionItem` adds optional fields: `completedAt?: string` and `impactNote?: string` (if not already present) |
| AC-6.1.10 | `ActionItem.sourceFeedbackId` and `ActionItem.sourceQuote` are typed as optional (`?`) |
| AC-6.1.11 | `corepack yarn build` passes with 0 type errors after all deletions |

#### Out of Scope
- Migrating existing data in MongoDB Atlas (dev/test data can be wiped and reseeded)

---

### Epic 6.2 — Remove Sprint Model (Mongoose Schemas)

**User Story**: As a developer, I want the Mongoose schemas to match the revised TypeScript interfaces, so that no sprint-related fields are persisted to MongoDB.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-6.2.1 | `FeedbackItem` Mongoose schema removes the `sprintId` field |
| AC-6.2.2 | `FeedbackItem` Mongoose schema replaces `actionItemId: String` with `actionItemIds: { type: [String], default: [] }` |
| AC-6.2.3 | `ActionItem` Mongoose schema removes the `sprintId` field |
| AC-6.2.4 | `ActionItem` Mongoose schema adds `completedAt: { type: Date }` (optional, no default) |
| AC-6.2.5 | `ActionItem` Mongoose schema marks `sourceFeedbackId` and `sourceQuote` as not required |
| AC-6.2.6 | No Mongoose model file imports or references the deleted `Sprint` model |

---

### Epic 6.3 — Rebuild API Endpoints (Time-Window Queries)

**User Story**: As a user, I want all data queries to use time-based windows instead of sprint IDs, so that the app shows relevant data without requiring an active sprint.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-6.3.1 | `GET /api/feedback` accepts an optional `?window=7d\|30d\|all` query parameter |
| AC-6.3.2 | When `window=7d`, only feedback items with `createdAt` within the last 7 days are returned |
| AC-6.3.3 | When `window=30d`, only feedback items with `createdAt` within the last 30 days are returned |
| AC-6.3.4 | When `window=all` or no parameter, all feedback items are returned |
| AC-6.3.5 | `GET /api/actions` accepts an optional `?window=7d\|30d\|all` query parameter with identical behavior |
| AC-6.3.6 | `GET /api/feedback` no longer accepts or requires a `?sprintId` parameter |
| AC-6.3.7 | `GET /api/actions` no longer accepts or requires a `?sprintId` parameter |
| AC-6.3.8 | `POST /api/feedback` no longer writes a `sprintId` field to the document |
| AC-6.3.9 | `POST /api/actions` no longer writes a `sprintId` field to the document |
| AC-6.3.10 | All existing action status routes (`/advance`, `/regress`, `/verify`) continue to function unchanged |

---

### Epic 6.4 — Rebuild Dashboard (Time-Window Lenses)

**User Story**: As a pod member, I want to see rolling pod-level improvement metrics across three time windows, so that I can assess team health without needing an active sprint.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-6.4.1 | The dashboard renders three toggle tabs: **This Week**, **This Month**, **All-Time** |
| AC-6.4.2 | The active tab is visually distinguished (highlighted/underlined); default is **This Week** |
| AC-6.4.3 | Switching tabs re-fetches data with the corresponding `?window=7d\|30d\|all` parameter — no full page reload |
| AC-6.4.4 | The dashboard displays: total feedback submitted, feedback by category (three counts), total action items created, action items by status (four counts), completion rate (%), verification rate (%) |
| AC-6.4.5 | Completion rate = (completed + verified) / total action items × 100, shown as a percentage |
| AC-6.4.6 | Verification rate = verified / (completed + verified) × 100, shown as a percentage (shows "—" if denominator is 0) |
| AC-6.4.7 | All metrics update correctly when the time window tab is changed |
| AC-6.4.8 | The dashboard shows an Activity Feed of recent events within the selected window: feedback submissions (anonymized per Decision A6) and action item status changes |
| AC-6.4.9 | Named feedback feed entries show: "[Name] submitted feedback in '[Category]'" |
| AC-6.4.10 | Anonymous feedback feed entries show: "New feedback in '[Category]'" — no name |
| AC-6.4.11 | Action item status change feed entries show: "[Title] moved to [Status]" — no actor name |
| AC-6.4.12 | Upvote events do NOT appear in the activity feed |
| AC-6.4.13 | The dashboard no longer references sprint name, sprint status, or "No active sprint" state |
| AC-6.4.14 | The sidebar no longer shows a sprint name — it shows the pod name instead |
| AC-6.4.15 | If no data exists for the selected window, each metric shows 0 and the activity feed shows "No activity yet" |

#### Out of Scope
- Per-person contribution metrics (deferred to Scope 3)

---

### Epic 6.5 — Feedback Board (Remove Sprint Guards)

**User Story**: As a pod member, I want to submit and view feedback at any time without waiting for an admin to open a sprint, so that my observations are captured when they happen.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-6.5.1 | The feedback board is always accessible — no "sprint closed" or "no active sprint" gate |
| AC-6.5.2 | The "+ Add Feedback" button is always enabled for authenticated users |
| AC-6.5.3 | All sprint-related UI elements are removed from the feedback page (sprint name header, sprint selector dropdown) |
| AC-6.5.4 | Feedback cards are displayed in three columns: **Went Well**, **Should Try**, **Slowed Us Down** |
| AC-6.5.5 | The feedback board fetches with `?window=7d` by default (matching the dashboard default) |
| AC-6.5.6 | The Reframe Rule remains enforced: "Slowed Us Down" feedback requires a non-empty `suggestion` field before submission |
| AC-6.5.7 | A user cannot upvote their own feedback card (button disabled; tooltip on hover: "You can't upvote your own feedback") |
| AC-6.5.8 | The upvote toggle correctly adds on first click and removes on second click for all users |
| AC-6.5.9 | Anonymous feedback cards show "Anonymous" as author to all users including admin |

---

### Epic 6.6 — Convert Feedback → Action Item (Admin Flow)

**User Story**: As an admin, I want to convert any feedback card into one or more action items, so that I can close the loop between observed problems and tracked improvements.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-6.6.1 | A "→ Action" button appears on every feedback card **only** for admin users |
| AC-6.6.2 | Non-admin users never see the "→ Action" button regardless of upvote count |
| AC-6.6.3 | Clicking "→ Action" opens a modal pre-filled: `title` = feedback `content`, `description` = feedback `suggestion` (if category is "Slowed Us Down"), `sourceFeedbackId` = feedback `_id`, `sourceQuote` = feedback `content` |
| AC-6.6.4 | For "Went Well" and "Should Try" feedback, `description` is pre-filled empty (suggestion field does not apply) |
| AC-6.6.5 | The modal includes an owner dropdown populated from all users in the current pod via `GET /api/users?pod=X` |
| AC-6.6.6 | The modal includes a due date picker (date input, required) |
| AC-6.6.7 | Submitting the modal creates a new action item via `POST /api/actions` with `sourceFeedbackId`, `sourceQuote`, `ownerId`, `title`, `description`, `dueDate` |
| AC-6.6.8 | After successful creation, the feedback card displays a badge showing the action item count: "1 action" or "N actions" |
| AC-6.6.9 | If admin clicks "→ Action" on a card that already has action items, a confirmation appears: "This feedback already has N action item(s). Create another?" with Confirm / Cancel options |
| AC-6.6.10 | The `FeedbackItem` document's `actionItemIds` array is updated to include the new action item `_id` after creation |
| AC-6.6.11 | `POST /api/actions` no longer requires or accepts `sprintId` in the request body |

#### Out of Scope
- Non-admin conversion flow (deferred to Scope 3 — democratic conversion with "proposed" state)

---

### Epic 6.7 — Action Items Page (Remove Sprint Dependency + Standalone Creation)

**User Story**: As a pod member, I want to view and manage action items without sprint context, and as an admin, I want to create standalone action items not linked to any feedback.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-6.7.1 | The action items page no longer shows a sprint selector or references sprint context |
| AC-6.7.2 | `GET /api/actions` with `?window=7d\|30d\|all` returns all action items in that window, no `sprintId` filter |
| AC-6.7.3 | Action item cards with `sourceQuote` show the source quote in a **blue inset block** |
| AC-6.7.4 | Action item cards without `sourceQuote` (standalone) do not show a source quote block |
| AC-6.7.5 | Action item cards with status `verified` show the `impactNote` in an **emerald/green inset block**, always visible (no click/hover required) |
| AC-6.7.6 | The due date displays as a relative label: "Due in N days" (future) or "Overdue" (past) |
| AC-6.7.7 | Admin users see a "+ New Action Item" button that opens a creation modal with: `title` (required), `description` (optional), owner dropdown, due date picker |
| AC-6.7.8 | Standalone action items created from this modal have `sourceFeedbackId: null` and `sourceQuote: null` |
| AC-6.7.9 | Status advance and regress buttons function as before; `verified` cannot be regressed |
| AC-6.7.10 | Advancing to `completed` writes `completedAt` timestamp on the action item document |
| AC-6.7.11 | Regressing from `completed` clears `completedAt` on the action item document |

---

### Epic 6.8 — Pod Settings Page (Replaces Sprint Setup)

**User Story**: As an admin, I want a Pod Settings page where I can manage pod membership and moderate feedback, so that I can maintain data quality without sprint management overhead.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-6.8.1 | A `/pod-settings` route exists and renders a Pod Settings page |
| AC-6.8.2 | The Pod Settings page is accessible only to admin users — non-admin users who navigate to `/pod-settings` are redirected to `/dashboard` |
| AC-6.8.3 | The sidebar nav shows "Pod Settings" with a settings icon for admin users only; non-admins do not see this nav item |
| AC-6.8.4 | The Pod Settings page displays a list of all users in the current pod (name, username, pod, isAdmin status) |
| AC-6.8.5 | The `/sprint-setup` route is removed; navigating to it redirects to `/dashboard` |
| AC-6.8.6 | Admin can delete any feedback item from the Pod Settings page (with a confirmation prompt) |
| AC-6.8.7 | Deleting a feedback item calls `DELETE /api/feedback/[id]` and removes it from the list without page reload |
| AC-6.8.8 | `DELETE /api/feedback/[id]` is an admin-only route — returns 403 if caller is not admin |
| AC-6.8.9 | The Pod Settings page shows the pod name as the page heading |

#### Out of Scope
- Add/remove pod members (user management requires auth system — deferred)
- Edit feedback content (deferred to Scope 3)

---

### Epic 6.9 — Shell / Navigation Update

**User Story**: As a user, I want the sidebar navigation to reflect the new always-on structure, so that I can navigate to the correct pages without seeing sprint-related UI.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-6.9.1 | Sidebar nav items: **Dashboard** (`/dashboard`), **Feedback Board** (`/feedback`), **Action Items** (`/action-items`), **Pod Settings** (`/pod-settings` — admin only) |
| AC-6.9.2 | The sidebar footer shows: user avatar placeholder, user name, pod name |
| AC-6.9.3 | Sprint name is not displayed anywhere in the shell or sidebar |
| AC-6.9.4 | The `/sprint-setup` nav link is removed |
| AC-6.9.5 | All existing nav links (`/dashboard`, `/feedback`, `/action-items`) continue to work |
| AC-6.9.6 | The logout button remains in the sidebar footer and functions as before |

---

## DEV Session Breakdown

### Session 1 — Data Layer Teardown + API Rebuild
**Goal**: Remove all sprint infrastructure; rebuild API with time-window queries. App should compile but UI may be broken.

| Task | File(s) | Est. Lines |
|---|---|---|
| Delete Sprint model + route files | `src/lib/models/Sprint.ts`, `src/app/api/sprints/` (entire folder), `src/app/api/debug/sprints/` | Delete |
| Update `src/types/index.ts` | Remove `Sprint` interface, update `FeedbackItem` and `ActionItem` per scope doc | ~−20 / +10 |
| Update `FeedbackItem` Mongoose schema | Remove `sprintId`, replace `actionItemId` with `actionItemIds[]` | ~10 |
| Update `ActionItem` Mongoose schema | Remove `sprintId`, add `completedAt`, mark source fields optional | ~10 |
| Rebuild `GET /api/feedback` | Add `?window` param, replace `sprintId` filter with `createdAt` date range | ~30 |
| Rebuild `GET /api/actions` | Add `?window` param, replace `sprintId` filter with `createdAt` date range | ~30 |
| Update `POST /api/feedback` | Remove `sprintId` from body parsing and document write | ~−5 |
| Update `POST /api/actions` | Remove `sprintId`; add `sourceFeedbackId`, `sourceQuote` as optional | ~−5 / +5 |
| Add `DELETE /api/feedback/[id]` | Admin-only delete route with 403 guard | ~30 |
| Update `PATCH /api/actions/[id]/advance` | Write `completedAt` when transitioning to `completed` | ~+5 |
| Update `PATCH /api/actions/[id]/regress` | Clear `completedAt` when regressing from `completed` | ~+5 |
| Update `PATCH /api/feedback/[id]/upvote` | No sprint check needed — verify still works | ~0 |
| **Gate**: `corepack yarn build` 0 errors | | |

### Session 2 — Dashboard + Feedback Board + Shell
**Goal**: Dashboard with time-window toggle, feedback board without sprint guards, shell updated.

| Task | File(s) | Est. Lines |
|---|---|---|
| Rebuild `src/app/dashboard/page.tsx` | Time-window tabs (7d/30d/all), metrics grid, activity feed | ~150 |
| Update `src/services/feedbackService.ts` | Pass `?window` param; remove sprint params | ~20 |
| Update `src/services/actionService.ts` | Pass `?window` param; remove sprint params | ~20 |
| Delete `src/services/sprintService.ts` | No longer needed | Delete |
| Update `src/app/feedback/page.tsx` | Remove sprint selector, sprint guards; default to `window=7d` | ~−40 / +10 |
| Update `src/components/layout/Shell.tsx` | Remove sprint name, remove `/sprint-setup` nav; add `/pod-settings` for admin | ~30 |
| **Gate**: `corepack yarn test` + `corepack yarn build` | |

### Session 3 — Action Items + Convert Flow + Pod Settings
**Goal**: Action items page fully de-sprinted, convert feedback → action flow, Pod Settings page, verified impact display.

| Task | File(s) | Est. Lines |
|---|---|---|
| Update `src/app/action-items/page.tsx` | Remove sprint selector; add window param; standalone create modal for admin | ~80 |
| Update `src/components/FeedbackCard.tsx` | Add "→ Action" button (admin only), action count badge, confirmation prompt | ~50 |
| Create convert-to-action modal component | `src/components/ConvertToActionModal.tsx` | ~100 |
| Update `src/components/ActionCard.tsx` (or inline) | Emerald inset for verified impact note, blue inset for source quote, "Due in N days" label | ~40 |
| Create `src/app/pod-settings/page.tsx` | Admin-only page, user list, feedback moderation list with delete | ~120 |
| Add redirect from `/sprint-setup` | `src/app/sprint-setup/page.tsx` → replace with `redirect('/dashboard')` | ~5 |
| **Gate**: `corepack yarn test` + `corepack yarn build` | |

---

## Sprint 6 Definition of Done

- [ ] All AC-6.x acceptance criteria pass
- [ ] `corepack yarn build` — 0 errors
- [ ] `corepack yarn test` — 0 failures
- [ ] `corepack yarn tsc --noEmit` — 0 errors
- [ ] No `sprintId` references remain anywhere in `src/` (grep confirms)
- [ ] No import of `Sprint` model or `sprintService` anywhere in `src/` (grep confirms)
- [ ] `/sprint-setup` redirects to `/dashboard`
- [ ] `/pod-settings` renders for admin, redirects non-admin to `/dashboard`
- [ ] Dashboard shows correct metrics for all three time windows
- [ ] Feedback board is always open and submittable
- [ ] Convert feedback → action flow works end-to-end for admin
- [ ] Verified impact note renders in emerald inset on action cards
- [ ] Committed and merged to main

---

## Smoke Test Checklist

| Step | Action | Expected Result |
|---|---|---|
| 1 | Visit `/` fresh (no session) | Registration/Sign-in renders |
| 2 | Sign in as existing user | Redirected to `/dashboard` |
| 3 | Dashboard loads with "This Week" tab active | Metrics render (zeros are fine if no recent data) |
| 4 | Switch to "This Month" then "All-Time" | Metrics update; no page reload |
| 5 | Navigate to `/feedback` | Board renders; "+ Add Feedback" enabled |
| 6 | Submit a "Went Well" feedback | Card appears in Went Well column |
| 7 | Submit a "Slowed Us Down" without suggestion | Submit blocked (Reframe Rule) |
| 8 | Submit a "Slowed Us Down" with suggestion | Card appears |
| 9 | Upvote another user's feedback card | Count increments |
| 10 | Upvote own card | Button disabled; tooltip visible on hover |
| 11 | Click upvote again on already-upvoted card | Upvote removed; count decrements |
| 12 | Sign in as admin user | Pod Settings appears in sidebar nav |
| 13 | Click "→ Action" on a feedback card | Convert modal opens pre-filled |
| 14 | Submit convert modal | Action created; badge "1 action" appears on card |
| 15 | Click "→ Action" on same card again | Confirmation prompt: "already has 1 action item. Create another?" |
| 16 | Navigate to `/action-items` | Actions listed; source quote shown in blue inset |
| 17 | Advance an action to Completed | `completedAt` set; card shows Completed status |
| 18 | Verify an action with impact note | Status = Verified; emerald inset with note always visible |
| 19 | Regress an In-Progress action | Status moves back to Open |
| 20 | Attempt to regress a Verified action | Button absent or disabled |
| 21 | Admin: click "+ New Action Item" on actions page | Modal opens with empty form |
| 22 | Create standalone action item | Appears without source quote block |
| 23 | Navigate to `/pod-settings` as admin | Page renders with pod name heading and user list |
| 24 | Admin: delete a feedback item from Pod Settings | Item removed from list; no page reload |
| 25 | Navigate to `/sprint-setup` | Redirected to `/dashboard` |
| 26 | Sign in as non-admin | Pod Settings not in sidebar |
| 27 | Non-admin: navigate to `/pod-settings` directly | Redirected to `/dashboard` |
| 28 | Dashboard activity feed | Shows feedback submissions and action status changes; no upvote events |
