import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ActionItemModel from '@/lib/models/ActionItem'
import UserModel from '@/lib/models/User'
import { recordPointEvent } from '@/lib/pointsEngine'

async function resolveUserPod(userId: string): Promise<string> {
  try {
    const user = await UserModel.findById(userId).lean()
    return (user as { pod?: string } | null)?.pod ?? ''
  } catch (err) {
    console.error('[PATCH /api/actions/[id]/advance] pod lookup failed:', err)
    return ''
  }
}

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
      const podId = await resolveUserPod(item.ownerId)
      try {
        recordPointEvent({
          userId: String(item.ownerId),
          podId,
          action: 'complete_action',
          relatedId: String(item._id),
        })
      } catch (err) {
        console.error('[PATCH /api/actions/[id]/advance] recordPointEvent failed:', err)
      }
    }

    return NextResponse.json(item, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
