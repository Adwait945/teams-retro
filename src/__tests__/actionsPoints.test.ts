/**
 * @jest-environment node
 */
// Sprint 7 — Epic 7.1 AC-7.1.4/5/6 — POST /api/actions + PATCH /api/actions/[id]/advance

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }))

jest.mock('@/lib/models/ActionItem', () => {
  const mockSave = jest.fn().mockResolvedValue(undefined)
  const mockFindById = jest.fn()
  function MockActionItemModel(this: Record<string, unknown>, data: Record<string, unknown>) {
    Object.assign(this, data)
    this._id = 'mock-ai-id'
    this.status = data.status ?? 'open'
    this.save = mockSave
  }
  Object.assign(MockActionItemModel, {
    findById: (...args: unknown[]) => mockFindById(...args),
    __mockSave: mockSave,
    __mockFindById: mockFindById,
  })
  return { __esModule: true, default: MockActionItemModel }
})

jest.mock('@/lib/models/FeedbackItem', () => {
  const mockFindById = jest.fn()
  const mockFindByIdAndUpdate = jest.fn().mockResolvedValue(undefined)
  return {
    __esModule: true,
    default: {
      findById: (...args: unknown[]) => mockFindById(...args),
      findByIdAndUpdate: (...args: unknown[]) => mockFindByIdAndUpdate(...args),
      __mockFindById: mockFindById,
    },
  }
})

jest.mock('@/lib/pointsEngine', () => ({
  recordPointEvent: jest.fn(),
  getPodLeaderboard: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/actions/route'
import { PATCH as advancePATCH } from '@/app/api/actions/[id]/advance/route'
import { recordPointEvent } from '@/lib/pointsEngine'

const ActionItemMock = jest.requireMock('@/lib/models/ActionItem').default as {
  __mockSave: jest.Mock
  __mockFindById: jest.Mock
}
const FeedbackItemMock = jest.requireMock('@/lib/models/FeedbackItem').default as {
  __mockFindById: jest.Mock
}
const mockRecordPointEvent = recordPointEvent as jest.Mock

beforeEach(() => jest.clearAllMocks())

// T2-ACT-01
test('T2-ACT-01: convert_action credits true feedback author, even when anonymous, not the admin', async () => {
  FeedbackItemMock.__mockFindById.mockResolvedValue({
    _id: 'fb-1',
    authorId: 'true-author',
    isAnonymous: true,
  })

  const req = new NextRequest('http://localhost/api/actions', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Automate deploys',
      ownerId: 'admin-user',
      sourceFeedbackId: 'fb-1',
    }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await POST(req)
  expect(res.status).toBe(201)

  expect(mockRecordPointEvent).toHaveBeenCalledTimes(1)
  const call = mockRecordPointEvent.mock.calls[0][0]
  expect(call.userId).toBe('true-author')
  expect(call.userId).not.toBe('admin-user')
  expect(call.action).toBe('convert_action')
})

// T2-ACT-02
test('T2-ACT-02: standalone action (no sourceFeedbackId) never fires convert_action', async () => {
  const req = new NextRequest('http://localhost/api/actions', {
    method: 'POST',
    body: JSON.stringify({ title: 'Write docs', ownerId: 'user-1' }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await POST(req)
  expect(res.status).toBe(201)

  const convertCalls = mockRecordPointEvent.mock.calls.filter(
    ([arg]) => arg.action === 'convert_action'
  )
  expect(convertCalls.length).toBe(0)
})

// T2-ACT-03
test('T2-ACT-03: open -> in-progress advance fires no point event', async () => {
  const openItem = { _id: 'ai-1', ownerId: 'user-1', status: 'open', save: ActionItemMock.__mockSave }
  ActionItemMock.__mockFindById.mockResolvedValue(openItem)

  const req = new NextRequest('http://localhost/api/actions/ai-1/advance', { method: 'PATCH' })
  const res = await advancePATCH(req, { params: { id: 'ai-1' } })
  expect(res.status).toBe(200)
  expect(mockRecordPointEvent).not.toHaveBeenCalled()
})

// T2-ACT-04
test('T2-ACT-04: in-progress -> completed advance fires complete_action for item.ownerId', async () => {
  const inProgressItem = { _id: 'ai-1', ownerId: 'owner-1', status: 'in-progress', save: ActionItemMock.__mockSave }
  ActionItemMock.__mockFindById.mockResolvedValue(inProgressItem)

  const req = new NextRequest('http://localhost/api/actions/ai-1/advance', { method: 'PATCH' })
  const res = await advancePATCH(req, { params: { id: 'ai-1' } })
  expect(res.status).toBe(200)

  expect(mockRecordPointEvent).toHaveBeenCalledTimes(1)
  const call = mockRecordPointEvent.mock.calls[0][0]
  expect(call.userId).toBe('owner-1')
  expect(call.action).toBe('complete_action')
})
