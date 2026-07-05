Setup: Mem0 OpenMemory MCP on Mac
Step 5.1 — Install and run via Docker (recommended) or npx
Option A — Docker (persistent across reboots):

docker run -d --name openmemory-mcp -p 8888:8888 mem0ai/openmemory-mcp
# Restart after reboot:
docker start openmemory-mcp
Option B — npx (simpler, no Docker required on Mac):

npx -y mem0ai/openmemory-mcp
Add to a startup script or run manually before each Windsurf session.

Step 5.2 — Configure Windsurf
Edit ~/.codeium/windsurf/mcp_config.json:

If using Docker:

{
  "mcpServers": {
    "memory": {
      "serverUrl": "http://localhost:8888/mcp",
      "transport": "http"
    }
  }
}
If using npx:

{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "mem0ai/openmemory-mcp"]
    }
  }
}
Restart Windsurf. Verify memory shows a green dot in Settings → Cascade → MCP Servers.

Step 5.3 — Configure other IDEs (Hub-and-Spoke)
For Cursor, add the same entry to ~/.cursor/mcp.json. For any other MCP-compatible IDE, point it at http://localhost:8888/mcp.

Replit: Replit runs in a cloud container and cannot reach localhost on your Mac. Treat Replit as a deploy/test environment only — memory authoring happens in local IDEs.

Step 5.4 — Seed Teams Retro project context
Open a new Cascade chat and paste this prompt once:

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
Step 5.5 — Add memory recall to agent rules
Add to dev.rules and reviewer.rules:

* Session Start: Before any code changes, call memory MCP search_nodes for "TeamsRetro" to retrieve project context.
* Session End: Store any new architectural decisions or convention violations discovered as observations on the TeamsRetro entity.
Step 5.6 — Using memory in future sessions
At session start, instead of pasting a checkpoint:

Use memory tools to recall everything about TeamsRetro. Then [describe your task].
To add new facts:

Add to TeamsRetro memory: "The /actions route is local-only — always use /action-items."