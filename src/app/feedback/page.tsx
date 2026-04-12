"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Shell from '@/components/layout/Shell'
import FeedbackColumn from '@/components/FeedbackColumn'
import { getCurrentUser } from '@/services/userService'
import { getFeedbackByLane, addFeedback, upvoteFeedback } from '@/services/feedbackService'
import SubmitFeedbackModal from '@/components/SubmitFeedbackModal'
import ConvertActionModal from '@/components/ConvertActionModal'
import { createAction } from '@/services/actionService'
import type { Sprint, FeedbackItem, FeedbackCategory, User } from '@/types'
import type { CreateActionPayload } from '@/services/actionService'

export default function FeedbackPage() {
  const router = useRouter()

  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [slowedDown, setSlowedDown] = useState<FeedbackItem[]>([])
  const [shouldTry, setShouldTry] = useState<FeedbackItem[]>([])
  const [wentWell, setWentWell] = useState<FeedbackItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertTarget, setConvertTarget] = useState<FeedbackItem | null>(null)
  const [users, setUsers] = useState<Pick<User, '_id' | 'name'>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const refetch = useCallback(async (sprintId: string) => {
    const [slowed, should, well] = await Promise.all([
      getFeedbackByLane(sprintId, 'slowed-us-down'),
      getFeedbackByLane(sprintId, 'should-try'),
      getFeedbackByLane(sprintId, 'went-well'),
    ])
    setSlowedDown(slowed)
    setShouldTry(should)
    setWentWell(well)
  }, [])

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/')
      return
    }

    async function load() {
      try {
        const res = await fetch('/api/sprints')
        const data = await res.json()
        const activeSprint = Array.isArray(data)
          ? data.find((s: Sprint) => s.status === 'open') ?? null
          : data?.status === 'open'
          ? data
          : null
        setSprint(activeSprint)

        const usersRes = await fetch('/api/users')
        if (usersRes.ok) {
          const usersData: unknown = await usersRes.json()
          if (Array.isArray(usersData)) {
            setUsers((usersData as User[]).map((u) => ({ _id: u._id, name: u.name })))
          }
        }

        if (activeSprint) {
          await refetch(activeSprint._id)
        }
      } catch {
        setLoadError(true)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [router, refetch])

  const currentUser = getCurrentUser()

  async function handleUpvote(itemId: string) {
    const user = getCurrentUser()
    if (!user) return
    try {
      await upvoteFeedback(itemId, user._id)
      if (sprint) await refetch(sprint._id)
    } catch {
      // 403 self-vote or 409 duplicate — silent no-op
    }
  }

  function handleConvert(item: FeedbackItem) {
    setConvertTarget(item)
    setShowConvertModal(true)
  }

  async function handleConvertSubmit(payload: CreateActionPayload) {
    await createAction(payload)
    setShowConvertModal(false)
  }

  async function onSubmitFeedback(payload: {
    category: FeedbackCategory
    content: string
    suggestion: string
    isAnonymous: boolean
  }) {
    const user = getCurrentUser()
    if (!user || !sprint) return
    await addFeedback({ ...payload, sprintId: sprint._id, authorId: user._id })
    await refetch(sprint._id)
  }

  if (isLoading) {
    return (
      <Shell sprintName="">
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading...
        </div>
      </Shell>
    )
  }

  if (loadError) {
    return (
      <Shell sprintName="">
        <div data-testid="load-error" className="flex items-center justify-center h-full text-red-400 text-sm">
          Something went wrong. Please try again.
        </div>
      </Shell>
    )
  }

  return (
    <Shell sprintName={sprint?.name}>
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Feedback Board</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review, vote, and convert feedback to action.
            </p>
          </div>
          <button
            onClick={() => { if (sprint?.status !== 'closed') setShowModal(true) }}
            data-testid="open-modal-btn"
            disabled={sprint?.status === 'closed'}
            aria-label={sprint?.status === 'closed' ? 'Feedback submission is closed' : undefined}
            className={'flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4 py-2 rounded-md text-sm transition-colors' + (sprint?.status === 'closed' ? ' opacity-50 cursor-not-allowed' : '')}
          >
            <Plus className="w-4 h-4" />
            Submit Feedback
          </button>
        </div>

        {!sprint && (
          <div
            data-testid="feedback-empty-state"
            className="flex-1 flex items-center justify-center text-sm text-muted-foreground"
          >
            No active sprint. Set one up to begin.
          </div>
        )}

        <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
          <FeedbackColumn
            category="slowed-us-down"
            items={slowedDown}
            onUpvote={handleUpvote}
            currentUserId={currentUser?._id ?? ''}
            onConvert={handleConvert}
          />
          <FeedbackColumn
            category="should-try"
            items={shouldTry}
            onUpvote={handleUpvote}
            currentUserId={currentUser?._id ?? ''}
            onConvert={handleConvert}
          />
          <FeedbackColumn
            category="went-well"
            items={wentWell}
            onUpvote={handleUpvote}
            currentUserId={currentUser?._id ?? ''}
            onConvert={handleConvert}
          />
        </div>

        <SubmitFeedbackModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={onSubmitFeedback}
          sprintId={sprint?._id ?? ''}
        />

        <ConvertActionModal
          open={showConvertModal}
          feedbackItem={convertTarget}
          sprintId={sprint?._id ?? ''}
          users={users}
          onClose={() => setShowConvertModal(false)}
          onSubmit={handleConvertSubmit}
        />
      </div>
    </Shell>
  )
}
