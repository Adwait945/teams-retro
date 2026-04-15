"use client"

import type { ActionItem } from '@/types'

interface ActionItemCardProps {
  item: ActionItem
  ownerName: string
  onAdvance: (itemId: string) => void
  onRegress: (itemId: string) => void
  onVerify: (item: ActionItem) => void
}

const STATUS_DISPLAY: Record<ActionItem['status'], string> = {
  'open': 'Open',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'verified': 'Verified',
}

const STATUS_COLOR: Record<ActionItem['status'], string> = {
  'open': 'bg-slate-700 text-slate-300',
  'in-progress': 'bg-blue-500/20 text-blue-400',
  'completed': 'bg-emerald-500/20 text-emerald-400',
  'verified': 'bg-purple-500/20 text-purple-400',
}

export default function ActionItemCard({ item, ownerName, onAdvance, onRegress, onVerify }: ActionItemCardProps) {
  const today = new Date().toISOString().slice(0, 10)
  const dueDateStr = item.dueDate ? item.dueDate.slice(0, 10) : ''
  const dueDateLabel = dueDateStr === today ? 'Due Today' : dueDateStr ? 'Due This Sprint' : ''

  const showSourceFeedback = item.sourceFeedbackId !== '' && item.sourceQuote !== ''
  const showImpactNote = item.status === 'verified' && !!item.impactNote

  return (
    <div className="retro-card p-4 border border-border/50 rounded-lg bg-secondary/20 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100 leading-snug flex-1">{item.title}</h3>
        <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_COLOR[item.status]}`}>
          {STATUS_DISPLAY[item.status]}
        </span>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
      )}

      {/* Source feedback block */}
      {showSourceFeedback && (
        <div className="bg-secondary/50 rounded p-2.5 border border-border/40">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Source Feedback
          </div>
          <p className="text-xs text-slate-300 italic">&ldquo;{item.sourceQuote}&rdquo;</p>
        </div>
      )}

      {/* Impact note block */}
      {showImpactNote && (
        <div className="bg-purple-500/10 rounded p-2.5 border border-purple-500/30">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 mb-1">
            Verified Impact
          </div>
          <p className="text-xs text-slate-300">{item.impactNote}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {/* Owner avatar */}
          <div className="w-6 h-6 rounded-full bg-slate-700 border border-border text-[10px] font-medium flex items-center justify-center text-slate-200">
            {ownerName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground">{ownerName}</span>
          {/* Due date label */}
          {dueDateLabel && (
            <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              {dueDateLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(item.status === 'in-progress' || item.status === 'completed') && (
            <button
              onClick={() => onRegress(item._id)}
              data-testid="regress-btn"
              className="text-xs font-medium px-2.5 py-1 rounded bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors"
            >
              Move Back
            </button>
          )}
          {(item.status === 'open' || item.status === 'in-progress') && (
            <button
              onClick={() => onAdvance(item._id)}
              data-testid="advance-btn"
              className="text-xs font-medium px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              Advance Status
            </button>
          )}
          {item.status === 'completed' && (
            <button
              onClick={() => onVerify(item)}
              data-testid="verify-btn"
              className="text-xs font-medium px-2.5 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
            >
              Verify Impact
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
