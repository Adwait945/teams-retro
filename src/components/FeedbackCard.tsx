"use client"

import { ThumbsUp, User } from 'lucide-react'
import type { FeedbackItem, FeedbackCategory } from '@/types'
import { getAuthorDisplay } from '@/services/feedbackService'

const BORDER_CLASS: Record<FeedbackCategory, string> = {
  'slowed-us-down': 'border-left-red',
  'should-try': 'border-left-blue',
  'went-well': 'border-left-emerald',
}

interface FeedbackCardProps {
  item: FeedbackItem
  authorName: string
  onUpvote: () => void
}

export default function FeedbackCard({ item, authorName, onUpvote }: FeedbackCardProps) {
  const borderClass = BORDER_CLASS[item.category]
  const displayName = getAuthorDisplay(item, authorName)
  const isAnon = item.isAnonymous

  return (
    <div className={`retro-card p-4 ${borderClass} group`}>
      <p className="text-sm leading-relaxed mb-4 text-slate-200">{item.content}</p>

      {item.suggestion && (
        <div className="mb-4 bg-secondary/50 rounded p-3 border border-border/50">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Suggested Improvement
          </div>
          <p className="text-xs text-slate-300 italic">&ldquo;{item.suggestion}&rdquo;</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAnon ? (
            <div className="w-6 h-6 rounded-full bg-slate-700 border border-border flex items-center justify-center">
              <User className="w-3 h-3 opacity-50" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-700 border border-border text-[10px] font-medium flex items-center justify-center">
              {displayName[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <span className="text-xs text-muted-foreground">{displayName}</span>
        </div>

        <button
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50 hover:bg-secondary text-xs font-medium transition-colors"
          onClick={onUpvote}
          aria-label="Upvote"
          data-testid="upvote-btn"
        >
          <ThumbsUp className="w-3 h-3 text-muted-foreground" />
          {item.upvotes}
        </button>
      </div>
    </div>
  )
}
