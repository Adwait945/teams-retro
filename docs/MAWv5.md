# Multi-Role Workflow Setup: Complete Step-by-Step Plan (v5 — Hub-and-Spoke Edition)

**Architecture**: Replit (Design Studio — prototypes + screenshots only) → GitHub (Bridge) → Windsurf (Engineering Floor) → GitHub → Replit (Sprint 5 Smoke Test only)

**Your Project**: Teams Retro — Next.js 14 / React 18 / Tailwind 3

**Roles**: PRODUCT · ARCHITECT · TEST · DEV · PROFESSOR · REVIEWER

---

## How This Plan is Organized

There are **three environments** you'll work in. Every step is labeled so you always know where you are:

| Icon | Environment | What It Is |
|---|---|---|
| 🎨 | **Replit** | Your browser-based design studio. This is where you build visual prototypes, write the backlog, and do the final smoke test. Think of it as the "art department." |
| 🖥️ | **Windsurf (Local)** | Your desktop IDE with Enterprise AI credits. This is the "engineering floor." All 5 AI agents run here with full power — reading files, writing code, running tests, executing terminal commands. |
| 🐙 | **GitHub** | The bridge between Replit and Windsurf. It's a cloud-based storage locker for your code. You push code up from one environment and pull it down into the other. |

> 🚫 **CRITICAL — Carbon Black App Control + Windows Execution Policy (applies to ALL agents)**
> This machine runs 7-Eleven endpoint protection (Carbon Black App Control) which blocks any unapproved binary. **No agent should ever attempt these — skip them entirely, do NOT retry, do NOT try alternate paths:**
> - `npx` (any form) — PowerShell execution policy blocks it
> - `node_modules\.bin\jest.cmd` — Carbon Black blocks `.cmd` wrappers
> - `node_modules\.bin\tsc.cmd` — Carbon Black blocks `.cmd` wrappers
> - `node node_modules/jest/bin/jest.js` — Carbon Black blocks this binary path
> - `node node_modules/typescript/bin/tsc` — Carbon Black blocks this binary path
> - Any file under `node_modules/.bin/` invoked directly — all `.cmd` wrappers are blocked
>
> **The only commands that work on this machine:**
> - `corepack yarn test` — runs Jest (configured in package.json as `"test": "jest"`)
> - `corepack yarn tsc --noEmit` — type check via corepack
> - `corepack yarn build` — production build via corepack
> - `git` commands — always work
>
> If `corepack yarn test` fails, **STOP. Report the error verbatim. Do NOT try any fallback.** Wait for human input. Never loop through command variants.

---

## The Big Picture (Read This First)

Imagine a car factory:

1. **Phase 0 (Replit)** — The *Design Studio* sketches the car and writes the spec sheet.
2. **Phase 1 (Local/GitHub)** — The *Shipping Dock* packages the blueprint and ships it to the factory.
3. **Phase 2 (Windsurf)** — The *Factory Floor* is organized: toolboxes, stations, and communication boards are set up.
4. **Phase 3 (Windsurf)** — The *Assembly Line Workers* (5 AI agents) each do their specialized job in sequence.
5. **Phase 4 (Windsurf → GitHub)** — The *Quality Inspector* signs off. The finished car ships out.
6. **Phase 5 (Replit)** — The *Customer Test Drive* — you pull the finished product back to Replit and click through it live.

Each agent writes its output into a specific file. The next agent reads that file. They never talk to each other directly — they communicate through documents, like real enterprise teams.

---

## Phase 0: The Design Studio (Human Work)

### 📍 WHERE: 🎨 Replit (your browser)

### WHY THIS PHASE EXISTS
> Before any AI agent touches your project, **you** — the human product manager — must define what you want built. AI can translate, refine, and implement requirements, but it cannot *invent* them. This phase ensures the entire pipeline starts from your vision, not from AI hallucination. You also build the visual prototype here because Replit is excellent for quick visual iteration in the browser.

### Step 0.1 — Build Your Visual Prototypes in Replit

> **What this means**: You use Replit's editor (or Replit Agent) to create React components that *look* like what you want. These are "dumb" UI — they render visuals but don't have real data, state management, or API calls. Think of them as a clay model of a car: it looks right, but it can't drive.

1. Open your Replit project in the browser.
2. Build your `.tsx` component prototypes. Make them look the way you want.
3. Take **screenshots** of the finished screens (PNG/JPG).

### Step 0.2 — Write the Sprint Backlog

> **What this means**: The Sprint Backlog is a plain-English document that says "here's what I want built and how I'll know it's done." Each feature gets a list of **Acceptance Criteria (AC)** — specific, testable statements that must be true for the feature to be considered complete. Example: "AC-1: The chart displays a trend line for the last 5 sprints." This document becomes the single source of truth for every AI agent downstream.

1. In your Replit project, create a file at `docs/SPRINT_1_BACKLOG.md`.
2. Write your Epics and Acceptance Criteria using this template:

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
- Mock: `docs/ui-mocks/[filename].png`
- Prototype: `docs/prototypes/[filename].tsx`

### Out of Scope
- [What this epic does NOT include]

### Dependencies
- [Existing files, components, or libraries this feature builds on]
```

### Step 0.3 — Organize Your Replit Outputs for Export

> **What this means**: You're putting your work into specific folders so the AI agents can find it later. The `docs/prototypes/` folder is a "staging area" — it holds your visual code for reference but keeps it separate from the real [src/](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/src:0:0-0:0) folder. This prevents accidental overwrites.

1. Create these folders in your Replit project (if they don't exist):
   - `docs/`
   - `docs/ui-mocks/`
   - `docs/prototypes/`
2. Move your screenshot images into `docs/ui-mocks/` (e.g., `dashboard.png`, `feedback-page.png`)
3. **Copy** (not move) your prototype `.tsx` files into `docs/prototypes/` (e.g., `SentimentWidget.tsx`)

> ⚠️ **CRITICAL**: Do NOT put prototype `.tsx` files into [src/](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/src:0:0-0:0). They go in `docs/prototypes/` ONLY. The [src/](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/src:0:0-0:0) folder is sacred — only the DEV agent writes production code there, after it's been designed, tested, and approved.

### Step 0.4 — Export Prototype Files to Windsurf

> **What this means**: Replit is a Design Studio — it never pushes directly to the real codebase. Instead, you manually download the finished prototype `.tsx` files from Replit and place them into `docs/prototypes/` in your local Windsurf project. This is the one-time bridge from design to engineering.

1. In Replit's file tree, right-click each file below and click **Download**:
   - `client/src/pages/Dashboard.tsx`
   - `client/src/pages/FeedbackBoard.tsx`
   - `client/src/pages/ActionItems.tsx`
   - `client/src/pages/Registration.tsx`
   - `client/src/pages/SprintSetup.tsx`
   - `client/src/components/layout/Sidebar.tsx`
2. Place all downloaded files into:
   `C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro\docs\prototypes\`

> **Do NOT** download `App.tsx`, `main.tsx`, `index.css`, config files, or the `server/` folder — those are Replit infrastructure, not prototypes.

> **Replit's role going forward**: Replit is used ONLY for the final smoke test in Sprint 5. You will pull the finished app from GitHub into Replit at that point to verify it runs correctly.

### Phase 0 Checklist

| Done? | Item |
|---|---|
| ☐ | Visual prototypes built in Replit |
| ☐ | Screenshots saved to `docs/ui-mocks/` |
| ☐ | `docs/SPRINT_1_BACKLOG.md` written with Epics and ACs |
| ? | Prototype `.tsx` files downloaded from Replit and placed in local `docs/prototypes/` |

---

## Phase 1: The Shipping Dock (Git + GitHub Setup)

### 📍 WHERE: 🖥️ Windsurf Terminal (local machine) + 🐙 GitHub (browser)

### WHY THIS PHASE EXISTS
> This phase connects your local Windsurf workspace to GitHub so it can receive the work you did in Replit. If Replit is the Design Studio and Windsurf is the Factory, GitHub is the loading dock where blueprints arrive and finished products ship out. You also need a proper Git repository inside the correct folder — your current [.git/](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/.git:0:0-0:0) is in the wrong parent directory.

### Step 1.1 — Fix Git Initialization

> **What this means**: Git is a version control system — it tracks every change you make to your code, like "track changes" in Word but for an entire folder. Right now, Git is initialized in the wrong parent folder (`Teams Retro/`) instead of the actual project folder ([teams-retro/](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro:0:0-0:0)). We need to fix this.

```bash
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

**Verify**: Run `git status`. You should see all project files listed as "Untracked files."

### Step 1.2 — Create the GitHub Repository

> **What this means**: GitHub is a website that stores your Git repository in the cloud. Creating a repo there gives you a URL that both Replit and Windsurf can push to and pull from. Think of it as creating a shared mailbox.

**📍 WHERE: 🐙 GitHub (browser)**

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: [teams-retro](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro:0:0-0:0)
3. **Visibility**: Private
4. ❌ Do NOT check "Add a README" — you already have files locally
5. ❌ Do NOT check "Add .gitignore" — you already have one
6. Click **"Create repository"**
7. Copy the HTTPS URL (it will look like `https://github.com/YOUR_USERNAME/teams-retro.git`)

### Step 1.3 — Connect Local Repo to GitHub and Push

> **What this means**: `git remote add` tells your local Git "here's the address of the cloud mailbox." `git push` uploads all your files to that mailbox. After this, GitHub has an exact copy of your project.

**📍 WHERE: 🖥️ Windsurf Terminal**

```bash
cd "C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro"

git add .
git commit -m "Initial commit: Teams Retro project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/teams-retro.git
git push -u origin main
```

### Step 1.4 — Pull Replit's Phase 0 Work (if Replit pushed first)

> **What this means**: If you already completed Phase 0 in Replit and pushed to GitHub before connecting Windsurf, you need to pull those changes down. If you're doing Phases 0 and 1 simultaneously (Replit hasn't pushed yet), skip this step and do Phase 0 in Replit after this.

```bash
git pull origin main
```

### Phase 1 Checklist

| Done? | Item |
|---|---|
| ☐ | Old [.git/](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/.git:0:0-0:0) removed from parent `Teams Retro/` folder |
| ☐ | `git init` run inside [teams-retro/](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro:0:0-0:0) |
| ☐ | GitHub repo created at `github.com/YOUR_USERNAME/teams-retro` |
| ☐ | `git remote add origin` pointed to GitHub URL |
| ☐ | `git push -u origin main` succeeded |
| ☐ | Replit's Phase 0 work pulled down (if applicable) |

---

## Phase 2: Organize the Factory Floor (Scaffolding)

### 📍 WHERE: 🖥️ Windsurf (local machine — Editor + Terminal)

### WHY THIS PHASE EXISTS
> Before the AI agents can work, they need a structured workspace. Each agent reads from specific files and writes to other specific files — like workers on an assembly line who pick up parts from one bin and place finished pieces in another. This phase creates all those bins (files and folders) so the agents don't get confused about where to find things or where to put their output.

### Step 2.1 — Create the Communication Files

> **What this means**: These are empty markdown files that act as "message boards." Each agent writes its output to a specific file, and the next agent reads from it. Think of them as forms in a workflow: the Product Owner fills out Form A, the Architect reads Form A and fills out Form B, the Tester reads Form B and fills out Form C, etc.

```bash
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
echo # Code Explanation > docs\CODE_EXPLAINER.md

# Ensure drop zone directories are tracked by Git
echo. > docs\ui-mocks\.gitkeep
echo. > docs\prototypes\.gitkeep

# Remove old empty mockups directory (replaced by docs/ui-mocks)
rmdir mockups 2>nul
```

**What each file is for:**

| File | Written By | Read By | Purpose |
|---|---|---|---|
| `SPRINT_1_BACKLOG.md` | **You (Human)** | PRODUCT | Your raw requirements — what you want built |
| `FEATURE_REQUIREMENTS.md` | PRODUCT | ARCHITECT, TEST, DEV, REVIEWER | Polished user stories + acceptance criteria |
| `ARCHITECTURE_DESIGN.md` | ARCHITECT | TEST, DEV, REVIEWER | How the feature is structured (components, data flow) |
| `IMPLEMENTATION_PLAN.md` | ARCHITECT | DEV, REVIEWER | Jira-style checklist of tasks for DEV to execute |
| `TEST_SPEC.md` | TEST | DEV, REVIEWER | Test cases mapped to each acceptance criterion |
| `IMPLEMENTATION_NOTES.md` | DEV | REVIEWER | What DEV actually did, decisions made, issues found |
| `TEST_REPORT.md` | TEST (post-dev) | REVIEWER | Final test results (pass/fail) |
| `AUDIT_REPORT.md` | REVIEWER | **You (Human)** | 11-point compliance audit — the final verdict |
| `CODE_EXPLAINER.md` | PROFESSOR | REVIEWER | Plain English explanation of new code |

### Step 2.2 — Create the Agent Rule Files

> **What this means**: Each AI agent needs a "job description" that tells it what role to play, what it can and can't do, and where to find its inputs. These `.rules` files are Windsurf's native way to inject instructions into Cascade sessions. When you start a Cascade session, these rules are loaded automatically to constrain the AI's behavior.

**📍 WHERE: 🖥️ Windsurf Editor (switch to Code mode to create these files)**

```bash
mkdir .windsurf 2>nul
mkdir .windsurf\cascades 2>nul
```

Create **6 files** inside `.windsurf/cascades/`:

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
* Rules: Focus on component boundaries, data flow, performance, security and scalability.
* Strict Constraint: Do NOT write implementation code — only propose structure, patterns, and folder hierarchy. Identify potential breaking changes.
* Input: docs/FEATURE_REQUIREMENTS.md + docs/prototypes/*.tsx
* Output: docs/ARCHITECTURE_DESIGN.md + docs/IMPLEMENTATION_PLAN.md
* Review prototype code in docs/prototypes/ for: visual inventory, gap analysis (state, data, events, accessibility), style conversion needs.
* ARCHITECTURE_DESIGN.md must include a prototype integration strategy for DEV.
* IMPLEMENTATION_PLAN.md must be a Jira-style checklist with [ ] checkboxes that DEV will execute.
* Global UI Infrastructure Audit: Before producing ARCHITECTURE_DESIGN.md, read `src/app/layout.tsx`, `tailwind.config.ts`, and `src/app/globals.css` in full. Explicitly document every global UI setting that is active — including but not limited to: theme mode activation (`<html className="dark">`), base font classes on `<body>`, CSS custom property definitions (`:root { --primary: ... }`), and global background/foreground color tokens. These settings are invisible at the component level and are silently broken if lost. ARCHITECTURE_DESIGN.md MUST include a "Global UI Infrastructure" section listing each setting, its file, and its line — so DEV cannot accidentally drop any of them during a rewrite.
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
* Install test runner if not present: npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
* Create docs/TEST_SPEC.md mapping each AC-ID to one or more test cases.
* Write test files in src/__tests__/ based on ARCHITECT's component paths.
* Verify all tests FAIL (npm test) — this confirms they are testing code that doesn't exist yet.
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
* Code until ALL tests pass (corepack yarn vitest run).
* Output: Working code in src/ + checked-off IMPLEMENTATION_PLAN.md + docs/IMPLEMENTATION_NOTES.md
* CSS: Use Tailwind utility classes ONLY. Do NOT add <style> tags or inline styles unless no utility class exists.
* Global UI Infrastructure Gate: Any session that rewrites or modifies `src/app/layout.tsx`, `tailwind.config.ts`, or `src/app/globals.css` MUST re-verify ALL global UI settings documented in ARCHITECTURE_DESIGN.md's "Global UI Infrastructure" section before marking the session complete. These settings are never inherited automatically through a rewrite. Checklist to verify after any layout.tsx change: (1) theme mode class on `<html>` (e.g. `className="dark"`), (2) font class on `<body>`, (3) CSS variables in globals.css are intact, (4) base background/foreground token intact. If any setting is missing, restore it immediately — do not defer to another session.
* Strict: Do NOT modify or delete any test files in src/__tests__/.
```

#### `.windsurf/cascades/professor.rules`
```markdown
# [PROFESSOR] — Plain English Explainer Mode
* Goal: Ensure the human developer understands every line of code in the codebase,
  at a level accessible to a total beginner.
* Trigger: Invoked at regular intervals — before code is written (explain the plan),
  during implementation (explain what is being built), or after (explain what was built).
  Can be called at any time, on any file, on any section of the codebase.
* Rules:
  - Never assume prior coding knowledge. Define any technical term the first time it appears.
  - Explain WHAT the code does, WHY it exists, and HOW it connects to the rest of the app.
  - Use real-world analogies where helpful (e.g., "Think of this like a restaurant order ticket...").
  - Go block by block — explain one logical group at a time (imports, type definitions,
    component body, return statement, service function, etc.).
  - If a concept spans multiple files, trace the full path: "This value starts in X,
    gets passed to Y, and is displayed in Z."
* Strict Constraint: Do NOT modify any code. This role reads and explains ONLY.
* Output Format: Use the "Plain English / Descriptive Summary" style:
  - Lead with what the block IS: "This is the..."
  - Then what it DOES: "It..."
  - Then why it matters: "Without this..."
  - Use short paragraphs, not long walls of text.
  - Bold key terms on first use.
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

## 18-Point Audit Checklist

### Workflow Compliance
1. AC Compliance — Every AC in FEATURE_REQUIREMENTS.md has a Pass/Fail
2. Plan Completion — Every [ ] in IMPLEMENTATION_PLAN.md is now [x]
3. Anti-Hallucination — No // TODO, placeholder, or mock data left in production code
4. Naming Conventions — Files, components, variables match ARCHITECTURE_DESIGN.md
5. Architecture Compliance — Component boundaries match ARCHITECTURE_DESIGN.md
6. Prototype Fidelity — Visual layout matches docs/ui-mocks/ screenshots
7. Test Coverage — Every AC has at least one test in TEST_SPEC.md

### Build & Quality Gates
8. No Breaking Changes — Existing features still work (corepack yarn build passes)
9. Styling Compliance — Tailwind only, no inline styles, no <style> tags
10. Tests Passing — corepack yarn test exits with 0 failures
11. Type Safety — corepack yarn tsc --noEmit passes with no errors

### React Code Quality
12. React Hooks Correctness — useEffect dependency arrays are complete; no stale closures; cleanup functions present wherever subscriptions, timers, or event listeners are created; no effect runs on every render without justification
13. Security — No secrets, tokens, or API keys in client code; no dangerouslySetInnerHTML; all user-submitted text rendered as escaped text nodes (not raw HTML); environment variables used for any config values
14. Accessibility (a11y) — All form inputs have an associated <label>; all icon-only buttons have aria-label; modal dialogs trap focus and restore it on close; keyboard navigation works for all interactive elements
15. Performance — No derived values recalculated inside render that could be memoized; React.memo or useMemo applied where components receive the same props repeatedly; no obvious re-render cascades from context changes

### Data & Architecture Integrity
16. localStorage Integrity — Every getItem call has a null-check fallback; every JSON.parse is wrapped in try/catch; all storage keys match the constants defined in lib/storage.ts (no magic strings)
17. Empty / Error / Loading States — Every component that reads data handles all three states (empty, error, loading); matches the empty-state UI mocks built in Phase 0
18. Component Size Compliance — No file added or modified in this session exceeds 200 lines; any file approaching the limit is flagged for ARCHITECT review before the next sprint
```


### Step 2.3 — Create the Worktree Setup Hook

> **What this means**: When Windsurf creates a worktree (a separate copy of your project for an agent to work in), it's a blank copy — it doesn't have [node_modules/](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/node_modules:0:0-0:0) (your installed packages) or `.env` files (your secrets). This hook is a script that runs automatically every time a worktree is created, installing dependencies so the agent can immediately run `npm test` or `npm run dev` without manual setup.

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

> **What this means**: `npm install` reads your [package.json](cci:7://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/package.json:0:0-0:0) file and downloads all the libraries your project needs (React, Next.js, Tailwind, etc.) into a [node_modules/](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/node_modules:0:0-0:0) folder. Without this, nothing runs.

```bash
cd "C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro"
corepack yarn install
```

### Step 2.5 — Commit and Push the Scaffolding

> **What this means**: You're saving all the new folders, empty communication files, rule files, and hooks to Git, then uploading them to GitHub. This ensures that when worktrees are created, they include this scaffolding too.

```bash
git add .
git commit -m "Phase 2: Add workflow scaffolding (docs/, rules, hooks)"
git push origin main
```

### Phase 2 Checklist

| Done? | Item |
|---|---|
| ☐ | `docs/` folder with 8 communication `.md` files |
| ☐ | `docs/ui-mocks/` and `docs/prototypes/` directories exist |
| ☐ | `.windsurf/cascades/` with 6 `.rules` files (product, architect, test, dev, professor, reviewer) |
| ☐ | `.windsurf/hooks.json` with `post_setup_worktree` hook |
| ☐ | `corepack yarn install` completed (node_modules/ populated) |
| ☐ | Everything committed and pushed to GitHub |

---

## Phase 3: The Assembly Line (Running the 5 Agents)

### 📍 WHERE: 🖥️ Windsurf (local machine — Cascade panel)

### WHY THIS PHASE EXISTS
> This is the core of the workflow. Five AI agents execute in sequence, each reading the previous agent's output and writing its own. You paste a prompt into a Windsurf Cascade session, the AI does its job in an isolated worktree, and you review the result before the next agent starts. It's like a relay race where each runner hands a baton to the next.

### How Windsurf Worktrees Work (Beginner Explanation)

> A **worktree** is a separate copy of your entire project folder, managed by Git. When you toggle "Worktree" mode in the Cascade input, Windsurf automatically creates one at `~/.windsurf/worktrees/teams-retro/<random-name>/`. The AI agent edits files in this copy, not in your main project. This means if an agent makes a mistake, your real code is untouched. When you're happy with the result, you click "Merge" to bring the changes back.

### Step 3.0 — Open Windsurf with the Correct Workspace

```
File → Open Folder → C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro
```

### Execution Order

> **Why this order?** The order is deliberate: requirements first, then design, then tests, then code, then audit. The most important thing to notice is that **TEST runs before DEV**. This is called "Acceptance Test-Driven Development" (ATDD). The tester writes tests that describe what "done" looks like, and the developer's job is to make those tests pass. This prevents the developer from writing code that technically works but doesn't match the requirements.

```
YOU (Human) → PRODUCT → ARCHITECT → TEST → DEV → PROFESSOR → REVIEWER → YOU (Human)
```

---
### Context Quality Per Session — Sizing Guide

> **Understanding this is critical for clean, bug-free output from the DEV agent.**

One Cascade session has a finite context window. As the session grows — more files read, more code written — the model's ability to maintain consistency degrades. This is not a credits problem; it is a cognitive capacity problem. A session that tries to do too much produces subtle bugs: wrong variable names, missing imports, inconsistent state logic.

#### Signs a session is too large
- The DEV agent starts "forgetting" decisions made earlier in the same session
- Variable names drift (e.g., `feedbackItem` in one file, `item` in another)
- Imports reference functions that don't exist yet (hallucination)
- Later files don't match the type definitions written at the start

#### The right size for one DEV session

| What fits comfortably | What to avoid |
|---|---|
| 1 page file (~100–150 lines) | 2+ page files in one session |
| 1–2 service files (~80–120 lines each) | Long chains of dependent files |
| 1–2 component files (~50–100 lines each) | Files that require re-reading 5+ existing files for context |
| Writing + running tests for the above | Full feature + tests + bug fixes in one shot |

**Target**: ~400–600 total new lines written per DEV session. This keeps the model sharp from first file to last.

#### How the sprint files use this
Each sprint is broken into **DEV Sessions**. Each session has a defined set of files to write — sized to stay within the quality threshold. The PRODUCT, ARCHITECT, TEST, and REVIEWER agents run at broader context and can take a wider view. Only DEV sessions need to be tightly scoped.

#### Credit math (reference)
- 1000 credits/month, 6 credits per OPUS session = **~166 sessions/month**
- The constraint is NOT credits — it is **context quality per session**
- A well-scoped session (400–600 new lines) produces significantly better output than an overloaded one

---


### Agent 1: PRODUCT

> **What this agent does**: Reads your plain-English backlog and your UI mock screenshots, then translates them into structured, formal Acceptance Criteria. It doesn't invent — it interprets. Think of it as a business analyst who takes your whiteboard sketch and turns it into a polished requirements document.

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

4. **Review the output.** Read `docs/FEATURE_REQUIREMENTS.md` in the worktree. Does it accurately reflect your backlog? Are the AC-UI rows reasonable?
5. If satisfied, click **"Merge"** in Cascade to bring changes into main workspace.
6. Commit:
```bash
git add docs/FEATURE_REQUIREMENTS.md
git commit -m "PRODUCT: Feature requirements for Sprint 1"
```

---

### Agent 2: ARCHITECT

> **What this agent does**: Reads the polished requirements and the prototype code, then designs the technical blueprint. It decides which components to create, where they live in the folder structure, what data flows between them, and how to integrate the Replit prototype into production. It also produces a Jira-style checklist of tasks for the developer. Think of it as a solutions architect who draws the building plans.

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

1. **Component Inventory**: List every new component needed. For each, state: file path, props interface, parent component, data source.
2. **Prototype Review**: For each file in docs/prototypes/:
   - Visual Inventory: What does it render?
   - Gap Analysis: What's missing? (state management, API calls, error handling, loading states, accessibility, responsive behavior)
   - Style Conversion: What inline styles or CSS need to be converted to Tailwind utility classes?
   - Integration Path: Step-by-step instructions for DEV to convert this prototype into production code.
3. **Data Flow**: Describe how data moves from store → component → UI. Note any new types, store methods, or API endpoints needed.
4. **Breaking Change Risk**: List anything that could break existing pages (Dashboard, Feedback, Action Items, Leaderboard, Digest).

## Output — Two Files
### docs/ARCHITECTURE_DESIGN.md
Write the full design document including component inventory, prototype integration strategy, data flow, and breaking change assessment.

### docs/IMPLEMENTATION_PLAN.md
Write a Jira-style checklist that DEV will execute. Format:

```
## Implementation Checklist
- [ ] TASK-1: [Description] — File: [path]
- [ ] TASK-2: [Description] — File: [path]
...
```

Each task must be small enough to complete in one edit session. Include tasks for: type definitions, store updates, component creation, wiring, style conversion, route changes.

## Constraints
- Do NOT write implementation code.
- Do NOT modify any file in src/.
- Do NOT create new components — only propose them.

When done, run: git diff --stat
```

3. **Review the output.** Does the architecture make sense? Is the IMPLEMENTATION_PLAN granular enough?
4. Click **"Merge"** → Commit:
```bash
git add docs/ARCHITECTURE_DESIGN.md docs/IMPLEMENTATION_PLAN.md
git commit -m "ARCHITECT: Design and implementation plan for Sprint 1"
```

---

> 💡 **Workflow optimization discovered in Sprint 2**: ARCHITECT and TEST can be run in the **same Cascade session**, back-to-back. Since ARCHITECT writes its output files first, and TEST immediately reads them, there is no context gap. Open one session in the `retro-architect/` worktree, paste a combined prompt that runs [ARCHITECT] first (appending to `ARCHITECTURE_DESIGN.md` + `IMPLEMENTATION_PLAN.md`), then pivots to [TEST] (appending to `TEST_PLAN.md` in `retro-test/docs/`). Use **absolute paths** in the prompt for every file read to avoid folder-context errors. This saves one full session switch and one credit spend.
>
> **Key rules for the combined prompt**:
> - Always use absolute paths (e.g. `C:\Users\...\retro-dev\src\types\index.ts`) — never relative paths
> - ARCHITECT writes first, TEST reads the freshly written output in the same session
> - Both agents **append** to their respective docs — never overwrite Sprint N-1 content
> - Explicitly label `## PHASE 1: [ARCHITECT]` and `## PHASE 2: [TEST]` in the prompt so the agent doesn't blend the two roles

---

### Agent 3: TEST

> **What this agent does**: Reads the requirements and the architecture, then writes test cases *before any code is written*. It creates actual test files that import components that don't exist yet — so every test will FAIL. That's intentional. These failing tests define what "done" looks like. The developer's entire job in the next step is to make these tests pass. Think of it as a quality inspector writing the checklist before the product is built.

1. Open a **new Cascade session** + toggle **"Worktree"** mode.
2. Paste this prompt:

```
[TEST]

## Pre-Flight
1. Read docs/FEATURE_REQUIREMENTS.md
2. Read docs/ARCHITECTURE_DESIGN.md
3. Read docs/IMPLEMENTATION_PLAN.md
4. Read src/types/index.ts (existing type definitions)
5. Read package.json

## Task
You are the QA Engineer using Acceptance Test-Driven Development (ATDD). You write tests BEFORE the code exists.

### Step 1 — Install Test Runner
If vitest is not in package.json devDependencies, run:
```
corepack yarn add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

Create or update `vitest.config.ts` at the project root:
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
Create docs/TEST_SPEC.md with a table mapping every AC-ID (including AC-UI-*) to one or more test cases:

| AC-ID | Test File | Test Name | Type | Expected |
|---|---|---|---|---|
| AC-1 | src/__tests__/[name].test.tsx | [test name] | unit/integration | [expected behavior] |

### Step 3 — Write Test Files
Create test files in `src/__tests__/` based on ARCHITECT's component paths. Each test should:
- Import the component (even though it doesn't exist yet)
- Render it with @testing-library/react
- Assert against the acceptance criteria

### Step 4 — Verify Tests Fail
Run: `corepack yarn vitest run`
Every test should FAIL (because the components don't exist). If any test passes, it's testing the wrong thing — fix it.

## Output
- Updated package.json (with vitest deps)
- vitest.config.ts
- src/__tests__/setup.ts
- src/__tests__/*.test.tsx (failing test files)
- docs/TEST_SPEC.md

## Constraints
- Never delete or weaken existing tests.
- Tests must fail at this stage — that's correct.

When done, run: corepack yarn vitest run 2>&1 | tail -20
```

3. **Review the output.** Check `docs/TEST_SPEC.md` — does every AC have at least one test? Did the tests all fail? (They should.)
4. Click **"Merge"** → Commit:
```bash
git add .
git commit -m "TEST: Failing test suite for Sprint 1 (ATDD)"
```

---

### Agent 4: DEV

> **What this agent does**: This is the integration engineer. It reads the architecture design, picks up the prototype code from `docs/prototypes/`, and wires it into production: adding real state management, data hooks, API calls, error handling, loading states — and converting any non-Tailwind styles. Its success metric is simple: make every failing test pass. Think of it as the factory worker who takes the blueprint and the clay model and builds the real, working car.

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
6. Read existing code: src/types/index.ts, src/store/retro-store.tsx, src/app/layout.tsx
7. Read all test files in src/__tests__/
8. Run: corepack yarn install

## Task
You are the Integration Engineer. Your job is to execute every task in IMPLEMENTATION_PLAN.md until ALL tests pass.

### Integration Workflow
For each prototype file in docs/prototypes/:
1. Copy it to the correct location in src/ as specified by ARCHITECT.
2. Preserve the visual layout exactly — do NOT rearrange or redesign.
3. Wire up real logic: replace mock data with store hooks (useRetro), add proper TypeScript types, handle loading/error states.
4. Convert any inline styles or CSS to Tailwind utility classes. Reference globals.css for existing CSS variables (--primary, --background, etc.) and tailwind.config.ts for the project's design tokens.
5. Ensure the component integrates with the existing RetroProvider context and routing.

### Execution Loop
1. Pick the next unchecked [ ] item from IMPLEMENTATION_PLAN.md.
2. Implement it. Cite the file path and line numbers you're changing.
3. Mark it [x] in IMPLEMENTATION_PLAN.md.
4. Run: corepack yarn vitest run
5. If tests fail, fix the implementation (NOT the tests). Repeat until green.
6. Move to the next item.

### Final Checks
After all [ ] items are [x]:
1. Run: corepack yarn vitest run (all tests must pass)
2. Run: corepack yarn tsc --noEmit (no type errors)
3. Run: corepack yarn build (build must succeed)

## Output
- All implementation code in src/
- Updated docs/IMPLEMENTATION_PLAN.md (all [x])
- docs/IMPLEMENTATION_NOTES.md — Document: what you built, decisions you made, any deviations from the plan and why.

## Constraints
- Do NOT modify or delete any test files in src/__tests__/.
- Do NOT alter the visual layout from the prototype without explicit reason documented in IMPLEMENTATION_NOTES.md.
- Do NOT add <style> tags or inline styles — Tailwind utility classes only.
- Fix your code to match tests, never fix tests to match your code.

## 🏗️ Scalability & Design Pattern Rules (applies to ALL agents — DEV must follow, REVIEWER must enforce)

These are structural constraints that prevent architectural debt from compounding at scale. Every DEV session must follow them. REVIEWER checks 12–17 audit them.

### DB Query Rules
- **No unbounded queries** — Every `Model.find()` on `feedback`, `actions`, or `users` MUST include a filter (e.g. `{ sprintId }`). Never `Model.find({})` on user-data collections.
- **No N+1 queries** — Never call `Model.findById()` or `Model.find()` inside a `.map()`, `for`, or `forEach`. Batch with `$in` or pre-fetch before iteration.
- **Atomic counter/set ops** — Use `$inc` + `$addToSet` in a single `findByIdAndUpdate` for counters and dedup arrays. Never `findById` → JS mutate → `.save()` for fields like `upvotes`/`upvotedBy`.
- **Index awareness** — Fields used as query filters (`sprintId`, `authorId`, `ownerId`, `status`) must have `index: true` on the Mongoose schema.
- **Pagination guard** — Every list-returning API route must apply `.limit(100)`. Never return unbounded arrays.

### API Route Rules
- **`await connectDB()` is always first** — No DB op before it. Never skip assuming connection is cached.
- **Always wrap in try/catch** — Every route handler must have a top-level try/catch returning `{ error: 'Internal server error' }` with status 500.
- **No secrets client-side** — `MONGODB_URI` or any `process.env.*` secret must never appear in `src/components/` or client page files.

### React / Component Rules
- **No Mongoose imports in components** — All data comes via `fetch('/api/...')` through the service layer. Never import from `src/lib/models/` in a component.
- **useEffect cleanup** — Every `useEffect` with a `fetch` call must use `AbortController` and `return () => controller.abort()`.
- **No missing dependency arrays** — Every `useEffect` must have an explicit `[]` or `[dep]` array.
- **Loading + error states required** — Every component that fetches data must have `loading: boolean` and `error: string | null` states. Never render data without a loading guard.
- **No console.log in production** — `console.log/warn/error` forbidden in `src/` outside test files.

### Service Layer Rules
- **Validate before fetch** — Service functions for POST/PATCH must validate required fields and `throw` before calling `fetch()`.
- **Never swallow errors** — Re-throw on non-OK response. Never `return null` silently on a 4xx/5xx.

---

## ⛔ BLOCKED COMMANDS — CARBON BLACK APP CONTROL — DO NOT RUN, DO NOT RETRY
The following are permanently blocked by 7-Eleven Carbon Black endpoint protection.
Do NOT attempt them. Do NOT try alternate paths. Do NOT loop through fallback variants. Stop and report.
- `npx` (any form) → BLOCKED (PowerShell execution policy)
- `node_modules\.bin\jest.cmd` → BLOCKED (Carbon Black)
- `node_modules\.bin\tsc.cmd` → BLOCKED (Carbon Black)
- `node node_modules/jest/bin/jest.js` → BLOCKED (Carbon Black)
- `node node_modules/jest/bin/jest.js --no-coverage 2>&1 | Select-String ...` → BLOCKED (Carbon Black intercepts the binary invocation before the pipe executes)
- `node node_modules/typescript/bin/tsc` → BLOCKED (Carbon Black)
- Any `.cmd` wrapper in node_modules/.bin/ → BLOCKED
- Any PowerShell pipe/filter wrapping a blocked binary → BLOCKED (`| Select-String`, `| Select-Object` do NOT bypass Carbon Black)

Use ONLY: `corepack yarn test` | `corepack yarn tsc --noEmit` | `corepack yarn build`

When done, run: corepack yarn test && corepack yarn tsc --noEmit && corepack yarn build
```

3. **Review the output.** Did all tests pass? Does `corepack yarn build` succeed? Read `IMPLEMENTATION_NOTES.md` for any deviations.
4. Click **"Merge"** → Commit and push `dev-branch`:
```bash
git add .
git commit -m "DEV: Implementation for Sprint 1 — all tests passing"
git push origin dev-branch
```
5. Merge `dev-branch` into `main` so Replit can see the changes (run in the `teams-retro/` folder):
```bash
git fetch origin dev-branch
git merge origin/dev-branch --no-edit
git push origin main
```
6. **Sync Replit (two-way — read carefully)**

> ⚠️ **Critical finding**: Replit Agent maintains its own filesystem with Replit-specific fixes that GitHub does not have. These fixes are required for the app to run correctly inside Replit's environment:
> - `package.json` — port 5000 binding (Replit requires this)
> - `next.config.js` — allowed dev origins (prevents preview iframe crash)
> - `src/components/feedback-card.tsx` — hydration crash fix (SSR/client mismatch in Replit)
> - `replit.md` — Replit project notes
>
> **Never use `git reset --hard` to sync Replit** — it will wipe these fixes and break the preview.

**Step 6a — Pull GitHub changes INTO Replit safely** (paste into Replit Agent chat):
```
I need to pull the latest changes from GitHub (main branch) without losing any Replit-specific fixes.
Please use git fetch + merge (NOT reset --hard) to bring in only the new files from GitHub,
preserving our local changes to package.json, next.config.js, replit.md, and any hydration fixes.

git fetch origin main
git merge origin/main --no-edit

If there are merge conflicts, keep our Replit-specific values (port 5000, allowed origins) and take the GitHub version for all other files.
After merging, run: npm run dev
```

**Step 6b — Push Replit-specific fixes BACK to GitHub** (do this once, then keep in sync):

Ask Replit Agent:
```
Please push the Replit-specific fixes back to GitHub so they are preserved in the main repo.
The files that need to go back are: package.json, next.config.js, next.config.ts (if it exists), replit.md,
and any component files you modified to fix hydration or preview crashes.

git add package.json next.config.js replit.md
git add src/components/feedback-card.tsx
git commit -m "Replit: port binding, dev origins, hydration fix — Replit environment config"
git push origin main
```

After Step 6b is done **once**, the two environments stay in sync and Step 6a (safe merge) is all you need going forward.

> 💡 **Mental model**: Think of it as two workers on the same codebase. Windsurf handles business logic. Replit handles environment config. Both push to `main`. Neither does a hard reset.

---

### Agent 4.5: PROFESSOR

> **What this agent does**: After DEV finishes a session and tests are passing, PROFESSOR reads the newly written code and produces a plain-English explanation of every file created or modified. It explains WHAT each block does, WHY it exists, and HOW it connects to the rest of the app — at a level accessible to a complete beginner. The output appends to `docs/CODE_EXPLAINER.md` (one section per sprint session). REVIEWER uses this as optional context during the audit.

> **When to run**: After each DEV session completes (tests pass, build succeeds), before REVIEWER. If DEV has 3 sessions in a sprint, PROFESSOR runs 3 times — once after each session — appending a new section each time.

1. Open the **same `retro-dev/` worktree** in a **new Cascade session** (same folder, fresh chat).
2. Paste this prompt:

```
[PROFESSOR]

## Pre-Flight
1. Read docs/IMPLEMENTATION_NOTES.md (DEV's notes from this session)
2. Read docs/IMPLEMENTATION_PLAN.md (identify which tasks were just completed)
3. Read every file listed under "Files Created" and "Files Modified" in IMPLEMENTATION_NOTES.md
4. Read src/types/index.ts (for type context)

## Task
You are the Code Explainer. Explain every file that DEV created or modified in this session.

For each file:
1. **What it IS**: One sentence naming the file and its role in the app.
2. **What it DOES**: Walk through each logical block (imports, types, functions, component body, return statement). Explain each block in plain English — no assumed knowledge.
3. **WHY it exists**: What breaks or stops working if this file is removed?
4. **HOW it connects**: Trace the data path — where does data come from, what does this file do with it, where does it go next?
5. **Plain English analogy**: One real-world analogy that captures what this file does (e.g. "This is like the order ticket at a restaurant...").

## Output
Append a new section to docs/CODE_EXPLAINER.md:

```markdown
## Sprint [N] — Session [N] Code Explanation
_Written by PROFESSOR after DEV session completed on [date]_

### [filename] (`src/path/to/file.tsx`)
[Full explanation per the format above]

### [next filename]
[...]
```

## Constraints
- Do NOT modify any code.
- Do NOT suggest improvements or flag issues — that is REVIEWER's job.
- Never assume the reader has coding experience.
- If a concept requires a technical term, define it in parentheses on first use.

When done, confirm: "CODE_EXPLAINER.md updated — [N] files explained."
```

3. **Review the output.** Skim `docs/CODE_EXPLAINER.md` — does the explanation match what you expected the code to do?
4. No merge or commit needed — PROFESSOR only appends to one doc file:
```bash
git add docs/CODE_EXPLAINER.md
git commit -m "PROFESSOR: Code explanation for Sprint [N] Session [N]"
```

---

### Agent 5: REVIEWER

> **What this agent does**: This is the final quality gate. It reads every upstream document and the actual code, then runs an 11-point audit. It checks whether the code matches the requirements, follows the architecture, passes all tests, has no leftover TODOs or placeholder code, and visually matches the original mocks. If it fails any check, the feature doesn't ship. Think of it as a building inspector who checks every item on the compliance checklist before signing off.

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
6. Read docs/CODE_EXPLAINER.md (optional)
7. Read all files in src/__tests__/
8. Read all new/modified files in src/ (check git diff --name-only main)
9. Run: corepack yarn install

## Task
You are the Code Auditor. Perform a comprehensive 11-point audit.

For EACH check below, output: ✅ PASS or ❌ FAIL with a specific explanation.

### Audit Checklist

| # | Check | How to Verify |
|---|---|---|
| 1 | **AC Compliance** | Every AC in FEATURE_REQUIREMENTS.md is satisfied in the code |
| 2 | **Plan Completion** | Every [ ] in IMPLEMENTATION_PLAN.md is now [x] |
| 3 | **Anti-Hallucination** | grep -r "TODO\|FIXME\|placeholder\|mock" src/ — no hits in production code |
| 4 | **Naming Conventions** | File names, component names, variable names match ARCHITECTURE_DESIGN.md |
| 5 | **Architecture Compliance** | Component boundaries, data flow match the design |
| 6 | **Prototype Fidelity** | Visual layout matches docs/ui-mocks/ screenshots |
| 7 | **Test Coverage** | Every AC has at least one test in TEST_SPEC.md |
| 8 | **No Breaking Changes** | corepack yarn build succeeds; existing pages still render |
| 9 | **Styling Compliance** | No inline styles, no <style> tags; Tailwind only |
| 10 | **Tests Passing** | corepack yarn vitest run — 0 failures |
| 11 | **Type Safety** | corepack yarn tsc --noEmit — 0 errors |

### Run These Commands
```
corepack yarn test
corepack yarn tsc --noEmit
corepack yarn build
corepack yarn lint
grep -rn "TODO\|FIXME\|placeholder" src/ --include="*.ts" --include="*.tsx"
```

> ⛔ **BLOCKED on this machine — do NOT run:**
> `npx tsc`, `npx jest`, `node_modules\.bin\tsc`, `node_modules\.bin\jest`, any `.cmd` in node_modules/.bin/
> If `corepack yarn` commands also fail, STOP — do not loop through fallback paths. Report and await human input.

## Output
Write docs/AUDIT_REPORT.md with:
1. Summary verdict: APPROVED or REJECTED
2. The 11-check table with ✅/❌ for each
3. For any ❌: specific file, line number, and what needs to change
4. Final sign-off statement

## Constraints
- Do NOT fix any code — only report issues.
- If any check fails, the verdict is REJECTED.
```

3. **Review the output.** If APPROVED → proceed to Phase 4. If REJECTED → fix the issues (re-run DEV or the specific agent that owns the failure), then re-run REVIEWER.
4. Click **"Merge"** → Commit:
```bash
git add docs/AUDIT_REPORT.md
git commit -m "REVIEWER: Audit report for Sprint 1"
```

### Phase 3 Checklist

| Done? | Agent | Output Files | Tests |
|---|---|---|---|
| ☐ | PRODUCT | `docs/FEATURE_REQUIREMENTS.md` | — |
| ☐ | ARCHITECT | `docs/ARCHITECTURE_DESIGN.md` + `docs/IMPLEMENTATION_PLAN.md` | — |
| ☐ | TEST | `docs/TEST_SPEC.md` + `src/__tests__/*.test.tsx` + `vitest.config.ts` | All FAIL ✅ (expected) |
| ☐ | DEV (session 1) | `src/` code + `docs/IMPLEMENTATION_NOTES.md` + `IMPLEMENTATION_PLAN.md` | All PASS ✅ |
| ☐ | PROFESSOR (after each DEV session) | `docs/CODE_EXPLAINER.md` (appended) | — |
| ☐ | REVIEWER | `docs/AUDIT_REPORT.md` | Verdict: APPROVED |

---

## Phase 4: Ship It (Merge + Push to GitHub)

### 📍 WHERE: 🖥️ Windsurf Terminal → 🐙 GitHub

### WHY THIS PHASE EXISTS
> All the agent work happened in your local Windsurf environment. Now you need to push the finished, audited code to GitHub so that: (a) it's backed up in the cloud, (b) Replit can pull it for the smoke test, and (c) you have a complete Git history of every change.

### Step 4.1 — Push to GitHub

```bash
cd "C:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro"

git push origin main
```

### Step 4.2 — Verify on GitHub

**📍 WHERE: 🐙 GitHub (browser)**

1. Go to `https://github.com/YOUR_USERNAME/teams-retro`
2. Verify you see all the commits from Phases 0–3
3. Verify `docs/AUDIT_REPORT.md` exists and shows APPROVED
4. Verify [src/](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/src:0:0-0:0) contains the new components

---

## Phase 5: Customer Test Drive (Smoke Test in Replit)

### 📍 WHERE: 🎨 Replit (browser)

### WHY THIS PHASE EXISTS
> The AI agents wrote code, ran tests, and passed an audit — but you haven't *seen* it run yet. This phase brings the finished product back to Replit's live preview so you can click through it like a real user. If something looks wrong visually (even if tests pass), you catch it here. Think of it as the test drive after the car rolls off the assembly line.

### Step 5.1 — Pull the Finished Code

1. Open your Replit project in the browser.
2. In Replit's terminal:
```bash
git pull origin main
corepack yarn install
```

### Step 5.2 — Run the App

```bash
corepack yarn dev
```

3. Use Replit's live preview pane to click through the app.

### Step 5.3 — Validate Against Your Mocks

Compare what you see in the live preview against your original screenshots in `docs/ui-mocks/`. Ask yourself:

- Does the layout match my mock?
- Do all interactive elements work (buttons, forms, navigation)?
- Does the data display correctly?
- Does it look right on different screen sizes?

### Step 5.4 — Ship or Fix

- **If everything looks good**: 🎉 Sprint 1 is complete. Start writing `SPRINT_2_BACKLOG.md` for the next cycle.
- **If something is wrong**: Note the issue, go back to Phase 3, and re-run the relevant agent (usually DEV or ARCHITECT) with a targeted fix prompt.

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
│  🤖 PRODUCT → ARCHITECT → TEST → DEV → PROFESSOR → REVIEWER │
│     (each in its own worktree)                          │
│  📤 git push origin main                                │
└──────────────────────────┬──────────────────────────────┘
                           │
                     🐙 GITHUB
                           │
┌──────────────────────────▼──────────────────────────────┐
│  🎨 REPLIT (Smoke Test)                                 │
│  📥 git pull origin main                                │
│  👀 corepack yarn dev → Click through live preview       │
│  ✅ Approve or 🔁 send back for fixes                   │
└─────────────────────────────────────────────────────────┘
```

### Key Commands

| Action | Command | Where |
|---|---|---|
| Push to GitHub | `git add . && git commit -m "msg" && git push origin main` | 🖥️ (Windsurf only) |
| Pull from GitHub | `git pull origin main` | 🎨 or 🖥️ |
| Run tests | `corepack yarn vitest run` | 🖥️ |
| Type check | `corepack yarn tsc --noEmit` | 🖥️ |
| Build | `corepack yarn build` | 🖥️ |
| Dev server | `corepack yarn dev` | 🎨 or 🖥️ |
| Lint | `corepack yarn lint` | 🖥️ |

### File Map

```
teams-retro/
├── .windsurf/
│   ├── cascades/
│   │   ├── product.rules      ← PRODUCT agent job description
│   │   ├── architect.rules    ← ARCHITECT agent job description
│   │   ├── test.rules         ← TEST agent job description
│   │   ├── dev.rules          ← DEV agent job description
│   │   ├── professor.rules    ← PROFESSOR agent job description
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
│   ├── CODE_EXPLAINER.md       ← PROFESSOR writes this (appended after each DEV session)
│   ├── ui-mocks/               ← YOUR screenshots go here
│   └── prototypes/             ← YOUR Replit .tsx files go here
└── src/                        ← PRODUCTION CODE (only DEV writes here)

---

That's the complete v5 plan. When you're ready, switch to **Code mode** and I'll create all the scaffolding files (Phase 2), or we can start by identifying which features from your Replit mocks to tackle first in `SPRINT_1_BACKLOG.md`.




This is a critical question that needs to be answered **before** any code is written. Let me lay this out clearly.

---

# The Core Problem: Can You Actually Run This Locally?

## What v5 Requires on the Windsurf Machine

Let me check exactly what your current project demands:

Here is the honest, complete analysis.

---

# 🔴 The Blocker: Node.js on Your Office Laptop

**v5 does NOT solve this problem.** Let me be direct about why.

The v5 Hub-and-Spoke plan assumes Windsurf runs on a machine that has **full local toolchain access**. Here's exactly what the Windsurf "Engineering Floor" needs to execute:

| Requirement | Used By | Can You Install It? |
|---|---|---|
| **Node.js ≥ 18** | Every agent (npm install, npm test, npm run build) | ❓ **This is the question** |
| **npm** | Comes with Node.js | ❓ Same blocker |
| **Git** | Every phase (init, commit, push, pull, worktree) | ❓ Likely yes (Git for Windows is often whitelisted) |
| **npx** | TEST (vitest), DEV (tsc), REVIEWER (audits) | ❓ Same as Node |

**If you cannot install Node.js on the machine where Windsurf runs, v5 collapses.** The agents can still *write* code (Cascade works without Node), but they cannot:
- `npm install` (install dependencies)
- `npm test` / `npx vitest run` (run tests — the entire ATDD loop breaks)
- `npm run build` (verify the build works)
- `npx tsc --noEmit` (type check)
- `npm run dev` (see the app running)

Without these, the DEV agent is coding blind, the TEST agent can't verify failures, and the REVIEWER can't run any of its 11 audit checks. You'd be back to "generate text and hope it works" — which is exactly the StackBlitz/Ask-mode problem we were trying to avoid.

---

# Your Current Tech Stack (What Teams Retro Actually Needs)

Based on `@/c:\Users\amul3034\OneDrive - 7-Eleven, Inc\Desktop\WindSurf Projects\Teams Retro\teams-retro\package.json:1-37`:

| Layer | Technology | Status |
|---|---|---|
| **Runtime** | Node.js 18+ | ❓ **The blocker** |
| **Framework** | Next.js 14 (React 18) | Installed via npm |
| **Language** | TypeScript 5.3 | Installed via npm |
| **Styling** | Tailwind CSS 3.4 + CSS variables (shadcn/ui pattern) | Installed via npm |
| **State** | React Context ([RetroProvider](cci:1://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/src/store/retro-store.tsx:60:0-247:1)) — no Redux, no Zustand | Already built |
| **Icons** | Lucide React | Installed via npm |
| **Charts** | Recharts | Installed via npm |
| **Data** | In-memory mock data ([src/data/mock-data.ts](cci:7://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/src/data/mock-data.ts:0:0-0:0)) — **no database** | Already built |
| **Auth** | None | Not needed yet |
| **Backend/API** | None — pure client-side SPA | Not needed yet |
| **Database** | None | Not needed yet |

### Key Insight: Teams Retro is Currently a **Frontend-Only** App

Right now your app has:
- No database (Mongo, Postgres, or otherwise)
- No backend API (no Java, no Express, no Spring Boot)
- No authentication
- No server-side data persistence

Everything lives in React Context with mock data. This is **perfectly fine for an MVP/prototype** — and it means you don't *need* the heavy enterprise stack yet.

---

# Should You Request the Org-Whitelisted Stack?

Your org's whitelisted stack: **MongoDB, PostgreSQL, Java, React**

| Question | Analysis |
|---|---|
| **Do you need it for Teams Retro today?** | **No.** Your app is pure frontend React + mock data. No DB or backend needed for the current feature set. |
| **Will you need it eventually?** | **Yes** — if you want persistent data, multi-user support, real authentication, or deployment within your org's infrastructure. |
| **Does it solve the Node.js problem?** | **Partially.** If your org whitelists React development, they'd likely approve Node.js too (React requires Node to build). But "React" in an enterprise whitelist often means a pre-configured dev environment or CI/CD pipeline, not necessarily local Node.js installation rights. |
| **Is it the right tool for this project?** | **Overkill right now.** Java + Postgres + Mongo is an enterprise backend stack. Your app doesn't have a backend. Adding one now would triple the scope before you've shipped a single feature. |
| **How long does ServiceNow approval take?** | You'd know better than me, but enterprise IT requests typically take **days to weeks**. |

---

# The Real Decision Tree

Before we can proceed, I need you to answer **one question**:

Interesting — Node works but npm doesn't. That's unusual because npm ships bundled with Node.js. Let me diagnose this.

I can see the screenshot shows the terminal output. Let me ask you to confirm what I'm seeing since I need the exact details to diagnose.

**This is excellent news.** Corepack is your lifeline. Here's why:

---

# Diagnosis

| Tool | Status | Version |
|---|---|---|
| **Node.js** | ✅ Works | v24.13.1 (very recent — released 2025) |
| **Git** | ✅ Works | (confirmed earlier) |
| **npm** | ❌ Missing | Binary not available |
| **npx** | ❌ Missing | Same — ships with npm |
| **Corepack** | ✅ Works | 0.34.6 |

**Corepack** is a tool that ships with Node.js (since v16.10). Its entire purpose is to manage package managers — specifically **Yarn** and **pnpm** — without needing npm to install them. It downloads and activates them on demand.

This means you can use **pnpm** or **Yarn** as a drop-in replacement for npm. Every `npm` command has a direct equivalent.

---

# The Fix: Use pnpm via Corepack

**pnpm** is the best choice here because:
- It's faster than npm and yarn
- It has near-identical command syntax to npm (easiest migration)
- Corepack supports it natively
- It works perfectly with Next.js, Vitest, TypeScript — everything in your stack

Let me verify one thing first:

`corepack enable` tries to write to the Node.js installation directory, which requires admin rights on a corporate machine. There are workarounds. Let me walk you through them.

**Yarn 1.22.22 is available via `corepack yarn`!** That's our package manager. Let me confirm one more thing:



**We're in business.** Here's the complete picture.

---

# ✅ Final Toolchain Confirmation

| Tool | Status | Version | How to Invoke |
|---|---|---|---|
| **Node.js** | ✅ Works | v24.13.1 | `node` |
| **Git** | ✅ Works | (confirmed) | `git` |
| **Yarn** | ✅ Works | 1.22.22 | `corepack yarn` |
| **npm** | ❌ Blocked | — | Not available |
| **npx** | ❌ Blocked | — | Not available |

**The key rule going forward**: Every command in v5 that says `npm` becomes `corepack yarn`. Every command that says `npx` becomes `corepack yarn` (with a script in [package.json](cci:7://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/package.json:0:0-0:0)) or `node node_modules/.bin/<tool>`.

---

# Answers to Your Three Questions

## 1. Does v5 address the Node/npm issue?

**Yes — with one modification.** v5 as written uses `npm` everywhere. But since `corepack yarn` is a **drop-in replacement**, every `npm` command maps 1:1:

| v5 Original (npm) | v5 Modified (corepack yarn) |
|---|---|
| `npm install` | `corepack yarn install` |
| `npm test` | `corepack yarn test` |
| `npm run dev` | `corepack yarn dev` |
| `npm run build` | `corepack yarn build` |
| `npm run lint` | `corepack yarn lint` |
| `npm install -D vitest` | `corepack yarn add -D vitest` |
| `npx vitest run` | `corepack yarn vitest run` |
| `npx tsc --noEmit` | `corepack yarn tsc --noEmit` |

That's it. The entire plan works. Cascade runs locally, worktrees work locally, all 5 agents can install packages, run tests, build, and type-check — all through `corepack yarn`.

## 2. Do we have everything we need to build Teams Retro?

**Yes.** Here's the full stack audit:

| What Teams Retro Needs | What You Have | Verdict |
|---|---|---|
| **JavaScript runtime** | Node.js v24.13.1 | ✅ |
| **Package manager** | Yarn 1.22.22 via corepack | ✅ |
| **React framework** | Next.js 14 (in package.json) | ✅ Install via `corepack yarn install` |
| **UI library** | React 18 + React DOM 18 | ✅ |
| **Styling** | Tailwind CSS 3.4 + CSS variables | ✅ |
| **Type safety** | TypeScript 5.3 | ✅ |
| **Icons** | Lucide React | ✅ |
| **Charts** | Recharts | ✅ |
| **State management** | React Context (already built) | ✅ Already in [src/store/retro-store.tsx](cci:7://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/src/store/retro-store.tsx:0:0-0:0) |
| **Test runner** | Vitest (to be added by TEST agent) | ✅ Install via `corepack yarn add -D vitest` |
| **Version control** | Git | ✅ |
| **AI agents** | Windsurf Cascade + worktrees | ✅ |
| **Database** | Not needed (mock data in [src/data/mock-data.ts](cci:7://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/src/data/mock-data.ts:0:0-0:0)) | ✅ N/A for now |
| **Backend API** | Not needed (pure frontend) | ✅ N/A for now |
| **Auth** | Not needed | ✅ N/A for now |

**You have everything.** No missing pieces.

## 3. Should you request the org-whitelisted stack (Mongo, Postgres, Java, React)?

**Not now. Maybe later.** Here's why:

| Factor | Assessment |
|---|---|
| **Current need** | Teams Retro is a **frontend-only** React app with in-memory data. Zero backend. Zero database. |
| **What you'd gain now** | Nothing usable for the current project. You'd be adding complexity (Java backend, DB setup, connection strings, deployment config) before you've shipped a single feature. |
| **When it makes sense** | When you're ready to: persist retro data across sessions, support multiple users/teams, add authentication, or deploy to an internal server. That's Sprint 3-4 territory, not Sprint 1. |
| **ServiceNow lead time** | Enterprise IT requests take days/weeks. Submit it **now** as a parallel workstream so it's ready when you need it — but don't block Sprint 1 on it. |

### Recommendation
> **Submit the ServiceNow request today** for the whitelisted stack (Mongo, Postgres, Java, React). Let it process in the background. Meanwhile, **proceed with v5 + Yarn** for Sprint 1-2 using the frontend-only stack you already have. When the backend stack is approved, you'll have a working frontend ready to wire up to real APIs.

---

# Summary: What Changes in v5

The v5 plan I delivered above is **fully valid** with these global find-and-replace changes:

| In Every Agent Prompt & Phase | Replace | With |
|---|---|---|
| Package install | `npm install` | `corepack yarn install` |
| Add a dev dependency | `npm install -D <pkg>` | `corepack yarn add -D <pkg>` |
| Run tests | `npm test` or `npx vitest run` | `corepack yarn test` or `corepack yarn vitest run` |
| Dev server | `npm run dev` | `corepack yarn dev` |
| Build | `npm run build` | `corepack yarn build` |
| Lint | `npm run lint` | `corepack yarn lint` |
| Type check | `npx tsc --noEmit` | `corepack yarn tsc --noEmit` |
| package.json `"test"` script | `"test": "vitest run"` | `"test": "vitest run"` (same — yarn reads scripts identically) |

And one addition to the worktree hook (`.windsurf/hooks.json`):

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

---

# Next Step

You're unblocked. When you're ready, switch to **Code mode** and I'll:
1. Create all the scaffolding files (Phase 2) with `corepack yarn` commands baked in
2. Run `corepack yarn install` to populate [node_modules/](cci:9://file:///c:/Users/amul3034/OneDrive%20-%207-Eleven,%20Inc/Desktop/WindSurf%20Projects/Teams%20Retro/teams-retro/node_modules:0:0-0:0)
3. Set up the Git repo and push to GitHub

Or, if you want to start by identifying the first feature to tackle from your Replit mocks, we can do that first.

---

## Clarifications & Frequently Asked Questions

### Q1: Do I need to give Windsurf screenshots, the .tsx prototype files, or both?

**Both — but they serve different purposes.**

| Asset | Where It Lives | Who Reads It | Why It's Needed |
|---|---|---|---|
| **Screenshots** (`.png`) | `docs/ui-mocks/` | PRODUCT agent | Generates `AC-UI-*` acceptance criteria for visual/UX requirements. Without them, the agent cannot see your design intent. |
| **Prototype `.tsx` files** | `docs/prototypes/` | ARCHITECT + DEV agents | ARCHITECT uses them for gap analysis (what's missing: state, error handling, accessibility). DEV uses them as the starting template when building production code. |

> ⚠️ **Critical**: Prototype `.tsx` files go in `docs/prototypes/` ONLY — never in `src/`. The `src/` folder is sacred: only the DEV agent writes production code there, after it has been designed, tested, and approved by all upstream agents.

---

### Q2: Will Windsurf rebuild the pages from scratch? Won't that undo all my Replit design work?

**No — the DEV agent does NOT redesign or rebuild from scratch.** Here is exactly what it does:

1. Picks up your prototype `.tsx` from `docs/prototypes/`
2. Copies it to the correct location in `src/` (as specified by ARCHITECT)
3. **Preserves the visual layout exactly** — no rearranging, no redesigning
4. Adds only what is missing from the prototype: real state management (hooks, context), proper TypeScript types, localStorage persistence, loading/error states, accessibility attributes, and Tailwind class conversions

Think of the Replit prototype as a clay model of a car. It looks exactly right. The DEV agent's job is to put in a real engine, real brakes, and real electronics — without changing how the car looks.

---

### Q3: What is the correct direction of code flow? Does Replit push to GitHub or does Windsurf?

**Both push to GitHub — at different phases.** GitHub is the neutral bridge between the two environments.

```
┌─────────────────────────────────────────────────────────────┐
│  🎨 REPLIT — Phase 0 (Design Studio)                        │
│                                                             │
│  1. Build prototype .tsx files                              │
│  2. Take screenshots → docs/ui-mocks/                       │
│  3. Copy .tsx files → docs/prototypes/                      │
│  4. Write docs/SPRINT_1_BACKLOG.md                          │
│  5. git push origin main  ──────────────────────────────►  │
└─────────────────────────────────────────────────────────────┘
                              │
                        🐙 GITHUB
                              │
┌─────────────────────────────▼───────────────────────────────┐
│  🖥️ WINDSURF — Phases 2–4 (Engineering Floor)               │
│                                                             │
│  1. git pull origin main                                    │
│  2. PRODUCT reads backlog + screenshots                     │
│     → writes docs/FEATURE_REQUIREMENTS.md                  │
│  3. ARCHITECT reads requirements + prototypes               │
│     → writes docs/ARCHITECTURE_DESIGN.md                   │
│  4. TEST writes failing tests → src/__tests__/              │
│  5. DEV copies prototypes to src/, wires real logic         │
│     until all tests pass                                    │
│  6. REVIEWER runs 11-point audit → docs/AUDIT_REPORT.md    │
│  7. git push origin main  ──────────────────────────────►  │
└─────────────────────────────────────────────────────────────┘
                              │
                        🐙 GITHUB
                              │
┌─────────────────────────────▼───────────────────────────────┐
│  🎨 REPLIT — Phase 5 (Smoke Test)                           │
│                                                             │
│  1. git pull origin main                                    │
│  2. Run the app, click through the live preview             │
│  3. Compare against your original ui-mocks/ screenshots     │
│  4. ✅ Approve → start next sprint backlog                  │
│     🔁 Reject → send targeted fix back to Windsurf          │
└─────────────────────────────────────────────────────────────┘
```

**Rule of thumb:**
- Replit pushes **design artifacts** (prototypes, screenshots, backlog)
- Windsurf pushes **production code** (wired components, tests, audit reports)
- Neither environment ever overwrites the other's work — GitHub keeps the full history

---

### Q4: What is the complete list of screens/prototypes I need before Phase 0 is done?

Every user-facing screen AND every modal state needs a screenshot in `docs/ui-mocks/`. Prototype `.tsx` files are needed for each page (not each modal — modals live inside their parent page file).

#### Original 7 Screens (v1 — all complete)

| # | Screenshot File | Prototype File | Status |
|---|---|---|---|
| 1 | `registration.png` | `Registration.tsx` | ✅ Done |
| 2 | `Dashboard.png` | `Dashboard.tsx` | ✅ Done |
| 3 | `FeedbackBoard.png` | `FeedbackBoard.tsx` | ✅ Done |
| 4 | `SubmitFeedback.png` | *(inside FeedbackBoard.tsx)* | ✅ Done |
| 5 | `ConvertActionItem.png` | *(inside FeedbackBoard.tsx)* | ✅ Done |
| 6 | `ActionItems.png` | `ActionItems.tsx` | ✅ Done |
| 7 | `VerifyImpact.png` | *(inside ActionItems.tsx)* | ✅ Done |

#### Additional Screens (v2 — added after product design decisions)

| # | Screenshot File | Prototype File | Status |
|---|---|---|---|
| 8 | `dashboard-empty.png` | *(inside Dashboard.tsx)* | 🔲 Pending Replit build |
| 9 | `feedback-board-empty.png` | *(inside FeedbackBoard.tsx)* | 🔲 Pending Replit build |
| 10 | `action-items-empty.png` | *(inside ActionItems.tsx)* | 🔲 Pending Replit build |
| 11 | `sprint-setup.png` | `SprintSetup.tsx` | 🔲 Pending Replit build |
| 12 | `new-action-item-modal.png` | *(inside ActionItems.tsx)* | 🔲 Pending Replit build |

> **Workflow for modal screenshots**: Hardcode `isOpen=true` on the modal → take screenshot in browser → tell Replit Agent to revert to `isOpen=false`. Repeat for each modal one at a time. The agent cannot take screenshots — that is always a manual browser action by you.

> **Full screen pages** (Sprint Setup, empty states): navigate directly in the Replit preview — no hardcoding needed.

---

## Additional Q&A — Product Design Sessions

### Q5: Is localStorage-first the right approach, or should we build with persistence from day 1?

**localStorage-first has real value — but only as a deliberate, time-boxed decision.**

**Do Sprint 1 with localStorage.** Use it to validate UX flows and confirm the team wants to use this format. The risk of building persistence from day 1 is spending 3 weeks on auth, DB schema, and API design before a single team member has clicked a button.

**In Sprint 2–3, add the backend.** By then the ServiceNow request for Mongo/Postgres + Java will be approved and you'll know exactly which data needs to persist from real usage.

**The hard limit**: A retrospective is an inherently multi-user activity. If each person's data is in their own browser, the facilitator sees an empty board. localStorage is deliberately MVP-only. The first time you try to run an actual retro with your team, you hit the wall — that's the signal to move to Scope 3 with a real backend.

---

### Q6: What data points are saved per user, and how are attributes calculated vs displayed?

#### Data saved per registered user
```
User { id (UUID), name, username, pod, isAdmin }
```

#### Write attributes (what causes a save)

| User Action | What Gets Written | Where |
|---|---|---|
| Register | `{ id, name, username, pod, isAdmin }` | `localStorage["retro_user"]` |
| Submit Feedback | `{ id, content, category, authorId, isAnonymous, upvotes:0, upvotedBy:[], createdAt, sprintId }` | `localStorage["retro_feedback"]` |
| Upvote feedback | `upvotes + 1`, `userId` added to `upvotedBy[]` | Same array |
| Create Action Item | `{ id, title, description, status:"open", ownerId, sourceFeedbackId, sourceQuote, dueDate, createdAt }` | `localStorage["retro_actions"]` |
| Advance action status | `status` field updated (open → in-progress → completed) | Same array |
| Verify Impact | `status: "verified"`, `impactNote` added | Same array |

#### Display/Derived attributes (calculated on render, never stored)

| Display Value | How It's Derived |
|---|---|
| **Completion Rate** | `(completed + verified) / total * 100` |
| **Total Upvotes** | `feedbackItems.reduce((sum, f) => sum + f.upvotes, 0)` |
| **Feedback Count** | `feedbackItems.length` |
| **Items by status pill** | `actions.filter(a => a.status === "open").length` etc. |
| **Column sort order** | `[...items].sort((a, b) => b.upvotes - a.upvotes)` |
| **Source quote on action card** | Copied from feedback content at creation time — stored directly |

---

### Q7: What happens when the app first loads with no data? What is the admin role?

#### Empty states
Every page needs a designed empty state:
- **Dashboard**: "No sprint data yet. Set up your first sprint to get started." + "Set Up Sprint →" button
- **Feedback Board**: Each column shows a dashed-border placeholder with column-specific prompt text
- **Action Items**: Centered empty state with "No action items yet." + two buttons: "Go to Feedback Board" + "+ New Action Item"

#### Admin role (Scope 2)
The first user to register gets `isAdmin: true`. All others get `isAdmin: false`. The admin (facilitator) can:
- Set up and configure sprints
- Add/remove team members
- See the "→ Action" button on any feedback card (not just high-upvote ones)
- Verify impact on action items

In Scope 3, the admin role is assigned via session creation (facilitator creates session, shares invite code).

---

### Q8: Should upvoting change card sort order? Should downvoting be allowed?

**Upvoting DOES change sort order** — highest upvotes float to the top of each column. This surfaces the most important issues automatically and is standard retro tool behavior (EasyRetro, FunRetro, Parabol).

**No downvoting.** Downvoting creates political friction and negativity in a team setting. Upvote-only is the industry standard. Kept permanently out of scope.

---

### Q9: Should Action Items be creatable from the Action Items page, not just the Feedback Board?

**Yes — two entry points with different use cases:**

| Entry Point | When Used | Pre-fills |
|---|---|---|
| "Convert to Action" on Feedback Board card | Organic — feedback surfaced a concrete problem | Title, description, source quote from feedback |
| "+ New Action Item" on Action Items page header | Facilitator-assigned — team decides action directly in discussion | Blank form, no source quote (`sourceFeedbackId: null`) |

Both are valid. The Feedback Board path is the "pull" model (problem → action). The Action Items page button is the "push" model (facilitator assigns work directly).

---

### Q10: What is "Advance Status"? What is the difference between Completed and Verified? Who verifies?

**"Advance Status"** is a single button on each action card that moves the item forward one step. The button label changes with status:

| Current Status | Button Label | Next Status |
|---|---|---|
| Open | `Start` | In Progress |
| In Progress | `Mark Complete` | Completed |
| Completed | `Verify Impact` | Opens Verify Impact modal → Verified |
| Verified | *(no button — terminal state)* | — |

**Completed** = the owner declares the work is done.
**Verified** = a team member confirms the action actually produced a measurable improvement. Requires a written `impactNote` (min 20 chars, e.g. "Deploy success rate improved from 70% → 95%").

These are deliberately separate: "done" ≠ "effective."

**Who verifies**: Any registered user in Scope 2. Facilitator only in Scope 3.

---

### Q11: Anonymous feedback and the Leaderboard — how does that work?

**Option A is confirmed** (chosen over Option B).

| Scenario | Display | Stored | Leaderboard (Scope 3) |
|---|---|---|---|
| Named feedback | Author's name shown | `authorId` + `isAnonymous: false` | Points credited publicly |
| Anonymous feedback | "Anonymous" shown | `authorId` + `isAnonymous: true` | Points credited to author privately — team doesn't see which cards were theirs |

The `authorId` is always stored internally. The display layer checks `isAnonymous` before rendering the author name. This preserves psychological safety while still rewarding honest participation with points.

**Implementation note for DEV**: `isAnonymous: boolean` must be on `FeedbackItem` from Sprint 1. Do not omit it — retrofitting this field later breaks all existing feedback records.

---

### Q12: What is the correct architecture for Teams Retro?

**Component-Based Monolith with a Service Layer.**

```
PRESENTATION LAYER (React Components — pages/ and components/)
    ↓ calls
SERVICE LAYER (Pure TypeScript functions — services/)
    ↓ reads/writes
DATA LAYER (localStorage adapter — lib/storage.ts)
    [Scope 3: swap storage.ts for API calls — nothing else changes]
```

**Why this pattern solves the two key concerns:**

1. **No bugs as codebase grows**: Business logic in service files — one bug = one file, not scattered across 3 pages. Each service function is independently testable.

2. **Context window compliance**: Each file targets 100–150 lines max. No file should exceed 200 lines. The ARCHITECT agent enforces this as a hard rule.

**Rejected patterns**: Microservices (overkill), Micro-frontends (one team), Messaging-based (no async workflows), pure N-tier (too rigid for frontend iteration).

---

### Q13: What are all the TypeScript constructs and data types used in this project?

See `docs/Team-Retro-Document.md` Section 9 for the full reference. Summary:

| Construct | Example |
|---|---|
| `string` | `id`, `name`, `content` |
| `number` | `upvotes` |
| `boolean` | `isAnonymous`, `isAdmin` |
| `string[]` | `upvotedBy`, `teamMemberIds` |
| `string \| null` | `sourceFeedbackId`, `impactNote` |
| `string?` | `description?`, `suggestion?` |
| Union type | `status: "open" \| "in-progress" \| "completed" \| "verified"` |
| `useState` | `const [isOpen, setIsOpen] = useState(false)` |
| `useContext` | `const { feedback } = useRetroStore()` |
| `useMemo` | Derived sorts/filters to avoid recalculation |
| Arrow function | `feedbackItems.filter(f => f.category === "slowed")` |
| Spread + sort | `[...items].sort((a, b) => b.upvotes - a.upvotes)` |
| Reduce | `items.reduce((sum, f) => sum + f.upvotes, 0)` |

---

## Terminal Commands Quick Reference

All commands run from inside `teams-retro/` unless noted. `npm` is blocked on this machine — always use `corepack yarn`.

### Package Management
```bash
corepack yarn install              # Install all dependencies
corepack yarn add <package>        # Add a runtime dependency
corepack yarn add -D <package>     # Add a dev dependency
```

### Development
```bash
corepack yarn dev                  # Start dev server (localhost:3000)
corepack yarn build                # Production build
corepack yarn lint                 # Run ESLint
corepack yarn tsc --noEmit         # TypeScript type check only
```

### Testing
```bash
corepack yarn test                 # Run all tests (watch mode)
corepack yarn vitest run           # Run tests once
corepack yarn vitest --coverage    # Run tests with coverage
```

### Git — Daily Use
```bash
git status                         # See changed files
git add .                          # Stage all changes
git commit -m "message"            # Commit staged changes
git push origin main               # Push to GitHub
git pull origin main               # Pull from GitHub
git log --oneline -10              # Last 10 commits
```

### Git — One-Time Setup (Phase 1)
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/teams-retro.git
git push -u origin main
```

### Git — Worktrees (Phase 3, one per agent)
```bash
git worktree add ../retro-product product-branch
git worktree add ../retro-architect architect-branch
git worktree add ../retro-test test-branch
git worktree add ../retro-dev dev-branch
git worktree add ../retro-reviewer reviewer-branch
git worktree list
git worktree remove ../retro-product   # Remove when done
```

### Verification
```bash
node --version                     # Should show v24.x
corepack yarn --version            # Should show 1.22.22
git remote -v                      # Confirm GitHub remote connected


---

## Q&A — Windsurf Workflow Mechanics

### Q14: Why did we push the .windsurf/cascades/ rule files to GitHub?

**So every agent session — on any machine or worktree — automatically gets the exact same instructions without manual pasting.**

Each Cascade session starts with a blank context. Without the rule files committed to the repo, when a DEV agent opens `../retro-dev/` (its worktree folder), it would have no idea it's supposed to use `corepack yarn`, follow the 200-line limit, call `connectDB()` first, or use the `toJSON` transform pattern. The `.windsurf/cascades/` folder is Windsurf's way of auto-loading role-specific instructions into any session that opens that workspace. GitHub is the delivery vehicle so those rules travel with the codebase to every environment and every worktree.

---

### Q15: How do Git Worktrees Work?

**A worktree gives you multiple independent working copies of the same repo, each on its own branch, in separate folders — with zero duplication of the `.git` history.**

#### Folder structure after Phase 3 setup

```
WindSurf Projects/
├── Teams Retro/
│   └── teams-retro/          ← main branch (your primary workspace)
│       ├── src/
│       ├── docs/
│       └── .windsurf/
│
├── retro-product/            ← worktree on branch: product-branch
├── retro-architect/          ← worktree on branch: architect-branch
├── retro-test/               ← worktree on branch: test-branch
├── retro-dev/                ← worktree on branch: dev-branch
└── retro-reviewer/           ← worktree on branch: reviewer-branch
```

#### Key facts
- All five folders share the **same single `.git` directory** — no storage duplication
- Each folder has its own branch — the DEV agent can't stomp on PRODUCT files
- Each folder is a **full, real checkout** — you can open, edit, and run commands in it
- Worktrees are **semi-permanent** — they persist across sessions until you explicitly remove them with `git worktree remove`. You do NOT recreate them per sprint.

#### Branch flow per sprint
```
main (stable)
  ├── product-branch   ← PRODUCT writes FEATURE_REQUIREMENTS.md
  ├── architect-branch ← ARCHITECT writes ARCHITECTURE_DESIGN.md + IMPLEMENTATION_PLAN.md
  ├── test-branch      ← TEST writes failing test files
  ├── dev-branch       ← DEV writes production code until tests pass
  └── reviewer-branch  ← REVIEWER runs 11-point audit
         ↓
      merge all → main → git push origin main
```

---

### Q16: Should I use the same Cascade pane for all agents, or separate panes?

**Use separate Cascade sessions (new chat pane per agent).** Here's why:

| Approach | What happens |
|---|---|
| **Same pane** | PRODUCT's output stays in context when DEV runs. DEV "remembers" the product discussion and may drift toward satisfying what it read rather than running the tests. Context also fills faster — you'd hit the 200k limit mid-sprint. |
| **Separate pane per agent** | Each agent starts clean, reads only the documents specified in its pre-flight, and stays in its lane. Cleaner outputs, no cross-contamination. |

**Practical workflow**:
1. Open `../retro-product/` folder in Windsurf → New Cascade chat → run PRODUCT
2. Open `../retro-architect/` folder → New Cascade chat → run ARCHITECT
3. Continue for TEST, DEV, REVIEWER

Each worktree folder = its own Cascade session = its own isolated context window.

---

### Q17: The context window circle — how does it work, and what do I do if it fills mid-task?

#### How it fills
The circle (e.g. `36% — 72,639 / 200,000 context used`) tracks tokens in the current conversation:
- Every message you send adds tokens
- Every file the agent reads via tool calls adds tokens (~2,000–3,000 tokens per 300-line file)
- Every response the agent writes adds tokens
- Tool call outputs (grep results, file reads) add tokens

#### What happens at ~100%
Windsurf automatically creates a checkpoint summary. The summary replaces the raw conversation history, freeing up the window. Important decisions and file paths are preserved, but subtle state (exact variable names, hook signatures written earlier) can drift after a summary.

#### What to do if a DEV task would span two windows

**Do not let a single DEV task span two context windows.** The right approach:
- If the circle hits **~85% mid-task**: stop, write `IMPLEMENTATION_NOTES.md` with exactly where you left off, commit all progress, close the session
- Open a **new Cascade session** in the same worktree folder, re-read only the files needed for the remaining work, and continue
- The **400–600 line per session target** specifically prevents this — a properly scoped DEV session should complete well before the window fills

#### Does quality suffer when the window is nearly full?
Yes — this is a real risk. Signs a session is too full:
- Variable names drift between files
- Imports reference functions that don't exist yet (hallucination)
- Later files don't match type definitions written at the start

**Prevention**: Follow the session sizing guide in the "Context Quality Per Session" section above. One page component + one or two service files per session is the right scope.

---

### Q18: Should .windsurf/cascades/ rule files be pushed to GitHub or kept private?

**Decision: Push to GitHub (current setup — no change needed).**

The rule files contain no secrets (no API keys, no passwords — only agent instructions). Pushing them means:
- Every worktree automatically loads the correct rules without manual setup
- Rules are version-controlled alongside the code they govern
- If you reinstall Windsurf or change machines, rules are restored with a `git pull`

If you ever want to keep them private, add `.windsurf/` to `.gitignore`. The worktrees will still share the rules via the `.git` link (no push needed for local use), but rules won't travel to other machines.

**Global rules** (`c:\Users\amul3034\.codeium\windsurf\memories\global_rules.md`) are separate — they apply to every project on your machine and are intentionally NOT in any project's Git repo. The two systems complement each other: global rules set baseline persona behavior; project `.rules` files add project-specific context on top.

---

### Q19: How do I open a worktree folder and start a new Cascade chat in Windsurf?

"New Cascade chat" is **not** a right-click option in the file explorer. Here are the exact steps:

1. **File → Open Folder** → select the worktree folder (e.g. `Teams Retro/retro-product/`)
2. Windsurf opens that folder as the active workspace
3. In the **Cascade panel** (right side): click the **`+`** icon at the top to start a new chat
4. Alternatively: **Ctrl+Shift+P** → type **"Windsurf: New Cascade Chat"** → Enter

The `.windsurf/cascades/` rules load automatically because all worktrees share the same `.windsurf/` folder via the Git worktree link.

> **Multi-root tip**: To see all worktrees simultaneously without switching workspaces, use **File → Add Folder to Workspace** and add each worktree folder. Each Cascade session you open will let you pick the active folder.

---

### Q20: Why are we not using Mem0 OpenMemory MCP for cross-session memory?

**Short answer: Windsurf's team/org plan blocks all custom MCP servers. We use Cascade's built-in native memory instead.**

#### What was attempted

The plan was to use Mem0's hosted MCP server (`https://mcp.mem0.ai/mcp`) so that Cascade could store and retrieve Teams Retro project facts (architecture, conventions, sprint history) across sessions without needing to paste a checkpoint. This was configured in `C:\Users\amul3034\.codeium\windsurf\mcp_config.json`.

#### Why it failed

The 7-Eleven Windsurf account is on a **managed team plan**. Codeium enforces an allowlist of approved MCP servers at the org level. Any server not on that list — including Mem0, `@modelcontextprotocol/server-memory`, and any other custom HTTP MCP server — is blocked with the message:

> "This server is not allowed for your team."

This is enforced server-side and cannot be bypassed from `mcp_config.json`. Carbon Black is not involved — this is a Windsurf org policy.

#### What we use instead: Cascade Native Memory

Windsurf's Cascade AI has a **built-in persistent memory system** that is always enabled regardless of team plan restrictions. It works automatically:

- Facts stored in Cascade memory persist across all future sessions
- Cascade retrieves relevant memories automatically at the start of each session
- No MCP server, no Docker, no API key, no config needed
- Stored in Codeium's cloud tied to your account

**All 8 Teams Retro entities are already stored** in Cascade native memory:
1. Core project stack & config (Next.js 14, React 18, TypeScript 5.3, Tailwind, MongoDB Atlas)
2. Worktree structure (teams-retro/, retro-dev/, retro-architect/, etc.)
3. Data models (User, Sprint, FeedbackItem, ActionItem schemas)
4. API routes (all endpoints, toggle upvote behavior, advance/regress/verify)
5. Key files reference (page routes, components, services)
6. Agent roles & workflow (PRODUCT → ARCHITECT → TEST → DEV → PROFESSOR → REVIEWER)
7. Conventions & hard rules (corepack yarn only, no inline styles, /action-items not /actions, etc.)
8. Completed sprints & bug fix history

#### How to use it going forward

At the start of any new Cascade chat, you can verify memory is loaded by asking:
```
What do you know about the TeamsRetro project?
```

To add new facts after a session (e.g., a new bug fix or convention discovered):
```
Remember for TeamsRetro: [new fact here]
```

#### Antigravity (Google IDE) — no restrictions

Antigravity is a Google product with no Codeium team restrictions. It can connect to Mem0's hosted MCP directly:

```json
{
  "mcpServers": {
    "mem0-mcp": {
      "serverUrl": "https://mcp.mem0.ai/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MEM0_API_KEY"
      }
    }
  }
}
```

In Antigravity: **`...` (top-right) → MCP Servers → Manage MCP Servers → Edit configuration** → paste the above. Seed with the same 8-entity prompt from `teams-retro/docs/MAWv5.md` Phase 6, Step 6.5.
