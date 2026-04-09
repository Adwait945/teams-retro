# Sprint 4 — Sprint Setup + Admin Controls

**Theme**: Sprint configuration, team management, open/close retro controls  
**Scope**: Scope 2 MVP  
**DEV Sessions**: 1  
**Prerequisite**: Sprint 3 complete and merged; all action + feedback API routes in place

---

## Sprint Goal
The admin (first registered user) can set up a sprint with a name, goal, and date range; add team members; and open or close the retro. Non-admin users see a read-only view of sprint info.

---

## Epics & User Stories

### Epic 4.1 — Sprint Setup Page

**User Story**: As an admin, I want to configure the current sprint and manage team membership, so that the tool knows who is participating and what the sprint is working toward.

#### Acceptance Criteria

| AC-ID | Criterion |
|---|---|
| AC-4.1.1 | Sprint Setup page renders at `/sprint-setup` |
| AC-4.1.2 | Admin can set: Sprint Name, Sprint Goal, Start Date, End Date |
| AC-4.1.3 | Admin can add team members by username (must be a registered user) |
| AC-4.1.4 | Admin can open or close the retro (toggles `sprint.status` between "open" and "closed") |
| AC-4.1.5 | When retro is "closed", feedback submission is disabled on the Feedback Board |
| AC-4.1.6 | Non-admin users see sprint info in read-only mode — no edit controls rendered |
| AC-4.1.7 | Sprint data persists to MongoDB via `sprintService.createSprint()` → POST `/api/sprints` and `updateSprint()` → PATCH `/api/sprints/[id]` |
| AC-UI-4.1.1 | Page matches `docs/ui-mocks/sprint-setup.png` |

---

### DEV Session 1 — Sprint Setup + Admin Controls

**Files to write** (target ~330 lines — comfortably within quality threshold):

| File | Lines (target) | Notes |
|---|---|---|
| `src/app/api/sprints/[id]/route.ts` | ~50 | PATCH: update sprint fields (name, goal, dates, status, teamMemberIds) |
| `src/app/api/sprints/[id]/status/route.ts` | ~30 | PATCH: open or close the retro (status toggle) |
| `src/services/sprintService.ts` | ~80 | createSprint(), updateSprint(), getActiveSprint(), openRetro(), closeRetro() — all via fetch() |
| `src/app/sprint-setup/page.tsx` | ~130 | Admin form + team member list + open/close toggle; read-only for non-admins — ported from prototype |
| `src/__tests__/sprintService.test.ts` | ~60 | createSprint, openRetro/closeRetro, admin vs non-admin permission check |
| `src/__tests__/sprintSetup.test.tsx` | ~60 | Render admin view, render read-only view, form validation |
| **Total** | **~410 lines** | ✅ Fits comfortably in one session |

---

## Sprint 4 Definition of Done

- [ ] All AC-4.x acceptance criteria pass
- [ ] All 18 REVIEWER checklist points pass
- [ ] `corepack yarn build` — 0 errors
- [ ] `corepack yarn test` — 0 failures
- [ ] Admin can create and update a sprint (saved to MongoDB)
- [ ] Closed retro disables feedback submission on Feedback Board
- [ ] Non-admin user sees read-only sprint info
- [ ] Dashboard reflects active sprint name and date range from MongoDB
- [ ] Committed: `git commit -m "Sprint 4 complete: Sprint Setup + Admin Controls"`
