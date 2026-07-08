/**
 * Sprint 7 — Type System Changes
 * Tier 1 Unit tests for src/types/index.ts rewrite.
 * AC-TYPES-1 through AC-TYPES-8 (AC-TYPES-9/10 are whole-file/whole-sprint gates, not
 * Jest-expressible — see docs/TEST_SPEC.md Gap Analysis).
 */
import fs from 'fs'
import path from 'path'
import type { PointAction, PointEvent, BadgeType, Badge, User } from '@/types'
import { POINT_VALUES, BADGE_DEFINITIONS } from '@/types'

const TYPES_FILE = path.join(process.cwd(), 'src/types/index.ts')

// T1-TYPES-01
test('T1-TYPES-01: PointAction is exactly the 6-member underscored union', () => {
  const expected: PointAction[] = [
    'submit_feedback',
    'receive_upvote',
    'remove_upvote',
    'convert_action',
    'complete_action',
    'verify_action',
  ]
  expect(Object.keys(POINT_VALUES).length).toBe(6)
  expect(new Set(Object.keys(POINT_VALUES))).toEqual(new Set(expected))
  for (const key of Object.keys(POINT_VALUES)) {
    expect(key).not.toMatch(/-/)
  }
})

// T1-TYPES-02
test('T1-TYPES-02: POINT_VALUES has exact signed point amounts', () => {
  expect(POINT_VALUES.submit_feedback).toBe(10)
  expect(POINT_VALUES.receive_upvote).toBe(5)
  expect(POINT_VALUES.remove_upvote).toBe(-5)
  expect(POINT_VALUES.convert_action).toBe(50)
  expect(POINT_VALUES.complete_action).toBe(100)
  expect(POINT_VALUES.verify_action).toBe(150)
})

// T1-TYPES-03
test('T1-TYPES-03: BADGE_DEFINITIONS has exactly 6 keys matching BadgeType', () => {
  const expected: BadgeType[] = [
    'feedback_machine',
    'action_taker',
    'innovator',
    'problem_solver',
    'consensus_builder',
    'pod_champion',
  ]
  expect(Object.keys(BADGE_DEFINITIONS).length).toBe(6)
  expect(new Set(Object.keys(BADGE_DEFINITIONS))).toEqual(new Set(expected))
})

// T1-TYPES-04
test('T1-TYPES-04: pod_champion is the only living badge, all others permanent', () => {
  for (const [type, def] of Object.entries(BADGE_DEFINITIONS)) {
    if (type === 'pod_champion') {
      expect(def.kind).toBe('living')
    } else {
      expect(def.kind).toBe('permanent')
    }
  }
})

// T1-TYPES-05
test('T1-TYPES-05: old stub identifiers are fully removed from src/types/index.ts', () => {
  const text = fs.readFileSync(TYPES_FILE, 'utf8')
  const pattern = /threshold: number|submit-feedback|feedback-upvoted|create-action-item|complete-action-item|verify-improvement|badges: Badge\[\]/
  expect(pattern.test(text)).toBe(false)
})

// T1-TYPES-06
test('T1-TYPES-06: PointEvent interface has exactly the new field set', () => {
  const event: PointEvent = {
    _id: 'pe-1',
    userId: 'u1',
    podId: 'pod1',
    action: 'submit_feedback',
    points: 10,
    relatedId: 'fb-1',
    createdAt: new Date().toISOString(),
  }
  expect(Object.keys(event).sort()).toEqual(
    ['_id', 'userId', 'podId', 'action', 'points', 'relatedId', 'createdAt'].sort()
  )
  // @ts-expect-error - description no longer exists on PointEvent
  expect(event.description).toBeUndefined()
})

// T1-TYPES-07
test('T1-TYPES-07: Badge interface has exactly the new field set', () => {
  const badge: Badge = {
    _id: 'b1',
    userId: 'u1',
    podId: 'pod1',
    type: 'feedback_machine',
    earnedAt: new Date().toISOString(),
  }
  expect(Object.keys(badge).sort()).toEqual(
    ['_id', 'userId', 'podId', 'type', 'earnedAt'].sort()
  )
})

// T1-TYPES-08
test('T1-TYPES-08: User interface has no badges field, totalPoints remains required number', () => {
  const user: User = {
    _id: 'u1',
    name: 'Alice',
    username: 'alice',
    avatar: '',
    pod: 'pod1',
    isAdmin: false,
    totalPoints: 42,
    createdAt: new Date().toISOString(),
  }
  expect('badges' in user).toBe(false)
  expect(typeof user.totalPoints).toBe('number')
})
