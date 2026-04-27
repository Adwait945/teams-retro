# PRODUCT Agent Prompt — Sprint 6: Always-On Retro

> **Use in**: `retro-product/` worktree, new Cascade session
> **Model**: Any (200K Sonnet sufficient — PRODUCT is a structured writing task, not a code task)
> **Output**: Append Sprint 6 section to `retro-product/docs/FEATURE_REQUIREMENTS.md`

---

```
[PRODUCT]

## Pre-Flight
Read the following files in this exact order before writing anything:

1. C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro\docs\Sprint6.md
   ← The Sprint 6 backlog. This is your primary source of truth.

2. C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro\docs\MVP_SCOPE_REVIEW_DECISIONS.md
   ← The locked scope decisions. Use this to resolve any ambiguity in Sprint6.md.
   ← Decisions C1–C8, A1–A6, V1 are all final. Do not invent alternatives.

3. C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\retro-dev\src\types\index.ts
   ← Current TypeScript interfaces. Your ACs must use the EXACT field names defined here.
   ← Sprint 6 will REMOVE the Sprint interface and UPDATE FeedbackItem + ActionItem.
   ← Do not reference field names that don't exist in this file unless Sprint 6 adds them (per Sprint6.md).

4. C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\retro-product\docs\FEATURE_REQUIREMENTS.md
   ← Prior sprint requirements. APPEND a Sprint 6 section — never overwrite prior content.

## Context
Teams Retro is a continuous improvement tool for engineering pods. Sprint 6 is a full architectural rearchitecture: the sprint-gating model is replaced with an always-on feed. This sprint removes the Sprint data model entirely and rebuilds the product around time-window-based queries (7 days / 30 days / all-time).

This is NOT a new feature sprint. It is a teardown + rebuild sprint. The existing codebase has sprint-gated logic throughout — every page, every API route, every service file has sprint references that must be removed.

## Task
You are the Product Owner for Sprint 6. Using Sprint6.md as the backlog and MVP_SCOPE_REVIEW_DECISIONS.md as the decision record:

### 1. For each Epic (6.1 through 6.9), produce:
- The verbatim User Story from Sprint6.md
- The full Acceptance Criteria table — copy every AC from Sprint6.md exactly, then REFINE each one:
  - Make assertions specific and testable (what exactly appears in the DOM, what API call is made, what HTTP status is returned)
  - Add "Given / When / Then" structure where the original AC is ambiguous
  - Flag any AC where the implementation detail is unclear and propose a resolution

### 2. Produce a Cross-Epic Constraints section covering:
- Authentication guard: All pages except `/` require a valid user in sessionStorage (`retroboard_user`). Unauthenticated users must be redirected to `/`.
- Admin guard: `/pod-settings` is admin-only. `DELETE /api/feedback/[id]` is admin-only (403 if not admin). The "→ Action" button only renders for admin users.
- Anonymity invariants: The `isAnonymous` flag is set at submission and cannot be changed. No UI or API exposes the author identity of anonymous feedback — including to admins.
- Sprint references: After Sprint 6, zero references to `sprintId`, `Sprint`, or sprint-related UI must remain anywhere in `src/`. This is a hard constraint, not a best-effort cleanup.

### 3. Produce a Data Model Delta section:
Document exactly what changes to `src/types/index.ts` and the Mongoose schemas are required:
- Fields removed from existing interfaces
- Fields added to existing interfaces
- Interfaces deleted entirely
- New optional fields and their exact TypeScript types

Use this format for each change:
| Interface | Field | Change | New Type |
|---|---|---|---|

### 4. Produce an API Contract section:
For each API endpoint that changes in Sprint 6, specify:
- Method + path
- What changes (new params, removed params, changed behavior)
- Request shape (relevant fields only)
- Response shape (relevant fields only)
- Error cases and HTTP status codes

### 5. Produce a Definition of Done checklist:
Copy the DoD from Sprint6.md and add any additional testable conditions derived from your AC refinement.

### 6. Produce a Dependency Map:
Which Sprint 1–5 files does Sprint 6 consume, modify, or delete? List each file and its fate:
- MODIFIED: [file] — [what changes]
- DELETED: [file] — [why]
- UNCHANGED: [file] — [confirm it's still needed]

## Key Decisions to Enforce (do not re-open these)

These are locked in MVP_SCOPE_REVIEW_DECISIONS.md. Your ACs must enforce them, not re-debate them:

- **Always-on model**: No sprint open/close gate. The feedback board is always open. State this explicitly in AC-6.5.x.
- **Admin-only convert**: Only admin sees "→ Action" button. No upvote threshold for non-admins. AC-6.6.x must be explicit.
- **Due date is optional**: Both the convert modal and the standalone create modal must allow null due dates. AC-6.6.6 and AC-6.7.7 must specify the null/display behavior.
- **`suggestion` → `description` pre-fill**: Applies to any category with a non-empty suggestion field, not only "Slowed Us Down." "Went Well" has no suggestion field — description is empty. "Should Try" and "Slowed Us Down" have suggestion fields — pre-fill if non-empty.
- **Multiple action items per feedback**: Admin can create multiple. Confirmation prompt required on second conversion. `actionItemIds: string[]` (not singular).
- **`verified` is terminal**: Cannot be regressed. Cannot be deleted. The bug fix for the regress route must explicitly block `verified → anything`.
- **Activity feed strips actor identity**: Feed entries for status changes use format "[Title] moved to [Status]" with no actor name. Upvote events never appear in the feed.
- **Anonymous conversion**: Admin can convert anonymous feedback. Modal shows "Anonymous" as source author. `sourceQuote` contains only content text, never author identity.
- **Pod-level metrics only**: Dashboard metrics are aggregate counts for the pod. No per-person breakdown in MVP. Individual attribution is Scope 3.
- **Anonymity locked**: `isAnonymous` cannot be changed post-submission. No UI, no API.

## Output Format

Append to `retro-product/docs/FEATURE_REQUIREMENTS.md`:

```markdown
---

# Sprint 6 — Always-On Retro: Feature Requirements

_Written by PRODUCT on [date]_

## Sprint Goal
[one paragraph]

## Epic 6.1 — [title]
### User Story
### Acceptance Criteria
| AC-ID | Given | When | Then |
...

## Epic 6.2 ...
[repeat for all 9 epics]

## Cross-Epic Constraints
...

## Data Model Delta
...

## API Contract
...

## Definition of Done
...

## Dependency Map
...
```

## Constraints
- Do NOT modify any `src/` files
- Do NOT modify the Sprint6.md backlog — read it, do not edit it
- Do NOT invent new features or decisions not in Sprint6.md or MVP_SCOPE_REVIEW_DECISIONS.md
- Do NOT skip any epic — all 9 epics (6.1 through 6.9) must appear in the output
- APPEND only — never overwrite prior sprint content in FEATURE_REQUIREMENTS.md
- Use EXACT field names from `src/types/index.ts` — do not invent aliases
```

---

## Notes for the DEV session (read before handing off to DEV)

This PRODUCT output feeds directly into the ARCHITECT and then DEV sessions. The DEV session will use **`[MODEL: 1M]`** (Claude Opus or equivalent), meaning:

- DEV will write complete file implementations per turn — not chunked
- The full `src/` tree + all 3 upstream docs (FEATURE_REQUIREMENTS, ARCHITECTURE_DESIGN, IMPLEMENTATION_PLAN) will be in context simultaneously
- Therefore: PRODUCT output must be **precise and unambiguous** — DEV at 1M context will implement exactly what PRODUCT specifies, not interpret gaps charitably

Vague ACs at this stage become bugs at DEV stage. Every AC in the output must be verifiable by a test or a smoke test step.
