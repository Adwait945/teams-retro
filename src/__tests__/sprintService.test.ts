// @jest-environment node
import { NextRequest } from 'next/server'

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}))

const mockSave = jest.fn().mockResolvedValue(undefined)
const mockFindOne = jest.fn()
const mockFindById = jest.fn()

jest.mock('@/lib/models/Sprint', () => {
  function MockSprintModel(this: Record<string, unknown>, data: Record<string, unknown>) {
    Object.assign(this, data)
    this._id = 'sprint-1'
    this.save = mockSave
  }
  MockSprintModel.findOne = (...args: unknown[]) => mockFindOne(...args)
  MockSprintModel.findById = (...args: unknown[]) => mockFindById(...args)
  return { __esModule: true, default: MockSprintModel }
})

import {
  getActiveSprint,
  createSprint,
  updateSprint,
  openRetro,
  closeRetro,
} from '@/services/sprintService'
import { PATCH as patchSprint } from '@/app/api/sprints/[id]/route'
import { PATCH as patchStatus } from '@/app/api/sprints/[id]/status/route'

const mockSprint = {
  _id: 'sprint-1',
  name: 'Sprint 42',
  goal: 'Ship it',
  status: 'open',
  startDate: '2026-04-01T00:00:00.000Z',
  endDate: '2026-04-14T00:00:00.000Z',
  teamMemberIds: [],
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
})

// ─── SS-1: getActiveSprint() — returns Sprint when fetch returns object ───────

it('SS-1: getActiveSprint() returns Sprint when response is an object', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => mockSprint,
  })
  const result = await getActiveSprint()
  expect(result).toEqual(mockSprint)
})

// ─── SS-2: getActiveSprint() — returns null when fetch returns [] ─────────────

it('SS-2: getActiveSprint() returns null when response is an array', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [],
  })
  const result = await getActiveSprint()
  expect(result).toBeNull()
})

// ─── SS-3: createSprint() — 201 → returns Sprint ─────────────────────────────

it('SS-3: createSprint() returns new Sprint on 201', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({ ...mockSprint, name: 'New Sprint' }),
  })
  const result = await createSprint({
    name: 'New Sprint',
    startDate: '2026-04-01',
    endDate: '2026-04-14',
  })
  expect(result.name).toBe('New Sprint')
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/sprints',
    expect.objectContaining({ method: 'POST' })
  )
})

// ─── SS-4: updateSprint() — 200 → returns updated Sprint ─────────────────────

it('SS-4: updateSprint() returns updated Sprint on 200', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ...mockSprint, name: 'Updated Sprint' }),
  })
  const result = await updateSprint('sprint-1', { name: 'Updated Sprint' })
  expect(result.name).toBe('Updated Sprint')
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/sprints/sprint-1',
    expect.objectContaining({ method: 'PATCH' })
  )
})

// ─── SS-5: openRetro() — PATCHes /status with { status: 'open' } ─────────────

it('SS-5: openRetro() sends PATCH /status with { status: "open" } and returns Sprint', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ...mockSprint, status: 'open' }),
  })
  const result = await openRetro('sprint-1')
  expect(result.status).toBe('open')
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/sprints/sprint-1/status',
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'open' }),
    })
  )
})

// ─── SS-6: closeRetro() — PATCHes /status with { status: 'closed' } ──────────

it('SS-6: closeRetro() sends PATCH /status with { status: "closed" } and returns Sprint', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ...mockSprint, status: 'closed' }),
  })
  const result = await closeRetro('sprint-1')
  expect(result.status).toBe('closed')
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/sprints/sprint-1/status',
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'closed' }),
    })
  )
})

// ─── SS-7: PATCH /api/sprints/[id] — 404 when sprint not found ───────────────

it('SS-7: PATCH /api/sprints/[id] returns 404 when sprint not found', async () => {
  mockFindById.mockResolvedValue(null)
  const req = new NextRequest('http://localhost/api/sprints/bad-id', {
    method: 'PATCH',
    body: JSON.stringify({ name: 'Updated' }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await patchSprint(req, { params: { id: 'bad-id' } })
  expect(res.status).toBe(404)
  const body = await res.json()
  expect(body.error).toMatch(/not found/i)
})

// ─── SS-8: PATCH /api/sprints/[id]/status — 400 when status is invalid ────────

it('SS-8: PATCH /api/sprints/[id]/status returns 400 when status is invalid enum value', async () => {
  const req = new NextRequest('http://localhost/api/sprints/sprint-1/status', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'archived' }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await patchStatus(req, { params: { id: 'sprint-1' } })
  expect(res.status).toBe(400)
  const body = await res.json()
  expect(body.error).toContain("'open' or 'closed'")
})
