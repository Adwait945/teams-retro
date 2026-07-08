/**
 * @jest-environment node
 */
// Sprint 7 — Epic 7.1 AC-7.1.2 — POST /api/feedback fires recordPointEvent post-save

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }))

jest.mock('@/lib/models/FeedbackItem', () => {
  const mockSave = jest.fn().mockResolvedValue(undefined)
  function MockFeedbackItemModel(this: Record<string, unknown>, data: Record<string, unknown>) {
    Object.assign(this, data)
    this._id = 'mock-fb-id'
    this.save = mockSave
  }
  Object.assign(MockFeedbackItemModel, { __mockSave: mockSave })
  return { __esModule: true, default: MockFeedbackItemModel }
})

jest.mock('@/lib/pointsEngine', () => ({
  recordPointEvent: jest.fn(),
  getPodLeaderboard: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/feedback/route'
import { recordPointEvent } from '@/lib/pointsEngine'

const FeedbackItemMock = jest.requireMock('@/lib/models/FeedbackItem').default as {
  __mockSave: jest.Mock
}
const mockRecordPointEvent = recordPointEvent as jest.Mock

function makeReq(body: object) {
  return new NextRequest('http://localhost/api/feedback', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  FeedbackItemMock.__mockSave.mockResolvedValue(undefined)
})

// T2-FB-01 / T3-FEEDBACK-01
test('T2-FB-01: POST /api/feedback records a submit_feedback PointEvent for the author', async () => {
  const res = await POST(
    makeReq({ category: 'went-well', content: 'Great sprint', authorId: 'user-1' })
  )
  expect(res.status).toBe(201)
  const body = await res.json()
  expect(body._id).toBe('mock-fb-id')

  expect(mockRecordPointEvent).toHaveBeenCalledTimes(1)
  const call = mockRecordPointEvent.mock.calls[0][0]
  expect(call.userId).toBe('user-1')
  expect(call.action).toBe('submit_feedback')
  expect(call.relatedId).toBe('mock-fb-id')
  expect(typeof call.podId).toBe('string')
})

// T2-FB-02 — fault isolation
test('T2-FB-02: primary 201 response unaffected when recordPointEvent throws', async () => {
  mockRecordPointEvent.mockImplementation(() => {
    throw new Error('points engine down')
  })
  const res = await POST(
    makeReq({ category: 'went-well', content: 'Great sprint', authorId: 'user-1' })
  )
  expect(res.status).toBe(201)
})

// T2-FB-03 — existing validation unchanged
test('T2-FB-03: slowed-us-down without suggestion still 422, no point event recorded', async () => {
  const res = await POST(
    makeReq({ category: 'slowed-us-down', content: 'Deploys are slow', authorId: 'user-1' })
  )
  expect(res.status).toBe(422)
  expect(mockRecordPointEvent).not.toHaveBeenCalled()
})
