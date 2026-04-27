import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import FeedbackItemModel from '@/lib/models/FeedbackItem'
import { getWindowFilter } from '@/lib/utils/windowFilter'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const windowParam = req.nextUrl.searchParams.get('window')
    const result = getWindowFilter(windowParam)
    if (!result.valid) {
      return NextResponse.json({ error: 'Invalid window parameter' }, { status: 400 })
    }
    const category = req.nextUrl.searchParams.get('category')
    const query: Record<string, unknown> = { ...result.filter }
    if (category) query.category = category
    const items = await FeedbackItemModel.find(query).lean()
    const normalized = items.map((item) => ({ ...item, _id: String(item._id) }))
    return NextResponse.json(normalized, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { category, content, authorId } = body

    if (!category || !content || !authorId) {
      return NextResponse.json({ error: 'category, content, and authorId are required' }, { status: 400 })
    }

    if (category === 'slowed-us-down' && !body.suggestion?.trim()) {
      return NextResponse.json(
        { error: 'Reframe Rule: suggestion is required for slowed-us-down feedback' },
        { status: 422 }
      )
    }

    const { sprintId: _removed, ...safeBody } = body
    const item = new FeedbackItemModel({ ...safeBody })
    await item.save()
    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
