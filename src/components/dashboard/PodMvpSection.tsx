"use client"

import { Trophy } from "lucide-react"
import type { PointsRow } from "@/lib/pointsEngine"

interface PodMvpSectionProps {
  pointsData: PointsRow[] | null
  isLoading: boolean
}

export default function PodMvpSection({ pointsData, isLoading }: PodMvpSectionProps) {
  if (isLoading) {
    return (
      <div
        data-testid="pod-mvp-section"
        className="rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Pod MVP
        </h2>
        <div className="animate-pulse h-12 rounded-md bg-secondary/40" />
      </div>
    )
  }

  const mvp = pointsData && pointsData.length > 0 ? pointsData[0] : null

  return (
    <div
      data-testid="pod-mvp-section"
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        Pod MVP
      </h2>
      {!mvp ? (
        <p data-testid="pod-mvp-empty" className="text-sm text-muted-foreground">
          No points earned yet this period.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
            {mvp.avatar || mvp.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{mvp.name}</p>
            <p className="text-xs text-muted-foreground">{mvp.windowPoints} points</p>
          </div>
        </div>
      )}
    </div>
  )
}
