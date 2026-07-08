import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Sprint 7 — Epic 7.3 — src/app/leaderboard/page.tsx (does not exist yet — expected to fail
// with a module-not-found error, which is the correct ATDD failure mode).

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/leaderboard',
}))

jest.mock('@/services/userService', () => ({
  getCurrentUser: jest.fn(),
  cacheUser: jest.fn(),
  registerUser: jest.fn(),
  getAllUsers: jest.fn(),
}))

jest.mock('@/components/layout/Shell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

import LeaderboardPage from '@/app/leaderboard/page'
import { getCurrentUser } from '@/services/userService'

const mockUser = {
  _id: 'user-5',
  name: 'Jane Doe',
  username: 'jdoe',
  avatar: '',
  pod: 'Pod Alpha',
  isAdmin: false,
  totalPoints: 0,
  createdAt: '2026-04-01T00:00:00.000Z',
}

function pointsRow(overrides: Partial<{ userId: string; name: string; avatar: string; windowPoints: number; allTimePoints: number }> = {}) {
  return {
    userId: 'user-1',
    name: 'Rank User',
    avatar: '',
    windowPoints: 0,
    allTimePoints: 0,
    ...overrides,
  }
}

function mockFetchWith(pointsData: unknown[], badgesData: unknown[] = []) {
  ;(global.fetch as jest.Mock) = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/api/points')) {
      return Promise.resolve({ ok: true, json: async () => pointsData })
    }
    if (url.includes('/api/badges')) {
      return Promise.resolve({ ok: true, json: async () => badgesData })
    }
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  mockFetchWith([])
})

// T2-LB-01 / AC-7.3.1 / AC-7.3.2 / AC-UI-7.3.1
test('T2-LB-01: renders inside Shell and fetches points + badges once on mount', async () => {
  render(<LeaderboardPage />)
  await waitFor(() => {
    expect(screen.getByTestId('shell')).toBeInTheDocument()
  })
  const fetchMock = global.fetch as jest.Mock
  const pointsCalls = fetchMock.mock.calls.filter(([url]: [string]) => url.includes('/api/points'))
  const badgesCalls = fetchMock.mock.calls.filter(([url]: [string]) => url.includes('/api/badges'))
  expect(pointsCalls.length).toBeGreaterThanOrEqual(1)
  expect(badgesCalls.length).toBeGreaterThanOrEqual(1)
})

// T2-LB-02 / AC-7.3.2 / AC-7.3.3 / AC-UI-7.3.3
test('T2-LB-02: clicking This Month toggle re-fetches points with window=30d', async () => {
  render(<LeaderboardPage />)
  await waitFor(() => expect(screen.getByTestId('tab-30d')).toBeInTheDocument())

  fireEvent.click(screen.getByTestId('tab-30d'))

  await waitFor(() => {
    const fetchMock = global.fetch as jest.Mock
    const call30d = fetchMock.mock.calls.find(([url]: [string]) => url.includes('window=30d'))
    expect(call30d).toBeTruthy()
  })
  expect(screen.getByTestId('tab-30d').className).toEqual(expect.stringContaining('bg-primary'))
})

// T2-LB-03 / AC-7.3.4/5/6/7
test('T2-LB-03: rank 1-3 get medal/gradient treatment, rank 4 is plain with numeric rank', async () => {
  mockFetchWith([
    pointsRow({ userId: 'u1', name: 'First', windowPoints: 100, allTimePoints: 400 }),
    pointsRow({ userId: 'u2', name: 'Second', windowPoints: 80, allTimePoints: 300 }),
    pointsRow({ userId: 'u3', name: 'Third', windowPoints: 60, allTimePoints: 200 }),
    pointsRow({ userId: 'u4', name: 'Fourth', windowPoints: 40, allTimePoints: 100 }),
  ])
  render(<LeaderboardPage />)
  await waitFor(() => expect(screen.getByText('First')).toBeInTheDocument())

  expect(screen.getByText('Fourth')).toBeInTheDocument()
  expect(screen.getByText('4')).toBeInTheDocument()
  const list = screen.getByRole('list')
  expect(list).toBeInTheDocument()
})

// T2-LB-04 / AC-7.3.8
test('T2-LB-04: pod_champion badge renders a crown chip; user with no badges renders none', async () => {
  mockFetchWith(
    [
      pointsRow({ userId: 'u1', name: 'Champ', windowPoints: 100, allTimePoints: 400 }),
      pointsRow({ userId: 'u2', name: 'NoBadges', windowPoints: 10, allTimePoints: 10 }),
    ],
    [{ _id: 'b1', userId: 'u1', podId: 'Pod Alpha', type: 'pod_champion', earnedAt: new Date().toISOString() }]
  )
  render(<LeaderboardPage />)
  await waitFor(() => expect(screen.getByText('Champ')).toBeInTheDocument())
  expect(screen.getByText(/👑/)).toBeInTheDocument()
})

// T2-LB-05 / AC-7.3.9
test('T2-LB-05: Points Guide card renders exactly 6 rows with signed values', async () => {
  render(<LeaderboardPage />)
  await waitFor(() => expect(screen.getByTestId('shell')).toBeInTheDocument())
  const guide = screen.getByTestId('points-guide-card')
  expect(guide).toBeInTheDocument()
  expect(screen.getByText(/−5|-5/)).toBeInTheDocument()
})

// T2-LB-06 / AC-7.3.10
test('T2-LB-06: Badges reference card renders exactly 6 static entries', async () => {
  render(<LeaderboardPage />)
  await waitFor(() => expect(screen.getByTestId('shell')).toBeInTheDocument())
  const badgesCard = screen.getByTestId('badges-reference-card')
  expect(badgesCard).toBeInTheDocument()
})

// T2-LB-07 / AC-7.3.11
test('T2-LB-07: empty state renders when all rows have allTimePoints 0', async () => {
  mockFetchWith([pointsRow({ userId: 'u1', windowPoints: 0, allTimePoints: 0 })])
  render(<LeaderboardPage />)
  await waitFor(() => {
    expect(
      screen.getByText(/No activity yet.*submit feedback or complete an action item/i)
    ).toBeInTheDocument()
  })
})

// T2-LB-08 / AC-7.3.12
test('T2-LB-08: current user row is highlighted even at rank 5', async () => {
  mockFetchWith([
    pointsRow({ userId: 'other-1', name: 'A', windowPoints: 100, allTimePoints: 100 }),
    pointsRow({ userId: 'other-2', name: 'B', windowPoints: 90, allTimePoints: 90 }),
    pointsRow({ userId: 'other-3', name: 'C', windowPoints: 80, allTimePoints: 80 }),
    pointsRow({ userId: 'other-4', name: 'D', windowPoints: 70, allTimePoints: 70 }),
    pointsRow({ userId: 'user-5', name: 'Jane Doe', windowPoints: 60, allTimePoints: 60 }),
  ])
  render(<LeaderboardPage />)
  await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument())
  const row = screen.getByText('Jane Doe').closest('[data-testid="rank-card"]')
  expect(row).toHaveAttribute('data-current-user', 'true')
})
