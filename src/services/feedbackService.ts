import type { FeedbackItem, FeedbackCategory } from '@/types'

export async function getFeedback(sprintId?: string): Promise<FeedbackItem[]> {
  let resolvedSprintId = sprintId
  if (!resolvedSprintId) {
    const res = await fetch('/api/sprints')
    if (!res.ok) throw new Error('Failed to fetch active sprint')
    const sprint = await res.json()
    resolvedSprintId = sprint?._id
    if (!resolvedSprintId) return []
  }
  const res = await fetch(`/api/feedback?sprintId=${resolvedSprintId}`)
  if (!res.ok) throw new Error('Failed to fetch feedback')
  return res.json()
}

export async function getFeedbackByLane(
  sprintId: string,
  category: FeedbackCategory
): Promise<FeedbackItem[]> {
  const res = await fetch(`/api/feedback?sprintId=${sprintId}&category=${category}`)
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
  sprintId: string
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

export async function upvoteFeedback(itemId: string, userId: string): Promise<{ upvotes: number }> {
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
