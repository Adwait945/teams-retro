import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import FeedbackItemModel from '@/lib/models/FeedbackItem'
import PointEventModel from '@/lib/models/PointEvent'
import { POINT_VALUES } from '@/types'
import { evaluateBadges } from '@/lib/services/badgeService'
import { getPodForUser } from '@/lib/utils/getPodForUser'

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

      ;(async () => {
        try {
          const authorId = String(item.authorId)
          const podId = await getPodForUser(authorId)
          await PointEventModel.create({
            userId: authorId,
            podId,
            action: 'remove_upvote',
            points: POINT_VALUES.remove_upvote,
            referenceId: String(item._id),
          })
          await evaluateBadges(authorId, podId, 'remove_upvote')
        } catch (err) {
          console.error('[PointEvent] remove_upvote failed:', err)
        }
      })()

      return NextResponse.json({ upvotes: item.upvotes, upvotedBy: item.upvotedBy.map(String), toggled: false }, { status: 200 })
    }

    item.upvotedBy.push(userIdStr)
    item.upvotes += 1
    await item.save()

    ;(async () => {
      try {
        const authorId = String(item.authorId)
        const podId = await getPodForUser(authorId)
        await PointEventModel.create({
          userId: authorId,
          podId,
          action: 'receive_upvote',
          points: POINT_VALUES.receive_upvote,
          referenceId: String(item._id),
        })
        await evaluateBadges(authorId, podId, 'receive_upvote')
      } catch (err) {
        console.error('[PointEvent] receive_upvote failed:', err)
      }
    })()

    return NextResponse.json({ upvotes: item.upvotes, upvotedBy: item.upvotedBy.map(String), toggled: true }, { status: 200 })
  } catch (err) {
    console.error('PATCH /api/feedback/[id]/upvote error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
