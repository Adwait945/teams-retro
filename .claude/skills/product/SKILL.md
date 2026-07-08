---
name: product
description: Run the PRODUCT role of the Teams Retro MAWv6.1 ATDD pipeline — converts docs/SPRINT_N_BACKLOG.md into testable Acceptance Criteria in docs/FEATURE_REQUIREMENTS.md. Use at the start of a sprint, or when asked to "run product" / "/product".
---

# PRODUCT skill

Invoke the `product` subagent (`.claude/agents/product.md`) to perform this
role, or follow its instructions directly in-conversation if a subagent call
is not available.

## When to use
- Starting a new sprint and `docs/SPRINT_N_BACKLOG.md` exists but
  `docs/FEATURE_REQUIREMENTS.md` has no section for it yet.
- The user says "run product", "/product", or asks to turn the backlog into
  requirements.

## What it does
Reads the current sprint backlog, prototypes, UI mocks, and
`src/types/index.ts`, then writes/appends a "Sprint N" section to
`docs/FEATURE_REQUIREMENTS.md` with refined Acceptance Criteria, UI
requirements, a prototype/backlog delta report, a dependency map, and a
Definition of Done. Never touches `src/`.

## Handoff
Once `docs/FEATURE_REQUIREMENTS.md` is written and reviewed by the human,
the next step is the `architect` skill.
