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

function getDueDateLabel(dueDate: string | null | undefined): { text: string; className: string } {
  if (!dueDate) return { text: 'No due date', className: 'text-muted-foreground' }
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { text: 'Overdue', className: 'text-red-600 font-medium' }
  if (diffDays === 0) return { text: 'Due today', className: 'text-amber-600 font-medium' }
  return { text: `Due in ${diffDays} days`, className: 'text-muted-foreground' }
}

export default function ActionItemCard({ item, ownerName, onAdvance, onRegress, onVerify }: ActionItemCardProps) {
  const dueDateInfo = getDueDateLabel(item.dueDate)

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

      {/* Source quote block — blue inset */}
      {item.sourceQuote && (
        <div
          data-testid="source-quote-block"
          className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 text-sm px-3 py-2 rounded-r-md my-2"
        >
          &ldquo;{item.sourceQuote}&rdquo;
        </div>
      )}

      {/* Impact note block — emerald inset */}
      {item.status === 'verified' && item.impactNote && (
        <div
          data-testid="impact-note-block"
          className="bg-emerald-50 border-l-4 border-emerald-400 text-emerald-800 text-sm px-3 py-2 rounded-r-md my-2"
        >
          <span className="font-semibold text-xs uppercase tracking-wide block mb-1">Impact</span>
          {item.impactNote}
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
          <span data-testid="due-date-label" className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${dueDateInfo.className}`}>
            {dueDateInfo.text}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {item.status !== 'verified' && item.status !== 'open' && (
            <button
              onClick={() => onRegress(item._id)}
              data-testid="regress-btn"
              className="text-xs font-medium px-2.5 py-1 rounded bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors"
            >
              ← Regress
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
