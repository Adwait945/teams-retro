/**
 * @jest-environment node
 */
// Sprint 7 — ADR-0006 bug fix — GET /api/users?pod=X currently ignores the pod query
// param (confirmed by ARCHITECT). This test asserts it is honored, since the
// Leaderboard/pointsEngine.getPodLeaderboard depends on it. Expected to FAIL against
// current pre-Sprint-7 code (correct/expected for ATDD).

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }))

jest.mock('@/lib/models/User', () => {
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
import { GET } from '@/app/api/users/route'

const UserMock = jest.requireMock('@/lib/models/User').default as { __mockFind: jest.Mock }

beforeEach(() => jest.clearAllMocks())

// T2-USERS-01 / T3-USERS-01
test('T2-USERS-01: GET /api/users?pod=PodA filters the User.find query by pod', async () => {
  UserMock.__mockFind.mockResolvedValue([
    { _id: 'u1', name: 'Alice', username: 'alice', pod: 'PodA', isAdmin: true },
  ])
  const req = new NextRequest('http://localhost/api/users?pod=PodA')
  const res = await GET(req)
  expect(res.status).toBe(200)

  expect(UserMock.__mockFind).toHaveBeenCalledWith({ pod: 'PodA' })
  const body = await res.json()
  expect(Array.isArray(body)).toBe(true)
  expect(body.every((u: { pod: string }) => u.pod === 'PodA')).toBe(true)
})

test('T2-USERS-01b: GET /api/users without pod param still returns all users (unchanged)', async () => {
  UserMock.__mockFind.mockResolvedValue([
    { _id: 'u1', name: 'Alice', username: 'alice', pod: 'PodA', isAdmin: true },
    { _id: 'u2', name: 'Bob', username: 'bob', pod: 'PodB', isAdmin: false },
  ])
  const req = new NextRequest('http://localhost/api/users')
  const res = await GET(req)
  expect(res.status).toBe(200)
  expect(UserMock.__mockFind).toHaveBeenCalledWith({})
})
