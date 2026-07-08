"use client"

import { ThumbsUp } from "lucide-react"
import type { FeedbackItem } from "@/types"
import { CATEGORY_CONFIG } from "@/types"

interface TopVotedFeedbackSectionProps {
  items: FeedbackItem[]
}

export default function TopVotedFeedbackSection({ items }: TopVotedFeedbackSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold mb-4">Top Voted Feedback</h2>
      {items.length === 0 ? (
        <p data-testid="top-voted-empty" className="text-sm text-muted-foreground">
          No feedback yet this period.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const config = CATEGORY_CONFIG[item.category]
            return (
              <div
                key={item._id}
                data-testid="top-voted-item"
                className={`flex items-start gap-3 rounded-lg border-l-4 p-3 bg-secondary/20 ${config.borderColor}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{item.content}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <ThumbsUp className="w-3 h-3" />
                  {item.upvotes}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
