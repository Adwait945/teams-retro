# Tech Debt Log

Appended by the `reviewer` role after each sprint audit (see
`.claude/agents/reviewer.md`). Entries below the sprint sections are
environment/process notes that don't belong to a specific sprint.

## Process notes

## Sprint 7 — Points Engine, Badge Engine, Leaderboard Rebuild, Dashboard Enhancement (2026-07-08)

Logged by REVIEWER after the Sprint 7 audit (verdict: APPROVED, 28/28 checks pass). None of these
items blocked approval — all automated gates (`npm test`, `npx tsc --noEmit`, `npm run build`) are
green and every item below was either explicitly disclosed by DEV/ARCHITECT/PRODUCT during the
sprint or is a genuinely pre-existing condition confirmed not to be a Sprint 7 regression.

### 1. Manual smoke test against live MongoDB — not performed
The backlog's 14-step Smoke Test Checklist (seeded `PointEvent`s rank correctly on Leaderboard, a
badge is awarded when a threshold is crossed, Pod Champion transfers correctly, All-Time view hides
Category Breakdown deltas, fresh/empty pod shows the Leaderboard empty state) was **not run** —
no `MONGODB_URI` is configured in this environment. All automated gates pass and the code was
read/traced manually against the same scenarios, but this is not a substitute for a live-DB smoke
test. **Action needed before this reaches real users**: run the 14-step checklist against a real
MongoDB Atlas instance (or a local Mongo) before this build is considered production-ready, even
though it is approved to merge to `main` at the source-control level.

**Follow-up (2026-07-08)**: this checklist was subsequently run manually against live MongoDB and
surfaced a real Pod Champion tie-break bug (`evaluatePodChampion()` in `src/lib/badgeEngine.ts` was
comparing each tied user's overall-earliest `PointEvent` instead of the event at which their
running 30-day total first reached the tied value). TEST added regression coverage
(`T1-ENGINE-04`/`T1-ENGINE-05` in `src/__tests__/badgeEngine.test.ts`) and DEV fixed it — see
`docs/IMPLEMENTATION_NOTES.md`'s "Sprint 7 — Post-Smoke-Test Bug Fix" section for the full
root-cause/fix/verification writeup. All 5 `badgeEngine.test.ts` tests, the full suite (150/158,
unchanged pre-existing failures only), `tsc --noEmit`, and `npm run build` are confirmed green
post-fix.

### 2. Cross-pod data isolation gap (pre-existing, not a Sprint 7 regression)
Per ADR-0006: `FeedbackItem`/`ActionItem` have no `podId` field and `GET /api/feedback`/
`GET /api/actions` have no pod filter — every pod currently sees every other pod's feedback and
action items. This predates Sprint 7 (confirmed via ADR-0006's own investigation) but Sprint 7's
"Top Voted Feedback" and "Verified Improvements" Dashboard sections inherit this gap, since they
consume the same unfiltered `GET /api/feedback`/`GET /api/actions` endpoints. Recommended as a
dedicated future PRODUCT-scoped sprint (introduce a real `Pod` entity or add `podId` to the two
existing collections) rather than a silent scope-creep fix inside a future sprint's unrelated work.

### 3. `src/app/action-items/page.tsx` exceeds the 200-line file cap (247 lines, pre-existing)
Confirmed via `git diff` that this file predates Sprint 7 essentially unchanged (Sprint 7 touched
exactly one line, the `verifyImpact()` call-site argument). Not a Sprint 7 violation, but flagged
here since the file is over the project's stated cap and should be split (e.g. extract the
verify/advance handler functions or the modal-orchestration state) in a future sprint that touches
this file anyway, rather than as a standalone refactor sprint.

### 4. `PATCH /api/actions/[id]/verify` breaking change is a same-deploy-unit change
The verify route's new required `userId` field, `src/services/actionService.ts`'s 3-argument
`verifyImpact()` signature, and its one call site in `action-items/page.tsx` must all ship together
— rolling back any one of the three in isolation breaks the verify flow. This is correctly how
Sprint 7 shipped it (all three landed as one unit), but is worth documenting explicitly as a
deploy-coordination constraint for anyone doing a partial rollback or a cherry-pick in the future.

### 5. Process notes — three mid-flight, human-approved deviations from the original plan
Recorded here as precedent for future sprints' pipeline coordination, not as defects:
- **Verify-route breaking change fallout** (Session 2+3): DEV correctly stopped and flagged rather
  than silently editing the 3 affected pre-existing test assertions
  (`actionService.test.ts` AS-11/AS-13/AS-VG-1, `actionItems.test.tsx` AI-12). A human approved
  updating those assertions to the new 3-argument contract post-session. Precedent: DEV should keep
  flagging test-file conflicts rather than resolving them unilaterally; a human/REVIEWER call is the
  right gate.
- **Build-gate blocker fix** (post-Session-5, pipeline coordinator): `GET(req?: NextRequest)` in
  `src/app/api/users/route.ts` was a genuine pre-existing bug (confirmed via `git show` to predate
  Sprint 7) that only surfaced because `npm run build` had apparently never been run as a hard gate
  in earlier sprints. Recommend adding `npm run build` to every sprint's DEV Session 1 completion
  gate going forward, not just the whole-sprint gate, to catch this class of bug earlier.
- **`router` dependency-array fix** (Session 5): a genuine pre-existing infinite-render-loop bug in
  `dashboard/page.tsx`'s `useEffect` deps array, caused by the test suite's `useRouter()` mock
  returning a new object reference every render. Fix was minimal (deps array only, confirmed via
  diff — no fetch/isLoading/loadError logic touched) and incidentally improved
  `dashboard.test.tsx` from 3/6 to 6/6 passing. Flagged and disclosed rather than silently applied,
  consistent with the repo's "CONFLICT FLAGGED FOR REVIEWER" precedent.

### 6. Missing `MVP_SCOPE_DECISIONS.md` / `PRODUCT_THINKING_SESSION.md` (process gap, not a Sprint 7 defect)
Cited by the original Sprint 7 backlog for Decisions S3-1, S3-6, S3-8, neither file exists anywhere
in the repo. PRODUCT correctly treated the backlog's own inline prose as authoritative rather than
inventing content for the missing docs, and flagged this explicitly rather than guessing. Recommend
either recreating these as standalone docs at the next planning cycle or scrubbing the stale
citations from future backlogs — not a blocker for Sprint 7, but worth resolving so future sprints
don't repeat the same "flag and treat inline prose as authoritative" workaround indefinitely.

---

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
