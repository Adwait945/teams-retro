import { useEffect, useState } from "react"
import { getCurrentUser } from "@/services/userService"
import type { FeedbackItem } from "@/types"
import type { PointsRow } from "@/lib/pointsEngine"
import { getPriorPeriodBounds, type DashboardWindow } from "@/lib/utils/categoryDelta"

interface DashboardExtras {
  pointsData: PointsRow[] | null
  isLoadingPoints: boolean
  priorFeedbackItems: FeedbackItem[] | null
}

/**
 * Sprint 7, Session 5 (Epic 7.4): the two new, independent data sources that
 * feed the Pod MVP and Category Breakdown sections. Extracted from
 * `src/app/dashboard/page.tsx` into its own hook purely to keep that file
 * under the 200-line cap — no behavioral change from the inline version.
 * Per ADR-0002, this hook is entirely additive and does not touch the
 * pre-existing feedback/actions/users `Promise.all` fetch or `isLoading`
 * gate, which remain in `page.tsx` unmodified.
 */
export function useDashboardExtras(activeWindow: DashboardWindow): DashboardExtras {
  const [pointsData, setPointsData] = useState<PointsRow[] | null>(null)
  const [isLoadingPoints, setIsLoadingPoints] = useState(true)
  const [priorFeedbackItems, setPriorFeedbackItems] = useState<FeedbackItem[] | null>(null)

  // Independent Pod MVP fetch — ADR-0002 hybrid loading model.
  useEffect(() => {
    const user = getCurrentUser()
    if (!user) return

    const controller = new AbortController()
    setIsLoadingPoints((prev) => (prev ? prev : true))
    fetch(`/api/points?pod=${encodeURIComponent(user.pod)}&window=${activeWindow}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setPointsData(Array.isArray(data) ? data : [])
        setIsLoadingPoints(false)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setPointsData([])
        setIsLoadingPoints(false)
      })

    return () => {
      controller.abort()
    }
  }, [activeWindow])

  // Prior-period feedback fetch for Category Breakdown deltas (AC-7.4.3/7.4.4).
  // getWindowFilter only supports 7d/30d/all bounds, so a bounded prior-period
  // range isn't directly expressible as a `?window=` param — instead we fetch
  // the full unwindowed feedback set once per window change and derive the
  // prior-period counts client-side against categoryDelta.ts's date bounds.
  useEffect(() => {
    if (getPriorPeriodBounds(activeWindow) === null) {
      setPriorFeedbackItems((prev) => (prev === null ? prev : null))
      return
    }

    const controller = new AbortController()
    fetch('/api/feedback?window=all', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setPriorFeedbackItems(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setPriorFeedbackItems([])
      })

    return () => {
      controller.abort()
    }
  }, [activeWindow])

  return { pointsData, isLoadingPoints, priorFeedbackItems }
}
