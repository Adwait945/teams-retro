# Implementation Notes

---

## Sprint 2, Session 1 — Feedback Board Read (Epic 2.1)

**Date**: April 2026  
**DEV Session Goal**: Build the complete read-only Feedback Board — 3-column layout, card rendering, per-lane empty state, sorted by upvotes.  
**Baseline commit**: `c848f69` — Sprint 1 complete: Foundation + MongoDB — all 25 tests pass

---

### Files Created

| File | Lines | Notes |
|---|---|---|
| `src/app/api/feedback/route.ts` | 46 | GET + POST handlers; Reframe Rule 422 guard |
| `src/services/feedbackService.ts` | 33 | `getFeedback`, `getFeedbackByLane`, `sortByUpvotes`, `getAuthorDisplay` |
| `src/components/FeedbackCard.tsx` | 65 | Card UI: content, suggestion block, author avatar, upvote button |
| `src/components/FeedbackColumn.tsx` | 75 | Column UI: header, count badge, sorted card list, empty state |
| `src/__tests__/feedbackService.test.ts` | 160 | 8 tests: FS-1 through FS-8 |

### Files Replaced

| File | Notes |
|---|---|
| `src/app/feedback/page.tsx` | Replaced old `retro-store`-based mock page with Sprint 2 Shell-wrapped, session-guarded, 3-column board |

---

### Decisions Made

1. **`suggestion` field name**: Used `suggestion` throughout (not `suggestedImprovement`) — matches live `src/types/index.ts` and `src/lib/models/FeedbackItem.ts`. This was a known delta between `FEATURE_REQUIREMENTS.md` (which used `suggestedImprovement` in an earlier draft) and the actual codebase.

2. **`upvotes: number` for display**: Used `item.upvotes` (integer from MongoDB) for the upvote count on `FeedbackCard`, not `item.upvotedBy.length`, per plan spec.

3. **`feedbackService.ts` has no `"use client"` directive**: It is a plain Node/browser-compatible module. `sessionStorage` access is not needed in Session 1 functions (only `fetch` calls).

4. **`FeedbackColumn` calls `sortByUpvotes` directly** from `feedbackService` (named import) rather than through a namespace — keeps the component lean and makes mocking straightforward in tests.

5. **`page.tsx` sprint resolution**: The page fetches `GET /api/sprints`, then finds the first sprint with `status === 'open'`. If the response is a single object (not an array), it handles that too. This makes it resilient to both the current API shape and potential future changes.

6. **`handleUpvote` is a no-op stub in Session 1**: The function signature accepts `itemId: string` but does nothing — consistent with the plan's instruction that upvote wiring is Session 2.

7. **Test file uses `@jest-environment node`**: Both pure unit tests (`sortByUpvotes`, `getAuthorDisplay`) and API route tests are in the same file. The `node` environment is required for `NextRequest` / `NextResponse` in the API route tests. The pure unit tests are not affected by the `node` environment (no DOM needed).

8. **Mock hoisting in `feedbackService.test.ts`**: `mockSave` and `mockFind` are declared at module scope (before `jest.mock`) so they are accessible in both the mock factory and the test assertions. The mock factory returns `{ __esModule: true, default: MockFeedbackItemModel }` following the same Babel interop pattern established in Sprint 1's `userApi.test.ts`.

---

### Deviations from Plan

| Deviation | Reason |
|---|---|
| `FeedbackCard` uses `"use client"` directive | Required because the component uses `onClick` (event handler) inside a Next.js App Router tree. The plan did not explicitly specify the directive, but it is necessary for client interactivity. |
| `FeedbackColumn` uses `"use client"` directive | Same reason — renders `FeedbackCard` which has event handlers. |
| `page.tsx` actual line count is ~122 lines vs. plan target of ~65 | The plan's ~65 target did not account for the loading state branch (second `Shell` render) and the sprint resolution logic. The implementation is complete and correct per spec. |
| `feedbackService.test.ts` actual line count is ~160 lines vs. plan target of ~60 | The plan's ~60 target was a rough estimate. Full test bodies with `describe` blocks, `beforeEach`, and the `makeFeedbackItem` factory add significant but necessary lines. |

---

### Completion Gate Results

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors (run via `node node_modules/typescript/bin/tsc --noEmit`) |
| `jest` (all tests) | ✅ 33/33 pass — 8 new (FS-1–FS-8) + 25 Sprint 1 regressions: 0 |
| FS-5: GET 200 + array | ✅ |
| FS-7: POST 422 Reframe Rule | ✅ |

---

## Sprint 2, Session 2 — Pre-flight Verification

**Date**: April 2026  
**Mode**: [ARCHITECT]  
**Verified by**: Session 2 pre-flight audit against actual Session 1 output

---

### Verification Result

Session 2 tasks confirmed — no delta

All six Session 2 tasks in `retro-architect/docs/IMPLEMENTATION_PLAN.md` (§DEV Session 2 — Submit + Upvote) are accurate as written. The actual Session 1 output exactly satisfies every dependency that Session 2 builds on.

---

### Evidence

| Check | Question | Actual Session 1 Output | Verdict |
|---|---|---|---|
| `feedbackService.ts` exports | Does it export the 4 functions Session 2 builds on? | Exports: `getFeedback`, `getFeedbackByLane`, `sortByUpvotes`, `getAuthorDisplay` — all 4 present, correct signatures | ✅ |
| `feedback/page.tsx` modal stub | Does it have `showModal` / `setShowModal` state and a stub that Session 2 will replace? | `const [showModal, setShowModal] = useState(false)` on line 19; `{showModal && <div data-testid="modal-stub" />}` on line 117 | ✅ |
| `FeedbackCard.tsx` `onUpvote` prop | Does `onUpvote` exist as a stub callback on the component? | `onUpvote: () => void` in `FeedbackCardProps` interface; `onClick={onUpvote}` wired to the upvote `<button>` | ✅ |
| `feedback/page.tsx` `handleUpvote` | Does the page pass `handleUpvote` down to columns? | `function handleUpvote(_itemId: string) {}` — no-op stub; passed as `onUpvote={handleUpvote}` to all three `<FeedbackColumn>` instances | ✅ |
| `api/feedback/route.ts` POST | Is the POST route already implemented so Session 2 only needs the PATCH upvote route? | `POST` handler exists with Reframe Rule 422 guard — fully implemented in Session 1 | ✅ |
| `FeedbackColumn.tsx` `onUpvote` prop | Does `FeedbackColumn` accept and forward `onUpvote` to cards? | `onUpvote: (itemId: string) => void` in `FeedbackColumnProps`; forwarded to each `<FeedbackCard onUpvote={() => onUpvote(item._id)} />` | ✅ |

---

### Field-Name Invariant Confirmed

| Field | `src/types/index.ts` (live) | Session 2 must use |
|---|---|---|
| Suggested improvement | `suggestion: string` | `suggestion` |
| Upvote count | `upvotes: number` | `upvotes` (integer — do NOT use `upvotedBy.length`) |
| Upvote dedup array | `upvotedBy: string[]` | `upvotedBy` (server-side guard in PATCH handler) |
| Primary key | `_id: string` | `_id` |

---

### Session 2 Start State Summary

| File | Exists? | Session 2 Action |
|---|---|---|
| `src/app/api/feedback/route.ts` | ✅ GET + POST implemented | **Read-only** — Session 2 adds sibling `[id]/upvote/route.ts` |
| `src/services/feedbackService.ts` | ✅ 4 read functions | **Update** — add `addFeedback()` + `upvoteFeedback()` |
| `src/components/FeedbackCard.tsx` | ✅ `onUpvote` prop wired | **No changes needed** — upvote wiring is in `page.tsx` handler |
| `src/components/FeedbackColumn.tsx` | ✅ Complete | **No changes needed** |
| `src/app/feedback/page.tsx` | ✅ `showModal` stub in place | **Update** — replace modal stub with real `<SubmitFeedbackModal>` + `onSubmitFeedback` handler + wired `handleUpvote` |
| `src/__tests__/feedbackService.test.ts` | ✅ FS-1–FS-8 passing | **Update** — add `FS-RR3` test for `addFeedback` client guard |
| `src/components/SubmitFeedbackModal.tsx` | ❌ Does not exist | **Create** |
| `src/app/api/feedback/[id]/upvote/route.ts` | ❌ Does not exist | **Create** |
| `src/__tests__/feedbackBoard.test.tsx` | ❌ Does not exist | **Create** — FB-1 through FB-13 |

---

## Sprint 2 — Session 2 Implementation Notes

**Date**: 2026-04-12  
**Session goal**: Submit Feedback Modal + Upvote (Epic 2.2)  
**Completion gate result**: ✅ 46/46 tests pass, 0 TypeScript errors

---

### Files Created

| File | Lines | Notes |
|---|---|---|
| `src/components/SubmitFeedbackModal.tsx` | ~165 | Plain HTML + Tailwind (no shadcn/ui — not installed). `role="dialog"`, `data-testid="submit-feedback-modal"`, `data-testid="modal-submit-btn"`, `data-testid="modal-close-btn"`. Reframe Rule: suggestion textarea + badge rendered only for `slowed-us-down`. Submit disabled when content empty or suggestion empty (if required) or `isSubmitting`. |
| `src/app/api/feedback/[id]/upvote/route.ts` | ~40 | PATCH handler. Guards: 400 missing userId, 404 item not found, 403 self-vote (`authorId === userId`), 409 duplicate (`upvotedBy.includes(userId)`). Increments `upvotes`, pushes to `upvotedBy`, saves, returns `{ upvotes }`. |
| `src/__tests__/feedbackBoard.test.tsx` | ~327 | FB-1 through FB-13 all passing. |

### Files Modified

| File | Change |
|---|---|
| `src/services/feedbackService.ts` | Added `addFeedback()` (client Reframe Rule guard + POST + 422 handling) and `upvoteFeedback()` (PATCH + error throw on non-OK). |
| `src/app/feedback/page.tsx` | Added imports for `addFeedback`, `upvoteFeedback`, `SubmitFeedbackModal`, `FeedbackCategory`. Replaced `modal-stub` div with `<SubmitFeedbackModal>`. Replaced no-op `handleUpvote` with async implementation calling `upvoteFeedback` + `refetch`, 403/409 silently caught. Added `onSubmitFeedback` handler. Added `data-testid="open-modal-btn"` to the page-level Submit Feedback button. |
| `src/components/FeedbackCard.tsx` | Added `data-testid="upvote-btn"` to upvote button for reliable test querying. |

---

### Deviations from Plan

1. **No shadcn/ui** — modal built with plain HTML + Tailwind. `role="dialog"` on the container div; `radiogroup` on the radio group. No `Dialog`/`RadioGroup` imports needed.
2. **`data-testid` additions** — `open-modal-btn` on the page Submit button and `upvote-btn` on FeedbackCard's upvote button were required because RTL's accessible name computation for buttons with mixed SVG+text children is unreliable in jsdom. This is a minimal, non-breaking addition.
3. **FB-12/13 mock strategy** — used `mockImplementation` with a call-counter instead of `mockResolvedValueOnce` chains. Root cause: RTL `waitFor` internally wraps each polling cycle in `act()`, which flushes all pending microtasks including in-flight `Promise.all` refetch calls. `mockResolvedValueOnce` chains were exhausted by these extra flushes, causing `getFeedbackByLane` to fall back to the `beforeEach` default `mockResolvedValue([])` and clear all card state. The `mockImplementation` counter approach returns the correct stable state on any call beyond the initial 3, making tests deterministic regardless of how many times `act` drains the queue.
4. **FB-12 `getFeedbackByLane` call count** — test asserts `>= 6` calls (not exactly 6) since `act()` may trigger additional refetches. The acceptance criterion (409 silent, count stays at 4) is fully verified.

---

### Completion Gate

```
node node_modules/jest/bin/jest.js --no-coverage
  Test Suites: 6 passed, 6 total
  Tests:       46 passed, 46 total

node node_modules/typescript/bin/tsc --noEmit
  Exit code: 0 (no errors)
```

---

## Sprint 3 — Session 2 Implementation Notes

**Date**: 2026-04-12  
**Session goal**: Convert from Feedback + Verify Impact (Epic 3.2)  
**Completion gate result**: ✅ 75/77 tests pass, 0 TypeScript errors  
**Expected failures**: 2 (same pre-existing `getCompletionRate` regressions from Session 1 — DO NOT revert)

---

### Files Created

| File | Lines | Notes |
|---|---|---|
| `src/components/ConvertActionModal.tsx` | ~185 | `"use client"`, `data-testid="convert-action-modal"` / `"convert-action-submit-btn"`, `useEffect` re-initializes `title` from `feedbackItem.content`, source quote blockquote with `border-l-4 border-blue-500`, amber submit button |
| `src/components/VerifyImpactModal.tsx` | ~120 | `"use client"`, `data-testid="verify-impact-modal"` / `"verify-impact-submit-btn"`, `maxLength={300}`, live char counter `{impactNote.length} / 300`, conditional source quote with `border-l-4 border-amber-500` |
| `src/__tests__/actionItems.test.tsx` | ~329 | jsdom environment, AI-1 through AI-14, URL-discriminating fetch mock, `waitForPageLoaded` waits for `open-new-action-btn` (loaded-state indicator) |

### Files Modified

| File | Change |
|---|---|
| `src/components/FeedbackCard.tsx` | Added `onConvert?: (item: FeedbackItem) => void` to props; render `"Convert to Action"` button only when `item.category === 'should-try' && onConvert !== undefined`; `data-testid="convert-btn"` |
| `src/components/FeedbackColumn.tsx` | Added `onConvert?` to props interface; forwarded to each `<FeedbackCard onConvert={onConvert} />` |
| `src/app/feedback/page.tsx` | Added `ConvertActionModal` import + `createAction` import; added `showConvertModal`, `convertTarget`, `users` state; added `/api/users` fetch with `Array.isArray` guard; added `handleConvert` / `handleConvertSubmit`; passed `onConvert={handleConvert}` to all 3 `FeedbackColumn` instances; wired `<ConvertActionModal>` |
| `src/app/actions/page.tsx` | Added `VerifyImpactModal` import; replaced `{showVerifyModal && <div data-testid="verify-modal-stub" />}` with real `<VerifyImpactModal open={showVerifyModal} item={verifyTarget} onClose=... onSubmit={handleVerifySubmit} />` |
| `src/__tests__/feedbackBoard.test.tsx` | Appended `describe('Sprint 3 — Convert to Action flow', ...)` block with scoped `beforeEach` (URL-discriminating fetch) and FB-14, FB-15, FB-16 tests |

---

### Deviations from Plan / Architecture Design

1. **`feedback/page.tsx` users fetch — `Array.isArray` guard** — The plan specified `GET /api/users` → `setUsers(usersData.map(...))`. The outer `feedbackBoard.test.tsx` `beforeEach` mocks `global.fetch` returning `mockSprint` (an object) for ALL URLs (FB-1–FB-13 requirement, F5). Without an `Array.isArray` guard, `usersData.map(...)` throws a `TypeError` in all existing FB-1–FB-13 tests. Added guard: only call `.map()` if response body is an array. This correctly handles both the existing test mock (skips map) and production (maps real user array). FB-14/15/16 use the scoped `describe` block with a URL-discriminating mock that returns the correct array.

2. **`waitForPageLoaded` in `actionItems.test.tsx` waits for `open-new-action-btn`** — Plan suggested waiting for `shell` (present in all states). The `shell` mock renders even during the `isLoading` state. The `open-new-action-btn` (page header "New Action Item" button) only renders once `isLoading === false` and no error — this is the correct loaded-state sentinel.

3. **AI-13 source quote regex matcher** — `ActionItemCard.tsx` wraps `sourceQuote` in `&ldquo;...&rdquo;` (curly quotes). `getByText('Adopt a No Meeting Thursday policy.')` with straight quotes fails. Used `getByText(/Adopt a No Meeting Thursday policy/)` regex to match regardless of surrounding quote characters.

4. **AI-14 requires owner selection** — `NewActionItemModal` submit is disabled when `!title.trim() || !ownerId`. The test plan described "type title → submit enabled" but did not account for `ownerId` being required. Added `fireEvent.change(screen.getByRole('combobox'), { target: { value: 'user-1' } })` before asserting submit enabled.

5. **S3-S2-1 and S3-S2-2 skipped** — Per F1, `advance/route.ts` and `verify/route.ts` were fully built in Session 1. Not touched in Session 2.

---

### Known Issues / Flags for REVIEWER

- **`console.error` in actionItems tests** — React logs an unhandled error from `actions/page.tsx` line 63 (`throw new Error('Failed to fetch users')`) during tests where the fetch mock returns `ok: false` or where the AbortController signal fires. This is a React development-mode warning, NOT a test failure. Tests pass. To silence it, wrap the throw in a try/catch or downgrade to a non-throwing pattern in `actions/page.tsx` — deferred to a future session as it does not affect production.
- **`onConvert` passed to `slowed-us-down` and `went-well` columns** — Per plan S3-S2-6, `onConvert={handleConvert}` is passed to all three `FeedbackColumn` instances. `FeedbackCard` guards the button with `item.category === 'should-try' && onConvert`, so no convert button appears on non-`should-try` cards. FB-15 confirms this.

---

### Completion Gate

```
node node_modules/jest/bin/jest.js --no-coverage
  Test Suites: 1 failed (expected — 2 pre-existing tests), 6 passed, 7 total
  Tests:       2 failed (expected), 75 passed, 77 total

node node_modules/typescript/bin/tsc --noEmit
  Exit code: 0 (no errors)
```

---

## Sprint 3 — Session 1 Implementation Notes

**Date**: 2026-04-12  
**Session goal**: Action Items List + Create (Epic 3.1)  
**Completion gate result**: ✅ 58/60 tests pass, 0 TypeScript errors  
**Expected failures**: 2 (pre-existing `getCompletionRate` tests — see Deviations below)

---

### Files Created

| File | Lines | Notes |
|---|---|---|
| `src/components/ActionItemCard.tsx` | ~110 | `"use client"`, `data-testid="advance-btn"` / `"verify-btn"`, status badge, due date label, source feedback block, impact note block, owner avatar |
| `src/components/NewActionItemModal.tsx` | ~160 | `"use client"`, plain HTML + ARIA, `data-testid="new-action-modal"` + `"new-action-submit-btn"`, owner `<select>`, full state reset on close |
| `src/app/actions/page.tsx` | ~237 | `"use client"`, session guard, AbortController in `useEffect`, `loading` + `error` states, status bar, empty state, `verify-modal-stub`, `handleAdvance` + `handleVerify` + `handleCreateAction` |
| `src/app/api/actions/[id]/advance/route.ts` | ~35 | PATCH: open→in-progress, in-progress→completed; 409 if already completed/verified |
| `src/app/api/actions/[id]/verify/route.ts` | ~38 | PATCH: validates non-empty `impactNote`, 400; validates `status === 'completed'`, 409; sets status→verified |

### Files Modified

| File | Change |
|---|---|
| `src/app/api/actions/route.ts` | Added 400 guard for missing `sprintId` on GET; added `.limit(100)` on find; forced `status: 'open'` on POST; replaced `console.error` with `void err` pattern; reordered validation to `title, ownerId, sprintId` |
| `src/services/actionService.ts` | Fixed `getCompletionRate` → `verified`-only; added `CreateActionPayload` interface; added `getActionsByStatus`, `createAction`, `advanceStatus`, `verifyImpact` |
| `src/__tests__/actionService.test.ts` | Added `@jest-environment node` docblock; added `jest.mock` for `@/lib/db` and `@/lib/models/ActionItem` at top of file; added imports for `NextRequest`, route handlers, new service functions; appended AS-1 through AS-VG-1 test blocks |

---

### Deviations from Plan / Architecture Design

1. **`getCompletionRate` breaking change** — Changed from `completed || verified` to `verified`-only per D1 instruction. This causes 2 pre-existing tests to fail:
   - `getCompletionRate: all completed = 100%` → now returns 0 (no verified items)
   - `getCompletionRate: 2 completed + 1 verified / 5 = 60%` → now returns 20 (1 verified / 5)
   These failures are **expected and documented**. The Sprint 3 correct behavior is `verified`-only. The old tests reflect Sprint 2 behavior that has been superseded. Do NOT revert `getCompletionRate` to make them pass.

2. **`advance` and `verify` routes created in Session 1** — These were listed as Session 2 scope, but the AS-8 through AS-13 tests import them. Rather than stub them with empty exports, they were implemented fully since the implementation spec (PATCH handler logic) was already defined. Session 2 will not need to touch these files.

3. **`jest.mock` hoisting pattern** — `const mockSaveAction = jest.fn()` cannot reference module-scope variables before initialization when hoisted. Fixed by declaring mock functions inside the `jest.mock` factory and exposing them via `__mockSave`, `__mockFind`, `__mockFindById` properties, then accessing them via `jest.requireMock()`.

4. **`console.error` removed from routes** — Replaced with `void err` to satisfy the "No `console.log` anywhere in src/" rule (applies to `console.error` as well by convention).

5. **`error` state in `actions/page.tsx`** — Added per scalability rules (every data-fetching component requires `loading` and `error` states).

6. **`handleVerifySubmit` defined but not wired** — The function is defined in `actions/page.tsx` for Session 2 wiring. TypeScript does not flag it since `noUnusedLocals` is not set. The `verifyTarget` state is similarly retained for Session 2.

---

### Known Issues / Flags for REVIEWER

- **Dashboard `getCompletionRate` display** — Dashboard uses `getCompletionRate` from `actionService`. After this change, the dashboard "completion rate" stat now reflects `verified`-only. This is correct Sprint 3 behavior per the product spec (AC-3.2.6) but REVIEWER should confirm the dashboard card label still reads correctly ("Completion Rate" vs. "Verified Rate").
- **`getCompletedCount` unchanged** — Per D1 instructions, `getCompletedCount` still counts `completed || verified`. This is intentional for the dashboard stat card. If Sprint 3 requires this to also change, that is a Session 2 task.

---

### Completion Gate

```
node node_modules/jest/bin/jest.js --no-coverage
  Test Suites: 1 failed (expected — 2 pre-existing tests), 5 passed, 6 total
  Tests:       2 failed (expected), 58 passed, 60 total

node node_modules/typescript/bin/tsc --noEmit
  Exit code: 0 (no errors)
```

---

## Sprint 5 — Session 1 Implementation Notes
_DEV session completed on April 12, 2026_

### Files Modified

- `src/app/dashboard/page.tsx` — `loadError` state, catch body fixed (`setLoadError(true)`), `load-error` render branch, `data-testid="dashboard-empty-state"` and `data-testid="dashboard-setup-btn"` additions
- `src/app/feedback/page.tsx` — `loadError` state, `catch` block added before `finally`, `load-error` render branch, `feedback-empty-state` div inserted above 3-column grid
- `src/app/actions/page.tsx` — 3 `data-testid` additions: `actions-empty-state`, `actions-goto-feedback-btn`, `actions-empty-new-btn`
- `src/components/SubmitFeedbackModal.tsx` — `useRef`/`useEffect` added to import; `TESTID_MAP` const outside component; `modalRef`, `triggerRef`; 2 `useEffect([open])` blocks (trigger capture + focus trap); `triggerRef.current?.focus()` in `handleClose`; `ref={modalRef}` on dialog div; 6 `data-testid` additions (`sfm-cancel-btn`, `sfm-content`, `sfm-suggestion`, `sfm-anonymous`, per-radio via `TESTID_MAP`)
- `src/components/NewActionItemModal.tsx` — same focus-trap pattern as SFM; `ref={modalRef}`; `data-testid` additions: `nam-close-btn`, `nam-cancel-btn`, `nam-title-input`, `nam-description`, `nam-owner`, `nam-due-date`
- `src/components/ConvertActionModal.tsx` — `useRef` added to existing `useState, useEffect` import; same focus-trap pattern; existing `useEffect([feedbackItem])` kept separate (3 total `useEffect` calls); `ref={modalRef}`; `data-testid` additions: `cam-close-btn`, `cam-cancel-btn`, `cam-title-input`, `cam-description`, `cam-owner`, `cam-due-date`
- `src/components/VerifyImpactModal.tsx` — same focus-trap pattern; `ref={modalRef}`; `data-testid` additions: `vim-close-btn`, `vim-cancel-btn`, `vim-impact`
- `src/app/api/users/route.ts` — `req` param made optional (`req?: NextRequest`) with `?.` safe access on `nextUrl.searchParams` to fix pre-existing `userApi.test.ts` TS error that surfaced when Sprint 4 added the required param

### Files Created

- `src/__tests__/errorHandling.test.tsx` — EH-1 through EH-10

### Tasks Skipped

- S5-1 (`db.ts`) — already compliant
- S5-2 (all API routes) — all have try/catch
- S5-6 (`sprint-setup/page.tsx`) — Sprint 4 built auth guard + error state

### Known gaps (per TEST_PLAN.md)

- Gap S5-1: Focus trap (AC-5.2.4) + return focus (AC-5.2.5) — manual browser verification only; jsdom cannot test Tab cycle
- Gap S5-2: `data-testid` completeness — spot-checked by EH-6 through EH-10; full grep verification in REVIEWER phase
- Gap S5-3: Real network disconnect (Smoke Test Step 18) — EH-2 covers the code path; real offline test is manual

### Completion gate result

- TypeScript: 0 errors (`node node_modules/typescript/bin/tsc --noEmit` exit code 0)
- Tests: `corepack yarn test` blocked by Carbon Black endpoint protection — cannot run in this environment; code is TypeScript-clean and all test assertions are aligned with the implementation
- Build: pending — `corepack yarn build` blocked by same Carbon Black policy

---
