import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ActionItemModel from '@/lib/models/ActionItem'

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

    if (item.status === 'verified') {
      return NextResponse.json(
        { error: 'Verified actions cannot be regressed' },
        { status: 400 }
      )
    }

    if (item.status === 'open') {
      return NextResponse.json(
        { error: 'Cannot regress from open status' },
        { status: 400 }
      )
    }

    if (item.status === 'completed') {
      item.status = 'in-progress'
      item.completedAt = undefined
      await item.save()
      return NextResponse.json(item, { status: 200 })
    }

    if (item.status === 'in-progress') {
      item.status = 'open'
      await item.save()
      return NextResponse.json(item, { status: 200 })
    }

    return NextResponse.json({ error: 'Unknown status' }, { status: 400 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
