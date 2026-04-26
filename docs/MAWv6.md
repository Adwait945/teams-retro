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

> **What TEST does**: Writes the complete test plan covering **two tiers** — Tier 1 (Jest/RTL component tests) and Tier 2 (Playwright E2E browser scenarios). Every Tier 1 test should FAIL before DEV runs. Tier 2 scenarios are executed by the Playwright MCP browser agent in Antigravity after DEV ships.

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

---

## TIER 2: E2E Test Scenarios (for Playwright / Antigravity browser agent)

For each Epic, write E2E scenarios in this format:
- Scenario ID: E2E-N.X
- Page: /route
- Preconditions: (user state, sprint state, data required)
- Steps: numbered click/type/navigate actions
- Assertions: what must be true (URL, visible text, element state, network response)
- data-testid anchors used: list all data-testid values this scenario depends on

Append E2E scenarios to: retro-test/docs/TEST_PLAN.md under "## Sprint N — E2E Scenarios"

Constraint: Every E2E scenario must be executable by a browser agent that can only
observe: URL, visible DOM text, element existence, and network responses.
Do NOT write scenarios that require reading application state or sessionStorage directly.
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

> **Model-aware output rule**: Declare your context window at the top of every DEV prompt using `[MODEL: 200K]`, `[MODEL: 1M]`, or `[MODEL: 2M]`. This controls whether the agent chunks large file edits or writes complete files per turn. See Output Length Rules below.

1. Open a **new Cascade session** in the `retro-dev/` folder.
2. Paste this prompt for **Session 1**:

```
[DEV] [MODEL: 1M] — Sprint N, Session 1

## Output Length Rule (derived from [MODEL] tag above)
# [MODEL: 200K] → split any single file edit >300 lines into sequential edits, each compilable
# [MODEL: 1M]   → write complete file implementations per turn; do not pre-split; ATDD is the quality gate
# [MODEL: 2M]   → same as 1M (Gemini / Antigravity)

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
| ☐ | ARCHITECT + TEST | `retro-architect/` | `ARCHITECTURE_DESIGN.md` + `IMPLEMENTATION_PLAN.md` + `TEST_PLAN.md` (Tier 1 + Tier 2) | Human review |
| ☐ | DEV (each session) | `retro-dev/` | `src/` code + `IMPLEMENTATION_NOTES.md` | `npm test` ✅ + `tsc` ✅ + `build` ✅ — declare `[MODEL: Xm]` in prompt |
| ☐ | PROFESSOR | `retro-dev/` | `docs/CODE_EXPLAINER.md` (appended) | Human skim |
| ☐ | REVIEWER | `retro-reviewer/` | `docs/AUDIT_REPORT.md` | APPROVED verdict |
| ☐ | E2E (Antigravity) | Antigravity + Playwright MCP | TEST_PLAN.md Tier 2 scenarios executed | All E2E scenarios pass |

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
| **E2E tests** | `Playwright` + Playwright MCP (in Antigravity) | Cross-browser, auto-wait, browser agent in Antigravity |
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
| DEV output rule | 300-line chunk rule (always) | Model-aware: 300-line chunks at 200K, full-file per turn at 1M/2M |
| UI/E2E testing | Playwright headless via corepack yarn | Playwright MCP browser agent in Antigravity (recommended) |
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
