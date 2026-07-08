---
name: test
description: Run the TEST role of the Teams Retro MAWv6.1 ATDD pipeline — writes failing unit/integration/contract tests into docs/TEST_SPEC.md and src/__tests__/ before any implementation exists. Use after ARCHITECT, or when asked to "run test" / "/test".
---

# TEST skill

Invoke the `test` subagent (`.claude/agents/test.md`) to perform this role,
or follow its instructions directly in-conversation if a subagent call is
not available.

## When to use
- `docs/IMPLEMENTATION_PLAN.md` has a sprint section with no matching test
  coverage yet in `docs/TEST_SPEC.md`.
- The user says "run test", "/test", or asks to write the failing test suite
  for a sprint.

## What it does
Reads FEATURE_REQUIREMENTS.md and IMPLEMENTATION_PLAN.md, writes a 3-tier
test spec (Unit / Integration / Contract) with an AC coverage matrix into
`docs/TEST_SPEC.md`, and creates the actual Jest/RTL test files under
`src/__tests__/`. Confirms with `npm test` that new tests fail for the right
reason (missing implementation). Never writes implementation code.

## Handoff
Once tests are confirmed failing and reviewed, the next step is the `dev`
skill.
