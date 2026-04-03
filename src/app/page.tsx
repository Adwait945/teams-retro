"use client"

import { useRetro } from "@/store/retro-store"
import { SprintSelector } from "@/components/sprint-selector"
import {
  MessageSquarePlus,
  ThumbsUp,
  ListChecks,
  CheckCircle2,
  TrendingUp,
  Zap,
  ArrowRight,
  Trophy,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const {
    feedback,
    actionItems,
    pointEvents,
    selectedSprintId,
    getLeaderboard,
    users,
    sprints,
  } = useRetro()

  const sprintFeedback = feedback.filter((f) => f.sprintId === selectedSprintId)
  const sprintActions = actionItems.filter((a) => a.sprintId === selectedSprintId)
  const completedActions = sprintActions.filter((a) => a.status === "completed" || a.status === "verified")
  const sprintPoints = pointEvents.filter((p) => p.sprintId === selectedSprintId)
  const totalSprintPoints = sprintPoints.reduce((sum, p) => sum + p.points, 0)
  const leaderboard = getLeaderboard(selectedSprintId)
  const topContributor = leaderboard[0]

  const stats = [
    {
      label: "Feedback Items",
      value: sprintFeedback.length,
      icon: MessageSquarePlus,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Upvotes",
      value: sprintFeedback.reduce((sum, f) => sum + f.upvotes.length, 0),
      icon: ThumbsUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Action Items",
      value: sprintActions.length,
      icon: ListChecks,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Completed",
      value: completedActions.length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ]

  const recentFeedback = [...sprintFeedback]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const recentPoints = [...sprintPoints]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your team&apos;s retrospective activity
          </p>
        </div>
        <SprintSelector />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <div className={`rounded-lg ${stat.bg} p-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Feedback */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Recent Feedback</h2>
            <Link
              href="/feedback"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentFeedback.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No feedback yet this sprint. Be the first to contribute!
            </p>
          ) : (
            <div className="space-y-3">
              {recentFeedback.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{item.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <ThumbsUp className="h-3 w-3" /> {item.upvotes.length}
                      </span>
                      <span className="text-[11px] rounded-full px-2 py-0.5 bg-muted text-muted-foreground font-medium">
                        {item.category === "slowed-us-down"
                          ? "Slowed Us Down"
                          : item.category === "should-try"
                          ? "Should Try"
                          : "Went Well"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Sprint MVP + Activity */}
        <div className="space-y-6">
          {/* Sprint MVP */}
          {topContributor && topContributor.sprintPoints > 0 && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-semibold text-amber-900">Sprint MVP</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-lg">
                  {topContributor.user.avatar}
                </div>
                <div>
                  <p className="font-semibold text-amber-900">{topContributor.user.name}</p>
                  <p className="text-sm text-amber-700">
                    <span className="font-bold">{topContributor.sprintPoints}</span> points this sprint
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Points Activity */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Points Activity</h2>
              <Link
                href="/leaderboard"
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Leaderboard <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentPoints.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No activity yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentPoints.map((event) => {
                  const user = users.find((u) => u.id === event.userId)
                  return (
                    <div key={event.id} className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {user?.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">
                          {event.description}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600">
                        <Zap className="h-3 w-3" />+{event.points}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
