'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  RotateCcw,
  Sparkles,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'

const STORAGE_KEY = 'retro-board-pokemon-v1'

const COLUMNS = [
  { key: 'wentWell', title: 'ทำได้ดี', sub: 'สิ่งที่ทีมทำได้ดีใน Sprint นี้', color: 'mint' },
  { key: 'notWell', title: 'ทำได้ไม่ดี', sub: 'สิ่งที่ยังไม่เวิร์ค', color: 'coral' },
  { key: 'improve', title: 'อยากปรับปรุง', sub: 'อยากให้ดีขึ้นใน Sprint หน้า', color: 'yellow' },
] as const

const PHASES = ['เขียนโน้ต', 'พูดคุย', 'โหวต', 'สรุป Action']
const POKEMON = [
  ['Pikachu', 'ピカチュウ', '025', 'yellow'], ['Charmander', 'ヒトカゲ', '004', 'coral'],
  ['Bulbasaur', 'フシギダネ', '001', 'mint'], ['Squirtle', 'ゼニガメ', '007', 'blue'],
  ['Eevee', 'イーブイ', '133', 'brown'], ['Jigglypuff', 'プリン', '039', 'pink'],
  ['Psyduck', 'コダック', '054', 'yellow'], ['Snorlax', 'カビゴン', '143', 'blue'],
  ['Meowth', 'ニャース', '052', 'yellow'], ['Gengar', 'ゲンガー', '094', 'purple'],
  ['Vulpix', 'ロコン', '037', 'coral'], ['Mew', 'ミュウ', '151', 'pink'],
] as const

type Pokemon = typeof POKEMON[number]
type Card = { id: string; text: string; author: Pokemon; createdAt: number; voters: string[] }
type Board = { columns: Record<string, Card[]>; actionItems: { id: string; text: string; owner: Pokemon; done: boolean }[]; phaseIndex: number; timerEndAt: number | null; timerRunning: boolean; timerMinutes: number }

const freshBoard = (): Board => ({ columns: { wentWell: [], notWell: [], improve: [] }, actionItems: [], phaseIndex: 0, timerEndAt: null, timerRunning: false, timerMinutes: 5 })
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
const pokemonImage = (id: string) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${Number(id)}.png`

function PokemonAvatar({ pokemon, size = 'sm' }: { pokemon: Pokemon; size?: 'sm' | 'md' | 'lg' }) {
  return <div className={`pokemon-avatar pokemon-avatar-${size}`} title={pokemon[0]}><img src={pokemonImage(pokemon[2])} alt={`${pokemon[0]} avatar`} /></div>
}

function PokemonPicker({ value, onChange }: { value: Pokemon | null; onChange: (pokemon: Pokemon) => void }) {
  const [open, setOpen] = useState(false)
  return <div className="relative">
    <button className="picker-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
      {value ? <><PokemonAvatar pokemon={value} size="sm" /><span>{value[0]}</span></> : <><Sparkles size={18} data-icon="inline-start" /><span>เลือกคู่หูของคุณ</span></>}
      <ChevronRight className={`ml-auto transition-transform ${open ? 'rotate-90' : ''}`} size={17} />
    </button>
    {open && <div className="picker-menu">
      <div className="picker-heading">เลือกโปเกม่อนที่ชอบ</div>
      <div className="grid grid-cols-3 gap-2">
        {POKEMON.map((pokemon) => <button key={pokemon[0]} onClick={() => { onChange(pokemon); setOpen(false) }} className={`pokemon-option ${value?.[0] === pokemon[0] ? 'selected' : ''}`}><PokemonAvatar pokemon={pokemon} size="md" /><span>{pokemon[0]}</span><small>#{pokemon[2]}</small></button>)}
      </div>
    </div>}
  </div>
}

export default function Page() {
  const [identity, setIdentity] = useState<Pokemon | null>(null)
  const [joined, setJoined] = useState(false)
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [actionDraft, setActionDraft] = useState('')
  const [minutes, setMinutes] = useState(5)
  const [now, setNow] = useState(Date.now())
  const [isHost, setIsHost] = useState(false)
  const suppressPoll = useRef(false)

  const loadBoard = useCallback(async () => {
    try {
      const result = await window.storage.get(STORAGE_KEY, true)
      if (result?.value) setBoard(JSON.parse(result.value))
      else { const next = freshBoard(); await window.storage.set(STORAGE_KEY, JSON.stringify(next), true); setBoard(next) }
    } catch { setBoard(freshBoard()) } finally { setLoading(false) }
  }, [])
  useEffect(() => { loadBoard() }, [loadBoard])
  useEffect(() => { const poll = setInterval(() => { if (!suppressPoll.current) loadBoard() }, 3000); return () => clearInterval(poll) }, [loadBoard])
  useEffect(() => { const tick = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(tick) }, [])
  useEffect(() => { setIsHost(new URLSearchParams(window.location.search).get('host') === '1') }, [])

  const save = (next: Board) => { setBoard(next); suppressPoll.current = true; window.storage.set(STORAGE_KEY, JSON.stringify(next), true).finally(() => setTimeout(() => { suppressPoll.current = false }, 1000)) }
  const clone = () => JSON.parse(JSON.stringify(board)) as Board
  const me = identity?.[0] ?? ''
  const votes = useMemo(() => board ? COLUMNS.reduce((sum, col) => sum + board.columns[col.key].filter((card) => card.voters.includes(me)).length, 0) : 0, [board, me])
  const phase = board?.phaseIndex ?? 0
  const remaining = board?.timerEndAt ? Math.max(0, Math.floor((board.timerEndAt - now) / 1000)) : (board?.timerMinutes ?? 5) * 60
  const time = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`

  if (!joined) return <main className="join-screen"><div className="join-card">
    <div className="pokeball-mark"><span /></div><p className="eyebrow">POKÉMON RETROSPECTIVE</p><h1>ออกเดินทาง<br /><em>ไปพร้อมกับทีม</em></h1><p className="join-copy">เลือกโปเกม่อนคู่หูของคุณ แล้วมาแชร์ความคิดเห็นใน Sprint นี้กัน</p>
    <PokemonPicker value={identity} onChange={setIdentity} /><button className="primary-button join-button" disabled={!identity} onClick={() => setJoined(true)}>เข้าร่วมทีม <ChevronRight size={18} /></button>
    <p className="join-note"><Sparkles size={13} /> ไม่ต้องใช้ชื่อจริงในบอร์ดนี้</p>
  </div></main>
  if (loading || !board || !identity) return <main className="loading-screen">กำลังเตรียมสนามต่อสู้...</main>

  const addCard = (key: string) => { const text = (drafts[key] || '').trim(); if (!text) return; const next = clone(); next.columns[key].push({ id: uid(), text, author: identity, createdAt: Date.now(), voters: [] }); save(next); setDrafts({ ...drafts, [key]: '' }) }
  const toggleVote = (key: string, id: string) => { const next = clone(); const card = next.columns[key].find((item) => item.id === id); if (!card) return; const index = card.voters.indexOf(me); if (index >= 0) card.voters.splice(index, 1); else if (votes < 3) card.voters.push(me); save(next) }
  const deleteCard = (key: string, id: string) => { const next = clone(); next.columns[key] = next.columns[key].filter((item) => item.id !== id); save(next) }
  const addAction = () => { if (!actionDraft.trim()) return; const next = clone(); next.actionItems.push({ id: uid(), text: actionDraft.trim(), owner: identity, done: false }); save(next); setActionDraft('') }
  const setPhase = (index: number) => { const next = clone(); next.phaseIndex = Math.max(0, Math.min(3, index)); save(next) }
  const startTimer = () => { const next = clone(); next.timerEndAt = Date.now() + minutes * 60000; next.timerRunning = true; next.timerMinutes = minutes; save(next) }
  const resetTimer = () => { const next = clone(); next.timerEndAt = null; next.timerRunning = false; save(next) }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-ball" /><div><strong>Poké<span>Retro</span></strong><small>TEAM SPRINT ARENA</small></div></div><div className="header-right"><div className="trainer-chip"><PokemonAvatar pokemon={identity} size="sm" /><div><small>กำลังเล่นเป็น</small><b>{identity[0]}</b></div></div>{isHost && <div className="timer"><Clock3 size={17} /><b>{time}</b><input aria-label="นาที" type="number" min={1} max={60} value={minutes} onChange={(e) => setMinutes(Number(e.target.value) || 1)} /><button onClick={startTimer}>เริ่ม</button><button className="icon-button" onClick={resetTimer} aria-label="รีเซ็ตเวลา"><RotateCcw size={15} /></button></div>}</div></header>
    <section className="hero"><div><p className="eyebrow">SQUAD RETROSPECTIVE · SPRINT 24</p><h1>ทีมของเรา <em>เก่งขึ้น</em><br />ได้อีกแค่ไหน?</h1><p>จับมือคู่หูของคุณ แล้วมาทบทวนการเดินทางครั้งนี้ไปด้วยกัน</p></div><div className="hero-badge"><Sparkles size={17} /><span><b>{votes}/3</b> โหวตที่ใช้ไป</span></div></section>
    <nav className="phase-nav"><button disabled={phase === 0} onClick={() => setPhase(phase - 1)} aria-label="ย้อนกลับ"><ChevronLeft size={18} /></button>{PHASES.map((item, index) => <button key={item} onClick={() => setPhase(index)} className={index === phase ? 'active' : ''}><span>{index + 1}</span>{item}{index === phase && <Check size={14} />}</button>)}<button disabled={phase === 3} onClick={() => setPhase(phase + 1)} aria-label="ถัดไป"><ChevronRight size={18} /></button></nav>
    <div className="phase-hint"><Sparkles size={14} /> {['แต่ละคนเขียนความคิดเห็นลงในคอลัมน์', 'อ่านและพูดคุยโน้ตของทุกคนด้วยกัน', 'แต่ละคนมี 3 โหวต เลือกโน้ตที่สำคัญที่สุด', 'แปลงโน้ตที่โหวตสูงสุดเป็น Action Items'][phase]}</div>
    <section className="columns-grid">{COLUMNS.map((column) => { const cards = [...board.columns[column.key]].sort((a, b) => phase >= 2 ? b.voters.length - a.voters.length : a.createdAt - b.createdAt); return <article key={column.key} className={`retro-column ${column.color}`}><div className="column-heading"><div><h2>{column.title}</h2><p>{column.sub}</p></div><span>{cards.length}</span></div>{phase === 0 && <div className="note-input"><input value={drafts[column.key] || ''} onChange={(e) => setDrafts({ ...drafts, [column.key]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) addCard(column.key) }} placeholder="เขียนโน้ตของคุณ..." /><button onClick={() => addCard(column.key)} aria-label="เพิ่มโน้ต"><Plus size={18} /></button></div>}<div className="cards-list">{cards.length === 0 && <div className="empty-note">ยังไม่มีโน้ต<br /><small>เป็นคนแรกที่เริ่มแชร์ได้เลย</small></div>}{cards.map((card) => { const voted = card.voters.includes(me); return <div className="retro-card" key={card.id}><p>{card.text}</p><div className="card-meta"><div className="author"><PokemonAvatar pokemon={card.author} size="sm" /><span>{card.author[0]}</span></div><div className="card-actions">{phase >= 2 && <button className={`vote-button ${voted ? 'voted' : ''}`} onClick={() => phase === 2 && toggleVote(column.key, card.id)} disabled={phase !== 2}><ThumbsUp size={13} /> {card.voters.length}</button>}{card.author[0] === me && phase === 0 && <button className="delete-button" onClick={() => deleteCard(column.key, card.id)} aria-label="ลบโน้ต"><X size={15} /></button>}</div></div></div>})}</div></article> })}</section>
    <section className="actions-section"><div className="section-title"><div><p className="eyebrow">QUEST LOG</p><h2>Action Items <span>สิ่งที่เราจะลงมือทำ</span></h2></div><div className="action-count">{board.actionItems.filter((item) => item.done).length}/{board.actionItems.length} สำเร็จ</div></div><div className="action-form"><input value={actionDraft} onChange={(e) => setActionDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) addAction() }} placeholder="เพิ่ม Action item ที่อยากให้ทีมทำ..." /><button className="primary-button" onClick={addAction}><Plus size={17} /> เพิ่มภารกิจ</button></div><div className="action-list">{board.actionItems.map((item) => <div className={`action-row ${item.done ? 'done' : ''}`} key={item.id}><button onClick={() => { const next = clone(); const target = next.actionItems.find((action) => action.id === item.id); if (target) target.done = !target.done; save(next) }} className="check-action" aria-label="ทำเสร็จแล้ว">{item.done ? <CheckSquare size={19} /> : <span />}</button><span>{item.text}</span><PokemonAvatar pokemon={item.owner} size="sm" /><b>{item.owner[0]}</b><button className="delete-button" onClick={() => { const next = clone(); next.actionItems = next.actionItems.filter((action) => action.id !== item.id); save(next) }} aria-label="ลบภารกิจ"><Trash2 size={15} /></button></div>)}</div></section>
    <footer><span>POKÉRETRO · SPRINT 15</span><button onClick={() => { if (confirm('ล้างบอร์ดทั้งหมด?')) save(freshBoard()) }}>รีเซ็ตบอร์ด</button></footer>
  </main>
}
