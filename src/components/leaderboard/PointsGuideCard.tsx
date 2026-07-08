import { POINT_VALUES, type PointAction } from "@/types"

const POINT_LABELS: Record<PointAction, string> = {
  submit_feedback: "Submit feedback",
  receive_upvote: "Receive an upvote",
  remove_upvote: "Upvote removed",
  convert_action: "Feedback converted to action",
  complete_action: "Complete an action item",
  verify_action: "Verify an action's impact",
}

function formatPoints(value: number): string {
  return value < 0 ? `−${Math.abs(value)}` : `+${value}`
}

export default function PointsGuideCard() {
  const actions = Object.keys(POINT_VALUES) as PointAction[]

  return (
    <div
      data-testid="points-guide-card"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold mb-3">Points Guide</h2>
      <div className="space-y-2">
        {actions.map((action) => {
          const value = POINT_VALUES[action]
          return (
            <div key={action} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{POINT_LABELS[action]}</span>
              <span className={value < 0 ? "text-red-400 font-medium" : "text-emerald-400 font-medium"}>
                {formatPoints(value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
