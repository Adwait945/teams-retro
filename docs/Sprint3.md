# Sprint 3 — Action Items

**Theme**: Create Action Items, Advance Status, Verify Impact  
**Scope**: Scope 2 MVP  
**DEV Sessions**: 2  
**Prerequisite**: Sprint 2 complete and merged; feedback API routes in place

---

## Sprint Goal
A team member can create action items (from the Feedback Board or directly from the Action Items page), assign an owner, and advance the item through its full lifecycle: Open → In Progress → Completed → Verified.

---

## Epics & User Stories

### Epic 3.1 — Action Items List + Create (from page)

**User Story**: As a team member, I want to see all action items and create new ones directly from the Action Items page, so that any improvement idea can be tracked regardless of whether it came from feedback.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-3.1.1 | Action Items page renders at `/actions` |
| AC-3.1.2 | Lists all action items with: title, owner, status badge, due date |
| AC-3.1.3 | Items sorted by status: Open → In Progress → Completed → Verified |
| AC-3.1.4 | "+ New Action Item" button opens the New Action Item modal |
| AC-3.1.5 | Modal fields: Title (required), Description (optional), Owner selector, Due Date |
| AC-3.1.6 | Creating calls `actionService.createAction()` which POSTs to `/api/actions`; `sourceFeedbackId` is null |
| AC-3.1.7 | If no action items exist, shows empty state matching `docs/ui-mocks/action-items-empty.png` |
| AC-UI-3.1.1 | Layout matches `docs/ui-mocks/ActionItems.png` |
| AC-UI-3.1.2 | New Action Item modal matches `docs/ui-mocks/new-action-item-modal.png` |

---

### DEV Session 1 — Action Items List + Create

**Files to write** (target ~460 lines):

| File | Lines (target) | Notes |
|---|---|---|
| `src/app/api/actions/route.ts` | ~60 | GET: return actions by sprintId. POST: create action (extends Sprint 1 stub) |
| `src/services/actionService.ts` | ~100 | createAction(), getActions(), getActionsByStatus(), advanceStatus(), getCompletionRate() — all via fetch() |
| `src/components/ActionItemCard.tsx` | ~80 | Card: title, owner, status badge, due date, Advance Status button |
| `src/components/NewActionItemModal.tsx` | ~100 | Form: title, description, owner selector, due date — ported from prototype |
| `src/app/actions/page.tsx` | ~100 | List + empty state + New Action Item button |
| `src/__tests__/actionService.test.ts` | ~80 | createAction, advanceStatus lifecycle, getCompletionRate |
| **Total** | **~520 lines** | ⚠️ Upper edge — monitor context; split at actionService if needed |

---

### Epic 3.2 — Convert Feedback to Action + Verify Impact

**User Story**: As a facilitator, I want to convert a "What Should We Try" feedback item into a tracked action item, and later verify the impact with a written statement, so that the feedback loop is formally closed.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-3.2.1 | "Convert to Action" button appears on feedback cards in the "What Should We Try" lane only |
| AC-3.2.2 | Convert modal pre-fills the title from feedback content; sets `sourceFeedbackId` and `sourceQuote` |
| AC-3.2.3 | "Advance Status" button calls `actionService.advanceStatus()` → PATCH `/api/actions/[id]/advance`; moves Open → In Progress → Completed |
| AC-3.2.4 | When status = Completed, "Verify Impact" button appears instead of "Advance Status" |
| AC-3.2.5 | Verify Impact modal requires a non-empty impact statement before saving |
| AC-3.2.6 | After verification, status becomes "Verified" and the impact note displays on the card; persisted in MongoDB |
| AC-UI-3.2.1 | Convert to Action modal matches `docs/ui-mocks/ConvertActionItem.png` |
| AC-UI-3.2.2 | Verify Impact modal matches `docs/ui-mocks/VerifyImpact.png` |

---

### DEV Session 2 — Convert + Verify

**Files to write** (target ~280 lines):

| File | Lines (target) | Notes |
|---|---|---|
| `src/app/api/actions/[id]/advance/route.ts` | ~40 | PATCH: advance status one step (Open→InProgress→Completed) |
| `src/app/api/actions/[id]/verify/route.ts` | ~40 | PATCH: set status=Verified, save impactNote, validate non-empty |
| `src/components/ConvertActionModal.tsx` | ~100 | Pre-filled form from feedback, sets sourceFeedbackId + sourceQuote — ported from prototype |
| `src/components/VerifyImpactModal.tsx` | ~80 | Impact statement textarea, save handler — ported from prototype |
| `src/__tests__/actionItems.test.tsx` | ~100 | Convert flow, advance status sequence, verify impact, status = Verified |
| **Total** | **~280 lines** | ✅ Fits in one session |

---

## Sprint 3 Definition of Done

- [ ] All AC-3.x acceptance criteria pass
- [ ] All 18 REVIEWER checklist points pass
- [ ] `corepack yarn build` — 0 errors
- [ ] `corepack yarn test` — 0 failures
- [ ] Full lifecycle works: Open → In Progress → Completed → Verified
- [ ] Convert from feedback sets `sourceFeedbackId` and `sourceQuote`
- [ ] Verify Impact requires non-empty impact statement
- [ ] Dashboard completion rate updates correctly after verification
- [ ] Committed: `git commit -m "Sprint 3 complete: Action Items"`
