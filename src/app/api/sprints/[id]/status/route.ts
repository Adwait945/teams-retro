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
    const { status } = body

    if (status !== 'open' && status !== 'closed') {
      return NextResponse.json(
        { error: "status must be 'open' or 'closed'" },
        { status: 400 }
      )
    }

    const item = await SprintModel.findById(params.id)
    if (!item) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })

    item.status = status
    await item.save()
    return NextResponse.json(item, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
