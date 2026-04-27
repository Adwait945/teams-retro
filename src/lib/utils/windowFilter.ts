const VALID_WINDOWS = ['7d', '30d', 'all'] as const
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
  const days = window === '7d' ? 7 : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return { filter: { createdAt: { $gte: since } }, valid: true }
}
