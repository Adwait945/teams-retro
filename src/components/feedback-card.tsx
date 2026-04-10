// @ts-nocheck
"use client"

import { ThumbsUp, ArrowRight, Eye, EyeOff, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { FeedbackItem, CATEGORY_CONFIG } from "@/types"
import { useRetro } from "@/store/retro-store"
import { formatDistanceToNow } from "date-fns"

interface FeedbackCardProps {
  item: FeedbackItem
  onCreateAction?: (feedbackId: string) => void
}

export function FeedbackCard({ item, onCreateAction }: FeedbackCardProps) {
  const { upvoteFeedback, getUserById, currentUserId } = useRetro()
  const author = getUserById(item.authorId)
  const config = CATEGORY_CONFIG[item.category]
  const hasUpvoted = item.upvotes.includes(currentUserId)
  const isOwnItem = item.authorId === currentUserId

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all hover:shadow-md",
        config.borderColor,
        config.bgColor
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-relaxed">{item.content}</p>

          {item.suggestedImprovement && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/60 border border-white/80 p-3">
              <ArrowRight className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.color)} />
              <p className="text-sm text-muted-foreground">
                <span className={cn("font-medium", config.color)}>Suggested: </span>
                {item.suggestedImprovement}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => !hasUpvoted && !isOwnItem && upvoteFeedback(item.id)}
            disabled={hasUpvoted || isOwnItem}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              hasUpvoted
                ? "bg-primary/10 text-primary"
                : isOwnItem
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-white/80 text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer"
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>{item.upvotes.length}</span>
          </button>

          {item.actionItemId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              Action Created
            </span>
          )}

          {!item.actionItemId && item.upvotes.length >= 3 && onCreateAction && (
            <button
              onClick={() => onCreateAction(item.id)}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              Convert to Action
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {item.isAnonymous ? (
            <span className="inline-flex items-center gap-1">
              <EyeOff className="h-3 w-3" /> Anonymous
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                {author?.avatar}
              </div>
              {author?.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  )
}
