import { getCompletionRate, getOpenCount, getCompletedCount } from '@/services/actionService'
import type { ActionItem } from '@/types'

function makeAction(status: ActionItem['status']): ActionItem {
  return {
    _id: Math.random().toString(),
    title: 'Test',
    description: '',
    ownerId: 'u1',
    sourceFeedbackId: '',
    sourceQuote: '',
    sprintId: 's1',
    status,
    dueDate: '',
    createdAt: new Date().toISOString(),
  }
}

// DB-7 — getCompletionRate([]) returns 0 (no divide-by-zero)
test('DB-7: getCompletionRate([]) returns 0 and does not throw', () => {
  expect(getCompletionRate([])).toBe(0)
  expect(() => getCompletionRate([])).not.toThrow()
})

test('getCompletionRate: all completed = 100%', () => {
  const actions = [makeAction('completed'), makeAction('completed')]
  expect(getCompletionRate(actions)).toBe(100)
})

test('getCompletionRate: 2 completed + 1 verified / 5 = 60%', () => {
  const actions = [
    makeAction('completed'),
    makeAction('completed'),
    makeAction('verified'),
    makeAction('open'),
    makeAction('in-progress'),
  ]
  expect(getCompletionRate(actions)).toBe(60)
})

test('getOpenCount: counts open and in-progress', () => {
  const actions = [makeAction('open'), makeAction('in-progress'), makeAction('completed')]
  expect(getOpenCount(actions)).toBe(2)
})

test('getCompletedCount: counts completed and verified', () => {
  const actions = [makeAction('completed'), makeAction('verified'), makeAction('open')]
  expect(getCompletedCount(actions)).toBe(2)
})
