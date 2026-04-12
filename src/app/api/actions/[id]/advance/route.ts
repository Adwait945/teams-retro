import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ActionItemModel from '@/lib/models/ActionItem'

const ADVANCE_MAP: Record<string, string> = {
  'open': 'in-progress',
  'in-progress': 'completed',
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const item = await ActionItemModel.findById(params.id)
    if (!item) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 })
    }
    const nextStatus = ADVANCE_MAP[item.status]
    if (!nextStatus) {
      return NextResponse.json(
        { error: 'Cannot advance: item is already completed or verified' },
        { status: 409 }
      )
    }
    item.status = nextStatus
    await item.save()
    return NextResponse.json(item, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
