import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { cardLabel, db } from './db'
import { Shell, Tabs } from './Shell'
import { addDays, effectiveDue, isScheduled, projection, startOfDay } from './schedule'
import { readableOn } from './theme'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type Kind = 'due' | 'next' | 'done' | 'card'
interface Item {
  deckId: number
  label: string
  color: string
  kind: Kind
}

export function CalendarPage() {
  const decks = useLiveQuery(() => db.decks.toArray(), []) ?? []
  const cards = useLiveQuery(() => db.cards.toArray(), []) ?? []
  const [offset, setOffset] = useState(0)
  const today = startOfDay(Date.now())

  const base = new Date()
  base.setDate(1)
  base.setMonth(base.getMonth() + offset)
  const month = base.getMonth()
  const first = startOfDay(base.getTime())
  const lead = (new Date(first).getDay() + 6) % 7 // Monday-first
  const gridStart = addDays(first, -lead)
  const cells = Array.from({ length: 42 }, (_, n) => addDays(gridStart, n))
  const rows = cells.slice(35).every((c) => new Date(c).getMonth() !== month) ? 5 : 6

  const byDay = new Map<number, Item[]>()
  const push = (t: number, item: Item) => byDay.set(t, [...(byDay.get(t) ?? []), item])
  const deckById = new Map(decks.map((d) => [d.id, d]))

  for (const d of decks) {
    if (isScheduled(d)) {
      push(effectiveDue(d), { deckId: d.id, label: d.title, color: d.color, kind: 'due' })
      projection(d).forEach((t) => push(t, { deckId: d.id, label: d.title, color: d.color, kind: 'next' }))
    }
    d.reviews?.forEach((r) => push(startOfDay(r.at), { deckId: d.id, label: d.title, color: d.color, kind: 'done' }))
  }

  // Cards show on the day they were made: one tag per deck per day, linking to that deck.
  const made = new Map<string, typeof cards>()
  for (const c of cards) {
    const key = `${startOfDay(c.createdAt)}:${c.deckId}`
    made.set(key, [...(made.get(key) ?? []), c])
  }
  for (const [key, list] of made) {
    const [t, id] = key.split(':').map(Number)
    const deck = deckById.get(id)
    if (!deck) continue
    push(t, {
      deckId: id,
      color: list.length === 1 ? list[0].color ?? deck.color : deck.color,
      kind: 'card',
      label: list.length === 1 ? cardLabel(list[0]) : `${list.length} cards · ${deck.title}`,
    })
  }

  const dueToday = (byDay.get(today) ?? []).filter((x) => x.kind === 'due')

  return (
    <Shell>
      <h1 className="hero small">Calendar</h1>
      <Tabs />
      <div className="cal-head">
        <button className="btn ghost small" onClick={() => setOffset(offset - 1)}>←</button>
        <strong className="cal-title">{base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
        <button className="btn ghost small" onClick={() => setOffset(offset + 1)}>→</button>
        {offset !== 0 && <button className="btn ghost small" onClick={() => setOffset(0)}>Today</button>}
      </div>
      <div className="cal">
        {WEEKDAYS.map((w) => <div key={w} className="cal-wd">{w}</div>)}
        {cells.slice(0, rows * 7).map((t) => {
          const items = byDay.get(t) ?? []
          const other = new Date(t).getMonth() !== month
          return (
            <div key={t} className={'cal-cell' + (other ? ' other' : '') + (t === today ? ' today' : '')}>
              <span className="cal-n">{new Date(t).getDate()}</span>
              {items.map((it, k) => (
                <Link
                  key={k}
                  to={it.kind === 'due' && t <= today ? `/review/${it.deckId}` : `/deck/${it.deckId}`}
                  className={'cal-tag ' + it.kind}
                  title={it.label}
                  style={
                    it.kind === 'next'
                      ? { borderColor: it.color }
                      : it.kind === 'card'
                        ? { borderLeftColor: it.color }
                        : { background: it.color, color: readableOn(it.color) }
                  }
                >
                  {it.kind === 'card' ? '+ ' : ''}{it.label}
                </Link>
              ))}
            </div>
          )
        })}
      </div>
      <p className="legend">
        <span className="cal-tag due" style={{ background: 'var(--accent)', color: '#fff' }}>Due</span>
        <span className="cal-tag next" style={{ borderColor: 'var(--accent)' }}>Planned</span>
        <span className="cal-tag done" style={{ background: 'var(--accent)', color: '#fff' }}>Reviewed</span>
        <span className="cal-tag card" style={{ borderLeftColor: 'var(--accent)' }}>+ Card added</span>
      </p>
      {dueToday.length > 0 && <p className="soon">{dueToday.length} deck{dueToday.length > 1 ? 's' : ''} due today. Tap a tag to start.</p>}
    </Shell>
  )
}
