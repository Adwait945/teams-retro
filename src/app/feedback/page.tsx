"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Shell from '@/components/layout/Shell'
import FeedbackColumn from '@/components/FeedbackColumn'
import { getCurrentUser } from '@/services/userService'
import { getFeedbackByWindowAndLane, addFeedback, upvoteFeedback } from '@/services/feedbackService'
import SubmitFeedbackModal from '@/components/SubmitFeedbackModal'
import ConvertToActionModal from '@/components/ConvertToActionModal'
import { createAction } from '@/services/actionService'
import type { FeedbackItem, FeedbackCategory, User } from '@/types'
import type { CreateActionPayload } from '@/services/actionService'

export default function FeedbackPage() {
  const router = useRouter()

  const [slowedDown, setSlowedDown] = useState<FeedbackItem[]>([])
  const [shouldTry, setShouldTry] = useState<FeedbackItem[]>([])
  const [wentWell, setWentWell] = useState<FeedbackItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertTarget, setConvertTarget] = useState<FeedbackItem | null>(null)
  const [users, setUsers] = useState<Pick<User, '_id' | 'name'>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeWindow] = useState('7d')

  const refetch = useCallback(async () => {
    const [slowed, should, well] = await Promise.all([
      getFeedbackByWindowAndLane(activeWindow, 'slowed-us-down'),
      getFeedbackByWindowAndLane(activeWindow, 'should-try'),
      getFeedbackByWindowAndLane(activeWindow, 'went-well'),
    ])
    setSlowedDown(slowed)
    setShouldTry(should)
    setWentWell(well)
  }, [activeWindow])

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/')
      return
    }

    async function load() {
      try {
        const usersRes = await fetch('/api/users')

        if (usersRes.ok) {
          const usersData: unknown = await usersRes.json()
          if (Array.isArray(usersData)) {
            setUsers((usersData as User[]).map((u) => ({ _id: u._id, name: u.name })))
          }
        }

        await refetch()
      } catch {
        setLoadError(true)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [router, refetch])

  const currentUser = getCurrentUser()

  function patchUpvote(
    setter: React.Dispatch<React.SetStateAction<FeedbackItem[]>>,
    itemId: string,
    upvotes: number,
    upvotedBy: string[]
  ) {
    setter((prev) =>
      prev.map((f) => (f._id === itemId ? { ...f, upvotes, upvotedBy } : f))
    )
  }

  async function handleUpvote(itemId: string) {
    const user = getCurrentUser()
    if (!user) return
    try {
      const result = await upvoteFeedback(itemId, user._id)
      patchUpvote(setSlowedDown, itemId, result.upvotes, result.upvotedBy)
      patchUpvote(setShouldTry, itemId, result.upvotes, result.upvotedBy)
      patchUpvote(setWentWell, itemId, result.upvotes, result.upvotedBy)
    } catch {
      // 403 self-vote — silent no-op
    }
  }

  function handleConvert(item: FeedbackItem) {
    setConvertTarget(item)
    setShowConvertModal(true)
  }

  async function handleConvertSubmit(payload: CreateActionPayload) {
    await createAction(payload)
    setShowConvertModal(false)
    await refetch()
  }

  async function onSubmitFeedback(payload: {
    category: FeedbackCategory
    content: string
    suggestion: string
    isAnonymous: boolean
  }) {
    const user = getCurrentUser()
    if (!user) return
    await addFeedback({ ...payload, authorId: user._id })
    await refetch()
  }

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading...
        </div>
      </Shell>
    )
  }

  if (loadError) {
    return (
      <Shell>
        <div data-testid="load-error" className="flex items-center justify-center h-full text-red-400 text-sm">
          Something went wrong. Please try again.
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Feedback Board</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review, vote, and convert feedback to action.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            data-testid="open-modal-btn"
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4 py-2 rounded-md text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Submit Feedback
          </button>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
          <FeedbackColumn
            category="slowed-us-down"
            items={slowedDown}
            onUpvote={handleUpvote}
            currentUserId={currentUser?._id ?? ''}
            onConvert={handleConvert}
            isAdmin={currentUser?.isAdmin ?? false}
          />
          <FeedbackColumn
            category="should-try"
            items={shouldTry}
            onUpvote={handleUpvote}
            currentUserId={currentUser?._id ?? ''}
            onConvert={handleConvert}
            isAdmin={currentUser?.isAdmin ?? false}
          />
          <FeedbackColumn
            category="went-well"
            items={wentWell}
            onUpvote={handleUpvote}
            currentUserId={currentUser?._id ?? ''}
            onConvert={handleConvert}
            isAdmin={currentUser?.isAdmin ?? false}
          />
        </div>

        <SubmitFeedbackModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={onSubmitFeedback}
        />

        <ConvertToActionModal
          open={showConvertModal}
          feedbackItem={convertTarget}
          users={users}
          onClose={() => setShowConvertModal(false)}
          onSubmit={handleConvertSubmit}
        />
      </div>
    </Shell>
  )
}
