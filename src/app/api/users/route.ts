import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import UserModel from '@/lib/models/User'

export async function GET(req?: NextRequest) {
  try {
    await connectDB()
    const username = req?.nextUrl?.searchParams?.get('username') ?? null
    const pod = req?.nextUrl?.searchParams?.get('pod') ?? null
    const query: Record<string, string> = {}
    if (username) query.username = username
    if (pod) query.pod = pod
    const users = await UserModel.find(query).lean()
    return NextResponse.json(users, { status: 200 })
  } catch (err) {
    console.error('[GET /api/users]', err)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
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
  } catch (err) {
    console.error('[POST /api/users]', err)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
