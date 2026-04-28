import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ActionItemModel from '@/lib/models/ActionItem'
import PointEventModel from '@/lib/models/PointEvent'
import { POINT_VALUES } from '@/types'
import { evaluateBadges } from '@/lib/services/badgeService'
import { getPodForUser } from '@/lib/utils/getPodForUser'

const ADVANCE_MAP: Record<string, string> = {
  'open': 'in-progress',
  'in-progress': 'completed',
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const item = await ActionItemModel.findById(params.id)
    if (!item) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 })
    }
    const nextStatus = ADVANCE_MAP[item.status]
    if (!nextStatus) {
      return NextResponse.json(
        { error: 'Cannot advance: item is already completed or verified' },
        { status: 409 }
      )
    }
    item.status = nextStatus
    if (nextStatus === 'completed') {
      item.completedAt = new Date()
    }
    await item.save()

    if (nextStatus === 'completed') {
      ;(async () => {
        try {
          const ownerId = String(item.ownerId)
          const podId = await getPodForUser(ownerId)
          await PointEventModel.create({
            userId: ownerId,
            podId,
            action: 'complete_action',
            points: POINT_VALUES.complete_action,
            referenceId: String(item._id),
          })
          await evaluateBadges(ownerId, podId, 'complete_action')
        } catch (err) {
          console.error('[PointEvent] complete_action failed:', err)
        }
      })()
    }

    return NextResponse.json(item, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
