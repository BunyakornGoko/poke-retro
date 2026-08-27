import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

const KEY = 'retro-participants-v1'

export async function GET() {
  const members = await kv.smembers(KEY)
  return NextResponse.json({ members })
}

export async function POST(request: Request) {
  const { name } = await request.json()
  const added = await kv.sadd(KEY, name)
  return NextResponse.json({ ok: added === 1 })
}

export async function DELETE(request: Request) {
  const { name } = await request.json()
  await kv.srem(KEY, name)
  return NextResponse.json({ ok: true })
}
