import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/action-items',
}))

jest.mock('@/services/userService', () => ({
  getCurrentUser: jest.fn(),
  cacheUser: jest.fn(),
  registerUser: jest.fn(),
  getAllUsers: jest.fn(),
}))

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

jest.mock('@/components/layout/Shell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

import ActionItemsPage from '@/app/action-items/page'
import { getCurrentUser } from '@/services/userService'
import {
  getActions,
  advanceStatus,
  verifyImpact,
} from '@/services/actionService'
import type { ActionItem } from '@/types'

const mockUser = {
  _id:       'user-1',
  name:      'Jane Doe',
  username:  'jdoe',
  pod:       'pod1',
  isAdmin:   true,
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

function makeActionItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    _id:              'ai-' + Math.random().toString(36).slice(2),
    title:            'Test action item',
    description:      '',
    ownerId:          'user-1',
    sourceFeedbackId: '',
    sourceQuote:      '',
    status:           'open',
    dueDate:          '',
    createdAt:        new Date().toISOString(),
    ...overrides,
  }
}

async function waitForPageLoaded() {
  await waitFor(() =>
    expect(screen.getByTestId('open-new-action-btn')).toBeInTheDocument()
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()

  ;(getCurrentUser as jest.Mock).mockReturnValue(mockUser)
  ;(getActions as jest.Mock).mockResolvedValue([])

  ;(global.fetch as jest.Mock) = jest.fn().mockImplementation((url: string) => {
    if ((url as string).includes('/api/users')) {
      return Promise.resolve({ ok: true, json: async () => [mockUser] })
    }
    if ((url as string).includes('/api/sprints') || (url as string).includes('/api/actions')) {
      return Promise.resolve({ ok: true, json: async () => mockSprint })
    }
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
})

// ── AI-1: Valid session → Shell renders, no redirect ─────────────────────────
test('AI-1: page mounts with valid session user — renders Shell, no redirect', async () => {
  render(<ActionItemsPage />)
  await waitForPageLoaded()
  expect(screen.getByTestId('shell')).toBeInTheDocument()
  expect(mockPush).not.toHaveBeenCalledWith('/')
})

// ── AI-2: No session → redirects to / ────────────────────────────────────────
test('AI-2: no session user → router.push("/") called', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(null)
  render(<ActionItemsPage />)
  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})

// ── AI-3: Empty getActions → empty state text renders ─────────────────────────
test('AI-3: empty getActions return → empty state heading and body present', async () => {
  render(<ActionItemsPage />)
  await waitForPageLoaded()
  expect(screen.getByText('No action items yet.')).toBeInTheDocument()
  expect(screen.getByText('Convert feedback from the Feedback Board, or add one directly.')).toBeInTheDocument()
})

// ── AI-4: "Go to Feedback Board" → router.push('/feedback') ──────────────────
test('AI-4: "Go to Feedback Board" button in empty state → router.push("/feedback")', async () => {
  render(<ActionItemsPage />)
  await waitForPageLoaded()

  fireEvent.click(screen.getByRole('button', { name: /go to feedback board/i }))
  expect(mockPush).toHaveBeenCalledWith('/feedback')
})

// ── AI-5: getActions returns items → cards render with title text ─────────────
test('AI-5: getActions returns items → card titles rendered', async () => {
  const item1 = makeActionItem({ title: 'Implement test coverage', status: 'open' })
  const item2 = makeActionItem({ title: 'Rollback auth service', status: 'in-progress' })
  ;(getActions as jest.Mock).mockResolvedValue([item1, item2])

  render(<ActionItemsPage />)
  await waitForPageLoaded()

  expect(screen.getByText('Implement test coverage')).toBeInTheDocument()
  expect(screen.getByText('Rollback auth service')).toBeInTheDocument()
})

// ── AI-6: "Advance Status" click → advanceStatus called + getActions re-fetched
test('AI-6: "Advance Status" button click → advanceStatus called with correct itemId + re-fetch', async () => {
  const item = makeActionItem({ _id: 'ai-test', title: 'My action', status: 'open' })
  ;(getActions as jest.Mock).mockResolvedValue([item])
  ;(advanceStatus as jest.Mock).mockResolvedValue({ ...item, status: 'in-progress' })

  render(<ActionItemsPage />)
  await waitForPageLoaded()

  fireEvent.click(screen.getByTestId('advance-btn'))
  await waitFor(() => expect(advanceStatus).toHaveBeenCalledWith('ai-test'))

  expect(advanceStatus).toHaveBeenCalledWith('ai-test')
  expect((getActions as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2)
})

// ── AI-7: completed card → "Verify Impact" present, "Advance Status" absent ──
test('AI-7: card with status=completed → verify-btn present, advance-btn absent', async () => {
  const item = makeActionItem({ title: 'Completed item', status: 'completed' })
  ;(getActions as jest.Mock).mockResolvedValue([item])

  render(<ActionItemsPage />)
  await waitForPageLoaded()

  expect(screen.getByTestId('verify-btn')).toBeInTheDocument()
  expect(screen.queryByTestId('advance-btn')).not.toBeInTheDocument()
})

// ── AI-8: verified card → neither button ─────────────────────────────────────
test('AI-8: card with status=verified → neither advance-btn nor verify-btn present', async () => {
  const item = makeActionItem({
    title:      'Verified item',
    status:     'verified',
    impactNote: 'We shipped it.',
  })
  ;(getActions as jest.Mock).mockResolvedValue([item])

  render(<ActionItemsPage />)
  await waitForPageLoaded()

  expect(screen.queryByTestId('advance-btn')).not.toBeInTheDocument()
  expect(screen.queryByTestId('verify-btn')).not.toBeInTheDocument()
})

// ── AI-9: "Verify Impact" click → verify-impact-modal appears ────────────────
test('AI-9: clicking verify-btn → verify-impact-modal appears in DOM', async () => {
  const item = makeActionItem({ title: 'Completed item', status: 'completed' })
  ;(getActions as jest.Mock).mockResolvedValue([item])

  render(<ActionItemsPage />)
  await waitForPageLoaded()

  fireEvent.click(screen.getByTestId('verify-btn'))

  await waitFor(() => {
    expect(screen.getByTestId('verify-impact-modal')).toBeInTheDocument()
  })
})

// ── AI-10: VerifyImpactModal — submit disabled when impactNote empty ──────────
test('AI-10: VerifyImpactModal — submit disabled when impactNote is empty', async () => {
  const item = makeActionItem({ title: 'Completed item', status: 'completed' })
  ;(getActions as jest.Mock).mockResolvedValue([item])

  render(<ActionItemsPage />)
  await waitForPageLoaded()
  fireEvent.click(screen.getByTestId('verify-btn'))
  await waitFor(() => expect(screen.getByTestId('verify-impact-modal')).toBeInTheDocument())

  expect(screen.getByTestId('verify-impact-submit-btn')).toBeDisabled()
})

// ── AI-11: VerifyImpactModal — submit disabled when impactNote.length > 300 ──
test('AI-11: VerifyImpactModal — submit disabled when impactNote.length > 300', async () => {
  const item = makeActionItem({ title: 'Completed item', status: 'completed' })
  ;(getActions as jest.Mock).mockResolvedValue([item])

  render(<ActionItemsPage />)
  await waitForPageLoaded()
  fireEvent.click(screen.getByTestId('verify-btn'))
  await waitFor(() => expect(screen.getByTestId('verify-impact-modal')).toBeInTheDocument())

  const tooLong = 'x'.repeat(301)
  fireEvent.change(
    screen.getByPlaceholderText(/deployments now take/i),
    { target: { value: tooLong } }
  )

  expect(screen.getByTestId('verify-impact-submit-btn')).toBeDisabled()
})

// ── AI-12: valid impact note → submit → verifyImpact called → modal closes ───
test('AI-12: valid impact note → submit → verifyImpact called → modal closes → re-fetch', async () => {
  const item = makeActionItem({ _id: 'ai-verify', title: 'Completed item', status: 'completed' })
  ;(getActions as jest.Mock).mockResolvedValue([item])
  ;(verifyImpact as jest.Mock).mockResolvedValue({ ...item, status: 'verified', impactNote: 'It worked.' })

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

  await waitFor(() => {
    expect(verifyImpact).toHaveBeenCalledWith('ai-verify', 'It worked.')
    expect(screen.queryByTestId('verify-impact-modal')).not.toBeInTheDocument()
  })
  expect((getActions as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2)
})

// ── AI-13: SOURCE FEEDBACK block present when sourceFeedbackId non-empty ──────
test('AI-13: SOURCE FEEDBACK block present when sourceFeedbackId non-empty; absent when empty', async () => {
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

  render(<ActionItemsPage />)
  await waitForPageLoaded()

  expect(screen.getByText('Source Feedback')).toBeInTheDocument()
  expect(screen.getByText(/Adopt a No Meeting Thursday policy/)).toBeInTheDocument()
  expect(screen.getAllByText('Source Feedback')).toHaveLength(1)
})

// ── AI-14: "+ New Action Item" header button → modal opens, submit disabled ───
test('AI-14: open-new-action-btn → modal opens; submit disabled; title typed → enabled; Cancel → closes', async () => {
  const item = makeActionItem({ title: 'Existing action', status: 'open' })
  ;(getActions as jest.Mock).mockResolvedValue([item])

  render(<ActionItemsPage />)
  await waitForPageLoaded()

  // Step 1: Click the header "+ New Action Item" button
  fireEvent.click(screen.getByTestId('open-new-action-btn'))

  await waitFor(() => {
    expect(screen.getByTestId('new-action-modal')).toBeInTheDocument()
  })

  // Step 2: Submit disabled with empty title
  expect(screen.getByTestId('new-action-submit-btn')).toBeDisabled()

  // Step 3: Type a title AND select an owner → submit becomes enabled
  fireEvent.change(
    screen.getByPlaceholderText(/add automated test coverage/i),
    { target: { value: 'Fix the auth timeout issue' } }
  )
  fireEvent.change(
    screen.getByRole('combobox'),
    { target: { value: 'user-1' } }
  )
  expect(screen.getByTestId('new-action-submit-btn')).not.toBeDisabled()

  // Step 4: Click Cancel → modal removed
  fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
  await waitFor(() => {
    expect(screen.queryByTestId('new-action-modal')).not.toBeInTheDocument()
  })
})
