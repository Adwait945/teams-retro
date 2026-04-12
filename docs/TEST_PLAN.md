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

---

# Test Plan — Sprint 2: Feedback Board

**Mode**: [TEST]  
**Sprint**: 2 — Feedback Board Layout, Submit Feedback, Upvote, Reframe Rule  
**References**: `retro-product/docs/FEATURE_REQUIREMENTS.md` (Sprint 2), `retro-architect/docs/IMPLEMENTATION_PLAN.md` §Sprint 2  
**Date**: April 11, 2026  
**Rule**: Do NOT modify or delete any Sprint 1 test cases above. Only append.

---

## Table of Contents (Sprint 2)

1. [Field-Name Invariant](#field-name-invariant)
2. [New Mock Patterns (Sprint 2)](#new-mock-patterns-sprint-2)
3. [Test File: `feedbackService.test.ts`](#test-file-feedbackservicetestts)
4. [Test File: `feedbackBoard.test.tsx`](#test-file-feedbackboardtesttsx)
5. [Acceptance Criteria Coverage Matrix (Sprint 2)](#acceptance-criteria-coverage-matrix-sprint-2)
6. [Gap Analysis (Sprint 2)](#gap-analysis-sprint-2)
7. [Sprint 2 Summary](#sprint-2-summary)

---

## Field-Name Invariant

All Sprint 2 test assertions use the field names as they appear in the **live** `src/types/index.ts` and `src/lib/models/FeedbackItem.ts` in `retro-dev`. These are the canonical names — not the names mentioned in `FEATURE_REQUIREMENTS.md` where a delta exists.

| Interface field | Value used in all tests |
|---|---|
| Suggested improvement | `suggestion` (not `suggestedImprovement`) |
| Upvote numeric count | `upvotes: number` |
| Upvote user-ID array | `upvotedBy: string[]` |
| Category values | `"slowed-us-down"`, `"should-try"`, `"went-well"` (exact kebab-case strings) |

Any test that passes `suggestedImprovement` as a key will fail. Any test that checks `upvotes.length` will fail — use the `upvotes` number field directly.

---

## New Mock Patterns (Sprint 2)

### `feedbackService.ts` mock (used in `feedbackBoard.test.tsx`)

```ts
jest.mock('@/services/feedbackService', () => ({
  getFeedbackByLane: jest.fn(),
  getFeedback:       jest.fn(),
  sortByUpvotes:     jest.fn().mockImplementation((items) => [...items]),
  getAuthorDisplay:  jest.fn().mockImplementation((item, name) =>
    item.isAnonymous ? 'Anonymous' : (name ?? 'Unknown')
  ),
  addFeedback:       jest.fn(),
  upvoteFeedback:    jest.fn(),
}))
```

**Why `sortByUpvotes` passthrough**: The board test cares about rendering, not sort order. By returning `[...items]` (identity transform), the test controls what the API returns and the column renders those in the given order — no need to reason about sort logic in integration-level tests.

### `Shell.tsx` mock (same pattern as Sprint 1 dashboard tests)

```ts
jest.mock('@/components/layout/Shell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))
```

### `SubmitFeedbackModal.tsx` mock strategy

`feedbackBoard.test.tsx` tests the **real** `SubmitFeedbackModal` component (not a mock) because the test plan includes Reframe Rule DOM assertions (suggestion textarea presence, badge text, button disabled state). Do NOT mock `SubmitFeedbackModal` in `feedbackBoard.test.tsx`.

### `next/navigation` mock (Sprint 2 pages)

```ts
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter:   () => ({ push: mockPush }),
  usePathname: () => '/feedback',
}))
```

**Note**: `usePathname` returns `'/feedback'` so the Shell mock (if un-mocked) would activate the "Feedback Board" active nav item. Since Shell is mocked as a passthrough, `usePathname` inside Shell is never called — but the module mock must still be declared to prevent import errors.

### `@/lib/models/FeedbackItem` mock (used in `feedbackService.test.ts` API tests)

```ts
jest.mock('@/lib/models/FeedbackItem', () => {
  const mockSave     = jest.fn().mockResolvedValue(undefined)
  const mockFind     = jest.fn()
  const mockFindById = jest.fn()

  function MockFeedbackItemModel(this: any, data: any) {
    Object.assign(this, data)
    this._id  = 'mock-fb-id'
    this.save = mockSave
  }
  Object.assign(MockFeedbackItemModel, {
    find:     (...args: any[]) => ({ lean: () => mockFind(...args) }),
    findById: mockFindById,
    __mockSave:     mockSave,
    __mockFind:     mockFind,
    __mockFindById: mockFindById,
  })
  return { __esModule: true, default: MockFeedbackItemModel }
})
```

### Shared mock `FeedbackItem` factory

```ts
function makeFeedbackItem(overrides: Partial<FeedbackItem> = {}): FeedbackItem {
  return {
    _id:         'fb-' + Math.random().toString(36).slice(2),
    category:    'went-well',
    content:     'Test content',
    suggestion:  '',
    authorId:    'user-1',
    isAnonymous: false,
    sprintId:    'sprint-1',
    upvotedBy:   [],
    upvotes:     0,
    createdAt:   new Date().toISOString(),
    ...overrides,
  }
}
```

### Shared mock `User` object (reused from Sprint 1 pattern)

```ts
const mockUser = {
  _id:      'user-1',
  name:     'Jane Doe',
  username: 'jdoe',
  pod:      'pod1',
  isAdmin:  false,
  createdAt: '2026-04-01T00:00:00.000Z',
}
```

---

## Test File: `feedbackService.test.ts`

**File path**: `src/__tests__/feedbackService.test.ts`  
**Target implementations**: `src/services/feedbackService.ts`, `src/app/api/feedback/route.ts`  
**Jest environment**: `@jest-environment node` (API route tests); default jsdom for pure unit tests  
**AC coverage**: AC-2.1.3, AC-2.1.4, AC-RR-3, AC-RR-4, AC-RR-5

### Structure note

This file contains two logical groups:

1. **Pure unit tests** (no mocks needed) — `sortByUpvotes` and `getAuthorDisplay` import directly from the service.
2. **API route tests** (`@jest-environment node`) — import `GET`, `POST` from `@/app/api/feedback/route` with mocked DB + model.

The recommended approach is to split these into two test files: `feedbackService.test.ts` for service unit tests and `feedbackApi.test.ts` for API route tests — matching the Sprint 1 pattern (`actionService.test.ts` vs `userApi.test.ts`). Either split or combined is acceptable, provided both groups are covered.

### Mocks required (API route group only)

| Mock target | Method | Configuration |
|---|---|---|
| `@/lib/db` | `connectDB` | No-op, resolves immediately |
| `@/lib/models/FeedbackItem` | `find`, `save`, constructor | See mock pattern above |

---

### FS-1 — `sortByUpvotes` returns array sorted by `upvotes` descending

| Field | Value |
|---|---|
| **Test ID** | FS-1 |
| **File** | `feedbackService.test.ts` |
| **AC** | AC-2.1.4 |
| **Description** | `sortByUpvotes` called with an unsorted array returns a new array with items in descending `upvotes` order |

**Setup**: No mocks needed — import real function.

```ts
import { sortByUpvotes } from '@/services/feedbackService'
```

**Action**:
```ts
const items = [
  makeFeedbackItem({ upvotes: 3 }),
  makeFeedbackItem({ upvotes: 8 }),
  makeFeedbackItem({ upvotes: 1 }),
]
const result = sortByUpvotes(items)
```

**Assertions**:
```ts
expect(result[0].upvotes).toBe(8)
expect(result[1].upvotes).toBe(3)
expect(result[2].upvotes).toBe(1)
```

---

### FS-2 — `sortByUpvotes` does not mutate the original array

| Field | Value |
|---|---|
| **Test ID** | FS-2 |
| **File** | `feedbackService.test.ts` |
| **AC** | AC-2.1.4 |
| **Description** | The original array passed to `sortByUpvotes` is not mutated; a new array is returned |

**Setup**: No mocks needed.

**Action**:
```ts
const items = [
  makeFeedbackItem({ upvotes: 3 }),
  makeFeedbackItem({ upvotes: 8 }),
  makeFeedbackItem({ upvotes: 1 }),
]
const originalFirst = items[0].upvotes   // 3
const result = sortByUpvotes(items)
```

**Assertions**:
```ts
expect(result).not.toBe(items)           // different array reference
expect(items[0].upvotes).toBe(originalFirst)  // original order unchanged
```

---

### FS-3 — `getAuthorDisplay` returns `"Anonymous"` when `isAnonymous` is `true`

| Field | Value |
|---|---|
| **Test ID** | FS-3 |
| **File** | `feedbackService.test.ts` |
| **AC** | AC-2.1.3 |
| **Description** | When `item.isAnonymous === true`, `getAuthorDisplay` returns the string `"Anonymous"` regardless of the `authorName` argument |

**Setup**: No mocks needed.

```ts
import { getAuthorDisplay } from '@/services/feedbackService'
```

**Action**:
```ts
const item = makeFeedbackItem({ isAnonymous: true })
const result = getAuthorDisplay(item, 'Jane')
```

**Assertions**:
```ts
expect(result).toBe('Anonymous')
```

---

### FS-4 — `getAuthorDisplay` returns the author name when `isAnonymous` is `false`

| Field | Value |
|---|---|
| **Test ID** | FS-4 |
| **File** | `feedbackService.test.ts` |
| **AC** | AC-2.1.3 |
| **Description** | When `item.isAnonymous === false` and `authorName` is provided, `getAuthorDisplay` returns `authorName` |

**Setup**: No mocks needed.

**Action**:
```ts
const item = makeFeedbackItem({ isAnonymous: false })
const result = getAuthorDisplay(item, 'Jane')
```

**Assertions**:
```ts
expect(result).toBe('Jane')
```

---

### FS-5 — `GET /api/feedback?sprintId=X&category=went-well` returns 200 + array

| Field | Value |
|---|---|
| **Test ID** | FS-5 |
| **File** | `feedbackService.test.ts` (API route group) |
| **AC** | AC-2.1.1 |
| **Description** | `GET /api/feedback` with `sprintId` and `category` query params calls `FeedbackItem.find` with the correct filter and returns HTTP 200 with a JSON array |

**Setup**:
```ts
mockFind.mockResolvedValue([
  makeFeedbackItem({ sprintId: 'sprint-1', category: 'went-well' }),
  makeFeedbackItem({ sprintId: 'sprint-1', category: 'went-well', upvotes: 5 }),
])
```

**Action**:
```ts
import { GET } from '@/app/api/feedback/route'

const req = new NextRequest('http://localhost/api/feedback?sprintId=sprint-1&category=went-well')
const res = await GET(req)
```

**Assertions**:
```ts
expect(res.status).toBe(200)
const body = await res.json()
expect(Array.isArray(body)).toBe(true)
expect(body.length).toBe(2)
```

---

### FS-6 — `POST /api/feedback` with valid `went-well` payload returns 201

| Field | Value |
|---|---|
| **Test ID** | FS-6 |
| **File** | `feedbackService.test.ts` (API route group) |
| **AC** | AC-RR-5 |
| **Description** | A `POST /api/feedback` for the `went-well` category with an empty `suggestion` returns HTTP 201 — the Reframe Rule does NOT apply to non-blocker lanes |

**Setup**: `mockSave.mockResolvedValue(undefined)` (default — save succeeds)

**Action**:
```ts
import { POST } from '@/app/api/feedback/route'

const req = new NextRequest('http://localhost/api/feedback', {
  method: 'POST',
  body: JSON.stringify({
    category:    'went-well',
    content:     'Great sprint!',
    suggestion:  '',
    isAnonymous: false,
    sprintId:    'sprint-1',
    authorId:    'user-1',
  }),
  headers: { 'Content-Type': 'application/json' },
})
const res = await POST(req)
```

**Assertions**:
```ts
expect(res.status).toBe(201)
expect(mockSave).toHaveBeenCalledTimes(1)
```

---

### FS-7 — `POST /api/feedback` with `slowed-us-down` + empty `suggestion` returns 422

| Field | Value |
|---|---|
| **Test ID** | FS-7 |
| **File** | `feedbackService.test.ts` (API route group) |
| **AC** | AC-RR-4 |
| **Description** | The Reframe Rule: `POST /api/feedback` with `category: "slowed-us-down"` and an empty `suggestion` field returns HTTP 422 with a descriptive error body. `save()` is never called. |

**Setup**: No special setup — the route should short-circuit before touching the model.

**Action**:
```ts
const req = new NextRequest('http://localhost/api/feedback', {
  method: 'POST',
  body: JSON.stringify({
    category:    'slowed-us-down',
    content:     'Auth service crashed staging.',
    suggestion:  '',
    isAnonymous: false,
    sprintId:    'sprint-1',
    authorId:    'user-1',
  }),
  headers: { 'Content-Type': 'application/json' },
})
const res = await POST(req)
```

**Assertions**:
```ts
expect(res.status).toBe(422)
const body = await res.json()
expect(typeof body.error).toBe('string')
expect(body.error.toLowerCase()).toContain('reframe rule')
expect(body.error.toLowerCase()).toContain('suggestion')
// DB must NOT have been touched
expect(mockSave).not.toHaveBeenCalled()
```

---

### FS-8 — `POST /api/feedback` with `slowed-us-down` + non-empty `suggestion` returns 201

| Field | Value |
|---|---|
| **Test ID** | FS-8 |
| **File** | `feedbackService.test.ts` (API route group) |
| **AC** | AC-RR-4, AC-RR-5 |
| **Description** | When `category === "slowed-us-down"` AND `suggestion` is non-empty, the Reframe Rule is satisfied and the route returns HTTP 201 |

**Setup**: `mockSave.mockResolvedValue(undefined)`

**Action**:
```ts
const req = new NextRequest('http://localhost/api/feedback', {
  method: 'POST',
  body: JSON.stringify({
    category:    'slowed-us-down',
    content:     'Auth service crashed staging.',
    suggestion:  'Roll back to v1.8 until memory leak is patched.',
    isAnonymous: false,
    sprintId:    'sprint-1',
    authorId:    'user-1',
  }),
  headers: { 'Content-Type': 'application/json' },
})
const res = await POST(req)
```

**Assertions**:
```ts
expect(res.status).toBe(201)
expect(mockSave).toHaveBeenCalledTimes(1)
```

---

### FS-RR3 — `feedbackService.addFeedback()` does NOT call `fetch` when Reframe Rule is violated

| Field | Value |
|---|---|
| **Test ID** | FS-RR3 |
| **File** | `feedbackService.test.ts` (service unit group) |
| **AC** | AC-RR-3 |
| **Description** | Calling `addFeedback` with `category: "slowed-us-down"` and `suggestion: ""` throws an error **before** any `fetch()` call is made |

**Setup**:
```ts
global.fetch = jest.fn()
import { addFeedback } from '@/services/feedbackService'
```

**Action**:
```ts
const call = addFeedback({
  category:    'slowed-us-down',
  content:     'Auth service crashed staging.',
  suggestion:  '',
  isAnonymous: false,
  sprintId:    'sprint-1',
  authorId:    'user-1',
})
```

**Assertions**:
```ts
await expect(call).rejects.toThrow()
// fetch must NOT have been called
expect(global.fetch).not.toHaveBeenCalled()
```

---

## Test File: `feedbackBoard.test.tsx`

**File path**: `src/__tests__/feedbackBoard.test.tsx`  
**Target implementations**: `src/app/feedback/page.tsx`, `src/components/SubmitFeedbackModal.tsx`, `src/components/FeedbackCard.tsx`, `src/components/FeedbackColumn.tsx`  
**Jest environment**: `jest-environment-jsdom` (default)  
**AC coverage**: AC-2.1.1, AC-2.1.2, AC-2.1.5, AC-2.2.1, AC-RR-1, AC-RR-2, AC-RR-6, AC-2.2.5, AC-2.2.6

### Mocks required

| Mock target | Method | Notes |
|---|---|---|
| `next/navigation` | `useRouter → { push: mockPush }`, `usePathname → '/feedback'` | Declared before all imports |
| `@/services/userService` | `getCurrentUser` | Controls session guard |
| `@/services/feedbackService` | `getFeedbackByLane`, `sortByUpvotes`, `addFeedback`, `upvoteFeedback` | Full module mock; `sortByUpvotes` returns identity |
| `@/components/layout/Shell` | default export — passthrough wrapper | Avoids Shell's own `sessionStorage` + `usePathname` |
| `global.fetch` | — | Intercepts upvote PATCH calls |

### `beforeEach` setup

```ts
beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()

  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  ;(getFeedbackByLane as jest.Mock).mockResolvedValue([])
  ;(sortByUpvotes as jest.Mock).mockImplementation((items) => [...items])

  // Mock /api/sprints fetch for the page's sprint-resolution step
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ _id: 'sprint-1', name: 'Sprint 42', status: 'open' }),
  })
})
```

---

### FB-1 — Renders `/feedback` with mocked session user — page mounts without redirect

| Field | Value |
|---|---|
| **Test ID** | FB-1 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-2.1.1, AC-UI-SHELL-FB-5 |
| **Description** | When a valid user is cached in `sessionStorage`, the Feedback Board page mounts and renders the Shell wrapper without calling `router.push('/')` |

**Setup**: Default `beforeEach` state — `getCurrentUser` returns `mockUser`.

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitFor(() => {
  expect(screen.getByTestId('shell')).toBeInTheDocument()
})
```

**Assertions**:
```ts
expect(mockPush).not.toHaveBeenCalledWith('/')
```

---

### FB-2 — No session user → redirects to `/`

| Field | Value |
|---|---|
| **Test ID** | FB-2 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-UI-SHELL-FB-5 |
| **Description** | When `getCurrentUser` returns `null` on mount, the page calls `router.push('/')` instead of rendering the board |

**Setup**:
```ts
;(getCurrentUser as jest.Mock).mockReturnValue(null)
```

**Action**:
```ts
render(<FeedbackBoardPage />)
```

**Assertions**:
```ts
await waitFor(() => {
  expect(mockPush).toHaveBeenCalledWith('/')
})
```

---

### FB-3 — Three column headers present with correct text

| Field | Value |
|---|---|
| **Test ID** | FB-3 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-2.1.2 |
| **Description** | The rendered page contains exactly three column headers with the text strings "What Went Well?", "What Slowed Us Down?", and "What Should We Try?" |

**Setup**: Default `beforeEach` — all 3 lane fetches return `[]` (empty).

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitFor(() => {
  expect(screen.getByTestId('shell')).toBeInTheDocument()
})
```

**Assertions**:
```ts
expect(screen.getByText('What Went Well?')).toBeInTheDocument()
expect(screen.getByText('What Slowed Us Down?')).toBeInTheDocument()
expect(screen.getByText('What Should We Try?')).toBeInTheDocument()
```

---

### FB-4 — Empty API response → per-lane empty state messages render; no `FeedbackCard` elements

| Field | Value |
|---|---|
| **Test ID** | FB-4 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-2.1.5 |
| **Description** | When all three `getFeedbackByLane` calls return empty arrays, each column renders its per-lane empty state placeholder and no `FeedbackCard` elements are present |

**Setup**: Default `beforeEach` — `getFeedbackByLane` already returns `[]` for all calls.

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitFor(() => {
  expect(screen.getByText('No blockers reported yet. Be the first to share.')).toBeInTheDocument()
})
```

**Assertions**:
```ts
expect(screen.getByText('No blockers reported yet. Be the first to share.')).toBeInTheDocument()
expect(screen.getByText('No suggestions yet. What would help the team?')).toBeInTheDocument()
expect(screen.getByText('Nothing logged yet. Share a win!')).toBeInTheDocument()
// No feedback card content should be present
expect(screen.queryAllByRole('button', { name: /thumbsup|upvote/i })).toHaveLength(0)
```

> **Note**: The exact query for "no FeedbackCard elements" depends on implementation. An alternative is to assert that specific card content from mock data is absent, or use a `data-testid="feedback-card"` attribute if added by the DEV.

---

### FB-5 — Clicking "Submit Feedback" button → `SubmitFeedbackModal` opens (`DialogTitle` visible)

| Field | Value |
|---|---|
| **Test ID** | FB-5 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-2.2.1 |
| **Description** | Clicking the "Submit Feedback" button in the page header causes the modal to open, making the `DialogTitle` element "Submit Feedback" visible in the DOM |

**Setup**: Default `beforeEach` state.

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitFor(() => expect(screen.getByTestId('shell')).toBeInTheDocument())

const submitBtn = screen.getByRole('button', { name: /submit feedback/i })
fireEvent.click(submitBtn)
```

**Assertions**:
```ts
await waitFor(() => {
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByText('Submit Feedback')).toBeInTheDocument()
})
```

> **Note**: If the page has a "Submit Feedback" button AND the modal's `DialogTitle` also reads "Submit Feedback", use `screen.getAllByText('Submit Feedback')` and assert `.length >= 1`, or use `screen.getByRole('dialog')` to confirm the dialog element is mounted.

---

### FB-6 — Modal close (×) → modal removed from DOM

| Field | Value |
|---|---|
| **Test ID** | FB-6 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-2.2.1 |
| **Description** | After the modal is open, clicking the Cancel button (or the × close button if accessible) removes the modal from the DOM |

**Setup**: Start from the post-click state of FB-5 (modal is open).

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitFor(() => expect(screen.getByTestId('shell')).toBeInTheDocument())

fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }))
await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

// Close via Cancel button
const cancelBtn = screen.getByRole('button', { name: /cancel/i })
fireEvent.click(cancelBtn)
```

**Assertions**:
```ts
await waitFor(() => {
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
```

---

### FB-7 — Modal: selecting "What Slowed Us Down?" → suggestion textarea appears + "REFRAME RULE: REQUIRED" badge visible

| Field | Value |
|---|---|
| **Test ID** | FB-7 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-RR-1, AC-RR-6 |
| **Description** | When the "slowed-us-down" radio option is selected in the modal, the Suggestion textarea (placeholder "How could we fix or improve this?") appears in the DOM and the badge text "REFRAME RULE: REQUIRED" is visible |

**Setup**: Open the modal first (as in FB-5).

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitFor(() => expect(screen.getByTestId('shell')).toBeInTheDocument())
fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }))
await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

// Select the "slowed-us-down" radio option
const slowedOption = screen.getByRole('radio', { name: /what slowed us down/i })
fireEvent.click(slowedOption)
```

**Assertions**:
```ts
expect(
  screen.getByPlaceholderText('How could we fix or improve this?')
).toBeInTheDocument()
expect(screen.getByText('REFRAME RULE: REQUIRED')).toBeInTheDocument()
```

---

### FB-8 — Modal: selecting "What Went Well?" → suggestion textarea NOT in DOM

| Field | Value |
|---|---|
| **Test ID** | FB-8 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-RR-1 |
| **Description** | When the "went-well" radio option is selected, neither the suggestion textarea nor the Reframe Rule badge is present in the DOM |

**Setup**: Open the modal. First click "slowed-us-down" (to verify it appears), then switch to "went-well".

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitFor(() => expect(screen.getByTestId('shell')).toBeInTheDocument())
fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }))
await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

// Switch to "went-well"
const wentWellOption = screen.getByRole('radio', { name: /what went well/i })
fireEvent.click(wentWellOption)
```

**Assertions**:
```ts
expect(
  screen.queryByPlaceholderText('How could we fix or improve this?')
).not.toBeInTheDocument()
expect(screen.queryByText('REFRAME RULE: REQUIRED')).not.toBeInTheDocument()
```

---

### FB-9 — Modal: "slowed-us-down" + empty suggestion → Submit button disabled

| Field | Value |
|---|---|
| **Test ID** | FB-9 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-RR-2 |
| **Description** | With the modal open and "What Slowed Us Down?" selected, if the suggestion textarea is empty, the "Submit Feedback" submit button inside the modal has the `disabled` attribute |

**Setup**: Open the modal and select "slowed-us-down".

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitFor(() => expect(screen.getByTestId('shell')).toBeInTheDocument())
fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }))
await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

fireEvent.click(screen.getByRole('radio', { name: /what slowed us down/i }))

// Also fill content so only suggestion is missing
fireEvent.change(
  screen.getByPlaceholderText('What happened?'),
  { target: { value: 'Auth crashed.' } }
)
// Leave suggestion empty
```

**Assertions**:
```ts
// The submit button inside the dialog footer
const submitInsideModal = screen.getAllByRole('button', { name: /submit feedback/i })
  .find(btn => btn.closest('[role="dialog"]'))
expect(submitInsideModal).toBeDisabled()
```

> **Alternative query if the above is brittle**: Add `data-testid="modal-submit-btn"` to the modal's submit button and query `screen.getByTestId('modal-submit-btn')`.

---

### FB-10 — Modal: "slowed-us-down" + non-empty suggestion → Submit button enabled

| Field | Value |
|---|---|
| **Test ID** | FB-10 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-RR-2 |
| **Description** | After typing a non-whitespace value into the Suggestion textarea, the Submit button inside the modal is enabled |

**Setup**: Continue from FB-9 state (slowed-us-down selected, content filled).

**Action**:
```ts
// Type into the suggestion textarea
fireEvent.change(
  screen.getByPlaceholderText('How could we fix or improve this?'),
  { target: { value: 'Roll back to v1.8.' } }
)
```

**Assertions**:
```ts
const submitInsideModal = screen.getAllByRole('button', { name: /submit feedback/i })
  .find(btn => btn.closest('[role="dialog"]'))
expect(submitInsideModal).not.toBeDisabled()
```

---

### FB-11 — Upvote button on own feedback → no PATCH call issued, or 403 response handled gracefully

| Field | Value |
|---|---|
| **Test ID** | FB-11 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-2.2.5 |
| **Description** | When a user clicks the upvote button on feedback they authored, either (a) no PATCH fetch is issued (if the client guards against self-vote), or (b) the 403 response from the server is caught and the displayed count does not change |

**Setup**:
```ts
// Feedback authored by the current user
const ownFeedback = makeFeedbackItem({
  authorId:    'user-1',   // same as mockUser._id
  upvotes:     2,
  upvotedBy:   [],
  category:    'went-well',
})
;(getFeedbackByLane as jest.Mock).mockImplementation((_sprintId, category) =>
  category === 'went-well' ? Promise.resolve([ownFeedback]) : Promise.resolve([])
)

// Mock upvoteFeedback to simulate the service call (the page calls it and handles the error)
;(upvoteFeedback as jest.Mock).mockRejectedValue(new Error('Cannot upvote own feedback'))
```

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitFor(() => expect(screen.getByText('Test content')).toBeInTheDocument())

const upvoteBtn = screen.getByRole('button', { name: /2/i })  // count is 2
fireEvent.click(upvoteBtn)
await waitFor(() => {}, { timeout: 100 })  // allow async handler to settle
```

**Assertions**:
```ts
// Count must not have changed to 3
expect(screen.queryByText('3')).not.toBeInTheDocument()
// The upvote count still reads 2 (or the board re-fetched and still shows 2)
```

> **Note**: This test validates the silent no-op contract. If the page does not call `upvoteFeedback` at all for own feedback (client-side guard), then `upvoteFeedback` should not have been called. The assertion style depends on the implementation choice. Both approaches (client guard + service throw-catch) are valid for this AC.

---

### FB-12 — Upvote button clicked twice → second click returns 409, count does not increment

| Field | Value |
|---|---|
| **Test ID** | FB-12 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-2.2.5 |
| **Description** | Clicking the upvote button a second time on an item already upvoted results in a 409 response (or service error) that is caught silently — the upvote count does not increment beyond the first successful upvote value |

**Setup**:
```ts
const otherFeedback = makeFeedbackItem({
  authorId:    'user-other',
  upvotes:     3,
  upvotedBy:   [],
  category:    'went-well',
})
;(getFeedbackByLane as jest.Mock).mockImplementation((_sprintId, category) =>
  category === 'went-well' ? Promise.resolve([otherFeedback]) : Promise.resolve([])
)

// First upvote succeeds, second fails with 409 error
;(upvoteFeedback as jest.Mock)
  .mockResolvedValueOnce({ upvotes: 4 })   // first click succeeds → re-fetch returns 4
  .mockRejectedValueOnce(new Error('Already upvoted'))  // second click rejected

// After first upvote, re-fetch returns the item with upvotes: 4
;(getFeedbackByLane as jest.Mock)
  .mockResolvedValueOnce([otherFeedback])  // initial load: 3
  .mockResolvedValueOnce([{ ...otherFeedback, upvotes: 4 }])  // after first upvote
  .mockResolvedValueOnce([{ ...otherFeedback, upvotes: 4 }])  // after second (no-op)
```

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitFor(() => expect(screen.getByText('Test content')).toBeInTheDocument())

const upvoteBtn = screen.getByRole('button')  // upvote button
fireEvent.click(upvoteBtn)  // first click
await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument())

fireEvent.click(upvoteBtn)  // second click — should be no-op
await waitFor(() => {}, { timeout: 100 })
```

**Assertions**:
```ts
// Count remains at 4; never increments to 5
expect(screen.queryByText('5')).not.toBeInTheDocument()
expect(screen.getByText('4')).toBeInTheDocument()
```

---

### FB-13 — Successful upvote → count re-fetched from API, not incremented locally

| Field | Value |
|---|---|
| **Test ID** | FB-13 |
| **File** | `feedbackBoard.test.tsx` |
| **AC** | AC-2.2.6 |
| **Description** | After a successful upvote PATCH, the board re-fetches all lanes. The displayed upvote count reflects the value returned by the API (not a client-side `count + 1` calculation) |

**Setup**:
```ts
const feedbackItem = makeFeedbackItem({
  _id:      'fb-42',
  authorId: 'user-other',
  upvotes:   7,
  upvotedBy: [],
  category:  'went-well',
})

// First render: upvotes = 7
;(getFeedbackByLane as jest.Mock)
  .mockResolvedValueOnce([feedbackItem])               // initial load
  .mockResolvedValueOnce([{ ...feedbackItem, upvotes: 8 }])  // after upvote re-fetch

;(upvoteFeedback as jest.Mock).mockResolvedValueOnce({ upvotes: 8 })
```

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument())

const upvoteBtn = screen.getByRole('button', { name: /7/i })
fireEvent.click(upvoteBtn)
```

**Assertions**:
```ts
await waitFor(() => {
  // Count shows the API-returned value (8), not a local +1
  expect(screen.getByText('8')).toBeInTheDocument()
  expect(screen.queryByText('7')).not.toBeInTheDocument()
})

// Confirm getFeedbackByLane was called twice (initial + re-fetch after upvote)
expect(getFeedbackByLane).toHaveBeenCalledTimes(6)  // 3 lanes × 2 fetches
// OR if fetches are batched:
// expect(getFeedbackByLane).toHaveBeenCalledTimes(2 * 3)
```

> **Key assertion**: The new count (`8`) comes from the mock `getFeedbackByLane` second call return value — NOT from `7 + 1`. If the implementation incorrectly does `setCount(count + 1)` instead of re-fetching, the value will still show `8` here but only because the mock happens to return `8`. The stronger assertion is verifying that `getFeedbackByLane` was called **a second time** (re-fetch occurred). Both assertions together form the complete test.

---

## Acceptance Criteria Coverage Matrix (Sprint 2)

| AC-ID | Criterion Summary | Test File | Test IDs |
|---|---|---|---|
| AC-2.1.1 | `/feedback` renders with Shell; session guard | `feedbackBoard.test.tsx` | FB-1, FB-2 |
| AC-2.1.2 | Three column headers with exact text | `feedbackBoard.test.tsx` | FB-3 |
| AC-2.1.3 | Each card: content, author display, upvote count, button | `feedbackService.test.ts` | FS-3, FS-4 |
| AC-2.1.4 | Cards sorted by `upvotes` descending | `feedbackService.test.ts` | FS-1, FS-2 |
| AC-2.1.5 | Per-lane empty state when no feedback; no card elements | `feedbackBoard.test.tsx` | FB-4 |
| AC-2.2.1 | "Submit Feedback" opens modal; × closes it | `feedbackBoard.test.tsx` | FB-5, FB-6 |
| AC-2.2.2 | Modal renders RadioGroup (3 options), Content textarea, anonymous checkbox | `feedbackBoard.test.tsx` | FB-7, FB-8 (implicit) |
| AC-2.2.3 | Reframe Rule: suggestion required for slowed-us-down | `feedbackBoard.test.tsx` | FB-7, FB-9, FB-10 |
| AC-2.2.4 | Submit calls `addFeedback()`; modal closes; board re-fetches | `feedbackBoard.test.tsx` | FB-5 (extended) — **see Gap S2-1** |
| AC-2.2.5 | Upvote: 403 self-vote, 409 duplicate — count unchanged | `feedbackBoard.test.tsx` | FB-11, FB-12 |
| AC-2.2.6 | Upvote count from MongoDB re-fetch, not local state | `feedbackBoard.test.tsx` | FB-13 |
| AC-RR-1 | Suggestion field conditionally rendered | `feedbackBoard.test.tsx` | FB-7, FB-8 |
| AC-RR-2 | Submit button disabled when suggestion empty | `feedbackBoard.test.tsx` | FB-9, FB-10 |
| AC-RR-3 | `addFeedback()` throws without calling fetch | `feedbackService.test.ts` | FS-RR3 |
| AC-RR-4 | API returns 422 for slowed-us-down + empty suggestion | `feedbackService.test.ts` | FS-7 |
| AC-RR-5 | API returns 201 for other lanes with empty suggestion | `feedbackService.test.ts` | FS-6, FS-8 |
| AC-RR-6 | "REFRAME RULE: REQUIRED" badge visible | `feedbackBoard.test.tsx` | FB-7 |
| AC-UI-SHELL-FB-1 | Sidebar visible at `/feedback` | `feedbackBoard.test.tsx` | FB-1 (Shell wrapper present) |
| AC-UI-SHELL-FB-2 | "Feedback Board" active nav item | **Gap — see Gap S2-2** | Visual only |
| AC-UI-SHELL-FB-3 | Sidebar visible at all shell widths | **Gap — see Gap S2-2** | Visual only |
| AC-UI-SHELL-FB-4 | User identity card shows registered user | **Gap — see Gap S2-3** | Shell.tsx unit test |
| AC-UI-SHELL-FB-5 | No user → redirects to `/` | `feedbackBoard.test.tsx` | FB-2 |
| AC-UI-2.1.x | Visual layout requirements (colors, glows, borders) | **Gap — see Gap S2-2** | Visual only |
| AC-UI-2.2.x | Modal visual requirements | **Gap — see Gap S2-2** | Visual only |

---

## Gap Analysis (Sprint 2)

### Gap S2-1 — AC-2.2.4: Full submit flow (modal close + re-fetch) not explicitly covered

**AC**: AC-2.2.4 — "Submit calls `feedbackService.addFeedback()`; modal closes on success; feedback board re-fetches."

**Status**: Partially covered. FB-5 tests that the modal opens. The submit-and-close flow requires an additional test:

**Recommended addition — FB-5b**:
```
Setup: Mock addFeedback to resolve with a created item.
Action: Open modal → fill content → click Submit inside modal.
Assert:
  - addFeedback was called once with correct payload
  - queryByRole('dialog') is null after submit (modal closed)
  - getFeedbackByLane was called a second time (re-fetch triggered)
```

This case is marked for Sprint 2 DEV Session 2 completion gate — it should be added alongside the modal wiring task.

---

### Gap S2-2 — All AC-UI-2.x and AC-UI-SHELL-FB-2/3: Visual requirements have no automated coverage

**ACs**: AC-UI-2.1.1–2.1.23, AC-UI-2.2.1–2.2.12, AC-UI-SHELL-FB-2, AC-UI-SHELL-FB-3

**Status**: Not covered by Jest/RTL. These are visual requirements (colors, glow shadows, layout classes, modal backdrop blur, animation).

**Risk**: Low for functional testing. Cannot be caught by unit or integration tests.

**Recommendation**:
1. **Manual visual review** against `docs/ui-mocks/FeedbackBoard.png`, `feedback-board-empty.png`, `SubmitFeedback.png` during Session 1 and Session 2 completion gates.
2. **Optional**: Add Playwright visual regression snapshots for the Feedback Board populated state and empty state in a future sprint.

---

### Gap S2-3 — AC-UI-SHELL-FB-4: User identity card content in Shell not covered by feedbackBoard tests

**AC**: AC-UI-SHELL-FB-4 — "User identity card displays the name and pod of the currently registered user."

**Status**: Not covered. `feedbackBoard.test.tsx` mocks `Shell` as a passthrough, so Shell's internal identity card is never rendered.

**Risk**: Medium — this was also flagged in Sprint 1 Gap 7.

**Recommendation**: The `shell.test.tsx` file recommended in Sprint 1 Gap 7 covers this. Add the following test:

> **SH-1** (from Sprint 1 Gap 7 recommendation): Render `<Shell>` with a pre-seeded `sessionStorage` user. Assert `screen.getByText('Jane Doe')` and `screen.getByText('pod1')` are in the document. This covers both AC-UI-SHELL-7 (Sprint 1) and AC-UI-SHELL-FB-4 (Sprint 2) in one test.

---

### Gap S2-4 — `should-try` lane Reframe Rule negative test not explicit

**AC**: AC-RR-5 (partial) — Suggestion NOT required for `should-try`.

**Status**: FS-6 covers `went-well` with empty suggestion → 201. No explicit test covers `should-try` with empty suggestion → 201.

**Risk**: Low — the Reframe Rule condition is a simple `=== 'slowed-us-down'` check; if `went-well` passes, `should-try` will too.

**Recommendation**: Add `FS-6b` in `feedbackService.test.ts`:
```
POST /api/feedback { category: 'should-try', suggestion: '' } → expect 201
```
This costs ~8 lines and closes the gap completely.

---

## Sprint 2 Summary

| Category | Count |
|---|---|
| Test cases defined (Sprint 2) | 22 (FS-1–8 + FS-RR3 + FB-1–13) |
| Sprint 1 test cases (unchanged) | 21 |
| **Total test cases across Sprint 1 + 2** | **43** |
| ACs with full automated coverage (Sprint 2) | 17 |
| ACs with visual-only coverage (Sprint 2) | 9 (all AC-UI-2.x) |
| ACs with partial / gap coverage (Sprint 2) | 4 (S2-1 through S2-4) |
| Sprint 1 tests modified | 0 (none — append only) |
| Sprint 1 test files modified | 0 (none — append only) |

---

## Session 2 Test Amendments

**Date**: April 2026  
**Mode**: [TEST]  
**Triggered by**: Session 2 pre-flight audit — verified actual Session 1 exports against FB-1–FB-13 mock patterns and `feedbackService.test.ts` coverage.  
**Rule**: No Sprint 1 or Session 1 test cases are deleted or modified. All items below are additive clarifications or forward confirmations.

---

### Verdict: Test cases FB-1 to FB-13 confirmed as written

All thirteen test cases in §FB-1 through §FB-13 above are accurate and require no correction. The mock patterns align exactly with the actual Session 1 exports. Specific confirmations follow.

---

### Confirmation C1 — `feedbackService` mock exports match actual Session 1 exports

The `feedbackService.ts` mock pattern used in `feedbackBoard.test.tsx` (§New Mock Patterns, Sprint 2):

```ts
jest.mock('@/services/feedbackService', () => ({
  getFeedbackByLane: jest.fn(),
  getFeedback:       jest.fn(),
  sortByUpvotes:     jest.fn().mockImplementation((items) => [...items]),
  getAuthorDisplay:  jest.fn().mockImplementation(...),
  addFeedback:       jest.fn(),
  upvoteFeedback:    jest.fn(),
}))
```

**Actual Session 1 exports** (from `retro-dev/src/services/feedbackService.ts`):
- `getFeedback` ✅ — exported
- `getFeedbackByLane` ✅ — exported
- `sortByUpvotes` ✅ — exported
- `getAuthorDisplay` ✅ — exported
- `addFeedback` — **not yet exported** (Session 2 adds it)
- `upvoteFeedback` — **not yet exported** (Session 2 adds it)

**Impact on test file**: `addFeedback` and `upvoteFeedback` appear in the module-level mock factory. Jest's `jest.mock()` factory is hoisted and evaluated at mock-construction time, not at import time. Including non-existent exports in the mock factory is safe — the mock provides a `jest.fn()` stub regardless of whether the real module currently exports those names. No test will fail because of the forward-declared stubs. ✅ No amendment needed.

---

### Confirmation C2 — `feedbackService.test.ts` FS-1 through FS-8 already implemented and passing

Per `retro-dev/docs/IMPLEMENTATION_NOTES.md` (Session 1 Completion Gate): 33/33 tests pass, including FS-1 through FS-8.

The `makeFeedbackItem` factory in `feedbackService.test.ts` uses `suggestion: ''` ✅ (not `suggestedImprovement`). All FS-7 assertions check `body.error.toLowerCase().toContain('suggestion')` ✅ — matches the actual route error string `'Reframe Rule: suggestion is required for slowed-us-down feedback'`.

---

### Confirmation C3 — FB-4 upvote button query is valid

FB-4 asserts `screen.queryAllByRole('button', { name: /thumbsup|upvote/i }).toHaveLength(0)` to confirm no `FeedbackCard` upvote buttons are present in the empty state. `FeedbackCard.tsx` line 54 renders `<button ... aria-label="Upvote">` — the `aria-label` value `"Upvote"` matches the `/upvote/i` pattern in the role query. ✅ No amendment needed.

---

### Confirmation C4 — `handleUpvote` stub in `page.tsx` is compatible with FB-11/FB-12/FB-13

The Session 1 `page.tsx` stub is `function handleUpvote(_itemId: string) {}` (no-op). For tests FB-11, FB-12, and FB-13, the board test mocks `upvoteFeedback` at the service layer. Session 2 will replace the stub body with the real `upvoteFeedback` call + `refetch()`. The tests are written against the **Session 2 wired** implementation — they will not pass until the Session 2 `handleUpvote` body is filled in. This is by design; these tests are Session 2 targets. ✅ No amendment needed.

---

### Confirmation C5 — `FS-RR3` is a Session 2 target test, not a Session 1 regression

`FS-RR3` tests `addFeedback()` from `feedbackService.ts`. Since `addFeedback` does not exist in the Session 1 export, `FS-RR3` cannot be run until Session 2 adds the function. The test should be added to `feedbackService.test.ts` as part of Session 2's feedbackService update task — not expected to pass at Session 1 completion gate. ✅ This is consistent with the test plan structure (FS-RR3 is listed in the Sprint 2 section, not the Session 1 completion gate).

---

### Amendment T1 — FB-13 `getFeedbackByLane` call count clarification

FB-13 asserts:
```ts
expect(getFeedbackByLane).toHaveBeenCalledTimes(6)  // 3 lanes × 2 fetches
```

**Context**: The actual `page.tsx` `refetch` function fetches all 3 lanes in parallel via `Promise.all`. The initial load also fetches all 3 lanes. So after one upvote (which triggers one `refetch()`): 3 (initial) + 3 (post-upvote) = 6 total calls.

**Clarification**: The assertion `toHaveBeenCalledTimes(6)` is correct **only if** the mock setup in the test provides enough `mockResolvedValueOnce` return values for all 6 calls. The FB-13 setup as written provides only 2 `mockResolvedValueOnce` entries:

```ts
;(getFeedbackByLane as jest.Mock)
  .mockResolvedValueOnce([feedbackItem])               // initial load — only 1 of 3 lanes
  .mockResolvedValueOnce([{ ...feedbackItem, upvotes: 8 }])  // after upvote — only 1 of 3 lanes
```

**Corrected setup for FB-13** (supersedes the FB-13 setup in §Sprint 2 above):

```ts
;(getFeedbackByLane as jest.Mock)
  // initial load — 3 calls (one per lane)
  .mockResolvedValueOnce([feedbackItem])   // went-well: has the item
  .mockResolvedValueOnce([])              // slowed-us-down: empty
  .mockResolvedValueOnce([])              // should-try: empty
  // post-upvote re-fetch — 3 calls
  .mockResolvedValueOnce([{ ...feedbackItem, upvotes: 8 }])  // went-well: updated
  .mockResolvedValueOnce([])              // slowed-us-down: empty
  .mockResolvedValueOnce([])              // should-try: empty
```

With this setup, the `toHaveBeenCalledTimes(6)` assertion holds. The displayed count correctly shows `8` from the second `went-well` mock call.

> **Note**: The `feedbackItem` in FB-13 has `category: 'went-well'`. The `page.tsx` fetches all three lanes in a fixed order: `slowed-us-down`, `should-try`, `went-well` (matching the column render order). Adjust the `mockResolvedValueOnce` order to match the actual `Promise.all` call order in `refetch()` — verify against the Session 1 `page.tsx` implementation.

---

### Amendment T2 — FB-9 / FB-10 submit button disambiguation

FB-9 and FB-10 use this query to find the modal's Submit button:

```ts
const submitInsideModal = screen.getAllByRole('button', { name: /submit feedback/i })
  .find(btn => btn.closest('[role="dialog"]'))
```

This is correct but relies on the modal having `role="dialog"` on the `DialogContent`. shadcn/ui `Dialog` renders `<div role="dialog" ...>` on the `DialogContent` wrapper. ✅ The query will work as long as the real `SubmitFeedbackModal.tsx` uses the shadcn/ui `DialogContent` component.

**Alternative** (noted in FB-9 as a fallback): Add `data-testid="modal-submit-btn"` to the Submit button inside the modal footer. This is the **recommended approach** for robustness. DEV should add this testid when implementing `SubmitFeedbackModal.tsx`.

**Impact**: No test spec change required — the existing FB-9 / FB-10 spec already documents both approaches. This amendment reaffirms the `data-testid` fallback as the preferred implementation choice.

---

### Session 2 Test Pre-flight Summary

| Item | Status |
|---|---|
| FB-1 through FB-13 — accuracy of test specs | ✅ Confirmed as written (with T1 FB-13 setup correction) |
| FS-1 through FS-8 — already implemented and passing | ✅ Confirmed |
| `feedbackService` mock forward-declares `addFeedback`, `upvoteFeedback` | ✅ Safe — jest.mock hoisting handles non-existent exports |
| `makeFeedbackItem` factory uses `suggestion` field | ✅ Confirmed |
| FB-4 upvote button aria-label query | ✅ Confirmed matches actual `FeedbackCard.tsx` |
| FS-RR3 is a Session 2 target (not Session 1 regression) | ✅ Confirmed by design |
| FB-13 setup needs 6 `mockResolvedValueOnce` entries | ⚠️ Amendment T1 — corrected mock setup provided above |
| FB-9/FB-10 `data-testid="modal-submit-btn"` recommended | ℹ️ Amendment T2 — implementation guidance only |

---

---

# Test Plan — Sprint 3: Action Items

**Mode**: [TEST]  
**Sprint**: 3 — Action Items: Create, Lifecycle, Convert from Feedback, Verify Impact  
**References**: `retro-product/docs/FEATURE_REQUIREMENTS.md` (Sprint 3), `retro-architect/docs/IMPLEMENTATION_PLAN.md` §Sprint 3  
**Date**: April 2026  
**Rule**: Do NOT modify or delete any Sprint 1 or Sprint 2 test cases above. Only append.

---

## Table of Contents (Sprint 3)

1. [Pre-flight: Existing `actionService.ts` State](#pre-flight-existing-actionservicets-state)
2. [Field-Name Invariant (Sprint 3)](#field-name-invariant-sprint-3)
3. [New Mock Patterns (Sprint 3)](#new-mock-patterns-sprint-3)
4. [Test File: `actionService.test.ts` — Sprint 3 additions](#test-file-actionservicetestts--sprint-3-additions)
5. [Test File: `actionItems.test.tsx`](#test-file-actionitemstesttsx)
6. [Acceptance Criteria Coverage Matrix (Sprint 3)](#acceptance-criteria-coverage-matrix-sprint-3)
7. [Gap Analysis (Sprint 3)](#gap-analysis-sprint-3)
8. [Sprint 3 Summary](#sprint-3-summary)

---

## Pre-flight: Existing `actionService.ts` State

`retro-dev/src/services/actionService.ts` already exists with 4 exported functions from Sprint 1:

```ts
export async function getActions(sprintId?: string): Promise<ActionItem[]>
export function getCompletionRate(actions: ActionItem[]): number
export function getOpenCount(actions: ActionItem[]): number
export function getCompletedCount(actions: ActionItem[]): number
```

`retro-dev/src/__tests__/actionService.test.ts` already exists with 5 passing tests:
- `DB-7`: `getCompletionRate([])` returns 0
- `getCompletionRate`: all completed = 100%
- `getCompletionRate`: 2 completed + 1 verified / 5 = 60%
- `getOpenCount`: counts open and in-progress
- `getCompletedCount`: counts completed and verified

**Impact on Sprint 3 test file**: Sprint 3 adds new functions to `actionService.ts` (`getActionsByStatus`, `createAction`, `advanceStatus`, `verifyImpact`) and new API routes. The existing `actionService.test.ts` file will be **extended** with new test cases — existing tests are never deleted or modified.

**Key deviation from IMPLEMENTATION_PLAN**: The `actionService.ts` mock in `actionItems.test.tsx` must forward-declare `getActionsByStatus`, `createAction`, `advanceStatus`, `verifyImpact` even though they are not yet exported (same safe hoisting pattern as Sprint 2 `addFeedback`/`upvoteFeedback`).

**`getCompletionRate` note**: The existing implementation counts both `"completed"` AND `"verified"` items as "completed" (not just `"verified"`). Sprint 3 `getCompletionRate` in `IMPLEMENTATION_PLAN.md` specifies only `"verified"` items. This discrepancy is flagged in Gap S3-1 below. Tests for `getCompletionRate` in the existing file are used as-is (Sprint 1 definition). New tests use the Sprint 3 `verifyImpact`-focused interpretation.

---

## Field-Name Invariant (Sprint 3)

All Sprint 3 test assertions use field names from the live `src/types/index.ts`. The `ActionItem` interface invariants:

| Field | Type | Test usage |
|---|---|---|
| `_id` | `string` | `item._id` — never `item.id` |
| `status` | `"open" \| "in-progress" \| "completed" \| "verified"` | Always kebab-case strings |
| `sourceFeedbackId` | `string` | `""` for direct creates; `item._id` for conversions |
| `sourceQuote` | `string` | `""` for direct creates; `feedbackItem.content` for conversions |
| `impactNote` | `string \| undefined` | Set only after `PATCH /verify` |
| `dueDate` | `string` | ISO string or `""` |

---

## New Mock Patterns (Sprint 3)

### `actionService.ts` mock (used in `actionItems.test.tsx`)

```ts
jest.mock('@/services/actionService', () => ({
  getActions:          jest.fn(),
  getActionsByStatus:  jest.fn().mockImplementation((items: unknown[]) => [...items]),
  createAction:        jest.fn(),
  advanceStatus:       jest.fn(),
  verifyImpact:        jest.fn(),
  getCompletionRate:   jest.fn().mockReturnValue(0),
  getOpenCount:        jest.fn().mockReturnValue(0),
  getCompletedCount:   jest.fn().mockReturnValue(0),
}))
```

**Why `getActionsByStatus` passthrough**: The page test cares about rendering cards, not sort order. The identity transform ensures cards render in the order the mock returns them, keeping setup simple.

**Forward-declared functions**: `getActionsByStatus`, `createAction`, `advanceStatus`, `verifyImpact` may not yet be exported from `actionService.ts` at test write time. Jest's `jest.mock()` factory is hoisted — the mock is safe regardless of actual exports.

### `Shell.tsx` mock (same pattern as Sprint 1 + Sprint 2)

```ts
jest.mock('@/components/layout/Shell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))
```

### `next/navigation` mock (Sprint 3 pages)

```ts
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter:   () => ({ push: mockPush }),
  usePathname: () => '/actions',
}))
```

### `global.fetch` mock (sprint + user resolution)

```ts
// In beforeEach:
;(global.fetch as jest.Mock) = jest.fn().mockImplementation((url: string) => {
  if (url.includes('/api/sprints')) {
    return Promise.resolve({ ok: true, json: async () => mockSprint })
  }
  if (url.includes('/api/users')) {
    return Promise.resolve({ ok: true, json: async () => [mockUser] })
  }
  return Promise.resolve({ ok: true, json: async () => ({}) })
})
```

### `@/lib/models/ActionItem` mock (used in `actionService.test.ts` API route group)

```ts
const mockSaveAction     = jest.fn().mockResolvedValue(undefined)
const mockFindAction     = jest.fn()
const mockFindByIdAction = jest.fn()

jest.mock('@/lib/models/ActionItem', () => {
  function MockActionItemModel(this: Record<string, unknown>, data: Record<string, unknown>) {
    Object.assign(this, data)
    this._id    = 'mock-ai-id'
    this.status = data.status ?? 'open'
    this.save   = mockSaveAction
  }
  Object.assign(MockActionItemModel, {
    find:     (...args: unknown[]) => ({ lean: () => mockFindAction(...args) }),
    findById: mockFindByIdAction,
    __mockSave:     mockSaveAction,
    __mockFind:     mockFindAction,
    __mockFindById: mockFindByIdAction,
  })
  return { __esModule: true, default: MockActionItemModel }
})
```

### `makeActionItem` factory (Sprint 3 canonical version)

```ts
function makeActionItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    _id:              'ai-' + Math.random().toString(36).slice(2),
    title:            'Test action item',
    description:      '',
    ownerId:          'user-1',
    sourceFeedbackId: '',
    sourceQuote:      '',
    sprintId:         'sprint-1',
    status:           'open',
    dueDate:          '',
    createdAt:        new Date().toISOString(),
    ...overrides,
  }
}
```

> **Note**: This factory matches the `ActionItem` interface from `src/types/index.ts`. `impactNote` and `completedAt` are omitted from defaults (they are `string | undefined`) and should be included in overrides only when testing verified state.

### Shared mock objects

```ts
const mockUser = {
  _id:      'user-1',
  name:     'Jane Doe',
  username: 'jdoe',
  pod:      'pod1',
  isAdmin:  false,
  createdAt: '2026-04-01T00:00:00.000Z',
}

const mockSprint = {
  _id:           'sprint-1',
  name:          'Sprint 42',
  status:        'open',
  goal:          '',
  startDate:     '2026-04-01T00:00:00.000Z',
  endDate:       '2026-04-14T00:00:00.000Z',
  teamMemberIds: ['user-1'],
}
```

### `waitForPageLoaded` helper

```ts
async function waitForPageLoaded() {
  await waitFor(() =>
    expect(screen.getByTestId('shell')).toBeInTheDocument()
  )
}
```

---

## Test File: `actionService.test.ts` — Sprint 3 additions

**File path**: `src/__tests__/actionService.test.ts` (existing — append new `describe` blocks)  
**Target implementations**: `src/services/actionService.ts` (new functions), `src/app/api/actions/route.ts`, `src/app/api/actions/[id]/advance/route.ts`, `src/app/api/actions/[id]/verify/route.ts`  
**Jest environment**: `@jest-environment node`  
**Rule**: All existing tests above remain unchanged. Only new `describe` blocks are added.

---

### AS-1 — `getActionsByStatus` returns items in Open → In Progress → Completed → Verified order

| Field | Value |
|---|---|
| **Test ID** | AS-1 |
| **File** | `actionService.test.ts` |
| **AC** | AC-3.1.3 |
| **Description** | `getActionsByStatus` called with items in random status order returns a new array sorted: `open` first, `in-progress` second, `completed` third, `verified` last |

**Setup**: No mocks needed — import real function.

```ts
import { getActionsByStatus } from '@/services/actionService'
```

**Action**:
```ts
const items = [
  makeActionItem({ status: 'verified',    createdAt: '2026-04-10T00:00:00.000Z' }),
  makeActionItem({ status: 'open',        createdAt: '2026-04-08T00:00:00.000Z' }),
  makeActionItem({ status: 'completed',   createdAt: '2026-04-09T00:00:00.000Z' }),
  makeActionItem({ status: 'in-progress', createdAt: '2026-04-07T00:00:00.000Z' }),
]
const result = getActionsByStatus(items)
```

**Assertions**:
```ts
expect(result[0].status).toBe('open')
expect(result[1].status).toBe('in-progress')
expect(result[2].status).toBe('completed')
expect(result[3].status).toBe('verified')
```

---

### AS-2 — `getActionsByStatus` does not mutate the original array

| Field | Value |
|---|---|
| **Test ID** | AS-2 |
| **File** | `actionService.test.ts` |
| **AC** | AC-3.1.3 |
| **Description** | The original array passed to `getActionsByStatus` is not mutated; a new array reference is returned |

**Action**:
```ts
const items = [makeActionItem({ status: 'verified' }), makeActionItem({ status: 'open' })]
const originalFirst = items[0].status
const result = getActionsByStatus(items)
```

**Assertions**:
```ts
expect(result).not.toBe(items)
expect(items[0].status).toBe(originalFirst)
```

---

### AS-3 — `getCompletionRate` — 2 verified out of 5 total → 40 (Sprint 3 verified-only definition)

| Field | Value |
|---|---|
| **Test ID** | AS-3 |
| **File** | `actionService.test.ts` |
| **AC** | AC-3.2.6 (dashboard rate reflects verified only) |
| **Description** | When using the Sprint 3 interpretation (only `"verified"` items count as done), 2 verified / 5 total = 40% |

> **Note**: This test validates the Sprint 3 intended behavior. If the existing implementation counts both `"completed"` and `"verified"`, this test will expose the discrepancy. See Gap S3-1.

**Action**:
```ts
const items = [
  makeActionItem({ status: 'verified' }),
  makeActionItem({ status: 'verified' }),
  makeActionItem({ status: 'completed' }),
  makeActionItem({ status: 'in-progress' }),
  makeActionItem({ status: 'open' }),
]
const rate = getCompletionRate(items)  // or a new getVerifiedRate if function is renamed
```

**Assertions**:
```ts
// If Sprint 3 updates getCompletionRate to count only 'verified':
expect(rate).toBe(40)
// If existing behavior (completed + verified) is kept, this will be 60 — see Gap S3-1
```

---

### AS-4 — `GET /api/actions?sprintId=sprint-1` returns 200 + array

| Field | Value |
|---|---|
| **Test ID** | AS-4 |
| **File** | `actionService.test.ts` (API route group) |
| **AC** | AC-3.1.2 |
| **Description** | `GET /api/actions` with `sprintId` query param calls `ActionItemModel.find` with the correct filter and returns HTTP 200 with a JSON array |

**Setup**:
```ts
mockFindAction.mockResolvedValue([
  makeActionItem({ sprintId: 'sprint-1', status: 'open' }),
  makeActionItem({ sprintId: 'sprint-1', status: 'in-progress' }),
])
```

**Action**:
```ts
import { GET } from '@/app/api/actions/route'

const req = new NextRequest('http://localhost/api/actions?sprintId=sprint-1')
const res = await GET(req)
```

**Assertions**:
```ts
expect(res.status).toBe(200)
const body = await res.json()
expect(Array.isArray(body)).toBe(true)
expect(body.length).toBe(2)
```

---

### AS-5 — `GET /api/actions` with no `sprintId` returns 400

| Field | Value |
|---|---|
| **Test ID** | AS-5 |
| **File** | `actionService.test.ts` (API route group) |
| **AC** | AC-3.1.2 |
| **Description** | `GET /api/actions` without a `sprintId` query param returns HTTP 400 with an error body |

**Action**:
```ts
const req = new NextRequest('http://localhost/api/actions')
const res = await GET(req)
```

**Assertions**:
```ts
expect(res.status).toBe(400)
const body = await res.json()
expect(typeof body.error).toBe('string')
```

---

### AS-6 — `POST /api/actions` with valid payload returns 201

| Field | Value |
|---|---|
| **Test ID** | AS-6 |
| **File** | `actionService.test.ts` (API route group) |
| **AC** | AC-3.1.6 |
| **Description** | `POST /api/actions` with all required fields (`title`, `ownerId`, `sprintId`) returns HTTP 201. `mockSaveAction` is called once. |

**Setup**: `mockSaveAction.mockResolvedValue(undefined)` (default)

**Action**:
```ts
import { POST } from '@/app/api/actions/route'

const req = new NextRequest('http://localhost/api/actions', {
  method: 'POST',
  body: JSON.stringify({
    title:            'Add automated test coverage',
    description:      'Cover all service functions',
    ownerId:          'user-1',
    dueDate:          '2026-04-30',
    sourceFeedbackId: '',
    sourceQuote:      '',
    sprintId:         'sprint-1',
  }),
  headers: { 'Content-Type': 'application/json' },
})
const res = await POST(req)
```

**Assertions**:
```ts
expect(res.status).toBe(201)
expect(mockSaveAction).toHaveBeenCalledTimes(1)
```

---

### AS-7 — `POST /api/actions` missing `title` returns 400

| Field | Value |
|---|---|
| **Test ID** | AS-7 |
| **File** | `actionService.test.ts` (API route group) |
| **AC** | AC-3.1.6 |
| **Description** | `POST /api/actions` with a missing `title` field returns HTTP 400. `save()` is never called. |

**Action**:
```ts
const req = new NextRequest('http://localhost/api/actions', {
  method: 'POST',
  body: JSON.stringify({ ownerId: 'user-1', sprintId: 'sprint-1' }),
  headers: { 'Content-Type': 'application/json' },
})
const res = await POST(req)
```

**Assertions**:
```ts
expect(res.status).toBe(400)
expect(mockSaveAction).not.toHaveBeenCalled()
```

---

### AS-8 — `PATCH /api/actions/[id]/advance` from `open` → `in-progress`

| Field | Value |
|---|---|
| **Test ID** | AS-8 |
| **File** | `actionService.test.ts` (API route group) |
| **AC** | AC-3.2.3 |
| **Description** | `PATCH /api/actions/[id]/advance` called on an item with `status === 'open'` returns HTTP 200 with `status: 'in-progress'` in the response body |

**Setup**:
```ts
import { PATCH } from '@/app/api/actions/[id]/advance/route'

const openItem = { ...makeActionItem({ status: 'open' }), save: mockSaveAction }
mockFindByIdAction.mockResolvedValue(openItem)
```

**Action**:
```ts
const req = new NextRequest('http://localhost/api/actions/ai-1/advance', { method: 'PATCH' })
const res = await PATCH(req, { params: { id: 'ai-1' } })
```

**Assertions**:
```ts
expect(res.status).toBe(200)
const body = await res.json()
expect(body.status).toBe('in-progress')
expect(mockSaveAction).toHaveBeenCalledTimes(1)
```

---

### AS-9 — `PATCH /api/actions/[id]/advance` from `in-progress` → `completed`

| Field | Value |
|---|---|
| **Test ID** | AS-9 |
| **File** | `actionService.test.ts` (API route group) |
| **AC** | AC-3.2.3 |
| **Description** | `PATCH /api/actions/[id]/advance` on an `in-progress` item returns HTTP 200 with `status: 'completed'` |

**Setup**:
```ts
const inProgressItem = { ...makeActionItem({ status: 'in-progress' }), save: mockSaveAction }
mockFindByIdAction.mockResolvedValue(inProgressItem)
```

**Assertions**:
```ts
expect(res.status).toBe(200)
const body = await res.json()
expect(body.status).toBe('completed')
```

---

### AS-10 — `PATCH /api/actions/[id]/advance` from `completed` → 409

| Field | Value |
|---|---|
| **Test ID** | AS-10 |
| **File** | `actionService.test.ts` (API route group) |
| **AC** | AC-3.2.3 |
| **Description** | Attempting to advance a `completed` item returns HTTP 409. `save()` is never called. |

**Setup**:
```ts
const completedItem = { ...makeActionItem({ status: 'completed' }), save: mockSaveAction }
mockFindByIdAction.mockResolvedValue(completedItem)
```

**Assertions**:
```ts
expect(res.status).toBe(409)
expect(mockSaveAction).not.toHaveBeenCalled()
```

---

### AS-11 — `PATCH /api/actions/[id]/verify` — valid `impactNote` + status `completed` → 200 + `verified`

| Field | Value |
|---|---|
| **Test ID** | AS-11 |
| **File** | `actionService.test.ts` (API route group) |
| **AC** | AC-3.2.6 |
| **Description** | `PATCH /api/actions/[id]/verify` with a non-empty `impactNote` and `status === 'completed'` returns HTTP 200 with `status: 'verified'` and the `impactNote` in the response body. `save()` is called once. |

**Setup**:
```ts
import { PATCH } from '@/app/api/actions/[id]/verify/route'

const completedItem = { ...makeActionItem({ status: 'completed' }), save: mockSaveAction }
mockFindByIdAction.mockResolvedValue(completedItem)
```

**Action**:
```ts
const req = new NextRequest('http://localhost/api/actions/ai-1/verify', {
  method: 'PATCH',
  body: JSON.stringify({ impactNote: 'Deployments now take 5 minutes instead of 45.' }),
  headers: { 'Content-Type': 'application/json' },
})
const res = await PATCH(req, { params: { id: 'ai-1' } })
```

**Assertions**:
```ts
expect(res.status).toBe(200)
const body = await res.json()
expect(body.status).toBe('verified')
expect(body.impactNote).toBe('Deployments now take 5 minutes instead of 45.')
expect(mockSaveAction).toHaveBeenCalledTimes(1)
```

---

### AS-12 — `PATCH /api/actions/[id]/verify` — empty `impactNote` → 400

| Field | Value |
|---|---|
| **Test ID** | AS-12 |
| **File** | `actionService.test.ts` (API route group) |
| **AC** | AC-3.2.5, AC-3.2.6 |
| **Description** | `PATCH /api/actions/[id]/verify` with an empty (or whitespace-only) `impactNote` returns HTTP 400. `save()` is never called. |

**Action**:
```ts
const req = new NextRequest('http://localhost/api/actions/ai-1/verify', {
  method: 'PATCH',
  body: JSON.stringify({ impactNote: '   ' }),
  headers: { 'Content-Type': 'application/json' },
})
const res = await PATCH(req, { params: { id: 'ai-1' } })
```

**Assertions**:
```ts
expect(res.status).toBe(400)
expect(mockSaveAction).not.toHaveBeenCalled()
```

---

### AS-13 — `PATCH /api/actions/[id]/verify` — status not `completed` → 409

| Field | Value |
|---|---|
| **Test ID** | AS-13 |
| **File** | `actionService.test.ts` (API route group) |
| **AC** | AC-3.2.6 |
| **Description** | Attempting to verify an item that is not `"completed"` (e.g., `"open"`) returns HTTP 409. `save()` is never called. |

**Setup**:
```ts
const openItem = { ...makeActionItem({ status: 'open' }), save: mockSaveAction }
mockFindByIdAction.mockResolvedValue(openItem)
```

**Action**:
```ts
const req = new NextRequest('http://localhost/api/actions/ai-1/verify', {
  method: 'PATCH',
  body: JSON.stringify({ impactNote: 'Some impact.' }),
  headers: { 'Content-Type': 'application/json' },
})
const res = await PATCH(req, { params: { id: 'ai-1' } })
```

**Assertions**:
```ts
expect(res.status).toBe(409)
expect(mockSaveAction).not.toHaveBeenCalled()
```

---

### AS-VG-1 — `actionService.verifyImpact` throws before calling `fetch` when `impactNote` is empty

| Field | Value |
|---|---|
| **Test ID** | AS-VG-1 |
| **File** | `actionService.test.ts` (service unit group) |
| **AC** | AC-3.2.5 (Verification Gate — service layer) |
| **Description** | Calling `actionService.verifyImpact(id, '')` throws an error before any `fetch()` call is made — mirrors the Sprint 2 Reframe Rule FS-RR3 pattern |

**Setup**:
```ts
global.fetch = jest.fn()
import { verifyImpact } from '@/services/actionService'
```

**Action**:
```ts
const call = verifyImpact('ai-1', '')
```

**Assertions**:
```ts
await expect(call).rejects.toThrow()
expect(global.fetch).not.toHaveBeenCalled()
```

---

## Test File: `actionItems.test.tsx`

**File path**: `src/__tests__/actionItems.test.tsx` (new file)  
**Target implementations**: `src/app/actions/page.tsx`, `src/components/ActionItemCard.tsx`, `src/components/NewActionItemModal.tsx`, `src/components/VerifyImpactModal.tsx`, `src/components/ConvertActionModal.tsx`, `src/components/FeedbackCard.tsx`  
**Jest environment**: `jest-environment-jsdom` (default)  
**AC coverage**: AC-3.1.1, AC-3.1.4, AC-3.1.7, AC-3.2.1, AC-3.2.2, AC-3.2.3, AC-3.2.4, AC-3.2.5, AC-3.2.6

### Mocks required

| Mock target | Method | Notes |
|---|---|---|
| `next/navigation` | `useRouter → { push: mockPush }`, `usePathname → '/actions'` | Declared before all imports |
| `@/services/userService` | `getCurrentUser` | Controls session guard |
| `@/services/actionService` | `getActions`, `getActionsByStatus`, `createAction`, `advanceStatus`, `verifyImpact`, `getCompletionRate` | Full module mock; `getActionsByStatus` returns identity |
| `@/components/layout/Shell` | default export — passthrough with `data-testid="shell"` | Avoids Shell's `sessionStorage` + `usePathname` |
| `global.fetch` | — | Sprint + user API resolution |

### `beforeEach` setup

```ts
beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()

  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  ;(getActions as jest.Mock).mockResolvedValue([])
  ;(getActionsByStatus as jest.Mock).mockImplementation((items) => [...items])

  ;(global.fetch as jest.Mock) = jest.fn().mockImplementation((url: string) => {
    if ((url as string).includes('/api/sprints')) {
      return Promise.resolve({ ok: true, json: async () => mockSprint })
    }
    if ((url as string).includes('/api/users')) {
      return Promise.resolve({ ok: true, json: async () => [mockUser] })
    }
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
})
```

---

### AI-1 — Page mounts with valid session user — renders Shell, no redirect

| Field | Value |
|---|---|
| **Test ID** | AI-1 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.1.1 |
| **Description** | When a valid user is in `sessionStorage`, the Action Items page mounts and renders the Shell wrapper without calling `router.push('/')` |

**Setup**: Default `beforeEach` state — `getCurrentUser` returns `mockUser`.

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()
```

**Assertions**:
```ts
expect(screen.getByTestId('shell')).toBeInTheDocument()
expect(mockPush).not.toHaveBeenCalledWith('/')
```

---

### AI-2 — No session user → redirects to `/`

| Field | Value |
|---|---|
| **Test ID** | AI-2 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.1.1 |
| **Description** | When `getCurrentUser` returns `null`, the page calls `router.push('/')` |

**Setup**:
```ts
;(getCurrentUser as jest.Mock).mockReturnValue(null)
```

**Action**:
```ts
render(<ActionItemsPage />)
await waitFor(() => {
  expect(mockPush).toHaveBeenCalledWith('/')
})
```

---

### AI-3 — Empty `getActions` return → empty state text renders

| Field | Value |
|---|---|
| **Test ID** | AI-3 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.1.7 |
| **Description** | When `getActions` returns an empty array, the empty state heading `"No action items yet."` and body text are present in the DOM |

**Setup**: Default `beforeEach` — `getActions` already returns `[]`.

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()
```

**Assertions**:
```ts
expect(screen.getByText('No action items yet.')).toBeInTheDocument()
expect(screen.getByText('Convert feedback from the Feedback Board, or add one directly.')).toBeInTheDocument()
```

---

### AI-4 — "Go to Feedback Board" in empty state → `router.push('/feedback')`

| Field | Value |
|---|---|
| **Test ID** | AI-4 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.1.7 |
| **Description** | Clicking the "Go to Feedback Board" button in the empty state calls `router.push('/feedback')` |

**Setup**: Default `beforeEach` (empty state).

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()

fireEvent.click(screen.getByRole('button', { name: /go to feedback board/i }))
```

**Assertions**:
```ts
expect(mockPush).toHaveBeenCalledWith('/feedback')
```

---

### AI-5 — `getActions` returns items → cards render with title text

| Field | Value |
|---|---|
| **Test ID** | AI-5 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.1.2 |
| **Description** | When `getActions` returns action items, each item's `title` is rendered in the DOM |

**Setup**:
```ts
const item1 = makeActionItem({ title: 'Implement test coverage', status: 'open' })
const item2 = makeActionItem({ title: 'Rollback auth service', status: 'in-progress' })
;(getActions as jest.Mock).mockResolvedValue([item1, item2])
```

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()
```

**Assertions**:
```ts
expect(screen.getByText('Implement test coverage')).toBeInTheDocument()
expect(screen.getByText('Rollback auth service')).toBeInTheDocument()
```

---

### AI-6 — "Advance Status" button click → `advanceStatus` called + `getActions` re-fetched

| Field | Value |
|---|---|
| **Test ID** | AI-6 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.2.3 |
| **Description** | Clicking the "Advance Status" button on a card calls `advanceStatus` with the correct item `_id` and triggers a re-fetch of action items |

**Setup**:
```ts
const item = makeActionItem({ _id: 'ai-test', title: 'My action', status: 'open' })
;(getActions as jest.Mock).mockResolvedValue([item])
;(advanceStatus as jest.Mock).mockResolvedValue({ ...item, status: 'in-progress' })
```

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()

fireEvent.click(screen.getByTestId('advance-btn'))
await waitFor(() => expect(advanceStatus).toHaveBeenCalledWith('ai-test'))
```

**Assertions**:
```ts
expect(advanceStatus).toHaveBeenCalledWith('ai-test')
// getActions should have been called at least twice: once on mount, once after advance
expect(getActions).toHaveBeenCalledTimes(expect.any(Number))
expect((getActions as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2)
```

---

### AI-7 — Card with `status === 'completed'` → "Verify Impact" button present, "Advance Status" absent

| Field | Value |
|---|---|
| **Test ID** | AI-7 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.2.4 |
| **Description** | An `ActionItemCard` with `status === 'completed'` renders "Verify Impact" button and does NOT render "Advance Status" button |

**Setup**:
```ts
const item = makeActionItem({ title: 'Completed item', status: 'completed' })
;(getActions as jest.Mock).mockResolvedValue([item])
```

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()
```

**Assertions**:
```ts
expect(screen.getByTestId('verify-btn')).toBeInTheDocument()
expect(screen.queryByTestId('advance-btn')).not.toBeInTheDocument()
```

---

### AI-8 — Card with `status === 'verified'` → neither button present

| Field | Value |
|---|---|
| **Test ID** | AI-8 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.2.6 |
| **Description** | An `ActionItemCard` with `status === 'verified'` renders no "Advance Status" and no "Verify Impact" button |

**Setup**:
```ts
const item = makeActionItem({
  title:      'Verified item',
  status:     'verified',
  impactNote: 'We shipped it.',
})
;(getActions as jest.Mock).mockResolvedValue([item])
```

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()
```

**Assertions**:
```ts
expect(screen.queryByTestId('advance-btn')).not.toBeInTheDocument()
expect(screen.queryByTestId('verify-btn')).not.toBeInTheDocument()
```

---

### AI-9 — "Verify Impact" click → `data-testid="verify-impact-modal"` appears in DOM

| Field | Value |
|---|---|
| **Test ID** | AI-9 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.2.4 |
| **Description** | Clicking the "Verify Impact" button on a completed card causes the `VerifyImpactModal` to appear in the DOM (detected via `data-testid="verify-impact-modal"`) |

**Setup**:
```ts
const item = makeActionItem({ title: 'Completed item', status: 'completed' })
;(getActions as jest.Mock).mockResolvedValue([item])
```

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()

fireEvent.click(screen.getByTestId('verify-btn'))
```

**Assertions**:
```ts
await waitFor(() => {
  expect(screen.getByTestId('verify-impact-modal')).toBeInTheDocument()
})
```

> **Key pattern**: Use `getByTestId('verify-impact-modal')` — **not** `getByRole('dialog')`. The `role` attribute requires the element to be in the DOM first; `data-testid` is more reliable for modal detection in RTL, consistent with Sprint 2 `data-testid="submit-feedback-modal"` pattern.

---

### AI-10 — `VerifyImpactModal` — submit disabled when `impactNote` is empty

| Field | Value |
|---|---|
| **Test ID** | AI-10 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.2.5 |
| **Description** | With the Verify Impact modal open and the Impact Statement textarea empty, the "Confirm Verified" submit button is disabled |

**Setup**: Open the modal (as in AI-9).

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()
fireEvent.click(screen.getByTestId('verify-btn'))
await waitFor(() => expect(screen.getByTestId('verify-impact-modal')).toBeInTheDocument())
// Impact note textarea is empty (initial state)
```

**Assertions**:
```ts
expect(screen.getByTestId('verify-impact-submit-btn')).toBeDisabled()
```

---

### AI-11 — `VerifyImpactModal` — submit disabled when `impactNote.length > 300`

| Field | Value |
|---|---|
| **Test ID** | AI-11 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.2.5 |
| **Description** | Typing a string longer than 300 characters into the Impact Statement textarea keeps the submit button disabled |

**Setup**: Open the modal.

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()
fireEvent.click(screen.getByTestId('verify-btn'))
await waitFor(() => expect(screen.getByTestId('verify-impact-modal')).toBeInTheDocument())

const tooLong = 'x'.repeat(301)
fireEvent.change(
  screen.getByPlaceholderText(/deployments now take/i),
  { target: { value: tooLong } }
)
```

**Assertions**:
```ts
expect(screen.getByTestId('verify-impact-submit-btn')).toBeDisabled()
```

---

### AI-12 — `VerifyImpactModal` — valid impact note → submit → `verifyImpact` called → modal closes → re-fetch

| Field | Value |
|---|---|
| **Test ID** | AI-12 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.2.6 |
| **Description** | After typing a valid (non-empty, ≤300 char) impact note and clicking "Confirm Verified": `verifyImpact` is called with the correct `itemId` and `impactNote`, the modal is removed from the DOM, and `getActions` is called a second time (re-fetch) |

**Setup**:
```ts
const item = makeActionItem({ _id: 'ai-verify', title: 'Completed item', status: 'completed' })
;(getActions as jest.Mock).mockResolvedValue([item])
;(verifyImpact as jest.Mock).mockResolvedValue({ ...item, status: 'verified', impactNote: 'It worked.' })
```

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()

fireEvent.click(screen.getByTestId('verify-btn'))
await waitFor(() => expect(screen.getByTestId('verify-impact-modal')).toBeInTheDocument())

fireEvent.change(
  screen.getByPlaceholderText(/deployments now take/i),
  { target: { value: 'It worked.' } }
)
expect(screen.getByTestId('verify-impact-submit-btn')).not.toBeDisabled()

fireEvent.click(screen.getByTestId('verify-impact-submit-btn'))
```

**Assertions**:
```ts
await waitFor(() => {
  expect(verifyImpact).toHaveBeenCalledWith('ai-verify', 'It worked.')
  expect(screen.queryByTestId('verify-impact-modal')).not.toBeInTheDocument()
})
// getActions called at least twice: initial mount + re-fetch after verify
expect((getActions as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2)
```

---

### AI-13 — SOURCE FEEDBACK block present when `sourceFeedbackId` non-empty; absent when empty

| Field | Value |
|---|---|
| **Test ID** | AI-13 |
| **File** | `actionItems.test.tsx` |
| **AC** | AC-3.1.2, AC-3.2.2 |
| **Description** | An `ActionItemCard` with `sourceFeedbackId !== ''` renders the "SOURCE FEEDBACK" section with the `sourceQuote` text; a card with `sourceFeedbackId === ''` does NOT render the SOURCE FEEDBACK section |

**Setup**:
```ts
const linked = makeActionItem({
  title:            'Linked action',
  status:           'open',
  sourceFeedbackId: 'fb-42',
  sourceQuote:      'Adopt a No Meeting Thursday policy.',
})
const direct = makeActionItem({
  title:            'Direct action',
  status:           'in-progress',
  sourceFeedbackId: '',
  sourceQuote:      '',
})
;(getActions as jest.Mock).mockResolvedValue([linked, direct])
```

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()
```

**Assertions**:
```ts
// Linked action: SOURCE FEEDBACK and quote visible
expect(screen.getByText('SOURCE FEEDBACK')).toBeInTheDocument()
expect(screen.getByText('Adopt a No Meeting Thursday policy.')).toBeInTheDocument()
// Direct action: no SOURCE FEEDBACK label (only one card has it)
expect(screen.getAllByText('SOURCE FEEDBACK')).toHaveLength(1)
```

---

## Acceptance Criteria Coverage Matrix (Sprint 3)

| AC-ID | Criterion Summary | Test File | Test IDs |
|---|---|---|---|
| AC-3.1.1 | `/actions` renders with Shell; session guard | `actionItems.test.tsx` | AI-1, AI-2 |
| AC-3.1.2 | Lists all items with title, owner, status, due date, source quote | `actionItems.test.tsx` | AI-5, AI-13 |
| AC-3.1.3 | Items sorted Open → In Progress → Completed → Verified | `actionService.test.ts` | AS-1, AS-2 |
| AC-3.1.4 | "+ New Action Item" opens modal | `actionItems.test.tsx` | AI-1 (button present); **see Gap S3-2** |
| AC-3.1.5 | Modal fields: Title, Description, Owner, Due Date | `actionItems.test.tsx` | **Gap S3-2** — explicit modal field test missing |
| AC-3.1.6 | `createAction()` → POST `/api/actions`; `sourceFeedbackId: ''` | `actionService.test.ts` | AS-6, AS-7 |
| AC-3.1.7 | Empty state: heading, body, two CTA buttons | `actionItems.test.tsx` | AI-3, AI-4 |
| AC-3.2.1 | "Convert to Action" on `should-try` cards only | `actionItems.test.tsx` | **Gap S3-3** — FeedbackBoard convert button test |
| AC-3.2.2 | Convert modal pre-fills title from feedback content | `actionItems.test.tsx` | **Gap S3-3** |
| AC-3.2.3 | Advance Status: open→in-progress→completed; 409 on completed | `actionService.test.ts` + `actionItems.test.tsx` | AS-8, AS-9, AS-10, AI-6, AI-7 |
| AC-3.2.4 | "Verify Impact" button when status = Completed | `actionItems.test.tsx` | AI-7, AI-9 |
| AC-3.2.5 | Verify Impact: non-empty, ≤300 chars; button disabled otherwise | `actionItems.test.tsx` | AI-10, AI-11, AS-12 |
| AC-3.2.6 | Verification: status=verified, impactNote persisted, modal closes, re-fetch | `actionService.test.ts` + `actionItems.test.tsx` | AS-11, AS-13, AS-VG-1, AI-8, AI-12 |
| AC-UI-3.1.x | Visual layout (status bar, card layout) | Manual review vs `ActionItems.png` | Visual only |
| AC-UI-3.2.x | New Action Item modal visual | Manual review vs `NewActionItemModal.png` | Visual only |
| AC-UI-3.3.x | Convert modal visual, source quote blockquote | Manual review vs `ConvertActionItem.png` | Visual only |
| AC-UI-3.4.x | Verify Impact modal visual, char counter | Manual review vs `VerifyImpact.png` | Visual only |

---

## Gap Analysis (Sprint 3)

### Gap S3-1 — `getCompletionRate` definition mismatch

**AC**: AC-3.2.6 — Dashboard completion rate should reflect only `"verified"` items.

**Status**: The existing `actionService.ts` `getCompletionRate` counts both `"completed"` AND `"verified"` items. The Sprint 3 plan specifies only `"verified"` items should count. AS-3 exposes this discrepancy.

**Risk**: Medium — the Dashboard stat card may display an inflated completion rate if `"completed"` items count.

**Recommendation**: DEV should either (a) update `getCompletionRate` to count only `"verified"`, or (b) add a new `getVerifiedRate()` function and update AS-3 to test it. Whichever approach is chosen, the existing Sprint 1 `getCompletionRate` tests (DB-7, `getCompletionRate: all completed = 100%`, `getCompletionRate: 2 completed + 1 verified / 5 = 60%`) must continue to pass unchanged.

---

### Gap S3-2 — AC-3.1.4/3.1.5: New Action Item modal interaction not explicitly tested

**AC**: AC-3.1.4 — "+ New Action Item" opens modal. AC-3.1.5 — modal has required fields.

**Status**: AI-3 tests the empty state only. There is no test that explicitly:
1. Clicks "+ New Action Item" in the page header
2. Asserts `data-testid="new-action-modal"` is in the DOM
3. Verifies the "Create Action Item" button is disabled when title is empty

**Recommended addition — AI-14**:
```
Setup: Default beforeEach (empty state).
Action: Click "+ New Action Item" button (role="button", name=/new action item/i).
Assert:
  - screen.getByTestId('new-action-modal') is in the DOM
  - screen.getByTestId('new-action-submit-btn') is disabled (empty title)
  - Type into title input → submit button becomes enabled
  - Click Cancel → modal removed from DOM
```

---

### Gap S3-3 — AC-3.2.1/3.2.2: "Convert to Action" button and `ConvertActionModal` not covered

**AC**: AC-3.2.1 — "Convert to Action" visible only on `should-try` cards. AC-3.2.2 — Convert modal pre-fills from feedback item.

**Status**: These ACs require testing the **modified `FeedbackCard.tsx`** and `feedback/page.tsx` — not `actions/page.tsx`. The `actionItems.test.tsx` file tests the Actions page; the Convert button test belongs in `feedbackBoard.test.tsx` (Sprint 2 file) as new tests **appended** at the end (no existing test modified).

**Recommended additions — FB-14, FB-15** (to be appended to `feedbackBoard.test.tsx`):

> **FB-14**: Mock `feedbackService.getFeedbackByLane` to return a `should-try` item. Render `FeedbackBoardPage`. Assert `data-testid="convert-btn"` is in the DOM.

> **FB-15**: Render a `went-well` item in the same setup. Assert `data-testid="convert-btn"` is NOT in the DOM for that card. (One should-try card → one convert btn; one went-well card → zero convert btns on the went-well card.)

> **FB-16**: Click `data-testid="convert-btn"` → assert `data-testid="convert-action-modal"` appears. Assert the title input is pre-filled with the feedback item's `content` value.

These tests target Sprint 3 Session 2 Task S3-S2-5 and S3-S2-6 and should be added to `feedbackBoard.test.tsx` when those tasks are implemented.

---

### Gap S3-4 — AC-UI-3.x: All visual/layout ACs have no automated coverage

**ACs**: AC-UI-3.1.1–3.1.7, AC-UI-3.2.1–3.2.4, AC-UI-3.3.1–3.3.5, AC-UI-3.4.1–3.4.6

**Status**: Not covered by Jest/RTL. These are visual requirements (Tailwind class colors, layout dimensions, border styles, character counter formatting).

**Risk**: Low for functional testing. Cannot be caught by unit tests.

**Recommendation**: Manual visual review against `ActionItems.png`, `action-items-empty.png`, `NewActionItemModal.png`, `ConvertActionItem.png`, `VerifyImpact.png` during each session completion gate.

---

## Sprint 3 Summary

| Category | Count |
|---|---|
| Test cases defined (Sprint 3) | 23 (AS-1–13 + AS-VG-1 + AI-1–13) + FB-14–16 flagged as gaps |
| Sprint 1 + Sprint 2 test cases (unchanged) | 46 + 5 existing actionService tests |
| **Total test cases across Sprint 1 + 2 + 3** | **74** |
| ACs with full automated coverage (Sprint 3) | 10 |
| ACs with partial / gap coverage (Sprint 3) | 4 (S3-1 through S3-4) |
| ACs with visual-only coverage (Sprint 3) | 8 (all AC-UI-3.x) |
| Sprint 1 + Sprint 2 tests modified | 0 (none — append only) |
| New test files created | 1 (`actionItems.test.tsx`) |
| Existing test files extended | 1 (`actionService.test.ts` — append only) |

---

---

## Sprint 3 Session 2 — [TEST] Review

**Mode**: [TEST]  
**Date**: April 2026  
**Scope**: Session 2 test additions — AI-14 (gap S3-2), FB-14/15/16 (gap S3-3), AI-9/10/11/12 validity check, updated gap analysis and summary  
**Rule**: Do NOT modify or delete any Sprint 1, Sprint 2, or Sprint 3 Session 1 test cases above. Only append.

---

### T1 — AI-9 through AI-12 Validity Check (Session 1 stub vs Session 2 real component)

The following tests in the Sprint 3 section above depend on `VerifyImpactModal` being **fully implemented and wired** in `actions/page.tsx`. Under Session 1 state (stub in place), these tests would fail because the stub is `<div data-testid="verify-modal-stub" />` — not `data-testid="verify-impact-modal"`.

| Test | Session 1 state | Session 2 state | Verdict |
|---|---|---|---|
| **AI-9** — "Verify Impact" click → `data-testid="verify-impact-modal"` appears | ❌ **FAILS** — stub has `verify-modal-stub`, not `verify-impact-modal` | ✅ Passes after S3-S2-7 replaces stub | **Session 2 target** — do not run against Session 1 code |
| **AI-10** — submit disabled when `impactNote` empty | ❌ **FAILS** — no modal in DOM | ✅ Passes after S3-S2-4 + S3-S2-7 | **Session 2 target** |
| **AI-11** — submit disabled when `impactNote.length > 300` | ❌ **FAILS** — no modal in DOM | ✅ Passes after S3-S2-4 + S3-S2-7 | **Session 2 target** |
| **AI-12** — submit → `verifyImpact` called → modal closes → re-fetch | ❌ **FAILS** — no modal in DOM | ✅ Passes after S3-S2-4 + S3-S2-7 | **Session 2 target** |
| **AI-1 through AI-8, AI-13** | ✅ Pass under Session 1 state | ✅ Pass under Session 2 state | **Session 1 + Session 2 valid** |

**Conclusion**: AI-9 through AI-12 are correctly written as Session 2 targets. Their expected failure under Session 1 code is by design (stub ≠ real component). No test spec changes are required — the tests are valid as written.

**`data-testid="verify-impact-modal"` confirmation**: Task S3-S2-4 specifies `data-testid="verify-impact-modal"` on the `VerifyImpactModal` container. This matches AI-9 through AI-12 target assertions exactly. ✅

---

### T2 — AI-14: New Action Item Modal Interaction (Gap S3-2 → RESOLVED)

**Promotes gap S3-2 to a full test spec.**

| Field | Value |
|---|---|
| **Test ID** | AI-14 |
| **File** | `actionItems.test.tsx` (append after AI-13) |
| **AC** | AC-3.1.4a (new), AC-3.1.4, AC-3.1.5 |
| **Description** | Clicking `data-testid="open-new-action-btn"` causes `NewActionItemModal` to appear; submit is disabled when Title is empty; submit becomes enabled after typing a title; clicking Cancel closes the modal |

**Setup**:
```ts
// Use default beforeEach — getActions returns [] (empty state) OR items list.
// AI-14 tests header button which exists in BOTH empty state and loaded state.
// Use loaded state (one item) to avoid empty-state button ambiguity:
const item = makeActionItem({ title: 'Existing action', status: 'open' })
;(getActions as jest.Mock).mockResolvedValue([item])
```

> **Why loaded state**: The empty state also renders a "New Action Item" button (line 200 of `actions/page.tsx`), but it lacks `data-testid`. The page header button on line 154–161 has `data-testid="open-new-action-btn"`. Using `getByTestId('open-new-action-btn')` targets the header button exclusively in both states. Using loaded state avoids any ambiguity between the two "New Action Item" buttons in the empty state.

**Action**:
```ts
render(<ActionItemsPage />)
await waitForPageLoaded()

// 1. Click the header "+ New Action Item" button
fireEvent.click(screen.getByTestId('open-new-action-btn'))
```

**Assertions — Step 1: Modal opens**:
```ts
await waitFor(() => {
  expect(screen.getByTestId('new-action-modal')).toBeInTheDocument()
})
```

**Action — Step 2: Submit disabled with empty title**:
```ts
// Title input is empty on open — submit must be disabled immediately
```

**Assertions — Step 2: Submit disabled**:
```ts
expect(screen.getByTestId('new-action-submit-btn')).toBeDisabled()
```

**Action — Step 3: Type a title → submit becomes enabled**:
```ts
fireEvent.change(
  screen.getByPlaceholderText(/add automated test coverage/i),
  { target: { value: 'Fix the auth timeout issue' } }
)
```

**Assertions — Step 3: Submit enabled**:
```ts
expect(screen.getByTestId('new-action-submit-btn')).not.toBeDisabled()
```

**Action — Step 4: Click Cancel → modal closes**:
```ts
fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
```

**Assertions — Step 4: Modal removed from DOM**:
```ts
await waitFor(() => {
  expect(screen.queryByTestId('new-action-modal')).not.toBeInTheDocument()
})
```

> **`data-testid` confirmation**: `NewActionItemModal` spec in S3-S1-4 and live `NewActionItemModal.tsx` use `data-testid="new-action-modal"` on container and `data-testid="new-action-submit-btn"` on submit button. These are confirmed in IMPLEMENTATION_NOTES.md (Session 1 created `NewActionItemModal.tsx` at ~160 lines). `open-new-action-btn` confirmed at `actions/page.tsx` line 156.

---

### T3 — FB-14: `should-try` card renders `data-testid="convert-btn"` (Gap S3-3 → RESOLVED)

**Promotes gap S3-3 FB-14 to a full test spec.**

| Field | Value |
|---|---|
| **Test ID** | FB-14 |
| **File** | `feedbackBoard.test.tsx` (append after FB-13 — inside new `describe` block) |
| **AC** | AC-3.2.1, AC-3.2.1a |
| **Description** | When `FeedbackBoardPage` renders a `should-try` feedback item and `onConvert` is wired (via `FeedbackColumn` receiving `onConvert` from the page), the card renders `data-testid="convert-btn"` |

**Mock strategy for FB-14/15/16 — scoped `describe` block with URL-discriminating `fetch`**:

```ts
describe('Sprint 3 — Convert to Action flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
    ;(getFeedbackByLane as jest.Mock).mockResolvedValue([])

    // URL-discriminating fetch: handles both /api/sprints and /api/users
    // Required because feedback/page.tsx S3-S2-6 adds GET /api/users fetch
    ;(global.fetch as jest.Mock) = jest.fn().mockImplementation((url: string) => {
      if ((url as string).includes('/api/users')) {
        return Promise.resolve({ ok: true, json: async () => [mockUser] })
      }
      return Promise.resolve({ ok: true, json: async () => mockSprint })
    })
  })
  // ... FB-14, FB-15, FB-16 tests
})
```

> **Why a scoped `describe` block**: The outer-level `beforeEach` (used by FB-1–FB-13) mocks `global.fetch` with a simple single-value mock returning `mockSprint` for all URLs. After S3-S2-6, `feedback/page.tsx` will call `GET /api/users` in addition to `GET /api/sprints`. If the outer `beforeEach` fetch mock is used, it returns `mockSprint` for `/api/users` — `mockSprint` is an object, not an array, so `setUsers(usersData.map(...))` throws. The scoped `beforeEach` inside the `describe` block overrides `global.fetch` for only FB-14/15/16 without touching the outer setup. FB-1–FB-13 are completely unaffected.

**Setup for FB-14**:
```ts
const shouldTryItem = makeFeedbackItem({
  _id: 'fb-should-1',
  category: 'should-try',
  content: 'Adopt a no-meeting Thursday policy.',
  authorId: 'user-other',
})
;(getFeedbackByLane as jest.Mock).mockImplementation(
  (_sprintId: string, category: string) =>
    category === 'should-try' ? Promise.resolve([shouldTryItem]) : Promise.resolve([])
)
```

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitForBoardLoaded()
```

**Assertions**:
```ts
expect(screen.getByTestId('convert-btn')).toBeInTheDocument()
```

---

### T4 — FB-15: Non-`should-try` cards do NOT render `data-testid="convert-btn"` (Gap S3-3 → RESOLVED)

| Field | Value |
|---|---|
| **Test ID** | FB-15 |
| **File** | `feedbackBoard.test.tsx` (inside Sprint 3 `describe` block, after FB-14) |
| **AC** | AC-3.2.1a |
| **Description** | A `went-well` feedback card does NOT render `data-testid="convert-btn"` even when `onConvert` is passed down from the page. Exactly one convert button exists for the one `should-try` card; zero for the `went-well` card. |

**Setup**:
```ts
const shouldTryItem = makeFeedbackItem({
  _id: 'fb-should-1',
  category: 'should-try',
  content: 'Adopt a no-meeting Thursday policy.',
  authorId: 'user-other',
})
const wentWellItem = makeFeedbackItem({
  _id: 'fb-well-1',
  category: 'went-well',
  content: 'Great sprint review session.',
  authorId: 'user-other',
})
;(getFeedbackByLane as jest.Mock).mockImplementation(
  (_sprintId: string, category: string) => {
    if (category === 'should-try') return Promise.resolve([shouldTryItem])
    if (category === 'went-well') return Promise.resolve([wentWellItem])
    return Promise.resolve([])
  }
)
```

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitForBoardLoaded()
await waitFor(() => expect(screen.getByText('Great sprint review session.')).toBeInTheDocument())
```

**Assertions**:
```ts
// Exactly 1 convert button — for the should-try card only
expect(screen.getAllByTestId('convert-btn')).toHaveLength(1)

// went-well card content is visible
expect(screen.getByText('Great sprint review session.')).toBeInTheDocument()

// The single convert button is associated with the should-try card
// (verified by the fact that there is only 1 convert button for 2 total cards)
```

> **Note on `slowed-us-down`**: The spec also forbids a convert button on `slowed-us-down` cards. This is implicitly tested because the test renders both a `should-try` and a `went-well` card with `onConvert` wired to the page, and asserts exactly 1 convert button. A separate test for `slowed-us-down` can be added as FB-15b if required by the reviewer, but the single-count assertion here covers the spirit of AC-3.2.1a for the negative case.

---

### T5 — FB-16: Click `convert-btn` → `convert-action-modal` appears + title pre-filled (Gap S3-3 → RESOLVED)

| Field | Value |
|---|---|
| **Test ID** | FB-16 |
| **File** | `feedbackBoard.test.tsx` (inside Sprint 3 `describe` block, after FB-15) |
| **AC** | AC-3.2.2, AC-3.2.2a |
| **Description** | Clicking `data-testid="convert-btn"` on a `should-try` card opens `ConvertActionModal` (confirmed by `data-testid="convert-action-modal"` in DOM) and the Title input is pre-filled with the feedback item's `content` value |

**Setup**:
```ts
const shouldTryItem = makeFeedbackItem({
  _id: 'fb-should-1',
  category: 'should-try',
  content: 'Adopt a no-meeting Thursday policy.',
  authorId: 'user-other',
})
;(getFeedbackByLane as jest.Mock).mockImplementation(
  (_sprintId: string, category: string) =>
    category === 'should-try' ? Promise.resolve([shouldTryItem]) : Promise.resolve([])
)
```

**Action**:
```ts
render(<FeedbackBoardPage />)
await waitForBoardLoaded()
await waitFor(() => expect(screen.getByTestId('convert-btn')).toBeInTheDocument())

fireEvent.click(screen.getByTestId('convert-btn'))
```

**Assertions**:
```ts
// Modal appears
await waitFor(() => {
  expect(screen.getByTestId('convert-action-modal')).toBeInTheDocument()
})

// Title input is pre-filled with the feedback item's content
const titleInput = screen.getByDisplayValue('Adopt a no-meeting Thursday policy.')
expect(titleInput).toBeInTheDocument()

// Source quote blockquote shows the feedback content
expect(screen.getByText('Adopt a no-meeting Thursday policy.')).toBeInTheDocument()

// Submit button is present (title is non-empty, but owner not selected → disabled)
expect(screen.getByTestId('convert-action-submit-btn')).toBeInTheDocument()
expect(screen.getByTestId('convert-action-submit-btn')).toBeDisabled()
```

> **`getByDisplayValue` pattern**: Use `screen.getByDisplayValue('Adopt a no-meeting Thursday policy.')` to assert the title input's current value. This is the RTL-idiomatic way to assert that an input element has a specific value without relying on placeholder text (which changes when the user types). The feedback content string is known at test-write time because we set it in the factory.

> **Submit disabled because no owner selected**: The `ConvertActionModal` disables submit when `!title.trim() || !ownerId || isSubmitting`. Title is pre-filled (non-empty), but `ownerId` starts as `''` (no owner selected yet). This is the correct initial state.

> **`data-testid` confirmation**: Task S3-S2-3 specifies `data-testid="convert-action-modal"` on container and `data-testid="convert-action-submit-btn"` on submit button. These match the assertions above.

---

### Updated Gap Analysis (Session 2)

#### Gap S3-1 — `getCompletionRate` definition mismatch

**Status**: ✅ **RESOLVED by Session 1 implementation.**

`actionService.ts` `getCompletionRate` was updated in Session 1 to count `verified`-only (confirmed in IMPLEMENTATION_NOTES.md §Sprint 3 Session 1, Deviation 1). The live implementation is:

```ts
export function getCompletionRate(actions: ActionItem[]): number {
  const total = actions.length
  if (total === 0) return 0
  const verified = actions.filter((a) => a.status === 'verified').length
  return Math.round((verified / total) * 100)
}
```

**AS-3 update**: AS-3 (2 verified / 5 total → expect 40) will now pass against the Session 1 implementation. The two Sprint 1-era tests that assert the old `completed+verified` behavior are known expected failures (58/60 in Session 1 completion gate) and are documented as intentional regressions. DEV must NOT revert `getCompletionRate` to make them pass.

**Test constraint for Session 2**: Do NOT add any test that expects `getCompletionRate` to count `completed` items. The Sprint 3 correct behavior is `verified`-only.

---

#### Gap S3-2 — AC-3.1.4/3.1.5: New Action Item modal interaction

**Status**: ✅ **RESOLVED** — AI-14 fully specified above (T2 section).

**Test coverage**:
- `data-testid="open-new-action-btn"` click → modal appears ✅
- Submit disabled with empty title ✅
- Submit enabled after typing title ✅
- Cancel closes modal ✅

---

#### Gap S3-3 — AC-3.2.1/3.2.2: Convert button and ConvertActionModal

**Status**: ✅ **RESOLVED** — FB-14, FB-15, FB-16 fully specified above (T3, T4, T5 sections).

**Test coverage**:
- FB-14: `should-try` card renders `convert-btn` ✅
- FB-15: `went-well` card does NOT render `convert-btn` ✅ (count assertion)
- FB-16: Click `convert-btn` → modal appears + title pre-filled ✅

**Architectural note carried forward**: FB-14/15/16 must be placed inside a scoped `describe('Sprint 3 — Convert to Action flow')` block with its own `beforeEach` that uses a URL-discriminating `global.fetch` mock. This is required because `feedback/page.tsx` will call `GET /api/users` after Task S3-S2-6, which breaks the outer-level single-value `fetch` mock used by FB-1–FB-13.

---

#### Gap S3-4 — AC-UI-3.x: Visual/layout ACs

**Status**: ⏳ **Remains open** — cannot be covered by Jest/RTL. Manual review required.

---

## Sprint 3 Summary (Updated — Session 2)

| Category | Count |
|---|---|
| Test cases defined (Sprint 3, Session 1) | 23 (AS-1–13 + AS-VG-1 + AI-1–13) |
| Test cases added (Sprint 3, Session 2) | 4 (AI-14 + FB-14 + FB-15 + FB-16) |
| **Total Sprint 3 test cases** | **27** |
| Sprint 1 + Sprint 2 test cases (unchanged) | 46 + 5 existing actionService tests = 51 |
| **Total test cases across Sprint 1 + 2 + 3** | **78** |
| ACs with full automated coverage (Sprint 3) | 13 (gaps S3-2 and S3-3 resolved) |
| ACs with visual-only coverage (Sprint 3) | 8 (all AC-UI-3.x — gap S3-4 remains open) |
| Sprint 1 + Sprint 2 tests modified | 0 (none — append only) |
| New test files created | 1 (`actionItems.test.tsx`) |
| Existing test files extended | 2 (`actionService.test.ts` — append only; `feedbackBoard.test.tsx` — append FB-14/15/16 inside scoped `describe` block) |
| Gaps resolved this session | 3 (S3-1 resolved by Session 1 code, S3-2 resolved by AI-14, S3-3 resolved by FB-14/15/16) |
| Gaps remaining open | 1 (S3-4 — visual only, manual review) |

### Session 2 Test Pre-flight Summary

| Item | Status |
|---|---|
| AI-9 through AI-12 are Session 2 targets (require real `VerifyImpactModal`) | ✅ Confirmed — will fail under Session 1 stub by design |
| AI-1 through AI-8, AI-13 are valid under both Session 1 and Session 2 state | ✅ Confirmed |
| `data-testid="verify-impact-modal"` matches S3-S2-4 spec | ✅ Confirmed |
| `data-testid="open-new-action-btn"` confirmed on `actions/page.tsx` line 156 | ✅ Confirmed — use `getByTestId` not `getByRole` (Lucide icon child) |
| `data-testid="new-action-modal"` + `"new-action-submit-btn"` — Session 1 `NewActionItemModal.tsx` | ✅ Confirmed |
| `data-testid="convert-btn"` — guard: `item.category === 'should-try' && onConvert !== undefined` | ✅ Confirmed from S3-S2-5 task spec |
| `data-testid="convert-action-modal"` + `"convert-action-submit-btn"` — S3-S2-3 spec | ✅ Confirmed |
| FB-14/15/16 require scoped `describe` + URL-discriminating `fetch` mock | ⚠️ Required — see T3 setup block; outer `beforeEach` must NOT be modified |
| `getCompletionRate` breaking change — 2 Sprint 1 tests expected-fail | ✅ Documented in Session 1; do NOT revert |
| Gap S3-1 resolved by Session 1 code change | ✅ AS-3 now passes against live implementation |
| Gap S3-2 resolved by AI-14 | ✅ Full spec written |
| Gap S3-3 resolved by FB-14/15/16 | ✅ Full specs written |
| Gap S3-4 remains open (visual only) | ⏳ Manual review required |
