/**
 * @jest-environment node
 */
// Sprint 7 — Epic 7.1 AC-7.1.10 — PATCH /api/actions/[id]/regress must never write a
// PointEvent (no clawback of previously-earned complete_action/verify_action points).
// Per docs/IMPLEMENTATION_PLAN.md, this route is NOT modified this sprint — this test
// locks in that guarantee.

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
import { PATCH } from '@/app/api/actions/[id]/regress/route'
import { recordPointEvent } from '@/lib/pointsEngine'

const ActionItemMock = jest.requireMock('@/lib/models/ActionItem').default as {
  __mockSave: jest.Mock
  __mockFindById: jest.Mock
}
const mockRecordPointEvent = recordPointEvent as jest.Mock

beforeEach(() => jest.clearAllMocks())

// T2-REGRESS-01
test('T2-REGRESS-01: completed -> in-progress regress fires zero PointEvent writes', async () => {
  const item = { _id: 'ai-1', ownerId: 'owner-1', status: 'completed', save: ActionItemMock.__mockSave }
  ActionItemMock.__mockFindById.mockResolvedValue(item)

  const req = new NextRequest('http://localhost/api/actions/ai-1/regress', { method: 'PATCH' })
  const res = await PATCH(req, { params: { id: 'ai-1' } })
  expect(res.status).toBe(200)
  expect(mockRecordPointEvent).not.toHaveBeenCalled()
})
