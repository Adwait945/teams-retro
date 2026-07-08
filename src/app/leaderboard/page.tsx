"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Shell from "@/components/layout/Shell"
import RankCard from "@/components/leaderboard/RankCard"
import PointsGuideCard from "@/components/leaderboard/PointsGuideCard"
import BadgesReferenceCard from "@/components/leaderboard/BadgesReferenceCard"
import { getCurrentUser } from "@/services/userService"
import type { Badge, User } from "@/types"
import type { PointsRow } from "@/lib/pointsEngine"

const WINDOW_LABELS = { "7d": "This Week", "30d": "This Month", all: "All-Time" } as const

export default function LeaderboardPage() {
  const router = useRouter()
  const [activeWindow, setActiveWindow] = useState<"7d" | "30d" | "all">("7d")
  const [pointsData, setPointsData] = useState<PointsRow[]>([])
  const [badgesData, setBadgesData] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }
    setCurrentUser(user)
  }, [router])

  useEffect(() => {
    if (!currentUser) return
    setIsLoading(true)
    fetch(`/api/points?pod=${encodeURIComponent(currentUser.pod)}&window=${activeWindow}`)
      .then((res) => res.json())
      .then((data) => setPointsData(Array.isArray(data) ? data : []))
      .finally(() => setIsLoading(false))
  }, [currentUser, activeWindow])

  useEffect(() => {
    if (!currentUser) return
    fetch(`/api/badges?podId=${encodeURIComponent(currentUser.pod)}`)
      .then((res) => res.json())
      .then((data) => setBadgesData(Array.isArray(data) ? data : []))
  }, [currentUser])

  const isEmpty = pointsData.length === 0 || pointsData.every((row) => row.allTimePoints === 0)

  return (
    <Shell>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentUser?.pod ?? ""} — points and badges
          </p>
        </div>

        <div className="flex gap-2">
          {(["7d", "30d", "all"] as const).map((w) => (
            <button
              key={w}
              data-testid={`tab-${w}`}
              onClick={() => setActiveWindow(w)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeWindow === w
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {WINDOW_LABELS[w]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : isEmpty ? (
              <div className="rounded-xl border border-dashed border-border/50 bg-secondary/10 p-12 text-center text-muted-foreground">
                No activity yet — submit feedback or complete an action item to appear on the leaderboard
              </div>
            ) : (
              <ol role="list" className="flex flex-col gap-3">
                {pointsData.map((row, i) => (
                  <RankCard
                    key={row.userId}
                    rank={i + 1}
                    row={row}
                    badges={badgesData}
                    isCurrentUser={currentUser?._id === row.userId}
                  />
                ))}
              </ol>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <PointsGuideCard />
            <BadgesReferenceCard />
          </div>
        </div>
      </div>
    </Shell>
  )
}
