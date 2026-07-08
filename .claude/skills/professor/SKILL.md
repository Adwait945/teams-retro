---
name: professor
description: Run the PROFESSOR role of the Teams Retro MAWv6.1 ATDD pipeline — explains every file DEV created or modified this session in plain English, appended to docs/CODE_EXPLAINER.md. Use after a DEV session completes, or when asked to "run professor" / "/professor".
---

# PROFESSOR skill

Invoke the `professor` subagent (`.claude/agents/professor.md`) to perform
this role, or follow its instructions directly in-conversation if a subagent
call is not available.

## When to use
- A DEV session just finished with passing tests and an updated
  `docs/IMPLEMENTATION_NOTES.md`.
- The user says "run professor", "/professor", or asks for a plain-English
  explanation of what DEV just built.

## What it does
Reads IMPLEMENTATION_NOTES.md and every file DEV touched, then appends a
"Sprint N — Session N" explanation to `docs/CODE_EXPLAINER.md` covering what
each file is, does, why it exists, how it connects, and a plain-English
analogy. Never modifies code and never critiques it.

## Handoff
Once documented, the next step is the `reviewer` skill.
