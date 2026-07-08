/**
 * @jest-environment node
 */
// Sprint 7 — Epic 7.1 AC-7.1.8/7.1.9 + Tier 3 contract — GET /api/points

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }))

jest.mock('@/lib/pointsEngine', () => ({
  getPodLeaderboard: jest.fn(),
  recordPointEvent: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/points/route'
import { getPodLeaderboard } from '@/lib/pointsEngine'

const mockGetPodLeaderboard = getPodLeaderboard as jest.Mock

beforeEach(() => jest.clearAllMocks())

// T2-POINTS-01 / T3-POINTS-01
test('T2-POINTS-01: GET /api/points returns 200 with sorted desc rows', async () => {
  mockGetPodLeaderboard.mockResolvedValue([
    { userId: 'u1', name: 'Alice', avatar: '', windowPoints: 50, allTimePoints: 120 },
    { userId: 'u2', name: 'Bob', avatar: '', windowPoints: 30, allTimePoints: 30 },
    { userId: 'u3', name: 'Carol', avatar: '', windowPoints: 10, allTimePoints: 500 },
  ])
  const req = new NextRequest('http://localhost/api/points?pod=PodA&window=7d')
  const res = await GET(req)
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(Array.isArray(body)).toBe(true)
  expect(body.map((r: { windowPoints: number }) => r.windowPoints)).toEqual([50, 30, 10])
})

// T3-POINTS-01 contract shape
test('T3-POINTS-01: each row has exactly the contract keys with correct types', async () => {
  mockGetPodLeaderboard.mockResolvedValue([
    { userId: 'u1', name: 'Alice', avatar: 'a.png', windowPoints: 50, allTimePoints: 120 },
  ])
  const req = new NextRequest('http://localhost/api/points?pod=PodA&window=7d')
  const res = await GET(req)
  const body = await res.json()
  expect(Object.keys(body[0]).sort()).toEqual(
    ['userId', 'name', 'avatar', 'windowPoints', 'allTimePoints'].sort()
  )
  expect(typeof body[0].userId).toBe('string')
  expect(typeof body[0].name).toBe('string')
  expect(typeof body[0].avatar).toBe('string')
  expect(typeof body[0].windowPoints).toBe('number')
  expect(typeof body[0].allTimePoints).toBe('number')
})

// T2-POINTS-02 / T3-POINTS-02
test('T2-POINTS-02: GET /api/points missing pod returns 400', async () => {
  const req = new NextRequest('http://localhost/api/points?window=7d')
  const res = await GET(req)
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(typeof body.error).toBe('string')
})

// T2-POINTS-03 / T3-POINTS-02
test('T2-POINTS-03: GET /api/points invalid window returns 400', async () => {
  const req = new NextRequest('http://localhost/api/points?pod=PodA&window=bogus')
  const res = await GET(req)
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(typeof body.error).toBe('string')
})

// T2-POINTS-03b missing window entirely (ARCHITECT recommends requiring it explicitly)
test('T2-POINTS-03: GET /api/points missing window returns 400', async () => {
  const req = new NextRequest('http://localhost/api/points?pod=PodA')
  const res = await GET(req)
  expect(res.status).toBe(400)
})

// T2-POINTS-04
test('T2-POINTS-04: route passes engine output through unmodified, negative events netted', async () => {
  mockGetPodLeaderboard.mockResolvedValue([
    { userId: 'u1', name: 'Alice', avatar: '', windowPoints: 10, allTimePoints: 10 },
  ])
  const req = new NextRequest('http://localhost/api/points?pod=PodA&window=all')
  const res = await GET(req)
  const body = await res.json()
  expect(body[0].windowPoints).toBe(10)
  expect(mockGetPodLeaderboard).toHaveBeenCalledWith('PodA', 'all')
})
