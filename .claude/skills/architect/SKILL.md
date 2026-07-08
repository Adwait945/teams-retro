---
name: architect
description: Run the ARCHITECT role of the Teams Retro MAWv6.1 ATDD pipeline — designs the technical blueprint (components, data flow, API specs, ADRs) from docs/FEATURE_REQUIREMENTS.md. Use after PRODUCT, or when asked to "run architect" / "/architect".
---

# ARCHITECT skill

Invoke the `architect` subagent (`.claude/agents/architect.md`) to perform
this role, or follow its instructions directly in-conversation if a subagent
call is not available.

## When to use
- `docs/FEATURE_REQUIREMENTS.md` has a sprint section with no matching
  section yet in `docs/ARCHITECTURE_DESIGN.md`.
- The user says "run architect", "/architect", or asks for a technical design.

## What it does
Reads FEATURE_REQUIREMENTS.md, existing types/models, and prototypes, then
appends a "Sprint N" section to `docs/ARCHITECTURE_DESIGN.md` and
`docs/IMPLEMENTATION_PLAN.md` (a task checklist for DEV), and writes one
`docs/adrs/ADR-NNNN-[slug].md` per non-trivial decision. Never touches `src/`.

## Handoff
Once the design and implementation plan are reviewed, the next step is the
`test` skill.
