import { connectDB } from '@/lib/db'
import UserModel from '@/lib/models/User'
import PointEventModel from '@/lib/models/PointEvent'
import { evaluateBadges } from '@/lib/badgeEngine'
import { POINT_VALUES, type PointAction } from '@/types'

export interface PointsRow {
  userId: string
  name: string
  avatar: string
  windowPoints: number
  allTimePoints: number
}

type Window = '7d' | '30d' | 'all'

function windowStart(window: Window): Date | null {
  if (window === '7d') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  if (window === '30d') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return null
}

export async function getPodLeaderboard(podId: string, window: Window): Promise<PointsRow[]> {
  await connectDB()

  const users = await UserModel.find({ pod: podId }).lean()
  const userIds = users.map((u) => String(u._id))

  const since = windowStart(window)

  const rows: PointsRow[] = await Promise.all(
    users.map(async (user) => {
      const userId = String(user._id)
      const allTimeAgg = await PointEventModel.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$points' } } },
      ])
      const allTimePoints = allTimeAgg?.[0]?.total ?? 0

      let windowPoints = allTimePoints
      if (since) {
        const windowAgg = await PointEventModel.aggregate([
          { $match: { userId, createdAt: { $gte: since } } },
          { $group: { _id: null, total: { $sum: '$points' } } },
        ])
        windowPoints = windowAgg?.[0]?.total ?? 0
      }

      return {
        userId,
        name: (user as { name?: string }).name ?? '',
        avatar: (user as { avatar?: string }).avatar ?? '',
        windowPoints,
        allTimePoints,
      }
    })
  )

  void userIds
  return rows.sort((a, b) => b.windowPoints - a.windowPoints)
}

export interface RecordPointEventInput {
  userId: string
  podId: string
  action: PointAction
  relatedId?: string
}

export function recordPointEvent(input: RecordPointEventInput): void {
  const { userId, podId, action, relatedId } = input
  const points = POINT_VALUES[action]

  connectDB()
    .then(() =>
      PointEventModel.create({ userId, podId, action, points, relatedId })
    )
    .then(() =>
      UserModel.findByIdAndUpdate(userId, { $inc: { totalPoints: points } })
    )
    .then(() => evaluateBadges(userId, podId))
    .catch((err) => {
      console.error('[pointsEngine] recordPointEvent side effect failed:', err)
    })
}
