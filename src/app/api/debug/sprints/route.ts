import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import SprintModel from '@/lib/models/Sprint'

export async function GET() {
  try {
    await connectDB()
    const sprints = await SprintModel.find({}).sort({ _id: -1 }).lean()
    return NextResponse.json({
      count: sprints.length,
      sprints: sprints.map((s) => ({
        _id: String(s._id),
        name: (s as Record<string, unknown>).name,
        status: (s as Record<string, unknown>).status,
        startDate: (s as Record<string, unknown>).startDate,
        endDate: (s as Record<string, unknown>).endDate,
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
