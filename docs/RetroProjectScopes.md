# RetroBoard — MVP Scope Definitions

**Project**: Teams Retro — Async Gamified Retrospective Tool  
**Stack**: React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui  
**Target Users**: 3 Agile pods × ~10 members each (~30 users total)  
**Auth Model**: Standalone app — simple self-registration (no Microsoft SSO required for MVP)  
**Date**: March 2026

---

## Context: What Was Audited

The existing Replit codebase contains **5 fully designed UI pages** with excellent visual design (dark theme, card layout, sidebar navigation). However, **all data is 100% hardcoded static mock data**. No button does anything. No form exists. No data persists. The UI is a pixel-perfect prototype with zero real functionality underneath.

### Reusable Assets (carry forward to all scopes)
| Asset | Status |
|-------|--------|
| Shell + Sidebar layout (`Shell.tsx`, `Sidebar.tsx`) | ✅ Reuse as-is |
| Dark theme + Tailwind config + `index.css` | ✅ Reuse as-is |
| shadcn/ui component library (30+ components) | ✅ Reuse as-is |
| Page route structure (`App.tsx` with wouter) | ✅ Reuse as-is |
| FeedbackCard UI component | ✅ Reuse, wire state |
| ActionCard UI component | ✅ Reuse, wire state |
| All page visual layouts | ✅ Reuse, replace hardcoded data |

---

## User Identity Model (All Scopes)

### Registration Flow
On first visit, the user is shown a one-time registration screen:

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| Full Name | Text input | Required, 2–50 chars | Display name shown throughout app |
| Username / Handle | Text input | Required, unique, lowercase, no spaces | Used as human-readable unique key (e.g. `ajohnson`) |
| Pod | Dropdown | Required | Select from Pod 1 / Pod 2 / Pod 3 |

### Identity Storage
```
localStorage key: "retro_user"
Value: {
  id: "uuid-v4",          ← generated once, permanent identity key
  name: "Alex Johnson",   ← display name
  username: "ajohnson",   ← unique handle (checked at registration)
  podId: "pod-1"          ← determines data visibility
}
```

- UUID is generated on first registration and **never changes**
- All feedback, upvotes, and action items are linked to this UUID
- Username uniqueness is enforced at registration by checking existing registered users
- Pod assignment determines which sprint data the user sees

### Pod Structure
| Pod ID | Display Name | Members |
|--------|-------------|---------|
| `pod-1` | Pod 1 | ~10 members |
| `pod-2` | Pod 2 | ~10 members |
| `pod-3` | Pod 3 | ~10 members |

Each pod has its own isolated feedback, action items, and sprint data.

---

## Scope 1 — Ultra-Lean

**Goal**: Prove that async feedback with the reframe rule is better than a live retro meeting.  
**Target Timeline**: Week 1–2  
**Success Metric**: Did the team submit feedback without scheduling a meeting?

### Pages Included
- Registration screen (new)
- Feedback Board (wired)

### Pages NOT Included
- Dashboard
- Action Items
- Leaderboard
- Sprint Digest

### Feature Specification

#### Registration Screen
| Field/Feature | Detail |
|--------------|--------|
| Full Name input | Required |
| Username input | Required, unique across pod |
| Pod selector | Dropdown: Pod 1 / Pod 2 / Pod 3 |
| Submit button | Saves to localStorage, redirects to Feedback Board |
| Skip/return | Not allowed — must register to use app |

#### Feedback Board
| Field/Feature | Detail |
|--------------|--------|
| 3 column layout | "What Slowed Us Down?" / "What Should We Try?" / "What Went Well?" |
| Column item count badge | Shows how many cards are in each column |
| Feedback card — text | The feedback content |
| Feedback card — author | Display name or "Anonymous" |
| Feedback card — author avatar | Initials circle or masked icon if anonymous |
| Feedback card — upvote button | Thumbs up icon + count; turns amber when voted |
| Feedback card — upvote constraint | One upvote per user per item; cannot upvote own feedback |
| Feedback card — suggested improvement | Shown as inset quote block on "Slowed Us Down" cards only |
| Feedback card — category color | Red left border / Blue left border / Emerald left border |
| "Submit Feedback" button | Opens submission form/modal |

#### Feedback Submission Form
| Field/Feature | Detail |
|--------------|--------|
| Category selector | 3 radio/tab options with color coding |
| Feedback text area | Required, min 10 chars, max 500 chars |
| Suggested Improvement text area | Conditionally required — only shown when category = "Slowed Us Down"; labeled with "Reframe Rule" warning |
| Anonymous toggle | Switch; hides name and shows masked avatar on the card |
| Submit button | Validates, saves to state, closes form, card appears in correct column |
| Cancel button | Closes form without saving |

#### Persistence (Scope 1)
- **localStorage only** — data lives in the browser
- No backend required
- Data is lost if browser storage is cleared (acceptable for prototype)

### Data Model (Scope 1)
```typescript
type User = {
  id: string;          // uuid
  name: string;
  username: string;
  podId: string;
}

type FeedbackItem = {
  id: string;          // uuid
  podId: string;
  sprintId: string;
  category: "slowed" | "try" | "well";
  text: string;
  suggestion?: string; // required if category === "slowed"
  authorId: string;    // user uuid
  isAnonymous: boolean;
  upvotes: string[];   // array of user uuids who upvoted
  createdAt: string;   // ISO timestamp
}
```

---

## Scope 2 — Core Loop ← CURRENT BUILD TARGET

**Goal**: Prove that feedback turns into real improvements that get tracked and closed.  
**Target Timeline**: Week 3–4 (builds on Scope 1)  
**Success Metric**: Did at least one action item get created, completed, and verified with a documented impact?

### Pages Included
- Registration screen (from Scope 1)
- Feedback Board (from Scope 1 + "Convert to Action" wired)
- Action Items (wired)
- Dashboard (wired with real calculated stats)

### Pages NOT Included
- Leaderboard
- Sprint Digest

### Feature Specification

#### Everything in Scope 1, PLUS:

#### Feedback Card — Convert to Action Item
| Field/Feature | Detail |
|--------------|--------|
| "→ Action" button | Appears on hover on high-upvote cards (threshold: 3+ upvotes) OR visible always to pod admin |
| Trigger | Opens "Create Action Item" modal |

#### Create Action Item Modal
| Field/Feature | Detail |
|--------------|--------|
| Title input | Required; pre-filled with first 60 chars of feedback text |
| Description input | Optional; space to add more context |
| Owner selector | Dropdown of pod members by name |
| Due date picker | Calendar date picker |
| Source feedback | Read-only; shows the originating feedback text |
| Submit button | Creates action item, links back to feedback item |
| Cancel button | Closes without saving |

#### Action Items Page
| Field/Feature | Detail |
|--------------|--------|
| Status summary pills | Shows count for Open / In Progress / Completed / Verified |
| Filter by status | Click a pill to filter list to that status |
| Action item card — title | The action item title |
| Action item card — description | Expanded details |
| Action item card — status badge | Color-coded pill: Open (gray) / In Progress (blue) / Completed (amber) / Verified (emerald) |
| Action item card — owner | Avatar initials + name (top right of card) |
| Action item card — due date | Displayed as relative date ("Due Today", "Due This Sprint", "Overdue") |
| Action item card — source feedback quote | Inset quote block showing originating feedback |
| Action item card — "Advance Status" button | Moves item to next status in sequence |
| Status sequence | Open → In Progress → Completed → [Verify Impact modal] → Verified |
| Verify Impact modal | Shown when advancing from Completed → Verified; requires a written impact description |
| Verified Impact display | Emerald inset block on verified cards showing the impact text |

#### Status Transition Rules
| From | To | Button Label | Additional Action |
|------|----|-------------|-------------------|
| Open | In Progress | "Start Work" | None |
| In Progress | Completed | "Mark Complete" | None |
| Completed | Verified | "Verify Impact" | Opens impact description modal |

#### Verify Impact Modal
| Field/Feature | Detail |
|--------------|--------|
| Impact description textarea | Required; min 20 chars; prompt: "Describe the measurable improvement achieved" |
| Example placeholder | "e.g. Deploy success rate improved from 70% → 95%" |
| Submit button | Saves impact text, sets status to Verified |
| Cancel button | Closes without status change |

#### Dashboard Page
| Field/Feature | Detail |
|--------------|--------|
| Feedback Count card | Count of all feedback items for active sprint in user's pod |
| Total Upvotes card | Sum of upvote counts across all feedback in active sprint |
| Action Items card | Count of all action items in active sprint |
| Completion Rate card | (Completed + Verified) / Total action items × 100% |
| Recent Feedback list | Last 3 feedback items submitted (newest first), with category color, text, author, time ago |
| Activity Feed | Last 5 actions: feedback submitted, upvotes received, action created, status advanced, impact verified — with actor name and action description |

#### Sprint Management (Scope 2)
| Field/Feature | Detail |
|--------------|--------|
| Active sprint label | Shown in sidebar and page headers (e.g. "Sprint 42") |
| Sprint name | Configured once per pod (hardcoded or simple admin input) |
| Sprint date range | Start and end date, shown in digest header |
| Sprint scoping | All feedback and actions are tagged to a sprint; users see active sprint by default |

#### Persistence (Scope 2)
- **Primary**: localStorage (same as Scope 1)
- **Stretch goal**: Replit DB or simple JSON-server backend so data is shared across devices/users on the same pod
- Without shared backend, each user sees only their own submitted data on their device

> ⚠️ **Key limitation of localStorage-only**: User A on Machine A cannot see User B's feedback on Machine B. A shared backend is required for real multi-user use. This is the #1 upgrade from Scope 1 → Scope 2.

### Data Model (Scope 2, extends Scope 1)
```typescript
type ActionItem = {
  id: string;                // uuid
  podId: string;
  sprintId: string;
  title: string;
  description?: string;
  status: "open" | "in-progress" | "completed" | "verified";
  ownerId: string;           // user uuid
  sourceFeedbackId: string;  // feedback uuid this was created from
  dueDate: string;           // ISO date string
  verifiedImpact?: string;   // filled in at verification step
  completedAt?: string;      // ISO timestamp
  verifiedAt?: string;       // ISO timestamp
  createdAt: string;
  createdById: string;       // user uuid who converted feedback to action
}

type Sprint = {
  id: string;
  podId: string;
  name: string;              // e.g. "Sprint 42"
  startDate: string;
  endDate: string;
  isActive: boolean;
}
```

---

## Scope 3 — Full Gamified MVP

**Goal**: Prove that points and leaderboard change behavior — more people participate, more action items get closed.  
**Target Timeline**: Week 5–6 (builds on Scope 2)  
**Success Metric**: Did gamification increase participation rate vs. Scope 1/2 baseline?

### Pages Included
- All Scope 2 pages
- Leaderboard (wired)
- Sprint Digest (wired)
- Sprint selector (switch between past sprints)

### Feature Specification

#### Everything in Scope 2, PLUS:

#### Points System
| Action | Points Awarded | Awarded To |
|--------|---------------|-----------|
| Submit feedback | +10 | Submitter |
| Receive an upvote on feedback | +5 | Feedback author |
| Convert feedback to action item | +50 | Converter |
| Complete an action item | +100 | Owner |
| Verify an action item with impact | +150 | Verifier |

#### Points Display
| Location | What's Shown |
|----------|-------------|
| Sidebar (bottom) | Current user's total sprint points with ⚡ icon |
| Dashboard — MVP Banner | Sprint leader's name + sprint points |
| Leaderboard | Full ranked list |

#### Leaderboard Page
| Field/Feature | Detail |
|--------------|--------|
| Rank #1 card | Gold gradient, Trophy icon, "Sprint MVP" badge, name, badges earned, sprint points + all-time points |
| Rank #2 card | Silver gradient, Medal icon, name, badges, points |
| Rank #3 card | Bronze gradient, Medal icon, name, badges, points |
| Ranks 4+ cards | Plain dark card, # rank number, avatar initials, name, badges, points |
| "Points Guide" sidebar card | Lists every point-earning action and its value |
| "Badges" sidebar card | Lists all badges with icon, name, and earn condition |

#### Badge Definitions
| Badge | Icon | Earn Condition |
|-------|------|---------------|
| Feedback Machine | 🗣️ | Submit 10+ feedback items in a sprint |
| Action Taker | 🏃 | Complete 3+ action items in a sprint |
| Innovator | 💡 | Receive 20+ upvotes on idea-category feedback |
| Problem Solver | 🔧 | Convert a "Slowed Us Down" feedback to a completed action item |
| Consensus Builder | 🤝 | Have a feedback item reach 10+ upvotes |
| Sprint Champion | 👑 | Finish as Sprint MVP |

#### Sprint Digest Page
| Field/Feature | Detail |
|--------------|--------|
| Hero banner | Sprint name, date range, 4 stat chips (Total Feedback / Actions Created / Actions Completed / Points Awarded) |
| Sprint MVP banner | Trophy icon, MVP name, sprint points, optional quote |
| Category breakdown cards | 3 mini stat cards: Slowed Down count / Should Try count / Went Well count; each shows delta vs. previous sprint |
| Top Voted Feedback list | Top 5 feedback items by upvote count; shows rank, text, author, upvote count |
| Verified Improvements section | All action items in Verified status; shows title, verified impact quote, owner |
| Action Items status list | Full list of all actions with their final status |

#### Sprint Selector
| Field/Feature | Detail |
|--------------|--------|
| Location | Sidebar or header dropdown |
| Options | Active sprint + all completed sprints for user's pod |
| Behavior | Switching sprint updates all page data to show that sprint's data |
| Default | Always opens to active sprint |

#### Real Authentication (Scope 3 stretch)
| Feature | Detail |
|---------|--------|
| Microsoft SSO | Optional; replaces name-entry registration |
| Email + password | Alternative if SSO is not available |
| Session persistence | JWT or session cookie instead of localStorage |

#### Real Database (Scope 3)
| Option | Detail |
|--------|--------|
| PostgreSQL (preferred) | Full relational DB on Azure or Replit |
| Replit DB | Simple key-value store; faster to set up but limited querying |
| Supabase | PostgreSQL with REST API; free tier sufficient for 30 users |

### Data Model (Scope 3, extends Scope 2)
```typescript
type PointEvent = {
  id: string;
  userId: string;
  podId: string;
  sprintId: string;
  action: "submit_feedback" | "receive_upvote" | "convert_action" | "complete_action" | "verify_action";
  points: number;
  referenceId: string;   // ID of the feedback or action item that triggered the event
  createdAt: string;
}

type Badge = {
  id: string;
  userId: string;
  podId: string;
  sprintId: string;
  type: "feedback_machine" | "action_taker" | "innovator" | "problem_solver" | "consensus_builder" | "sprint_champion";
  earnedAt: string;
}
```

---

## Feature Comparison Matrix

| Feature | Scope 1 | Scope 2 | Scope 3 |
|---------|:-------:|:-------:|:-------:|
| Registration (name + username + pod) | ✅ | ✅ | ✅ |
| Feedback Board — 3 columns | ✅ | ✅ | ✅ |
| Feedback submission form | ✅ | ✅ | ✅ |
| Reframe rule (suggestion required) | ✅ | ✅ | ✅ |
| Anonymous toggle | ✅ | ✅ | ✅ |
| Upvoting (1 vote/user/item) | ✅ | ✅ | ✅ |
| Convert feedback → Action Item | ❌ | ✅ | ✅ |
| Action Items page | ❌ | ✅ | ✅ |
| Status progression (4 stages) | ❌ | ✅ | ✅ |
| Verify Impact modal | ❌ | ✅ | ✅ |
| Dashboard with real stats | ❌ | ✅ | ✅ |
| Activity feed | ❌ | ✅ | ✅ |
| Sprint management | ❌ | ✅ | ✅ |
| Points system | ❌ | ❌ | ✅ |
| Leaderboard | ❌ | ❌ | ✅ |
| Badges | ❌ | ❌ | ✅ |
| Sprint Digest page | ❌ | ❌ | ✅ |
| Sprint selector (history) | ❌ | ❌ | ✅ |
| Shared backend / real DB | ❌ | ⚠️ stretch | ✅ |
| Real authentication | ❌ | ❌ | ⚠️ stretch |
| Pod isolation | ✅ | ✅ | ✅ |

---

## Current Replit Code Audit — Field by Field

### Dashboard.tsx — All Fields
| Field | Current State | Scope 2 Target |
|-------|--------------|----------------|
| Feedback Count "42" | ❌ Hardcoded | Calculate from real feedback data |
| Total Upvotes "156" | ❌ Hardcoded | Sum upvote arrays across all feedback |
| Action Items "12" | ❌ Hardcoded | Count from action items store |
| Completion Rate "85%" | ❌ Hardcoded | (completed + verified) / total × 100 |
| Sprint MVP "Alex Chen / 3,450 pts" | ❌ Hardcoded (Scope 3 feature) | Show in Scope 3; hide in Scope 2 |
| Recent Feedback (3 items) | ❌ Hardcoded | Derive from real feedback, sorted by createdAt desc |
| Activity Feed (4 items) | ❌ Hardcoded | Derive from real events |
| "Jane Doe" logged in | ❌ Hardcoded | Read from localStorage user record |
| "Sprint 42" label | ❌ Hardcoded | Read from active sprint record |

### FeedbackBoard.tsx — All Fields
| Field | Current State | Scope 2 Target |
|-------|--------------|----------------|
| Column 1 "What Slowed Us Down?" | ✅ Visual done | Filter real feedback by category="slowed" |
| Column 2 "What Should We Try?" | ✅ Visual done | Filter real feedback by category="try" |
| Column 3 "What Went Well?" | ✅ Visual done | Filter real feedback by category="well" |
| Column item count badge | ✅ Visual done | Show real count |
| Card text | ❌ Hardcoded | From real feedback.text |
| Card author | ❌ Hardcoded | From user lookup by feedback.authorId; masked if anonymous |
| Card upvote count | ❌ Hardcoded | feedback.upvotes.length |
| Upvote button interaction | ❌ Does nothing | Toggle user UUID in feedback.upvotes array |
| Upvote — already voted state | ❌ Missing | Check if current user UUID in upvotes array; show amber state |
| Upvote — own feedback | ❌ Missing | Disable button if feedback.authorId === currentUser.id |
| Suggested Improvement block | ✅ Visual done | Show if feedback.suggestion exists |
| Anonymous display | ✅ Visual done | Show masked icon if feedback.isAnonymous |
| "Submit Feedback" button | ❌ Does nothing | Open submission modal |
| "→ Action" button on high-voted | ❌ Does nothing | Open Create Action modal |
| "→ Action" visibility threshold | ❌ Missing | Show if upvotes >= 3 (Scope 2) |

### ActionItems.tsx — All Fields
| Field | Current State | Scope 2 Target |
|-------|--------------|----------------|
| Status pills (Open/In Progress/etc.) | ✅ Visual done | Show real counts |
| Filter by status (click pill) | ❌ Does nothing | Filter displayed list |
| Action card title | ❌ Hardcoded | From real actionItem.title |
| Action card description | ❌ Hardcoded | From real actionItem.description |
| Action card status badge | ✅ Visual done | Driven by real actionItem.status |
| Action card owner | ❌ Hardcoded | From user lookup by actionItem.ownerId |
| Action card due date | ❌ Hardcoded | Formatted from actionItem.dueDate |
| Source feedback quote | ✅ Visual done | From real feedback lookup by actionItem.sourceFeedbackId |
| "Advance Status" button | ❌ Does nothing | Transition status through sequence |
| Verified Impact block | ✅ Visual done | Show when status="verified", display actionItem.verifiedImpact |
| Verify Impact modal | ❌ Missing | New component required |

### Leaderboard.tsx — All Fields (Scope 3)
| Field | Current State | Scope 3 Target |
|-------|--------------|----------------|
| Rank #1 card (Alex Chen / 3,450 pts) | ❌ Hardcoded | Calculate from PointEvents |
| Rank #2 card (Sarah J.) | ❌ Hardcoded | Calculate from PointEvents |
| Rank #3 card (David K.) | ❌ Hardcoded | Calculate from PointEvents |
| Ranks 4–5 | ❌ Hardcoded | Calculate from PointEvents |
| "Sprint MVP" badge | ❌ Hardcoded | Awarded to rank #1 |
| User badges chips | ❌ Hardcoded | Derived from Badge records |
| Points Guide values | ✅ Shown | Values differ from spec; update to match |
| Badges list | ✅ Shown | Add all 6 badge types from spec |

### SprintDigest.tsx — All Fields (Scope 3)
| Field | Current State | Scope 3 Target |
|-------|--------------|----------------|
| "Sprint 41 / Titanium Release" | ❌ Hardcoded | From active sprint record |
| Total Feedback chip "42" | ❌ Hardcoded | Count from real feedback |
| Actions Created chip "12" | ❌ Hardcoded | Count from real action items |
| Actions Completed chip "8" | ❌ Hardcoded | Count where status in (completed, verified) |
| Points Awarded chip "2,450" | ❌ Hardcoded (Scope 3) | Sum from PointEvents |
| Sprint MVP banner | ❌ Hardcoded | Rank #1 from PointEvents |
| Slowed Down count "8 items" | ❌ Hardcoded | Count feedback where category="slowed" |
| Should Try count "15 ideas" | ❌ Hardcoded | Count feedback where category="try" |
| Went Well count "19 wins" | ❌ Hardcoded | Count feedback where category="well" |
| Delta vs. last sprint labels | ❌ Hardcoded | Compare with previous sprint data |
| Top Voted Feedback list | ❌ Hardcoded | Sort feedback by upvotes.length desc, take top 5 |
| Verified Improvements | ❌ Hardcoded | Filter action items where status="verified" |

---

## Build Order (Scope 2)

1. **Data layer** — `useRetroStore` (React Context or Zustand) with all types, localStorage persistence, and mock seed data
2. **Registration screen** — one-time form, saves user to localStorage
3. **Feedback submission form** — modal component with reframe rule enforcement
4. **Feedback Board wired** — reads from store, upvote logic, category filtering
5. **Convert to Action modal** — owner selector, due date, source link
6. **Action Items page wired** — reads from store, status transitions, verify modal
7. **Dashboard wired** — all 4 stats derived from store, recent feedback, activity feed
8. **Pod filtering** — all queries scoped to current user's podId
9. **Stretch: shared backend** — replace localStorage with Replit DB or Supabase so data is shared across devices

---

*Document authored by Cascade · RetroBoard project · March 2026*
