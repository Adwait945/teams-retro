import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import ActionItemModel from '@/lib/models/ActionItem'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const body = await req.json()
    const { impactNote } = body as { impactNote?: string }

    if (!impactNote?.trim()) {
      return NextResponse.json({ error: 'impactNote is required' }, { status: 400 })
    }

    const item = await ActionItemModel.findById(params.id)
    if (!item) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 })
    }

    if (item.status !== 'completed') {
      return NextResponse.json(
        { error: 'Cannot verify: item must be in completed status' },
        { status: 409 }
      )
    }

    item.status = 'verified'
    item.impactNote = impactNote.trim()
    await item.save()
    return NextResponse.json(item, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
