"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Shell from "@/components/layout/Shell"
import { getCurrentUser } from "@/services/userService"
import type { FeedbackItem, ActionItem, User } from "@/types"
import { useDashboardExtras } from "@/components/dashboard/useDashboardExtras"
import MetricsGrid from "@/components/dashboard/MetricsGrid"
import WindowTabs from "@/components/dashboard/WindowTabs"
import ActivityFeedSection from "@/components/dashboard/ActivityFeedSection"
import PodMvpSection from "@/components/dashboard/PodMvpSection"
import CategoryBreakdownSection from "@/components/dashboard/CategoryBreakdownSection"
import TopVotedFeedbackSection from "@/components/dashboard/TopVotedFeedbackSection"
import VerifiedImprovementsSection from "@/components/dashboard/VerifiedImprovementsSection"

const CATEGORY_LABEL: Record<string, string> = {
  'slowed-us-down': 'Slowed Us Down',
  'should-try':     'Should Try',
  'went-well':      'Went Well',
}

const STATUS_DISPLAY: Record<string, string> = {
  'open':        'Open',
  'in-progress': 'In Progress',
  'completed':   'Completed',
  'verified':    'Verified',
}

interface FeedEntry {
  text: string
  timestamp: string
}

function buildFeed(
  feedbackItems: FeedbackItem[],
  actionItems: ActionItem[],
  usersMap: Record<string, string>
): FeedEntry[] {
  const entries: FeedEntry[] = []
  for (const f of feedbackItems) {
    const label = CATEGORY_LABEL[f.category] ?? f.category
    const text = f.isAnonymous
      ? `New feedback in '${label}'`
      : `${usersMap[f.authorId] ?? 'Unknown'} submitted feedback in '${label}'`
    entries.push({ text, timestamp: f.createdAt })
  }
  for (const a of actionItems) {
    const ts = (a.status === 'completed' || a.status === 'verified') && a.completedAt
      ? a.completedAt
      : a.createdAt
    const statusLabel = STATUS_DISPLAY[a.status] ?? a.status
    entries.push({ text: `${a.title} moved to ${statusLabel}`, timestamp: ts })
  }
  return entries
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0))
    .slice(0, 20)
}

export default function DashboardPage() {
  const router = useRouter()
  const [activeWindow, setActiveWindow] = useState<'7d' | '30d' | 'all'>('7d')
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) { router.push('/'); return }
    setCurrentUser(user)

    async function load() {
      setIsLoading(true)
      try {
        const [fbRes, actRes, usersRes] = await Promise.all([
          fetch(`/api/feedback?window=${activeWindow}`),
          fetch(`/api/actions?window=${activeWindow}`),
          fetch(`/api/users?pod=${encodeURIComponent(user!.pod)}`),
        ])
        const [fb, act, users] = await Promise.all([fbRes.json(), actRes.json(), usersRes.json()])
        setFeedbackItems(Array.isArray(fb) ? fb : [])
        setActionItems(Array.isArray(act) ? act : [])
        const map: Record<string, string> = {}
        if (Array.isArray(users)) {
          for (const u of users as User[]) map[u._id] = u.name
        }
        setUsersMap(map)
      } catch {
        setLoadError(true)
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // `router` intentionally omitted (Sprint 7, Session 5): the test mock's
    // useRouter() returns a new object every render, so including `router`
    // here caused an unbounded re-fetch loop (see IMPLEMENTATION_NOTES.md,
    // Sprint 7 Session 5, for the full pre-existing-bug writeup). Only the
    // deps array changed — no fetch/isLoading/loadError logic was touched.
  }, [activeWindow]) // eslint-disable-line react-hooks/exhaustive-deps

  // Epic 7.4: independent Pod MVP + prior-period category data (ADR-0002).
  const { pointsData, isLoadingPoints, priorFeedbackItems } = useDashboardExtras(activeWindow)

  const totalFeedback = feedbackItems.length
  const feedbackByCategory = {
    'slowed-us-down': feedbackItems.filter(f => f.category === 'slowed-us-down').length,
    'should-try':     feedbackItems.filter(f => f.category === 'should-try').length,
    'went-well':      feedbackItems.filter(f => f.category === 'went-well').length,
  }
  const totalActions = actionItems.length
  const actionsByStatus = {
    open:          actionItems.filter(a => a.status === 'open').length,
    'in-progress': actionItems.filter(a => a.status === 'in-progress').length,
    completed:     actionItems.filter(a => a.status === 'completed').length,
    verified:      actionItems.filter(a => a.status === 'verified').length,
  }
  const completionDenom = totalActions
  const completionRate = completionDenom === 0
    ? '0%'
    : `${Math.round((actionsByStatus.completed + actionsByStatus.verified) / completionDenom * 100)}%`
  const verifyDenom = actionsByStatus.completed + actionsByStatus.verified
  const verificationRate = verifyDenom === 0
    ? '—'
    : `${Math.round(actionsByStatus.verified / verifyDenom * 100)}%`

  const feed = buildFeed(feedbackItems, actionItems, usersMap)

  const topVotedFeedback = [...feedbackItems]
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 5)

  const verifiedImprovements = actionItems.filter((a) => a.status === 'verified')

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading…
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
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentUser?.pod ?? ''} — rolling metrics
          </p>
        </div>

        <WindowTabs activeWindow={activeWindow} onChange={setActiveWindow} />

        <MetricsGrid
          totalFeedback={totalFeedback}
          feedbackByCategory={feedbackByCategory}
          totalActions={totalActions}
          actionsByStatus={actionsByStatus}
          completionRate={completionRate}
          verificationRate={verificationRate}
        />

        <ActivityFeedSection feed={feed} />

        <PodMvpSection pointsData={pointsData} isLoading={isLoadingPoints} />

        <CategoryBreakdownSection
          current={feedbackItems}
          prior={priorFeedbackItems}
          window={activeWindow}
        />

        <TopVotedFeedbackSection items={topVotedFeedback} />

        <VerifiedImprovementsSection items={verifiedImprovements} />
      </div>
    </Shell>
  )
}
