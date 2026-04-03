"use client"

import { useState } from "react"
import { Send, EyeOff, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { FeedbackCategory, CATEGORY_CONFIG } from "@/types"
import { useRetro } from "@/store/retro-store"

export function FeedbackForm() {
  const { submitFeedback } = useRetro()
  const [category, setCategory] = useState<FeedbackCategory>("slowed-us-down")
  const [content, setContent] = useState("")
  const [suggestedImprovement, setSuggestedImprovement] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState("")

  const needsImprovement = category === "slowed-us-down"
  const config = CATEGORY_CONFIG[category]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!content.trim()) {
      setError("Feedback content is required.")
      return
    }

    if (needsImprovement && !suggestedImprovement.trim()) {
      setError("A suggested improvement is required for 'What slowed us down?' items. No orphan complaints!")
      return
    }

    submitFeedback(category, content.trim(), suggestedImprovement.trim(), isAnonymous)
    setContent("")
    setSuggestedImprovement("")
    setIsAnonymous(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold mb-4">Share Feedback</h3>

      <div className="flex gap-2 mb-4">
        {(Object.entries(CATEGORY_CONFIG) as [FeedbackCategory, typeof config][]).map(
          ([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setCategory(key)
                setError("")
              }}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all text-center",
                category === key
                  ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {cfg.label}
            </button>
          )
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-3">{config.prompt}</p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Describe the feedback clearly and constructively..."
        rows={3}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />

      {needsImprovement && (
        <div className="mt-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-amber-700 mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Suggested Improvement (required)
          </label>
          <textarea
            value={suggestedImprovement}
            onChange={(e) => setSuggestedImprovement(e.target.value)}
            placeholder="How can we fix this? Propose a concrete action..."
            rows={2}
            className="w-full rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs font-medium text-destructive">{error}</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer",
              isAnonymous ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                isAnonymous ? "translate-x-4" : "translate-x-1"
              )}
            />
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <EyeOff className="h-3.5 w-3.5" />
            Anonymous
          </span>
        </label>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Send className="h-4 w-4" />
          Submit (+5 pts)
        </button>
      </div>
    </form>
  )
}
