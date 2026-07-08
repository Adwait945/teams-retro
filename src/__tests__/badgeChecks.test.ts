/**
 * @jest-environment node
 */
// Sprint 7 — Epic 7.2 AC-7.2.5..9 — src/lib/badgeChecks.ts pure check functions

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }))

jest.mock('@/lib/models/PointEvent', () => {
  const mockCount = jest.fn()
  return {
    __esModule: true,
    default: { countDocuments: (...args: unknown[]) => mockCount(...args), __mockCount: mockCount },
  }
})

jest.mock('@/lib/models/FeedbackItem', () => {
  const mockAggregate = jest.fn()
  const mockExists = jest.fn()
  return {
    __esModule: true,
    default: {
      aggregate: (...args: unknown[]) => mockAggregate(...args),
      exists: (...args: unknown[]) => mockExists(...args),
      __mockAggregate: mockAggregate,
      __mockExists: mockExists,
    },
  }
})

jest.mock('@/lib/models/ActionItem', () => {
  const mockFind = jest.fn()
  return {
    __esModule: true,
    default: { find: (...args: unknown[]) => mockFind(...args), __mockFind: mockFind },
  }
})

import {
  checkFeedbackMachine,
  checkActionTaker,
  checkInnovator,
  checkProblemSolver,
  checkConsensusBuilder,
} from '@/lib/badgeChecks'

const PointEventMock = jest.requireMock('@/lib/models/PointEvent').default as { __mockCount: jest.Mock }
const FeedbackItemMock = jest.requireMock('@/lib/models/FeedbackItem').default as {
  __mockAggregate: jest.Mock
  __mockExists: jest.Mock
}
const ActionItemMock = jest.requireMock('@/lib/models/ActionItem').default as { __mockFind: jest.Mock }

beforeEach(() => jest.clearAllMocks())

// T1-CHECK-01
test('T1-CHECK-01: checkFeedbackMachine crosses threshold at exactly 10', async () => {
  PointEventMock.__mockCount.mockResolvedValueOnce(9)
  await expect(checkFeedbackMachine('u1')).resolves.toBe(false)

  PointEventMock.__mockCount.mockResolvedValueOnce(10)
  await expect(checkFeedbackMachine('u1')).resolves.toBe(true)

  const callArgs = PointEventMock.__mockCount.mock.calls[0][0]
  expect(callArgs.userId).toBe('u1')
  expect(callArgs.action).toBe('submit_feedback')
  expect(callArgs.createdAt.$gte).toBeInstanceOf(Date)
})

// T1-CHECK-02
test('T1-CHECK-02: checkActionTaker crosses threshold at exactly 3', async () => {
  PointEventMock.__mockCount.mockResolvedValueOnce(2)
  await expect(checkActionTaker('u1')).resolves.toBe(false)

  PointEventMock.__mockCount.mockResolvedValueOnce(3)
  await expect(checkActionTaker('u1')).resolves.toBe(true)

  const callArgs = PointEventMock.__mockCount.mock.calls[0][0]
  expect(callArgs.action).toBe('complete_action')
})

// T1-CHECK-03
test('T1-CHECK-03: checkInnovator sums should-try upvotes with no date filter, threshold 20', async () => {
  FeedbackItemMock.__mockAggregate.mockResolvedValueOnce([{ total: 20 }])
  await expect(checkInnovator('u1')).resolves.toBe(true)

  const pipeline = FeedbackItemMock.__mockAggregate.mock.calls[0][0]
  const matchStage = pipeline.find((stage: Record<string, unknown>) => '$match' in stage)
  expect(matchStage.$match.authorId).toBe('u1')
  expect(matchStage.$match.category).toBe('should-try')
  expect(matchStage.$match.createdAt).toBeUndefined()
})

// T1-CHECK-04
test('T1-CHECK-04: checkProblemSolver skips items with no sourceFeedbackId, matches slowed-us-down', async () => {
  ActionItemMock.__mockFind.mockResolvedValueOnce([
    { ownerId: 'u1', status: 'completed', sourceFeedbackId: null },
    { ownerId: 'u1', status: 'verified', sourceFeedbackId: 'fb-1' },
  ])
  const { default: FeedbackItemModel } = jest.requireMock('@/lib/models/FeedbackItem')
  FeedbackItemModel.findById = jest.fn().mockResolvedValue({ category: 'slowed-us-down' })

  await expect(checkProblemSolver('u1')).resolves.toBe(true)
})

// T1-CHECK-05
test('T1-CHECK-05: checkConsensusBuilder requires at least one feedback item with upvotes >= 10', async () => {
  FeedbackItemMock.__mockExists.mockResolvedValueOnce({ _id: 'fb-1' })
  await expect(checkConsensusBuilder('u1')).resolves.toBe(true)

  const callArgs = FeedbackItemMock.__mockExists.mock.calls[0][0]
  expect(callArgs.authorId).toBe('u1')
  expect(callArgs.upvotes.$gte).toBe(10)
})
