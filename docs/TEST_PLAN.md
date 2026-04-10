# Test Plan — Sprint 1: Foundation

**Mode**: [TEST]  
**Sprint**: 1 — Types, MongoDB Data Layer, Registration, Dashboard  
**References**: `docs/IMPLEMENTATION_PLAN.md`, `docs/FEATURE_REQUIREMENTS.md`, `docs/ARCHITECTURE_DESIGN.md`  
**Date**: April 10, 2026

---

## Table of Contents

1. [Jest Setup Requirements](#jest-setup-requirements)
2. [Testing Library Setup](#testing-libraryre-setup)
3. [Global Mock Strategy](#global-mock-strategy)
4. [Test File: `userApi.test.ts`](#test-file-userapitestts)
5. [Test File: `registration.test.tsx`](#test-file-registrationtesttsx)
6. [Test File: `dashboard.test.tsx`](#test-file-dashboardtesttsx)
7. [Acceptance Criteria Coverage Matrix](#acceptance-criteria-coverage-matrix)
8. [Gap Analysis — Untested ACs](#gap-analysis--untested-acs)

---

## Jest Setup Requirements

### `jest.config.js`

The following configuration is required before any test file can execute.

```js
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.ts',
    '<rootDir>/src/__tests__/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    'src/services/**/*.ts',
    'src/app/page.tsx',
    'src/app/dashboard/page.tsx',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

**Key requirements:**

- **`testEnvironment: 'jest-environment-jsdom'`** — required for all `.tsx` tests that render React components and access `sessionStorage`, `window`, and DOM APIs.
- **`moduleNameMapper` for `@/`** — resolves path alias used throughout the codebase (`@/lib/db`, `@/services/userService`, etc.).
- **`next/jest` wrapper** — provides automatic transforms for Next.js App Router files, including `"use client"` directives and the `next/navigation` module.

### `jest.setup.ts`

```ts
// jest.setup.ts
import '@testing-library/jest-dom'
```

**Purpose**: Imports the `@testing-library/jest-dom` matchers globally so assertions like `toBeInTheDocument()`, `toBeDisabled()`, and `toHaveTextContent()` are available in every test file without per-file imports.

### Required packages (pre-sprint checklist item P-6)

| Package | Version | Purpose |
|---|---|---|
| `jest` | `^29.x` | Test runner |
| `jest-environment-jsdom` | `^29.x` | DOM environment for React component tests |
| `ts-jest` or `next/jest` transform | bundled with `next` | TypeScript + Next.js transform |
| `@testing-library/react` | `^14.x` | Component render utilities |
| `@testing-library/jest-dom` | `^6.x` | Custom DOM matchers |
| `@testing-library/user-event` | `^14.x` | Realistic user interaction simulation |

---

## Testing Library Setup

### Per-file imports required in `.tsx` test files

```ts
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
```

- **`render`** — mounts the component into a jsdom document.
- **`screen`** — provides queries (`getByRole`, `getByLabelText`, `getByText`, `queryByText`) on the rendered output.
- **`fireEvent`** — dispatches synthetic DOM events (click, change).
- **`waitFor`** — polls assertions until they pass, needed for async `useEffect` and state updates.
- **`act`** — wraps state-triggering operations; required when testing components that have async side effects (API fetches, router redirects).

### `next/navigation` mock pattern

The `next/navigation` module must be mocked globally at the top of every `.tsx` test file that renders a page component using `useRouter` or `usePathname`. The mock must be declared **before any import of the component under test**.

```ts
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/current-path',
}))
```

**Why**: Next.js App Router hooks throw an error outside of the Next.js rendering context. The mock replaces them with plain functions that can be observed in tests.

---

## Global Mock Strategy

The following mocks are shared across test files and should be understood before reading individual test cases.

### 1. `src/lib/db.ts` mock

```ts
jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}))
```

**Purpose**: Prevents any real MongoDB connection attempt. `connectDB` becomes a no-op that resolves immediately. Required for all `userApi.test.ts` tests.

### 2. `src/lib/models/User.ts` mock

```ts
jest.mock('@/lib/models/User', () => {
  const mockSave = jest.fn()
  const MockUserModel = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'mock-id-123',
    isAdmin: data.isAdmin,
    save: mockSave,
  }))
  MockUserModel.find = jest.fn()
  MockUserModel.countDocuments = jest.fn()
  return { default: MockUserModel }
})
```

**Purpose**: Replaces the Mongoose model with a controllable constructor + static methods. `countDocuments` return value controls the `isAdmin` branch in `POST /api/users`.

### 3. `src/services/userService.ts` mock

```ts
jest.mock('@/services/userService', () => ({
  registerUser: jest.fn(),
  getCurrentUser: jest.fn(),
  cacheUser: jest.fn(),
  getAllUsers: jest.fn(),
}))
```

**Purpose**: Decouples Registration and Dashboard page tests from real `fetch()` calls and `sessionStorage`. Each test configures return values with `mockResolvedValue` / `mockReturnValue`.

### 4. `global.fetch` mock

```ts
global.fetch = jest.fn()
```

**Purpose**: Intercepts all `fetch()` calls made by `actionService.getActions()` and direct dashboard fetches. Configured per-test with `(global.fetch as jest.Mock).mockResolvedValue(...)`.

### 5. `sessionStorage` seeding pattern

```ts
beforeEach(() => {
  sessionStorage.clear()
})

// Within individual tests that require a logged-in user:
sessionStorage.setItem('retroboard_user', JSON.stringify({
  _id: 'user-1',
  name: 'Jane Doe',
  username: 'jdoe',
  pod: 'pod1',
  isAdmin: false,
  createdAt: '2026-04-01T00:00:00.000Z',
}))
```

**Why**: jsdom's `sessionStorage` is shared within a test file. Clearing in `beforeEach` prevents state leakage between tests that test the "no user" redirect path and tests that test the authenticated-user render path.

---

## Test File: `userApi.test.ts`

**File path**: `src/__tests__/userApi.test.ts`  
**Target implementation**: `src/app/api/users/route.ts`  
**AC coverage**: AC-1.1.4, AC-1.2.4

### Mocks required

| Mock target | Method | Configuration |
|---|---|---|
| `@/lib/db` | `connectDB` | No-op, resolves immediately |
| `@/lib/models/User` (default export) | `find` | Returns mock array |
| `@/lib/models/User` (default export) | `countDocuments` | Returns `0` or `1` per test |
| `@/lib/models/User` (default export) | constructor + `save` | Returns mock document |

### Test request helper pattern

Because Next.js App Router route handlers receive a `NextRequest` object (not a plain `Request`), tests construct requests as follows:

```ts
import { NextRequest } from 'next/server'

function makeGETRequest(url = 'http://localhost/api/users') {
  return new NextRequest(url, { method: 'GET' })
}

function makePOSTRequest(body: object, url = 'http://localhost/api/users') {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}
```

---

### UA-1 — `GET /api/users` returns HTTP 200 with a JSON array

| Field | Value |
|---|---|
| **Test ID** | UA-1 |
| **AC** | AC-1.1.4 |
| **Description** | `GET /api/users` returns HTTP 200 with a JSON array body |

**Inputs**:
- HTTP method: `GET`
- No request body

**Mock setup**:
```ts
UserModel.find.mockResolvedValue([
  { _id: 'u1', name: 'Alice', username: 'alice', pod: 'pod1', isAdmin: true },
  { _id: 'u2', name: 'Bob',   username: 'bob',   pod: 'pod2', isAdmin: false },
])
```

**Expected assertions**:
- `response.status === 200`
- `const body = await response.json()` → `Array.isArray(body) === true`
- `body.length === 2`

---

### UA-2 — `POST /api/users` with valid body returns HTTP 201 and document

| Field | Value |
|---|---|
| **Test ID** | UA-2 |
| **AC** | AC-1.1.4 |
| **Description** | `POST /api/users` with a complete `{ name, username, pod }` payload returns HTTP 201 and the created document |

**Inputs**:
```json
{ "name": "Alice", "username": "alice", "pod": "pod1" }
```

**Mock setup**:
```ts
UserModel.countDocuments.mockResolvedValue(1)  // non-zero — not first user
const mockSave = jest.fn().mockResolvedValue(undefined)
UserModel.mockImplementation((data) => ({ ...data, _id: 'u2', save: mockSave }))
```

**Expected assertions**:
- `response.status === 201`
- `body.name === 'Alice'`
- `body.username === 'alice'`
- `body.pod === 'pod1'`
- `mockSave` called exactly once

---

### UA-3 — First `POST` sets `isAdmin: true`

| Field | Value |
|---|---|
| **Test ID** | UA-3 |
| **AC** | AC-1.1.4, AC-1.2.4 |
| **Description** | When the user collection is empty (`countDocuments` returns `0`), the first `POST /api/users` creates a document with `isAdmin: true` |

**Inputs**:
```json
{ "name": "Alice", "username": "alice", "pod": "pod1" }
```

**Mock setup**:
```ts
UserModel.countDocuments.mockResolvedValue(0)  // empty collection
```

**Expected assertions**:
- `response.status === 201`
- `body.isAdmin === true`

---

### UA-4 — Second `POST` sets `isAdmin: false`

| Field | Value |
|---|---|
| **Test ID** | UA-4 |
| **AC** | AC-1.1.4, AC-1.2.4 |
| **Description** | When the user collection already has one or more users (`countDocuments` returns `1`), `POST /api/users` creates a document with `isAdmin: false` |

**Inputs**:
```json
{ "name": "Bob", "username": "bob", "pod": "pod2" }
```

**Mock setup**:
```ts
UserModel.countDocuments.mockResolvedValue(1)  // one existing user
```

**Expected assertions**:
- `response.status === 201`
- `body.isAdmin === false`

---

### UA-5 — `POST /api/users` missing `name` → HTTP 400

| Field | Value |
|---|---|
| **Test ID** | UA-5 |
| **AC** | AC-1.1.4 |
| **Description** | `POST /api/users` with `name` field absent returns HTTP 400 |

**Inputs**:
```json
{ "username": "alice", "pod": "pod1" }
```

**Mock setup**: No model mock calls expected (validation short-circuits before DB).

**Expected assertions**:
- `response.status === 400`
- `body.error` is a non-empty string

---

### UA-6 — `POST /api/users` missing `username` → HTTP 400

| Field | Value |
|---|---|
| **Test ID** | UA-6 |
| **AC** | AC-1.1.4 |
| **Description** | `POST /api/users` with `username` field absent returns HTTP 400 |

**Inputs**:
```json
{ "name": "Alice", "pod": "pod1" }
```

**Mock setup**: No model mock calls expected.

**Expected assertions**:
- `response.status === 400`
- `body.error` is a non-empty string

---

### UA-7 — `POST /api/users` missing `pod` → HTTP 400 *(recommended addition)*

> **Note**: This case is implied by AC-1.1.4 ("Missing required fields return HTTP 400") but was not explicitly listed in the Implementation Plan. It is recommended to include it for completeness.

**Inputs**:
```json
{ "name": "Alice", "username": "alice" }
```

**Expected assertions**:
- `response.status === 400`

---

## Test File: `registration.test.tsx`

**File path**: `src/__tests__/registration.test.tsx`  
**Target implementation**: `src/app/page.tsx` (Registration page)  
**AC coverage**: AC-1.2.1, AC-1.2.2, AC-1.2.3, AC-1.2.5, AC-1.2.6, AC-UI-1.2.2

### Mocks required

| Mock target | Method | Notes |
|---|---|---|
| `next/navigation` | `useRouter` → `{ push: mockPush }` | Must be declared before component import |
| `@/services/userService` | `registerUser`, `getCurrentUser`, `cacheUser` | Full module mock |

### `beforeEach` setup

```ts
beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  ;(getCurrentUser as jest.Mock).mockReturnValue(null)  // default: no cached user
})
```

---

### REG-1 — Renders page with 3 form fields

| Field | Value |
|---|---|
| **Test ID** | REG-1 |
| **AC** | AC-1.2.1 |
| **Description** | The Registration page renders at `/` with a "Your Name" text input, a "Username" text input, and a "Pod" select |

**Inputs**: Component rendered with no pre-conditions.

**Mock setup**: `getCurrentUser.mockReturnValue(null)` (no redirect)

**Expected assertions**:
- `screen.getByLabelText(/your name/i)` is in the document
- `screen.getByLabelText(/username/i)` is in the document
- A pod selector element (role `combobox` or label matching `/pod/i`) is in the document

---

### REG-2 — Pod selector has exactly 3 options

| Field | Value |
|---|---|
| **Test ID** | REG-2 |
| **AC** | AC-1.2.2 |
| **Description** | The Pod selector renders exactly 3 options: Pod 1 (`pod1`), Pod 2 (`pod2`), Pod 3 (`pod3`) |

**Inputs**: Component rendered with no pre-conditions.

**Mock setup**: `getCurrentUser.mockReturnValue(null)`

**Expected assertions**:

> **Note**: shadcn/ui `Select` renders options inside a `SelectContent` popover that is not part of the initial DOM until the trigger is clicked. The test must open the dropdown first:
```ts
fireEvent.click(screen.getByRole('combobox'))
```
- `screen.getByText('Pod 1')` is in the document
- `screen.getByText('Pod 2')` is in the document
- `screen.getByText('Pod 3')` is in the document
- No fourth option is present (query returns exactly 3 items with role `option`)

---

### REG-3 — Submit button disabled when any field is empty

| Field | Value |
|---|---|
| **Test ID** | REG-3 |
| **AC** | AC-UI-1.2.2 |
| **Description** | The "Join RetroBoard" button is disabled with 0, 1, and 2 fields filled |

**Inputs**: Partial form fill sequences.

**Mock setup**: `getCurrentUser.mockReturnValue(null)`

**Steps and assertions**:

| State | Filled fields | Expected |
|---|---|---|
| Initial render | 0 of 3 | `getByRole('button', { name: /join retroboard/i })` has `disabled` attribute |
| Name filled only | 1 of 3 | Button still `disabled` |
| Name + Username filled | 2 of 3 | Button still `disabled` |

```ts
// Fill name only
fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Alice' } })
expect(screen.getByRole('button', { name: /join retroboard/i })).toBeDisabled()

// Fill name + username
fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } })
expect(screen.getByRole('button', { name: /join retroboard/i })).toBeDisabled()
```

---

### REG-4 — Submit button enabled when all 3 fields filled

| Field | Value |
|---|---|
| **Test ID** | REG-4 |
| **AC** | AC-UI-1.2.2 |
| **Description** | The "Join RetroBoard" button is enabled only when all 3 fields (name, username, pod) are filled |

**Inputs**: Complete form fill.

**Mock setup**: `getCurrentUser.mockReturnValue(null)`

**Steps**:
```ts
fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Alice' } })
fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } })
// open select and pick a pod
fireEvent.click(screen.getByRole('combobox'))
fireEvent.click(screen.getByText('Pod 1'))
```

**Expected assertions**:
- `screen.getByRole('button', { name: /join retroboard/i })` does NOT have `disabled` attribute (`not.toBeDisabled()`)

---

### REG-5 — Submitting form calls `userService.registerUser` with correct payload

| Field | Value |
|---|---|
| **Test ID** | REG-5 |
| **AC** | AC-1.2.3 |
| **Description** | Clicking "Join RetroBoard" after filling all fields calls `registerUser` with `{ name, username, pod }` |

**Inputs**:
```ts
name: 'Alice', username: 'alice', pod: 'pod1'
```

**Mock setup**:
```ts
(registerUser as jest.Mock).mockResolvedValue({
  _id: 'u1', name: 'Alice', username: 'alice', pod: 'pod1', isAdmin: false, createdAt: '...'
})
```

**Steps**: Fill all 3 fields (as in REG-4) → click submit button.

**Expected assertions**:
```ts
await waitFor(() => {
  expect(registerUser).toHaveBeenCalledWith({ name: 'Alice', username: 'alice', pod: 'pod1' })
  expect(registerUser).toHaveBeenCalledTimes(1)
})
```

---

### REG-6 — On successful registration, `cacheUser` is called with the returned user

| Field | Value |
|---|---|
| **Test ID** | REG-6 |
| **AC** | AC-1.2.5 |
| **Description** | After `registerUser` resolves with a user object, `cacheUser` is called with that same object |

**Inputs**: Same as REG-5.

**Mock setup**:
```ts
const mockUser = { _id: 'u1', name: 'Alice', username: 'alice', pod: 'pod1', isAdmin: false, createdAt: '...' }
;(registerUser as jest.Mock).mockResolvedValue(mockUser)
```

**Expected assertions**:
```ts
await waitFor(() => {
  expect(cacheUser).toHaveBeenCalledWith(mockUser)
  expect(cacheUser).toHaveBeenCalledTimes(1)
})
```

---

### REG-7 — On successful registration, `router.push('/dashboard')` is called

| Field | Value |
|---|---|
| **Test ID** | REG-7 |
| **AC** | AC-1.2.5 |
| **Description** | After successful registration and caching, the router redirects to `/dashboard` |

**Inputs**: Same as REG-5.

**Mock setup**: Same as REG-6.

**Expected assertions**:
```ts
await waitFor(() => {
  expect(mockPush).toHaveBeenCalledWith('/dashboard')
  expect(mockPush).toHaveBeenCalledTimes(1)
})
```

---

### REG-8 — If sessionStorage has existing user on mount, redirects to `/dashboard`

| Field | Value |
|---|---|
| **Test ID** | REG-8 |
| **AC** | AC-1.2.6 |
| **Description** | When `getCurrentUser` returns a non-null user on mount (cached session), the page calls `router.push('/dashboard')` without the user submitting the form |

**Inputs**: Pre-seeded user in sessionStorage.

**Mock setup**:
```ts
;(getCurrentUser as jest.Mock).mockReturnValue({
  _id: 'u1', name: 'Alice', username: 'alice', pod: 'pod1', isAdmin: false, createdAt: '...'
})
```

**Steps**: Render the component — no user interaction required.

**Expected assertions**:
```ts
await waitFor(() => {
  expect(mockPush).toHaveBeenCalledWith('/dashboard')
})
// registerUser should NOT have been called
expect(registerUser).not.toHaveBeenCalled()
```

---

## Test File: `dashboard.test.tsx`

**File path**: `src/__tests__/dashboard.test.tsx`  
**Target implementation**: `src/app/dashboard/page.tsx`, `src/services/actionService.ts`  
**AC coverage**: AC-1.3.1, AC-1.3.2, AC-1.3.3, AC-1.3.4, AC-1.3.5

### Mocks required

| Mock target | Method | Notes |
|---|---|---|
| `next/navigation` | `useRouter` → `{ push: mockPush }`, `usePathname` → `'/dashboard'` | Must be declared before component import |
| `@/services/userService` | `getCurrentUser` | Controls auth guard |
| `@/services/actionService` | `getActions`, `getCompletionRate`, `getOpenCount`, `getCompletedCount` | Controls stat card values |
| `global.fetch` | — | Intercepts `/api/sprints` call |
| `@/components/layout/Shell` | default export | Renders children only — avoids `sessionStorage`/`usePathname` complexity inside Shell |

### Shell mock pattern

```ts
jest.mock('@/components/layout/Shell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))
```

**Why**: `Shell.tsx` itself reads `sessionStorage` and calls `usePathname`. Mocking it as a passthrough wrapper isolates the Dashboard test to only the `dashboard/page.tsx` behavior.

### Shared mock data

```ts
const mockUser = {
  _id: 'user-1', name: 'Jane Doe', username: 'jdoe', pod: 'pod1', isAdmin: false, createdAt: '2026-04-01T00:00:00.000Z'
}

const mockSprint = {
  _id: 'sprint-1', name: 'Sprint 42', goal: 'Ship it', status: 'open',
  startDate: '2026-04-01T00:00:00.000Z', endDate: '2026-04-14T00:00:00.000Z',
  teamMemberIds: ['user-1'],
}

const mockActions = [
  { _id: 'a1', title: 'Fix bug', status: 'completed',  sprintId: 'sprint-1', ownerId: 'user-1', createdAt: '...' },
  { _id: 'a2', title: 'Write docs', status: 'open',     sprintId: 'sprint-1', ownerId: 'user-1', createdAt: '...' },
  { _id: 'a3', title: 'Review PR', status: 'verified',  sprintId: 'sprint-1', ownerId: 'user-1', createdAt: '...' },
  { _id: 'a4', title: 'Deploy',   status: 'in-progress', sprintId: 'sprint-1', ownerId: 'user-1', createdAt: '...' },
  { _id: 'a5', title: 'Retro',    status: 'completed',  sprintId: 'sprint-1', ownerId: 'user-1', createdAt: '...' },
]
```

### `beforeEach` setup

```ts
beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  ;(getActions as jest.Mock).mockResolvedValue(mockActions)
  ;(getCompletionRate as jest.Mock).mockReturnValue(60)
  ;(getOpenCount as jest.Mock).mockReturnValue(2)
  ;(getCompletedCount as jest.Mock).mockReturnValue(3)
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => mockSprint,
  })
})
```

---

### DB-1 — Renders without crash when sessionStorage has valid user and API returns active sprint

| Field | Value |
|---|---|
| **Test ID** | DB-1 |
| **AC** | AC-1.3.1 |
| **Description** | The Dashboard page mounts without throwing when a valid user is cached and the sprint API returns an active sprint |

**Inputs**: Default `beforeEach` mock state (valid user + active sprint).

**Expected assertions**:
```ts
const { container } = render(<DashboardPage />)
await waitFor(() => {
  expect(container).toBeTruthy()
  expect(screen.getByTestId('shell')).toBeInTheDocument()
})
// No error thrown, no redirect to '/'
expect(mockPush).not.toHaveBeenCalledWith('/')
```

---

### DB-2 — Redirects to `/` when sessionStorage has no user

| Field | Value |
|---|---|
| **Test ID** | DB-2 |
| **AC** | AC-1.3.1 |
| **Description** | If `getCurrentUser` returns `null` on mount, the page redirects to `/` (registration) |

**Inputs**: No cached user.

**Mock setup**:
```ts
;(getCurrentUser as jest.Mock).mockReturnValue(null)
```

**Expected assertions**:
```ts
render(<DashboardPage />)
await waitFor(() => {
  expect(mockPush).toHaveBeenCalledWith('/')
})
```

---

### DB-3 — Renders 4 stat cards with correct labels when sprint is active

| Field | Value |
|---|---|
| **Test ID** | DB-3 |
| **AC** | AC-1.3.2, AC-1.3.3 |
| **Description** | When an active sprint is returned, all 4 stat card labels appear in the DOM: "Feedback Count", "Total Upvotes", "Action Items", "Completion Rate" |

**Inputs**: Default `beforeEach` mock state.

**Expected assertions**:
```ts
await waitFor(() => {
  expect(screen.getByText('Feedback Count')).toBeInTheDocument()
  expect(screen.getByText('Total Upvotes')).toBeInTheDocument()
  expect(screen.getByText('Action Items')).toBeInTheDocument()
  expect(screen.getByText('Completion Rate')).toBeInTheDocument()
})
```

> **Note on AC-1.3.2**: The implementation plan references displaying `sprint.name` and formatted date range. The sprint name assertion (`screen.getByText('Sprint 42')`) should also be included here to cover AC-1.3.2 explicitly. This is noted in the gap analysis below.

---

### DB-4 — Displays correct Completion Rate from mock action data

| Field | Value |
|---|---|
| **Test ID** | DB-4 |
| **AC** | AC-1.3.4 |
| **Description** | With 2 `completed` + 1 `verified` out of 5 total actions, the Completion Rate renders as `60%` |

**Inputs**: `mockActions` has 5 items: 2 `completed`, 1 `verified`, 1 `open`, 1 `in-progress` → rate = `Math.round((3/5)*100)` = `60`.

**Mock setup**:
```ts
;(getCompletionRate as jest.Mock).mockReturnValue(60)
```

**Expected assertions**:
```ts
await waitFor(() => {
  expect(screen.getByText('60%')).toBeInTheDocument()
})
```

---

### DB-5 — Renders empty state when no active sprint returned

| Field | Value |
|---|---|
| **Test ID** | DB-5 |
| **AC** | AC-1.3.5 |
| **Description** | When `GET /api/sprints` returns no active sprint, the empty state heading "No sprint data yet." is rendered |

**Inputs**: API returns no active sprint.

**Mock setup**:
```ts
;(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => [],  // empty array — no active sprint
})
```

**Expected assertions**:
```ts
await waitFor(() => {
  expect(screen.getByText('No sprint data yet.')).toBeInTheDocument()
  expect(screen.getByText('Set up your first sprint to get started.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /set up sprint/i })).toBeInTheDocument()
})
```

---

### DB-6 — Empty state does NOT render stat card grid

| Field | Value |
|---|---|
| **Test ID** | DB-6 |
| **AC** | AC-1.3.5 |
| **Description** | When no active sprint is returned, the 4-stat-card grid is absent from the DOM |

**Inputs**: Same as DB-5.

**Mock setup**: Same as DB-5.

**Expected assertions**:
```ts
await waitFor(() => {
  expect(screen.queryByText('Feedback Count')).not.toBeInTheDocument()
  expect(screen.queryByText('Completion Rate')).not.toBeInTheDocument()
})
```

---

### DB-7 — `actionService.getCompletionRate([])` returns 0 (no divide-by-zero)

| Field | Value |
|---|---|
| **Test ID** | DB-7 |
| **AC** | AC-1.3.4 |
| **Description** | Unit test of `getCompletionRate` in isolation — calling it with an empty array returns `0` and does not throw |

**Inputs**: `[]` (empty `ActionItem` array)

**Mock setup**: None — this test imports and calls the real `getCompletionRate` function directly (not the mock). It is the only test in `dashboard.test.tsx` that tests service logic, not component rendering.

```ts
import { getCompletionRate } from '@/services/actionService'
// Note: only this test should NOT mock actionService
```

**Expected assertions**:
```ts
expect(getCompletionRate([])).toBe(0)
expect(() => getCompletionRate([])).not.toThrow()
```

> **Implementation note for DEV**: The `jest.mock('@/services/actionService', ...)` call at the top of the file will mock all exports. `DB-7` must either (a) use `jest.requireActual('@/services/actionService')` to import the real function, or (b) be extracted to a separate `actionService.test.ts` unit test file. Approach (b) is preferred for clarity.

---

## Acceptance Criteria Coverage Matrix

This matrix cross-references every AC from `FEATURE_REQUIREMENTS.md` against the test cases defined in this plan.

| AC-ID | Criterion Summary | Test Coverage | Test IDs |
|---|---|---|---|
| AC-1.1.1 | `types/index.ts` defines all 4 types | `tsc --noEmit` gate | — (compile-time) |
| AC-1.1.2 | `connectDB()` singleton reuses connection | **Partial — see Gap 1** | — |
| AC-1.1.3 | 4 Mongoose models exist and match types | `tsc --noEmit` gate | — (compile-time) |
| AC-1.1.4 | `GET/POST /api/users` HTTP behavior | `userApi.test.ts` | UA-1, UA-2, UA-5, UA-6 |
| AC-1.1.5 | `GET/POST /api/sprints` HTTP behavior | **Gap — see Gap 2** | — |
| AC-1.1.6 | No hardcoded `MONGODB_URI` | `grep` check | — (static analysis) |
| AC-1.1.7 | `tsc --noEmit` passes with 0 errors | CI gate | — (compile-time) |
| AC-1.2.1 | Registration renders with 3 fields | `registration.test.tsx` | REG-1 |
| AC-1.2.2 | Pod selector has 3 options | `registration.test.tsx` | REG-2 |
| AC-1.2.3 | Submit calls `registerUser()` with correct payload | `registration.test.tsx` | REG-5 |
| AC-1.2.4 | First user is admin; second is not | `userApi.test.ts` | UA-3, UA-4 |
| AC-1.2.5 | Success → sessionStorage cache + redirect | `registration.test.tsx` | REG-6, REG-7 |
| AC-1.2.6 | Skip form if user already in sessionStorage | `registration.test.tsx` | REG-8 |
| AC-UI-1.2.1 | Form matches registration.png layout | **Gap — see Gap 3** | Visual only |
| AC-UI-1.2.2 | Submit disabled until all fields filled | `registration.test.tsx` | REG-3, REG-4 |
| AC-UI-1.2.3 | Hexagon icon above app name | **Gap — see Gap 3** | Visual only |
| AC-UI-1.2.4 | "RetroBoard" bold text below icon | **Gap — see Gap 3** | Visual only |
| AC-UI-1.2.5 | Card max-width 480px, centered | **Gap — see Gap 3** | Visual only |
| AC-UI-1.2.6 | CardHeader title + subtitle text | **Gap — see Gap 3** | Visual only |
| AC-UI-1.2.7 | Destructive border on name conflict | **Gap — see Gap 4** | — |
| AC-UI-1.2.8 | Inline error message on conflict | **Gap — see Gap 4** | — |
| AC-UI-1.2.9 | Pod Select trigger label | **Gap — see Gap 3** | Visual only |
| AC-UI-1.2.10 | CTA button "Join RetroBoard", full-width | Covered by REG-3/REG-4 button queries | REG-3, REG-4 |
| AC-UI-1.2.11 | Footer helper text | **Gap — see Gap 3** | Visual only |
| AC-UI-1.2.12 | Card entrance animation | **Gap — see Gap 3** | Visual only |
| AC-UI-1.2.13 | Responsive layout, w-full up to max-w-[480px] | **Gap — see Gap 3** | Visual only |
| AC-1.3.1 | Dashboard renders at `/dashboard` | `dashboard.test.tsx` | DB-1, DB-2 |
| AC-1.3.2 | Shows sprint name + date range | `dashboard.test.tsx` | DB-3 (partial — **see Gap 5**) |
| AC-1.3.3 | Shows 4 stat cards with correct labels | `dashboard.test.tsx` | DB-3 |
| AC-1.3.4 | `getCompletionRate()` formula + edge case | `dashboard.test.tsx` | DB-4, DB-7 |
| AC-1.3.5 | Empty state when no active sprint | `dashboard.test.tsx` | DB-5, DB-6 |
| AC-UI-1.3.1 | Layout matches Dashboard.png | **Gap — see Gap 3** | Visual only |
| AC-UI-1.3.2 | 4 stat cards in 4-col grid | **Gap — see Gap 3** | Visual only |
| AC-UI-1.3.3 | Stat card visual structure | **Gap — see Gap 3** | Visual only |
| AC-UI-1.3.4–1.3.7 | Recent Feedback + Activity Feed columns | **Gap — see Gap 6** | — |
| AC-UI-1.3.8 | Dashboard entrance animation | **Gap — see Gap 3** | Visual only |
| AC-UI-1.3.9–1.3.13 | Empty state visual requirements | Partially covered by DB-5/DB-6 text assertions | DB-5, DB-6 |
| AC-UI-1.3.14 | Sidebar nav order + active state in empty view | **Gap — see Gap 3** | Visual only |
| AC-UI-SHELL-1 | Sidebar dimensions + border | **Gap — see Gap 3** | Visual only |
| AC-UI-SHELL-2 | Sidebar header icon + text | **Gap — see Gap 3** | Visual only |
| AC-UI-SHELL-3 | Sprint label display | **Gap — see Gap 3** | Visual only |
| AC-UI-SHELL-4 | Nav items order | **Gap — see Gap 7** | — |
| AC-UI-SHELL-5 | Active nav item styling | **Gap — see Gap 3** | Visual only |
| AC-UI-SHELL-6 | Inactive nav item hover | **Gap — see Gap 3** | Visual only |
| AC-UI-SHELL-7 | User identity card content | **Gap — see Gap 7** | — |
| AC-UI-SHELL-8 | Nav + user card only shown after registration | **Gap — see Gap 7** | — |

---

## Gap Analysis — Untested ACs

The following acceptance criteria have **no automated test coverage** in the Sprint 1 test plan as defined in `IMPLEMENTATION_PLAN.md`. Each gap is categorized by severity and a recommended action is provided.

---

### Gap 1 — AC-1.1.2: `connectDB()` singleton behavior not unit-tested

**AC**: AC-1.1.2 — "Calling `connectDB()` twice in the same Node.js process returns the same Mongoose connection instance."

**Status**: Not covered. The Implementation Plan lists this as "Manual / Jest unit" but no test file was allocated for it.

**Risk**: Medium. The singleton pattern is critical for preventing connection pool exhaustion in Next.js hot-reload. A regression here could go undetected.

**Recommendation**: Add `src/__tests__/db.test.ts` in Sprint 2 (or as an optional Sprint 1 addition). The test should call `connectDB()` twice with a mocked `mongoose.connect` and assert the mock was called only once. The second call must return the cached connection from `global.mongoose.conn`.

---

### Gap 2 — AC-1.1.5: `GET/POST /api/sprints` has no unit test

**AC**: AC-1.1.5 — "`GET /api/sprints` returns HTTP 200 with the active sprint or an empty object. `POST /api/sprints` with a valid body returns HTTP 201."

**Status**: Not covered. The Implementation Plan explicitly marks this as "Manual test" only.

**Risk**: Medium. Sprint data is fetched by the Dashboard on mount; a broken sprints route would silently render the empty state even when a sprint exists.

**Recommendation**: Add `src/__tests__/sprintApi.test.ts` in Sprint 2 using the same mocking pattern as `userApi.test.ts`. Key cases: GET with active sprint, GET with no active sprint (empty array), POST with valid body → 201, POST missing `name` → 400.

---

### Gap 3 — AC-UI-*.x: All visual/layout ACs have no automated test coverage

**ACs**: AC-UI-1.2.1, AC-UI-1.2.3–1.2.9, AC-UI-1.2.11–1.2.13, AC-UI-1.3.1–1.3.3, AC-UI-1.3.5–1.3.8, AC-UI-1.3.14, AC-UI-SHELL-1–6

**Status**: Not covered. These are visual requirements (Tailwind CSS classes, layout dimensions, animation, icon presence).

**Risk**: Low (for functional testing). These cannot be verified with Jest/RTL alone.

**Recommendation**: These should be verified by:
1. **Manual visual review** against `docs/ui-mocks/` reference images during the Session 2 and 3 completion gates.
2. **Optional Sprint 2 addition**: Playwright or Storybook visual snapshot tests for Shell, Registration card layout, and Dashboard stat card grid.

---

### Gap 4 — AC-UI-1.2.7, AC-UI-1.2.8: Name conflict error state not tested

**ACs**: AC-UI-1.2.7 — Destructive border on name-conflict error. AC-UI-1.2.8 — Inline error message text.

**Status**: Not covered. The Implementation Plan does not include a test case for form-level error display.

**Risk**: Low in Sprint 1 (the API does not return a 409 conflict response yet). Higher risk in Sprint 2 when duplicate name validation may be added.

**Recommendation**: Add the following test case to `registration.test.tsx` in Sprint 2:

> **Proposed REG-9**: Mock `registerUser` to reject with an error (or resolve with a 409 response). Assert that the Name input has a destructive border style and that an error message string appears below it.

---

### Gap 5 — AC-1.3.2: Sprint name and date range display not fully asserted in DB-3

**AC**: AC-1.3.2 — "Shows current sprint name and date range."

**Status**: Partially covered. DB-3 asserts stat card labels but does not assert that `sprint.name` ("Sprint 42") or the formatted date range appears in the DOM.

**Risk**: Low-Medium. If the sprint header block is missing or the date format is broken, no test would catch it.

**Recommendation**: Extend DB-3 to include:
```ts
expect(screen.getByText('Sprint 42')).toBeInTheDocument()
// Date range check (exact format depends on implementation):
expect(screen.getByText(/Apr 1/i)).toBeInTheDocument()
```

---

### Gap 6 — AC-UI-1.3.4–1.3.7: Recent Feedback and Activity Feed sections untested

**ACs**: AC-UI-1.3.4, AC-UI-1.3.5, AC-UI-1.3.6, AC-UI-1.3.7 — Recent Feedback column, Activity Feed column with timeline, content preview, author avatar, timestamps.

**Status**: Not covered. These sections require a `GET /api/feedback` call which is **out of scope for Sprint 1** (no FeedbackItem route is created in Sprint 1). The `dashboard/page.tsx` implementation plan does not wire feedback data.

**Risk**: Low. The sections will render as empty placeholders in Sprint 1.

**Recommendation**: These ACs should be re-targeted to Sprint 2, when `GET /api/feedback` is implemented. At that point, add tests to `dashboard.test.tsx` that mock the feedback API and assert card content, avatar initials, and relative timestamp text.

---

### Gap 7 — AC-UI-SHELL-4, AC-UI-SHELL-7, AC-UI-SHELL-8: Shell component not directly tested

**ACs**: AC-UI-SHELL-4 (nav items order), AC-UI-SHELL-7 (user identity card), AC-UI-SHELL-8 (nav/card only shown after registration)

**Status**: Not covered. The `dashboard.test.tsx` mocks `Shell.tsx` as a passthrough, so Shell internals are never exercised by the Sprint 1 test suite.

**Risk**: Medium. Shell reads `sessionStorage` and `usePathname`; if either is broken, the sidebar nav and user identity card will silently fail.

**Recommendation**: Add `src/__tests__/shell.test.tsx` in Sprint 2 (or as an optional Sprint 1 addition):

> **Proposed SH-1**: Render `<Shell>` with a mock child. Pre-seed `sessionStorage` with a user. Assert that the identity card shows the user's name and pod.

> **Proposed SH-2**: Render `<Shell>` with no sessionStorage user. Assert that the user identity card is NOT rendered (AC-UI-SHELL-8).

> **Proposed SH-3**: Mock `usePathname` to return `/dashboard`. Assert that the Dashboard nav item has the active class / accent bar element.

> **Proposed SH-4**: Assert all 4 nav items appear in the correct order: Sprint Setup, Dashboard, Feedback Board, Action Items.

---

## Summary

| Category | Count |
|---|---|
| Test cases defined (Sprint 1) | 21 (UA-1–6 + REG-1–8 + DB-1–7) |
| ACs with full automated coverage | 15 |
| ACs verified by compile-time / static analysis | 4 (AC-1.1.1, AC-1.1.3, AC-1.1.6, AC-1.1.7) |
| ACs with visual-only coverage | 18 (all AC-UI-\*) |
| ACs with no coverage (gaps) | 7 (Gaps 1–7 above) |
| Recommended additions for Sprint 2 | `db.test.ts`, `sprintApi.test.ts`, `shell.test.tsx`, REG-9, DB-3 extension |
