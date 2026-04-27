import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}))

jest.mock('@/services/userService', () => ({
  getCurrentUser: jest.fn(),
  getAllUsers: jest.fn(),
  cacheUser: jest.fn(),
  registerUser: jest.fn(),
}))

jest.mock('@/services/feedbackService', () => ({
  getFeedbackByLane: jest.fn().mockResolvedValue([]),
  sortByUpvotes: jest.fn((items: unknown[]) => [...items]),
  addFeedback: jest.fn(),
  upvoteFeedback: jest.fn(),
  getAuthorDisplay: jest.fn(() => 'Jane'),
}))

jest.mock('@/services/actionService', () => ({
  createAction: jest.fn(),
  getActions: jest.fn(),
  getCompletionRate: jest.fn(() => 0),
  getOpenCount: jest.fn(() => 0),
  getCompletedCount: jest.fn(() => 0),
  getActionsByStatus: jest.fn((items: unknown[]) => items),
  advanceStatus: jest.fn(),
  verifyImpact: jest.fn(),
}))

jest.mock('@/components/layout/Shell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

import DashboardPage from '@/app/dashboard/page'
import FeedbackPage from '@/app/feedback/page'
import ActionsPage from '@/app/action-items/page'
import SubmitFeedbackModal from '@/components/SubmitFeedbackModal'
import NewActionItemModal from '@/components/NewActionItemModal'
import ConvertToActionModal from '@/components/ConvertToActionModal'
import VerifyImpactModal from '@/components/VerifyImpactModal'
import type { ActionItem } from '@/types'
import { getCurrentUser } from '@/services/userService'
import { getActions } from '@/services/actionService'

const mockUser = {
  _id: 'u1',
  name: 'Jane Doe',
  username: 'janedoe',
  pod: 'Pod 1',
  isAdmin: true,
  avatar: '',
  totalPoints: 0,
  badges: [],
  createdAt: '',
}

const mockSprint = {
  _id: 'sp-1',
  name: 'Sprint 42',
  goal: 'Ship it.',
  startDate: '2023-10-24',
  endDate: '2023-11-06',
  status: 'open' as const,
  teamMemberIds: [],
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPush.mockReset()
  ;(global.fetch as jest.Mock) = jest.fn()
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
})

// ─── EH-1: Dashboard — no session user → router.push('/') ────────────────────

it('EH-1: dashboard — no session user redirects to /', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(null)
  render(<DashboardPage />)
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
  expect(mockPush).toHaveBeenCalledWith('/')
  expect(screen.queryByTestId('dashboard-empty-state')).not.toBeInTheDocument()
  expect(screen.queryByTestId('load-error')).not.toBeInTheDocument()
})

// ─── EH-2: Dashboard — fetch throws → load-error visible ─────────────────────

it('EH-2: dashboard — fetch throws → load-error visible; no crash', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  ;(getActions as jest.Mock).mockResolvedValue([])
  ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'))

  render(<DashboardPage />)
  await waitFor(() => expect(screen.getByTestId('load-error')).toBeInTheDocument())

  expect(screen.getByTestId('load-error')).toHaveTextContent(
    'Something went wrong. Please try again.'
  )
  expect(screen.getByTestId('shell')).toBeInTheDocument()
  expect(screen.queryByTestId('dashboard-empty-state')).not.toBeInTheDocument()
  expect(screen.queryByText('No sprint data yet.')).not.toBeInTheDocument()
})

// ─── EH-3: Actions — fetch throws → "Failed to load data." visible ───────────

it('EH-3: actions — fetch throws → "Failed to load data." visible; no crash', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/sprints')) {
      return Promise.resolve({ ok: false, status: 500, json: async () => ({ error: 'fail' }) })
    }
    return Promise.reject(new Error('Network Error'))
  })

  render(<ActionsPage />)
  await waitFor(() =>
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  )

  expect(screen.getByText('Failed to load data.')).toBeInTheDocument()
  expect(screen.getByTestId('shell')).toBeInTheDocument()
  expect(screen.queryByTestId('actions-empty-state')).not.toBeInTheDocument()
})

// ─── EH-4: Feedback — sprint null → feedback-empty-state visible ─────────────

it('EH-4: feedback — no active sprint → feedback-empty-state visible', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/sprints')) {
      return Promise.resolve({ ok: true, json: async () => [] })
    }
    if (url.includes('/api/users')) {
      return Promise.resolve({ ok: true, json: async () => [mockUser] })
    }
    return Promise.resolve({ ok: true, json: async () => [] })
  })

  render(<FeedbackPage />)
  await waitFor(() =>
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  )

  expect(screen.getByTestId('feedback-empty-state')).toBeInTheDocument()
  expect(screen.getByTestId('feedback-empty-state')).toHaveTextContent(
    'No active sprint. Set one up to begin.'
  )
  expect(screen.getByTestId('open-modal-btn')).toBeDisabled()
})

// ─── EH-5: Actions — empty actions → actions-empty-state visible ─────────────

it('EH-5: actions — empty getActions → actions-empty-state visible', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  ;(getActions as jest.Mock).mockResolvedValue([])
  ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/sprints')) {
      return Promise.resolve({ ok: true, json: async () => mockSprint })
    }
    if (url.includes('/api/users')) {
      return Promise.resolve({ ok: true, json: async () => [mockUser] })
    }
    return Promise.resolve({ ok: true, json: async () => [] })
  })

  render(<ActionsPage />)
  await waitFor(() => expect(screen.getByTestId('actions-empty-state')).toBeInTheDocument())

  expect(screen.getByTestId('actions-empty-state')).toBeInTheDocument()
  expect(screen.getByText('No action items yet.')).toBeInTheDocument()
  expect(screen.getByTestId('actions-goto-feedback-btn')).toBeInTheDocument()
  expect(screen.getByTestId('actions-empty-new-btn')).toBeInTheDocument()
})

// ─── EH-6: SubmitFeedbackModal — submit disabled when content empty ───────────

it('EH-6: SubmitFeedbackModal — submit disabled when content empty; enabled after typing', () => {
  const mockOnClose = jest.fn()
  const mockOnSubmit = jest.fn()

  render(
    <SubmitFeedbackModal
      open={true}
      onClose={mockOnClose}
      onSubmit={mockOnSubmit}
    />
  )

  expect(screen.getByTestId('modal-submit-btn')).toBeDisabled()

  fireEvent.change(screen.getByTestId('sfm-content'), {
    target: { value: 'This is some feedback' },
  })
  expect(screen.getByTestId('modal-submit-btn')).not.toBeDisabled()

  fireEvent.change(screen.getByTestId('sfm-content'), {
    target: { value: '' },
  })
  expect(screen.getByTestId('modal-submit-btn')).toBeDisabled()
})

// ─── EH-7: SubmitFeedbackModal — role="dialog" present ───────────────────────

it('EH-7: SubmitFeedbackModal — role="dialog" and aria-labelledby present', () => {
  render(
    <SubmitFeedbackModal
      open={true}
      onClose={jest.fn()}
      onSubmit={jest.fn()}
    />
  )
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'sfm-title')
  expect(screen.getByTestId('submit-feedback-modal')).toBeInTheDocument()
})

// ─── EH-8: NewActionItemModal — role="dialog" present ────────────────────────

it('EH-8: NewActionItemModal — role="dialog" and Sprint 5 testids present', () => {
  render(
    <NewActionItemModal
      open={true}
      users={[{ _id: 'u1', name: 'Jane Doe' }]}
      onClose={jest.fn()}
      onSubmit={jest.fn()}
    />
  )
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'nam-title')
  expect(screen.getByTestId('new-action-modal')).toBeInTheDocument()
  expect(screen.getByTestId('nam-close-btn')).toBeInTheDocument()
  expect(screen.getByTestId('nam-title-input')).toBeInTheDocument()
  expect(screen.getByTestId('nam-owner')).toBeInTheDocument()
})

// ─── EH-9: ConvertActionModal — role="dialog" present ────────────────────────

it('EH-9: ConvertToActionModal — role="dialog" and Sprint 6 testids present', () => {
  const mockFeedback = {
    _id: 'fi-1',
    content: 'We should improve CI pipeline.',
    category: 'should-try' as const,
    authorId: 'u1',
    isAnonymous: false,
    suggestion: '',
    upvotes: 0,
    upvotedBy: [],
    actionItemIds: [],
    createdAt: '',
  }

  render(
    <ConvertToActionModal
      open={true}
      feedbackItem={mockFeedback}
      users={[{ _id: 'u1', name: 'Jane Doe' }]}
      onClose={jest.fn()}
      onSubmit={jest.fn()}
    />
  )
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'cta-title')
  expect(screen.getByTestId('convert-to-action-modal')).toBeInTheDocument()
  expect(screen.getByTestId('convert-title-input')).toBeInTheDocument()
  expect(screen.getByTestId('convert-owner-select')).toBeInTheDocument()
})

// ─── EH-10: VerifyImpactModal — role="dialog" present ────────────────────────

it('EH-10: VerifyImpactModal — role="dialog" and Sprint 5 testids present', () => {
  const mockAction: ActionItem = {
    _id: 'ai-1',
    title: 'Improve CI pipeline',
    description: '',
    ownerId: 'u1',
    dueDate: '',
    status: 'completed',
    sourceFeedbackId: '',
    sourceQuote: '',
    impactNote: '',
    createdAt: '',
  }

  render(
    <VerifyImpactModal
      open={true}
      item={mockAction}
      onClose={jest.fn()}
      onSubmit={jest.fn()}
    />
  )
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'vim-title')
  expect(screen.getByTestId('verify-impact-modal')).toBeInTheDocument()
  expect(screen.getByTestId('vim-close-btn')).toBeInTheDocument()
  expect(screen.getByTestId('vim-impact')).toBeInTheDocument()
  expect(screen.getByTestId('verify-impact-submit-btn')).toBeInTheDocument()
})
