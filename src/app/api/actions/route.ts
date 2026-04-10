import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import ActionItemModel from "@/lib/models/ActionItem"

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const sprintId = req.nextUrl.searchParams.get("sprintId")
    const query = sprintId ? { sprintId } : {}
    const actions = await ActionItemModel.find(query).lean()
    return NextResponse.json(actions, { status: 200 })
  } catch (err) {
    console.error('[GET /api/actions]', err)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    if (!body.sprintId || !body.title || !body.ownerId) {
      return NextResponse.json(
        { error: "sprintId, title, and ownerId are required" },
        { status: 400 }
      )
    }

    const action = new ActionItemModel({ ...body })
    await action.save()
    return NextResponse.json(action, { status: 201 })
  } catch (err) {
    console.error('[POST /api/actions]', err)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
