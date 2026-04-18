import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import SprintModel from '@/lib/models/Sprint'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    if (searchParams.get('all') === 'true') {
      const sprints = await SprintModel.find({}).sort({ _id: -1 }).limit(100).lean()
      console.log(`[GET /api/sprints?all=true] found ${sprints.length} sprint(s):`, sprints.map((s) => ({ id: String(s._id), name: (s as Record<string, unknown>).name, status: (s as Record<string, unknown>).status })))
      const normalized = sprints.map((s) => ({ ...s, _id: String(s._id) }))
      return NextResponse.json(normalized, { status: 200 })
    }
    const sprint = await SprintModel.findOne({ status: 'open' }).lean<{ _id: unknown } & Record<string, unknown>>()
    if (!sprint) return NextResponse.json(null, { status: 200 })
    return NextResponse.json({ ...sprint, _id: String(sprint._id) }, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    if (!body.name || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'name, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    const sprint = new SprintModel({ ...body, status: body.status ?? 'open' })
    await sprint.save()
    return NextResponse.json(sprint, { status: 201 })
  } catch (err) {
    console.error('[POST /api/sprints]', err)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
