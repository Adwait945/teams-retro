import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import SprintModel from '@/lib/models/Sprint'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await connectDB()
    const body = await req.json()
    const { name, goal, startDate, endDate, teamMemberIds } = body

    const hasFields = name !== undefined || goal !== undefined ||
      startDate !== undefined || endDate !== undefined || teamMemberIds !== undefined
    if (!hasFields) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
    }

    const item = await SprintModel.findById(params.id)
    if (!item) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })

    if (name !== undefined) item.name = name
    if (goal !== undefined) item.goal = goal
    if (startDate !== undefined) item.startDate = startDate
    if (endDate !== undefined) item.endDate = endDate
    if (teamMemberIds !== undefined) item.teamMemberIds = teamMemberIds

    await item.save()
    return NextResponse.json(item, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
