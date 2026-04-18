import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import FeedbackItemModel from '@/lib/models/FeedbackItem'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const sprintId = req.nextUrl.searchParams.get('sprintId')
    const category = req.nextUrl.searchParams.get('category')
    const query: Record<string, string> = {}
    if (sprintId) query.sprintId = sprintId
    if (category) query.category = category
    const items = await FeedbackItemModel.find(query).lean()
    const normalized = items.map((item) => ({ ...item, _id: String(item._id) }))
    return NextResponse.json(normalized, { status: 200 })
  } catch (err) {
    console.error('GET /api/feedback error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { category, content, sprintId, authorId } = body

    if (!category || !content || !sprintId || !authorId) {
      return NextResponse.json({ error: 'category, content, sprintId, and authorId are required' }, { status: 400 })
    }

    if (category === 'slowed-us-down' && !body.suggestion?.trim()) {
      return NextResponse.json(
        { error: 'Reframe Rule: suggestion is required for slowed-us-down feedback' },
        { status: 422 }
      )
    }

    const item = new FeedbackItemModel({ ...body })
    await item.save()
    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    console.error('POST /api/feedback error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
