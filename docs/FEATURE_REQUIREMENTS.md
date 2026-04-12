# Feature Requirements — Sprint 2: Feedback Board

**Source Backlog**: `docs/Sprint2.md`  
**UI Mocks Analyzed**: `docs/ui-mocks/FeedbackBoard.png`, `docs/ui-mocks/feedback-board-empty.png`, `docs/ui-mocks/SubmitFeedback.png`  
**Prototypes Analyzed**: `docs/prototypes/FeedbackBoard.tsx`  
**Type Reference**: `src/types/index.ts`  
**Generated**: Sprint 2 — Feedback Board Layout, Submit Feedback, Upvote, Reframe Rule  
**Prerequisite**: Sprint 1 complete — MongoDB connection, models, registration, and dashboard in place  

---

## Table of Contents

1. [Epic 2.1 — Feedback Board Layout + Read](#epic-21--feedback-board-layout--read)
2. [Epic 2.2 — Submit Feedback + Upvote](#epic-22--submit-feedback--upvote)
3. [Special Business Rule: The Reframe Rule](#special-business-rule-the-reframe-rule)
4. [Shared UI Shell Requirements (Sprint 2)](#shared-ui-shell-requirements-sprint-2)
5. [Type-Schema Alignment (Sprint 2)](#type-schema-alignment-sprint-2)
6. [Dependency Map](#dependency-map)
7. [Definition of Done](#definition-of-done)

---

## Epic 2.1 — Feedback Board Layout + Read

### User Story

> As a team member, I want to see all feedback for the current sprint organized into three lanes, so that I can review what the team is thinking.

---

### Acceptance Criteria — Verbatim from Backlog

| AC-ID | Criterion |
|---|---|
| AC-2.1.1 | Feedback Board renders at `/feedback` |
| AC-2.1.2 | Three columns render: "What Went Well", "What Slowed Us Down", "What Should We Try" |
| AC-2.1.3 | Each feedback card shows: content, author (or "Anonymous"), upvote count, upvote button |
| AC-2.1.4 | Cards within each lane are sorted by upvote count descending |
| AC-2.1.5 | If no feedback exists, shows empty state matching `docs/ui-mocks/feedback-board-empty.png` |
| AC-UI-2.1.1 | Layout matches `docs/ui-mocks/FeedbackBoard.png` |

---

### Acceptance Criteria — Refined for Testability

| AC-ID | Testable Criterion |
|---|---|
| AC-2.1.1 | Navigating to `/feedback` renders the page with the `Shell` layout (sidebar visible). A Jest/RTL test with mocked `sessionStorage` (valid user) confirms the component mounts without redirecting. If `sessionStorage` has no user, the page redirects to `/`. |
| AC-2.1.2 | The rendered page contains exactly three column headers with the exact text strings: "What Slowed Us Down?", "What Should We Try?", and "What Went Well?". A test queries by heading text and asserts all three are present. Column order in the DOM matches the mock (Slowed Down first, Should Try second, Went Well third). |
| AC-2.1.3 | Each rendered `FeedbackCard` contains: (a) a `<p>` element with the feedback `content`, (b) an author display showing either the user's name or the string "Anonymous" when `isAnonymous` is `true`, (c) a numeric upvote count, (d) an upvote `<button>` element. A test renders a card with known data and asserts all four elements are present. |
| AC-2.1.4 | `feedbackService.sortByUpvotes(items)` returns a new array sorted by `upvotes` count descending. A unit test provides an unsorted array (e.g. upvotes: [3, 8, 1, 5]) and asserts the returned order is [8, 5, 3, 1]. Equal upvote counts may be in any relative order. Cards rendered in each column must reflect this sorted order in the DOM. |
| AC-2.1.5 | When `GET /api/feedback?sprintId=X&category=Y` returns an empty array for all three categories, each column renders its per-lane empty-state placeholder (no `FeedbackCard` elements). A test mocks the API to return `[]` for each lane and asserts the three per-lane empty messages appear and no cards are rendered. |
| AC-UI-2.1.1 | *(See AC-UI rows below)* |

---

### UI Requirements — Feedback Board Populated State (from `docs/ui-mocks/FeedbackBoard.png` + `docs/prototypes/FeedbackBoard.tsx`)

| AC-ID | Visual / Layout Requirement |
|---|---|
| AC-UI-2.1.1 | Page uses the `Shell` layout (sidebar + main content); "Feedback Board" is the active nav item, highlighted with the amber left-accent bar |
| AC-UI-2.1.2 | Page header area: `h1` with text "Feedback Board" in `text-2xl font-bold tracking-tight`; subtitle "Review, vote, and convert feedback to action." in `text-muted-foreground text-sm` |
| AC-UI-2.1.3 | "Submit Feedback" button in the top-right of the header row; styled `bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4`; prefixed with a `Plus` (Lucide) icon |
| AC-UI-2.1.4 | Three columns fill the remaining page height using `flex-1 grid grid-cols-3 gap-6 min-h-0`; columns are equal width |
| AC-UI-2.1.5 | Each column container: `flex flex-col bg-secondary/20 rounded-xl border border-border/50 overflow-hidden` |
| AC-UI-2.1.6 | Column header strip: `p-4 border-b border-border/50 bg-secondary/40 flex items-center justify-between shrink-0` |
| AC-UI-2.1.7 | Column header title colors: "What Slowed Us Down?" in `text-red-500`; "What Should We Try?" in `text-blue-500`; "What Went Well?" in `text-emerald-500` |
| AC-UI-2.1.8 | Each column header title is preceded by a glowing color-dot: `w-2 h-2 rounded-full` with matching color and `shadow-[0_0_8px_rgba(...)]` glow. Red dot for Slowed Down, blue for Should Try, emerald for Went Well |
| AC-UI-2.1.9 | Card count badge in the column header: `text-xs font-medium bg-secondary px-2 py-1 rounded text-muted-foreground`; displays the integer count of cards in that lane |
| AC-UI-2.1.10 | Column card list area: `p-4 overflow-y-auto space-y-4`; cards scroll within the column without affecting the page layout |
| AC-UI-2.1.11 | Each `FeedbackCard` uses `retro-card p-4` base styles with a category-specific left-border class: `border-left-red` (Slowed Down), `border-left-blue` (Should Try), `border-left-emerald` (Went Well) |
| AC-UI-2.1.12 | Card body text: `text-sm leading-relaxed mb-4 text-slate-200` |
| AC-UI-2.1.13 | When a `FeedbackItem` has a `suggestedImprovement` value, it is displayed below the content in a sub-block: label "SUGGESTED IMPROVEMENT" in `text-[10px] font-semibold uppercase tracking-wider text-muted-foreground`; quoted text in `text-xs text-slate-300 italic` |
| AC-UI-2.1.14 | Card footer row: flex row with author info on the left, upvote button on the right |
| AC-UI-2.1.15 | Named author display: circular avatar (`w-6 h-6 rounded-full bg-slate-700 border border-border text-[10px] font-medium`) showing the first letter of the author's name, followed by the author name in `text-xs text-muted-foreground` |
| AC-UI-2.1.16 | Anonymous author display: circular avatar with a `User` (Lucide) icon at `opacity-50` instead of an initial; author label displays the text "Anonymous" |
| AC-UI-2.1.17 | Upvote button: `flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50 hover:bg-secondary text-xs font-medium transition-colors`; contains a `ThumbsUp` icon in `text-muted-foreground` and the integer upvote count |
| AC-UI-2.1.18 | Page entrance animation: `animate-in fade-in slide-in-from-bottom-4 duration-500` on the outermost content wrapper |

---

### UI Requirements — Feedback Board Empty State (from `docs/ui-mocks/feedback-board-empty.png` + `docs/prototypes/FeedbackBoard.tsx`)

| AC-ID | Visual / Layout Requirement |
|---|---|
| AC-UI-2.1.19 | When a lane has no cards, the card list area renders a single dashed placeholder: `border-2 border-dashed border-border/50 rounded-lg p-6 text-center text-sm text-muted-foreground bg-secondary/10 min-h-[120px] flex items-center justify-center` |
| AC-UI-2.1.20 | Per-lane empty-state placeholder text: "What Slowed Us Down?" lane → "No blockers reported yet. Be the first to share."; "What Should We Try?" lane → "No suggestions yet. What would help the team?"; "What Went Well?" lane → "Nothing logged yet. Share a win!" |
| AC-UI-2.1.21 | In the empty state, each column header still renders with its title and a badge showing `0` |
| AC-UI-2.1.22 | The "Submit Feedback" button remains visible and active in the empty state (same position as populated state) |
| AC-UI-2.1.23 | The sidebar remains fully visible in the empty state with "Feedback Board" as the active nav item (confirmed in `feedback-board-empty.png`) |

---

### Files to Create (Epic 2.1)

| File | Action |
|---|---|
| `src/app/api/feedback/route.ts` | **Create** — `GET /api/feedback?sprintId=X&category=Y`, `POST /api/feedback` |
| `src/services/feedbackService.ts` | **Create** — `getFeedback()`, `getFeedbackByLane()`, `sortByUpvotes()`, `getAuthorDisplay()` |
| `src/components/FeedbackCard.tsx` | **Create** — card: content, author, suggested improvement block, upvote button + count |
| `src/components/FeedbackColumn.tsx` | **Create** — one lane: header with count badge + scrollable list of `FeedbackCard`s, per-lane empty state |
| `src/app/feedback/page.tsx` | **Create** — three-column board layout + empty state; reads from `feedbackService` |
| `src/__tests__/feedbackService.test.ts` | **Create** — `sortByUpvotes`, `getAuthorDisplay` (anonymous vs named), API route mock tests |

---

## Epic 2.2 — Submit Feedback + Upvote

### User Story

> As a team member, I want to submit feedback and upvote others' submissions, so that the most important points rise to the top.

---

### Acceptance Criteria — Verbatim from Backlog

| AC-ID | Criterion |
|---|---|
| AC-2.2.1 | "+ Add Feedback" button opens the Submit Feedback modal |
| AC-2.2.2 | Modal has: Lane selector (3 options), Content textarea, Anonymous toggle, optional Suggestion field |
| AC-2.2.3 | Suggestion field becomes required and visible when lane = "What Slowed Us Down" (Reframe Rule) |
| AC-2.2.4 | Submit calls `feedbackService.addFeedback()` which POSTs to `/api/feedback`; modal closes on success |
| AC-2.2.5 | Upvote button increments count; a user cannot upvote their own feedback; a user cannot upvote the same item twice |
| AC-2.2.6 | Upvote count persists after page refresh (stored in MongoDB, not client state) |
| AC-UI-2.2.1 | Modal matches `docs/ui-mocks/SubmitFeedback.png` |
| AC-UI-2.2.2 | Suggestion field appears/disappears dynamically based on lane selection (no page reload) |

---

### Acceptance Criteria — Refined for Testability

| AC-ID | Testable Criterion |
|---|---|
| AC-2.2.1 | Clicking the "Submit Feedback" button (top-right of the Feedback Board page) opens the `SubmitFeedbackModal` dialog. A test simulates a click on the button and asserts that the modal's `DialogTitle` "Submit Feedback" is visible in the DOM. Pressing the `×` close button or clicking "Cancel" closes the modal and removes it from the DOM. |
| AC-2.2.2 | The `SubmitFeedbackModal` renders: (a) a `RadioGroup` with exactly 3 options labeled "🔴 What Slowed Us Down?", "💡 What Should We Try?", "✅ What Went Well?"; (b) a `Textarea` labeled "Content" with placeholder "What happened?"; (c) a `Checkbox` labeled "Submit anonymously"; (d) a conditionally-rendered `Textarea` for "Suggested Improvement". Tests assert all required elements are present on render. |
| AC-2.2.3 | **(Reframe Rule — see dedicated section below)** When the "What Slowed Us Down?" radio option is selected, the "Suggested Improvement" field is visible and its label shows the "REFRAME RULE: REQUIRED" badge. When any other lane is selected, the field is not present in the DOM. The "Submit Feedback" button is disabled until the Suggestion field is non-empty when this lane is active. |
| AC-2.2.4 | Clicking "Submit Feedback" in the modal calls `feedbackService.addFeedback()` with a payload of `{ category, content, suggestedImprovement, isAnonymous, sprintId }`. On a successful `201` response from `POST /api/feedback`, the modal closes (`showSubmitModal` becomes `false`) and the feedback board re-fetches its data. A test mocks `feedbackService.addFeedback` and asserts it is called once with the correct payload on submit, and that the modal is removed from the DOM after success. |
| AC-2.2.5 | The upvote `PATCH /api/feedback/[id]/upvote` handler: (a) adds the calling user's ID to `upvotedBy` and increments `upvotes` by 1 if the user is not in `upvotedBy` and the user is not the `authorId`; (b) returns HTTP 403 if the user attempts to upvote their own feedback (`userId === authorId`); (c) returns HTTP 409 if the user has already upvoted (`userId` is in `upvotedBy`). Unit tests cover all three scenarios with mocked DB documents. |
| AC-2.2.6 | After a successful upvote, the upvote count displayed on the card reflects the value stored in MongoDB (fetched fresh via `feedbackService.getFeedback()`), not a local React state increment. A test confirms that after a mocked successful PATCH response, the board re-fetches and the card's displayed count matches the value in the API response. |
| AC-UI-2.2.1 | *(See AC-UI rows below)* |
| AC-UI-2.2.2 | Selecting "What Slowed Us Down?" causes the "Suggested Improvement" block to appear in the modal without any page navigation or full re-render. Selecting "What Should We Try?" or "What Went Well?" causes the block to disappear. A test changes the radio selection and asserts DOM presence/absence of the suggestion textarea for each state. |

---

### UI Requirements — Submit Feedback Modal (from `docs/ui-mocks/SubmitFeedback.png` + `docs/prototypes/FeedbackBoard.tsx`)

| AC-ID | Visual / Layout Requirement |
|---|---|
| AC-UI-2.2.1 | Modal is a `Dialog` component (`sm:max-w-[520px]`), styled `border-border/50 bg-background/95 backdrop-blur-sm shadow-2xl rounded-xl` |
| AC-UI-2.2.2 | `DialogTitle`: "Submit Feedback"; `DialogDescription`: "Share your thoughts on the recent sprint." |
| AC-UI-2.2.3 | A close `×` button is present in the top-right corner of the modal (provided by the `Dialog` component's default close button) |
| AC-UI-2.2.4 | Category section label: "Category" in standard `Label` style |
| AC-UI-2.2.5 | Category radio group: three stacked options. The "What Slowed Us Down?" option has a highlighted background row (`bg-secondary/30 p-2 rounded-md border border-border/50`) when selected. The other two options have no background styling by default |
| AC-UI-2.2.6 | Radio option labels with emoji prefixes: `🔴 What Slowed Us Down?` in `text-red-500 font-medium`; `💡 What Should We Try?` in `text-blue-500 font-medium`; `✅ What Went Well?` in `text-emerald-500 font-medium` |
| AC-UI-2.2.7 | Content textarea: labeled "Content", placeholder "What happened?", styled `bg-secondary/50 border-border/50 min-h-[80px] resize-none` |
| AC-UI-2.2.8 | Suggested Improvement section (visible only when lane = "What Slowed Us Down?"): label row is a flex row with "Suggested Improvement" on the left and a red badge "REFRAME RULE: REQUIRED" on the right (`text-[10px] text-red-400 font-medium uppercase tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded`) |
| AC-UI-2.2.9 | Suggested Improvement textarea: placeholder "How could we fix or improve this?", styled `bg-secondary/50 border-red-500/40 min-h-[60px] resize-none focus-visible:ring-red-500` (red-tinted border to reinforce the required status) |
| AC-UI-2.2.10 | Anonymous toggle: a `Checkbox` followed by label "Submit anonymously" in `text-sm font-normal text-muted-foreground` |
| AC-UI-2.2.11 | Modal footer: "Cancel" button (`variant="outline" border-border/50`) on the left; "Submit Feedback" button (`bg-primary text-primary-foreground font-semibold`) on the right |
| AC-UI-2.2.12 | The modal renders on top of the blurred Feedback Board background (backdrop blur visible in `SubmitFeedback.png`) |

---

### Files to Create (Epic 2.2)

| File | Action |
|---|---|
| `src/components/SubmitFeedbackModal.tsx` | **Create** — form, lane RadioGroup, anonymous Checkbox, conditional Suggestion Textarea; ported from `docs/prototypes/FeedbackBoard.tsx` modal section |
| `src/app/api/feedback/[id]/upvote/route.ts` | **Create** — `PATCH`: increment upvote, add userId to `upvotedBy`; guard duplicate vote (409) and self-vote (403) |
| `src/services/feedbackService.ts` (additions) | **Update** — add `addFeedback()` → `POST /api/feedback`; `upvoteFeedback()` → `PATCH /api/feedback/[id]/upvote` |
| `src/__tests__/feedbackBoard.test.tsx` | **Create** — modal open/close, Reframe Rule enforcement, upvote logic, double-vote prevention, self-vote prevention |

---

## Special Business Rule: The Reframe Rule

> **AC-2.2.3 is a first-class business rule, not just a UI toggle.** It must be enforced at both the client (form validation) and server (API) level.

### Definition

The Reframe Rule mandates that any feedback item submitted under the "What Slowed Us Down?" category (`category: "slowed-us-down"`) **must** include a non-empty `suggestedImprovement` value. The intent is to prevent purely negative feedback without a constructive path forward.

### Validation Acceptance Criteria

| AC-ID | Rule | Layer | Testable Criterion |
|---|---|---|---|
| AC-RR-1 | Suggestion field is conditionally rendered | Client | When the "What Slowed Us Down?" radio is selected, the Suggestion `Textarea` and its "REFRAME RULE: REQUIRED" label badge are present in the DOM. When any other radio is selected, neither element is present. Test uses RTL `queryByPlaceholderText('How could we fix or improve this?')` to assert presence/absence. |
| AC-RR-2 | Submit button is blocked until Suggestion is filled | Client | With lane = "What Slowed Us Down?" and Suggestion textarea empty, the "Submit Feedback" button has the `disabled` attribute. Entering any non-whitespace character into the Suggestion field enables the button. A test with RTL `userEvent.type` and `expect(button).toBeDisabled()` / `toBeEnabled()` covers this. |
| AC-RR-3 | `feedbackService.addFeedback()` does not call POST if Suggestion is empty | Client | A test that calls `addFeedback({ category: 'slowed-us-down', content: '...', suggestedImprovement: '' })` asserts that `fetch` is NOT called and that the function throws or returns an error indicating the Reframe Rule violation. |
| AC-RR-4 | API route rejects `slowed-us-down` posts with empty Suggestion | Server | `POST /api/feedback` with `{ category: 'slowed-us-down', content: '...', suggestedImprovement: '' }` returns HTTP 422 with a JSON error body `{ error: 'Reframe Rule: suggestedImprovement is required for slowed-us-down feedback' }`. A Jest test with a mocked request confirms the 422 response. |
| AC-RR-5 | Suggestion field is NOT required for other lanes | Both | `POST /api/feedback` with `{ category: 'went-well', content: '...', suggestedImprovement: '' }` returns HTTP 201 (Suggestion omitted for non-blocker lanes is valid). A test confirms no 422 is returned for `went-well` or `should-try` with an empty Suggestion. |
| AC-RR-6 | "REFRAME RULE: REQUIRED" badge is visually present when Slowed Down is selected | UI | The label row for the Suggestion field shows the red badge element with text "REFRAME RULE: REQUIRED" when `category === 'slowed-us-down'`. Tested via RTL `getByText('REFRAME RULE: REQUIRED')` asserting it is in the document. |

### Type Alignment Note

The current `src/types/index.ts` `FeedbackItem` interface has the field named `suggestedImprovement: string`. Sprint 2 must use this existing field name. The `POST /api/feedback` request body and the Mongoose `FeedbackItem` model must use `suggestedImprovement` as the field key to remain consistent with the existing type definition — **do not rename it to `suggestion`** (the Sprint 1 requirements doc flagged a potential rename; Sprint 2 confirms the existing `src/types/index.ts` name `suggestedImprovement` takes precedence).

---

## Shared UI Shell Requirements (Sprint 2)

The `Shell` layout component established in Sprint 1 (`src/components/layout/Shell.tsx`) must wrap `/feedback` exactly as it wraps `/dashboard`. No modifications to `Shell.tsx` are required; this section confirms the expected shell behaviour on the Feedback Board route.

| AC-ID | Requirement |
|---|---|
| AC-UI-SHELL-FB-1 | Navigating to `/feedback` renders the full sidebar — identical structure to `/dashboard`: RetroBoard logo, sprint label "SPRINT 42", nav items (Sprint Setup, Dashboard, Feedback Board, Action Items), user identity card at bottom |
| AC-UI-SHELL-FB-2 | "Feedback Board" nav item is in the active state (amber left-accent bar, `bg-secondary` background, `text-primary` icon) when on `/feedback`; all other nav items are in the inactive state |
| AC-UI-SHELL-FB-3 | The sidebar is visible at all screen widths at which the Shell layout is designed to show it (no collapse/hamburger menu is required in Sprint 2) |
| AC-UI-SHELL-FB-4 | The user identity card at the bottom of the sidebar displays the name and pod of the currently registered user (read from `sessionStorage`) — same data source used by the Dashboard page |
| AC-UI-SHELL-FB-5 | If `sessionStorage` has no registered user, `/feedback` redirects to `/` (same guard used by `/dashboard` in Sprint 1, AC-1.3.1) |

---

## Type-Schema Alignment (Sprint 2)

Sprint 2 reads from and writes to the `FeedbackItem` type established in Sprint 1. The table below maps each form field and API field to the current `src/types/index.ts` `FeedbackItem` interface to prevent field-name mismatches.

| UI / Form Field | `FeedbackItem` Field | Type | Notes |
|---|---|---|---|
| Lane selector (radio) | `category` | `FeedbackCategory` = `"slowed-us-down" \| "should-try" \| "went-well"` | Radio value must be the exact `FeedbackCategory` string, not a display label |
| Content textarea | `content` | `string` | Required for all lanes |
| Suggested Improvement textarea | `suggestedImprovement` | `string` | Required when `category === "slowed-us-down"` (Reframe Rule); optional otherwise |
| Anonymous checkbox | `isAnonymous` | `boolean` | When `true`, `getAuthorDisplay()` must return `"Anonymous"` instead of the user's name |
| *(system-set)* | `authorId` | `string` | Set server-side from the authenticated user's session; never sent from the client form |
| *(system-set)* | `sprintId` | `string` | Set from the active sprint ID; never sent from the client form |
| Upvote button click | `upvotes` | `string[]` — array of user IDs who upvoted | Used for both count display (`upvotes.length`) and duplicate-vote guard (`upvotes.includes(userId)`) |
| *(derived)* | `actionItemId?` | `string \| undefined` | Optional; set when feedback is converted to an Action Item (future sprint) |
| *(system-set)* | `createdAt` | `string` | ISO timestamp; set server-side |

> **Key constraint**: The `FeedbackCategory` type in `src/types/index.ts` uses kebab-case values (`"slowed-us-down"`, `"should-try"`, `"went-well"`). The radio button `value` attributes in `SubmitFeedbackModal.tsx` **must** match these exact strings. Do not use the display labels (e.g. `"slowed"`, `"try"`, `"well"`) as the submitted category value.

---

## Dependency Map

### Epic 2.1 Dependencies (Builds on Sprint 1)

| Dependency | Sprint 1 File | Usage in Sprint 2 |
|---|---|---|
| `FeedbackItem` TypeScript type | `src/types/index.ts` | Read by `feedbackService`, `FeedbackCard`, `FeedbackColumn`, page component |
| `FeedbackCategory` type + `CATEGORY_CONFIG` | `src/types/index.ts` | Used by `FeedbackColumn` for column headers and color config |
| MongoDB `FeedbackItem` model | `src/lib/models/FeedbackItem.ts` | Queried by `GET /api/feedback` route |
| `connectDB()` singleton | `src/lib/db.ts` | Called by `src/app/api/feedback/route.ts` before all DB operations |
| Sprint API route | `src/app/api/sprints/route.ts` | `feedbackService` fetches active `sprintId` to scope feedback queries |
| Shell layout component | `src/components/layout/Shell.tsx` | Wraps `src/app/feedback/page.tsx` |
| Session user | `sessionStorage` → `retroboard_user` | Feedback board reads current user to display user identity card; guard for unauthenticated access |
| shadcn/ui `Button` | `@/components/ui/button` | "Submit Feedback" CTA, upvote button |

### Epic 2.2 Dependencies (Builds on Sprint 1 + Epic 2.1)

| Dependency | File | Usage in Sprint 2 |
|---|---|---|
| `FeedbackItem` TypeScript type | `src/types/index.ts` | `addFeedback()` payload shape; upvote response shape |
| `FeedbackCategory` type | `src/types/index.ts` | Radio group values; Reframe Rule condition check |
| Feedback API route (`POST`) | `src/app/api/feedback/route.ts` (created in Epic 2.1) | `feedbackService.addFeedback()` POSTs here |
| MongoDB `FeedbackItem` model | `src/lib/models/FeedbackItem.ts` | `POST /api/feedback` saves new documents; `PATCH /api/feedback/[id]/upvote` updates `upvotes` array |
| `connectDB()` singleton | `src/lib/db.ts` | Called by `POST` and `PATCH` handlers |
| `feedbackService.ts` (Epic 2.1 base) | `src/services/feedbackService.ts` | `addFeedback()` and `upvoteFeedback()` are added to this service in Epic 2.2 |
| Feedback page component | `src/app/feedback/page.tsx` (created in Epic 2.1) | Hosts `SubmitFeedbackModal` open state; triggers re-fetch after successful submit |
| shadcn/ui `Dialog`, `Textarea`, `RadioGroup`, `Checkbox` | `@/components/ui/` | Modal structure and form controls |
| Session user ID | `sessionStorage` → `retroboard_user.id` | Passed as `userId` in upvote request; compared against `authorId` for self-vote guard |
| Prototype reference | `docs/prototypes/FeedbackBoard.tsx` | Read-only — modal JSX is ported to `SubmitFeedbackModal.tsx` |
| UI mock references | `docs/ui-mocks/SubmitFeedback.png` | Read-only — visual spec for modal layout |

---

## Definition of Done

The following checklist must be fully satisfied for Sprint 2 to be considered complete.

| # | Criterion |
|---|---|
| 1 | All AC-2.1.x acceptance criteria pass |
| 2 | All AC-2.2.x acceptance criteria pass |
| 3 | All AC-RR-x (Reframe Rule) acceptance criteria pass |
| 4 | All AC-UI-SHELL-FB-x acceptance criteria pass |
| 5 | All 18 REVIEWER checklist points pass |
| 6 | `corepack yarn build` — 0 errors |
| 7 | `corepack yarn test` — 0 failures |
| 8 | Can submit feedback in all 3 lanes (verified in browser with live MongoDB) |
| 9 | Reframe Rule enforced: "What Slowed Us Down?" cannot be submitted without a Suggestion (both client and server) |
| 10 | Upvote count persists in MongoDB after page refresh |
| 11 | Double-vote prevented: upvoting the same item twice returns 409 and count does not increment |
| 12 | Self-vote prevented: upvoting own feedback returns 403 and count does not increment |
| 13 | Anonymous feedback displays author as "Anonymous" in the card; actual `authorId` is not exposed to other clients |
| 14 | Empty state renders correctly in all three lanes when no feedback exists |
| 15 | `git commit -m "Sprint 2 complete: Feedback Board"` committed |

---

## Prototype-to-Backlog Delta Summary

| Delta | Prototype (`FeedbackBoard.tsx`) | Backlog (`Sprint2.md`) | Resolution |
|---|---|---|---|
| CTA button label | Prototype uses "Submit Feedback" (with `Plus` icon) | Backlog AC-2.2.1 says `"+ Add Feedback"` button | **Mock wins** — `SubmitFeedback.png` and prototype both use "Submit Feedback"; implement as "Submit Feedback" matching the mock |
| Suggestion field visibility | Prototype renders Suggestion field unconditionally (always visible in the static mock) | Backlog AC-2.2.2/AC-2.2.3 and `SubmitFeedback.png` show it conditionally (visible only for Slowed Down) | **Backlog + mock win** — implement conditional show/hide |
| `suggestedImprovement` vs `suggestion` | `src/types/index.ts` uses `suggestedImprovement` | Sprint 1 FEATURE_REQUIREMENTS.md proposed renaming to `suggestion` | **Type file wins** — use `suggestedImprovement` as defined in `src/types/index.ts`; do not rename |
| `upvotes` field type | `src/types/index.ts` defines `upvotes: string[]` (array of user IDs) | Backlog references "upvote count" as a number | **Type file wins** — use `upvotes.length` for display count; `upvotes` array for dedup guard; no schema change needed |
| `Convert to Action Item` button | Prototype shows a hover-revealed "Action →" button on high-voted cards | Backlog Sprint 2 does not include Convert-to-Action functionality | **Out of scope for Sprint 2** — omit the Convert button; it belongs to Sprint 3 |

---

## Sprint 2 Session 2 Amendments

**Triggered by**: Session 1 completion audit — `retro-dev/src/types/index.ts` and `retro-dev/src/lib/models/FeedbackItem.ts` confirmed live field names differ from those used in the original requirements document above.  
**Rule**: All amendments are additive clarifications only. No original AC text is deleted. Where an AC above references a stale field name, the amendment below supersedes it for implementation purposes.

---

### Amendment A1 — Field name: `suggestion` replaces `suggestedImprovement` everywhere

**Affects**: AC-2.2.4 (refined), AC-RR-3, AC-RR-4, AC-RR-5, Reframe Rule Definition, Type Alignment Note, Type-Schema Alignment table row.

**Root cause**: The original `FEATURE_REQUIREMENTS.md` (§Type Alignment Note) stated `suggestedImprovement` takes precedence over `suggestion`. However, `retro-dev/src/types/index.ts` (as implemented in Sprint 1, Session 1) uses `suggestion: string`, and `retro-dev/src/lib/models/FeedbackItem.ts` uses `suggestion` as the Mongoose field name. The live code is the authoritative source.

**Correction**:

| Location in this document | Original text | Corrected text |
|---|---|---|
| AC-2.2.4 (refined) | `payload of { category, content, suggestedImprovement, isAnonymous, sprintId }` | `payload of { category, content, suggestion, isAnonymous, sprintId }` |
| AC-RR-3 | `addFeedback({ category: 'slowed-us-down', content: '...', suggestedImprovement: '' })` | `addFeedback({ category: 'slowed-us-down', content: '...', suggestion: '' })` |
| AC-RR-4 | `{ error: 'Reframe Rule: suggestedImprovement is required for slowed-us-down feedback' }` | `{ error: 'Reframe Rule: suggestion is required for slowed-us-down feedback' }` |
| AC-RR-5 | `{ category: 'went-well', content: '...', suggestedImprovement: '' }` | `{ category: 'went-well', content: '...', suggestion: '' }` |
| Reframe Rule Definition | `must include a non-empty \`suggestedImprovement\` value` | `must include a non-empty \`suggestion\` value` |
| Type Alignment Note | entire note states `suggestedImprovement` takes precedence | **Superseded** — `suggestion` is the canonical field name as confirmed by the live `src/types/index.ts` |
| Type-Schema Alignment table | `suggestedImprovement` row | `suggestion` row (see Amendment A3 below) |

---

### Amendment A2 — `upvotes` field: `number` (not `string[]`); `upvotedBy: string[]` is the dedup array

**Affects**: AC-2.2.5 (refined), Type-Schema Alignment table row for "Upvote button click".

**Root cause**: The original Type-Schema Alignment table described `upvotes` as `string[]` (array of user IDs who upvoted). The live `src/types/index.ts` defines two separate fields: `upvotes: number` (display count, stored in MongoDB) and `upvotedBy: string[]` (array of user IDs for deduplication).

**Correction**:

| Location | Original text | Corrected text |
|---|---|---|
| AC-2.2.5 (refined) | `adds the calling user's ID to \`upvotedBy\` and increments \`upvotes\` by 1 if the user is not in \`upvotedBy\`` | No change — this AC already uses the correct split-field model ✅ |
| Type-Schema Alignment table row "Upvote button click" | `upvotes \| string[] — array of user IDs who upvoted \| Used for both count display (upvotes.length) and duplicate-vote guard (upvotes.includes(userId))` | `upvotes \| number — integer count stored in MongoDB \| Used for display: render \`item.upvotes\` directly (do not use \`upvotedBy.length\`). Duplicate-vote guard uses \`upvotedBy: string[]\` (separate field). |

---

### Amendment A3 — Corrected Type-Schema Alignment table (Session 2 canonical reference)

The following table supersedes the "Type-Schema Alignment (Sprint 2)" section above for all Session 2 implementation work. Field names match the live `retro-dev/src/types/index.ts` exactly.

| UI / Form Field | `FeedbackItem` Field | Type | Notes |
|---|---|---|---|
| Lane selector (radio) | `category` | `FeedbackCategory` = `"slowed-us-down" \| "should-try" \| "went-well"` | Radio `value` must be the exact kebab-case string |
| Content textarea | `content` | `string` | Required for all lanes |
| Suggested Improvement textarea | `suggestion` | `string` | Required (non-empty) when `category === "slowed-us-down"` (Reframe Rule); optional otherwise |
| Anonymous checkbox | `isAnonymous` | `boolean` | When `true`, `getAuthorDisplay()` returns `"Anonymous"` |
| *(system-set)* | `authorId` | `string` | Set server-side; never sent from the client form |
| *(system-set)* | `sprintId` | `string` | Set from active sprint `_id`; never sent from the client form |
| Upvote count display | `upvotes` | `number` | Integer — render directly as `{item.upvotes}`; do NOT use `upvotedBy.length` |
| Duplicate-vote guard | `upvotedBy` | `string[]` | Array of user `_id` strings who have upvoted; checked server-side in PATCH handler |
| *(derived)* | `actionItemId?` | `string \| undefined` | Optional; set when feedback is converted to an Action Item (Sprint 3) |
| *(system-set)* | `createdAt` | `string` | ISO timestamp; set server-side |
| Primary key | `_id` | `string` | MongoDB ObjectId as string — use `item._id` (not `item.id`) |

> **Field-name invariant for Session 2**: Every reference to the suggested-improvement field in `SubmitFeedbackModal.tsx`, `feedbackService.ts` additions, `src/app/api/feedback/[id]/upvote/route.ts`, and `feedbackBoard.test.tsx` must use `suggestion`. Any reference to `suggestedImprovement` will cause a TypeScript compile error.

---

### Amendment A4 — `handleUpvote` stub signature confirmed

The Session 1 `page.tsx` stub is `function handleUpvote(_itemId: string) {}` (prefixed underscore marks intentional no-op). Session 2 replaces this body — the parameter name becomes `itemId` (no underscore) in the wired version. This is consistent with the Session 2 plan task "Wire upvote button in `FeedbackCard.tsx`".

No AC text change required — this is a forward-reference confirmation only.

---

### Amendment A5 — `modal-stub` removal confirmed in scope for Session 2

The Session 1 `page.tsx` renders `{showModal && <div data-testid="modal-stub" />}` as the modal placeholder. Session 2's first page-level task explicitly removes this line and replaces it with `<SubmitFeedbackModal .../>`. The `showModal` / `setShowModal` state variable names are preserved as-is — no rename needed.

No AC text change required — this is a structural confirmation only.

---

---

# Feature Requirements — Sprint 3: Action Items

**Mode**: [PRODUCT]  
**Sprint**: 3 — Action Items: Create, Lifecycle, Convert from Feedback, Verify Impact  
**References**: `teams-retro/docs/Sprint3.md`, `docs/ui-mocks/ActionItems.png`, `docs/ui-mocks/action-items-empty.png`, `docs/ui-mocks/NewActionItemModal.png`, `docs/ui-mocks/ConvertActionItem.png`, `docs/ui-mocks/VerifyImpact.png`  
**Date**: April 2026  
**Rule**: Sprint 1 and Sprint 2 sections above are read-only. Append only.

---

## Table of Contents (Sprint 3)

1. [Sprint Goal](#sprint-3-sprint-goal)
2. [Epic 3.1 — Action Items List + Create](#epic-31--action-items-list--create)
3. [Epic 3.2 — Convert Feedback to Action + Verify Impact](#epic-32--convert-feedback-to-action--verify-impact)
4. [UI Requirements (Sprint 3)](#ui-requirements-sprint-3)
5. [Business Rule: Impact Verification Gate](#business-rule-impact-verification-gate)
6. [Type-Schema Alignment (Sprint 3)](#type-schema-alignment-sprint-3)
7. [Dependency Map (Sprint 3)](#dependency-map-sprint-3)
8. [Prototype-to-Backlog Delta Summary (Sprint 3)](#prototype-to-backlog-delta-summary-sprint-3)
9. [Definition of Done (Sprint 3)](#definition-of-done-sprint-3)

---

## Sprint 3 Sprint Goal

A team member can create action items (from the Action Items page or by converting a "What Should We Try?" feedback card), assign an owner, and advance the item through its full lifecycle: **Open → In Progress → Completed → Verified**. When an item reaches Completed, a facilitator can enter a non-empty impact statement to transition it to Verified, formally closing the feedback loop.

---

## Epic 3.1 — Action Items List + Create

**User Story**: As a team member, I want to see all action items for the current sprint and create new ones directly from the Action Items page, so that any improvement idea can be tracked regardless of whether it originated from feedback.

---

### Refined Acceptance Criteria

#### AC-3.1.1 — Action Items page renders at `/actions`

The route `/actions` renders the Action Items page wrapped in `<Shell>`. The page title reads **"Action Items"** and the subtitle reads **"Track improvements generated from sprint feedback."** If no session user is present (`getCurrentUser()` returns `null`), the page redirects to `/` via `router.push('/')`.

#### AC-3.1.2 — Lists all action items for the active sprint

On mount, the page calls `actionService.getActions(sprintId)` → `GET /api/actions?sprintId=<id>`. Each returned `ActionItem` is rendered as an `ActionItemCard` displaying:
- Status badge (exact text: `"Open"`, `"In Progress"`, `"Completed"`, or `"Verified"`)
- Due date label: `"Due Today"` when `dueDate` equals today's date; `"Due This Sprint"` otherwise
- Owner avatar (initials, single character, uppercased) and owner name
- Title (bold, large text)
- Description paragraph
- `"SOURCE FEEDBACK"` section with the `sourceQuote` in italic text — rendered **only** when `sourceFeedbackId` is non-null and `sourceQuote` is non-empty
- `"Advance Status"` button — rendered when `status` is `"open"` or `"in-progress"`
- `"Verify Impact"` button — rendered when `status` is `"completed"`
- No action button when `status` is `"verified"`

#### AC-3.1.3 — Items sorted by status: Open → In Progress → Completed → Verified

`actionService.getActionsByStatus(items)` returns items grouped in the order: `"open"` first, then `"in-progress"`, then `"completed"`, then `"verified"`. Within each group, items are ordered by `createdAt` ascending (oldest first). The status summary bar shows live counts per group: **"Open N"**, **"In Progress N"**, **"Completed N"**, **"Verified N"**.

#### AC-3.1.4 — "+ New Action Item" button opens the New Action Item modal

A `"+ New Action Item"` button is visible in the page header at all times (even in the empty state). Clicking it opens `<NewActionItemModal>`. The page manages `showNewModal: boolean` state.

#### AC-3.1.5 — New Action Item modal fields and validation

`<NewActionItemModal>` renders:
- `data-testid="new-action-modal"` on the modal container
- **Title** text input — `placeholder="e.g. Add automated test coverage"` — required; submit disabled when empty
- **Description** textarea — `placeholder="What needs to be done and why?"` — optional
- **Owner** `<select>` — `placeholder` option text `"Select owner"` — populated with all registered users fetched from `GET /api/users`; required; submit disabled when no owner selected
- **Due Date** `<input type="date">` — optional
- **Cancel** button closes modal without saving
- **"Create Action Item"** submit button — `data-testid="new-action-submit-btn"` — disabled when title is empty or no owner is selected or `isSubmitting` is true

#### AC-3.1.6 — Creating an action item from the modal

On submit, `NewActionItemModal` calls `actionService.createAction(payload)` → `POST /api/actions` with body:

```json
{
  "title": "<string>",
  "description": "<string>",
  "ownerId": "<userId string>",
  "dueDate": "<ISO string | ''>",
  "sourceFeedbackId": null,
  "sourceQuote": "",
  "sprintId": "<active sprint _id>"
}
```

On success (HTTP 201), the modal closes and the page re-fetches all action items. On failure, the modal remains open (the error does not need to surface in the UI for Sprint 3).

#### AC-3.1.7 — Empty state when no action items exist

When `getActions()` returns an empty array, the page renders the empty state:
- Icon: clipboard/checklist icon
- Heading: **"No action items yet."**
- Body text: **"Convert feedback from the Feedback Board, or add one directly."**
- Two CTAs:
  - `"Go to Feedback Board"` — navigates to `/feedback`
  - `"+ New Action Item"` — opens `<NewActionItemModal>` (same as the header button)
- The status summary bar still renders with all-zero counts

---

## Epic 3.2 — Convert Feedback to Action + Verify Impact

**User Story**: As a facilitator, I want to convert a "What Should We Try?" feedback card into a tracked action item, and later verify the real-world impact with a written statement, so that the feedback loop is formally closed.

---

### Refined Acceptance Criteria

#### AC-3.2.1 — "Convert to Action" button on "should-try" cards only

A `"Convert to Action"` button is added to `FeedbackCard` and rendered **only** when `item.category === 'should-try'`. The button is not rendered for `"slowed-us-down"` or `"went-well"` cards. The `FeedbackCard` component receives a new optional prop `onConvert?: (item: FeedbackItem) => void`. When `onConvert` is undefined or the category is not `"should-try"`, the button is hidden.

#### AC-3.2.2 — Convert modal pre-fills from feedback item

Clicking "Convert to Action" opens `<ConvertActionModal>` with:
- `data-testid="convert-action-modal"` on the modal container
- Source quote blockquote showing `item.content` (the feedback content) in italic text, with a left blue border
- **Title** text input — `placeholder="e.g. Add automated test coverage"` — pre-filled with `item.content`; editable; required
- **Description** textarea — `placeholder="Details on how to implement this..."` — empty; optional
- **Assigned To** `<select>` — populated with all registered users; required
- **Due Date** `<input type="date">` — optional
- **Cancel** button closes modal
- **"Create Action Item"** submit button — `data-testid="convert-action-submit-btn"` — disabled when title is empty or no owner selected or `isSubmitting` is true

On submit, calls `actionService.createAction(payload)` → `POST /api/actions` with:

```json
{
  "title": "<edited or original content>",
  "description": "<string>",
  "ownerId": "<userId string>",
  "dueDate": "<ISO string | ''>",
  "sourceFeedbackId": "<item._id>",
  "sourceQuote": "<item.content>",
  "sprintId": "<active sprint _id>"
}
```

On success (HTTP 201), the modal closes and the page re-fetches. The created `ActionItem` is linked to the feedback card via `sourceFeedbackId`.

#### AC-3.2.3 — "Advance Status" button advances lifecycle

`"Advance Status"` button on `ActionItemCard` calls `actionService.advanceStatus(itemId)` → `PATCH /api/actions/[id]/advance`. The status transitions are:

| Current Status | After Advance |
|---|---|
| `"open"` | `"in-progress"` |
| `"in-progress"` | `"completed"` |
| `"completed"` | — (button not rendered; "Verify Impact" appears instead) |
| `"verified"` | — (no button rendered) |

After a successful PATCH, the page re-fetches all action items. The API returns the updated `ActionItem` as JSON with the new `status` field.

#### AC-3.2.4 — "Verify Impact" button appears when status is Completed

When `status === "completed"`, the `ActionItemCard` renders a `"Verify Impact"` button instead of `"Advance Status"`. Clicking it opens `<VerifyImpactModal>` with the action item passed as a prop.

#### AC-3.2.5 — Verify Impact modal requires non-empty impact statement

`<VerifyImpactModal>` renders:
- `data-testid="verify-impact-modal"` on the modal container
- Source quote blockquote showing `item.sourceQuote` in italic with a left orange border — rendered only when `item.sourceQuote` is non-empty
- **Impact Statement** label and textarea — `placeholder="e.g. Deployments now take 5 minutes instead of 45…"` — character counter shown as `"0 / 300"`, updating live; max 300 characters
- **Cancel** button closes modal
- **"Confirm Verified"** submit button — `data-testid="verify-impact-submit-btn"` — disabled when impact statement is empty (after trim) or exceeds 300 characters or `isSubmitting` is true

#### AC-3.2.6 — Verification persists status = "verified" and impact note

On submit, `<VerifyImpactModal>` calls `actionService.verifyImpact(itemId, impactNote)` → `PATCH /api/actions/[id]/verify` with body `{ "impactNote": "<string>" }`.

The API:
- Returns HTTP 400 if `impactNote` is missing or empty after trim
- Returns HTTP 404 if the action item is not found
- Returns HTTP 409 if current `status !== "completed"` (can only verify a completed item)
- On success: sets `status = "verified"`, sets `impactNote`, sets `completedAt` to current timestamp, saves, returns the updated `ActionItem` as HTTP 200

After a successful PATCH, the modal closes, the page re-fetches, and the card now displays:
- `"Verified"` status badge
- The `impactNote` text visible on the card under the source quote section
- No action buttons

---

## UI Requirements (Sprint 3)

### AC-UI-3.1 — Action Items page layout

| AC-ID | Requirement |
|---|---|
| AC-UI-3.1.1 | Page header: "Action Items" h1 + subtitle "Track improvements generated from sprint feedback." |
| AC-UI-3.1.2 | `"+ New Action Item"` button aligned to top-right of page header |
| AC-UI-3.1.3 | Status summary bar below header: four pill badges — Open (grey dot), In Progress (blue dot), Completed (amber dot), Verified (green dot) — each showing live count |
| AC-UI-3.1.4 | Cards stacked vertically in a single-column list below the status bar |
| AC-UI-3.1.5 | Status badge on each card uses the exact text strings: `"Open"`, `"In Progress"`, `"Completed"`, `"Verified"` |
| AC-UI-3.1.6 | Empty state: clipboard icon, heading `"No action items yet."`, body text, two CTA buttons side-by-side |
| AC-UI-3.1.7 | Shell sidebar shows "Action Items" nav item as active at `/actions` |

### AC-UI-3.2 — New Action Item modal

| AC-ID | Requirement |
|---|---|
| AC-UI-3.2.1 | Modal title: **"New Action Item"** |
| AC-UI-3.2.2 | Fields in order: Title (text input, amber focus ring), Description (textarea), Owner (select), Due Date (date input), Source optional (text input — optional, not in Sprint 3 create flow) |
| AC-UI-3.2.3 | Submit button text: **"Create Action Item"** |
| AC-UI-3.2.4 | Cancel button text: **"Cancel"** |

### AC-UI-3.3 — Convert to Action modal

| AC-ID | Requirement |
|---|---|
| AC-UI-3.3.1 | Modal title: **"Convert to Action Item"** |
| AC-UI-3.3.2 | Subtitle: **"Create an action item from this high-voted feedback."** |
| AC-UI-3.3.3 | Source quote rendered as blockquote with left blue border, italic text |
| AC-UI-3.3.4 | Fields: Title (pre-filled, amber focus ring), Description (empty, placeholder "Details on how to implement this..."), Assigned To (select), Due Date |
| AC-UI-3.3.5 | Submit button text: **"Create Action Item"** (amber/orange background) |

### AC-UI-3.4 — Verify Impact modal

| AC-ID | Requirement |
|---|---|
| AC-UI-3.4.1 | Modal title: **"Verify Impact"** |
| AC-UI-3.4.2 | Subtitle: **"Describe how this action item made a real difference for the team."** |
| AC-UI-3.4.3 | Source quote rendered as blockquote with left orange border, italic text — shown only when `sourceQuote` non-empty |
| AC-UI-3.4.4 | Impact Statement textarea with character counter `"0 / 300"` updating live |
| AC-UI-3.4.5 | Submit button text: **"Confirm Verified"** (amber/orange background) |
| AC-UI-3.4.6 | Submit button disabled until impact statement is non-empty and ≤ 300 characters |

---

## Business Rule: Impact Verification Gate

**Name**: Verification Gate  
**Scope**: Status `"completed"` → `"verified"` transition only

| Layer | Enforcement |
|---|---|
| **Client** (`VerifyImpactModal`) | Submit button disabled when `impactNote.trim() === ''` or `impactNote.length > 300` |
| **Service** (`actionService.verifyImpact`) | Throws before calling `fetch` if `impactNote.trim() === ''` |
| **API** (`PATCH /api/actions/[id]/verify`) | Returns HTTP 400 if `impactNote` empty after trim; HTTP 409 if `status !== 'completed'` |

This mirrors the Sprint 2 Reframe Rule three-layer enforcement pattern.

---

## Type-Schema Alignment (Sprint 3)

All Sprint 3 fields are **already defined** in `retro-dev/src/types/index.ts`. No new types need to be added.

| Field | `ActionItem` field | Type | Notes |
|---|---|---|---|
| Title input | `title` | `string` | Required; non-empty |
| Description textarea | `description` | `string` | Optional |
| Owner selector | `ownerId` | `string` | User `_id` from `GET /api/users` |
| Due date input | `dueDate` | `string` | ISO date string or empty string |
| Source feedback link | `sourceFeedbackId` | `string` | Feedback `_id`; empty string `""` when created directly (not `null`) — see Delta D2 |
| Source quote display | `sourceQuote` | `string` | `item.content` copied at conversion time; empty string when created directly |
| Status badge | `status` | `"open" \| "in-progress" \| "completed" \| "verified"` | Kebab-case values — exact strings used in all comparisons |
| Impact statement | `impactNote` | `string \| undefined` | Set by `PATCH /api/actions/[id]/verify`; displayed on verified cards |
| Completion timestamp | `completedAt` | `string \| undefined` | Set server-side at verification time |
| Primary key | `_id` | `string` | Use `item._id` (not `item.id`) |

> **Type invariant for Sprint 3**: `status` values are kebab-case strings (`"in-progress"` not `"inProgress"`, `"open"` not `"Open"`). Status badge display text is the formatted version — see AC-UI-3.1.5 for exact display strings.

### New field on `FeedbackItem` already present

`FeedbackItem.actionItemId?: string` is defined in `src/types/index.ts`. Sprint 3 does not need to add it. The `PATCH /api/actions/[id]/advance` and `/verify` routes do not need to update `FeedbackItem.actionItemId` — that linkage is tracked via `ActionItem.sourceFeedbackId` instead.

---

## Dependency Map (Sprint 3)

### Sprint 1 files consumed (read-only)

| File | Role in Sprint 3 |
|---|---|
| `src/lib/db.ts` | `connectDB()` called in all new API route handlers |
| `src/lib/models/User.ts` | `User.find().lean()` in `GET /api/users` (if not already returning full list) and in `NewActionItemModal` / `ConvertActionModal` owner dropdowns |
| `src/lib/models/ActionItem.ts` | Primary Mongoose model for all Sprint 3 CRUD |
| `src/services/userService.ts` | `getCurrentUser()` — session guard in `actions/page.tsx` |
| `src/app/api/users/route.ts` | `GET /api/users` — populates owner dropdowns |
| `src/components/layout/Shell.tsx` | Wraps `actions/page.tsx`; receives `sprintName` prop |
| `src/app/api/sprints/route.ts` | Sprint resolution on mount (same pattern as `feedback/page.tsx`) |

### Sprint 2 files consumed (read-only)

| File | Role in Sprint 3 |
|---|---|
| `src/components/FeedbackCard.tsx` | Receives new optional `onConvert` prop; Sprint 3 adds the "Convert to Action" button |
| `src/components/FeedbackColumn.tsx` | Receives new optional `onConvert` prop; forwards to `FeedbackCard` |
| `src/app/feedback/page.tsx` | Receives new optional `onConvert` handler; wires `<ConvertActionModal>` |
| `src/services/feedbackService.ts` | Read-only in Sprint 3 |
| `src/app/api/feedback/route.ts` | Read-only in Sprint 3 |

### New files created in Sprint 3

| File | Purpose |
|---|---|
| `src/app/api/actions/route.ts` | GET (by sprintId) + POST (create action item) |
| `src/app/api/actions/[id]/advance/route.ts` | PATCH — advance status one step |
| `src/app/api/actions/[id]/verify/route.ts` | PATCH — set status=verified, save impactNote |
| `src/services/actionService.ts` | Client-side service: `createAction`, `getActions`, `getActionsByStatus`, `advanceStatus`, `verifyImpact`, `getCompletionRate` |
| `src/components/ActionItemCard.tsx` | Renders a single action item card with status badge, owner, dates, source quote, action buttons |
| `src/components/NewActionItemModal.tsx` | Plain HTML modal: Title + Description + Owner selector + Due Date |
| `src/components/ConvertActionModal.tsx` | Plain HTML modal: pre-filled title from feedback, source quote display, owner selector, due date |
| `src/components/VerifyImpactModal.tsx` | Plain HTML modal: source quote display, impact statement textarea with char counter |
| `src/app/actions/page.tsx` | Action Items page: session guard, sprint resolution, status bar, card list, empty state, modal wiring |
| `src/__tests__/actionService.test.ts` | Unit + API route tests: createAction, advanceStatus lifecycle, verifyImpact, getCompletionRate |
| `src/__tests__/actionItems.test.tsx` | Component/integration tests: convert flow, advance status sequence, verify impact, empty state |

---

## Prototype-to-Backlog Delta Summary (Sprint 3)

| Delta ID | Prototype / Mock | Backlog (`Sprint3.md`) | Resolution |
|---|---|---|---|
| D1 | `NewActionItemModal.png` — modal has a "Source (optional)" text input field below Due Date | `Sprint3.md` AC-3.1.5 does not list "Source" as a modal field | **Prototype wins for direct-create**: include the "Source (optional)" field as a plain text input with placeholder `"Link to feedback item (optional)"`. It is a UI-only field not wired to `sourceFeedbackId`; value is ignored when `sourceFeedbackId` is null. |
| D2 | `types/index.ts` — `sourceFeedbackId: string` (not nullable) | Backlog says "`sourceFeedbackId` is null" when created directly | **Type wins**: use empty string `""` for direct creates since `sourceFeedbackId` is typed as `string` (not `string \| null`). The SOURCE FEEDBACK section is hidden when `sourceFeedbackId === ""`. |
| D3 | `ConvertActionItem.png` — submit button has amber/orange background ("Create Action Item") | Backlog AC-3.2.2 just says "submit" | **Mock wins**: use amber/orange background for submit button in `ConvertActionModal` and `VerifyImpactModal`, matching the mock color. Standard primary (blue) for `NewActionItemModal`. |
| D4 | `VerifyImpact.png` — shows `sourceQuote` blockquote with orange left border | Backlog AC-3.2.5 doesn't specify border color | **Mock wins**: use amber/orange left border for `VerifyImpactModal` source quote (distinct from `ConvertActionModal`'s blue left border). |
| D5 | `Sprint3.md` references `docs/ui-mocks/new-action-item-modal.png` | Actual file is `docs/ui-mocks/NewActionItemModal.png` | **Actual filename wins**: `NewActionItemModal.png` (PascalCase) is the canonical reference. |
| D6 | `ActionItems.png` — due date label shows "Due This Sprint" or "Due Today" | Backlog AC-3.1.2 says just "due date" | **Mock wins**: implement the two-label pattern: `"Due Today"` when dueDate is today, `"Due This Sprint"` otherwise (when dueDate is non-empty). |
| D7 | Status advance: `ActionItems.png` shows "Advance Status" button; no separate "Complete" button | Backlog AC-3.2.3 shows same pattern | **Consistent**: `"Advance Status"` is the single button label for both `open→in-progress` and `in-progress→completed` transitions. |

---

## Definition of Done (Sprint 3)

- [ ] All AC-3.1.x and AC-3.2.x acceptance criteria pass
- [ ] `corepack yarn build` — 0 errors
- [ ] `corepack yarn test` — 0 failures (Sprint 1 + 2 regressions: 0)
- [ ] Full lifecycle verified: `"open"` → `"in-progress"` → `"completed"` → `"verified"`
- [ ] Direct create: `sourceFeedbackId === ""`, `sourceQuote === ""`, SOURCE FEEDBACK section hidden
- [ ] Convert from feedback: `sourceFeedbackId === item._id`, `sourceQuote === item.content`, SOURCE FEEDBACK section visible
- [ ] Verify Impact gate enforced at client + service + API layers
- [ ] Impact statement max 300 characters enforced client-side (disabled button) and server-side (400 response)
- [ ] `"Convert to Action"` button visible only on `should-try` cards, hidden on other lanes
- [ ] Committed: `git commit -m "Sprint 3 complete: Action Items"`

---

## Sprint 3 Session 2 — [PRODUCT] Review

**Mode**: [PRODUCT]  
**Date**: April 2026  
**Scope**: Epic 3.2 only — Convert from Feedback + Verify Impact  
**Session 1 deviation source**: `retro-dev/docs/IMPLEMENTATION_NOTES.md` §Sprint 3 Session 1

---

### AC Verdict Table

| AC-ID | Criterion | Verdict | Notes |
|---|---|---|---|
| AC-3.2.1 | "Convert to Action" button on `should-try` cards only | ✅ CLEAR | Guard condition is `item.category === 'should-try' && onConvert !== undefined` — both conditions required. Button text `"Convert to Action"` confirmed exact. `data-testid="convert-btn"` specified for RTL targeting. |
| AC-3.2.2 | Convert modal pre-fills title from feedback content; sets `sourceFeedbackId` and `sourceQuote` | ✅ CLEAR | `sourceFeedbackId: item._id` (not `null`, not empty), `sourceQuote: item.content` — these are the exact field values set in the POST payload. Title input is pre-filled with `item.content` and is editable. `data-testid="convert-action-modal"` and `data-testid="convert-action-submit-btn"` confirmed. |
| AC-3.2.3 | Advance Status: open→in-progress→completed; 409 on completed/verified | ✅ CLEAR | `ADVANCE_MAP` in live `advance/route.ts` is `{ 'open': 'in-progress', 'in-progress': 'completed' }`. Items with `status === 'completed'` or `status === 'verified'` both return 409 (confirmed in live code: `ADVANCE_MAP[item.status]` is `undefined` for both, triggering the 409 branch). No ambiguity. |
| AC-3.2.4 | "Verify Impact" button when status = Completed | ✅ CLEAR | `ActionItemCard` renders `data-testid="verify-btn"` when `item.status === 'completed'`. Button is absent for all other statuses. Clicking calls `onVerify(item)` which sets `verifyTarget` and opens the modal. |
| AC-3.2.5 | Verify Impact modal: non-empty, ≤300 chars; submit disabled otherwise | ✅ CLEAR | Three-layer gate: client (button `disabled`), service (`verifyImpact` throws), API (400). The `maxLength={300}` attribute on the textarea provides a hard cap — but `submitDisabled` also checks `impactNote.length > 300` independently (defence in depth). Both empty and whitespace-only inputs must be blocked. |
| AC-3.2.6 | After verify: status=verified, impactNote on card, persisted in MongoDB | ✅ CLEAR | Live `verify/route.ts` sets `item.status = 'verified'`, `item.impactNote = impactNote.trim()`, calls `item.save()`, returns 200. `completedAt` is set server-side. Card must display: "Verified" badge, `impactNote` text, no action buttons. |

---

### Session 1 Deviation Impact on Session 2 ACs

| Deviation (from IMPLEMENTATION_NOTES.md §Sprint 3 Session 1) | Affected AC | Impact |
|---|---|---|
| **D1**: `advance/route.ts` and `verify/route.ts` already exist and are fully implemented | AC-3.2.3, AC-3.2.6 | ✅ No impact on AC spec. Routes match spec exactly. Session 2 tasks S3-S2-1 and S3-S2-2 are SKIP. |
| **D2**: `getCompletionRate` now counts `verified`-only (breaking change from Sprint 1) | AC-3.2.6 (completion rate display) | ✅ Correct per Sprint 3 product intent. The status bar in `actions/page.tsx` displays `{completionRate}% verified` — label already reads "% verified" not "% complete", so wording is accurate. No AC text change needed. |
| **D3**: `handleVerifySubmit` already defined in `actions/page.tsx` | AC-3.2.5, AC-3.2.6 | ✅ No impact on AC spec. Session 2 Task S3-S2-7 is now a stub-replacement only (import + JSX swap), not a function implementation. |
| **D6**: `handleVerify` sets `verifyTarget` + `showVerifyModal` on `"verify-btn"` click | AC-3.2.4 | ✅ `verifyTarget: ActionItem | null` state exists in `actions/page.tsx` line 31. `VerifyImpactModal` will receive `item={verifyTarget}` — matches Session 2 Task S3-S2-7 exactly. |

---

### New Acceptance Criteria Required by Gaps S3-2 and S3-3

The following ACs were not explicitly written in the original Sprint 3 Epic 3.1/3.2 sections but are required to close test gaps S3-2 and S3-3 identified in the TEST_PLAN.md pre-flight.

#### AC-3.1.4a — "+ New Action Item" button in page header opens modal (gap S3-2 closure)

**Trigger**: `data-testid="open-new-action-btn"` button click (confirmed name from `actions/page.tsx` line 156).

**Acceptance Criteria**:
- Clicking `data-testid="open-new-action-btn"` causes `data-testid="new-action-modal"` to appear in the DOM
- With the modal open and the **Title** field empty, `data-testid="new-action-submit-btn"` is `disabled`
- Typing a non-empty string into the Title field causes `data-testid="new-action-submit-btn"` to become enabled
- Clicking **Cancel** (or the `×` close button) causes `data-testid="new-action-modal"` to be removed from the DOM

> **Note**: This AC supplements AC-3.1.4 (which only states the button opens the modal). AC-3.1.4a adds the form-validation and close behavior that test AI-14 will verify.

#### AC-3.2.1a — "Convert to Action" button absent on non-`should-try` cards (gap S3-3 closure)

**Acceptance Criteria**:
- A `FeedbackCard` with `category === 'went-well'` does NOT render `data-testid="convert-btn"`, even when `onConvert` is provided
- A `FeedbackCard` with `category === 'slowed-us-down'` does NOT render `data-testid="convert-btn"`, even when `onConvert` is provided
- A `FeedbackCard` with `category === 'should-try'` renders `data-testid="convert-btn"` when and only when `onConvert` prop is provided

> **Note**: AC-3.2.1 says "on `should-try` cards only" but does not explicitly state the negative case for the other two categories. AC-3.2.1a codifies the negative cases for FB-15.

#### AC-3.2.2a — Convert modal title input is pre-filled with feedback `content` (gap S3-3 closure)

**Acceptance Criteria**:
- On open, the **Title** input in `ConvertActionModal` contains `feedbackItem.content` as its value
- The Title input is editable (user can change the pre-filled value)
- `data-testid="convert-action-modal"` must be in the DOM when the modal is open

> **Note**: AC-3.2.2 says "pre-fills title from feedback content" but does not explicitly state the `data-testid` attribute used for RTL querying. AC-3.2.2a adds that the modal container `data-testid` is `"convert-action-modal"` (already specified in the original AC body text, promoted here for traceability).

---

### Session 2 [PRODUCT] Pre-flight Summary

| Check | Status |
|---|---|
| AC-3.2.1 through AC-3.2.6 — all fully specified | ✅ CLEAR |
| No AC text changes required due to Session 1 deviations | ✅ Confirmed |
| New ACs AC-3.1.4a, AC-3.2.1a, AC-3.2.2a added to close gaps S3-2 and S3-3 | ✅ Added |
| `data-testid` values for all Session 2 modals confirmed | ✅ `"convert-action-modal"`, `"convert-action-submit-btn"`, `"verify-impact-modal"`, `"verify-impact-submit-btn"`, `"new-action-modal"`, `"new-action-submit-btn"`, `"open-new-action-btn"`, `"convert-btn"`, `"advance-btn"`, `"verify-btn"` |
| Session 1 deliverables that Session 2 depends on | ✅ All present: `advance/route.ts`, `verify/route.ts`, `handleVerifySubmit`, `verifyTarget` state, `ActionItemCard`, `NewActionItemModal` |

---

---

# Sprint 4 — Feature Requirements

**Sprint goal**: The admin (first registered user) can set up a sprint with a name, goal, and date range; add team members; and open or close the retro. Non-admin users see a read-only view of sprint info.  
**Theme**: Sprint configuration, team management, open/close retro controls  
**Scope**: Scope 2 MVP — DEV Session 1 (single session)  
**Prerequisite**: Sprint 3 complete and merged

---

## Epic 4.1 — Sprint Setup Page

### User Story

> As an admin, I want to configure the current sprint and manage team membership, so that the tool knows who is participating and what the sprint is working toward.

---

## Acceptance Criteria (Full Specifications)

### AC-4.1.1 — Page renders at `/sprint-setup`

**Route**: `/sprint-setup`  
**Component**: `src/app/sprint-setup/page.tsx`  
**Session guard**: `getCurrentUser()` returns `null` → `router.push('/')` (redirect to login). No flash of content.  
**Shell wrapper**: Yes — `<Shell sprintName={sprint?.name}>` wraps the page content, matching the pattern used by `/feedback` and `/actions`.  
**Nav link**: `"Sprint Setup"` nav item in `Shell` sidebar, active when pathname is `/sprint-setup`. Uses the gear icon (⚙ Lucide `Settings`) to match the mock's icon row.  
**`data-testid`**: `"sprint-setup-page"` on the outermost content wrapper div (inside Shell).  
**Layout**: `max-w-[600px] mx-auto` centred column, matching the prototype. Page title: **"Set Up Sprint"** (`h1`). Subtitle: **"Configure your retro session before your team joins."**  

---

### AC-4.1.2 — Admin sets Sprint Name, Goal, Start Date, End Date

**Form section label**: "Basic Info" (visually unlabelled section — fields grouped in a `retro-card` container).

| Field | Element | `data-testid` | Required | Validation | Max length | Placeholder |
|---|---|---|---|---|---|---|
| Sprint Name | `<input type="text">` | `"sprint-name-input"` | ✅ Yes | Non-empty after trim | 100 chars | `"e.g. Sprint 42"` |
| Sprint Goal | `<textarea rows={2}>` | `"sprint-goal-input"` | ❌ No | None | 500 chars | `"What was this sprint trying to achieve?"` |
| Start Date | `<input type="date">` | `"start-date-input"` | ✅ Yes | Non-empty; must be ≤ End Date | — | — |
| End Date | `<input type="date">` | `"end-date-input"` | ✅ Yes | Non-empty; must be ≥ Start Date | — | — |

**Date validation rule**: If `endDate < startDate`, the **Save** button is disabled and an inline error `"End date must be on or after start date"` is shown below the date row. Error is cleared immediately when the condition is resolved.  
**`data-testid="date-error"`** on the error paragraph.

**Save button**:
- Label: **"Save Changes"** (when an existing sprint is loaded)
- Label: **"Save & Open Retro"** (when no existing sprint exists — creating new)
- `data-testid="save-btn"`
- Disabled when: Sprint Name is empty OR Start Date is empty OR End Date is empty OR `endDate < startDate` OR `isSaving` is true
- On click: calls `sprintService.updateSprint(id, payload)` if sprint exists, or `sprintService.createSprint(payload)` if no sprint. On success: shows inline success message `"Sprint saved."` for 2 seconds then clears.
- `data-testid="save-success"` on the success message span.

**Cancel button**:
- Label: **"Cancel"**
- `data-testid="cancel-btn"`
- Resets all form state to the last-loaded sprint values (or empty if no sprint loaded). Does NOT navigate away.

**Field styling** (plain HTML + Tailwind, no shadcn):
- All inputs/textarea: `bg-secondary/50 border border-border/50 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-500/50`
- Labels: `text-sm font-medium text-slate-300 mb-1 block`
- Dates: two-column grid `grid grid-cols-2 gap-4`

---

### AC-4.1.3 — Admin adds and removes team members by username

**Section heading**: "Team Members"

**Member row display** (for each resolved member in `teamMemberIds`):
- Avatar: initials circle (`w-8 h-8 rounded-full bg-slate-700 border border-border`) showing first two uppercase initials of `user.name`
- Primary text: `user.name` (resolved from user lookup)
- Secondary text: `user.pod` (resolved from user lookup — displayed as-is, e.g. "Pod 1")
- Remove button: Lucide `Trash2` icon (`h-4 w-4`), ghost style (`text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 w-8 rounded`)
- `data-testid="remove-member-btn"` on each remove button (RTL uses index or combined with member name for selection)
- `data-testid="member-row"` on each member row container

**Add Member form** (admin only):
- Username input: `<input type="text">`, `placeholder="Enter username…"`, `data-testid="username-input"`
- **Pod dropdown is omitted** — pod is a field on the `User` model, not on the sprint. The pod shown in the member row is read from the resolved user record.
- "+ Add Member" button: `data-testid="add-member-btn"`, blue background (`bg-blue-600 hover:bg-blue-700 text-white`)

**Username lookup flow**:
1. User types a username and clicks "+ Add Member"
2. `GET /api/users?username={value}` is called
3. **Not found** (empty array returned): show inline error `"User not found"` (`data-testid="member-error"`) below the input; clear on next keystroke
4. **Already in list** (duplicate `_id` already in `teamMemberIds` local state): show inline error `"User already added"` (`data-testid="member-error"`)
5. **Found and not duplicate**: append `{ _id, name, pod }` to resolved members local state; append `_id` to `teamMemberIds`; clear the input field
6. `isSaving` during lookup: "+ Add Member" button shows `"Adding…"` and is disabled

**Remove member flow**:
- Clicking the trash icon removes the user from local `teamMemberIds` state and the displayed member list immediately (optimistic)
- The removal is persisted only when **Save Changes** is clicked

**Persistence**: `teamMemberIds` is included in the `updateSprint()` call payload when Save is clicked.

**Edge cases**:
- Empty username input → "+ Add Member" button is disabled (no API call)
- Self-removal: admin can remove themselves from `teamMemberIds` (no restriction)
- Maximum team size: no hard limit in Sprint 4

---

### AC-4.1.4 — Admin can open or close the retro (status toggle)

**Section heading**: "Retro Status"  
**UI element**: Two radio-button rows (plain HTML `<input type="radio">` — no shadcn `RadioGroup`)

| Radio option | Value | `data-testid` | Visual indicator | Caption |
|---|---|---|---|---|
| Open | `"open"` | `"status-open"` | Emerald glowing dot (`w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]`) | "Team can submit feedback" |
| Closed | `"closed"` | `"status-closed"` | Slate dot (`w-2 h-2 rounded-full bg-slate-500`) | "Read-only mode" |

**Behaviour**:
- Selected radio reflects current `sprint.status` on page load
- Changing the radio updates local state immediately
- Status is **NOT** saved immediately on radio change — it is included in the Save button flow
- On Save click: if `status` changed, calls `sprintService.openRetro(id)` or `sprintService.closeRetro(id)` after the field update call completes, OR the status is saved as part of `updateSprint` payload — see AC-4.1.7 for resolution

> **Implementation delta**: The prototype save button says "Save & Open Retro" — this label applies only when creating a new sprint (no `_id` yet). Once a sprint is loaded, the button reads "Save Changes". Status changes are always part of the same Save action.

**`data-testid="retro-status-section"`** on the section container.

---

### AC-4.1.5 — Closed retro disables feedback submission

**File**: `src/app/feedback/page.tsx` (surgical modification)  
**Condition**: `sprint?.status === 'closed'`

**Disabled elements**:
- `"Submit Feedback"` button (`data-testid="open-modal-btn"`) — `disabled` attribute set; cursor `not-allowed`; opacity reduced (`opacity-50`)
- `SubmitFeedbackModal` must NOT open when retro is closed: `onClick` handler checks `sprint?.status !== 'closed'` before calling `setShowModal(true)`

**No error message** shown — the button is silently disabled (same pattern as disabled buttons elsewhere in the app). A tooltip or aria-label `"Feedback submission is closed"` is added on the button for accessibility when disabled.

**Non-closed states**: Button behaves exactly as today for `status === 'open'` and for `sprint === null` (no active sprint — button remains enabled so user can attempt submission; the modal will show `sprintId: ''` which is the existing fallback).

**Existing tests**: FB-1 through FB-16 must not break. The guard is additive — `sprint` state in tests is `mockSprint` with `status: 'open'` in all existing tests, so the button remains enabled. Sprint 4 adds new test SS-x covering the closed state.

---

### AC-4.1.6 — Non-admin read-only view

**Admin determination**: `getCurrentUser().isAdmin === true`. Admin = first registered user (set by `POST /api/users` when `count === 0`).

**Non-admin rendering** (read-only mode):

| Element | Non-admin behaviour |
|---|---|
| Sprint Name | Plain `<p>` text, no input |
| Sprint Goal | Plain `<p>` text, no textarea |
| Start Date / End Date | Plain `<p>` text, no date inputs |
| Retro Status | Labelled read-only badge (`"Open"` / `"Closed"`), no radio buttons |
| Team Members list | Displayed (member rows without trash icon) |
| Add Member form | Hidden entirely |
| Save / Cancel buttons | Hidden entirely |

**Page is accessible to non-admins** — no redirect for non-admins. The page loads and shows sprint info in read-only format. This lets all team members check who is on the team and what the sprint goal is.

**`data-testid="readonly-view"`** on the read-only container (used by tests to assert non-admin state).  
**`data-testid="admin-view"`** on the admin form container (used by tests to assert admin state).

---

### AC-4.1.7 — Sprint data persists via `sprintService`

**Page load strategy** (`getActiveSprint` flow):
1. On mount, calls `sprintService.getActiveSprint()` → `GET /api/sprints` (returns the open sprint or `[]`/`null`)
2. If an open sprint is returned: populate all form fields with existing values; set `isNewSprint = false`
3. If no sprint returned (null or empty array): all fields start empty; `isNewSprint = true`; Save button reads "Save & Open Retro"

**Create vs Update resolution**:
- `isNewSprint === true`: Save calls `sprintService.createSprint({ name, goal, startDate, endDate })` → `POST /api/sprints` (status defaults to `'open'` in the API). After creation, sets `isNewSprint = false` and stores the returned `sprint._id` in local state.
- `isNewSprint === false`: Save calls `sprintService.updateSprint(id, { name, goal, startDate, endDate, teamMemberIds })` → `PATCH /api/sprints/[id]`. Status is handled separately via `sprintService.openRetro(id)` or `sprintService.closeRetro(id)` if the radio changed.

**Status change on save**:
- If current radio value differs from loaded `sprint.status`: after `updateSprint` resolves, call `openRetro(id)` or `closeRetro(id)` accordingly
- If status unchanged: skip the status call

**`sprintService` function responsibilities**:

| Function | HTTP call | Returns |
|---|---|---|
| `getActiveSprint()` | `GET /api/sprints` | `Sprint \| null` |
| `createSprint(payload)` | `POST /api/sprints` body: `{ name, goal, startDate, endDate }` | `Sprint` (201) |
| `updateSprint(id, payload)` | `PATCH /api/sprints/[id]` body: partial sprint fields | `Sprint` (200) |
| `openRetro(id)` | `PATCH /api/sprints/[id]/status` body: `{ status: 'open' }` | `Sprint` (200) |
| `closeRetro(id)` | `PATCH /api/sprints/[id]/status` body: `{ status: 'closed' }` | `Sprint` (200) |

All functions throw `Error` on non-2xx responses with the JSON `error` field as the message.

---

### AC-4.1.8 — `data-testid` Map (complete)

| `data-testid` value | Element | Notes |
|---|---|---|
| `"sprint-setup-page"` | Outermost content wrapper | Used by smoke test |
| `"admin-view"` | Admin form container div | Absent in non-admin view |
| `"readonly-view"` | Read-only container div | Absent in admin view |
| `"sprint-name-input"` | Sprint Name `<input>` | Admin only |
| `"sprint-goal-input"` | Sprint Goal `<textarea>` | Admin only |
| `"start-date-input"` | Start Date `<input type="date">` | Admin only |
| `"end-date-input"` | End Date `<input type="date">` | Admin only |
| `"date-error"` | Inline date validation error `<p>` | Shown when `endDate < startDate` |
| `"status-open"` | Open radio `<input type="radio">` | Admin only |
| `"status-closed"` | Closed radio `<input type="radio">` | Admin only |
| `"retro-status-section"` | Retro Status section container | Admin only |
| `"member-row"` | Each team member row div | Admin + non-admin |
| `"remove-member-btn"` | Trash icon button in each member row | Admin only |
| `"username-input"` | Add Member username text input | Admin only |
| `"add-member-btn"` | "+ Add Member" button | Admin only |
| `"member-error"` | Inline member lookup error `<p>` | Admin only; "User not found" or "User already added" |
| `"save-btn"` | Save Changes / Save & Open Retro button | Admin only |
| `"cancel-btn"` | Cancel button | Admin only |
| `"save-success"` | Inline save success `<span>` | Shown for 2s after successful save |

---

### AC-4.1.9 — Loading and Error States

**Loading state**:
- While `getActiveSprint()` is in flight: render `<Shell sprintName="">` with a centred `"Loading…"` spinner text (same pattern as `feedback/page.tsx` and `actions/page.tsx`)
- `data-testid="sprint-setup-page"` is NOT rendered during loading (entire page is the loading shell)

**Error state** (fetch fails):
- Inline error below the form header: `"Failed to load sprint data. Please refresh."` (`data-testid="load-error"`)
- Form fields are disabled but page does not crash
- Save button is disabled in error state

**Save error**:
- If `updateSprint` / `createSprint` throws: show inline error `"Failed to save. Please try again."` (`data-testid="save-error"`) below the Save button
- `isSaving` is reset to `false` in the `finally` block

---

### AC-4.1.10 — Data Fetch Strategy

**Page load**:
1. Call `sprintService.getActiveSprint()` — wraps `GET /api/sprints` which returns the first `status: 'open'` sprint
2. Normalize response: `GET /api/sprints` returns either a sprint object or `[]` (empty array for no sprint). Service normalises to `Sprint | null`
3. Member resolution: after loading the sprint, call `GET /api/users` to get all users; filter by `sprint.teamMemberIds` to build the resolved member list `{ _id, name, pod }[]` for display
4. Both fetches run in parallel: `Promise.all([getActiveSprint(), getAllUsers()])`

**`getAllUsers` reuse**: `userService.getAllUsers()` already exports `GET /api/users` — `sprintService` does NOT duplicate this. The page calls `getAllUsers()` from `userService` alongside `getActiveSprint()` from `sprintService`.

---

## Prototype-to-Implementation Delta (Sprint 4)

| Delta ID | Prototype / Mock | Implementation | Resolution |
|---|---|---|---|
| PD-4.1 | `SprintSetup.tsx` imports `Button`, `Input`, `Label`, `Textarea`, `RadioGroup`, `Select` from `@/components/ui/*` (shadcn) | shadcn components do NOT exist in `retro-dev/` | **Plain HTML + Tailwind only** — all shadcn components replaced with native HTML elements and equivalent Tailwind classes |
| PD-4.2 | Add Member form includes a `Select` dropdown for "Pod 1/2/3" | Pod is a field on the `User` model, not the sprint | **Pod dropdown omitted** — pod is displayed on the member row (resolved from user lookup), not collected during add |
| PD-4.3 | Add Member input: `placeholder="Enter name..."` | AC-4.1.3 says "add by username (must be a registered user)" | **Placeholder changed to `"Enter username…"`** — lookup uses `GET /api/users?username={value}` |
| PD-4.4 | Save button label: "Save & Open Retro" (single state) | Two modes: create vs update | **Label is conditional**: `"Save & Open Retro"` for new sprint creation; `"Save Changes"` for updating existing sprint |
| PD-4.5 | Pod shown on member row: `"Pod 1"` static string | Pod must come from the resolved `User` record | **Pod resolved from `getAllUsers()` response** — filtered by `teamMemberIds` on page load and after each add |
| PD-4.6 | `GET /api/users` has no `?username` filter | Username lookup requires server-side filtering | **`GET /api/users` route to be modified** to support optional `?username` query param; filtered with `{ username: query }` Mongoose find |
| PD-4.7 | Prototype shows no loading or error state | Scalability pattern requires loading + error states | **Loading + error states added** per AC-4.1.9 |

---

## Business Rules (Sprint 4)

| Rule | Enforcement layer |
|---|---|
| Only admin users can edit sprint configuration | Client: admin check on mount; page renders `admin-view` or `readonly-view` based on `currentUser.isAdmin` |
| Sprint Name and dates are required | Client: Save button disabled until non-empty; API: `POST /api/sprints` already validates `name`, `startDate`, `endDate` |
| End date must be ≥ start date | Client only: inline error + disabled save button; API does not enforce date ordering in Sprint 4 |
| Username lookup must match a registered user | Client: `GET /api/users?username={value}` — empty result = "User not found" error |
| Duplicate team member prevention | Client: check `_id` already in `teamMemberIds` state before appending |
| Feedback submission blocked when retro is closed | Client: `sprint?.status === 'closed'` guard on `open-modal-btn`'s `onClick` in `feedback/page.tsx` |
| Status changes are saved via dedicated route | Service: `openRetro(id)` / `closeRetro(id)` → `PATCH /api/sprints/[id]/status`; NOT mixed into the field update PATCH |
| Admin determination | `getCurrentUser().isAdmin === true` — set server-side at registration (`POST /api/users` when `count === 0`) |

---

## UI Requirements (Sprint 4)

### AC-UI-4.1 — Sprint Setup page layout

| AC-ID | Requirement |
|---|---|
| AC-UI-4.1.1 | Page matches `docs/ui-mocks/SetUpSprint.png` |
| AC-UI-4.1.2 | Page heading: **"Set Up Sprint"** h1 + subtitle **"Configure your retro session before your team joins."** |
| AC-UI-4.1.3 | Content card: `retro-card p-8 space-y-8` with horizontal rule dividers between sections |
| AC-UI-4.1.4 | Team member avatar: `w-8 h-8 rounded-full bg-slate-700` with two-letter uppercase initials |
| AC-UI-4.1.5 | Open radio row: highlighted with `bg-secondary/30 border border-border/50 rounded-md p-3`; Closed radio row: plain `p-3` (no border highlight) |
| AC-UI-4.1.6 | Shell sidebar shows gear/settings nav item as active at `/sprint-setup` |
| AC-UI-4.1.7 | Save button: amber/primary background (`bg-primary text-primary-foreground font-semibold`); Cancel button: outline style (`border border-border/50`) |

---

## Type-Schema Alignment (Sprint 4)

All Sprint 4 fields are **already defined** in `src/types/index.ts` and `src/lib/models/Sprint.ts`. No new types or schema changes needed.

| Field | `Sprint` field | Type | Notes |
|---|---|---|---|
| Sprint name input | `name` | `string` | Required |
| Sprint goal textarea | `goal` | `string` | Optional |
| Start date input | `startDate` | `string` | ISO date string |
| End date input | `endDate` | `string` | ISO date string |
| Status radio | `status` | `"open" \| "closed"` | Kebab-case |
| Team member IDs | `teamMemberIds` | `string[]` | Array of user `_id` strings |
| Admin flag | `User.isAdmin` | `boolean` | Already in `User` interface |

---

## Definition of Done (Sprint 4)

- [ ] All AC-4.1.x acceptance criteria pass
- [ ] `corepack yarn build` — 0 errors
- [ ] `corepack yarn test` — 0 failures (Sprint 1–3 regressions: 0)
- [ ] Admin can create a new sprint (POST) and update an existing sprint (PATCH)
- [ ] Admin can add/remove team members; changes persist on Save
- [ ] Admin can toggle retro status Open/Closed; change persists on Save
- [ ] Non-admin user sees read-only sprint info at `/sprint-setup`
- [ ] Closed retro disables "Submit Feedback" button on Feedback Board
- [ ] All shadcn imports eliminated from `sprint-setup/page.tsx` (plain HTML + Tailwind only)
- [ ] `GET /api/users?username=X` filter works correctly
- [ ] Committed: `git commit -m "Sprint 4 complete: Sprint Setup + Admin Controls"`

---

---

# Sprint 5 — Feature Requirements

**Mode**: [PRODUCT]  
**Date**: April 2026  
**Theme**: Polish, Error Handling & Smoke Test  
**Epics**: 5.1 — Error Handling & Edge Cases; 5.2 — Accessibility & data-testid Pass  
**DEV Sessions**: 1 (~200 lines surgical edits across existing files)  
**Prerequisite**: Sprints 1–4 complete and merged

---

## Pre-Flight Audit Findings (codebase state at Sprint 5 start)

The following facts were confirmed by reading every affected file before specifying any AC. They drive the SKIP/MODIFY determination below.

| File | Auth Guard | Error State | Notes |
|---|---|---|---|
| `dashboard/page.tsx` | ✅ EXISTS (lines 41–45) | ❌ MISSING — catch is silent | Sprint 5 adds error state only |
| `feedback/page.tsx` | ✅ EXISTS (lines 41–45) | ❌ MISSING — no catch, only finally | Sprint 5 adds catch + error state |
| `actions/page.tsx` | ✅ EXISTS (lines 42–46) | ✅ EXISTS — `setError('Failed to load data.')` | SKIP both |
| `sprint-setup/page.tsx` | Planned in Sprint 4 | Planned in Sprint 4 | SKIP — Sprint 4 covers it |

| Modal | `role="dialog"` | `aria-labelledby` | `data-testid` | Submit disabled | Close btn testid | Focus trap | Return focus |
|---|---|---|---|---|---|---|---|
| `SubmitFeedbackModal` | ✅ | ✅ `sfm-title` | ✅ `submit-feedback-modal` | ✅ | ✅ `modal-close-btn` | ❌ | ❌ |
| `NewActionItemModal` | ✅ | ✅ `nam-title` | ✅ `new-action-modal` | ✅ | ❌ missing | ❌ | ❌ |
| `ConvertActionModal` | ✅ | ✅ `cam-title` | ✅ `convert-action-modal` | ✅ | ❌ missing | ❌ | ❌ |
| `VerifyImpactModal` | ✅ | ✅ `vim-title` | ✅ `verify-impact-modal` | ✅ | ❌ missing | ❌ | ❌ |

| API Routes | try/catch | void err / console.error | 500 return |
|---|---|---|---|
| All 9 routes | ✅ all present | ✅ consistent | ✅ all return `{ error: string }` |

| Shell.tsx | Active route highlight |
|---|---|
| ✅ | `pathname === item.href` — **AC-5.1.5 already satisfied** |

---

## Epic 5.1 — Error Handling & Edge Cases

### AC-5.1.1 — API failure shows inline error; no crash

**Affected pages**: `dashboard/page.tsx` (MODIFY), `feedback/page.tsx` (MODIFY)  
**Already compliant**: `actions/page.tsx` (SKIP — has `setError` + error render), `sprint-setup/page.tsx` (SKIP — Sprint 4 sets `loadError`)

**Specification**:

| Element | Type | `data-testid` | Trigger |
|---|---|---|---|
| Error banner | `<div>` | `"load-error"` | fetch throws or `res.ok === false` |
| Error message text | Static string | — | "Something went wrong. Please try again." |

**Business rules**:
- The error message **must** read exactly: `"Something went wrong. Please try again."`
- Error state renders inside `<Shell>` — the page does NOT crash or show a blank screen
- Error state replaces the page content (same pattern as `actions/page.tsx` — returns early from render)
- `isLoading` must be set to `false` in `finally` even when error occurs
- `dashboard/page.tsx`: the catch block currently has `// leave sprint null` comment — **add** `setLoadError(true)` and add an error state render branch
- `feedback/page.tsx`: the `load()` function has no `catch` — **add** a catch block with `setLoadError(true)`

**`dashboard/page.tsx` change summary**:
- Add `const [loadError, setLoadError] = useState(false)` state
- In `catch`: replace silent comment with `setLoadError(true)`
- Add render branch: `if (loadError) return <Shell><div data-testid="load-error">Something went wrong. Please try again.</div></Shell>`

**`feedback/page.tsx` change summary**:
- Add `const [loadError, setLoadError] = useState(false)` state
- Add `catch` block (currently missing): `catch { setLoadError(true) }`
- Add render branch: `if (loadError) return <Shell sprintName=""><div data-testid="load-error">Something went wrong. Please try again.</div></Shell>`

---

### AC-5.1.2 — Empty states render correctly on first load

**Specification**: All empty states are rendered correctly when there is no data. Verified per page:

| Page | Empty state condition | UI element | `data-testid` | Message |
|---|---|---|---|---|
| `dashboard/page.tsx` | `sprint === null` | `<div>` wrapping empty state block | `"dashboard-empty-state"` | "No sprint data yet." + CTA button |
| `feedback/page.tsx` | `sprint === null` | No explicit empty state — feedback columns render empty | `"feedback-empty-state"` (add) | "No active sprint. Set one up to begin." |
| `actions/page.tsx` | `actions.length === 0` | Existing empty state `<div>` | `"actions-empty-state"` (add) | "No action items yet." (already present as text) |

**Business rules**:
- `dashboard/page.tsx`: The empty state block (lines 143–158) needs `data-testid="dashboard-empty-state"` added to the outer `<div>`. The "Set Up Sprint →" button needs `data-testid="dashboard-setup-btn"`.
- `feedback/page.tsx`: When `sprint === null` and loading is done, add a conditional render above the three-column grid: `<div data-testid="feedback-empty-state">No active sprint. Set one up to begin.</div>`
- `actions/page.tsx`: The empty state `<div>` at line 186 needs `data-testid="actions-empty-state"`. The two CTA buttons inside need testids (see AC-5.2.1).

---

### AC-5.1.3 — `/dashboard` redirects unauthenticated users to `/`

**Status**: ✅ **Already satisfied** — `dashboard/page.tsx` lines 41–45 call `getCurrentUser()` and `router.push('/')` when null.

**Specification for EH-1 test**: The existing guard must be confirmed by test EH-1. No code change needed. Test asserts `mockPush` is called with `'/'` when `getCurrentUser` returns `null`.

---

### AC-5.1.4 — Forms show inline validation for required fields

**Affected components**: `SubmitFeedbackModal`, `NewActionItemModal`, `ConvertActionModal`, `VerifyImpactModal`

**Status**: All four modals already disable their submit button when required fields are empty (`submitDisabled` logic present in all). This satisfies the AC for preventing submission.

**Specification**:
- The `disabled` submit button pattern **is sufficient** for AC-5.1.4 — no additional inline `<p>` error text is required.
- EH-6 confirms this behaviour by asserting `modal-submit-btn` is disabled when `content` is empty.
- **No code changes** needed for AC-5.1.4 — already compliant in all 4 modals.

---

### AC-5.1.5 — Sidebar correctly highlights active route

**Status**: ✅ **Already satisfied** — `Shell.tsx` uses `pathname === item.href` to apply active class (lines 54–72).

**No code changes needed.** Covered by existing Shell render tests in Sprint 1.

---

## Epic 5.2 — Accessibility & data-testid Pass

### AC-5.2.1 — Every `<button>` has `data-testid`

**Audit of missing `data-testid` values on buttons**:

| File | Button element | Current testid | Required testid |
|---|---|---|---|
| `dashboard/page.tsx` line 147 | "Set Up Sprint →" | ❌ none | `"dashboard-setup-btn"` |
| `actions/page.tsx` line 195 | "Go to Feedback Board" | ❌ none | `"actions-goto-feedback-btn"` |
| `actions/page.tsx` line 201 | "New Action Item" (empty state) | ❌ none | `"actions-empty-new-btn"` |
| `NewActionItemModal.tsx` line 82 | Close (×) button | ❌ none | `"nam-close-btn"` |
| `ConvertActionModal.tsx` line 90 | Close (×) button | ❌ none | `"cam-close-btn"` |
| `VerifyImpactModal.tsx` line 64 | Close (×) button | ❌ none | `"vim-close-btn"` |
| `NewActionItemModal.tsx` line 157 | Cancel button | ❌ none | `"nam-cancel-btn"` |
| `ConvertActionModal.tsx` line 171 | Cancel button | ❌ none | `"cam-cancel-btn"` |
| `VerifyImpactModal.tsx` line 107 | Cancel button | ❌ none | `"vim-cancel-btn"` |

**Already compliant** (no change needed):
- `SubmitFeedbackModal`: `modal-close-btn` ✅, `modal-submit-btn` ✅, Cancel has no testid → add `"sfm-cancel-btn"`
- `actions/page.tsx` header button: `open-new-action-btn` ✅
- `feedback/page.tsx` header button: `open-modal-btn` ✅

| File | Cancel button | Required testid |
|---|---|---|
| `SubmitFeedbackModal.tsx` line 170 | Cancel button | `"sfm-cancel-btn"` |

**Full additions list** (10 buttons across 5 files):

| `data-testid` | File | Element |
|---|---|---|
| `"dashboard-setup-btn"` | `dashboard/page.tsx` | "Set Up Sprint →" button |
| `"actions-goto-feedback-btn"` | `actions/page.tsx` | "Go to Feedback Board" (empty state) |
| `"actions-empty-new-btn"` | `actions/page.tsx` | "New Action Item" (empty state) |
| `"nam-close-btn"` | `NewActionItemModal.tsx` | Close × button |
| `"nam-cancel-btn"` | `NewActionItemModal.tsx` | Cancel button |
| `"cam-close-btn"` | `ConvertActionModal.tsx` | Close × button |
| `"cam-cancel-btn"` | `ConvertActionModal.tsx` | Cancel button |
| `"vim-close-btn"` | `VerifyImpactModal.tsx` | Close × button |
| `"vim-cancel-btn"` | `VerifyImpactModal.tsx` | Cancel button |
| `"sfm-cancel-btn"` | `SubmitFeedbackModal.tsx` | Cancel button |

---

### AC-5.2.2 — Every `<input>` and `<select>` has `data-testid` and `<label>`

**Audit**:

| File | Element | id | `data-testid` | `<label>` |
|---|---|---|---|---|
| `SubmitFeedbackModal` — `<textarea id="sfm-content">` | textarea | `sfm-content` | ❌ missing | ✅ `htmlFor="sfm-content"` |
| `SubmitFeedbackModal` — `<textarea id="sfm-suggestion">` | textarea | `sfm-suggestion` | ❌ missing | ✅ `htmlFor="sfm-suggestion"` |
| `SubmitFeedbackModal` — anonymous `<input type="checkbox">` | checkbox | none | ❌ missing | ✅ wrapping `<label>` |
| `SubmitFeedbackModal` — category `<input type="radio">` × 3 | radio | none | ❌ missing | ✅ wrapping `<label>` |
| `NewActionItemModal` — `<input id="nam-title-input">` | text | `nam-title-input` | ❌ missing | ✅ |
| `NewActionItemModal` — `<textarea id="nam-description">` | textarea | `nam-description` | ❌ missing | ✅ |
| `NewActionItemModal` — `<select id="nam-owner">` | select | `nam-owner` | ❌ missing | ✅ |
| `NewActionItemModal` — `<input id="nam-due-date">` | date | `nam-due-date` | ❌ missing | ✅ |
| `ConvertActionModal` — `<input id="cam-title-input">` | text | `cam-title-input` | ❌ missing | ✅ |
| `ConvertActionModal` — `<textarea id="cam-description">` | textarea | `cam-description` | ❌ missing | ✅ |
| `ConvertActionModal` — `<select id="cam-owner">` | select | `cam-owner` | ❌ missing | ✅ |
| `ConvertActionModal` — `<input id="cam-due-date">` | date | `cam-due-date` | ❌ missing | ✅ |
| `VerifyImpactModal` — `<textarea id="vim-impact">` | textarea | `vim-impact` | ❌ missing | ✅ |

**Required `data-testid` additions** (all inputs/selects/textareas in modals):

| `data-testid` | Element | File |
|---|---|---|
| `"sfm-content"` | `<textarea id="sfm-content">` | `SubmitFeedbackModal.tsx` |
| `"sfm-suggestion"` | `<textarea id="sfm-suggestion">` | `SubmitFeedbackModal.tsx` |
| `"sfm-anonymous"` | `<input type="checkbox">` | `SubmitFeedbackModal.tsx` |
| `"sfm-category-slowed"` | `<input type="radio" value="slowed-us-down">` | `SubmitFeedbackModal.tsx` |
| `"sfm-category-try"` | `<input type="radio" value="should-try">` | `SubmitFeedbackModal.tsx` |
| `"sfm-category-well"` | `<input type="radio" value="went-well">` | `SubmitFeedbackModal.tsx` |
| `"nam-title-input"` | `<input id="nam-title-input">` | `NewActionItemModal.tsx` |
| `"nam-description"` | `<textarea id="nam-description">` | `NewActionItemModal.tsx` |
| `"nam-owner"` | `<select id="nam-owner">` | `NewActionItemModal.tsx` |
| `"nam-due-date"` | `<input id="nam-due-date">` | `NewActionItemModal.tsx` |
| `"cam-title-input"` | `<input id="cam-title-input">` | `ConvertActionModal.tsx` |
| `"cam-description"` | `<textarea id="cam-description">` | `ConvertActionModal.tsx` |
| `"cam-owner"` | `<select id="cam-owner">` | `ConvertActionModal.tsx` |
| `"cam-due-date"` | `<input id="cam-due-date">` | `ConvertActionModal.tsx` |
| `"vim-impact"` | `<textarea id="vim-impact">` | `VerifyImpactModal.tsx` |

**Note on radio buttons**: testids are added inline on each `<input type="radio">` element keyed to the option value. The `RADIO_OPTIONS.map()` in `SubmitFeedbackModal` needs to inject a derived testid per iteration.

---

### AC-5.2.3 — All modals have `role="dialog"` and `aria-labelledby`

**Status**: ✅ **Already satisfied in all 4 modals** — confirmed on pre-flight read.

| Modal | `role="dialog"` | `aria-labelledby` |
|---|---|---|
| `SubmitFeedbackModal` | ✅ | ✅ `sfm-title` |
| `NewActionItemModal` | ✅ | ✅ `nam-title` |
| `ConvertActionModal` | ✅ | ✅ `cam-title` |
| `VerifyImpactModal` | ✅ | ✅ `vim-title` |

**No code changes needed** for AC-5.2.3. EH-7 through EH-10 confirm these attributes by querying `role="dialog"` via `getByRole`.

---

### AC-5.2.4 — Modals trap focus (Tab stays within modal)

**Status**: ❌ **Missing in all 4 modals** — no `useEffect` keyboard listener present.

**Specification — focus trap pattern** (identical implementation in all 4 modals):

```tsx
// Add useRef import alongside useState
import { useState, useRef, useEffect } from 'react'

// Inside component, add ref for modal container:
const modalRef = useRef<HTMLDivElement>(null)

// Add useEffect for focus trap (after existing state declarations):
useEffect(() => {
  if (!open) return
  const modal = modalRef.current
  if (!modal) return
  const focusable = modal.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }
  modal.addEventListener('keydown', handleKeyDown)
  first?.focus()
  return () => modal.removeEventListener('keydown', handleKeyDown)
}, [open])
```

**Attach `ref` to modal container div** (the inner `<div role="dialog">`):
```tsx
<div ref={modalRef} role="dialog" ...>
```

**Business rules**:
- `useEffect` dependency: `[open]` — runs when modal opens or closes
- Early return when `!open` prevents listener attachment before modal mounts
- `first?.focus()` on open moves focus into modal automatically
- `VerifyImpactModal`: dependency array is `[open]` not `[open, item]` — `item` is always set when `open` is true

---

### AC-5.2.5 — Closing modal returns focus to opener element

**Status**: ❌ **Missing in all 4 modals** — no trigger ref pattern present.

**Specification — return focus pattern** (identical in all 4 modals):

```tsx
// Add triggerRef alongside modalRef:
const triggerRef = useRef<HTMLElement | null>(null)

// Capture opener on open (add useEffect for this separately):
useEffect(() => {
  if (open) {
    triggerRef.current = document.activeElement as HTMLElement
  }
}, [open])

// In handleClose(), after onClose() call, add:
triggerRef.current?.focus()
```

**Business rules**:
- `triggerRef` captures `document.activeElement` the moment `open` becomes `true` — this is the button that triggered the modal open
- `triggerRef.current?.focus()` is called in `handleClose()` before the function returns
- For `VerifyImpactModal`, `handleClose` also calls `onClose()` — `focus()` must be called after `onClose()`
- This is a separate `useEffect` from the focus trap — do NOT combine them

---

## Sprint 5 UI Element Map & data-testid Master List

### New `data-testid` values added in Sprint 5

| `data-testid` | Element | File | AC |
|---|---|---|---|
| `"load-error"` | Error banner `<div>` | `dashboard/page.tsx`, `feedback/page.tsx` | AC-5.1.1 |
| `"dashboard-empty-state"` | No-sprint empty state wrapper | `dashboard/page.tsx` | AC-5.1.2 |
| `"dashboard-setup-btn"` | "Set Up Sprint →" button | `dashboard/page.tsx` | AC-5.2.1 |
| `"feedback-empty-state"` | No-sprint empty state | `feedback/page.tsx` | AC-5.1.2 |
| `"actions-empty-state"` | No-actions empty state wrapper | `actions/page.tsx` | AC-5.1.2 |
| `"actions-goto-feedback-btn"` | "Go to Feedback Board" (empty state) | `actions/page.tsx` | AC-5.2.1 |
| `"actions-empty-new-btn"` | "New Action Item" (empty state) | `actions/page.tsx` | AC-5.2.1 |
| `"nam-close-btn"` | Close × | `NewActionItemModal.tsx` | AC-5.2.1 |
| `"nam-cancel-btn"` | Cancel | `NewActionItemModal.tsx` | AC-5.2.1 |
| `"nam-title-input"` | Title input | `NewActionItemModal.tsx` | AC-5.2.2 |
| `"nam-description"` | Description textarea | `NewActionItemModal.tsx` | AC-5.2.2 |
| `"nam-owner"` | Owner select | `NewActionItemModal.tsx` | AC-5.2.2 |
| `"nam-due-date"` | Due date input | `NewActionItemModal.tsx` | AC-5.2.2 |
| `"cam-close-btn"` | Close × | `ConvertActionModal.tsx` | AC-5.2.1 |
| `"cam-cancel-btn"` | Cancel | `ConvertActionModal.tsx` | AC-5.2.1 |
| `"cam-title-input"` | Title input | `ConvertActionModal.tsx` | AC-5.2.2 |
| `"cam-description"` | Description textarea | `ConvertActionModal.tsx` | AC-5.2.2 |
| `"cam-owner"` | Owner select | `ConvertActionModal.tsx` | AC-5.2.2 |
| `"cam-due-date"` | Due date input | `ConvertActionModal.tsx` | AC-5.2.2 |
| `"vim-close-btn"` | Close × | `VerifyImpactModal.tsx` | AC-5.2.1 |
| `"vim-cancel-btn"` | Cancel | `VerifyImpactModal.tsx` | AC-5.2.1 |
| `"vim-impact"` | Impact statement textarea | `VerifyImpactModal.tsx` | AC-5.2.2 |
| `"sfm-cancel-btn"` | Cancel | `SubmitFeedbackModal.tsx` | AC-5.2.1 |
| `"sfm-content"` | Content textarea | `SubmitFeedbackModal.tsx` | AC-5.2.2 |
| `"sfm-suggestion"` | Suggestion textarea | `SubmitFeedbackModal.tsx` | AC-5.2.2 |
| `"sfm-anonymous"` | Anonymous checkbox | `SubmitFeedbackModal.tsx` | AC-5.2.2 |
| `"sfm-category-slowed"` | Slowed Us Down radio | `SubmitFeedbackModal.tsx` | AC-5.2.2 |
| `"sfm-category-try"` | Should Try radio | `SubmitFeedbackModal.tsx` | AC-5.2.2 |
| `"sfm-category-well"` | Went Well radio | `SubmitFeedbackModal.tsx` | AC-5.2.2 |

---

## Sprint 5 Business Rules

| Rule | Description |
|---|---|
| BR-5.1 | Error message text is exactly: `"Something went wrong. Please try again."` — no variation |
| BR-5.2 | Error state renders inside `<Shell>` wrapper — never a blank page |
| BR-5.3 | `isLoading` is set to `false` in `finally` regardless of success or failure |
| BR-5.4 | Auth guard pattern: `getCurrentUser() → null → router.push('/') → return` in `useEffect` on mount |
| BR-5.5 | All 4 auth guards already exist — no new guards needed in Sprint 5 |
| BR-5.6 | All 9 API routes already have try/catch + 500 — no route changes in Sprint 5 |
| BR-5.7 | Focus trap: Tab cycles within modal; Shift+Tab cycles backward; Escape handled by overlay click or close button |
| BR-5.8 | Return focus: `triggerRef.current?.focus()` called inside `handleClose()` |
| BR-5.9 | `data-testid` naming pattern for buttons: `[component-prefix]-[action]-btn` |
| BR-5.10 | `data-testid` naming pattern for inputs: `[component-prefix]-[field-name]` (matching existing `id` value) |

---

## Sprint 5 Acceptance Criteria Summary Table

| AC-ID | Criterion | Status before Sprint 5 | Change required |
|---|---|---|---|
| AC-5.1.1 | API failure → inline error; no crash | ❌ dashboard + feedback missing error state | Add `loadError` state + catch + render branch |
| AC-5.1.2 | Empty states render correctly | ⚠️ Partial — missing testids + feedback empty state | Add testids; add feedback empty state |
| AC-5.1.3 | `/dashboard` redirects unauthenticated users | ✅ Already satisfied | SKIP (EH-1 is confirmation test only) |
| AC-5.1.4 | Forms show inline validation | ✅ Submit disabled = sufficient | SKIP |
| AC-5.1.5 | Sidebar highlights active route | ✅ Already satisfied | SKIP |
| AC-5.2.1 | Every `<button>` has `data-testid` | ❌ 10 buttons missing | Add 10 testids across 5 files |
| AC-5.2.2 | Every `<input>`/`<select>` has `data-testid` + `<label>` | ❌ 15 elements missing testids | Add 15 testids; labels all present ✅ |
| AC-5.2.3 | Modals have `role="dialog"` + `aria-labelledby` | ✅ All 4 compliant | SKIP |
| AC-5.2.4 | Modals trap focus | ❌ Missing in all 4 | Add focus trap `useEffect` to all 4 |
| AC-5.2.5 | Close returns focus to opener | ❌ Missing in all 4 | Add `triggerRef` pattern to all 4 |

---

## Sprint 5 Definition of Done

- [ ] `dashboard/page.tsx` has `loadError` state + error render with `data-testid="load-error"`
- [ ] `feedback/page.tsx` has `loadError` state + catch block + error render with `data-testid="load-error"`
- [ ] `dashboard/page.tsx` empty state has `data-testid="dashboard-empty-state"` and `data-testid="dashboard-setup-btn"`
- [ ] `feedback/page.tsx` has `data-testid="feedback-empty-state"` for the no-sprint condition
- [ ] `actions/page.tsx` empty state has `data-testid="actions-empty-state"`, `"actions-goto-feedback-btn"`, `"actions-empty-new-btn"`
- [ ] All 10 missing button `data-testid` values added
- [ ] All 15 missing input/select/textarea `data-testid` values added
- [ ] Focus trap `useEffect` added to all 4 modals
- [ ] Return focus `triggerRef` pattern added to all 4 modals
- [ ] `errorHandling.test.tsx` created with EH-1 through EH-10 all passing
- [ ] 0 new test failures (2 pre-existing `getCompletionRate` failures remain — expected)
- [ ] `corepack yarn tsc --noEmit` → 0 errors
- [ ] `corepack yarn build` → 0 errors
- [ ] Smoke test checklist (18 steps) passes in browser
- [ ] Committed: `git commit -m "Sprint 5 complete: Polish + Scope 2 MVP"`
- [ ] Pushed: `git push origin main`
