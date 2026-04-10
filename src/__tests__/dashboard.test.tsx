import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

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

jest.mock('@/services/actionService', () => ({
  getActions: jest.fn(),
  getCompletionRate: jest.fn(),
  getOpenCount: jest.fn(),
  getCompletedCount: jest.fn(),
}))

jest.mock('@/components/layout/Shell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

import DashboardPage from '@/app/dashboard/page'
import { getCurrentUser } from '@/services/userService'
import { getActions, getCompletionRate, getOpenCount, getCompletedCount } from '@/services/actionService'

const mockUser = {
  _id: 'user-1', name: 'Jane Doe', username: 'jdoe', pod: 'pod1',
  isAdmin: false, createdAt: '2026-04-01T00:00:00.000Z',
}

const mockSprint = {
  _id: 'sprint-1', name: 'Sprint 42', goal: 'Ship it', status: 'open',
  startDate: '2026-04-01T00:00:00.000Z', endDate: '2026-04-14T00:00:00.000Z',
  teamMemberIds: ['user-1'],
}

const mockActions = [
  { _id: 'a1', title: 'Fix bug',     status: 'completed',   sprintId: 'sprint-1', ownerId: 'user-1', createdAt: '...' },
  { _id: 'a2', title: 'Write docs',  status: 'open',        sprintId: 'sprint-1', ownerId: 'user-1', createdAt: '...' },
  { _id: 'a3', title: 'Review PR',   status: 'verified',    sprintId: 'sprint-1', ownerId: 'user-1', createdAt: '...' },
  { _id: 'a4', title: 'Deploy',      status: 'in-progress', sprintId: 'sprint-1', ownerId: 'user-1', createdAt: '...' },
  { _id: 'a5', title: 'Retro',       status: 'completed',   sprintId: 'sprint-1', ownerId: 'user-1', createdAt: '...' },
]

beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  ;(getActions as jest.Mock).mockResolvedValue(mockActions)
  ;(getCompletionRate as jest.Mock).mockReturnValue(60)
  ;(getOpenCount as jest.Mock).mockReturnValue(2)
  ;(getCompletedCount as jest.Mock).mockReturnValue(3)
  ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockSprint,
  })
})

// DB-1 — renders without crash with valid user + active sprint
test('DB-1: renders without crash when user cached and API returns active sprint', async () => {
  const { container } = render(<DashboardPage />)
  await waitFor(() => {
    expect(container).toBeTruthy()
    expect(screen.getByTestId('shell')).toBeInTheDocument()
  })
  expect(mockPush).not.toHaveBeenCalledWith('/')
})

// DB-2 — redirects to / when no user in session
test('DB-2: redirects to / when sessionStorage has no user', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(null)

  render(<DashboardPage />)

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})

// DB-3 — renders 4 stat cards with correct labels
test('DB-3: renders 4 stat cards with correct labels when sprint is active', async () => {
  render(<DashboardPage />)

  await waitFor(() => {
    expect(screen.getByText('Feedback Count')).toBeInTheDocument()
    expect(screen.getByText('Total Upvotes')).toBeInTheDocument()
    expect(screen.getByText('Action Items')).toBeInTheDocument()
    expect(screen.getByText('Completion Rate')).toBeInTheDocument()
  })
})

// DB-4 — displays correct completion rate
test('DB-4: displays correct Completion Rate value from mock action data', async () => {
  render(<DashboardPage />)

  await waitFor(() => {
    expect(screen.getByText('60%')).toBeInTheDocument()
  })
})

// DB-5 — empty state when no active sprint
test('DB-5: renders empty state when no active sprint returned', async () => {
  ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  })

  render(<DashboardPage />)

  await waitFor(() => {
    expect(screen.getByText('No sprint data yet.')).toBeInTheDocument()
    expect(screen.getByText('Set up your first sprint to get started.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /set up sprint/i })).toBeInTheDocument()
  })
})

// DB-6 — empty state does NOT render stat card grid
test('DB-6: empty state does not render stat card grid', async () => {
  ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  })

  render(<DashboardPage />)

  await waitFor(() => {
    expect(screen.queryByText('Feedback Count')).not.toBeInTheDocument()
    expect(screen.queryByText('Completion Rate')).not.toBeInTheDocument()
  })
})
