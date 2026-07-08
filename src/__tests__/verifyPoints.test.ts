/**
 * @jest-environment node
 */
// Sprint 7 — Epic 7.1 AC-7.1.7 — PATCH /api/actions/[id]/verify — BREAKING CHANGE:
// now requires { impactNote, userId } instead of just { impactNote }.

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }))

jest.mock('@/lib/models/ActionItem', () => {
  const mockSave = jest.fn().mockResolvedValue(undefined)
  const mockFindById = jest.fn()
  return {
    __esModule: true,
    default: {
      findById: (...args: unknown[]) => mockFindById(...args),
      __mockSave: mockSave,
      __mockFindById: mockFindById,
    },
  }
})

jest.mock('@/lib/pointsEngine', () => ({
  recordPointEvent: jest.fn(),
  getPodLeaderboard: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/actions/[id]/verify/route'
import { recordPointEvent } from '@/lib/pointsEngine'

const ActionItemMock = jest.requireMock('@/lib/models/ActionItem').default as {
  __mockSave: jest.Mock
  __mockFindById: jest.Mock
}
const mockRecordPointEvent = recordPointEvent as jest.Mock

function makeCompletedItem() {
  return {
    _id: 'ai-1',
    ownerId: 'owner-1',
    status: 'completed',
    save: ActionItemMock.__mockSave,
  }
}

function makeReq(body: object) {
  return new NextRequest('http://localhost/api/actions/ai-1/verify', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => jest.clearAllMocks())

// T2-VERIFY-01 / T3-VERIFY-01
test('T2-VERIFY-01: valid {impactNote,userId} verifies and credits the verifier, not item.ownerId', async () => {
  ActionItemMock.__mockFindById.mockResolvedValue(makeCompletedItem())

  const res = await PATCH(
    makeReq({ impactNote: 'Deploys now take 5 minutes.', userId: 'verifier-1' }),
    { params: { id: 'ai-1' } }
  )
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('verified')

  expect(mockRecordPointEvent).toHaveBeenCalledTimes(1)
  const call = mockRecordPointEvent.mock.calls[0][0]
  expect(call.userId).toBe('verifier-1')
  expect(call.userId).not.toBe('owner-1')
  expect(call.action).toBe('verify_action')
})

// T2-VERIFY-02 — the breaking-change guard
test('T2-VERIFY-02: missing userId (old {impactNote}-only shape) returns 400, no save, no point event', async () => {
  ActionItemMock.__mockFindById.mockResolvedValue(makeCompletedItem())

  const res = await PATCH(makeReq({ impactNote: 'Deploys now take 5 minutes.' }), {
    params: { id: 'ai-1' },
  })
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(body.error.toLowerCase()).toContain('userid')
  expect(ActionItemMock.__mockSave).not.toHaveBeenCalled()
  expect(mockRecordPointEvent).not.toHaveBeenCalled()
})
