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
    console.error('[PATCH /api/actions/[id]/verify] pod lookup failed:', err)
    return ''
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const body = await req.json()
    const { impactNote, userId } = body as { impactNote?: string; userId?: string }

    if (!impactNote?.trim()) {
      return NextResponse.json({ error: 'impactNote is required' }, { status: 400 })
    }

    if (!userId?.trim()) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
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

    const podId = await resolveUserPod(userId)
    try {
      recordPointEvent({
        userId,
        podId,
        action: 'verify_action',
        relatedId: String(item._id),
      })
    } catch (err) {
      console.error('[PATCH /api/actions/[id]/verify] recordPointEvent failed:', err)
    }

    return NextResponse.json(item, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
