import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import ActionItemModel from "@/lib/models/ActionItem"

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const sprintId = req.nextUrl.searchParams.get("sprintId")
    if (!sprintId) {
      return NextResponse.json({ error: "sprintId is required" }, { status: 400 })
    }
    const actions = await ActionItemModel.find({ sprintId }).lean().limit(100)
    return NextResponse.json(actions, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    if (!body.title || !body.ownerId || !body.sprintId) {
      return NextResponse.json(
        { error: "title, ownerId, and sprintId are required" },
        { status: 400 }
      )
    }

    const action = new ActionItemModel({ ...body, status: 'open' })
    await action.save()
    return NextResponse.json(action, { status: 201 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
