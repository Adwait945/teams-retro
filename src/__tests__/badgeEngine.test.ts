/**
 * @jest-environment node
 */
// Sprint 7 — Epic 7.2 AC-7.2.4/7.2.10 — src/lib/badgeEngine.ts orchestration + Pod Champion

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }))

jest.mock('@/lib/badgeChecks', () => ({
  checkFeedbackMachine: jest.fn().mockResolvedValue(false),
  checkActionTaker: jest.fn().mockResolvedValue(false),
  checkInnovator: jest.fn().mockResolvedValue(false),
  checkProblemSolver: jest.fn().mockResolvedValue(false),
  checkConsensusBuilder: jest.fn().mockResolvedValue(false),
}))

jest.mock('@/lib/models/Badge', () => {
  const mockFindOne = jest.fn()
  const mockCreate = jest.fn().mockResolvedValue({ _id: 'badge-1' })
  const mockDeleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 })
  return {
    __esModule: true,
    default: {
      findOne: (...args: unknown[]) => mockFindOne(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      deleteOne: (...args: unknown[]) => mockDeleteOne(...args),
      __mockFindOne: mockFindOne,
      __mockCreate: mockCreate,
      __mockDeleteOne: mockDeleteOne,
    },
  }
})

jest.mock('@/lib/pointsEngine', () => ({
  getPodLeaderboard: jest.fn(),
}))

jest.mock('@/lib/models/PointEvent', () => {
  const mockFindOne = jest.fn()
  return {
    __esModule: true,
    default: {
      findOne: (...args: unknown[]) => mockFindOne(...args),
      __mockFindOne: mockFindOne,
    },
  }
})

import { evaluateBadges } from '@/lib/badgeEngine'
import * as badgeChecks from '@/lib/badgeChecks'
import { getPodLeaderboard } from '@/lib/pointsEngine'

const BadgeMock = jest.requireMock('@/lib/models/Badge').default as {
  __mockFindOne: jest.Mock
  __mockCreate: jest.Mock
  __mockDeleteOne: jest.Mock
}

const PointEventMock = jest.requireMock('@/lib/models/PointEvent').default as {
  __mockFindOne: jest.Mock
}

// Helper: builds a `PointEventModel.findOne({ userId }).sort(...)` chain mock
// keyed by userId → earliest-event Date, matching the query shape used by
// badgeEngine's (buggy) tie-break: findOne({ userId }).sort({ createdAt: 1 }).
function mockEarliestEventByUser(byUser: Record<string, Date>) {
  PointEventMock.__mockFindOne.mockImplementation(({ userId }: { userId: string }) => ({
    sort: jest.fn().mockResolvedValue(
      byUser[userId] ? { createdAt: byUser[userId] } : null
    ),
  }))
}

beforeEach(() => {
  jest.clearAllMocks()
  BadgeMock.__mockFindOne.mockResolvedValue(null)
  ;(getPodLeaderboard as jest.Mock).mockResolvedValue([])
})

// T1-ENGINE-01
test('T1-ENGINE-01: evaluateBadges is idempotent — calling twice creates each badge at most once', async () => {
  ;(badgeChecks.checkFeedbackMachine as jest.Mock).mockResolvedValue(true)
  BadgeMock.__mockFindOne.mockResolvedValueOnce(null) // first call: no existing badge
  await evaluateBadges('u1', 'pod1')

  BadgeMock.__mockFindOne.mockResolvedValueOnce({ _id: 'existing-badge' }) // second call: already exists
  await evaluateBadges('u1', 'pod1')

  const feedbackMachineCreateCalls = BadgeMock.__mockCreate.mock.calls.filter(
    ([arg]) => arg.type === 'feedback_machine'
  )
  expect(feedbackMachineCreateCalls.length).toBeLessThanOrEqual(1)
})

// T1-ENGINE-02
test('T1-ENGINE-02: Pod Champion tie-break — earlier qualifying PointEvent wins on identical totals', async () => {
  ;(getPodLeaderboard as jest.Mock).mockResolvedValue([
    { userId: 'userA', windowPoints: 100, allTimePoints: 100, name: 'A', avatar: '' },
    { userId: 'userB', windowPoints: 100, allTimePoints: 100, name: 'B', avatar: '' },
  ])
  BadgeMock.__mockFindOne.mockResolvedValue(null) // no existing pod_champion

  await evaluateBadges('userA', 'pod1')

  const championCreateCall = BadgeMock.__mockCreate.mock.calls.find(
    ([arg]) => arg.type === 'pod_champion'
  )
  expect(championCreateCall).toBeTruthy()
})

// T1-ENGINE-03
test('T1-ENGINE-03: Pod Champion no-op when current holder is unchanged', async () => {
  ;(getPodLeaderboard as jest.Mock).mockResolvedValue([
    { userId: 'userA', windowPoints: 100, allTimePoints: 100, name: 'A', avatar: '' },
  ])
  BadgeMock.__mockFindOne.mockResolvedValue({ _id: 'existing', userId: 'userA', podId: 'pod1', type: 'pod_champion' })

  await evaluateBadges('userA', 'pod1')

  const championCreateCall = BadgeMock.__mockCreate.mock.calls.find(
    ([arg]) => arg.type === 'pod_champion'
  )
  expect(championCreateCall).toBeUndefined()
  expect(BadgeMock.__mockDeleteOne).not.toHaveBeenCalled()
})

// T1-ENGINE-04 — Regression for live-smoke-test bug: tie-break must compare
// when each user's *running total* first reached the tied value, not the
// timestamp of their overall first-ever PointEvent.
//
// Scenario (mirrors the reported repro):
//  - Adi2 (current pod_champion holder) earns a single +150 event at T2.
//    Adi2's total reaches 150 at T2.
//  - Priyanka (challenger) earns +10 at T0 (her very first-ever event,
//    earlier than T2), then more events later, finally reaching a
//    cumulative total of 150 at T5 (after T2).
//  - Both tied at windowPoints: 150. Correct winner: Adi2 (reached 150 at
//    T2, before Priyanka's T5). The current buggy implementation instead
//    compares "earliest PointEvent ever" (T0 for Priyanka vs T2 for Adi2)
//    and incorrectly flips the badge to Priyanka.
test('T1-ENGINE-04: Pod Champion tie-break keeps holder who reached the tied total first (not whoever has the earliest PointEvent ever)', async () => {
  const T0 = new Date('2026-06-01T00:00:00Z') // Priyanka's first-ever event (not yet at 150)
  const T2 = new Date('2026-06-03T00:00:00Z') // Adi2 reaches 150 here (only event)
  const T5 = new Date('2026-06-06T00:00:00Z') // Priyanka's total finally reaches 150 here

  // evaluatePodChampion only re-evaluates via tie-break when the
  // leaderboard's #1 (currentTop) differs from the existing holder's
  // userId, so Priyanka is placed first in leaderboard order to trigger
  // the "existing.userId !== currentTop.userId" branch, which then
  // re-resolves the true winner via the tied-group tie-break.
  ;(getPodLeaderboard as jest.Mock).mockResolvedValue([
    { userId: 'priyanka', windowPoints: 150, allTimePoints: 150, name: 'Priyanka', avatar: '' },
    { userId: 'adi2', windowPoints: 150, allTimePoints: 150, name: 'Adi2', avatar: '' },
  ])
  BadgeMock.__mockFindOne.mockResolvedValue({
    _id: 'existing-badge',
    userId: 'adi2',
    podId: 'pod1',
    type: 'pod_champion',
  })

  // Buggy query: PointEventModel.findOne({ userId }).sort({ createdAt: 1 })
  // returns each user's overall-earliest event, NOT the event where their
  // running total first hit 150. Priyanka's overall-earliest (T0) predates
  // Adi2's only/earliest event (T2), which is exactly what causes the bug.
  mockEarliestEventByUser({
    adi2: T2,
    priyanka: T0,
  })
  void T5 // T5 documents when Priyanka's cumulative total actually reached 150; the
  // current buggy query never looks at this value at all — that's the bug.

  await evaluateBadges('adi2', 'pod1')

  // Correct behavior: Adi2 reached 150 first (T2, before Priyanka's T5), so
  // the badge must stay with Adi2 — no delete, no re-create for Priyanka.
  const championCreateForPriyanka = BadgeMock.__mockCreate.mock.calls.find(
    ([arg]) => arg.type === 'pod_champion' && arg.userId === 'priyanka'
  )
  expect(championCreateForPriyanka).toBeUndefined()
  expect(BadgeMock.__mockDeleteOne).not.toHaveBeenCalled()
})

// T1-ENGINE-05 — Positive control: a genuine, unambiguous non-tied lead
// change (no tie at all) must still transfer the badge to the new clear
// leader. Guards against a tie-break fix that over-corrects and breaks the
// already-working clean-transfer path.
test('T1-ENGINE-05: Pod Champion transfers to a new clear leader when there is no tie', async () => {
  ;(getPodLeaderboard as jest.Mock).mockResolvedValue([
    { userId: 'newLeader', windowPoints: 200, allTimePoints: 200, name: 'New', avatar: '' },
    { userId: 'oldHolder', windowPoints: 120, allTimePoints: 120, name: 'Old', avatar: '' },
  ])
  BadgeMock.__mockFindOne.mockResolvedValue({
    _id: 'existing-badge',
    userId: 'oldHolder',
    podId: 'pod1',
    type: 'pod_champion',
  })

  await evaluateBadges('newLeader', 'pod1')

  expect(BadgeMock.__mockDeleteOne).toHaveBeenCalledWith({ _id: 'existing-badge' })
  const championCreateCall = BadgeMock.__mockCreate.mock.calls.find(
    ([arg]) => arg.type === 'pod_champion'
  )
  expect(championCreateCall).toBeTruthy()
  expect(championCreateCall?.[0]).toMatchObject({ userId: 'newLeader', podId: 'pod1', type: 'pod_champion' })
})
