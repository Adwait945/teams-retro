/**
 * @jest-environment node
 */
// Sprint 7 — AC-7.1.8 — confirms existing getWindowFilter() is compatible with the
// '7d'|'30d'|'all' window param contract required by GET /api/points. This utility is
// reused, not modified (per docs/IMPLEMENTATION_PLAN.md Sprint 7 "Do-not-touch" list) —
// this test exists purely to lock in the contract Epic 7.1 depends on.

import { getWindowFilter } from '@/lib/utils/windowFilter'

test('T1-WINDOW-01: 7d and 30d return a createdAt.$gte filter', () => {
  const sevenDay = getWindowFilter('7d')
  expect(sevenDay.valid).toBe(true)
  if (sevenDay.valid) {
    expect(sevenDay.filter.createdAt).toBeDefined()
  }

  const thirtyDay = getWindowFilter('30d')
  expect(thirtyDay.valid).toBe(true)
  if (thirtyDay.valid) {
    expect(thirtyDay.filter.createdAt).toBeDefined()
  }
})

test('T1-WINDOW-01: all and null/undefined return an empty filter (valid)', () => {
  const all = getWindowFilter('all')
  expect(all.valid).toBe(true)
  if (all.valid) expect(all.filter).toEqual({})

  const nullWindow = getWindowFilter(null)
  expect(nullWindow.valid).toBe(true)
})

test('T1-WINDOW-01: invalid window value returns valid:false', () => {
  const bogus = getWindowFilter('bogus')
  expect(bogus.valid).toBe(false)
})
