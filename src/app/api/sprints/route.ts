import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import SprintModel from '@/lib/models/Sprint'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    if (searchParams.get('all') === 'true') {
      const sprints = await SprintModel.find({}).sort({ createdAt: -1 }).limit(100).lean()
      return NextResponse.json(sprints, { status: 200 })
    }
    const sprint = await SprintModel.findOne({ status: 'open' }).lean()
    return NextResponse.json(sprint ?? [], { status: 200 })
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
