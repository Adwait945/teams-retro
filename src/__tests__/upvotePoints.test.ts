/**
 * @jest-environment node
 */
// Sprint 7 — Epic 7.1 AC-7.1.3 — PATCH /api/feedback/[id]/upvote toggle fires point events

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }))

jest.mock('@/lib/models/FeedbackItem', () => {
  const mockFindById = jest.fn()
  return {
    __esModule: true,
    default: { findById: (...args: unknown[]) => mockFindById(...args), __mockFindById: mockFindById },
  }
})

jest.mock('@/lib/pointsEngine', () => ({
  recordPointEvent: jest.fn(),
  getPodLeaderboard: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/feedback/[id]/upvote/route'
import { recordPointEvent } from '@/lib/pointsEngine'

const FeedbackItemMock = jest.requireMock('@/lib/models/FeedbackItem').default as {
  __mockFindById: jest.Mock
}
const mockRecordPointEvent = recordPointEvent as jest.Mock

function makeReq(userId: string) {
  return new NextRequest('http://localhost/api/feedback/fb-1/upvote', {
    method: 'PATCH',
    body: JSON.stringify({ userId }),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'fb-1',
    authorId: 'author-1',
    upvotedBy: [] as string[],
    upvotes: 0,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

beforeEach(() => jest.clearAllMocks())

// T2-UP-01
test('T2-UP-01: first upvote fires receive_upvote for the feedback author', async () => {
  const item = makeItem()
  FeedbackItemMock.__mockFindById.mockResolvedValue(item)

  const res = await PATCH(makeReq('voter-1'), { params: { id: 'fb-1' } })
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.toggled).toBe(true)

  expect(mockRecordPointEvent).toHaveBeenCalledTimes(1)
  const call = mockRecordPointEvent.mock.calls[0][0]
  expect(call.userId).toBe('author-1')
  expect(call.action).toBe('receive_upvote')
  expect(call.relatedId).toBe('fb-1')
})

// T2-UP-02
test('T2-UP-02: second call from same user (toggle off) fires remove_upvote', async () => {
  const item = makeItem({ upvotedBy: ['voter-1'], upvotes: 1 })
  FeedbackItemMock.__mockFindById.mockResolvedValue(item)

  const res = await PATCH(makeReq('voter-1'), { params: { id: 'fb-1' } })
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.toggled).toBe(false)

  expect(mockRecordPointEvent).toHaveBeenCalledTimes(1)
  const call = mockRecordPointEvent.mock.calls[0][0]
  expect(call.userId).toBe('author-1')
  expect(call.action).toBe('remove_upvote')
})

// T2-UP-03
test('T2-UP-03: author upvoting own feedback returns 403 and records nothing', async () => {
  const item = makeItem({ authorId: 'author-1' })
  FeedbackItemMock.__mockFindById.mockResolvedValue(item)

  const res = await PATCH(makeReq('author-1'), { params: { id: 'fb-1' } })
  expect(res.status).toBe(403)
  expect(mockRecordPointEvent).not.toHaveBeenCalled()
})

// T2-UP-04
test('T2-UP-04: unknown feedback id returns 404 and records nothing', async () => {
  FeedbackItemMock.__mockFindById.mockResolvedValue(null)

  const res = await PATCH(makeReq('voter-1'), { params: { id: 'missing' } })
  expect(res.status).toBe(404)
  expect(mockRecordPointEvent).not.toHaveBeenCalled()
})

// T3-UPVOTE-01 contract
test('T3-UPVOTE-01: response shape is exactly { upvotes, upvotedBy, toggled }', async () => {
  const item = makeItem()
  FeedbackItemMock.__mockFindById.mockResolvedValue(item)

  const res = await PATCH(makeReq('voter-1'), { params: { id: 'fb-1' } })
  const body = await res.json()
  expect(Object.keys(body).sort()).toEqual(['upvotes', 'upvotedBy', 'toggled'].sort())
})
