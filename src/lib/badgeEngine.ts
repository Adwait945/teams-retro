import { connectDB } from '@/lib/db'
import BadgeModel from '@/lib/models/Badge'
import PointEventModel from '@/lib/models/PointEvent'
import { getPodLeaderboard } from '@/lib/pointsEngine'
import type { BadgeType } from '@/types'
import {
  checkFeedbackMachine,
  checkActionTaker,
  checkInnovator,
  checkProblemSolver,
  checkConsensusBuilder,
} from '@/lib/badgeChecks'

const PERMANENT_CHECKS: Array<{ type: BadgeType; check: (userId: string) => Promise<boolean> }> = [
  { type: 'feedback_machine', check: checkFeedbackMachine },
  { type: 'action_taker', check: checkActionTaker },
  { type: 'innovator', check: checkInnovator },
  { type: 'problem_solver', check: checkProblemSolver },
  { type: 'consensus_builder', check: checkConsensusBuilder },
]

async function awardIfQualified(userId: string, podId: string, type: BadgeType): Promise<void> {
  const existing = await BadgeModel.findOne({ userId, type, podId })
  if (existing) return

  try {
    await BadgeModel.create({ userId, podId, type })
  } catch (err) {
    const code = (err as { code?: number })?.code
    if (code === 11000) {
      // Duplicate-key race — another concurrent evaluation already awarded it.
      console.warn(`[badgeEngine] duplicate badge award suppressed for ${userId}/${type}/${podId}`)
      return
    }
    throw err
  }
}

// Walks a single user's PointEvents within the trailing 30-day window in
// chronological order (oldest first), accumulating `points` until the
// running total first reaches `targetTotal`. Returns the `createdAt` of the
// specific PointEvent at which that happened, matching AC-7.2.10's "the one
// whose qualifying PointEvent reached that total first" tie-break rule.
//
// Uses repeated `findOne(...).sort(...)` calls with an advancing cursor
// (rather than `find(...)`) to stay within the PointEvent model's read
// surface used elsewhere in this file. A hard iteration cap guards against
// runaway loops if the cursor ever fails to advance.
const MAX_WALK_ITERATIONS = 500

async function findReachedAt(userId: string, since: Date, targetTotal: number): Promise<Date> {
  let runningTotal = 0
  let cursor: { createdAt: Date; _id?: unknown } | null = null
  let lastSeenAt: Date | null = null

  for (let i = 0; i < MAX_WALK_ITERATIONS; i++) {
    const query: Record<string, unknown> = { userId, createdAt: { $gte: since } }
    if (cursor) {
      query.$or = [
        { createdAt: { $gt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $gt: cursor._id } },
      ]
    }

    const event = await PointEventModel.findOne(query).sort({ createdAt: 1, _id: 1 })
    if (!event) break

    // Defend against a cursor that fails to advance (e.g. a test double or
    // any query implementation that ignores the cursor filter) — treat a
    // repeated identical timestamp as "no more events" rather than looping.
    if (lastSeenAt && event.createdAt.getTime() === lastSeenAt.getTime()) break
    lastSeenAt = event.createdAt

    runningTotal += event.points ?? 0
    if (runningTotal >= targetTotal) {
      return event.createdAt
    }

    cursor = { createdAt: event.createdAt, _id: (event as { _id?: unknown })._id }
  }

  // No event within the window accounted for the full tied total (e.g. the
  // window's aggregate sum came from events this walk couldn't resolve one
  // by one, or `points` were unavailable) — fall back to "never reached",
  // which sorts last and cannot win the tie-break over a user we did
  // resolve a reach-time for.
  return new Date(8640000000000000) // Number.MAX date — always sorts last
}

async function evaluatePodChampion(podId: string): Promise<void> {
  const leaderboard = await getPodLeaderboard(podId, '30d')
  if (leaderboard.length === 0) return

  const currentTop = leaderboard[0]
  const existing = await BadgeModel.findOne({ podId, type: 'pod_champion' })

  if (!existing) {
    await BadgeModel.create({ userId: currentTop.userId, podId, type: 'pod_champion' })
    return
  }

  if (existing.userId === currentTop.userId) {
    return
  }

  // Tie-break: among users tied for the top windowPoints total, prefer whoever
  // has the earliest qualifying PointEvent (i.e. reached that total first).
  // On a true tie of earliest timestamps, prefer the existing holder.
  const tiedUserIds = leaderboard
    .filter((row) => row.windowPoints === currentTop.windowPoints)
    .map((row) => row.userId)

  let winnerId = currentTop.userId
  if (tiedUserIds.length > 1) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const earliestByUser = await Promise.all(
      tiedUserIds.map(async (userId) => ({
        userId,
        earliestAt: await findReachedAt(userId, since, currentTop.windowPoints),
      }))
    )
    earliestByUser.sort((a, b) => {
      const diff = a.earliestAt.getTime() - b.earliestAt.getTime()
      if (diff !== 0) return diff
      // true tie — prefer existing holder
      if (a.userId === existing.userId) return -1
      if (b.userId === existing.userId) return 1
      return 0
    })
    winnerId = earliestByUser[0].userId
  }

  if (winnerId === existing.userId) {
    return
  }

  await BadgeModel.deleteOne({ _id: existing._id })
  await BadgeModel.create({ userId: winnerId, podId, type: 'pod_champion' })
}

export async function evaluateBadges(userId: string, podId: string): Promise<void> {
  await connectDB()

  for (const { type, check } of PERMANENT_CHECKS) {
    const qualifies = await check(userId)
    if (qualifies) {
      await awardIfQualified(userId, podId, type)
    }
  }

  await evaluatePodChampion(podId)
}
