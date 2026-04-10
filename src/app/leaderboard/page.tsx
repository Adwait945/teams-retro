// @ts-nocheck
"use client"

import { useRetro } from "@/store/retro-store"
import { SprintSelector } from "@/components/sprint-selector"
import { cn } from "@/lib/utils"
import { Trophy, Zap, Medal, Crown, Star } from "lucide-react"
import { BADGES, POINT_VALUES } from "@/types"

export default function LeaderboardPage() {
  const { getLeaderboard, selectedSprintId, pointEvents, feedback, actionItems } = useRetro()

  const leaderboard = getLeaderboard(selectedSprintId)
  const sprintFeedback = feedback.filter((f) => f.sprintId === selectedSprintId)
  const sprintActions = actionItems.filter((a) => a.sprintId === selectedSprintId)

  const rankStyles = [
    { bg: "bg-gradient-to-r from-amber-50 to-yellow-50", border: "border-amber-200", icon: Crown, iconColor: "text-amber-500" },
    { bg: "bg-gradient-to-r from-slate-50 to-gray-50", border: "border-slate-300", icon: Medal, iconColor: "text-slate-400" },
    { bg: "bg-gradient-to-r from-orange-50 to-amber-50", border: "border-orange-200", icon: Medal, iconColor: "text-orange-400" },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Points, rankings, and badges for this sprint
          </p>
        </div>
        <SprintSelector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rankings */}
        <div className="lg:col-span-2 space-y-3">
          {leaderboard.map((entry, index) => {
            const rank = index + 1
            const style = rankStyles[index] || {
              bg: "bg-card",
              border: "border-border",
              icon: Star,
              iconColor: "text-muted-foreground",
            }
            const userFeedbackCount = sprintFeedback.filter(
              (f) => f.authorId === entry.user.id
            ).length
            const userActionCount = sprintActions.filter(
              (a) => a.ownerId === entry.user.id
            ).length
            const earnedBadges = BADGES.filter(
              (b) => entry.user.totalPoints >= b.threshold
            )

            return (
              <div
                key={entry.user.id}
                className={cn(
                  "rounded-xl border p-5 transition-all hover:shadow-md",
                  style.bg,
                  style.border
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10">
                    {rank <= 3 ? (
                      <style.icon className={cn("h-7 w-7", style.iconColor)} />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
                    )}
                  </div>

                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {entry.user.avatar}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{entry.user.name}</p>
                      {rank === 1 && entry.sprintPoints > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Trophy className="h-3 w-3" /> Sprint MVP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{userFeedbackCount} feedback</span>
                      <span>{userActionCount} actions</span>
                      <span className="font-medium text-muted-foreground">
                        {entry.user.totalPoints} total pts
                      </span>
                    </div>
                    {earnedBadges.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {earnedBadges.map((badge) => (
                          <span
                            key={badge.id}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                            title={badge.description}
                          >
                            {badge.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold text-amber-600">
                      <Zap className="h-5 w-5" />
                      {entry.sprintPoints}
                    </div>
                    <p className="text-[11px] text-muted-foreground">this sprint</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Sidebar: Points Guide + Badges */}
        <div className="space-y-6">
          {/* Points Guide */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold mb-4">Points Guide</h2>
            <div className="space-y-3">
              {(
                Object.entries(POINT_VALUES) as [string, number][]
              ).map(([action, points]) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize">
                    {action.replace(/-/g, " ")}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                    <Zap className="h-3 w-3" />+{points}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold mb-4">Badges</h2>
            <div className="space-y-3">
              {BADGES.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{badge.name}</p>
                    <p className="text-[11px] text-muted-foreground">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
