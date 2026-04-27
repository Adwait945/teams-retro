import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import ActionItemModel from "@/lib/models/ActionItem"
import FeedbackItemModel from "@/lib/models/FeedbackItem"
import { getWindowFilter } from "@/lib/utils/windowFilter"

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
    }

    return NextResponse.json(action, { status: 201 })
  } catch (err) {
    void err
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
