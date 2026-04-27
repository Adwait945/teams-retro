import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import FeedbackItemModel from '@/lib/models/FeedbackItem'
import UserModel from '@/lib/models/User'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    const caller = await UserModel.findById(userId).lean()
    if (!caller || !(caller as { isAdmin?: boolean }).isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const deleted = await FeedbackItemModel.findByIdAndDelete(params.id)
    if (!deleted) {
      return NextResponse.json({ error: 'Feedback item not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    void err
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
