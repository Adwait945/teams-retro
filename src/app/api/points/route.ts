import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import PointEventModel from '@/lib/models/PointEvent'
import { getWindowFilter } from '@/lib/utils/windowFilter'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const pod = req.nextUrl.searchParams.get('pod')
    const windowParam = req.nextUrl.searchParams.get('window')
    const userId = req.nextUrl.searchParams.get('userId')

    if (!pod) {
      return NextResponse.json({ error: 'pod is required' }, { status: 400 })
    }

    const result = getWindowFilter(windowParam)
    if (!result.valid) {
      return NextResponse.json({ error: 'Invalid window parameter' }, { status: 400 })
    }

    const match: Record<string, unknown> = { podId: pod, ...result.filter }

    if (userId) {
      const agg = await PointEventModel.aggregate([
        { $match: { ...match, userId } },
        { $group: { _id: '$userId', total: { $sum: '$points' } } },
      ])
      const total = agg.length > 0 ? agg[0].total : 0
      return NextResponse.json({ userId, total }, { status: 200 })
    }

    const agg = await PointEventModel.aggregate([
      { $match: match },
      { $group: { _id: '$userId', total: { $sum: '$points' } } },
      { $sort: { total: -1 } },
    ])

    const rankings = agg.map((entry: { _id: string; total: number }) => ({
      userId: String(entry._id),
      total: entry.total,
    }))

    return NextResponse.json(rankings, { status: 200 })
  } catch (err) {
    console.error('[GET /api/points]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
