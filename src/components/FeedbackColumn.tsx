"use client"

import type { FeedbackItem, FeedbackCategory } from '@/types'
import { sortByUpvotes } from '@/services/feedbackService'
import FeedbackCard from '@/components/FeedbackCard'

interface ColumnConfig {
  title: string
  colorClass: string
  bgColorClass: string
  glowShadow: string
  emptyText: string
}

const COLUMN_CONFIG: Record<FeedbackCategory, ColumnConfig> = {
  'slowed-us-down': {
    title: 'What Slowed Us Down?',
    colorClass: 'text-red-500',
    bgColorClass: 'bg-red-500',
    glowShadow: 'shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    emptyText: 'No blockers reported yet. Be the first to share.',
  },
  'should-try': {
    title: 'What Should We Try?',
    colorClass: 'text-blue-500',
    bgColorClass: 'bg-blue-500',
    glowShadow: 'shadow-[0_0_8px_rgba(59,130,246,0.8)]',
    emptyText: 'No suggestions yet. What would help the team?',
  },
  'went-well': {
    title: 'What Went Well?',
    colorClass: 'text-emerald-500',
    bgColorClass: 'bg-emerald-500',
    glowShadow: 'shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    emptyText: 'Nothing logged yet. Share a win!',
  },
}

interface FeedbackColumnProps {
  category: FeedbackCategory
  items: FeedbackItem[]
  onUpvote: (itemId: string) => void
  currentUserId: string
  onConvert?: (item: FeedbackItem) => void
  isAdmin?: boolean
}

export default function FeedbackColumn({ category, items, onUpvote, currentUserId, onConvert, isAdmin }: FeedbackColumnProps) {
  const config = COLUMN_CONFIG[category]
  const sorted = sortByUpvotes(items)

  return (
    <div className="flex flex-col bg-secondary/20 rounded-xl border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-secondary/40 flex items-center justify-between shrink-0">
        <h2 className={`font-semibold ${config.colorClass} flex items-center gap-2`}>
          <span
            className={`w-2 h-2 rounded-full ${config.bgColorClass} ${config.glowShadow}`}
          />
          {config.title}
        </h2>
        <span className="text-xs font-medium bg-secondary px-2 py-1 rounded text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div className="p-4 overflow-y-auto space-y-4">
        {sorted.length === 0 ? (
          <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center text-sm text-muted-foreground bg-secondary/10 min-h-[120px] flex items-center justify-center">
            {config.emptyText}
          </div>
        ) : (
          sorted.map((item) => (
            <FeedbackCard
              key={item._id}
              item={item}
              authorName=""
              currentUserId={currentUserId}
              onUpvote={() => onUpvote(item._id)}
              onConvert={onConvert}
              isAdmin={isAdmin ?? false}
            />
          ))
        )}
      </div>
    </div>
  )
}
