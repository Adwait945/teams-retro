export type DashboardWindow = '7d' | '30d' | 'all'

export interface PriorPeriodBounds {
  since: Date
  until: Date
}

/**
 * Computes the prior-period date bounds used for Category Breakdown deltas.
 * - '7d'  -> [now-14d, now-7d)
 * - '30d' -> [now-60d, now-30d)
 * - 'all' -> null (no meaningful prior period, delta is not computed at all)
 */
export function getPriorPeriodBounds(window: DashboardWindow): PriorPeriodBounds | null {
  if (window === 'all') return null

  const days = window === '7d' ? 7 : 30
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  return {
    since: new Date(now - days * 2 * dayMs),
    until: new Date(now - days * dayMs),
  }
}

/**
 * Formats a delta display string for a Category Breakdown mini card.
 * - prior === null        -> '' (caller omits the element entirely, per AC-7.4.3)
 * - prior === 0 && current > 0  -> '+N ↑'
 * - prior === 0 && current === 0 -> '0'
 * - prior > 0              -> signed count, e.g. '+3' or '-2'
 */
export function formatCategoryDelta(current: number, prior: number | null): string {
  if (prior === null) return ''
  if (prior === 0) {
    return current > 0 ? `+${current} ↑` : '0'
  }
  const diff = current - prior
  return diff >= 0 ? `+${diff}` : `${diff}`
}

/**
 * Counts feedback items (of any shape with createdAt/category fields) that fall
 * within [since, until) for a given category.
 */
export function countInPriorPeriod<T extends { category: string; createdAt: string }>(
  items: T[],
  category: string,
  bounds: PriorPeriodBounds
): number {
  return items.filter((item) => {
    if (item.category !== category) return false
    const createdAt = new Date(item.createdAt).getTime()
    return createdAt >= bounds.since.getTime() && createdAt < bounds.until.getTime()
  }).length
}
