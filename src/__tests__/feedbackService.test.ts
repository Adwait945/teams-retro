/**
 * @jest-environment node
 */

import { sortByUpvotes, getAuthorDisplay } from '@/services/feedbackService'
import type { FeedbackItem } from '@/types'

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}))

const mockSave = jest.fn().mockResolvedValue(undefined)
const mockFind = jest.fn()

jest.mock('@/lib/models/FeedbackItem', () => {
  function MockFeedbackItemModel(this: Record<string, unknown>, data: Record<string, unknown>) {
    Object.assign(this, data)
    this._id = 'mock-fb-id'
    this.save = mockSave
  }
  Object.assign(MockFeedbackItemModel, {
    find: (...args: unknown[]) => ({ lean: () => mockFind(...args) }),
  })
  return { __esModule: true, default: MockFeedbackItemModel }
})

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/feedback/route'

function makeFeedbackItem(overrides: Partial<FeedbackItem> = {}): FeedbackItem {
  return {
    _id: 'fb-' + Math.random().toString(36).slice(2),
    category: 'went-well',
    content: 'Test content',
    suggestion: '',
    authorId: 'user-1',
    isAnonymous: false,
    actionItemIds: [],
    upvotedBy: [],
    upvotes: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────
// Pure unit tests — no mocks needed
// ──────────────────────────────────────────────────────────────

describe('sortByUpvotes', () => {
  it('FS-1: returns array sorted by upvotes descending', () => {
    const items = [
      makeFeedbackItem({ upvotes: 3 }),
      makeFeedbackItem({ upvotes: 8 }),
      makeFeedbackItem({ upvotes: 1 }),
    ]
    const result = sortByUpvotes(items)
    expect(result[0].upvotes).toBe(8)
    expect(result[1].upvotes).toBe(3)
    expect(result[2].upvotes).toBe(1)
  })

  it('FS-2: does not mutate the original array', () => {
    const items = [
      makeFeedbackItem({ upvotes: 3 }),
      makeFeedbackItem({ upvotes: 8 }),
      makeFeedbackItem({ upvotes: 1 }),
    ]
    const originalFirst = items[0].upvotes
    const result = sortByUpvotes(items)
    expect(result).not.toBe(items)
    expect(items[0].upvotes).toBe(originalFirst)
  })
})

describe('getAuthorDisplay', () => {
  it('FS-3: returns "Anonymous" when isAnonymous is true', () => {
    const item = makeFeedbackItem({ isAnonymous: true })
    expect(getAuthorDisplay(item, 'Jane')).toBe('Anonymous')
  })

  it('FS-4: returns the author name when isAnonymous is false', () => {
    const item = makeFeedbackItem({ isAnonymous: false })
    expect(getAuthorDisplay(item, 'Jane')).toBe('Jane')
  })
})

// ──────────────────────────────────────────────────────────────
// API route tests
// ──────────────────────────────────────────────────────────────

describe('GET /api/feedback', () => {
  it('FS-5: returns 200 + array for category filter', async () => {
    mockFind.mockResolvedValue([
      makeFeedbackItem({ category: 'went-well' }),
      makeFeedbackItem({ category: 'went-well', upvotes: 5 }),
    ])
    const req = new NextRequest('http://localhost/api/feedback?category=went-well')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(2)
  })
})

describe('POST /api/feedback', () => {
  it('FS-6: returns 201 for valid went-well payload with empty suggestion', async () => {
    mockSave.mockResolvedValue(undefined)
    const req = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        category: 'went-well',
        content: 'Great sprint!',
        suggestion: '',
        isAnonymous: false,
        authorId: 'user-1',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(mockSave).toHaveBeenCalledTimes(1)
  })

  it('FS-7: returns 422 for slowed-us-down with empty suggestion (Reframe Rule)', async () => {
    const req = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        category: 'slowed-us-down',
        content: 'Auth service crashed staging.',
        suggestion: '',
        isAnonymous: false,
        authorId: 'user-1',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(typeof body.error).toBe('string')
    expect(body.error.toLowerCase()).toContain('reframe rule')
    expect(body.error.toLowerCase()).toContain('suggestion')
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('FS-8: returns 201 for slowed-us-down with non-empty suggestion', async () => {
    mockSave.mockResolvedValue(undefined)
    const req = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({
        category: 'slowed-us-down',
        content: 'Auth service crashed staging.',
        suggestion: 'Roll back to v1.8 until memory leak is patched.',
        isAnonymous: false,
        authorId: 'user-1',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(mockSave).toHaveBeenCalledTimes(1)
  })
})
