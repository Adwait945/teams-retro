"use client"

interface FeedbackByCategory {
  'slowed-us-down': number
  'should-try': number
  'went-well': number
}

interface ActionsByStatus {
  open: number
  'in-progress': number
  completed: number
  verified: number
}

interface MetricsGridProps {
  totalFeedback: number
  feedbackByCategory: FeedbackByCategory
  totalActions: number
  actionsByStatus: ActionsByStatus
  completionRate: string
  verificationRate: string
}

// Extracted verbatim from src/app/dashboard/page.tsx (Sprint 7, Session 5) to
// stay under the 200-line file cap. No testids, classes, or computation
// logic were changed — this is a pure JSX relocation of the pre-existing,
// untouched metrics grid (AC-7.4.8).
export default function MetricsGrid({
  totalFeedback,
  feedbackByCategory,
  totalActions,
  actionsByStatus,
  completionRate,
  verificationRate,
}: MetricsGridProps) {
  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Total Feedback</p>
          <p className="text-2xl font-bold" data-testid="metric-feedback-total">{totalFeedback}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Slowed Us Down</p>
          <p className="text-2xl font-bold" data-testid="metric-feedback-slowed">{feedbackByCategory['slowed-us-down']}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Should Try</p>
          <p className="text-2xl font-bold" data-testid="metric-feedback-should">{feedbackByCategory['should-try']}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Went Well</p>
          <p className="text-2xl font-bold" data-testid="metric-feedback-well">{feedbackByCategory['went-well']}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Total Actions</p>
          <p className="text-2xl font-bold" data-testid="metric-actions-total">{totalActions}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Open</p>
          <p className="text-2xl font-bold" data-testid="metric-actions-open">{actionsByStatus.open}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">In Progress</p>
          <p className="text-2xl font-bold" data-testid="metric-actions-inprogress">{actionsByStatus['in-progress']}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-bold" data-testid="metric-actions-completed">{actionsByStatus.completed}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Verified</p>
          <p className="text-2xl font-bold" data-testid="metric-actions-verified">{actionsByStatus.verified}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Completion Rate</p>
          <p className="text-2xl font-bold" data-testid="metric-completion-rate">{completionRate}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Verification Rate</p>
          <p className="text-2xl font-bold" data-testid="metric-verification-rate">{verificationRate}</p>
        </div>
      </div>
    </>
  )
}
