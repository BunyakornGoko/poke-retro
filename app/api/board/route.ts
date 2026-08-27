import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

const KEY = 'retro-board-pokemon-v1'
const COLUMN_KEYS = ['wentWell', 'notWell', 'improve']
const cardsKey = (column: string) => `retro-cards-${column}`

export async function GET() {
  const board = await kv.get<any>(KEY)
  if (!board) return NextResponse.json(null)
  const columns: Record<string, unknown[]> = {}
  for (const column of COLUMN_KEYS) columns[column] = (await kv.lrange(cardsKey(column), 0, -1)) ?? []
  return NextResponse.json({ ...board, columns })
}

export async function POST(request: Request) {
  const { columns, ...board } = await request.json()
  await kv.set(KEY, board)
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await kv.del(KEY, ...COLUMN_KEYS.map(cardsKey))
  return NextResponse.json({ ok: true })
}
