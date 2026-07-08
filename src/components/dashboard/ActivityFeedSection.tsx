"use client"

interface FeedEntry {
  text: string
  timestamp: string
}

interface ActivityFeedSectionProps {
  feed: FeedEntry[]
}

// Extracted verbatim from src/app/dashboard/page.tsx (Sprint 7, Session 5) to
// stay under the 200-line file cap. No testids, classes, or computation
// logic were changed — pure JSX relocation of the pre-existing, untouched
// Activity Feed section (AC-7.4.8).
export default function ActivityFeedSection({ feed }: ActivityFeedSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold mb-4">Activity Feed</h2>
      <div data-testid="activity-feed">
        {feed.length === 0
          ? <p data-testid="activity-feed-empty" className="text-sm text-muted-foreground">No activity yet</p>
          : feed.map((entry, i) => (
              <div key={i} data-testid="feed-entry" className="text-sm py-1 border-b border-border/30 last:border-0">
                {entry.text}
              </div>
            ))
        }
      </div>
    </div>
  )
}
