import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/sprint-setup',
}))

jest.mock('@/services/userService', () => ({
  getCurrentUser: jest.fn(),
  getAllUsers: jest.fn(),
  cacheUser: jest.fn(),
  registerUser: jest.fn(),
}))

jest.mock('@/services/sprintService', () => ({
  getActiveSprint: jest.fn(),
  createSprint: jest.fn(),
  updateSprint: jest.fn(),
  openRetro: jest.fn(),
  closeRetro: jest.fn(),
}))

jest.mock('@/components/layout/Shell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

import SprintSetupPage from '@/app/sprint-setup/page'
import FeedbackPage from '@/app/feedback/page'
import { getCurrentUser, getAllUsers } from '@/services/userService'
import { getActiveSprint, updateSprint, createSprint } from '@/services/sprintService'
import { getFeedbackByLane } from '@/services/feedbackService'

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

const mockAdminUser = {
  _id: 'user-1',
  name: 'Jane Doe',
  username: 'jdoe',
  pod: 'pod1',
  isAdmin: true,
  createdAt: '2026-04-01T00:00:00.000Z',
}

const mockNonAdminUser = {
  _id: 'user-2',
  name: 'Bob Smith',
  username: 'bsmith',
  pod: 'pod2',
  isAdmin: false,
  createdAt: '2026-04-01T00:00:00.000Z',
}

const mockSprint = {
  _id: 'sprint-1',
  name: 'Sprint 42',
  goal: 'Ship it',
  status: 'open' as const,
  startDate: '2026-04-01T00:00:00.000Z',
  endDate: '2026-04-14T00:00:00.000Z',
  teamMemberIds: [],
}

async function waitForPageLoaded() {
  await waitFor(() => expect(screen.getByTestId('sprint-setup-page')).toBeInTheDocument())
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockAdminUser)
  ;(getAllUsers as jest.Mock).mockResolvedValue([mockAdminUser])
  ;(getActiveSprint as jest.Mock).mockResolvedValue(mockSprint)
  ;(updateSprint as jest.Mock).mockResolvedValue(mockSprint)
  ;(createSprint as jest.Mock).mockResolvedValue({ ...mockSprint, _id: 'sprint-new' })
  ;(getFeedbackByLane as jest.Mock).mockResolvedValue([])
})

// ─── SS-9: No session user → router.push('/') ────────────────────────────────

it('SS-9: no session user redirects to /', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(null)
  render(<SprintSetupPage />)
  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})

// ─── SS-10: Admin user + sprint loaded → admin-view present ──────────────────

it('SS-10: admin user sees admin-view; readonly-view absent', async () => {
  render(<SprintSetupPage />)
  await waitForPageLoaded()
  expect(screen.getByTestId('admin-view')).toBeInTheDocument()
  expect(screen.queryByTestId('readonly-view')).not.toBeInTheDocument()
})

// ─── SS-11: Non-admin user → readonly-view present ───────────────────────────

it('SS-11: non-admin user sees readonly-view; admin-view absent', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockNonAdminUser)
  render(<SprintSetupPage />)
  await waitForPageLoaded()
  expect(screen.getByTestId('readonly-view')).toBeInTheDocument()
  expect(screen.queryByTestId('admin-view')).not.toBeInTheDocument()
})

// ─── SS-12: Admin view — Save button disabled when Sprint Name is empty ───────

it('SS-12: save button is disabled when sprint name is empty', async () => {
  render(<SprintSetupPage />)
  await waitForPageLoaded()

  const nameInput = screen.getByTestId('sprint-name-input')
  fireEvent.change(nameInput, { target: { value: '' } })

  expect(screen.getByTestId('save-btn')).toBeDisabled()
})

// ─── SS-13: Admin view — Save button enabled after typing name + valid dates ──

it('SS-13: save button enabled after typing sprint name and valid dates', async () => {
  ;(getActiveSprint as jest.Mock).mockResolvedValue(null)
  ;(getAllUsers as jest.Mock).mockResolvedValue([])
  render(<SprintSetupPage />)
  await waitFor(() => expect(screen.getByTestId('sprint-setup-page')).toBeInTheDocument())

  fireEvent.change(screen.getByTestId('sprint-name-input'), {
    target: { value: 'Sprint 43' },
  })
  fireEvent.change(screen.getByTestId('start-date-input'), {
    target: { value: '2026-05-01' },
  })
  fireEvent.change(screen.getByTestId('end-date-input'), {
    target: { value: '2026-05-14' },
  })

  expect(screen.getByTestId('save-btn')).not.toBeDisabled()
})

// ─── SS-14: endDate < startDate → date-error present; save button disabled ────

it('SS-14: endDate < startDate shows date-error and disables save button', async () => {
  render(<SprintSetupPage />)
  await waitForPageLoaded()

  fireEvent.change(screen.getByTestId('start-date-input'), {
    target: { value: '2026-05-14' },
  })
  fireEvent.change(screen.getByTestId('end-date-input'), {
    target: { value: '2026-05-01' },
  })

  await waitFor(() => {
    expect(screen.getByTestId('date-error')).toBeInTheDocument()
  })
  expect(screen.getByTestId('save-btn')).toBeDisabled()
})

// ─── SS-15: clicking Save calls updateSprint; save-success appears ────────────

it('SS-15: clicking Save calls updateSprint and shows save-success', async () => {
  render(<SprintSetupPage />)
  await waitForPageLoaded()

  fireEvent.click(screen.getByTestId('save-btn'))

  await waitFor(() => {
    expect(updateSprint).toHaveBeenCalledWith(
      'sprint-1',
      expect.objectContaining({ name: 'Sprint 42' })
    )
    expect(screen.getByTestId('save-success')).toBeInTheDocument()
  })
})

// ─── SS-16: admin view has status-open and status-closed radios ───────────────

it('SS-16: admin view renders status-open and status-closed radio buttons', async () => {
  render(<SprintSetupPage />)
  await waitForPageLoaded()

  expect(screen.getByTestId('status-open')).toBeInTheDocument()
  expect(screen.getByTestId('status-closed')).toBeInTheDocument()
})

// ─── SS-17: feedback/page.tsx — open-modal-btn disabled when sprint is closed ─

it('SS-17: open-modal-btn is disabled when sprint status is closed', async () => {
  ;(getCurrentUser as jest.Mock).mockReturnValue(mockNonAdminUser)
  ;(getFeedbackByLane as jest.Mock).mockResolvedValue([])
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ _id: 'sp1', name: 'Sprint 42', status: 'closed' }),
  })

  render(<FeedbackPage />)

  await waitFor(() => {
    expect(screen.getByTestId('open-modal-btn')).toBeDisabled()
  })
})
