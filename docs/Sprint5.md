# Sprint 5 — Polish, Error Handling & Smoke Test

**Theme**: Cross-cutting concerns, edge cases, smoke test, GitHub push  
**Scope**: Scope 2 MVP  
**DEV Sessions**: 1  
**Prerequisite**: Sprints 1–4 complete and merged

---

## Sprint Goal
The full Scope 2 MVP is stable, handles all edge cases gracefully, passes all 18 REVIEWER checks, and is pushed to GitHub. The app is ready for real team use.

---

## Epics & User Stories

### Epic 5.1 — Error Handling & Edge Cases

**User Story**: As a user, I want the app to handle unexpected states gracefully, so that network errors, missing data, or failed API calls never crash the app.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-5.1.1 | If any API call fails (network error or 500), the app shows an inline error message and does not crash |
| AC-5.1.2 | All empty states render correctly on first load (no sprint, no feedback, no actions) |
| AC-5.1.3 | If a user navigates directly to `/dashboard` without a `sessionStorage` identity, they are redirected to `/` |
| AC-5.1.4 | All forms show inline validation messages for required fields before submission |
| AC-5.1.5 | The sidebar correctly highlights the active route |

---

### Epic 5.2 — Accessibility & data-testid Pass

**User Story**: As a developer, I want all interactive elements to have test IDs and ARIA labels, so that future automated testing requires no refactoring.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-5.2.1 | Every `<button>` has a `data-testid` following the pattern `[page]-[action]-btn` |
| AC-5.2.2 | Every `<input>` and `<select>` has a `data-testid` and an associated `<label>` |
| AC-5.2.3 | All modals have `role="dialog"` and `aria-labelledby` pointing to the modal title |
| AC-5.2.4 | Modals trap focus (Tab stays within modal while open) |
| AC-5.2.5 | Closing a modal (Escape or × button) returns focus to the element that opened it |

---

### DEV Session 1 — Polish + Hardening

**Files to touch** (surgical edits — ~200 lines total):

| File | Change | Lines (est.) |
|---|---|---|
| `src/lib/db.ts` | Add connection error handling — log and throw structured error on connect failure | ~+10 |
| `src/app/api/*/route.ts` (all routes) | Wrap all handlers in try/catch; return `{ error: string }` with correct HTTP status on failure | ~+5 per route (~40 total) |
| `src/app/dashboard/page.tsx` | Add auth redirect guard (if no user → redirect to `/`) | ~+5 |
| `src/app/feedback/page.tsx` | Add auth redirect guard | ~+5 |
| `src/app/actions/page.tsx` | Add auth redirect guard | ~+5 |
| `src/app/sprint-setup/page.tsx` | Add auth redirect guard | ~+5 |
| All components | Add `data-testid` to every interactive element | ~+2 per element (~30 total) |
| All modals | Add `role="dialog"`, `aria-labelledby`, focus trap logic | ~+10 per modal (~50 total) |
| `src/__tests__/errorHandling.test.tsx` | API failure handling (mock fetch failures), redirect guard, empty states | ~80 |
| **Total** | Surgical edits across small files | ~200 lines |

> **Note**: Because these are small edits spread across many files, keep the session tightly scoped. Do NOT refactor any logic — additive changes only.

---

## Sprint 5 Definition of Done

- [ ] All AC-5.x acceptance criteria pass
- [ ] All 18 REVIEWER checklist points pass
- [ ] `corepack yarn build` — 0 errors
- [ ] `corepack yarn test` — 0 failures
- [ ] `corepack yarn tsc --noEmit` — 0 errors
- [ ] Full Scope 2 user journey works end-to-end in browser (smoke test checklist below)
- [ ] No console errors in browser dev tools
- [ ] All `data-testid` attributes present on interactive elements
- [ ] Committed: `git commit -m "Sprint 5 complete: Polish + Scope 2 MVP"`
- [ ] Pushed: `git push origin main`
- [ ] Smoke-tested in Replit (pull from GitHub → run → verify)

---

## Scope 2 Smoke Test Checklist

Run through this manually in the browser after the final push:

| Step | Action | Expected Result |
|---|---|---|
| 1 | Visit `/` with empty sessionStorage | Registration form renders |
| 2 | Register as User 1 (any name/username/pod) | Redirected to `/dashboard`; user is admin |
| 3 | Register as User 2 (different browser / incognito tab) | `isAdmin: false`; both users visible in Atlas |
| 4 | Go to `/sprint-setup` as admin | Sprint form renders with edit controls |
| 5 | Create a sprint (name, goal, dates) | Sprint appears on Dashboard |
| 6 | Go to `/feedback`, click "+ Add Feedback" | Modal opens |
| 7 | Submit feedback to "What Went Well" | Card appears in correct lane |
| 8 | Submit feedback to "What Slowed Us Down" without suggestion | Submit blocked (Reframe Rule) |
| 9 | Submit feedback to "What Slowed Us Down" with suggestion | Card appears |
| 10 | Upvote a card | Count increments; persists on refresh |
| 11 | Try to upvote own feedback | Button disabled or no-op |
| 12 | Click "Convert to Action" on a "What Should We Try" card | Modal pre-filled |
| 13 | Save action | Appears on `/actions` with status "Open" |
| 14 | Click "Advance Status" twice | Status moves Open → In Progress → Completed |
| 15 | Click "Verify Impact", enter statement, save | Status = Verified; note displayed on card |
| 16 | Check Dashboard | Completion rate updated |
| 17 | Go to `/sprint-setup`, close the retro | Feedback submission disabled on `/feedback` |
| 18 | Disconnect network (DevTools), try submitting feedback | Inline error message shown; no crash |
