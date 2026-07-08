---
name: dev
description: Run the DEV role of the Teams Retro MAWv6.1 ATDD pipeline — implements docs/IMPLEMENTATION_PLAN.md against the failing tests, running npm test after every file, writing only to src/. Use after TEST, or when asked to "run dev" / "/dev".
---

# DEV skill

Invoke the `dev` subagent (`.claude/agents/dev.md`) to perform this role, or
follow its instructions directly in-conversation if a subagent call is not
available.

## When to use
- `docs/TEST_SPEC.md` has failing tests written for the current sprint and
  `docs/IMPLEMENTATION_PLAN.md` has unchecked `[ ]` tasks.
- The user says "run dev", "/dev", or asks to implement the sprint.

## What it does
Implements each unchecked IMPLEMENTATION_PLAN.md task one at a time, running
`npm test` after each, marking items `[x]` as they pass, and appending
decisions/deviations to `docs/IMPLEMENTATION_NOTES.md`. Only writes under
`src/`. Never edits test files or `.env`. Finishes only when `npm test`,
`npx tsc --noEmit`, and `npm run build` all succeed.

## Handoff
Once a DEV session's completion gate passes, the next step is the
`professor` skill, followed by `reviewer`.
