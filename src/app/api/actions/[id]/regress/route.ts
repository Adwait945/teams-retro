import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ActionItemModel from '@/lib/models/ActionItem'

const REGRESS_MAP: Record<string, string> = {
  'in-progress': 'open',
  'completed': 'in-progress',
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
    const prevStatus = REGRESS_MAP[item.status]
    if (!prevStatus) {
      return NextResponse.json(
        { error: 'Cannot regress: item is already open or verified' },
        { status: 409 }
      )
    }
    item.status = prevStatus
    await item.save()
    return NextResponse.json(item, { status: 200 })
  } catch (err) {
    console.error('[PATCH /api/actions/[id]/regress]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
