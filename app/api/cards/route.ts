import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

const cardsKey = (column: string) => `retro-cards-${column}`

export async function POST(request: Request) {
  const { column, card } = await request.json()
  await kv.rpush(cardsKey(column), card)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { column, id } = await request.json()
  const key = cardsKey(column)
  const items = await kv.lrange<{ id: string }>(key, 0, -1)
  const match = items.find((item) => item.id === id)
  if (match) await kv.lrem(key, 0, match)
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const { column, id, voters } = await request.json()
  const key = cardsKey(column)
  const items = await kv.lrange<{ id: string }>(key, 0, -1)
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) return NextResponse.json({ ok: false })
  await kv.lset(key, index, { ...items[index], voters })
  return NextResponse.json({ ok: true })
}
