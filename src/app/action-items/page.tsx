"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Shell from '@/components/layout/Shell'
import ActionItemCard from '@/components/ActionItemCard'
import NewActionItemModal from '@/components/NewActionItemModal'
import VerifyImpactModal from '@/components/VerifyImpactModal'
import { getCurrentUser } from '@/services/userService'
import {
  getActions,
  getActionsByStatus,
  createAction,
  advanceStatus,
  regressStatus,
  verifyImpact,
  getOpenCount,
  getCompletedCount,
  getCompletionRate,
  type CreateActionPayload,
} from '@/services/actionService'
import type { ActionItem, User } from '@/types'

export default function ActionItemsPage() {
  const router = useRouter()

  const [actions, setActions]             = useState<ActionItem[]>([])
  const [users, setUsers]                 = useState<Pick<User, '_id' | 'name'>[]>([])
  const [showNewModal, setShowNewModal]   = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyTarget, setVerifyTarget]   = useState<ActionItem | null>(null)
  const [isLoading, setIsLoading]         = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [actionError, setActionError]     = useState<string | null>(null)
  const [currentUser, setCurrentUser]     = useState<User | null>(null)

  const refetch = useCallback(async () => {
    const items = await getActions('7d')
    setActions(getActionsByStatus(items))
  }, [])

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/')
      return
    }
    setCurrentUser(user)

    async function load() {
      try {
        const usersRes = await fetch('/api/users')
        if (!usersRes.ok) throw new Error('Failed to fetch users')
        const usersData: User[] = await usersRes.json()
        setUsers(usersData.map((u) => ({ _id: u._id, name: u.name })))
        await refetch()
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          setError('Failed to load data.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [router, refetch])

  const usersMap: Record<string, string> = {}
  for (const u of users) {
    usersMap[u._id] = u.name
  }

  async function handleAdvance(itemId: string) {
    setActionError(null)
    try {
      await advanceStatus(itemId)
      await refetch()
    } catch (err) {
      setActionError((err as Error).message ?? 'Failed to advance status')
    }
  }

  async function handleRegress(itemId: string) {
    setActionError(null)
    try {
      await regressStatus(itemId)
      await refetch()
    } catch (err) {
      setActionError((err as Error).message ?? 'Failed to regress status')
    }
  }

  function handleVerify(item: ActionItem) {
    setVerifyTarget(item)
    setShowVerifyModal(true)
  }

  async function handleVerifySubmit(itemId: string, impactNote: string) {
    try {
      await verifyImpact(itemId, impactNote)
      await refetch()
    } catch {
      // silent no-op
    } finally {
      setShowVerifyModal(false)
    }
  }

  async function handleCreateAction(payload: CreateActionPayload) {
    await createAction(payload)
    await refetch()
  }

  const openCount       = getOpenCount(actions)
  const completedCount  = getCompletedCount(actions)
  const verifiedCount   = actions.filter((a) => a.status === 'verified').length
  const inProgressCount = actions.filter((a) => a.status === 'in-progress').length
  const completionRate  = getCompletionRate(actions)

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading...
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-full text-red-400 text-sm">
          {error}
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Action Items</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track, advance, and verify team commitments.
            </p>
          </div>
          {currentUser?.isAdmin && (
            <button
              onClick={() => setShowNewModal(true)}
              data-testid="open-new-action-btn"
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4 py-2 rounded-md text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Action Item
            </button>
          )}
        </div>

        {actionError && (
          <div className="mb-3 shrink-0 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
            {actionError}
          </div>
        )}

        <div className="flex items-center gap-3 mb-6 shrink-0 flex-wrap">
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-700 text-slate-300">
            {openCount} Open
          </span>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400">
            {inProgressCount} In Progress
          </span>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400">
            {completedCount - verifiedCount} Completed
          </span>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400">
            {verifiedCount} Verified
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {completionRate}% complete
          </span>
        </div>

        {actions.length === 0 ? (
          <div data-testid="actions-empty-state" className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-2">No action items yet.</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Convert feedback from the Feedback Board, or add one directly.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/feedback')}
                data-testid="actions-goto-feedback-btn"
                className="px-4 py-2 rounded-md border border-border/50 text-sm font-medium hover:bg-secondary/50 transition-colors"
              >
                Go to Feedback Board
              </button>
              {currentUser?.isAdmin && (
                <button
                  onClick={() => setShowNewModal(true)}
                  data-testid="actions-empty-new-btn"
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4 py-2 rounded-md text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Action Item
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {actions.map((item) => (
              <ActionItemCard
                key={item._id}
                item={item}
                ownerName={usersMap[item.ownerId] ?? 'Unknown'}
                onAdvance={handleAdvance}
                onRegress={handleRegress}
                onVerify={handleVerify}
              />
            ))}
          </div>
        )}

        <NewActionItemModal
          open={showNewModal}
          users={users}
          onClose={() => setShowNewModal(false)}
          onSubmit={handleCreateAction}
        />

        <VerifyImpactModal
          open={showVerifyModal}
          item={verifyTarget}
          onClose={() => { setShowVerifyModal(false); setVerifyTarget(null) }}
          onSubmit={handleVerifySubmit}
        />
      </div>
    </Shell>
  )
}
