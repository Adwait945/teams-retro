"use client"

import { useRetro } from "@/store/retro-store"
import { SprintSelector } from "@/components/sprint-selector"
import { cn } from "@/lib/utils"
import {
  FileText,
  ThumbsUp,
  ListChecks,
  CheckCircle2,
  TrendingUp,
  Trophy,
  Zap,
  AlertTriangle,
  Lightbulb,
  PartyPopper,
} from "lucide-react"

export default function DigestPage() {
  const {
    feedback,
    actionItems,
    pointEvents,
    selectedSprintId,
    getLeaderboard,
    getUserById,
    sprints,
  } = useRetro()

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId)
  const sprintFeedback = feedback.filter((f) => f.sprintId === selectedSprintId)
  const sprintActions = actionItems.filter((a) => a.sprintId === selectedSprintId)
  const completedActions = sprintActions.filter((a) => a.status === "completed" || a.status === "verified")
  const verifiedActions = sprintActions.filter((a) => a.status === "verified")
  const leaderboard = getLeaderboard(selectedSprintId)
  const topContributor = leaderboard[0]

  const topFeedback = [...sprintFeedback]
    .sort((a, b) => b.upvotes.length - a.upvotes.length)
    .slice(0, 5)

  const slowedDown = sprintFeedback.filter((f) => f.category === "slowed-us-down")
  const shouldTry = sprintFeedback.filter((f) => f.category === "should-try")
  const wentWell = sprintFeedback.filter((f) => f.category === "went-well")

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sprint Digest</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your 2-minute retro summary — replaces the 60-minute meeting
          </p>
        </div>
        <SprintSelector />
      </div>

      {/* Digest Header */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-primary">{selectedSprint?.name} Digest</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedSprint &&
            `${new Date(selectedSprint.startDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })} — ${new Date(selectedSprint.endDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}`}
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="rounded-lg bg-white/60 p-3 text-center">
            <p className="text-2xl font-bold">{sprintFeedback.length}</p>
            <p className="text-[11px] text-muted-foreground">Feedback Items</p>
          </div>
          <div className="rounded-lg bg-white/60 p-3 text-center">
            <p className="text-2xl font-bold">
              {sprintFeedback.reduce((sum, f) => sum + f.upvotes.length, 0)}
            </p>
            <p className="text-[11px] text-muted-foreground">Total Upvotes</p>
          </div>
          <div className="rounded-lg bg-white/60 p-3 text-center">
            <p className="text-2xl font-bold">{sprintActions.length}</p>
            <p className="text-[11px] text-muted-foreground">Action Items</p>
          </div>
          <div className="rounded-lg bg-white/60 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {sprintActions.length > 0
                ? Math.round((completedActions.length / sprintActions.length) * 100)
                : 0}
              %
            </p>
            <p className="text-[11px] text-muted-foreground">Completion Rate</p>
          </div>
        </div>
      </div>

      {/* Sprint MVP */}
      {topContributor && topContributor.sprintPoints > 0 && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900">
                Sprint MVP: {topContributor.user.name}
              </h3>
              <p className="text-sm text-amber-700">
                {topContributor.sprintPoints} points earned this sprint
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Voted Feedback */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-primary" /> Top Voted Feedback
        </h3>
        {topFeedback.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No feedback this sprint.</p>
        ) : (
          <div className="space-y-3">
            {topFeedback.map((item, i) => {
              const author = getUserById(item.authorId)
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.content}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> {item.upvotes.length} upvotes
                      </span>
                      <span>
                        {item.isAnonymous ? "Anonymous" : author?.name}
                      </span>
                      {item.actionItemId && (
                        <span className="text-emerald-600 font-medium">Action created</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <h3 className="text-sm font-bold text-amber-700">Slowed Us Down</h3>
          </div>
          <p className="text-2xl font-bold text-amber-800">{slowedDown.length}</p>
          <p className="text-[11px] text-amber-600 mt-1">items identified</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-blue-700" />
            <h3 className="text-sm font-bold text-blue-700">Should Try</h3>
          </div>
          <p className="text-2xl font-bold text-blue-800">{shouldTry.length}</p>
          <p className="text-[11px] text-blue-600 mt-1">ideas proposed</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <PartyPopper className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-emerald-700">Went Well</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-800">{wentWell.length}</p>
          <p className="text-[11px] text-emerald-600 mt-1">wins celebrated</p>
        </div>
      </div>

      {/* Completed Actions with Impact */}
      {verifiedActions.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-emerald-800">
            <TrendingUp className="h-4 w-4" /> Verified Improvements
          </h3>
          <div className="space-y-3">
            {verifiedActions.map((action) => {
              const owner = getUserById(action.ownerId)
              return (
                <div key={action.id} className="rounded-lg bg-white border border-emerald-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold">{action.title}</p>
                  </div>
                  <p className="text-sm text-emerald-700 mt-1">{action.impactDescription}</p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Completed by {owner?.name}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action Items Status */}
      {sprintActions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Action Items Status
          </h3>
          <div className="space-y-2">
            {sprintActions.map((action) => {
              const owner = getUserById(action.ownerId)
              const statusColors: Record<string, string> = {
                open: "bg-slate-200",
                "in-progress": "bg-blue-400",
                completed: "bg-emerald-400",
                verified: "bg-purple-500",
              }
              return (
                <div key={action.id} className="flex items-center gap-3">
                  <div className={cn("h-2.5 w-2.5 rounded-full", statusColors[action.status])} />
                  <span className="text-sm flex-1">{action.title}</span>
                  <span className="text-xs text-muted-foreground">{owner?.name}</span>
                  <span className="text-xs font-medium capitalize text-muted-foreground">
                    {action.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
