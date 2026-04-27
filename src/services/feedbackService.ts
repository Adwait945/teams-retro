import type { FeedbackItem, FeedbackCategory } from '@/types'

export async function getFeedbackByWindow(window: string = '7d'): Promise<FeedbackItem[]> {
  const res = await fetch(`/api/feedback?window=${window}`)
  if (!res.ok) throw new Error('Failed to fetch feedback')
  return res.json()
}

export async function getFeedbackByWindowAndLane(
  window: string,
  category: FeedbackCategory
): Promise<FeedbackItem[]> {
  const res = await fetch(`/api/feedback?window=${window}&category=${category}`)
  if (!res.ok) throw new Error(`Failed to fetch feedback for lane: ${category}`)
  return res.json()
}

export function sortByUpvotes(items: FeedbackItem[]): FeedbackItem[] {
  return [...items].sort((a, b) => b.upvotes - a.upvotes)
}

export function getAuthorDisplay(item: FeedbackItem, authorName?: string): string {
  if (item.isAnonymous) return 'Anonymous'
  return authorName ?? 'Unknown'
}

export async function addFeedback(payload: {
  category: FeedbackCategory
  content: string
  suggestion: string
  isAnonymous: boolean
  authorId?: string
}): Promise<FeedbackItem> {
  if (payload.category === 'slowed-us-down' && !payload.suggestion?.trim()) {
    throw new Error('Reframe Rule: suggestion is required for slowed-us-down feedback')
  }
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (res.status === 422) {
    const err = await res.json()
    throw new Error(err.error ?? 'Reframe Rule violation')
  }
  if (!res.ok) throw new Error('Failed to submit feedback')
  return res.json()
}

export async function upvoteFeedback(itemId: string, userId: string): Promise<{ upvotes: number; upvotedBy: string[]; toggled: boolean }> {
  const res = await fetch(`/api/feedback/${itemId}/upvote`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Upvote failed')
  }
  return res.json()
}
