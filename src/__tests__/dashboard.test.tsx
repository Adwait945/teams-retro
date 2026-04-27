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

jest.mock('@/components/layout/Shell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

import DashboardPage from '@/app/dashboard/page'
import { getCurrentUser } from '@/services/userService'

const mockUser = {
  _id: 'user-1', name: 'Jane Doe', username: 'jdoe', pod: 'Pod Alpha',
  isAdmin: false, createdAt: '2026-04-01T00:00:00.000Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  ;(global.fetch as jest.Mock) = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/api/feedback')) {
      return Promise.resolve({ ok: true, json: async () => [] })
    }
    if (url.includes('/api/actions')) {
      return Promise.resolve({ ok: true, json: async () => [] })
    }
    if (url.includes('/api/users')) {
      return Promise.resolve({ ok: true, json: async () => [mockUser] })
    }
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
})

test('DB-1: renders without crash when user cached and fetch returns empty arrays', async () => {
  const { container } = render(<DashboardPage />)
  await waitFor(() => {
    expect(container).toBeTruthy()
    expect(screen.getByTestId('shell')).toBeInTheDocument()
  })
  expect(mockPush).not.toHaveBeenCalledWith('/')
})

test('DB-2: redirects to / when sessionStorage has no user', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(null)
  render(<DashboardPage />)
  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})

test('DB-3: renders metric cells with 0 values when no data', async () => {
  render(<DashboardPage />)
  await waitFor(() => {
    expect(screen.getByTestId('metric-feedback-total')).toHaveTextContent('0')
    expect(screen.getByTestId('metric-actions-total')).toHaveTextContent('0')
    expect(screen.getByTestId('metric-completion-rate')).toHaveTextContent('0%')
    expect(screen.getByTestId('metric-verification-rate')).toHaveTextContent('—')
  })
})

test('DB-4: displays correct completion rate with action items', async () => {
  ;(global.fetch as jest.Mock) = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/api/actions')) {
      return Promise.resolve({
        ok: true,
        json: async () => [
          { _id: 'a1', title: 'Fix', status: 'completed', ownerId: 'user-1', dueDate: '', createdAt: '2026-04-10T00:00:00.000Z' },
          { _id: 'a2', title: 'Doc', status: 'open', ownerId: 'user-1', dueDate: '', createdAt: '2026-04-10T00:00:00.000Z' },
          { _id: 'a3', title: 'Rev', status: 'verified', ownerId: 'user-1', dueDate: '', createdAt: '2026-04-10T00:00:00.000Z' },
          { _id: 'a4', title: 'Dep', status: 'in-progress', ownerId: 'user-1', dueDate: '', createdAt: '2026-04-10T00:00:00.000Z' },
          { _id: 'a5', title: 'Ret', status: 'completed', ownerId: 'user-1', dueDate: '', createdAt: '2026-04-10T00:00:00.000Z' },
        ],
      })
    }
    if (url.includes('/api/feedback')) {
      return Promise.resolve({ ok: true, json: async () => [] })
    }
    if (url.includes('/api/users')) {
      return Promise.resolve({ ok: true, json: async () => [mockUser] })
    }
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })

  render(<DashboardPage />)
  await waitFor(() => {
    expect(screen.getByTestId('metric-completion-rate')).toHaveTextContent('60%')
  })
})

test('DB-5: empty window shows No activity yet in feed', async () => {
  render(<DashboardPage />)
  await waitFor(() => {
    expect(screen.getByTestId('activity-feed-empty')).toBeInTheDocument()
    expect(screen.getByTestId('activity-feed-empty')).toHaveTextContent('No activity yet')
  })
})

test('DB-6: tab buttons render with correct testids', async () => {
  render(<DashboardPage />)
  await waitFor(() => {
    expect(screen.getByTestId('tab-7d')).toBeInTheDocument()
    expect(screen.getByTestId('tab-30d')).toBeInTheDocument()
    expect(screen.getByTestId('tab-all')).toBeInTheDocument()
  })
})
