import type { ActionItem } from "@/types"

export interface CreateActionPayload {
  title: string
  description: string
  ownerId: string
  dueDate: string | null
  sourceFeedbackId?: string
  sourceQuote?: string
}

export async function getActions(window?: string): Promise<ActionItem[]> {
  const url = window ? `/api/actions?window=${window}` : '/api/actions'
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch actions")
  return res.json()
}

export function getCompletionRate(actions: ActionItem[]): number {
  const total = actions.length
  if (total === 0) return 0
  const completed = actions.filter((a) => a.status === 'completed' || a.status === 'verified').length
  return Math.round((completed / total) * 100)
}

export function getOpenCount(actions: ActionItem[]): number {
  return actions.filter((a) => a.status === "open" || a.status === "in-progress").length
}

export function getCompletedCount(actions: ActionItem[]): number {
  return actions.filter((a) => a.status === "completed" || a.status === "verified").length
}

const STATUS_ORDER: Record<ActionItem['status'], number> = {
  'open': 0,
  'in-progress': 1,
  'completed': 2,
  'verified': 3,
}

export function getActionsByStatus(items: ActionItem[]): ActionItem[] {
  return [...items].sort((a, b) => {
    const orderDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (orderDiff !== 0) return orderDiff
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
  })
}

export async function createAction(payload: CreateActionPayload): Promise<ActionItem> {
  if (!payload.title.trim()) throw new Error('title is required')
  if (!payload.ownerId) throw new Error('ownerId is required')
  const res = await fetch('/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create action item')
  return res.json()
}

export async function advanceStatus(itemId: string): Promise<ActionItem> {
  const res = await fetch(`/api/actions/${itemId}/advance`, { method: 'PATCH' })
  if (!res.ok) throw new Error('Failed to advance action item status')
  return res.json()
}

export async function regressStatus(itemId: string): Promise<ActionItem> {
  const res = await fetch(`/api/actions/${itemId}/regress`, { method: 'PATCH' })
  if (!res.ok) throw new Error('Failed to regress action item status')
  return res.json()
}

export async function verifyImpact(itemId: string, impactNote: string): Promise<ActionItem> {
  if (!impactNote.trim()) throw new Error('impactNote is required')
  const res = await fetch(`/api/actions/${itemId}/verify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ impactNote }),
  })
  if (!res.ok) throw new Error('Failed to verify impact')
  return res.json()
}
