"use client"

type DashboardWindow = '7d' | '30d' | 'all'

interface WindowTabsProps {
  activeWindow: DashboardWindow
  onChange: (w: DashboardWindow) => void
}

const LABELS: Record<DashboardWindow, string> = {
  '7d': 'This Week',
  '30d': 'This Month',
  'all': 'All-Time',
}

// Extracted verbatim from src/app/dashboard/page.tsx (Sprint 7, Session 5) to
// stay under the 200-line file cap. No testids, classes, or computation
// logic were changed — pure JSX relocation of the pre-existing, untouched
// window-toggle row (AC-7.4.8).
export default function WindowTabs({ activeWindow, onChange }: WindowTabsProps) {
  return (
    <div className="flex gap-2">
      {(['7d', '30d', 'all'] as const).map((w) => (
        <button
          key={w}
          data-testid={`tab-${w}`}
          onClick={() => onChange(w)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeWindow === w
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          {LABELS[w]}
        </button>
      ))}
    </div>
  )
}
