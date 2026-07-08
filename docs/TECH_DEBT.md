# Tech Debt Log

Appended by the `reviewer` role after each sprint audit (see
`.claude/agents/reviewer.md`). Entries below the sprint sections are
environment/process notes that don't belong to a specific sprint.

## Process notes

### MAWv6.1 setup commit message mismatch (2026-07-08)
The initial `.claude/agents/`, `.claude/skills/`, `.claude/settings.json`, and
root `CLAUDE.md` files for the MAWv6.1 pipeline were folded into the
pre-existing commit `082e272` ("cleanup: remove dead retro-store scaffold,
fix root layout") by an automatic checkpoint/autosave mechanism in the local
environment, rather than landing in a dedicated
`chore: initialize Claude Code MAWv6.1 workflow` commit as intended. The
content is correct and was already pushed to `origin/main` before this was
noticed, so the commit was left as-is rather than rewriting published
history. If this recurs, check whether the environment has a git autosave/
checkpoint hook that commits on file write.
