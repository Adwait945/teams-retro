import type { Sprint } from '@/types'

export async function getActiveSprint(): Promise<Sprint | null> {
  const res = await fetch('/api/sprints')
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json.error ?? 'Request failed')
  }
  const data = await res.json()
  if (!data || Array.isArray(data)) return null
  return data as Sprint
}

export async function createSprint(payload: {
  name: string
  goal?: string
  startDate: string
  endDate: string
}): Promise<Sprint> {
  const res = await fetch('/api/sprints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Request failed')
  return json as Sprint
}

export async function updateSprint(
  id: string,
  payload: Partial<Pick<Sprint, 'name' | 'goal' | 'startDate' | 'endDate' | 'teamMemberIds'>>
): Promise<Sprint> {
  const res = await fetch(`/api/sprints/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Request failed')
  return json as Sprint
}

export async function openRetro(id: string): Promise<Sprint> {
  const res = await fetch(`/api/sprints/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'open' }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Request failed')
  return json as Sprint
}

export async function closeRetro(id: string): Promise<Sprint> {
  const res = await fetch(`/api/sprints/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'closed' }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Request failed')
  return json as Sprint
}
