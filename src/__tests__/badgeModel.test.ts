/**
 * @jest-environment node
 */
// Sprint 7 — Epic 7.2 AC-7.2.1/2/3 — src/lib/models/Badge.ts Mongoose schema + unique indexes

import mongoose from 'mongoose'

test('T1-BADGE-01: Badge schema fields match the Badge TS interface exactly', () => {
  jest.resetModules()
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const BadgeModel = require('@/lib/models/Badge').default
  const schema: mongoose.Schema = BadgeModel.schema

  const userId = schema.path('userId') as unknown as { isRequired: boolean }
  const podId = schema.path('podId') as unknown as { isRequired: boolean }
  const type = schema.path('type') as unknown as { isRequired: boolean; enumValues: string[] }
  const earnedAt = schema.path('earnedAt') as unknown as { defaultValue: unknown }

  expect(userId.isRequired).toBe(true)
  expect(podId.isRequired).toBe(true)
  expect(type.isRequired).toBe(true)
  expect(new Set(type.enumValues)).toEqual(
    new Set([
      'feedback_machine',
      'action_taker',
      'innovator',
      'problem_solver',
      'consensus_builder',
      'pod_champion',
    ])
  )
  expect(typeof earnedAt.defaultValue).toBe('function')
})

test('T1-BADGE-02: Badge schema declares the two required partial-unique indexes', () => {
  jest.resetModules()
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const BadgeModel = require('@/lib/models/Badge').default
  const schema: mongoose.Schema = BadgeModel.schema
  const indexes = schema.indexes()

  const permanentIndex = indexes.find(
    ([fields]) => fields.userId === 1 && fields.type === 1 && fields.podId === 1
  )
  const podChampionIndex = indexes.find(
    ([fields, opts]) =>
      fields.type === 1 &&
      fields.podId === 1 &&
      Object.keys(fields).length === 2 &&
      (opts as Record<string, unknown>)?.partialFilterExpression
  )

  expect(permanentIndex).toBeTruthy()
  expect(permanentIndex?.[1]).toMatchObject({
    unique: true,
    partialFilterExpression: { type: { $ne: 'pod_champion' } },
  })

  expect(podChampionIndex).toBeTruthy()
  expect(podChampionIndex?.[1]).toMatchObject({
    unique: true,
    partialFilterExpression: { type: 'pod_champion' },
  })
})
