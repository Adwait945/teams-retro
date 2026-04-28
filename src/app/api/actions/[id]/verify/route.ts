import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ActionItemModel from '@/lib/models/ActionItem'
import PointEventModel from '@/lib/models/PointEvent'
import { POINT_VALUES } from '@/types'
import { evaluateBadges } from '@/lib/services/badgeService'
import { getPodForUser } from '@/lib/utils/getPodForUser'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const body = await req.json()
    const { impactNote } = body as { impactNote?: string }

    if (!impactNote?.trim()) {
      return NextResponse.json({ error: 'impactNote is required' }, { status: 400 })
    }

    const item = await ActionItemModel.findById(params.id)
    if (!item) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 })
    }

    if (item.status !== 'completed') {
      return NextResponse.json(
        { error: 'Cannot verify: item must be in completed status' },
        { status: 409 }
      )
    }

    item.status = 'verified'
    item.impactNote = impactNote.trim()
    await item.save()

    ;(async () => {
      try {
        const ownerId = String(item.ownerId)
        const podId = await getPodForUser(ownerId)
        await PointEventModel.create({
          userId: ownerId,
          podId,
          action: 'verify_action',
          points: POINT_VALUES.verify_action,
          referenceId: String(item._id),
        })
        await evaluateBadges(ownerId, podId, 'verify_action')
      } catch (err) {
        console.error('[PointEvent] verify_action failed:', err)
      }
    })()

    return NextResponse.json(item, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
