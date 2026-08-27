import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

const KEY = 'retro-board-pokemon-v1'

export async function GET() {
  const board = await kv.get(KEY)
  return NextResponse.json(board)
}

export async function POST(request: Request) {
  const board = await request.json()
  await kv.set(KEY, board)
  return NextResponse.json({ ok: true })
}
