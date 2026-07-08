"use client"

import type { ActionItem } from "@/types"

interface VerifiedImprovementsSectionProps {
  items: ActionItem[]
}

export default function VerifiedImprovementsSection({ items }: VerifiedImprovementsSectionProps) {
  return (
    <div
      data-testid="verified-improvements-section"
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold mb-4">Verified Improvements</h2>
      {items.length === 0 ? (
        <p data-testid="verified-improvements-empty" className="text-sm text-muted-foreground">
          No verified improvements yet this period.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"
            >
              <p className="text-sm font-medium text-emerald-700">{item.title}</p>
              <p className="text-sm text-emerald-700/90 mt-1">{item.impactNote}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
