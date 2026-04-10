import type { ActionItem } from "@/types"

export async function getActions(sprintId?: string): Promise<ActionItem[]> {
  const url = sprintId ? `/api/actions?sprintId=${sprintId}` : "/api/actions"
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch actions")
  return res.json()
}

export function getCompletionRate(actions: ActionItem[]): number {
  const total = actions.length
  if (total === 0) return 0
  const completed = actions.filter(
    (a) => a.status === "completed" || a.status === "verified"
  ).length
  return Math.round((completed / total) * 100)
}

export function getOpenCount(actions: ActionItem[]): number {
  return actions.filter((a) => a.status === "open" || a.status === "in-progress").length
}

export function getCompletedCount(actions: ActionItem[]): number {
  return actions.filter((a) => a.status === "completed" || a.status === "verified").length
}
