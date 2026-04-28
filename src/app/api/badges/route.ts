import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import BadgeModel from '@/lib/models/Badge'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const pod = req.nextUrl.searchParams.get('pod')
    const userId = req.nextUrl.searchParams.get('userId')

    if (!pod) {
      return NextResponse.json({ error: 'pod is required' }, { status: 400 })
    }

    const query: Record<string, unknown> = { podId: pod }
    if (userId) query.userId = userId

    const badges = await BadgeModel.find(query).lean()
    const normalized = badges.map((b) => ({ ...b, _id: String(b._id) }))

    return NextResponse.json(normalized, { status: 200 })
  } catch (err) {
    console.error('[GET /api/badges]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
