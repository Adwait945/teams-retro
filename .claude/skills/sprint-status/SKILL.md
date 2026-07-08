---
name: sprint-status
description: Report where the current Teams Retro sprint sits in the MAWv6.1 six-role ATDD pipeline (PRODUCT → ARCHITECT → TEST → DEV → PROFESSOR → REVIEWER) by inspecting the docs/ pipeline artifacts. Use when asked "what's the sprint status", "/sprint-status", or "what's next".
---

# sprint-status skill

Determine the current sprint number and pipeline stage without modifying
anything, then report status and the next action.

## How to check
1. Find the highest-numbered `docs/SPRINT_N_BACKLOG.md`.
2. Check `docs/FEATURE_REQUIREMENTS.md` for a "## Sprint N" section →
   PRODUCT done?
3. Check `docs/ARCHITECTURE_DESIGN.md` and `docs/IMPLEMENTATION_PLAN.md` for a
   "## Sprint N" section, and whether all `[ ]` items are `[x]` → ARCHITECT
   done? DEV complete?
4. Check `docs/TEST_SPEC.md` for a "## Sprint N" section → TEST done?
5. Check `docs/IMPLEMENTATION_NOTES.md` for a Sprint N entry → DEV in progress
   or done?
6. Check `docs/CODE_EXPLAINER.md` for a "Sprint N" entry → PROFESSOR done?
7. Check `docs/AUDIT_REPORT.md` for a Sprint N verdict → REVIEWER done, and
   APPROVED or REJECTED?
8. Optionally run `git log --oneline -10` and `git status` to correlate
   pipeline docs with actual commits.

## Output
A short table: Sprint N, each of the 6 roles marked done/pending/in-progress,
current blocking step, and the single next command/skill to run (e.g. "run
the `test` skill next"). Do not modify any files — this is a read-only status
check.
