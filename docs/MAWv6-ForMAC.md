# Multi-Role Workflow Setup: Complete Step-by-Step Plan (v6 — Unrestricted Mac Edition)

**Architecture**: Local Mac (Design + Engineering in one environment) → GitHub (Bridge + Backup) → Optional Vercel/Netlify deploy

**Your Project**: Teams Retro — Next.js 14 / React 18 / Tailwind 3 / MongoDB Atlas / Mongoose

**Roles**: PRODUCT · ARCHITECT · TEST · DEV · PROFESSOR · REVIEWER

---

## What Changed from v5 → v6

v5 was engineered around a **7-Eleven corporate Windows laptop** with:
- PowerShell execution policy blocking `npx`, `jest`, `tsc`
- Enterprise endpoint protection blocking `jest.cmd`, `tsc.cmd`
- No ability to install software freely
- `corepack yarn` as the only available package manager

v6 assumes a **personal Mac with full developer freedom**:
- `npm`, `npx`, `pnpm`, `yarn`, `bun` — all available, your choice
- No execution policy restrictions
- Homebrew, nvm, or any Node version manager usable
- Tests run directly in terminal
- No workarounds, no fallback commands

**The core 6-agent workflow is identical.** Only the tooling references change.

---

## How This Plan is Organized

There are **two environments** you'll work in (Replit is optional for prototyping — you can skip it entirely on Mac):

| Icon | Environment | What It Is |
|---|---|---|
| 🖥️ | **Mac (Windsurf)** | Your primary workstation. All design, prototyping, and engineering happens here. Full Node.js toolchain available. |
| 🐙 | **GitHub** | Cloud backup and optional CI. Push after each sprint. |
| 🚀 | **Vercel / Netlify** (optional) | One-click deployment for live preview. Not required — `npm run dev` in terminal is sufficient. |

> **On Mac you can skip Replit entirely.** Windsurf's built-in browser preview or `localhost:3000` replaces Replit's live preview. If you still want to use Replit for UI prototyping (the "art department" workflow), that still works — but it's now optional, not required.

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────┐
│  🖥️ MAC — Windsurf (Design + Engineering)               │
│  ✍️ Write backlog → Build prototypes (optional Replit)   │
│  🤖 PRODUCT → ARCHITECT+TEST → DEV → PROFESSOR → REVIEWER │
│     (each in its own worktree)                          │
│  npm test ✅ | tsc --noEmit ✅ | npm run build ✅         │
│  📤 git push origin main                                │
└──────────────────────────┬──────────────────────────────┘
                           │
                     🐙 GITHUB
                           │
              (optional: auto-deploy to Vercel)
```

Each agent writes its output into a specific file. The next agent reads that file. They never talk to each other directly — they communicate through documents.

---

## Phase 0: Design Studio (Human Work)

### Step 0.1 — Build Visual Prototypes

**Option A — In Replit** (if you want a browser-based scratchpad):
1. Open Replit in browser, build `.tsx` prototypes visually, export/screenshot.
2. Copy prototype files to `docs/prototypes/` in your Mac project.

**Option B — Directly in Windsurf** (recommended on Mac):
1. Create `.tsx` files in `docs/prototypes/` directly.
2. Run `npm run dev` and view at `localhost:3000` — you can stub a route to preview any prototype.
3. Screenshot with macOS `Cmd+Shift+4`.

### Step 0.2 — Write the Sprint Backlog

Create `docs/Sprint[N].md` with your Epics and Acceptance Criteria:

```markdown
# Sprint N Backlog — Teams Retro

## Epic N.1: [Feature Name]
### User Story
> As a [user], I want [goal] so that [reason].

### Acceptance Criteria
- AC-N.1.1: [Specific, testable pass/fail statement]
- AC-N.1.2: [Another testable statement]

### UI Reference
- Mock: docs/ui-mocks/[filename].png
- Prototype: docs/prototypes/[filename].tsx

### Out of Scope
- [Explicitly excluded items]
```

---

## Phase 1: Setup (One-Time Only)

### Step 1.1 — Prerequisites (Mac)

```bash
# Install Node.js via nvm (recommended — lets you switch versions)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
node -v  # should print v20.x.x

# Or via Homebrew
brew install node@20

# Verify toolchain
node -v
npm -v
npx -v
git --version
```

### Step 1.2 — Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/teams-retro.git
cd teams-retro
npm install
```

### Step 1.3 — Set Up Git Worktrees

Run once from the repo root. Each worktree gives each agent an isolated folder to work in without branch conflicts:

```bash
# From the repo root (teams-retro/)
git worktree add ../retro-product product-branch
git worktree add ../retro-architect architect-branch
git worktree add ../retro-test test-branch
git worktree add ../retro-dev dev-branch
git worktree add ../retro-reviewer reviewer-branch

# Install deps in each worktree
for dir in ../retro-product ../retro-architect ../retro-test ../retro-dev ../retro-reviewer; do
  (cd "$dir" && npm install)
done
```

### Step 1.4 — Environment Variables

```bash
# In retro-dev/ (and teams-retro/ if running locally from main)
cp .env.example .env.local
# Edit .env.local — add your MongoDB Atlas connection string:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teams-retro
```

### Step 1.5 — Verify Everything Works

```bash
cd retro-dev
npm run dev      # app runs at localhost:3000
npm test         # Jest test suite runs (all tests pass or fail as expected)
npx tsc --noEmit # 0 type errors
npm run build    # build succeeds
```

---

## Phase 2: Worktree Structure

```
~/Projects/
├── teams-retro/        ← main branch (production)
├── retro-product/      ← PRODUCT agent worktree
├── retro-architect/    ← ARCHITECT agent worktree
├── retro-test/         ← TEST agent worktree
├── retro-dev/          ← DEV agent worktree (where code is written)
└── retro-reviewer/     ← REVIEWER agent worktree
```

All worktrees share the same `.git` directory. Commits in `retro-dev/` appear as `dev-branch` commits in the shared repo.

---

## Phase 3: The Agent Pipeline (Run Each Sprint)

### Agent 1: PRODUCT

> **What this agent does**: Converts your plain-English Sprint backlog into precise, testable Acceptance Criteria. It refines each AC to be measurable, flags prototype-backlog deltas, and writes a document that every downstream agent treats as the source of truth.

1. Open a **new Cascade session** in the `retro-product/` folder.
2. Paste this prompt:

```
[PRODUCT]

## Pre-Flight
1. Read docs/Sprint[N].md (the backlog I wrote)
2. Read docs/prototypes/ (all .tsx files)
3. Read docs/ui-mocks/ (all screenshots)
4. Read src/types/index.ts (existing type definitions — do not contradict them)
5. If Sprint N > 1: Read the previous docs/FEATURE_REQUIREMENTS.md to understand prior context

## Task
You are the Product Owner. For each Epic in the Sprint backlog:

1. Write verbatim Acceptance Criteria (exactly as in the backlog)
2. Refine each AC to be testable (add specific assertions, edge cases, data shapes)
3. Write UI Requirements from the mocks (layout, classes, colors, text strings)
4. Flag any prototype-backlog delta — where the .tsx prototype contradicts the backlog
5. Write a Dependency Map — what Sprint N-1 files does this sprint consume?
6. Write a Definition of Done checklist

## Output
Write (or append Sprint N section to) docs/FEATURE_REQUIREMENTS.md

## Constraints
- Do NOT modify any src/ files
- If Sprint > 1: APPEND a "Sprint N" section — never overwrite prior sprint content
- Use the exact field names from src/types/index.ts — do not invent or rename fields
```

3. Review output. Commit:
```bash
git add docs/FEATURE_REQUIREMENTS.md
git commit -m "PRODUCT: Feature requirements for Sprint N"
git push origin product-branch
```

---

### Agent 2: ARCHITECT + TEST (Combined Session — Recommended)

> **Workflow optimization**: ARCHITECT and TEST run back-to-back in one session. ARCHITECT writes first, TEST reads its output immediately. No context gap, no extra session switch.

> **What ARCHITECT does**: Designs the technical blueprint — component boundaries, data flow, API specs, service layer contracts, and a Jira-style task checklist for DEV.

> **What TEST does**: Writes the complete test plan and (optionally) test file skeletons — before any code exists. Every test should FAIL at this stage. That's correct.

1. Open a **new Cascade session** in the `retro-architect/` folder.
2. Paste this combined prompt (fill in absolute paths for your Mac):

```
[ARCHITECT] then [TEST] — Sprint N: [Feature Name]

Complete ARCHITECT fully before starting TEST.

---

## PHASE 1: [ARCHITECT]

Read these files:
1. /Users/YOUR_USERNAME/Projects/retro-product/docs/FEATURE_REQUIREMENTS.md
2. /Users/YOUR_USERNAME/Projects/retro-architect/docs/ARCHITECTURE_DESIGN.md  ← append, do not overwrite
3. /Users/YOUR_USERNAME/Projects/retro-architect/docs/IMPLEMENTATION_PLAN.md  ← append, do not overwrite
4. /Users/YOUR_USERNAME/Projects/retro-dev/src/types/index.ts
5. /Users/YOUR_USERNAME/Projects/retro-dev/src/lib/models/  (all model files)
6. /Users/YOUR_USERNAME/Projects/retro-dev/src/components/layout/Shell.tsx
7. /Users/YOUR_USERNAME/Projects/retro-dev/docs/IMPLEMENTATION_NOTES.md
8. /Users/YOUR_USERNAME/Projects/retro-dev/docs/prototypes/  (all .tsx prototypes)

### ARCHITECT Output
Append a "Sprint N" section to:
- retro-architect/docs/ARCHITECTURE_DESIGN.md
- retro-architect/docs/IMPLEMENTATION_PLAN.md

Cover: new files, consumed Sprint N-1 files, data flow, API specs, component prop interfaces, business rule enforcement layers, isolation constraints.

---

## PHASE 2: [TEST]

Read these files (ARCHITECT output is now available):
1. /Users/YOUR_USERNAME/Projects/retro-product/docs/FEATURE_REQUIREMENTS.md
2. /Users/YOUR_USERNAME/Projects/retro-architect/docs/IMPLEMENTATION_PLAN.md  ← just updated
3. /Users/YOUR_USERNAME/Projects/retro-test/docs/TEST_PLAN.md  ← append, do not overwrite
4. /Users/YOUR_USERNAME/Projects/retro-dev/src/types/index.ts
5. /Users/YOUR_USERNAME/Projects/retro-dev/src/__tests__/  ← existing tests (read-only)

### TEST Output
Append a "Sprint N" section to:
- retro-test/docs/TEST_PLAN.md

Cover: mock patterns, test cases (each with: Test ID, File, Setup, Action, Assertions, AC covered), AC coverage matrix, gap analysis.

### TEST Constraints
- Do NOT modify or delete any Sprint N-1 tests
- Do NOT install any test runner — Jest is already configured (npm test runs jest)
- Append only
```

3. Review output. Commit from each worktree:
```bash
# In retro-architect/
git add docs/ARCHITECTURE_DESIGN.md docs/IMPLEMENTATION_PLAN.md
git commit -m "ARCHITECT: Sprint N design + implementation plan"
git push origin architect-branch

# In retro-test/
git add docs/TEST_PLAN.md
git commit -m "TEST: Sprint N test plan"
git push origin test-branch
```

---

### Agent 3: DEV

> **What this agent does**: The integration engineer. Reads all prior output, implements every task in IMPLEMENTATION_PLAN.md, and makes all tests pass. Never redesigns — wires up what already exists visually.

> **Session split**: For sprints with significant scope, split DEV into 2–3 sessions aligned to the session breakdown in IMPLEMENTATION_PLAN.md.

1. Open a **new Cascade session** in the `retro-dev/` folder.
2. Paste this prompt for **Session 1**:

```
[DEV] — Sprint N, Session 1

## Pre-Flight (run before writing any code)
1. Read docs/FEATURE_REQUIREMENTS.md
2. Read docs/ARCHITECTURE_DESIGN.md
3. Read docs/IMPLEMENTATION_PLAN.md — note which [ ] tasks belong to Session 1
4. Read docs/TEST_PLAN.md
5. Read docs/IMPLEMENTATION_NOTES.md — MANDATORY even if this is Session 1. Contains every prior decision and known issue.
6. Read all .tsx files in docs/prototypes/
7. Read all existing source files in src/ — do not assume the folder is empty
8. Run: git status && git log --oneline -5
9. Run: npm install

## Task
Execute DEV Session 1 tasks from IMPLEMENTATION_PLAN.md.

### Execution Loop
1. Pick the next unchecked [ ] Session 1 item from IMPLEMENTATION_PLAN.md
2. Implement it. Cite file path and line numbers.
3. Mark it [x] in IMPLEMENTATION_PLAN.md
4. Run: npm test (all prior tests must still pass)
5. Move to the next item

### Completion Gate (Session 1)
After all Session 1 tasks are [x]:
1. npm test — 0 failures
2. npx tsc --noEmit — 0 errors
3. npm run build — succeeds

### Output
- All implementation code in src/
- Updated IMPLEMENTATION_PLAN.md (Session 1 tasks all [x])
- Append to docs/IMPLEMENTATION_NOTES.md: files created, decisions made, deviations from plan

### Constraints
- Do NOT modify test files in src/__tests__/ — fix code to match tests, not the reverse
- Do NOT import from retro-store.tsx unless explicitly required by the plan
- Do NOT add <style> tags or inline styles — Tailwind utility classes only
- Do NOT rename fields from src/types/index.ts
- Re-verify Global UI Infrastructure: if you modify layout.tsx, tailwind.config.ts, or globals.css, confirm className="dark" on <html>, font classes, and CSS variables are intact after your change

When done, run: npm test && npx tsc --noEmit && npm run build
```

4. After all DEV sessions complete, commit and push:
```bash
git add .
git commit -m "DEV: Sprint N, Session [N] — [brief description]"
git push origin dev-branch
```
5. Merge to `main`:
```bash
# In teams-retro/ (main branch)
git fetch origin dev-branch
git merge origin/dev-branch --no-edit
git push origin main
```

---

### Agent 4: PROFESSOR

> **What this agent does**: After each DEV session, reads the newly written code and produces a plain-English explanation for every file created or modified. Appends to `docs/CODE_EXPLAINER.md`.

> **When to run**: After each DEV session completes (tests pass), before REVIEWER.

1. Open a **new Cascade session** in the `retro-dev/` folder.
2. Paste this prompt:

```
[PROFESSOR]

## Pre-Flight
1. Read docs/IMPLEMENTATION_NOTES.md (DEV's notes from this session)
2. Read docs/IMPLEMENTATION_PLAN.md (identify which tasks were just completed)
3. Read every file listed under "Files Created" and "Files Modified" in IMPLEMENTATION_NOTES.md
4. Read src/types/index.ts (for type context)

## Task
Explain every file DEV created or modified in this session.

For each file:
1. What it IS: one sentence naming the file and its role
2. What it DOES: walk through each logical block in plain English
3. WHY it exists: what breaks if this file is removed?
4. HOW it connects: trace the data path
5. Plain English analogy: one real-world analogy

## Output
Append to docs/CODE_EXPLAINER.md:
## Sprint [N] — Session [N] Code Explanation
_Written by PROFESSOR on [date]_
### [filename]
[explanation]

## Constraints
- Do NOT modify any code
- Do NOT suggest improvements — that is REVIEWER's job
- Assume no prior coding knowledge in the reader
```

3. Commit:
```bash
git add docs/CODE_EXPLAINER.md
git commit -m "PROFESSOR: Code explanation for Sprint N Session N"
```

---

### Agent 5: REVIEWER

> **What this agent does**: Final quality gate. 11-point audit of all code against all upstream documents. If any check fails, the verdict is REJECTED and DEV must fix before shipping.

1. Open a **new Cascade session** in the `retro-reviewer/` folder.
2. Paste this prompt:

```
[REVIEWER] — Sprint N Audit

## ⚠️ CRITICAL PATH: REVIEWER runs in retro-reviewer/ worktree.
## Source code lives in retro-dev/src/ — use absolute paths for all file reads.
## Project root: /Users/YOUR_USERNAME/Projects/
## Source code: retro-dev/src/
## Docs (PRODUCT): retro-product/docs/FEATURE_REQUIREMENTS.md
## Docs (ARCHITECT): retro-architect/docs/ARCHITECTURE_DESIGN.md + IMPLEMENTATION_PLAN.md
## Docs (TEST): retro-test/docs/TEST_PLAN.md
## Docs (DEV): retro-dev/docs/IMPLEMENTATION_NOTES.md
## Tests: retro-dev/src/__tests__/

## Pre-Flight
1. Read retro-product/docs/FEATURE_REQUIREMENTS.md
2. Read retro-architect/docs/ARCHITECTURE_DESIGN.md
3. Read retro-architect/docs/IMPLEMENTATION_PLAN.md — verify all Sprint N tasks are [x]
4. Read retro-test/docs/TEST_PLAN.md
5. Read retro-dev/docs/IMPLEMENTATION_NOTES.md
6. Read ALL source files in retro-dev/src/
7. Read all test files in retro-dev/src/__tests__/
8. Read retro-dev/src/app/layout.tsx explicitly — verify Global UI Infrastructure
9. Run from retro-dev/: npm test
10. Run from retro-dev/: npx tsc --noEmit
11. Run from retro-dev/: npm run build

## The 11-Point Audit

For each check output ✅ PASS or ❌ FAIL [file:line — specific issue]:

1. AC Compliance — every AC in FEATURE_REQUIREMENTS.md satisfied in code
2. Plan Completion — every Sprint N [ ] in IMPLEMENTATION_PLAN.md is now [x]
3. Anti-Hallucination — no TODO / FIXME / placeholder / mock in production code
4. Naming Conventions — file names, component names match ARCHITECTURE_DESIGN.md
5. Architecture Compliance — component boundaries, data flow match the design
6. Prototype Fidelity — visual layout matches docs/ui-mocks/ screenshots
7. Test Coverage — every AC has at least one test in TEST_PLAN.md
8. No Breaking Changes — npm run build succeeds; existing pages still render
9. Styling Compliance — no inline styles, no <style> tags; Tailwind only
10. Tests Passing — npm test — 0 failures
11. Type Safety — npx tsc --noEmit — 0 errors

## Global UI Infrastructure Gate
Verify retro-dev/src/app/layout.tsx has className="dark" on <html>.
Verify tailwind.config.ts uses darkMode: ["class"].
If either is missing → ❌ FAIL Check 1.

## Output
Write docs/AUDIT_REPORT.md in retro-reviewer/docs/:
1. Summary verdict: APPROVED or REJECTED
2. 11-check table with ✅/❌
3. For any ❌: file, line number, required fix
4. Final sign-off statement

## Constraints
- Do NOT fix any code — only report
- If any check fails, verdict is REJECTED
```

3. Review output. If APPROVED, commit and push:
```bash
git add docs/AUDIT_REPORT.md
git commit -m "REVIEWER: Sprint N audit — APPROVED"
git push origin reviewer-branch
```

---

## Phase 3 Checklist (Per Sprint)

| Done? | Agent | Folder | Output Files | Gate |
|---|---|---|---|---|
| ☐ | PRODUCT | `retro-product/` | `docs/FEATURE_REQUIREMENTS.md` | Human review |
| ☐ | ARCHITECT + TEST | `retro-architect/` | `ARCHITECTURE_DESIGN.md` + `IMPLEMENTATION_PLAN.md` + `TEST_PLAN.md` | Human review |
| ☐ | DEV (each session) | `retro-dev/` | `src/` code + `IMPLEMENTATION_NOTES.md` | `npm test` ✅ + `tsc` ✅ + `build` ✅ |
| ☐ | PROFESSOR | `retro-dev/` | `docs/CODE_EXPLAINER.md` (appended) | Human skim |
| ☐ | REVIEWER | `retro-reviewer/` | `docs/AUDIT_REPORT.md` | APPROVED verdict |

---

## Phase 4: Ship

```bash
# From teams-retro/ (main branch)
git fetch origin dev-branch
git merge origin/dev-branch --no-edit
git push origin main
```

**Optional — deploy to Vercel** (zero config for Next.js):
1. Connect GitHub repo to Vercel at vercel.com
2. Every push to `main` auto-deploys
3. Preview URL replaces Replit smoke test

---

## Key Commands (Mac — No Restrictions)

| Action | Command | Where |
|---|---|---|
| Install deps | `npm install` | Any worktree |
| Run tests | `npm test` | `retro-dev/` |
| Type check | `npx tsc --noEmit` | `retro-dev/` |
| Build | `npm run build` | `retro-dev/` |
| Dev server | `npm run dev` | `retro-dev/` |
| Lint | `npm run lint` | `retro-dev/` |
| Coverage | `npm test -- --coverage` | `retro-dev/` |
| Push to GitHub | `git push origin [branch]` | Any worktree |

> **No `corepack`, no fallbacks, no workarounds.** `npm` and `npx` work directly.

---

## Tooling Choices (Unrestricted)

These are the recommended tools for a new project started fresh on Mac. For the existing Teams Retro project, the current stack is already set — this table is for future projects.

| Category | Recommended | Why |
|---|---|---|
| **Package manager** | `pnpm` | Fastest, strictest dependency isolation, monorepo-ready |
| **Test runner** | `Vitest` | Faster than Jest, native ESM, same API surface |
| **E2E tests** | `Playwright` | Cross-browser, auto-wait, VS Code extension |
| **Type checking** | `tsc` (strict mode) | Already used — no change |
| **Linting** | `ESLint` + `eslint-config-next` | Already used — no change |
| **Formatting** | `Prettier` | Add if not already in project |
| **Git hooks** | `husky` + `lint-staged` | Run lint + tsc on every commit |
| **CI** | GitHub Actions | Free for public repos; auto-run `npm test` on PR |
| **Deploy** | Vercel | Zero-config Next.js hosting |
| **DB** | MongoDB Atlas | Already used in Teams Retro |

### Adding Vitest to an Existing Jest Project (Optional Upgrade)

If you want to migrate Teams Retro from Jest → Vitest on Mac:

```bash
npm remove jest jest-environment-jsdom @testing-library/jest-dom @types/jest
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/jest-dom

# Create vitest.config.ts
# Update package.json: "test": "vitest run"
# Rename jest.config.js → remove it
```

Vitest is API-compatible with Jest — test files need zero changes (same `describe`, `it`, `expect`, `beforeEach`).

---

## Differences from v5 (Summary)

| Topic | v5 (7-Eleven Windows) | v6 (Personal Mac) |
|---|---|---|
| Package manager | `corepack yarn` (only option) | `npm` / `pnpm` (your choice) |
| Test runner | Jest (forced) | Jest or Vitest (your choice) |
| Running tests | `corepack yarn test` + npx fallback | `npm test` directly |
| Script execution policy | Blocked — required workarounds | No restrictions |
| Endpoint protection | Blocked `jest.cmd`, `tsc.cmd` | No restrictions |
| Replit | Required for prototypes + smoke test | Optional (localhost:3000 suffices) |
| Deployment | Replit preview (only option) | Vercel / Netlify / localhost |
| ARCHITECT + TEST | Two separate sessions (v5 default) | One combined session (recommended in both v5 and v6) |
| Node.js install | Blocked — used pre-installed v24 | Install freely via nvm or Homebrew |
| Environment variables | `.env.local` + corporate IT review risk | `.env.local` freely |

---

## File Map

```
~/Projects/
├── teams-retro/                     ← main branch
│   ├── .windsurf/
│   │   └── cascades/
│   │       ├── product.rules        ← PRODUCT agent rules
│   │       ├── architect.rules      ← ARCHITECT agent rules
│   │       ├── test.rules           ← TEST agent rules
│   │       ├── dev.rules            ← DEV agent rules
│   │       ├── professor.rules      ← PROFESSOR agent rules
│   │       └── reviewer.rules       ← REVIEWER agent rules
│   ├── docs/
│   │   ├── SprintN.md               ← YOU write this (human input)
│   │   ├── MAWv6.md                 ← This file
│   │   └── ui-mocks/                ← YOUR screenshots
├── retro-product/                   ← PRODUCT worktree
│   └── docs/FEATURE_REQUIREMENTS.md
├── retro-architect/                 ← ARCHITECT worktree
│   └── docs/ARCHITECTURE_DESIGN.md + IMPLEMENTATION_PLAN.md
├── retro-test/                      ← TEST worktree
│   └── docs/TEST_PLAN.md
├── retro-dev/                       ← DEV worktree (all code written here)
│   ├── src/
│   ├── docs/IMPLEMENTATION_NOTES.md + CODE_EXPLAINER.md
│   └── .env.local
└── retro-reviewer/                  ← REVIEWER worktree
    └── docs/AUDIT_REPORT.md
```

---

That's the complete v6 plan. The workflow is identical to v5 — PRODUCT → ARCHITECT+TEST → DEV → PROFESSOR → REVIEWER — just without any corporate restriction workarounds. Every tool works as documented.

---

## Phase 5: Persistent Memory MCP (Cross-Session Context)

### WHY THIS EXISTS

Every Cascade session starts fresh — it has no memory of prior sessions unless you paste a checkpoint or summary. For a multi-sprint project like Teams Retro, re-establishing context manually costs 10,000–30,000 tokens per session.

**MCP Memory servers** store facts externally in a queryable knowledge graph. Instead of pasting history, you ask Cascade: *"Recall everything about TeamsRetro"* — it retrieves only what's relevant (~200–500 tokens instead of 30,000).

### Token Impact

- **Overhead added**: Tool schemas inject ~2,000–8,000 tokens per conversation (fixed one-time cost)
- **Savings realized**: Replaces 10,000–30,000 tokens of manual context pasting per session
- **Net result**: Token-positive after the first 2–3 sessions

### Which tool: `@modelcontextprotocol/server-memory` vs. Mem0?

**Use only Mem0 OpenMemory MCP — it covers both local and cross-IDE needs:**

| Tool | Storage | Cross-IDE | Cross-Device | Verdict |
|---|---|---|---|---|
| `@modelcontextprotocol/server-memory` | Local JSON file | ❌ Windsurf only | ❌ No | Skip — too limited |
| **Mem0 OpenMemory MCP** | Local HTTP server (SQLite) | ✅ Any MCP client on machine | ✅ Cloud mode at app.mem0.ai | **Use this** |

Mem0 runs as an HTTP server. Any MCP-compatible IDE on the same machine (Windsurf, Cursor, Antigravity) connects to `http://localhost:8888`. For true cross-device access from a different machine, use the Mem0 cloud option.

### What to store where

| Content type | Right tool | Why |
|---|---|---|
| Architecture decisions, sprint history, known bugs | **MCP Memory** | Persistent facts, retrieved on demand |
| REVIEWER 18-point checklist | **`.windsurf/cascades/reviewer.rules`** | Always needed — never retrieved, always injected |
| Permanent conventions ("never use X") | **`.windsurf/rules` (global)** | Always active — not retrieved |
| Finding specific code | **Fast Context (code_search)** | Searches live files on disk — never store code in memory |
| In-session continuity (chat running long) | **Windsurf Checkpoints** | Auto-generated when context window fills |
| Cross-session project continuity | **MCP Memory** | Persists across separate conversations |

### Setup: Mem0 OpenMemory MCP on Mac

#### Step 5.1 — Install and run via Docker (recommended) or npx

**Option A — Docker** (persistent across reboots):
```bash
docker run -d --name openmemory-mcp -p 8888:8888 mem0ai/openmemory-mcp
# Restart after reboot:
docker start openmemory-mcp
```

**Option B — npx** (simpler, no Docker required on Mac):
```bash
npx -y mem0ai/openmemory-mcp
```

Add to a startup script or run manually before each Windsurf session.

#### Step 5.2 — Configure Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

**If using Docker:**
```json
{
  "mcpServers": {
    "memory": {
      "serverUrl": "http://localhost:8888/mcp",
      "transport": "http"
    }
  }
}
```

**If using npx:**
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "mem0ai/openmemory-mcp"]
    }
  }
}
```

Restart Windsurf. Verify `memory` shows a green dot in **Settings → Cascade → MCP Servers**.

#### Step 5.3 — Configure other IDEs (Hub-and-Spoke)

For Cursor, add the same entry to `~/.cursor/mcp.json`.
For any other MCP-compatible IDE, point it at `http://localhost:8888/mcp`.

**Replit**: Replit runs in a cloud container and cannot reach `localhost` on your Mac. Treat Replit as a deploy/test environment only — memory authoring happens in local IDEs.

#### Step 5.4 — Seed Teams Retro project context

Open a new Cascade chat and paste this prompt once:

```
Use the memory MCP tools to store the following project knowledge for Teams Retro.

ENTITIES:

1. Name: "TeamsRetro", Type: project
   Observations:
   - Next.js 14, React 18, TypeScript 5.3, Tailwind CSS 3.4, MongoDB Atlas, Mongoose
   - Deployed on Replit from main branch; development in Windsurf
   - App Router at src/app/ — NOT pages router
   - API routes at src/app/api/*/route.ts — server-side only
   - DB connection singleton at src/lib/db.ts
   - Mongoose models at src/lib/models/
   - sessionStorage key: retroboard_user
   - Client state via sessionStorage using userService.ts — no React Context used

2. Name: "WorktreeStructure", Type: architecture
   Observations:
   - teams-retro/ = main branch (docs, rules, production)
   - retro-dev/ = dev-branch (ALL Next.js source code written here)
   - retro-architect/ = architect-branch
   - retro-product/ = product-branch
   - retro-test/ = test-branch
   - retro-reviewer/ = reviewer-branch
   - Single .git repo with multiple worktrees — NOT separate repos
   - To merge dev to main: git merge from teams-retro/ folder, NOT retro-dev/
   - Merge command: git -C "teams-retro" merge dev-branch --no-ff -m "message"
   - Push to Replit: git push origin main from teams-retro/

3. Name: "DataModels", Type: schema
   Observations:
   - User: _id, name, username, pod, isAdmin, totalPoints, createdAt
   - Sprint: _id, name, goal, startDate, endDate, status (open/closed), teamMemberIds[]
   - FeedbackItem: _id, sprintId, authorId, category (slowed-us-down/should-try/went-well), content, suggestion, isAnonymous, upvotes, upvotedBy[], createdAt
   - ActionItem: _id, sprintId, ownerId, sourceFeedbackId, sourceQuote, title, description, status (open/in-progress/completed/verified), impactNote, dueDate, createdAt

4. Name: "APIRoutes", Type: architecture
   Observations:
   - GET/POST /api/users — user lookup and registration
   - GET /api/sprints — returns single active open sprint
   - PATCH /api/feedback/[id]/upvote — TOGGLES upvote (adds if not present, removes if already upvoted)
   - GET/POST /api/actions — requires sprintId query param
   - PATCH /api/actions/[id]/advance — open→in-progress→completed (409 if already completed)
   - PATCH /api/actions/[id]/regress — completed→in-progress→open (cannot regress verified)
   - PATCH /api/actions/[id]/verify — sets status=verified + impactNote

5. Name: "KeyFiles", Type: reference
   Observations:
   - retro-dev/src/app/page.tsx — landing page with Sign In / Register tabs
   - retro-dev/src/app/dashboard/page.tsx — dashboard, fetches sprint then actions
   - retro-dev/src/app/feedback/page.tsx — feedback board
   - retro-dev/src/app/action-items/page.tsx — REAL Action Items page (full implementation here)
   - retro-dev/src/app/actions/page.tsx — duplicate, local only, does NOT exist on Replit
   - retro-dev/src/components/layout/Shell.tsx — sidebar nav with logout button, href=/action-items
   - retro-dev/src/components/FeedbackCard.tsx — blue upvote button when user has already upvoted
   - retro-dev/src/services/actionService.ts — includes regressStatus()
   - retro-dev/src/services/userService.ts — getCurrentUser, cacheUser, getAllUsers
   - teams-retro/docs/CODE_EXPLAINER.md — PROFESSOR plain English explanations

6. Name: "AgentRoles", Type: workflow
   Observations:
   - PRODUCT: defines What and Why, outputs FEATURE_REQUIREMENTS.md
   - ARCHITECT: defines How (high level), no implementation code, outputs ARCHITECTURE_DESIGN.md + IMPLEMENTATION_PLAN.md
   - DEV: surgical edits, cites file paths and line numbers, no freelancing
   - TEST: TDD mindset, writes failing tests before DEV runs, never deletes tests
   - REVIEWER: 18-point checklist audit, Pass/Fail per AC
   - PROFESSOR: reads code, explains in plain English, appends to CODE_EXPLAINER.md

7. Name: "Conventions", Type: rules
   Observations:
   - On Mac: npm and npx work freely — no restrictions
   - NEVER modify test files in src/__tests__/ — fix code to match tests
   - NEVER add <style> tags or inline styles — Tailwind utility classes only
   - ALWAYS use absolute paths in agent prompts
   - ALWAYS cite file path and line numbers before a code change
   - Action Items nav link: href="/action-items" (not /actions — /actions does not exist on Replit)
   - Logout clears sessionStorage key "retroboard_user" and redirects to "/"

8. Name: "CompletedSprints", Type: progress
   Observations:
   - Sprint 1: Foundation, MongoDB connection, types, services, pages
   - Sprint 2: Feedback Board, upvote, Reframe Rule
   - Sprint 3: Action Items, advance/verify status workflow
   - Sprint 4: Sprint Setup page, admin controls, isAdmin gate
   - Sprint 5: Polish, error handling, empty states, data-testid attributes, smoke test prep
   - Bug Fix Sprint: sign-in flow, dashboard crash, feedback button guard, action regress, logout button, upvote toggle, nav href fix, Replit cache rebuild issue

RELATIONS:
- TeamsRetro → has_architecture → WorktreeStructure
- TeamsRetro → uses_schema → DataModels
- TeamsRetro → exposes → APIRoutes
- TeamsRetro → governed_by → Conventions
- TeamsRetro → built_with → AgentRoles
- TeamsRetro → contains → KeyFiles
- TeamsRetro → completed → CompletedSprints
```

#### Step 5.5 — Add memory recall to agent rules

Add to `dev.rules` and `reviewer.rules`:

```
* Session Start: Before any code changes, call memory MCP search_nodes for "TeamsRetro" to retrieve project context.
* Session End: Store any new architectural decisions or convention violations discovered as observations on the TeamsRetro entity.
```

#### Step 5.6 — Using memory in future sessions

At session start, instead of pasting a checkpoint:
```
Use memory tools to recall everything about TeamsRetro. Then [describe your task].
```

To add new facts:
```
Add to TeamsRetro memory: "The /actions route is local-only — always use /action-items."
```

### Phase 5 Checklist

| Done? | Item |
|---|---|
| ☐ | Mem0 running (Docker or npx) |
| ☐ | `~/.codeium/windsurf/mcp_config.json` updated |
| ☐ | Windsurf restarted — `memory` green in MCP settings |
| ☐ | Seed prompt run — 8 entities stored |
| ☐ | `dev.rules` and `reviewer.rules` updated with session-start recall |
| ☐ | Verified: new chat recalls TeamsRetro without pasting checkpoint |
