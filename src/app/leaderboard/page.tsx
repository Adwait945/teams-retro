"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Shell from "@/components/layout/Shell"
import { getCurrentUser } from "@/services/userService"
import { cn } from "@/lib/utils"
import { Trophy, Zap, Medal, Crown } from "lucide-react"
import { POINT_VALUES, BADGE_CATALOG } from "@/types"
import type { User, Badge } from "@/types"

interface RankEntry {
  userId: string
  total: number
}

const RANK_STYLES = [
  { bg: "bg-gradient-to-r from-amber-50 to-yellow-50", border: "border-amber-200", Icon: Crown, iconColor: "text-amber-500" },
  { bg: "bg-gradient-to-r from-slate-50 to-gray-50", border: "border-slate-300", Icon: Medal, iconColor: "text-slate-400" },
  { bg: "bg-gradient-to-r from-orange-50 to-amber-50", border: "border-orange-200", Icon: Medal, iconColor: "text-orange-400" },
]

export default function LeaderboardPage() {
  const router = useRouter()
  const [activeWindow, setActiveWindow] = useState<'7d' | '30d' | 'all'>('7d')
  const [windowRankings, setWindowRankings] = useState<RankEntry[]>([])
  const [allTimeRankings, setAllTimeRankings] = useState<RankEntry[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) { router.push('/'); return }

    async function load() {
      setIsLoading(true)
      setLoadError(false)
      try {
        const [windowRes, allTimeRes, badgesRes, usersRes] = await Promise.all([
          fetch(`/api/points?pod=${encodeURIComponent(user!.pod)}&window=${activeWindow}`),
          fetch(`/api/points?pod=${encodeURIComponent(user!.pod)}&window=all`),
          fetch(`/api/badges?pod=${encodeURIComponent(user!.pod)}`),
          fetch(`/api/users?pod=${encodeURIComponent(user!.pod)}`),
        ])
        const [windowData, allTimeData, badgesData, usersData] = await Promise.all([
          windowRes.json(),
          allTimeRes.json(),
          badgesRes.json(),
          usersRes.json(),
        ])
        setWindowRankings(Array.isArray(windowData) ? windowData : [])
        setAllTimeRankings(Array.isArray(allTimeData) ? allTimeData : [])
        setBadges(Array.isArray(badgesData) ? badgesData : [])
        const map: Record<string, string> = {}
        if (Array.isArray(usersData)) {
          for (const u of usersData as User[]) map[u._id] = u.name
        }
        setUsersMap(map)
      } catch {
        setLoadError(true)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [activeWindow, router])

  const allTimeMap = new Map(allTimeRankings.map((r) => [r.userId, r.total]))

  function getUserBadges(userId: string): Badge[] {
    return badges.filter((b) => b.userId === userId)
  }

  function getInitials(name: string): string {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  }

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
        <div className="flex items-center justify-center h-full text-red-400 text-sm">
          Something went wrong. Please try again.
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Points, rankings, and badges
          </p>
        </div>

        <div className="flex gap-2">
          {(['7d', '30d', 'all'] as const).map((w) => {
            const labels = { '7d': 'This Week', '30d': 'This Month', 'all': 'All-Time' }
            return (
              <button
                key={w}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {windowRankings.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No points yet — submit feedback to get started
                </p>
              </div>
            ) : (
              windowRankings.map((entry, index) => {
                const rank = index + 1
                const style = RANK_STYLES[index] || null
                const name = usersMap[entry.userId] ?? entry.userId
                const userBadges = getUserBadges(entry.userId)
                const hasPodChampion = userBadges.some((b) => b.type === 'pod_champion')
                const allTimePts = allTimeMap.get(entry.userId) ?? 0

                return (
                  <div
                    key={entry.userId}
                    className={cn(
                      "rounded-xl border p-5 transition-all hover:shadow-md",
                      style ? style.bg : "bg-card",
                      style ? style.border : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10">
                        {style ? (
                          <style.Icon className={cn("h-7 w-7", style.iconColor)} />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
                        )}
                      </div>

                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {getInitials(name)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{name}</p>
                          {rank === 1 && hasPodChampion && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              <Trophy className="h-3 w-3" /> Pod Champion
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="font-medium">{allTimePts} all-time pts</span>
                        </div>
                        {userBadges.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {userBadges.map((badge) => {
                              const catalog = BADGE_CATALOG.find((c) => c.type === badge.type)
                              return (
                                <span
                                  key={badge._id}
                                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                                  title={catalog?.earnCondition}
                                >
                                  {catalog?.icon} {catalog?.label ?? badge.type}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold text-amber-600">
                          <Zap className="h-5 w-5" />
                          {entry.total}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {activeWindow === '7d' ? 'this week' : activeWindow === '30d' ? 'this month' : 'all-time'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold mb-4">Points Guide</h2>
              <div className="space-y-3">
                {(Object.entries(POINT_VALUES) as [string, number][]).map(([action, points]) => (
                  <div key={action} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground capitalize">
                      {action.replace(/_/g, " ")}
                    </span>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-xs font-bold",
                      points >= 0 ? "text-amber-600" : "text-red-500"
                    )}>
                      <Zap className="h-3 w-3" />
                      {points >= 0 ? `+${points}` : `${points}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold mb-4">Badges</h2>
              <div className="space-y-3">
                {BADGE_CATALOG.map((badge) => (
                  <div
                    key={badge.type}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                      {badge.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{badge.label}</p>
                      <p className="text-[11px] text-muted-foreground">{badge.earnCondition}</p>
                      <p className="text-[10px] text-muted-foreground/60 capitalize">{badge.lifecycle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
