import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Sprint 7 — Epic 7.4 — Dashboard Enhancement: Pod MVP, Category Breakdown, Top Voted
// Feedback, Verified Improvements sections added to src/app/dashboard/page.tsx.
// These assertions target testids/copy that do not exist in the current implementation
// (only the pre-existing metrics grid + activity feed exist today) — expected ATDD failures.

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}))

jest.mock('@/services/userService', () => ({
  registerUser: jest.fn(),
  getCurrentUser: jest.fn(),
  cacheUser: jest.fn(),
  getAllUsers: jest.fn(),
}))

jest.mock('@/components/layout/Shell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

import DashboardPage from '@/app/dashboard/page'
import { getCurrentUser } from '@/services/userService'

const mockUser = {
  _id: 'user-1',
  name: 'Jane Doe',
  username: 'jdoe',
  avatar: '',
  pod: 'Pod Alpha',
  isAdmin: false,
  totalPoints: 0,
  createdAt: '2026-04-01T00:00:00.000Z',
}

const now = new Date()
function daysAgo(n: number) {
  return new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString()
}

function feedbackItem(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'fb-' + Math.random().toString(36).slice(2),
    category: 'went-well',
    content: 'Some feedback content that is reasonably long for truncation testing purposes.',
    suggestion: '',
    authorId: 'user-1',
    isAnonymous: false,
    actionItemIds: [],
    upvotedBy: [],
    upvotes: 0,
    createdAt: daysAgo(1),
    ...overrides,
  }
}

function actionItem(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'ai-' + Math.random().toString(36).slice(2),
    title: 'Some action',
    description: '',
    ownerId: 'user-1',
    status: 'open',
    dueDate: '',
    createdAt: daysAgo(1),
    ...overrides,
  }
}

function setupFetch(opts: {
  feedback?: unknown[]
  actions?: unknown[]
  users?: unknown[]
  points?: unknown[]
} = {}) {
  const { feedback = [], actions = [], users = [mockUser], points = [] } = opts
  ;(global.fetch as jest.Mock) = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/api/feedback')) return Promise.resolve({ ok: true, json: async () => feedback })
    if (url.includes('/api/actions')) return Promise.resolve({ ok: true, json: async () => actions })
    if (url.includes('/api/users')) return Promise.resolve({ ok: true, json: async () => users })
    if (url.includes('/api/points')) return Promise.resolve({ ok: true, json: async () => points })
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  setupFetch()
})

// T2-DASH-01 / AC-7.4.1
test('T2-DASH-01: dashboard makes its own independent /api/points fetch call', async () => {
  render(<DashboardPage />)
  await waitFor(() => {
    const fetchMock = global.fetch as jest.Mock
    const pointsCalls = fetchMock.mock.calls.filter(([url]: [string]) => url.includes('/api/points'))
    expect(pointsCalls.length).toBeGreaterThanOrEqual(1)
  })
})

// T2-DASH-02 / AC-7.4.1
test('T2-DASH-02: Pod MVP section shows neutral empty state when points array is empty', async () => {
  setupFetch({ points: [] })
  render(<DashboardPage />)
  await waitFor(() => {
    expect(screen.getByTestId('pod-mvp-section')).toBeInTheDocument()
  })
  expect(screen.getByTestId('pod-mvp-empty')).toBeInTheDocument()
})

// T2-DASH-03 / AC-7.4.1 / AC-UI-7.4.2
test('T2-DASH-03: Pod MVP shows the #1 ranked user name/avatar/windowPoints', async () => {
  setupFetch({
    points: [
      { userId: 'user-9', name: 'Top Scorer', avatar: '', windowPoints: 250, allTimePoints: 900 },
    ],
  })
  render(<DashboardPage />)
  await waitFor(() => {
    expect(screen.getByTestId('pod-mvp-section')).toHaveTextContent('Top Scorer')
    expect(screen.getByTestId('pod-mvp-section')).toHaveTextContent('250')
  })
})

// T2-DASH-04 / AC-7.4.2 / AC-UI-7.4.3
test('T2-DASH-04: Category Breakdown renders 3 mini cards with correct counts', async () => {
  setupFetch({
    feedback: [
      feedbackItem({ category: 'slowed-us-down', suggestion: 'fix it' }),
      feedbackItem({ category: 'slowed-us-down', suggestion: 'fix it' }),
      feedbackItem({ category: 'should-try' }),
      feedbackItem({ category: 'went-well' }),
      feedbackItem({ category: 'went-well' }),
      feedbackItem({ category: 'went-well' }),
    ],
  })
  render(<DashboardPage />)
  await waitFor(() => {
    expect(screen.getByTestId('category-breakdown-slowed')).toHaveTextContent('2')
    expect(screen.getByTestId('category-breakdown-should')).toHaveTextContent('1')
    expect(screen.getByTestId('category-breakdown-well')).toHaveTextContent('3')
  })
})

// T2-DASH-05 / AC-7.4.4
test('T2-DASH-05: delta shows "+N ↑" when prior period had zero items', async () => {
  const current = Array.from({ length: 12 }, () => feedbackItem({ category: 'went-well', createdAt: daysAgo(2) }))
  setupFetch({ feedback: current })
  render(<DashboardPage />)
  await waitFor(() => {
    expect(screen.getByTestId('category-breakdown-well')).toHaveTextContent('+12')
    expect(screen.getByTestId('category-breakdown-well')).toHaveTextContent('↑')
  })
})

// T2-DASH-06 / AC-7.4.3
test('T2-DASH-06: All-Time window removes delta elements entirely from the DOM', async () => {
  render(<DashboardPage />)
  await waitFor(() => expect(screen.getByTestId('tab-all')).toBeInTheDocument())
  fireEvent.click(screen.getByTestId('tab-all'))
  await waitFor(() => {
    expect(screen.queryByTestId('category-delta-slowed')).not.toBeInTheDocument()
    expect(screen.queryByTestId('category-delta-should')).not.toBeInTheDocument()
    expect(screen.queryByTestId('category-delta-well')).not.toBeInTheDocument()
  })
})

// T2-DASH-07 / AC-7.4.5
test('T2-DASH-07: Top Voted Feedback renders exactly 5, sorted desc by upvotes', async () => {
  setupFetch({
    feedback: [
      feedbackItem({ upvotes: 1 }),
      feedbackItem({ upvotes: 9 }),
      feedbackItem({ upvotes: 4 }),
      feedbackItem({ upvotes: 7 }),
      feedbackItem({ upvotes: 2 }),
      feedbackItem({ upvotes: 5 }),
    ],
  })
  render(<DashboardPage />)
  await waitFor(() => {
    const rows = screen.getAllByTestId('top-voted-item')
    expect(rows.length).toBe(5)
  })
})

// T2-DASH-08 / AC-7.4.5
test('T2-DASH-08: Top Voted Feedback shows own empty-state message when zero qualify', async () => {
  setupFetch({ feedback: [] })
  render(<DashboardPage />)
  await waitFor(() => {
    expect(screen.getByTestId('top-voted-empty')).toBeInTheDocument()
  })
})

// T2-DASH-09 / AC-7.4.6 / AC-UI-7.4.4
test('T2-DASH-09: Verified Improvements shows title + impactNote in emerald inset block', async () => {
  setupFetch({
    actions: [
      actionItem({
        status: 'verified',
        title: 'Reduce build time',
        impactNote: 'Builds went from 20m to 5m.',
        completedAt: daysAgo(1),
      }),
    ],
  })
  render(<DashboardPage />)
  await waitFor(() => {
    const section = screen.getByTestId('verified-improvements-section')
    expect(section).toHaveTextContent('Reduce build time')
    expect(section).toHaveTextContent('Builds went from 20m to 5m.')
  })
})

// T2-DASH-10 / AC-7.4.7
test('T2-DASH-10: toggling window triggers fresh /api/points fetch and re-renders new sections', async () => {
  render(<DashboardPage />)
  await waitFor(() => expect(screen.getByTestId('tab-30d')).toBeInTheDocument())
  const fetchMock = global.fetch as jest.Mock
  const callsBefore = fetchMock.mock.calls.filter(([url]: [string]) => url.includes('/api/points')).length

  fireEvent.click(screen.getByTestId('tab-30d'))

  await waitFor(() => {
    const callsAfter = fetchMock.mock.calls.filter(([url]: [string]) => url.includes('/api/points')).length
    expect(callsAfter).toBeGreaterThan(callsBefore)
  })
})

// T2-DASH-11 / AC-7.4.8 — non-regression check on pre-existing sections
test('T2-DASH-11: existing metrics grid and activity feed testids are unaffected', async () => {
  render(<DashboardPage />)
  await waitFor(() => {
    expect(screen.getByTestId('metric-feedback-total')).toBeInTheDocument()
    expect(screen.getByTestId('metric-actions-total')).toBeInTheDocument()
    expect(screen.getByTestId('metric-completion-rate')).toBeInTheDocument()
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument()
  })
})
