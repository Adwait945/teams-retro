/**
 * @jest-environment node
 */
// Sprint 7 — Epic 7.2 AC-7.2.11/12 + Tier 3 contract — GET /api/badges

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }))

jest.mock('@/lib/models/Badge', () => {
  const mockFind = jest.fn()
  return {
    __esModule: true,
    default: {
      find: (...args: unknown[]) => ({ lean: () => mockFind(...args) }),
      __mockFind: mockFind,
    },
  }
})

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/badges/route'

const BadgeMock = jest.requireMock('@/lib/models/Badge').default as { __mockFind: jest.Mock }

beforeEach(() => jest.clearAllMocks())

// T2-BADGES-01
test('T2-BADGES-01: GET /api/badges?userId=X returns 200 + array for that user', async () => {
  BadgeMock.__mockFind.mockResolvedValue([
    { _id: 'b1', userId: 'u1', podId: 'pod1', type: 'feedback_machine', earnedAt: new Date().toISOString() },
    { _id: 'b2', userId: 'u1', podId: 'pod1', type: 'consensus_builder', earnedAt: new Date().toISOString() },
  ])
  const req = new NextRequest('http://localhost/api/badges?userId=u1')
  const res = await GET(req)
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(Array.isArray(body)).toBe(true)
  expect(body.length).toBe(2)
})

// T2-BADGES-02
test('T2-BADGES-02: GET /api/badges?podId=X returns badges across multiple users in one call', async () => {
  BadgeMock.__mockFind.mockResolvedValue([
    { _id: 'b1', userId: 'u1', podId: 'podA', type: 'feedback_machine', earnedAt: new Date().toISOString() },
    { _id: 'b2', userId: 'u2', podId: 'podA', type: 'action_taker', earnedAt: new Date().toISOString() },
    { _id: 'b3', userId: 'u3', podId: 'podA', type: 'innovator', earnedAt: new Date().toISOString() },
  ])
  const req = new NextRequest('http://localhost/api/badges?podId=podA')
  const res = await GET(req)
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.length).toBe(3)
  const distinctUsers = new Set(body.map((b: { userId: string }) => b.userId))
  expect(distinctUsers.size).toBe(3)
})

// T2-BADGES-03
test('T2-BADGES-03: GET /api/badges with neither userId nor podId returns 400', async () => {
  const req = new NextRequest('http://localhost/api/badges')
  const res = await GET(req)
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(typeof body.error).toBe('string')
})

// T3-BADGES-01 / T3-BADGES-02 contract shape
test('T3-BADGES-01: badge objects have exactly the contract keys, _id normalized to string', async () => {
  BadgeMock.__mockFind.mockResolvedValue([
    { _id: 'b1', userId: 'u1', podId: 'pod1', type: 'feedback_machine', earnedAt: new Date().toISOString() },
  ])
  const req = new NextRequest('http://localhost/api/badges?userId=u1')
  const res = await GET(req)
  const body = await res.json()
  expect(Object.keys(body[0]).sort()).toEqual(['_id', 'userId', 'podId', 'type', 'earnedAt'].sort())
  expect(typeof body[0]._id).toBe('string')
})
