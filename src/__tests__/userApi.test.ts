/**
 * @jest-environment node
 */

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/models/User', () => {
  const mockSaveInner = jest.fn().mockResolvedValue(undefined)
  const mockFindInner = jest.fn()
  const mockCountInner = jest.fn()
  function MockUserModel(this: any, data: any) {
    Object.assign(this, data)
    this._id = 'mock-id-123'
    this.save = mockSaveInner
  }
  Object.assign(MockUserModel, {
    find: (...args: any[]) => ({ lean: () => mockFindInner(...args) }),
    countDocuments: mockCountInner,
    __mockSave: mockSaveInner,
    __mockFind: mockFindInner,
    __mockCount: mockCountInner,
  })
  return { __esModule: true, default: MockUserModel }
})

import { GET, POST } from '@/app/api/users/route'

const { default: UserModel } = jest.requireMock('@/lib/models/User')
const mockSave: jest.Mock = UserModel.__mockSave
const mockFind: jest.Mock = UserModel.__mockFind
const mockCount: jest.Mock = UserModel.__mockCount

function makePOST(body: object) {
  return { json: async () => body } as any
}

beforeEach(() => {
  mockSave.mockReset().mockResolvedValue(undefined)
  mockFind.mockReset()
  mockCount.mockReset()
})

// UA-1 — GET /api/users returns 200 with array
test('UA-1: GET /api/users returns 200 with JSON array', async () => {
  mockFind.mockResolvedValue([
    { _id: 'u1', name: 'Alice', username: 'alice', pod: 'pod1', isAdmin: true },
    { _id: 'u2', name: 'Bob',   username: 'bob',   pod: 'pod2', isAdmin: false },
  ])

  const res = await GET()
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(Array.isArray(body)).toBe(true)
  expect(body.length).toBe(2)
})

// UA-2 — POST /api/users with valid body returns 201
test('UA-2: POST /api/users with valid body returns 201 and document', async () => {
  mockCount.mockResolvedValue(1)
  const req = makePOST({ name: 'Alice', username: 'alice', pod: 'pod1' })
  const res = await POST(req)
  expect(res.status).toBe(201)
  const body = await res.json()
  expect(body.name).toBe('Alice')
  expect(body.username).toBe('alice')
  expect(body.pod).toBe('pod1')
  expect(mockSave).toHaveBeenCalledTimes(1)
})

// UA-3 — First POST sets isAdmin: true
test('UA-3: First POST sets isAdmin: true when collection is empty', async () => {
  mockCount.mockResolvedValue(0)
  const req = makePOST({ name: 'Alice', username: 'alice', pod: 'pod1' })
  const res = await POST(req)
  expect(res.status).toBe(201)
  const body = await res.json()
  expect(body.isAdmin).toBe(true)
})

// UA-4 — Second POST sets isAdmin: false
test('UA-4: Second POST sets isAdmin: false when users exist', async () => {
  mockCount.mockResolvedValue(1)
  const req = makePOST({ name: 'Bob', username: 'bob', pod: 'pod2' })
  const res = await POST(req)
  expect(res.status).toBe(201)
  const body = await res.json()
  expect(body.isAdmin).toBe(false)
})

// UA-5 — POST missing name → 400
test('UA-5: POST /api/users missing name returns 400', async () => {
  const req = makePOST({ username: 'alice', pod: 'pod1' })
  const res = await POST(req)
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(typeof body.error).toBe('string')
  expect(body.error.length).toBeGreaterThan(0)
})

// UA-6 — POST missing username → 400
test('UA-6: POST /api/users missing username returns 400', async () => {
  const req = makePOST({ name: 'Alice', pod: 'pod1' })
  const res = await POST(req)
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(typeof body.error).toBe('string')
  expect(body.error.length).toBeGreaterThan(0)
})
