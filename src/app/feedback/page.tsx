// @ts-nocheck
"use client"

import { useState } from "react"
import { useRetro } from "@/store/retro-store"
import { SprintSelector } from "@/components/sprint-selector"
import { FeedbackCard } from "@/components/feedback-card"
import { FeedbackForm } from "@/components/feedback-form"
import { FeedbackCategory, CATEGORY_CONFIG } from "@/types"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export default function FeedbackPage() {
  const {
    getFeedbackByCategory,
    selectedSprintId,
    activeSprint,
    users,
    createActionItem,
  } = useRetro()

  const [actionModal, setActionModal] = useState<string | null>(null)
  const [actionTitle, setActionTitle] = useState("")
  const [actionDesc, setActionDesc] = useState("")
  const [actionOwner, setActionOwner] = useState("")
  const [actionDeadline, setActionDeadline] = useState("")

  const isActiveSprint = selectedSprintId === activeSprint.id

  const categories: FeedbackCategory[] = ["slowed-us-down", "should-try", "went-well"]

  function handleCreateAction(feedbackId: string) {
    setActionModal(feedbackId)
    setActionTitle("")
    setActionDesc("")
    setActionOwner("")
    setActionDeadline("")
  }

  function handleSubmitAction() {
    if (!actionModal || !actionTitle || !actionOwner || !actionDeadline) return
    createActionItem(actionModal, actionTitle, actionDesc, actionOwner, actionDeadline)
    setActionModal(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedback Board</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share, upvote, and convert feedback into action items
          </p>
        </div>
        <SprintSelector />
      </div>

      {isActiveSprint && <FeedbackForm />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const config = CATEGORY_CONFIG[category]
          const items = getFeedbackByCategory(category)

          return (
            <div key={category} className="space-y-3">
              <div className={cn("rounded-xl border p-4", config.borderColor, config.bgColor)}>
                <h2 className={cn("text-sm font-bold", config.color)}>{config.label}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">{config.prompt}</p>
                <div className="mt-1 text-xs font-semibold text-muted-foreground">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-muted-foreground">No feedback yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <FeedbackCard
                      key={item.id}
                      item={item}
                      onCreateAction={isActiveSprint ? handleCreateAction : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create Action Item Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Action Item</h3>
              <button onClick={() => setActionModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                <input
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder="Concise action title..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <textarea
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                  placeholder="What needs to be done?"
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Owner</label>
                <select
                  value={actionOwner}
                  onChange={(e) => setActionOwner(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select owner...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Deadline</label>
                <input
                  type="date"
                  value={actionDeadline}
                  onChange={(e) => setActionDeadline(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setActionModal(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAction}
                disabled={!actionTitle || !actionOwner || !actionDeadline}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create (+20 pts)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
