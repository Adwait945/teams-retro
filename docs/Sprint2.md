# Sprint 2 — Feedback Board

**Theme**: Submit Feedback, Upvote, Three Lanes, Anonymous, Reframe Rule  
**Scope**: Scope 2 MVP  
**DEV Sessions**: 2  
**Prerequisite**: Sprint 1 complete and merged; MongoDB connection + models in place

---

## Sprint Goal
A registered team member can submit feedback into one of three lanes (What Went Well, What Slowed Us Down, What Should We Try), upvote others' feedback, and choose to submit anonymously. "What Slowed Us Down" requires a suggested improvement before submitting (Reframe Rule).

---

## Epics & User Stories

### Epic 2.1 — Feedback Board Layout + Read

**User Story**: As a team member, I want to see all feedback for the current sprint organized into three lanes, so that I can review what the team is thinking.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-2.1.1 | Feedback Board renders at `/feedback` |
| AC-2.1.2 | Three columns render: "What Went Well", "What Slowed Us Down", "What Should We Try" |
| AC-2.1.3 | Each feedback card shows: content, author (or "Anonymous"), upvote count, upvote button |
| AC-2.1.4 | Cards within each lane are sorted by upvote count descending |
| AC-2.1.5 | If no feedback exists, shows empty state matching `docs/ui-mocks/feedback-board-empty.png` |
| AC-UI-2.1.1 | Layout matches `docs/ui-mocks/FeedbackBoard.png` |

---

### DEV Session 1 — Board Layout + Read

**Files to write** (target ~420 lines):

| File | Lines (target) | Notes |
|---|---|---|
| `src/app/api/feedback/route.ts` | ~60 | GET: return feedback by sprintId+category. POST: create feedback item |
| `src/services/feedbackService.ts` | ~100 | getFeedback(), getFeedbackByLane(), sortByUpvotes(), getAuthorDisplay() — all via fetch() |
| `src/components/FeedbackCard.tsx` | ~80 | Card: content, author, upvote button + count |
| `src/components/FeedbackColumn.tsx` | ~60 | One lane: header + list of FeedbackCards |
| `src/app/feedback/page.tsx` | ~100 | Three columns + empty state, reads from feedbackService |
| `src/__tests__/feedbackService.test.ts` | ~80 | sortByUpvotes, getAuthorDisplay (anonymous vs named), API route mock tests |
| **Total** | **~480 lines** | ✅ Fits in one session |

---

### Epic 2.2 — Submit Feedback + Upvote

**User Story**: As a team member, I want to submit feedback and upvote others' submissions, so that the most important points rise to the top.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-2.2.1 | "+ Add Feedback" button opens the Submit Feedback modal |
| AC-2.2.2 | Modal has: Lane selector (3 options), Content textarea, Anonymous toggle, optional Suggestion field |
| AC-2.2.3 | Suggestion field becomes required and visible when lane = "What Slowed Us Down" (Reframe Rule) |
| AC-2.2.4 | Submit calls `feedbackService.addFeedback()` which POSTs to `/api/feedback`; modal closes on success |
| AC-2.2.5 | Upvote button increments count; a user cannot upvote their own feedback; a user cannot upvote the same item twice |
| AC-2.2.6 | Upvote count persists after page refresh (stored in MongoDB, not client state) |
| AC-UI-2.2.1 | Modal matches `docs/ui-mocks/SubmitFeedback.png` |
| AC-UI-2.2.2 | Suggestion field appears/disappears dynamically based on lane selection (no page reload) |

---

### DEV Session 2 — Submit Modal + Upvote Logic

**Files to write** (target ~270 lines):

| File | Lines (target) | Notes |
|---|---|---|
| `src/components/SubmitFeedbackModal.tsx` | ~130 | Form, lane selector, anonymous toggle, conditional suggestion field — ported from prototype |
| `src/app/api/feedback/[id]/upvote/route.ts` | ~40 | PATCH: increment upvote, add userId to upvotedBy, guard duplicate + self-vote |
| `src/services/feedbackService.ts` (additions) | ~40 | addFeedback() → POST /api/feedback; upvoteFeedback() → PATCH /api/feedback/[id]/upvote |
| `src/__tests__/feedbackBoard.test.tsx` | ~100 | Modal open/close, Reframe Rule enforcement, upvote logic, double-vote prevention |
| **Total** | **~270 lines** | ✅ Fits comfortably in one session |

---

## Sprint 2 Definition of Done

- [ ] All AC-2.x acceptance criteria pass
- [ ] All 18 REVIEWER checklist points pass
- [ ] `corepack yarn build` — 0 errors
- [ ] `corepack yarn test` — 0 failures
- [ ] Can submit feedback in all 3 lanes
- [ ] Reframe Rule enforced on "What Slowed Us Down"
- [ ] Upvote persists in MongoDB; double-vote prevented; self-vote prevented
- [ ] Anonymous feedback displays as "Anonymous"
- [ ] Empty state renders when no feedback exists
- [ ] Committed: `git commit -m "Sprint 2 complete: Feedback Board"`
