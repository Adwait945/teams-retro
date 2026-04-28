"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Shell from "@/components/layout/Shell"
import { getCurrentUser } from "@/services/userService"
import { Trophy } from "lucide-react"
import type { FeedbackItem, ActionItem, User } from "@/types"

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
  const [pointsData, setPointsData] = useState<Array<{ userId: string; total: number }>>([])
  const [priorFeedback, setPriorFeedback] = useState<FeedbackItem[]>([])

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWindow])

  useEffect(() => {
    if (!currentUser || isLoading || loadError) return
    async function loadSupplementary() {
      try {
        const [ptRes, priorFbRes] = await Promise.all([
          fetch(`/api/points?pod=${encodeURIComponent(currentUser!.pod)}&window=${activeWindow}`),
          activeWindow !== 'all'
            ? fetch(`/api/feedback?window=prior${activeWindow === '7d' ? '7d' : '30d'}`)
            : Promise.resolve(null),
        ])
        const pts = await ptRes.json()
        setPointsData(Array.isArray(pts) ? pts : [])
        if (priorFbRes) {
          const priorFb = await priorFbRes.json()
          setPriorFeedback(Array.isArray(priorFb) ? priorFb : [])
        } else {
          setPriorFeedback([])
        }
      } catch {
        // Non-critical supplementary data — silently fail
      }
    }
    loadSupplementary()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeWindow, isLoading, loadError])

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

        <div className="flex gap-2">
          {(['7d', '30d', 'all'] as const).map((w) => {
            const labels = { '7d': 'This Week', '30d': 'This Month', 'all': 'All-Time' }
            return (
              <button
                key={w}
                data-testid={`tab-${w}`}
                onClick={() => setActiveWindow(w)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeWindow === w
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {labels[w]}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Total Feedback</p>
            <p className="text-2xl font-bold" data-testid="metric-feedback-total">{totalFeedback}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Slowed Us Down</p>
            <p className="text-2xl font-bold" data-testid="metric-feedback-slowed">{feedbackByCategory['slowed-us-down']}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Should Try</p>
            <p className="text-2xl font-bold" data-testid="metric-feedback-should">{feedbackByCategory['should-try']}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Went Well</p>
            <p className="text-2xl font-bold" data-testid="metric-feedback-well">{feedbackByCategory['went-well']}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Total Actions</p>
            <p className="text-2xl font-bold" data-testid="metric-actions-total">{totalActions}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Open</p>
            <p className="text-2xl font-bold" data-testid="metric-actions-open">{actionsByStatus.open}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">In Progress</p>
            <p className="text-2xl font-bold" data-testid="metric-actions-inprogress">{actionsByStatus['in-progress']}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Completed</p>
            <p className="text-2xl font-bold" data-testid="metric-actions-completed">{actionsByStatus.completed}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Verified</p>
            <p className="text-2xl font-bold" data-testid="metric-actions-verified">{actionsByStatus.verified}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Completion Rate</p>
            <p className="text-2xl font-bold" data-testid="metric-completion-rate">{completionRate}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Verification Rate</p>
            <p className="text-2xl font-bold" data-testid="metric-verification-rate">{verificationRate}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Activity Feed</h2>
          <div data-testid="activity-feed">
            {feed.length === 0
              ? <p data-testid="activity-feed-empty" className="text-sm text-muted-foreground">No activity yet</p>
              : feed.map((entry, i) => (
                  <div key={i} data-testid="feed-entry" className="text-sm py-1 border-b border-border/30 last:border-0">
                    {entry.text}
                  </div>
                ))
            }
          </div>
        </div>

        {pointsData.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-4">
            <Trophy className="h-8 w-8 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Pod MVP</p>
              <p className="text-lg font-bold text-amber-800">
                {usersMap[pointsData[0].userId] ?? pointsData[0].userId}
              </p>
              <p className="text-sm text-amber-600">{pointsData[0].total} pts this {activeWindow === '7d' ? 'week' : activeWindow === '30d' ? 'month' : 'time'}</p>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-base font-semibold mb-3">Category Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            {(['slowed-us-down', 'should-try', 'went-well'] as const).map((cat) => {
              const labels: Record<string, string> = { 'slowed-us-down': 'Slowed Down', 'should-try': 'Should Try', 'went-well': 'Went Well' }
              const current = feedbackByCategory[cat]
              const prior = priorFeedback.filter(f => f.category === cat).length
              const delta = current - prior
              return (
                <div key={cat} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">{labels[cat]}</p>
                  <p className="text-2xl font-bold">{current}</p>
                  {activeWindow !== 'all' && (
                    <p className={`text-xs mt-1 font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {delta >= 0 ? `\u2191 +${delta}` : `\u2193 ${delta}`}{prior === 0 && current > 0 ? ' new' : ''}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">Top Voted Feedback</h2>
          {[...feedbackItems].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5).length === 0
            ? <p className="text-sm text-muted-foreground">No feedback yet for this period</p>
            : (
              <div className="space-y-2">
                {[...feedbackItems].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5).map((f, i) => (
                  <div key={f._id} className="rounded-lg border border-border bg-card p-3 flex items-start gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-5 flex-shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">
                        {f.content.length > 120 ? f.content.slice(0, 120) + '\u2026' : f.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {f.isAnonymous ? 'Anonymous' : (usersMap[f.authorId] ?? 'Unknown')}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-amber-600 flex-shrink-0">\u25B2 {f.upvotes}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">Verified Improvements</h2>
          {actionItems.filter(a => a.status === 'verified').length === 0
            ? <p className="text-sm text-muted-foreground">No verified improvements yet this period</p>
            : (
              <div className="space-y-3">
                {actionItems.filter(a => a.status === 'verified').map(a => (
                  <div key={a._id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-sm font-semibold mb-2">{a.title}</p>
                    {a.impactNote && (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {a.impactNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    </Shell>
  )
}
