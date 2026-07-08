import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import FeedbackItemModel from '@/lib/models/FeedbackItem'
import UserModel from '@/lib/models/User'
import { recordPointEvent } from '@/lib/pointsEngine'

async function resolveUserPod(userId: string): Promise<string> {
  try {
    const user = await UserModel.findById(userId).lean()
    return (user as { pod?: string } | null)?.pod ?? ''
  } catch (err) {
    console.error('[PATCH /api/feedback/[id]/upvote] pod lookup failed:', err)
    return ''
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const item = await FeedbackItemModel.findById(params.id)
    if (!item) {
      return NextResponse.json({ error: 'Feedback item not found' }, { status: 404 })
    }

    if (item.authorId === userId) {
      return NextResponse.json({ error: 'Cannot upvote own feedback' }, { status: 403 })
    }

    const userIdStr = String(userId)
    if (item.upvotedBy.some((id: unknown) => String(id) === userIdStr)) {
      item.upvotedBy = item.upvotedBy.filter((id: unknown) => String(id) !== userIdStr)
      item.upvotes = Math.max(0, item.upvotes - 1)
      await item.save()

      const podId = await resolveUserPod(item.authorId)
      try {
        recordPointEvent({
          userId: String(item.authorId),
          podId,
          action: 'remove_upvote',
          relatedId: String(item._id),
        })
      } catch (err) {
        console.error('[PATCH /api/feedback/[id]/upvote] recordPointEvent failed:', err)
      }

      return NextResponse.json({ upvotes: item.upvotes, upvotedBy: item.upvotedBy.map(String), toggled: false }, { status: 200 })
    }

    item.upvotedBy.push(userIdStr)
    item.upvotes += 1
    await item.save()

    const podId = await resolveUserPod(item.authorId)
    try {
      recordPointEvent({
        userId: String(item.authorId),
        podId,
        action: 'receive_upvote',
        relatedId: String(item._id),
      })
    } catch (err) {
      console.error('[PATCH /api/feedback/[id]/upvote] recordPointEvent failed:', err)
    }

    return NextResponse.json({ upvotes: item.upvotes, upvotedBy: item.upvotedBy.map(String), toggled: true }, { status: 200 })
  } catch (err) {
    console.error('PATCH /api/feedback/[id]/upvote error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
