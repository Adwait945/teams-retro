"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import Shell from '@/components/layout/Shell'
import { getCurrentUser, getAllUsers } from '@/services/userService'
import {
  getActiveSprint,
  createSprint,
  updateSprint,
  openRetro,
  closeRetro,
} from '@/services/sprintService'
import type { Sprint, User } from '@/types'

type ResolvedMember = Pick<User, '_id' | 'name'> & { pod: string }

export default function SprintSetupPage() {
  const router = useRouter()

  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [isNewSprint, setIsNewSprint] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [localStatus, setLocalStatus] = useState<'open' | 'closed'>('open')
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([])
  const [resolvedMembers, setResolvedMembers] = useState<ResolvedMember[]>([])

  const [usernameInput, setUsernameInput] = useState('')
  const [memberError, setMemberError] = useState<string | null>(null)
  const [isAddingMember, setIsAddingMember] = useState(false)

  const currentUser = getCurrentUser()
  const isAdmin = currentUser?.isAdmin === true

  const dateError =
    startDate && endDate && endDate < startDate
      ? 'End date must be on or after start date'
      : ''

  const saveDisabled =
    !name.trim() || !startDate || !endDate || !!dateError || isSaving

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/')
      return
    }

    async function load() {
      try {
        const [activeSprint, allUsers] = await Promise.all([
          getActiveSprint(),
          getAllUsers(),
        ])

        if (activeSprint) {
          setSprint(activeSprint)
          setIsNewSprint(false)
          setName(activeSprint.name)
          setGoal(activeSprint.goal ?? '')
          setStartDate(activeSprint.startDate?.slice(0, 10) ?? '')
          setEndDate(activeSprint.endDate?.slice(0, 10) ?? '')
          setLocalStatus(activeSprint.status)
          setTeamMemberIds(activeSprint.teamMemberIds ?? [])
          const members: ResolvedMember[] = (activeSprint.teamMemberIds ?? [])
            .map((id) => {
              const u = allUsers.find((u) => u._id === id)
              return u ? { _id: u._id, name: u.name, pod: u.pod } : null
            })
            .filter(Boolean) as ResolvedMember[]
          setResolvedMembers(members)
        } else {
          setIsNewSprint(true)
        }
      } catch {
        setLoadError(true)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [router])

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    try {
      let saved: Sprint
      if (isNewSprint) {
        saved = await createSprint({ name, goal, startDate, endDate })
        setIsNewSprint(false)
      } else {
        saved = await updateSprint(sprint!._id, {
          name,
          goal,
          startDate,
          endDate,
          teamMemberIds,
        })
        if (localStatus !== sprint?.status) {
          if (localStatus === 'open') {
            saved = await openRetro(saved._id)
          } else {
            saved = await closeRetro(saved._id)
          }
        }
      }
      setSprint(saved)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAddMember() {
    if (!usernameInput.trim()) return
    setIsAddingMember(true)
    setMemberError(null)
    try {
      const res = await fetch(`/api/users?username=${encodeURIComponent(usernameInput.trim())}`)
      const data = await res.json()
      const users: User[] = Array.isArray(data) ? data : []
      if (users.length === 0) {
        setMemberError('User not found')
        return
      }
      const found = users[0]
      if (teamMemberIds.includes(found._id)) {
        setMemberError('User already added')
        return
      }
      setResolvedMembers((prev) => [...prev, { _id: found._id, name: found.name, pod: found.pod }])
      setTeamMemberIds((prev) => [...prev, found._id])
      setUsernameInput('')
    } catch {
      setMemberError('User not found')
    } finally {
      setIsAddingMember(false)
    }
  }

  function handleRemoveMember(id: string) {
    setResolvedMembers((prev) => prev.filter((m) => m._id !== id))
    setTeamMemberIds((prev) => prev.filter((mid) => mid !== id))
  }

  function handleCancel() {
    if (sprint) {
      setName(sprint.name)
      setGoal(sprint.goal ?? '')
      setStartDate(sprint.startDate?.slice(0, 10) ?? '')
      setEndDate(sprint.endDate?.slice(0, 10) ?? '')
      setLocalStatus(sprint.status)
    } else {
      setName('')
      setGoal('')
      setStartDate('')
      setEndDate('')
      setLocalStatus('open')
    }
    setSaveError(null)
  }

  const inputClass =
    'bg-secondary/50 border border-border/50 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-500/50'
  const labelClass = 'text-sm font-medium text-slate-300 mb-1 block'

  if (isLoading) {
    return (
      <Shell sprintName="">
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading...
        </div>
      </Shell>
    )
  }

  return (
    <Shell sprintName={sprint?.name}>
      <div
        data-testid="sprint-setup-page"
        className="max-w-[600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-0 pb-12"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Set Up Sprint</h1>
          <p className="text-muted-foreground mt-2">
            Configure your retro session before your team joins.
          </p>
        </div>

        {loadError && (
          <p data-testid="load-error" className="text-red-400 text-sm mb-4">
            Failed to load sprint data. Please refresh.
          </p>
        )}

        <div className="retro-card p-8 space-y-8">

          {isAdmin ? (
            <div data-testid="admin-view" className="space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Sprint Name</label>
                  <input
                    type="text"
                    data-testid="sprint-name-input"
                    placeholder="e.g. Sprint 42"
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Sprint Goal</label>
                  <textarea
                    data-testid="sprint-goal-input"
                    placeholder="What was this sprint trying to achieve?"
                    rows={2}
                    maxLength={500}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Start Date</label>
                    <input
                      type="date"
                      data-testid="start-date-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>End Date</label>
                    <input
                      type="date"
                      data-testid="end-date-input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                {dateError && (
                  <p data-testid="date-error" className="text-red-400 text-sm">
                    {dateError}
                  </p>
                )}
              </div>

              <hr className="border-border/50" />

              {/* Retro Status */}
              <div data-testid="retro-status-section" className="space-y-3">
                <p className={labelClass}>Retro Status</p>
                <div className="flex flex-col space-y-1">
                  <label className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-md border border-border/50 cursor-pointer">
                    <input
                      type="radio"
                      data-testid="status-open"
                      name="retro-status"
                      value="open"
                      checked={localStatus === 'open'}
                      onChange={() => setLocalStatus('open')}
                      className="border-emerald-500 text-emerald-500"
                    />
                    <span className="font-medium flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      Open
                      <span className="text-xs font-normal text-muted-foreground ml-2">
                        Team can submit feedback
                      </span>
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 p-3 cursor-pointer">
                    <input
                      type="radio"
                      data-testid="status-closed"
                      name="retro-status"
                      value="closed"
                      checked={localStatus === 'closed'}
                      onChange={() => setLocalStatus('closed')}
                      className="border-slate-500 text-slate-500"
                    />
                    <span className="font-medium flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      Closed
                      <span className="text-xs font-normal text-muted-foreground ml-2">
                        Read-only mode
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <hr className="border-border/50" />

              {/* Team Members */}
              <div className="space-y-4">
                <p className={labelClass}>Team Members</p>

                <div className="space-y-2">
                  {resolvedMembers.map((member) => (
                    <div
                      key={member._id}
                      data-testid="member-row"
                      className="flex items-center justify-between p-3 rounded-md bg-secondary/20 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 border border-border flex items-center justify-center text-xs font-medium">
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.pod}</div>
                        </div>
                      </div>
                      <button
                        data-testid="remove-member-btn"
                        onClick={() => handleRemoveMember(member._id)}
                        className="h-8 w-8 rounded flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4 p-3 bg-secondary/10 rounded-md border border-dashed border-border/50">
                  <input
                    type="text"
                    data-testid="username-input"
                    placeholder="Enter username…"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value)
                      setMemberError(null)
                    }}
                    className="bg-secondary/50 border border-border/50 rounded-md px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <button
                    data-testid="add-member-btn"
                    onClick={handleAddMember}
                    disabled={!usernameInput.trim() || isAddingMember}
                    className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isAddingMember ? 'Adding…' : '+ Add Member'}
                  </button>
                </div>
                {memberError && (
                  <p data-testid="member-error" className="text-red-400 text-sm">
                    {memberError}
                  </p>
                )}
              </div>

              <hr className="border-border/50" />

              {/* Save / Cancel */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  data-testid="cancel-btn"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm rounded-md border border-border/50 hover:bg-secondary/50"
                >
                  Cancel
                </button>
                <button
                  data-testid="save-btn"
                  onClick={handleSave}
                  disabled={saveDisabled}
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isNewSprint ? 'Save & Open Retro' : 'Save Changes'}
                </button>
              </div>

              {saveSuccess && (
                <span data-testid="save-success" className="text-emerald-400 text-sm">
                  Sprint saved.
                </span>
              )}
              {saveError && (
                <p data-testid="save-error" className="text-red-400 text-sm">
                  {saveError}
                </p>
              )}
            </div>
          ) : (
            <div data-testid="readonly-view" className="space-y-8">
              {/* Basic Info — read-only */}
              <div className="space-y-4">
                <div>
                  <p className={labelClass}>Sprint Name</p>
                  <p className="text-sm text-foreground">{sprint?.name ?? '—'}</p>
                </div>
                <div>
                  <p className={labelClass}>Sprint Goal</p>
                  <p className="text-sm text-foreground">{sprint?.goal ?? '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={labelClass}>Start Date</p>
                    <p className="text-sm text-foreground">
                      {sprint?.startDate?.slice(0, 10) ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className={labelClass}>End Date</p>
                    <p className="text-sm text-foreground">
                      {sprint?.endDate?.slice(0, 10) ?? '—'}
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-border/50" />

              {/* Status — read-only */}
              <div className="space-y-2">
                <p className={labelClass}>Retro Status</p>
                <span
                  className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full ${
                    sprint?.status === 'open'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {sprint?.status === 'open' ? 'Open' : 'Closed'}
                </span>
              </div>

              <hr className="border-border/50" />

              {/* Team Members — read-only */}
              <div className="space-y-4">
                <p className={labelClass}>Team Members</p>
                <div className="space-y-2">
                  {resolvedMembers.map((member) => (
                    <div
                      key={member._id}
                      data-testid="member-row"
                      className="flex items-center gap-3 p-3 rounded-md bg-secondary/20 border border-border/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-700 border border-border flex items-center justify-center text-xs font-medium">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.pod}</div>
                      </div>
                    </div>
                  ))}
                  {resolvedMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground">No members added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}
