import { Trophy, Medal } from "lucide-react"
import { cn } from "@/lib/utils"
import { BADGE_DEFINITIONS, type Badge } from "@/types"
import type { PointsRow } from "@/lib/pointsEngine"

interface RankCardProps {
  rank: number
  row: PointsRow
  badges: Badge[]
  isCurrentUser: boolean
}

const RANK_STYLES: Record<number, { card: string; icon: React.ElementType; iconClass: string }> = {
  1: {
    card: "bg-gradient-to-br from-yellow-400/20 via-amber-300/10 to-transparent border-yellow-400/40",
    icon: Trophy,
    iconClass: "text-yellow-400",
  },
  2: {
    card: "bg-gradient-to-br from-slate-300/20 via-slate-200/10 to-transparent border-slate-300/40",
    icon: Medal,
    iconClass: "text-slate-300",
  },
  3: {
    card: "bg-gradient-to-br from-amber-700/20 via-amber-600/10 to-transparent border-amber-700/40",
    icon: Medal,
    iconClass: "text-amber-600",
  },
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export default function RankCard({ rank, row, badges, isCurrentUser }: RankCardProps) {
  const topStyle = RANK_STYLES[rank]
  const userBadges = badges.filter((b) => b.userId === row.userId)
  const hasPodChampion = userBadges.some((b) => b.type === "pod_champion")

  const Icon = topStyle?.icon

  return (
    <li
      data-testid="rank-card"
      data-current-user={isCurrentUser ? "true" : "false"}
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4",
        topStyle?.card,
        isCurrentUser && "ring-2 ring-primary bg-primary/10"
      )}
    >
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {Icon ? <Icon className={cn("w-5 h-5", topStyle?.iconClass)} /> : (
          <span className="text-sm font-semibold text-muted-foreground">{rank}</span>
        )}
      </div>

      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
        {initials(row.name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{row.name}</p>
          {hasPodChampion && (
            <span
              title={BADGE_DEFINITIONS.pod_champion.description}
              tabIndex={0}
              className="text-xs"
            >
              👑
            </span>
          )}
          {userBadges
            .filter((b) => b.type !== "pod_champion")
            .map((b) => {
              const def = BADGE_DEFINITIONS[b.type]
              return (
                <span
                  key={b._id}
                  title={def.description}
                  tabIndex={0}
                  className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground"
                >
                  {def.name}
                </span>
              )
            })}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold" data-testid="rank-window-points">{row.windowPoints} pts</p>
        {rank <= 3 && (
          <p className="text-xs text-muted-foreground" data-testid="rank-alltime-points">
            {row.allTimePoints} all-time
          </p>
        )}
      </div>
    </li>
  )
}
