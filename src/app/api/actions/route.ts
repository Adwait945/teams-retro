import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import ActionItemModel from "@/lib/models/ActionItem"
import FeedbackItemModel from "@/lib/models/FeedbackItem"
import UserModel from "@/lib/models/User"
import { getWindowFilter } from "@/lib/utils/windowFilter"
import { recordPointEvent } from "@/lib/pointsEngine"

async function resolveUserPod(userId: string): Promise<string> {
  try {
    const user = await UserModel.findById(userId).lean()
    return (user as { pod?: string } | null)?.pod ?? ''
  } catch (err) {
    console.error('[POST /api/actions] pod lookup failed:', err)
    return ''
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const windowParam = req.nextUrl.searchParams.get("window")
    const result = getWindowFilter(windowParam)
    if (!result.valid) {
      return NextResponse.json({ error: "Invalid window parameter" }, { status: 400 })
    }
    const actions = await ActionItemModel.find(result.filter).lean().limit(100)
    const normalized = actions.map((a) => ({ ...a, _id: String(a._id) }))
    return NextResponse.json(normalized, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    if (!body.title || !body.ownerId) {
      return NextResponse.json(
        { error: "title and ownerId are required" },
        { status: 400 }
      )
    }

    const { sprintId: _removed, ...safeBody } = body
    const action = new ActionItemModel({ ...safeBody, status: 'open' })
    await action.save()

    if (safeBody.sourceFeedbackId) {
      await FeedbackItemModel.findByIdAndUpdate(
        safeBody.sourceFeedbackId,
        { $push: { actionItemIds: String(action._id) } }
      )

      const feedback = await FeedbackItemModel.findById(safeBody.sourceFeedbackId)
      if (feedback) {
        const podId = await resolveUserPod(feedback.authorId)
        try {
          recordPointEvent({
            userId: String(feedback.authorId),
            podId,
            action: 'convert_action',
            relatedId: String(action._id),
          })
        } catch (err) {
          console.error('[POST /api/actions] recordPointEvent failed:', err)
        }
      }
    }

    return NextResponse.json(action, { status: 201 })
  } catch (err) {
    void err
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
