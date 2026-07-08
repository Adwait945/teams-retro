import { NextRequest, NextResponse } from 'next/server'
import { getPodLeaderboard } from '@/lib/pointsEngine'

const VALID_WINDOWS = ['7d', '30d', 'all'] as const
type ValidWindow = typeof VALID_WINDOWS[number]

function isValidWindow(value: string | null): value is ValidWindow {
  return value !== null && (VALID_WINDOWS as readonly string[]).includes(value)
}

export async function GET(req: NextRequest) {
  try {
    const pod = req.nextUrl.searchParams.get('pod')
    if (!pod) {
      return NextResponse.json({ error: 'pod is required' }, { status: 400 })
    }

    const windowParam = req.nextUrl.searchParams.get('window')
    if (!isValidWindow(windowParam)) {
      return NextResponse.json({ error: 'window must be one of 7d, 30d, all' }, { status: 400 })
    }

    const rows = await getPodLeaderboard(pod, windowParam)
    return NextResponse.json(rows, { status: 200 })
  } catch (err) {
    console.error('[GET /api/points]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
