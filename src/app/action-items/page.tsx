"use client"

import { useRetro } from "@/store/retro-store"
import { SprintSelector } from "@/components/sprint-selector"
import { cn } from "@/lib/utils"
import {
  Circle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  User,
  CalendarDays,
} from "lucide-react"
import { useState } from "react"

const STATUS_CONFIG = {
  open: { label: "Open", icon: Circle, color: "text-slate-500", bg: "bg-slate-100" },
  "in-progress": { label: "In Progress", icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
  verified: { label: "Verified", icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-100" },
}

export default function ActionItemsPage() {
  const {
    actionItems,
    selectedSprintId,
    getUserById,
    feedback,
    updateActionItemStatus,
    activeSprint,
  } = useRetro()

  const [impactModal, setImpactModal] = useState<string | null>(null)
  const [impactText, setImpactText] = useState("")

  const sprintActions = actionItems.filter((a) => a.sprintId === selectedSprintId)
  const isActiveSprint = selectedSprintId === activeSprint.id

  function handleStatusChange(actionId: string, newStatus: string) {
    if (newStatus === "verified") {
      setImpactModal(actionId)
      setImpactText("")
      return
    }
    updateActionItemStatus(actionId, newStatus as any)
  }

  function handleVerify() {
    if (!impactModal || !impactText.trim()) return
    updateActionItemStatus(impactModal, "verified", impactText.trim())
    setImpactModal(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Action Items</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track actions from feedback to verified improvement
          </p>
        </div>
        <SprintSelector />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["open", "in-progress", "completed", "verified"] as const).map((status) => {
          const config = STATUS_CONFIG[status]
          const count = sprintActions.filter((a) => a.status === status).length
          return (
            <div key={status} className={cn("rounded-lg border p-3", config.bg, "border-transparent")}>
              <div className="flex items-center gap-2">
                <config.icon className={cn("h-4 w-4", config.color)} />
                <span className={cn("text-xs font-semibold", config.color)}>{config.label}</span>
              </div>
              <p className={cn("text-2xl font-bold mt-1", config.color)}>{count}</p>
            </div>
          )
        })}
      </div>

      {/* Action Items List */}
      {sprintActions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No action items for this sprint yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Convert highly-upvoted feedback into action items from the Feedback Board.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sprintActions.map((action) => {
            const owner = getUserById(action.ownerId)
            const statusConfig = STATUS_CONFIG[action.status]
            const sourceFeedback = feedback.find((f) => f.id === action.feedbackId)

            return (
              <div
                key={action.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          statusConfig.bg,
                          statusConfig.color
                        )}
                      >
                        <statusConfig.icon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{action.description}</p>

                    {sourceFeedback && (
                      <div className="mt-3 rounded-lg bg-muted/50 border border-border p-3">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          Source Feedback
                        </p>
                        <p className="text-xs text-foreground">{sourceFeedback.content}</p>
                      </div>
                    )}

                    {action.impactDescription && (
                      <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Verified Impact
                        </p>
                        <p className="text-xs text-emerald-800">{action.impactDescription}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground shrink-0">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" /> {owner?.name}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> Due{" "}
                      {new Date(action.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {action.completedAt && (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Done{" "}
                        {new Date(action.completedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Change Buttons */}
                {isActiveSprint && action.status !== "verified" && (
                  <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-2">Move to:</span>
                    {action.status === "open" && (
                      <button
                        onClick={() => handleStatusChange(action.id, "in-progress")}
                        className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        In Progress
                      </button>
                    )}
                    {action.status === "in-progress" && (
                      <button
                        onClick={() => handleStatusChange(action.id, "completed")}
                        className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200 transition-colors"
                      >
                        Completed (+30 pts)
                      </button>
                    )}
                    {action.status === "completed" && (
                      <button
                        onClick={() => handleStatusChange(action.id, "verified")}
                        className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-200 transition-colors"
                      >
                        Verify Improvement (+50 pts)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Impact Verification Modal */}
      {impactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-xl mx-4">
            <h3 className="text-lg font-semibold mb-2">Verify Improvement</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Describe the measurable improvement this action item produced.
            </p>
            <textarea
              value={impactText}
              onChange={(e) => setImpactText(e.target.value)}
              placeholder="e.g., Deploy success rate improved from 70% to 95%. Zero flaky test failures in the last sprint."
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setImpactModal(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={!impactText.trim()}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Verify (+50 pts)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
