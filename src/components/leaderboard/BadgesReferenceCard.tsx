import { MessageSquare, Zap, Lightbulb, Wrench, Users, Crown, type LucideIcon } from "lucide-react"
import { BADGE_DEFINITIONS, type BadgeType } from "@/types"

const ICON_MAP: Record<string, LucideIcon> = {
  MessageSquare,
  Zap,
  Lightbulb,
  Wrench,
  Users,
  Crown,
}

export default function BadgesReferenceCard() {
  const types = Object.keys(BADGE_DEFINITIONS) as BadgeType[]

  return (
    <div
      data-testid="badges-reference-card"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold mb-3">Badges</h2>
      <div className="space-y-3">
        {types.map((type) => {
          const def = BADGE_DEFINITIONS[type]
          const Icon = ICON_MAP[def.icon]
          return (
            <div key={type} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0">
                {Icon && <Icon className="w-4 h-4 text-primary" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{def.name}</p>
                <p className="text-xs text-muted-foreground">{def.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
