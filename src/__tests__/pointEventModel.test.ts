/**
 * @jest-environment node
 */
// Sprint 7 — Epic 7.1 AC-7.1.1 — src/lib/models/PointEvent.ts Mongoose schema

import mongoose from 'mongoose'

// T1-PE-01: importing the model twice must not throw OverwriteModelError
test('T1-PE-01: PointEvent model guard pattern prevents OverwriteModelError', () => {
  jest.resetModules()
  expect(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@/lib/models/PointEvent')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@/lib/models/PointEvent')
  }).not.toThrow()
})

// T1-PE-02: schema field shape
test('T1-PE-02: PointEvent schema fields match the PointEvent TS interface exactly', () => {
  jest.resetModules()
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PointEventModel = require('@/lib/models/PointEvent').default

  const schema: mongoose.Schema = PointEventModel.schema

  const userId = schema.path('userId') as unknown as { isRequired: boolean }
  const podId = schema.path('podId') as unknown as { isRequired: boolean }
  const action = schema.path('action') as unknown as { isRequired: boolean; enumValues: string[] }
  const points = schema.path('points') as unknown as { isRequired: boolean; options: Record<string, unknown> }
  const relatedId = schema.path('relatedId') as unknown as { isRequired: boolean }
  const createdAt = schema.path('createdAt') as unknown as { defaultValue: unknown }

  expect(userId.isRequired).toBe(true)
  expect(podId.isRequired).toBe(true)
  expect(action.isRequired).toBe(true)
  expect(new Set(action.enumValues)).toEqual(
    new Set([
      'submit_feedback',
      'receive_upvote',
      'remove_upvote',
      'convert_action',
      'complete_action',
      'verify_action',
    ])
  )
  expect(points.isRequired).toBe(true)
  expect(points.options?.min).toBeUndefined()
  expect(relatedId.isRequired).toBeFalsy()
  expect(typeof createdAt.defaultValue).toBe('function')
})
