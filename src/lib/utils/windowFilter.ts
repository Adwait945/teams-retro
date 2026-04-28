const VALID_WINDOWS = ['7d', '30d', 'all', 'prior7d', 'prior30d'] as const
type WindowParam = typeof VALID_WINDOWS[number]

export function getWindowFilter(
  window: string | null | undefined
): { filter: Record<string, unknown>; valid: true } | { valid: false } {
  if (!window || window === 'all') {
    return { filter: {}, valid: true }
  }
  if (!VALID_WINDOWS.includes(window as WindowParam)) {
    return { valid: false }
  }
  if (window === 'prior7d') {
    const from = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const to = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return { filter: { createdAt: { $gte: from, $lt: to } }, valid: true }
  }
  if (window === 'prior30d') {
    const from = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const to = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return { filter: { createdAt: { $gte: from, $lt: to } }, valid: true }
  }
  const days = window === '7d' ? 7 : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return { filter: { createdAt: { $gte: since } }, valid: true }
}
