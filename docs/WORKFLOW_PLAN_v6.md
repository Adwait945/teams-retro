# Multi-Role Workflow Setup: Complete Step-by-Step Plan (v6 — Hub-and-Spoke + Yarn Edition)

**Architecture**: Replit (Design Studio) → GitHub (Bridge) → Windsurf (Engineering Floor) → GitHub → Replit (Smoke Test)

**Project**: Teams Retro — Next.js 14 / React 18 / Tailwind 3

**Roles**: PRODUCT · ARCHITECT · TEST · DEV · REVIEWER

**Date**: March 2026

---

## Confirmed Toolchain

| Tool | Status | Version | How to Invoke |
|---|---|---|---|
| **Node.js** | ✅ Works | v24.13.1 | `node` |
| **Git** | ✅ Works | (confirmed) | `git` |
| **Yarn** | ✅ Works | 1.22.22 (via Corepack) | `corepack yarn` |
| **Corepack** | ✅ Works | 0.34.6 | `corepack` |
| **npm** | ❌ Blocked | — | Not available on this machine |
| **npx** | ❌ Blocked | — | Not available on this machine |

### Command Translation Table (npm → corepack yarn)

Every command in this plan uses `corepack yarn`. Here is the mapping for reference:

| Action | npm (blocked) | corepack yarn (use this) |
|---|---|---|
| Install all deps | `npm install` | `corepack yarn install` |
| Add a dependency | `npm install <pkg>` | `corepack yarn add <pkg>` |
| Add a dev dependency | `npm install -D <pkg>` | `corepack yarn add -D <pkg>` |
| Run tests | `npm test` / `npx vitest run` | `corepack yarn test` / `corepack yarn vitest run` |
| Dev server | `npm run dev` | `corepack yarn dev` |
| Build | `npm run build` | `corepack yarn build` |
| Lint | `npm run lint` | `corepack yarn lint` |
| Type check | `npx tsc --noEmit` | `corepack yarn tsc --noEmit` |
| Run any bin | `npx <bin>` | `corepack yarn <bin>` |

> **Rule**: npm and npx do not exist on this machine. Always use `corepack yarn` as the prefix.

---

## Current Tech Stack (Teams Retro)

| Layer | Technology | Status |
|---|---|---|
| **Runtime** | Node.js 24 | ✅ Installed |
| **Package Manager** | Yarn 1.22 via Corepack | ✅ Confirmed working |
| **Framework** | Next.js 14 | ✅ In package.json |
| **UI Library** | React 18 + React DOM 18 | ✅ In package.json |
| **Styling** | Tailwind CSS 3.4 + CSS variables (shadcn/ui pattern) | ✅ In package.json |
| **Type Safety** | TypeScript 5.3 | ✅ In package.json |
| **Icons** | Lucide React | ✅ In package.json |
| **Charts** | Recharts | ✅ In package.json |
| **State** | React Context (`RetroProvider`) | ✅ Already built in src/store/retro-store.tsx |
| **Data** | In-memory mock data | ✅ Already built in src/data/mock-data.ts |
| **Test Runner** | Vitest (to be added by TEST agent) | 🔜 Sprint 1 |
| **Database** | None needed (frontend-only MVP) | N/A |
| **Backend/API** | None needed (frontend-only MVP) | N/A |
| **Auth** | None needed | N/A |

### Future Stack (Request via ServiceNow Now — Use Later)

Submit a ServiceNow request for the org-whitelisted stack as a parallel workstream:

- **MongoDB** — for document-based retro data storage
- **PostgreSQL** — for relational user/team/sprint data
- **Java** — for backend API services
- **React** — already in use (confirms org alignment)

These are needed for Sprint 3-4 (persistence, multi-user, auth) but not Sprint 1-2.

---

## How This Plan is Organized

There are **three environments**. Every step is labeled so you always know where you are:

| Icon | Environment | What It Is |
|---|---|---|
| 🎨 | **Replit** | Browser-based design studio. Build visual prototypes, write the backlog, final smoke test. |
| 🖥️ | **Windsurf (Local)** | Desktop IDE with Enterprise AI credits. All 5 agents run here with full power. |
| 🐙 | **GitHub** | Cloud bridge between Replit and Windsurf. Push from one, pull into the other. |

---

## The Big Picture

```
YOU (Human PM) → PRODUCT Agent → ARCHITECT Agent → TEST Agent → DEV Agent → REVIEWER Agent → YOU (Human PM)
```

1. **Phase 0 (Replit)** — Design Studio: sketch the UI, write the spec.
2. **Phase 1 (Local/GitHub)** — Shipping Dock: package the blueprint, ship to the factory.
3. **Phase 2 (Windsurf)** — Factory Floor: set up toolboxes, stations, communication boards.
4. **Phase 3 (Windsurf)** — Assembly Line: 5 AI agents do their specialized jobs in sequence.
5. **Phase 4 (Windsurf → GitHub)** — Quality Inspector signs off, ship the finished product.
6. **Phase 5 (Replit)** — Customer Test Drive: pull finished code, click through it live.

Each agent writes its output into a specific file. The next agent reads that file. They communicate through documents, like real enterprise teams.

---

## Phase 0: The Design Studio (Human Work)

### 📍 WHERE: 🎨 Replit (your browser)

### WHY THIS PHASE EXISTS
> Before any AI agent touches your project, **you** — the human product manager — must define what you want built. AI can translate, refine, and implement requirements, but it cannot *invent* them. This phase ensures the entire pipeline starts from your vision, not from AI hallucination.

### Step 0.1 — Build Your Visual Prototypes in Replit

> **What this means**: You use Replit's editor (or Replit Agent) to create React components that *look* like what you want. These are "dumb" UI — they render visuals but don't have real data, state management, or API calls. Think of them as a clay model: it looks right, but it can't drive.

1. Open your Replit project in the browser.
2. Build your `.tsx` component prototypes. Make them look the way you want.
3. Take **screenshots** of the finished screens (PNG/JPG).

### Step 0.2 — Write the Sprint Backlog

> **What this means**: The Sprint Backlog is a plain-English document that says "here's what I want built and how I'll know it's done." Each feature gets **Acceptance Criteria (AC)** — specific, testable statements that must be true for the feature to be considered complete.

1. In your Replit project, create `docs/SPRINT_1_BACKLOG.md`.
2. Write your Epics and Acceptance Criteria:

```markdown
# Sprint 1 Backlog — Teams Retro

## Epic 1: [Feature Name]
### Description
[What this feature does and why it matters to users]

### Acceptance Criteria
- AC-1: [A specific, testable pass/fail statement]
- AC-2: [Another testable statement]
- AC-3: [...]

### UI Reference
- Mock: docs/ui-mocks/[filename].png
- Prototype: docs/prototypes/[filename].tsx

### Out of Scope
- [What this epic does NOT include]

### Dependencies
- [Existing files, components, or libraries this feature builds on]
```

### Step 0.3 — Organize Your Replit Outputs for Export

> **What this means**: Put your work into specific folders so AI agents can find it later. `docs/prototypes/` is a staging area — separate from the real `src/` folder.

1. Create these folders in your Replit project (if they don't exist):
   - `docs/`
   - `docs/ui-mocks/`
   - `docs/prototypes/`
2. Move screenshots into `docs/ui-mocks/` (e.g., `dashboard.png`)
3. **Copy** (not move) prototype `.tsx` files into `docs/prototypes/` (e.g., `SentimentWidget.tsx`)

> ⚠️ **CRITICAL**: Do NOT put prototype `.tsx` files into `src/`. They go in `docs/prototypes/` ONLY.

### Step 0.4 — Push to GitHub from Replit

> **What this means**: Upload your work to GitHub so Windsurf can access it.

```bash
git add .
git commit -m "Phase 0: Backlog, UI mocks, and prototype components"
git push origin main
```

### Phase 0 Checklist

| Done? | Item |
|---|---|
| ☐ | Visual prototypes built in Replit |
| ☐ | Screenshots saved to `docs/ui-mocks/` |
| ☐ | Prototype `.tsx` files copied to `docs/prototypes/` (NOT in `src/`) |
| ☐ | `docs/SPRINT_1_BACKLOG.md` written with Epics and ACs |
| ☐ | Everything committed and pushed to GitHub (`main` branch) |

---

## Phase 1: The Shipping Dock (Git + GitHub Setup)

### 📍 WHERE: 🖥️ Windsurf Terminal (local machine) + 🐙 GitHub (browser)

### WHY THIS PHASE EXISTS
> This phase connects your local Windsurf workspace to GitHub so it can receive the work you did in Replit. If Replit is the Design Studio and Windsurf is the Factory, GitHub is the loading dock where blueprints arrive and finished products ship out.

### Step 1.1 — Fix Git Initialization

> **What this means**: Git tracks every change to your code. Right now Git is initialized in the wrong parent folder. We fix this.

```powershell
# Navigate to the parent directory
cd "C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro"

# Remove the misplaced .git folder
rmdir /s /q .git

# Remove the misplaced .windsurf folder (we'll recreate it properly)
rmdir /s /q .windsurf

# Navigate into the actual project
cd teams-retro

# Initialize Git in the correct location
git init
```

**Verify**: Run `git status`. All project files should show as "Untracked files."

### Step 1.2 — Create the GitHub Repository

> **What this means**: GitHub stores your Git repository in the cloud. Both Replit and Windsurf can push to and pull from it.

**📍 WHERE: 🐙 GitHub (browser)**

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `teams-retro`
3. **Visibility**: Private
4. ❌ Do NOT check "Add a README"
5. ❌ Do NOT check "Add .gitignore"
6. Click **"Create repository"**
7. Copy the HTTPS URL (e.g., `https://github.com/YOUR_USERNAME/teams-retro.git`)

### Step 1.3 — Connect Local Repo to GitHub and Push

> **What this means**: `git remote add` tells your local Git the cloud address. `git push` uploads everything.

**📍 WHERE: 🖥️ Windsurf Terminal**

```powershell
cd "C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro"

git add .
git commit -m "Initial commit: Teams Retro project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/teams-retro.git
git push -u origin main
```

### Step 1.4 — Pull Replit's Phase 0 Work (if Replit pushed first)

> **What this means**: If Phase 0 was done in Replit before connecting Windsurf, pull those changes down.

```powershell
git pull origin main
```

### Phase 1 Checklist

| Done? | Item |
|---|---|
| ☐ | Old `.git/` removed from parent `Teams Retro/` folder |
| ☐ | `git init` run inside `teams-retro/` |
| ☐ | GitHub repo created |
| ☐ | `git remote add origin` pointed to GitHub URL |
| ☐ | `git push -u origin main` succeeded |
| ☐ | Replit's Phase 0 work pulled down (if applicable) |

---

## Phase 2: Organize the Factory Floor (Scaffolding)

### 📍 WHERE: 🖥️ Windsurf (local machine — Editor + Terminal)

### WHY THIS PHASE EXISTS
> Before the AI agents can work, they need a structured workspace. Each agent reads from and writes to specific files — like workers on an assembly line who pick up parts from one bin and place finished pieces in another.

### Step 2.1 — Create the Communication Files

> **What this means**: Empty markdown files that act as "message boards." Each agent writes its output to a specific file, and the next agent reads from it.

```powershell
cd "C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro"

# Create docs directory and communication files (skip if docs/ exists from Replit Phase 0)
mkdir docs 2>nul
mkdir docs\ui-mocks 2>nul
mkdir docs\prototypes 2>nul

# Create placeholder communication files
echo # Feature Requirements > docs\FEATURE_REQUIREMENTS.md
echo # Architecture Design > docs\ARCHITECTURE_DESIGN.md
echo # Implementation Plan > docs\IMPLEMENTATION_PLAN.md
echo # Test Specification > docs\TEST_SPEC.md
echo # Implementation Notes > docs\IMPLEMENTATION_NOTES.md
echo # Test Report > docs\TEST_REPORT.md
echo # Audit Report > docs\AUDIT_REPORT.md

# Ensure drop zone directories are tracked by Git
echo. > docs\ui-mocks\.gitkeep
echo. > docs\prototypes\.gitkeep

# Remove old empty mockups directory (replaced by docs/ui-mocks)
rmdir mockups 2>nul
```

**Communication File Map:**

| File | Written By | Read By | Purpose |
|---|---|---|---|
| `SPRINT_1_BACKLOG.md` | **You (Human)** | PRODUCT | Your raw requirements |
| `FEATURE_REQUIREMENTS.md` | PRODUCT | ARCHITECT, TEST, DEV, REVIEWER | Polished user stories + acceptance criteria |
| `ARCHITECTURE_DESIGN.md` | ARCHITECT | TEST, DEV, REVIEWER | Technical blueprint (components, data flow) |
| `IMPLEMENTATION_PLAN.md` | ARCHITECT | DEV, REVIEWER | Jira-style checklist for DEV to execute |
| `TEST_SPEC.md` | TEST | DEV, REVIEWER | Test cases mapped to each acceptance criterion |
| `IMPLEMENTATION_NOTES.md` | DEV | REVIEWER | What DEV actually did, decisions made |
| `TEST_REPORT.md` | TEST (post-dev) | REVIEWER | Final test results (pass/fail) |
| `AUDIT_REPORT.md` | REVIEWER | **You (Human)** | 11-point compliance audit — the final verdict |

### Step 2.2 — Create the Agent Rule Files

> **What this means**: Each AI agent needs a "job description." These `.rules` files are Windsurf's native way to inject instructions into Cascade sessions.

```powershell
mkdir .windsurf 2>nul
mkdir .windsurf\cascades 2>nul
```

Create **5 files** inside `.windsurf/cascades/`:

#### `.windsurf/cascades/product.rules`

```markdown
# [PRODUCT] — Product Owner Mode
* Goal: Define "What" and "Why."
* Rules: Frame analysis in terms of user impact and business value. Translate requirements into Acceptance Criteria. Flag scope creep.
* Output Format: Use User Stories: "As a [user], I want [goal] so that [reason]."
* Input: docs/SPRINT_1_BACKLOG.md + docs/ui-mocks/ + docs/prototypes/
* Output: docs/FEATURE_REQUIREMENTS.md
* Analyze uploaded UI mock images for interactive elements, layout, and responsive breakpoints.
* Generate AC-UI-* acceptance criteria rows for visual/UX requirements discovered in mocks.
* Strict: Do NOT invent new requirements. Only translate what is in the backlog and visible in the mocks.
* Strict: Do NOT modify any source code in src/.
```

#### `.windsurf/cascades/architect.rules`

```markdown
# [ARCHITECT] — System Design Mode
* Goal: Define "How" (High Level).
* Rules: Focus on component boundaries, data flow, and scalability.
* Strict Constraint: Do NOT write implementation code — only propose structure, patterns, and folder hierarchy. Identify potential breaking changes.
* Input: docs/FEATURE_REQUIREMENTS.md + docs/prototypes/*.tsx
* Output: docs/ARCHITECTURE_DESIGN.md + docs/IMPLEMENTATION_PLAN.md
* Review prototype code in docs/prototypes/ for: visual inventory, gap analysis (state, data, events, accessibility), style conversion needs.
* ARCHITECTURE_DESIGN.md must include a prototype integration strategy for DEV.
* IMPLEMENTATION_PLAN.md must be a Jira-style checklist with [ ] checkboxes that DEV will execute.
* Strict: Do NOT modify any source code in src/.
```

#### `.windsurf/cascades/test.rules`

```markdown
# [TEST] — Quality Assurance Mode (ATDD — Runs BEFORE DEV)
* Goal: Verification & Stability.
* Rules: Adopt an Acceptance Test-Driven Development mindset. Write failing tests BEFORE implementation exists.
* Cover "Happy Paths," edge cases, and failure modes. Include AC-UI-* test cases.
* Input: docs/FEATURE_REQUIREMENTS.md + docs/ARCHITECTURE_DESIGN.md + docs/IMPLEMENTATION_PLAN.md
* Output: docs/TEST_SPEC.md + failing test files in src/__tests__/
* Package Manager: Use `corepack yarn` (npm is NOT available on this machine).
* Install test runner: corepack yarn add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
* Create docs/TEST_SPEC.md mapping each AC-ID to one or more test cases.
* Write test files in src/__tests__/ based on ARCHITECT's component paths.
* Verify all tests FAIL (corepack yarn test) — confirms they test code that doesn't exist yet.
* Strict: Never delete or weaken existing tests.
```

#### `.windsurf/cascades/dev.rules`

```markdown
# [DEV] — Developer / Integration Engineer Mode
* Goal: Implementation & Maintenance.
* Rules: No freelancing. Follow existing naming, formatting, and patterns exactly.
* Surgical Edits: Keep changes minimal and focused. Do not refactor unrelated code.
* Traceability: Always cite file paths and line numbers before making a change.
* Integration: Copy prototype from docs/prototypes/ into src/. Preserve visual layout. Wire up logic, hooks, state, and convert inline styles to Tailwind utility classes.
* Execute IMPLEMENTATION_PLAN.md checklist, marking [x] as you complete each task.
* Package Manager: Use `corepack yarn` (npm is NOT available on this machine).
* Code until ALL tests pass (corepack yarn test).
* Output: Working code in src/ + checked-off IMPLEMENTATION_PLAN.md + docs/IMPLEMENTATION_NOTES.md
* CSS: Use Tailwind utility classes ONLY. Do NOT add <style> tags or inline styles unless no utility class exists.
* Strict: Do NOT modify or delete any test files in src/__tests__/.
```

#### `.windsurf/cascades/reviewer.rules`

```markdown
# [REVIEWER] — Code Auditor Mode
* Goal: Quality Control & Compliance.
* Rules: Audit against PRODUCT Acceptance Criteria.
* Anti-Hallucination: Ensure no "placeholder" logic or // TODO comments were left behind.
* Convention Police: Verify naming and structure match the ARCHITECT plan.
* Output Format: Provide a "Pass/Fail" summary for each Acceptance Criterion.
* Input: All upstream docs/ files + src/ implementation
* Output: docs/AUDIT_REPORT.md
* Package Manager: Use `corepack yarn` (npm is NOT available on this machine).

## 11-Point Audit Checklist
1. AC Compliance — Every AC in FEATURE_REQUIREMENTS.md has a Pass/Fail
2. Plan Completion — Every [ ] in IMPLEMENTATION_PLAN.md is now [x]
3. Anti-Hallucination — No // TODO, placeholder, or mock data left in production code
4. Naming Conventions — Files, components, variables match ARCHITECTURE_DESIGN.md
5. Architecture Compliance — Component boundaries, data flow match the design
6. Prototype Fidelity — Visual layout matches docs/ui-mocks/ screenshots
7. Test Coverage — Every AC has at least one test in TEST_SPEC.md
8. No Breaking Changes — Existing features still work (corepack yarn build passes)
9. Styling Compliance — Tailwind only, no inline styles, no <style> tags
10. Tests Passing — corepack yarn test — 0 failures
11. Type Safety — corepack yarn tsc --noEmit — 0 errors
```

### Step 2.3 — Create the Worktree Setup Hook

> **What this means**: When Windsurf creates a worktree (a separate copy of your project for an agent to work in), it needs `node_modules/` installed. This hook runs automatically every time a worktree is created.

Create `.windsurf/hooks.json`:

```json
{
  "hooks": {
    "post_setup_worktree": [
      {
        "command": "bash -c \"cp $ROOT_WORKSPACE_PATH/.env* . 2>/dev/null; corepack yarn install\"",
        "show_output": true
      }
    ]
  }
}
```

> **Plain English**: "Every time a new worktree is created, copy any `.env` files from the main project and run `corepack yarn install` so the worktree is ready to go."

### Step 2.4 — Install Dependencies

> **What this means**: Downloads all the libraries your project needs into `node_modules/`.

```powershell
cd "C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro"
corepack yarn install
```

### Step 2.5 — Commit and Push the Scaffolding

```powershell
git add .
git commit -m "Phase 2: Add workflow scaffolding (docs/, rules, hooks)"
git push origin main
```

### Phase 2 Checklist

| Done? | Item |
|---|---|
| ☐ | `docs/` folder with 7 communication `.md` files |
| ☐ | `docs/ui-mocks/` and `docs/prototypes/` directories exist |
| ☐ | `.windsurf/cascades/` with 5 `.rules` files |
| ☐ | `.windsurf/hooks.json` with `post_setup_worktree` hook (using `corepack yarn`) |
| ☐ | `corepack yarn install` completed (`node_modules/` populated) |
| ☐ | Everything committed and pushed to GitHub |

---

## Phase 3: The Assembly Line (Running the 5 Agents)

### 📍 WHERE: 🖥️ Windsurf (local machine — Cascade panel)

### WHY THIS PHASE EXISTS
> Five AI agents execute in sequence, each reading the previous agent's output and writing its own. You paste a prompt into a Windsurf Cascade session, the AI does its job in an isolated worktree, and you review the result before the next agent starts.

### How Windsurf Worktrees Work

> A **worktree** is a separate copy of your entire project folder, managed by Git. Toggle "Worktree" mode in the Cascade input, and Windsurf creates one at `~/.windsurf/worktrees/teams-retro/<random-name>/`. The agent edits files in this copy, not in your main project. When you're happy, click "Merge" to bring changes back.

### Step 3.0 — Open Windsurf with the Correct Workspace

```
File → Open Folder → C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro
```

### Execution Order

```
YOU (Human) → PRODUCT → ARCHITECT → TEST → DEV → REVIEWER → YOU (Human)
```

> **Why TEST before DEV?** This is Acceptance Test-Driven Development (ATDD). The tester writes tests that define what "done" looks like. The developer's job is to make those tests pass.

---

### Agent 1: PRODUCT

> **What this agent does**: Reads your plain-English backlog and UI mock screenshots, then translates them into structured, formal Acceptance Criteria. Think of it as a business analyst who takes your whiteboard sketch and turns it into a polished requirements document.

1. Open a **new Cascade session** (click `+` on the Cascade panel).
2. Toggle **"Worktree"** mode at the bottom-right of the Cascade input box.
3. Paste this prompt:

```
[PRODUCT]

## Pre-Flight
1. Read docs/SPRINT_1_BACKLOG.md
2. Read every image file in docs/ui-mocks/
3. Read every .tsx file in docs/prototypes/

## Task
You are the Product Owner. Your ONLY job is to translate the human-authored backlog and UI mocks into structured, formal requirements.

For each Epic in SPRINT_1_BACKLOG.md:
1. Write a User Story: "As a [user], I want [goal] so that [reason]."
2. Copy the Acceptance Criteria from the backlog verbatim, then refine for testability.
3. Analyze the UI mock images: identify every interactive element, layout zone, and responsive breakpoint. Add AC-UI-* rows for each visual requirement discovered.
4. List dependencies on existing files (reference src/types/index.ts, src/store/retro-store.tsx, etc.).

## Output
Write the complete result to docs/FEATURE_REQUIREMENTS.md

## Constraints
- Do NOT invent requirements not present in the backlog or visible in the mocks.
- Do NOT modify any file in src/.
- Do NOT create new components.

When done, run: git diff --stat
```

4. **Review the output.** Read `docs/FEATURE_REQUIREMENTS.md`. Does it accurately reflect your backlog?
5. If satisfied, click **"Merge"** in Cascade to bring changes into main workspace.
6. Commit:

```powershell
git add docs/FEATURE_REQUIREMENTS.md
git commit -m "PRODUCT: Feature requirements for Sprint 1"
```

---

### Agent 2: ARCHITECT

> **What this agent does**: Reads the polished requirements and the prototype code, then designs the technical blueprint — which components to create, where they live, what data flows between them, and how to integrate the Replit prototype. Also produces a Jira-style task checklist.

1. Open a **new Cascade session** + toggle **"Worktree"** mode.
2. Paste this prompt:

```
[ARCHITECT]

## Pre-Flight
1. Read docs/FEATURE_REQUIREMENTS.md
2. Read every .tsx file in docs/prototypes/
3. Read src/types/index.ts
4. Read src/store/retro-store.tsx
5. Read src/app/layout.tsx
6. Skim src/components/ and src/app/ for existing patterns.

## Task
You are the System Architect. Design the technical solution for every requirement in FEATURE_REQUIREMENTS.md.

1. **Component Inventory**: List every new component needed. For each: file path, props interface, parent component, data source.
2. **Prototype Review**: For each file in docs/prototypes/:
   - Visual Inventory: What does it render?
   - Gap Analysis: What's missing? (state management, API calls, error handling, loading states, accessibility, responsive behavior)
   - Style Conversion: What inline styles or CSS need Tailwind conversion?
   - Integration Path: Step-by-step instructions for DEV.
3. **Data Flow**: How data moves from store → component → UI. Note any new types, store methods, or API endpoints.
4. **Breaking Change Risk**: What could break existing pages (Dashboard, Feedback, Action Items, Leaderboard, Digest)?

## Output — Two Files

### docs/ARCHITECTURE_DESIGN.md
Full design document: component inventory, prototype integration strategy, data flow, breaking change assessment.

### docs/IMPLEMENTATION_PLAN.md
Jira-style checklist:
```
## Implementation Checklist
- [ ] TASK-1: [Description] — File: [path]
- [ ] TASK-2: [Description] — File: [path]
```
Each task must be small enough to complete in one edit session.

## Constraints
- Do NOT write implementation code.
- Do NOT modify any file in src/.

When done, run: git diff --stat
```

3. **Review.** Does the architecture make sense? Is the checklist granular enough?
4. Click **"Merge"** → Commit:

```powershell
git add docs/ARCHITECTURE_DESIGN.md docs/IMPLEMENTATION_PLAN.md
git commit -m "ARCHITECT: Design and implementation plan for Sprint 1"
```

---

### Agent 3: TEST

> **What this agent does**: Writes test cases *before any code is written*. Creates test files that import components that don't exist yet — so every test will FAIL. That's intentional. These failing tests define what "done" looks like.

1. Open a **new Cascade session** + toggle **"Worktree"** mode.
2. Paste this prompt:

```
[TEST]

## Pre-Flight
1. Read docs/FEATURE_REQUIREMENTS.md
2. Read docs/ARCHITECTURE_DESIGN.md
3. Read docs/IMPLEMENTATION_PLAN.md
4. Read src/types/index.ts
5. Read package.json

## IMPORTANT: Package Manager
npm and npx are NOT available on this machine. Use `corepack yarn` for ALL commands.

## Task
You are the QA Engineer using Acceptance Test-Driven Development (ATDD). Write tests BEFORE the code exists.

### Step 1 — Install Test Runner
Run:
```
corepack yarn add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

Create `vitest.config.ts` at project root:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create `src/__tests__/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

Add to package.json scripts: `"test": "vitest run"`

### Step 2 — Write TEST_SPEC.md
Create docs/TEST_SPEC.md:

| AC-ID | Test File | Test Name | Type | Expected |
|---|---|---|---|---|
| AC-1 | src/__tests__/[name].test.tsx | [test name] | unit/integration | [expected behavior] |

### Step 3 — Write Test Files
Create test files in `src/__tests__/` based on ARCHITECT's component paths.

### Step 4 — Verify Tests Fail
Run: `corepack yarn test`
Every test should FAIL. If any passes, it's testing the wrong thing.

## Output
- Updated package.json (with vitest deps)
- vitest.config.ts
- src/__tests__/setup.ts
- src/__tests__/*.test.tsx (failing test files)
- docs/TEST_SPEC.md

## Constraints
- Never delete or weaken existing tests.
- Tests must fail at this stage.

When done, run: corepack yarn test 2>&1 | tail -20
```

3. **Review.** Does every AC have at least one test? Did tests all fail? (They should.)
4. Click **"Merge"** → Commit:

```powershell
git add .
git commit -m "TEST: Failing test suite for Sprint 1 (ATDD)"
```

---

### Agent 4: DEV

> **What this agent does**: The integration engineer. Takes the prototype from `docs/prototypes/`, wires it into production with real state, data hooks, error handling — and makes every failing test pass.

1. Open a **new Cascade session** + toggle **"Worktree"** mode.
2. Paste this prompt:

```
[DEV]

## Pre-Flight
1. Read docs/FEATURE_REQUIREMENTS.md
2. Read docs/ARCHITECTURE_DESIGN.md
3. Read docs/IMPLEMENTATION_PLAN.md
4. Read docs/TEST_SPEC.md
5. Read every .tsx file in docs/prototypes/
6. Read src/types/index.ts, src/store/retro-store.tsx, src/app/layout.tsx
7. Read all test files in src/__tests__/
8. Run: corepack yarn install

## IMPORTANT: Package Manager
npm and npx are NOT available on this machine. Use `corepack yarn` for ALL commands.

## Task
You are the Integration Engineer. Execute every task in IMPLEMENTATION_PLAN.md until ALL tests pass.

### Integration Workflow
For each prototype in docs/prototypes/:
1. Copy to correct src/ location per ARCHITECT's plan.
2. Preserve visual layout exactly.
3. Wire real logic: store hooks (useRetro), TypeScript types, loading/error states.
4. Convert inline styles to Tailwind. Reference globals.css for CSS variables and tailwind.config.ts for design tokens.
5. Integrate with RetroProvider context and routing.

### Execution Loop
1. Pick next unchecked [ ] item from IMPLEMENTATION_PLAN.md.
2. Implement it. Cite file path and line numbers.
3. Mark it [x] in IMPLEMENTATION_PLAN.md.
4. Run: corepack yarn test
5. If tests fail, fix implementation (NOT tests). Repeat until green.
6. Move to next item.

### Final Checks
After all items are [x]:
1. corepack yarn test (all pass)
2. corepack yarn tsc --noEmit (no type errors)
3. corepack yarn lint (no lint errors)
4. corepack yarn build (build succeeds)

## Output
- All implementation code in src/
- Updated docs/IMPLEMENTATION_PLAN.md (all [x])
- docs/IMPLEMENTATION_NOTES.md

## Constraints
- Do NOT modify or delete any test files in src/__tests__/.
- Do NOT alter visual layout from prototype without documenting reason.
- Do NOT add <style> tags or inline styles — Tailwind only.
- Fix code to match tests, never fix tests to match code.

When done, run: corepack yarn test && corepack yarn tsc --noEmit && corepack yarn build
```

3. **Review.** All tests pass? Build succeeds? Read `IMPLEMENTATION_NOTES.md`.
4. Click **"Merge"** → Commit:

```powershell
git add .
git commit -m "DEV: Implementation for Sprint 1 — all tests passing"
```

---

### Agent 5: REVIEWER

> **What this agent does**: Final quality gate. Runs an 11-point audit checking code against requirements, architecture, tests, and visual mocks. If any check fails, the feature doesn't ship.

1. Open a **new Cascade session** + toggle **"Worktree"** mode.
2. Paste this prompt:

```
[REVIEWER]

## Pre-Flight
1. Read docs/FEATURE_REQUIREMENTS.md
2. Read docs/ARCHITECTURE_DESIGN.md
3. Read docs/IMPLEMENTATION_PLAN.md
4. Read docs/TEST_SPEC.md
5. Read docs/IMPLEMENTATION_NOTES.md
6. Read all files in src/__tests__/
7. Read all new/modified files in src/ (check git diff --name-only main)
8. Run: corepack yarn install

## IMPORTANT: Package Manager
npm and npx are NOT available on this machine. Use `corepack yarn` for ALL commands.

## Task
Perform a comprehensive 11-point audit. For EACH check: ✅ PASS or ❌ FAIL with explanation.

### Audit Checklist

| # | Check | How to Verify |
|---|---|---|
| 1 | **AC Compliance** | Every AC in FEATURE_REQUIREMENTS.md is satisfied |
| 2 | **Plan Completion** | Every [ ] in IMPLEMENTATION_PLAN.md is now [x] |
| 3 | **Anti-Hallucination** | grep -r "TODO\|FIXME\|placeholder\|mock" src/ — no hits in production |
| 4 | **Naming Conventions** | Files, components, variables match ARCHITECTURE_DESIGN.md |
| 5 | **Architecture Compliance** | Component boundaries, data flow match the design |
| 6 | **Prototype Fidelity** | Visual layout matches docs/ui-mocks/ screenshots |
| 7 | **Test Coverage** | Every AC has at least one test |
| 8 | **No Breaking Changes** | corepack yarn build succeeds; existing pages still render |
| 9 | **Styling Compliance** | No inline styles, no <style> tags; Tailwind only |
| 10 | **Tests Passing** | corepack yarn test — 0 failures |
| 11 | **Type Safety** | corepack yarn tsc --noEmit — 0 errors |

### Run These Commands
```
corepack yarn test
corepack yarn tsc --noEmit
corepack yarn build
corepack yarn lint
grep -rn "TODO\|FIXME\|placeholder" src/ --include="*.ts" --include="*.tsx"
```

## Output
Write docs/AUDIT_REPORT.md:
1. Summary verdict: APPROVED or REJECTED
2. 11-check table with ✅/❌
3. For any ❌: specific file, line, and fix needed
4. Final sign-off statement

## Constraints
- Do NOT fix any code — only report issues.
- If any check fails, verdict is REJECTED.
```

3. **Review.** If APPROVED → Phase 4. If REJECTED → re-run the failing agent, then re-run REVIEWER.
4. Click **"Merge"** → Commit:

```powershell
git add docs/AUDIT_REPORT.md
git commit -m "REVIEWER: Audit report for Sprint 1"
```

### Phase 3 Checklist

| Done? | Agent | Output Files | Tests |
|---|---|---|---|
| ☐ | PRODUCT | `docs/FEATURE_REQUIREMENTS.md` | — |
| ☐ | ARCHITECT | `docs/ARCHITECTURE_DESIGN.md` + `docs/IMPLEMENTATION_PLAN.md` | — |
| ☐ | TEST | `docs/TEST_SPEC.md` + `src/__tests__/*.test.tsx` + `vitest.config.ts` | All FAIL ✅ (expected) |
| ☐ | DEV | `src/` code + `docs/IMPLEMENTATION_NOTES.md` + plan all [x] | All PASS ✅ |
| ☐ | REVIEWER | `docs/AUDIT_REPORT.md` | Verdict: APPROVED |

---

## Phase 4: Ship It (Merge + Push to GitHub)

### 📍 WHERE: 🖥️ Windsurf Terminal → 🐙 GitHub

### WHY THIS PHASE EXISTS
> All agent work happened locally. Push the finished, audited code to GitHub so Replit can pull it for the smoke test and you have a complete Git history.

### Step 4.1 — Push to GitHub

```powershell
cd "C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro"
git push origin main
```

### Step 4.2 — Verify on GitHub

**📍 WHERE: 🐙 GitHub (browser)**

1. Go to your repo on GitHub
2. Verify all commits from Phases 0–3
3. Verify `docs/AUDIT_REPORT.md` shows APPROVED
4. Verify `src/` contains new components

---

## Phase 5: Customer Test Drive (Smoke Test in Replit)

### 📍 WHERE: 🎨 Replit (browser)

### WHY THIS PHASE EXISTS
> The agents wrote code, ran tests, and passed an audit — but you haven't *seen* it run yet. Pull the finished product back to Replit's live preview and click through it like a real user.

### Step 5.1 — Pull the Finished Code

```bash
git pull origin main
corepack yarn install
```

> Note: If Replit has npm available, you can use `npm install` instead. The `corepack yarn` requirement is specific to the Windsurf machine.

### Step 5.2 — Run the App

```bash
npm run dev
```

(Or `corepack yarn dev` if on the Windsurf machine.)

### Step 5.3 — Validate Against Your Mocks

Compare live preview against `docs/ui-mocks/` screenshots:

- Does the layout match your mock?
- Do all interactive elements work?
- Does data display correctly?
- Does it look right on different screen sizes?

### Step 5.4 — Ship or Fix

- **If everything looks good**: 🎉 Sprint 1 complete. Start `SPRINT_2_BACKLOG.md`.
- **If something is wrong**: Note the issue, go back to Phase 3, re-run the relevant agent.

---

## Quick Reference Card

### The Flow (One Feature Cycle)

```
┌─────────────────────────────────────────────────────────┐
│  🎨 REPLIT (Design Studio)                              │
│  ✍️ Write backlog + Build prototypes + Take screenshots  │
│  📤 git push origin main                                │
└──────────────────────────┬──────────────────────────────┘
                           │
                     🐙 GITHUB
                           │
┌──────────────────────────▼──────────────────────────────┐
│  🖥️ WINDSURF (Engineering Floor)                        │
│  📥 git pull origin main                                │
│  🤖 PRODUCT → ARCHITECT → TEST → DEV → REVIEWER         │
│     (each in its own worktree)                          │
│  📤 git push origin main                                │
└──────────────────────────┬──────────────────────────────┘
                           │
                     🐙 GITHUB
                           │
┌──────────────────────────▼──────────────────────────────┐
│  🎨 REPLIT (Smoke Test)                                 │
│  📥 git pull origin main                                │
│  👀 Run dev server → Click through live preview          │
│  ✅ Approve or 🔁 send back for fixes                   │
└─────────────────────────────────────────────────────────┘
```

### Key Commands (Windsurf Machine)

| Action | Command |
|---|---|
| Install all deps | `corepack yarn install` |
| Add a dependency | `corepack yarn add <pkg>` |
| Add a dev dependency | `corepack yarn add -D <pkg>` |
| Run tests | `corepack yarn test` |
| Dev server | `corepack yarn dev` |
| Build | `corepack yarn build` |
| Lint | `corepack yarn lint` |
| Type check | `corepack yarn tsc --noEmit` |
| Push to GitHub | `git add . && git commit -m "msg" && git push origin main` |
| Pull from GitHub | `git pull origin main` |

### File Map

```
teams-retro/
├── .windsurf/
│   ├── cascades/
│   │   ├── product.rules      ← PRODUCT agent job description
│   │   ├── architect.rules    ← ARCHITECT agent job description
│   │   ├── test.rules         ← TEST agent job description
│   │   ├── dev.rules          ← DEV agent job description
│   │   └── reviewer.rules     ← REVIEWER agent job description
│   └── hooks.json             ← Auto-installs deps in worktrees
├── docs/
│   ├── SPRINT_1_BACKLOG.md    ← YOU write this (human input)
│   ├── FEATURE_REQUIREMENTS.md ← PRODUCT writes this
│   ├── ARCHITECTURE_DESIGN.md  ← ARCHITECT writes this
│   ├── IMPLEMENTATION_PLAN.md  ← ARCHITECT writes, DEV checks off
│   ├── TEST_SPEC.md            ← TEST writes this
│   ├── IMPLEMENTATION_NOTES.md ← DEV writes this
│   ├── TEST_REPORT.md          ← TEST writes this (post-dev)
│   ├── AUDIT_REPORT.md         ← REVIEWER writes this (final verdict)
│   ├── WORKFLOW_PLAN_v6.md     ← THIS FILE (the plan itself)
│   ├── ui-mocks/               ← YOUR screenshots go here
│   └── prototypes/             ← YOUR Replit .tsx files go here
└── src/                        ← PRODUCTION CODE (only DEV writes here)
    ├── app/                    ← Next.js pages
    ├── components/             ← Reusable UI components
    ├── data/                   ← Mock data
    ├── lib/                    ← Utilities
    ├── store/                  ← React Context store
    ├── types/                  ← TypeScript interfaces
    └── __tests__/              ← Test files (created by TEST agent)
```

---

## Version History

| Version | Date | Key Change |
|---|---|---|
| v1 | Mar 2026 | Initial plan with local Git worktrees, 3 roles |
| v2 | Mar 2026 | Added human-driven requirements, ATDD, 5 roles, UI mock handoff |
| v3 | Mar 2026 | Added Replit prototype integration workflow |
| v4 | Mar 2026 | Rewritten for StackBlitz + GitHub branches (5 browser tabs) |
| v5 | Mar 2026 | Hub-and-Spoke: Replit (design) → GitHub → Windsurf (local worktrees) → Replit (smoke test) |
| **v6** | **Mar 2026** | **v5 + Yarn/Corepack toolchain (npm unavailable). All commands use `corepack yarn`. Confirmed: Node v24.13.1, Yarn 1.22.22, Git ✅.** |
