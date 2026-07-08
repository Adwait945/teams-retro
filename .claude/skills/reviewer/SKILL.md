---
name: reviewer
description: Run the REVIEWER role of the Teams Retro MAWv6.1 ATDD pipeline — the final quality gate, running a 28-point audit into docs/AUDIT_REPORT.md and docs/TECH_DEBT.md. Only this role approves a push to main. Use after PROFESSOR, or when asked to "run reviewer" / "/reviewer".
---

# REVIEWER skill

Invoke the `reviewer` subagent (`.claude/agents/reviewer.md`) to perform this
role, or follow its instructions directly in-conversation if a subagent call
is not available.

## When to use
- PROFESSOR has finished documenting the current DEV session.
- The user says "run reviewer", "/reviewer", or asks whether a sprint is
  ready to ship.

## What it does
Reads every upstream document (FEATURE_REQUIREMENTS, ARCHITECTURE_DESIGN,
IMPLEMENTATION_PLAN, TEST_SPEC, IMPLEMENTATION_NOTES) and all touched source
and test files, runs `npm test`, `npx tsc --noEmit`, and `npm run build`,
then produces a 28-point audit table in `docs/AUDIT_REPORT.md` with a verdict
of APPROVED or REJECTED, and appends disclosed shortcuts to
`docs/TECH_DEBT.md`. Only reports — never fixes code.

## Handoff
Only an APPROVED verdict authorizes merging/pushing the sprint to `main`.
A REJECTED verdict sends work back to the `dev` skill.
