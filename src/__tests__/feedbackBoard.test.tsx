import React from 'react'
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/feedback',
}))

jest.mock('@/services/userService', () => ({
  getCurrentUser: jest.fn(),
  cacheUser: jest.fn(),
  registerUser: jest.fn(),
  getAllUsers: jest.fn(),
}))

jest.mock('@/services/feedbackService', () => ({
  getFeedbackByLane: jest.fn(),
  getFeedback: jest.fn(),
  sortByUpvotes: jest.fn().mockImplementation((items: unknown[]) => [...items]),
  getAuthorDisplay: jest.fn().mockImplementation(
    (item: { isAnonymous: boolean }, name?: string) =>
      item.isAnonymous ? 'Anonymous' : (name ?? 'Unknown')
  ),
  addFeedback: jest.fn(),
  upvoteFeedback: jest.fn(),
}))

jest.mock('@/components/layout/Shell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

import FeedbackBoardPage from '@/app/feedback/page'
import { getCurrentUser } from '@/services/userService'
import { getFeedbackByLane, upvoteFeedback } from '@/services/feedbackService'
import type { FeedbackItem } from '@/types'

const mockUser = {
  _id: 'user-1',
  name: 'Jane Doe',
  username: 'jdoe',
  pod: 'pod1',
  isAdmin: false,
  createdAt: '2026-04-01T00:00:00.000Z',
}

const mockSprint = {
  _id: 'sprint-1',
  name: 'Sprint 42',
  status: 'open',
  goal: '',
  startDate: '2026-04-01T00:00:00.000Z',
  endDate: '2026-04-14T00:00:00.000Z',
  teamMemberIds: ['user-1'],
}

function makeFeedbackItem(overrides: Partial<FeedbackItem> = {}): FeedbackItem {
  return {
    _id: 'fb-' + Math.random().toString(36).slice(2),
    category: 'went-well',
    content: 'Test content',
    suggestion: '',
    authorId: 'user-1',
    isAnonymous: false,
    sprintId: 'sprint-1',
    upvotedBy: [],
    upvotes: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// Wait for the board to finish loading (open-modal-btn only appears in loaded state)
async function waitForBoardLoaded() {
  await waitFor(() => expect(screen.getByTestId('open-modal-btn')).toBeInTheDocument())
}

beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  ;(getFeedbackByLane as jest.Mock).mockResolvedValue([])
  ;(global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockSprint,
  })
})

// ── FB-1: Valid user → renders without redirect ──────────────────────────────
test('FB-1: renders feedback board with valid session user without redirecting', async () => {
  render(<FeedbackBoardPage />)
  await waitForBoardLoaded()
  expect(mockPush).not.toHaveBeenCalledWith('/')
})

// ── FB-2: No user → redirect to / ────────────────────────────────────────────
test('FB-2: redirects to / when no session user', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(null)
  render(<FeedbackBoardPage />)
  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})

// ── FB-3: Three column headers ────────────────────────────────────────────────
test('FB-3: three column headers render with correct text', async () => {
  render(<FeedbackBoardPage />)
  await waitForBoardLoaded()

  // <h2> contains a <span> dot + text node; query all h2s by role and check textContent
  const headings = screen.getAllByRole('heading', { level: 2 })
  const texts = headings.map((h) => h.textContent ?? '')
  expect(texts.some((t) => t.includes('What Slowed Us Down?'))).toBe(true)
  expect(texts.some((t) => t.includes('What Should We Try?'))).toBe(true)
  expect(texts.some((t) => t.includes('What Went Well?'))).toBe(true)
})

// ── FB-4: Empty API → per-lane empty states ───────────────────────────────────
test('FB-4: empty API response renders per-lane empty state messages', async () => {
  render(<FeedbackBoardPage />)
  await waitForBoardLoaded()
  expect(screen.getByText('No blockers reported yet. Be the first to share.')).toBeInTheDocument()
  expect(screen.getByText('No suggestions yet. What would help the team?')).toBeInTheDocument()
  expect(screen.getByText('Nothing logged yet. Share a win!')).toBeInTheDocument()
})

// ── FB-5: "Submit Feedback" button opens modal ────────────────────────────────
test('FB-5: clicking Submit Feedback button opens the modal', async () => {
  render(<FeedbackBoardPage />)
  await waitForBoardLoaded()

  fireEvent.click(screen.getByTestId('open-modal-btn'))

  await waitFor(() => {
    expect(screen.getByTestId('submit-feedback-modal')).toBeInTheDocument()
  })
})

// ── FB-6: Modal Cancel closes the modal ──────────────────────────────────────
test('FB-6: clicking Cancel closes the modal', async () => {
  render(<FeedbackBoardPage />)
  await waitForBoardLoaded()

  fireEvent.click(screen.getByTestId('open-modal-btn'))
  await waitFor(() => expect(screen.getByTestId('submit-feedback-modal')).toBeInTheDocument())

  fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

  await waitFor(() => {
    expect(screen.queryByTestId('submit-feedback-modal')).not.toBeInTheDocument()
  })
})

// ── FB-7: slowed-us-down → suggestion textarea + badge appear ─────────────────
test('FB-7: selecting slowed-us-down shows suggestion textarea and Reframe Rule badge', async () => {
  render(<FeedbackBoardPage />)
  await waitForBoardLoaded()

  fireEvent.click(screen.getByTestId('open-modal-btn'))
  await waitFor(() => expect(screen.getByTestId('submit-feedback-modal')).toBeInTheDocument())

  const modal = screen.getByTestId('submit-feedback-modal')
  fireEvent.click(within(modal).getByDisplayValue('slowed-us-down'))

  expect(screen.getByPlaceholderText('How could we fix or improve this?')).toBeInTheDocument()
  expect(screen.getByText('REFRAME RULE: REQUIRED')).toBeInTheDocument()
})

// ── FB-8: went-well → suggestion textarea NOT in DOM ─────────────────────────
test('FB-8: selecting went-well hides suggestion textarea and Reframe Rule badge', async () => {
  render(<FeedbackBoardPage />)
  await waitForBoardLoaded()

  fireEvent.click(screen.getByTestId('open-modal-btn'))
  await waitFor(() => expect(screen.getByTestId('submit-feedback-modal')).toBeInTheDocument())

  const modal = screen.getByTestId('submit-feedback-modal')
  fireEvent.click(within(modal).getByDisplayValue('went-well'))

  expect(screen.queryByPlaceholderText('How could we fix or improve this?')).not.toBeInTheDocument()
  expect(screen.queryByText('REFRAME RULE: REQUIRED')).not.toBeInTheDocument()
})

// ── FB-9: slowed-us-down + empty suggestion → submit disabled ─────────────────
test('FB-9: slowed-us-down with empty suggestion disables the submit button', async () => {
  render(<FeedbackBoardPage />)
  await waitForBoardLoaded()

  fireEvent.click(screen.getByTestId('open-modal-btn'))
  await waitFor(() => expect(screen.getByTestId('submit-feedback-modal')).toBeInTheDocument())

  const modal = screen.getByTestId('submit-feedback-modal')
  fireEvent.click(within(modal).getByDisplayValue('slowed-us-down'))
  fireEvent.change(screen.getByPlaceholderText('What happened?'), {
    target: { value: 'Auth crashed.' },
  })
  // suggestion stays empty — submit must be disabled

  expect(screen.getByTestId('modal-submit-btn')).toBeDisabled()
})

// ── FB-10: slowed-us-down + non-empty suggestion → submit enabled ─────────────
test('FB-10: slowed-us-down with non-empty suggestion enables the submit button', async () => {
  render(<FeedbackBoardPage />)
  await waitForBoardLoaded()

  fireEvent.click(screen.getByTestId('open-modal-btn'))
  await waitFor(() => expect(screen.getByTestId('submit-feedback-modal')).toBeInTheDocument())

  const modal = screen.getByTestId('submit-feedback-modal')
  fireEvent.click(within(modal).getByDisplayValue('slowed-us-down'))
  fireEvent.change(screen.getByPlaceholderText('What happened?'), {
    target: { value: 'Auth crashed.' },
  })
  fireEvent.change(screen.getByPlaceholderText('How could we fix or improve this?'), {
    target: { value: 'Roll back to v1.8.' },
  })

  expect(screen.getByTestId('modal-submit-btn')).not.toBeDisabled()
})

// ── FB-11: Upvote own feedback → 403 handled silently, count unchanged ────────
test('FB-11: upvoting own feedback is handled gracefully — count unchanged', async () => {
  const ownFeedback = makeFeedbackItem({ authorId: 'user-1', upvotes: 2, category: 'went-well' })

  ;(getFeedbackByLane as jest.Mock).mockImplementation(
    (_sprintId: string, category: string) =>
      category === 'went-well' ? Promise.resolve([ownFeedback]) : Promise.resolve([])
  )
  ;(upvoteFeedback as jest.Mock).mockRejectedValue(new Error('Cannot upvote own feedback'))

  render(<FeedbackBoardPage />)
  await waitFor(() => expect(screen.getByText('Test content')).toBeInTheDocument())

  const upvoteBtn = screen.getByTestId('upvote-btn')
  fireEvent.click(upvoteBtn)
  await waitFor(() => {}, { timeout: 150 })

  // Count unchanged — still 2
  expect(screen.getByTestId('upvote-btn').textContent).toContain('2')
})

// ── FB-12: Double upvote → 409 silent, count stays at 4 ──────────────────────
test('FB-12: second upvote returns 409 silently — count does not increment beyond 4', async () => {
  const otherFeedback = makeFeedbackItem({
    _id: 'fb-other',
    authorId: 'user-other',
    upvotes: 3,
    category: 'went-well',
  })
  const updatedFeedback = { ...otherFeedback, upvotes: 4 }

  // Use call-count-based mock so any extra draining calls (from act) return
  // the correct stable state rather than [] from the beforeEach default.
  let laneCallCount = 0
  ;(getFeedbackByLane as jest.Mock).mockImplementation((_sid: string, cat: string) => {
    laneCallCount++
    // First 3 calls = initial load
    if (laneCallCount <= 3) {
      return Promise.resolve(cat === 'went-well' ? [otherFeedback] : [])
    }
    // Subsequent calls = re-fetch after upvote (returns updated state)
    return Promise.resolve(cat === 'went-well' ? [updatedFeedback] : [])
  })

  ;(upvoteFeedback as jest.Mock)
    .mockResolvedValueOnce({ upvotes: 4 })
    .mockRejectedValueOnce(new Error('Already upvoted'))

  render(<FeedbackBoardPage />)
  await waitFor(() => expect(screen.getByTestId('upvote-btn')).toBeInTheDocument())
  expect(screen.getByTestId('upvote-btn').textContent).toContain('3')

  // First upvote: succeeds, refetch brings count to 4
  fireEvent.click(screen.getByTestId('upvote-btn'))
  await waitFor(() => expect(screen.getByTestId('upvote-btn').textContent).toContain('4'))

  // Second upvote: 409 — caught silently, no refetch, count stays 4
  fireEvent.click(screen.getByTestId('upvote-btn'))
  await waitFor(() => expect(upvoteFeedback).toHaveBeenCalledTimes(2))
  expect(screen.getByTestId('upvote-btn').textContent).toContain('4')
  expect(screen.getByTestId('upvote-btn').textContent).not.toContain('5')
})

// ── FB-13: Successful upvote → count re-fetched from API, not incremented locally
test('FB-13: successful upvote re-fetches board and shows API count', async () => {
  const feedbackItem = makeFeedbackItem({
    _id: 'fb-42',
    authorId: 'user-other',
    upvotes: 7,
    category: 'went-well',
  })
  const updatedItem = { ...feedbackItem, upvotes: 8 }

  let laneCallCount = 0
  ;(getFeedbackByLane as jest.Mock).mockImplementation((_sid: string, cat: string) => {
    laneCallCount++
    if (laneCallCount <= 3) {
      return Promise.resolve(cat === 'went-well' ? [feedbackItem] : [])
    }
    return Promise.resolve(cat === 'went-well' ? [updatedItem] : [])
  })

  ;(upvoteFeedback as jest.Mock).mockResolvedValueOnce({ upvotes: 8 })

  render(<FeedbackBoardPage />)
  await waitFor(() =>
    expect(screen.getByTestId('upvote-btn').textContent).toContain('7')
  )

  fireEvent.click(screen.getByTestId('upvote-btn'))

  await waitFor(() => {
    expect(screen.getByTestId('upvote-btn').textContent).toContain('8')
    expect(screen.getByTestId('upvote-btn').textContent).not.toContain('7')
  })

  // At minimum 6 calls: 3 initial + 3 re-fetch after upvote
  expect(getFeedbackByLane).toHaveBeenCalledTimes(laneCallCount)
  expect(laneCallCount).toBeGreaterThanOrEqual(6)
})
