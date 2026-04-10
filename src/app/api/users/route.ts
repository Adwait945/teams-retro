import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import UserModel from '@/lib/models/User'

export async function GET() {
  await connectDB()
  const users = await UserModel.find({}).lean()
  return NextResponse.json(users, { status: 200 })
}

export async function POST(req: NextRequest) {
  await connectDB()
  const body = await req.json()

  if (!body.name || !body.username || !body.pod) {
    return NextResponse.json(
      { error: 'name, username, and pod are required' },
      { status: 400 }
    )
  }

  const count = await UserModel.countDocuments()
  const isAdmin = count === 0
  const user = new UserModel({ ...body, isAdmin })
  await user.save()
  return NextResponse.json(user, { status: 201 })
}
