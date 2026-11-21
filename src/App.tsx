import { useEffect, useState } from 'react'
import { HashRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { cardLabel, db, DECK_COLORS, fileToCover, type Card, type Deck } from './db'
import { CardEditor } from './CardEditor'
import { FlipCard } from './Flip'
import { Shell, Tabs } from './Shell'
import { CalendarPage } from './Calendar'
import { ReviewPage } from './Review'
import { SettingsPage } from './Settings'
import { notifyIfDue } from './reminders'
import { dueLabel, isDue, startOfDay } from './schedule'
import { readableOn } from './theme'
import './App.css'

function DeckForm({ deck, onClose }: { deck?: Deck; onClose: () => void }) {
  const [title, setTitle] = useState(deck?.title ?? '')
  const [subtitle, setSubtitle] = useState(deck?.subtitle ?? '')
  const [cover, setCover] = useState(deck?.cover)
  const [color, setColor] = useState(deck?.color ?? DECK_COLORS[0])

  async function save() {
    if (!title.trim()) return
    const data = { title: title.trim(), subtitle: subtitle.trim(), cover, color }
    if (deck) await db.decks.update(deck.id, data)
    else await db.decks.add({ ...data, createdAt: Date.now(), stage: 0, nextReview: startOfDay(Date.now()), reviews: [] } as unknown as Deck)
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{deck ? 'Edit deck' : 'New deck'}</h2>
        <div className="cover-pick" style={{ background: cover ? `url(${cover}) center/cover` : color }}>
          <label className="btn small">
            {cover ? 'Change image' : 'Upload image'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) setCover(await fileToCover(f))
              }}
            />
          </label>
          {cover && <button className="btn small" onClick={() => setCover(undefined)}>Remove</button>}
        </div>
        <div className="swatches">
          {DECK_COLORS.map((c) => (
            <button
              key={c}
              aria-label={c}
              className={'swatch' + (c === color ? ' on' : '')}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <input placeholder="Title (e.g. Arrays)" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <input placeholder="Subtitle (e.g. Two pointers, sliding window)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        <div className="row">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save} disabled={!title.trim()}>Save</button>
        </div>
      </div>
    </div>
  )
}

function Home() {
  const decks = useLiveQuery(() => db.decks.orderBy('createdAt').reverse().toArray(), [])
  const counts = useLiveQuery(async () => {
    const all = await db.cards.toArray()
    const m: Record<number, number> = {}
    all.forEach((c) => (m[c.deckId] = (m[c.deckId] ?? 0) + 1))
    return m
  }, [])
  const [creating, setCreating] = useState(false)

  return (
    <Shell>
      <h1 className="hero">Recall</h1>
      {(decks ?? []).some((d) => isDue(d)) && (
        <Link to="/calendar" className="banner">
          {(decks ?? []).filter((d) => isDue(d)).length} deck(s) due today — time to recall →
        </Link>
      )}
      <Tabs />
      <div className="grid">
        <button className="tile new" onClick={() => setCreating(true)}>
          <span className="plus">+</span>
          <span>New deck</span>
        </button>
        {decks?.map((d) => (
          <Link key={d.id} to={`/deck/${d.id}`} className="tile">
            <div className="art" style={{ background: d.cover ? `url(${d.cover}) center/cover` : d.color }}>
              {!d.cover && <span className="initial" style={{ color: readableOn(d.color) }}>{d.title[0]?.toUpperCase()}</span>}
            </div>
            <div className="meta">
              <strong>{d.title}</strong>
            </div>
            <div className="sub">{d.subtitle || '—'}</div>
            <div className="pills"><span className="pill">{counts?.[d.id] ?? 0} {(counts?.[d.id] ?? 0) === 1 ? "card" : "cards"}</span> <span className={'pill' + (isDue(d) ? ' due' : '')}>{dueLabel(d)}</span></div>
          </Link>
        ))}
      </div>
      {creating && <DeckForm onClose={() => setCreating(false)} />}
    </Shell>
  )
}

function CardsSection({ deck }: { deck: Deck }) {
  const cards = useLiveQuery(() => db.cards.where('deckId').equals(deck.id).sortBy('createdAt'), [deck.id])
  const [i, setI] = useState(0)
  const [editor, setEditor] = useState<{ card?: Card } | null>(null)
  const list = cards ?? []
  const idx = Math.min(i, Math.max(0, list.length - 1))
  const current = list[idx]

  return (
    <>
      <div className="row left">
        <button className="btn" onClick={() => setEditor({})}>+ Add card</button>
      </div>
      {current ? (
        <>
          <FlipCard card={current} color={deck.color} />
          <div className="nav">
            <button className="btn ghost" disabled={idx === 0} onClick={() => setI(idx - 1)}>←</button>
            <span className="pixel">{idx + 1} / {list.length}</span>
            <button className="btn ghost" disabled={idx >= list.length - 1} onClick={() => setI(idx + 1)}>→</button>
          </div>
          <div className="chips">
            {list.map((c, n) => (
              <button key={c.id} className={'chip' + (n === idx ? ' on' : '')} onClick={() => setI(n)}>
                <span className="dot" style={{ background: c.color ?? deck.color }} />
                {cardLabel(c)}
              </button>
            ))}
          </div>
          <div className="row left">
            <button className="btn ghost" onClick={() => setEditor({ card: current })}>Edit card</button>
            <button
              className="btn ghost"
              onClick={async () => {
                if (confirm('Delete this card?')) await db.cards.delete(current.id)
              }}
            >
              Delete card
            </button>
          </div>
        </>
      ) : (
        <p className="soon">No cards yet. Add your first problem.</p>
      )}
      {editor && <CardEditor deckId={deck.id} card={editor.card} onClose={() => setEditor(null)} />}
    </>
  )
}

function DeckPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const deck = useLiveQuery(() => db.decks.get(Number(id)), [id])
  const [editing, setEditing] = useState(false)

  if (!deck) return <Shell><p className="lede">Loading…</p></Shell>
  return (
    <Shell>
      <Link to="/" className="back">← All decks</Link>
      <h1 className="hero small">{deck.title}</h1>
      <p className="lede">{deck.subtitle}</p>
      <div className="row left">
        <Link to={`/review/${deck.id}`} className="btn">Review now</Link>
        <button className="btn ghost" onClick={() => setEditing(true)}>Edit deck</button>
        <button
          className="btn ghost"
          onClick={async () => {
            if (!confirm(`Delete "${deck.title}" and all its cards?`)) return
            await db.cards.where('deckId').equals(deck.id).delete()
            await db.decks.delete(deck.id)
            nav('/')
          }}
        >
          Delete
        </button>
      </div>
      <CardsSection deck={deck} />
      {editing && <DeckForm deck={deck} onClose={() => setEditing(false)} />}
    </Shell>
  )
}

export default function App() {
  useEffect(() => {
    notifyIfDue().catch(() => {})
  }, [])
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/deck/:id" element={<DeckPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/review/:id" element={<ReviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  )
}


