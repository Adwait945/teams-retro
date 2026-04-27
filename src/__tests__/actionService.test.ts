/**
 * @jest-environment node
 */

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }))

jest.mock('@/lib/models/ActionItem', () => {
  const mockSave     = jest.fn().mockResolvedValue(undefined)
  const mockFind     = jest.fn()
  const mockFindById = jest.fn()

  function MockActionItemModel(this: Record<string, unknown>, data: Record<string, unknown>) {
    Object.assign(this, data)
    this._id    = 'mock-ai-id'
    this.status = data.status ?? 'open'
    this.save   = mockSave
  }
  Object.assign(MockActionItemModel, {
    find:          (...args: unknown[]) => ({ lean: () => ({ limit: () => mockFind(...args) }) }),
    findById:      mockFindById,
    __mockSave:    mockSave,
    __mockFind:    mockFind,
    __mockFindById: mockFindById,
  })
  return { __esModule: true, default: MockActionItemModel }
})

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/actions/route'
import { PATCH as advancePATCH } from '@/app/api/actions/[id]/advance/route'
import { PATCH as verifyPATCH } from '@/app/api/actions/[id]/verify/route'
import { getCompletionRate, getOpenCount, getCompletedCount, getActionsByStatus, verifyImpact } from '@/services/actionService'
import type { ActionItem } from '@/types'

const MockActionItemModel = (jest.requireMock('@/lib/models/ActionItem') as { default: { __mockSave: jest.Mock; __mockFind: jest.Mock; __mockFindById: jest.Mock } }).default
const mockSaveAction     = MockActionItemModel.__mockSave
const mockFindAction     = MockActionItemModel.__mockFind
const mockFindByIdAction = MockActionItemModel.__mockFindById

function makeAction(status: ActionItem['status']): ActionItem {
  return {
    _id: Math.random().toString(),
    title: 'Test',
    description: '',
    ownerId: 'u1',
    sourceFeedbackId: '',
    sourceQuote: '',
    status,
    dueDate: '',
    createdAt: new Date().toISOString(),
  }
}

// DB-7 — getCompletionRate([]) returns 0 (no divide-by-zero)
test('DB-7: getCompletionRate([]) returns 0 and does not throw', () => {
  expect(getCompletionRate([])).toBe(0)
  expect(() => getCompletionRate([])).not.toThrow()
})

test('getCompletionRate: all completed = 100%', () => {
  const actions = [makeAction('completed'), makeAction('completed')]
  expect(getCompletionRate(actions)).toBe(100)
})

test('getCompletionRate: 2 completed + 1 verified / 5 = 60%', () => {
  const actions = [
    makeAction('completed'),
    makeAction('completed'),
    makeAction('verified'),
    makeAction('open'),
    makeAction('in-progress'),
  ]
  expect(getCompletionRate(actions)).toBe(60)
})


test('getOpenCount: counts open and in-progress', () => {
  const actions = [makeAction('open'), makeAction('in-progress'), makeAction('completed')]
  expect(getOpenCount(actions)).toBe(2)
})

test('getCompletedCount: counts completed and verified', () => {
  const actions = [makeAction('completed'), makeAction('verified'), makeAction('open')]
  expect(getCompletedCount(actions)).toBe(2)
})

// ─────────────────────────────────────────────────────────────────────────────
// Sprint 3 additions — AS-1 through AS-VG-1
// ─────────────────────────────────────────────────────────────────────────────

// Sprint 3 makeActionItem factory
function makeActionItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    _id: 'ai-' + Math.random().toString(36).slice(2),
    title: 'Test action item',
    description: '',
    ownerId: 'user-1',
    sourceFeedbackId: '',
    sourceQuote: '',
    status: 'open',
    dueDate: '',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ── Service unit tests ────────────────────────────────────────────────────────

describe('getActionsByStatus', () => {
  test('AS-1: returns items in open → in-progress → completed → verified order', () => {
    const items = [
      makeActionItem({ status: 'verified',    createdAt: '2026-04-10T00:00:00.000Z' }),
      makeActionItem({ status: 'open',        createdAt: '2026-04-08T00:00:00.000Z' }),
      makeActionItem({ status: 'completed',   createdAt: '2026-04-09T00:00:00.000Z' }),
      makeActionItem({ status: 'in-progress', createdAt: '2026-04-07T00:00:00.000Z' }),
    ]
    const result = getActionsByStatus(items)
    expect(result[0].status).toBe('open')
    expect(result[1].status).toBe('in-progress')
    expect(result[2].status).toBe('completed')
    expect(result[3].status).toBe('verified')
  })

  test('AS-2: does not mutate the original array', () => {
    const items = [makeActionItem({ status: 'verified' }), makeActionItem({ status: 'open' })]
    const originalFirst = items[0].status
    const result = getActionsByStatus(items)
    expect(result).not.toBe(items)
    expect(items[0].status).toBe(originalFirst)
  })
})

describe('getCompletionRate Sprint 6 (completed+verified)', () => {
  test('AS-3: 2 verified + 1 completed out of 5 total = 60', () => {
    const items = [
      makeActionItem({ status: 'verified' }),
      makeActionItem({ status: 'verified' }),
      makeActionItem({ status: 'completed' }),
      makeActionItem({ status: 'in-progress' }),
      makeActionItem({ status: 'open' }),
    ]
    expect(getCompletionRate(items)).toBe(60)
  })
})

// ── API route tests ─────────────────────────────────────────────────────────

describe('GET /api/actions', () => {
  beforeEach(() => jest.clearAllMocks())

  test('AS-4: with sprintId returns 200 + array', async () => {
    mockFindAction.mockResolvedValue([
      makeActionItem({ status: 'open' }),
      makeActionItem({ status: 'in-progress' }),
    ])
    const req = new NextRequest('http://localhost/api/actions?sprintId=sprint-1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(2)
  })

  test('AS-5: no params returns 200 (all items)', async () => {
    mockFindAction.mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/actions')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})

describe('POST /api/actions', () => {
  beforeEach(() => jest.clearAllMocks())

  test('AS-6: valid payload returns 201', async () => {
    mockSaveAction.mockResolvedValue(undefined)
    const req = new NextRequest('http://localhost/api/actions', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Add automated test coverage',
        description: 'Cover all service functions',
        ownerId: 'user-1',
        dueDate: '2026-04-30',
        sourceFeedbackId: '',
        sourceQuote: '',
        sprintId: 'sprint-1',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(mockSaveAction).toHaveBeenCalledTimes(1)
  })

  test('AS-7: missing title returns 400', async () => {
    const req = new NextRequest('http://localhost/api/actions', {
      method: 'POST',
      body: JSON.stringify({ ownerId: 'user-1', sprintId: 'sprint-1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(mockSaveAction).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/actions/[id]/advance', () => {
  beforeEach(() => jest.clearAllMocks())

  test('AS-8: open → in-progress returns 200', async () => {
    const openItem = { ...makeActionItem({ status: 'open' }), save: mockSaveAction }
    mockFindByIdAction.mockResolvedValue(openItem)
    const req = new NextRequest('http://localhost/api/actions/ai-1/advance', { method: 'PATCH' })
    const res = await advancePATCH(req, { params: { id: 'ai-1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('in-progress')
    expect(mockSaveAction).toHaveBeenCalledTimes(1)
  })

  test('AS-9: in-progress → completed returns 200', async () => {
    const inProgressItem = { ...makeActionItem({ status: 'in-progress' }), save: mockSaveAction }
    mockFindByIdAction.mockResolvedValue(inProgressItem)
    const req = new NextRequest('http://localhost/api/actions/ai-1/advance', { method: 'PATCH' })
    const res = await advancePATCH(req, { params: { id: 'ai-1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('completed')
  })

  test('AS-10: completed → 409 (cannot advance further)', async () => {
    const completedItem = { ...makeActionItem({ status: 'completed' }), save: mockSaveAction }
    mockFindByIdAction.mockResolvedValue(completedItem)
    const req = new NextRequest('http://localhost/api/actions/ai-1/advance', { method: 'PATCH' })
    const res = await advancePATCH(req, { params: { id: 'ai-1' } })
    expect(res.status).toBe(409)
    expect(mockSaveAction).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/actions/[id]/verify', () => {
  beforeEach(() => jest.clearAllMocks())

  test('AS-11: completed + valid impactNote → 200 + verified', async () => {
    const completedItem = { ...makeActionItem({ status: 'completed' }), save: mockSaveAction }
    mockFindByIdAction.mockResolvedValue(completedItem)
    const req = new NextRequest('http://localhost/api/actions/ai-1/verify', {
      method: 'PATCH',
      body: JSON.stringify({ impactNote: 'Deployments now take 5 minutes instead of 45.' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await verifyPATCH(req, { params: { id: 'ai-1' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('verified')
    expect(body.impactNote).toBe('Deployments now take 5 minutes instead of 45.')
    expect(mockSaveAction).toHaveBeenCalledTimes(1)
  })

  test('AS-12: empty impactNote → 400', async () => {
    const completedItem = { ...makeActionItem({ status: 'completed' }), save: mockSaveAction }
    mockFindByIdAction.mockResolvedValue(completedItem)
    const req = new NextRequest('http://localhost/api/actions/ai-1/verify', {
      method: 'PATCH',
      body: JSON.stringify({ impactNote: '   ' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await verifyPATCH(req, { params: { id: 'ai-1' } })
    expect(res.status).toBe(400)
    expect(mockSaveAction).not.toHaveBeenCalled()
  })

  test('AS-13: status not completed → 409', async () => {
    const openItem = { ...makeActionItem({ status: 'open' }), save: mockSaveAction }
    mockFindByIdAction.mockResolvedValue(openItem)
    const req = new NextRequest('http://localhost/api/actions/ai-1/verify', {
      method: 'PATCH',
      body: JSON.stringify({ impactNote: 'Some impact.' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await verifyPATCH(req, { params: { id: 'ai-1' } })
    expect(res.status).toBe(409)
    expect(mockSaveAction).not.toHaveBeenCalled()
  })
})

describe('verifyImpact service (Verification Gate)', () => {
  test('AS-VG-1: throws before calling fetch when impactNote is empty', async () => {
    global.fetch = jest.fn()
    const call = verifyImpact('ai-1', '')
    await expect(call).rejects.toThrow()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
