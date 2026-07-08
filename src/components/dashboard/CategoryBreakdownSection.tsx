"use client"

import type { FeedbackItem, FeedbackCategory } from "@/types"
import { CATEGORY_CONFIG } from "@/types"
import {
  getPriorPeriodBounds,
  formatCategoryDelta,
  countInPriorPeriod,
  type DashboardWindow,
} from "@/lib/utils/categoryDelta"

interface CategoryBreakdownSectionProps {
  current: FeedbackItem[]
  prior: FeedbackItem[] | null
  window: DashboardWindow
}

const CATEGORIES: { category: FeedbackCategory; testSuffix: string }[] = [
  { category: 'slowed-us-down', testSuffix: 'slowed' },
  { category: 'should-try', testSuffix: 'should' },
  { category: 'went-well', testSuffix: 'well' },
]

export default function CategoryBreakdownSection({
  current,
  prior,
  window,
}: CategoryBreakdownSectionProps) {
  const bounds = getPriorPeriodBounds(window)

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold mb-4">Category Breakdown</h2>
      <div className="grid grid-cols-3 gap-4">
        {CATEGORIES.map(({ category, testSuffix }) => {
          const config = CATEGORY_CONFIG[category]
          const count = current.filter((f) => f.category === category).length
          const priorCount =
            bounds && prior ? countInPriorPeriod(prior, category, bounds) : null
          const deltaText = formatCategoryDelta(count, priorCount)

          return (
            <div
              key={category}
              className={`rounded-lg border p-3 ${config.bgColor} ${config.borderColor}`}
            >
              <p className={`text-xs font-medium mb-1 ${config.color}`}>{config.label}</p>
              <p
                className={`text-2xl font-bold ${config.color}`}
                data-testid={`category-breakdown-${testSuffix}`}
              >
                {count}
                {window !== 'all' && deltaText && (
                  <span
                    data-testid={`category-delta-${testSuffix}`}
                    className="block text-xs font-normal text-muted-foreground mt-1"
                  >
                    {deltaText}
                  </span>
                )}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
