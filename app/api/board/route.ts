import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

const KEY = 'retro-board-pokemon-v1'

export async function GET() {
  const value = await kv.get<string>(KEY)
  return NextResponse.json({ value })
}

export async function POST(request: Request) {
  const value = await request.text()
  await kv.set(KEY, value)
  return NextResponse.json({ ok: true })
}
