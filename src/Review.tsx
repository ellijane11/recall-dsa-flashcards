import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { FlipCard } from './Flip'
import { Shell } from './Shell'
import { applyRating, LADDER, type Rating } from './schedule'

const RATINGS: { r: Rating; label: string; note: string }[] = [
  { r: 'again', label: 'Again', note: 'Forgot it · back tomorrow' },
  { r: 'hard', label: 'Hard', note: 'Struggled · same step' },
  { r: 'good', label: 'Good', note: 'Recalled · next step' },
  { r: 'easy', label: 'Easy', note: 'Effortless · skip a step' },
]

export function ReviewPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const deck = useLiveQuery(() => db.decks.get(Number(id)), [id])
  const cards = useLiveQuery(() => db.cards.where('deckId').equals(Number(id)).sortBy('createdAt'), [id])
  const [i, setI] = useState(0)

  if (!deck || !cards) return <Shell><p className="lede">Loading…</p></Shell>
  if (cards.length === 0)
    return (
      <Shell>
        <Link to={`/deck/${deck.id}`} className="back">← {deck.title}</Link>
        <p className="soon">This deck has no cards yet, so there is nothing to review.</p>
      </Shell>
    )

  const rating = i >= cards.length

  async function rate(r: Rating) {
    await db.decks.update(deck!.id, applyRating(deck!, r))
    nav('/calendar')
  }

  return (
    <Shell>
      <Link to={`/deck/${deck.id}`} className="back">← {deck.title}</Link>
      {!rating ? (
        <>
          <p className="pixel">Reviewing · {i + 1} / {cards.length}</p>
          <FlipCard card={cards[i]} color={deck.color} />
          <div className="nav">
            <button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>←</button>
            <button className="btn" onClick={() => setI(i + 1)}>{i === cards.length - 1 ? 'Finish' : 'Next →'}</button>
          </div>
        </>
      ) : (
        <>
          <h1 className="hero small">How did it go?</h1>
          <p className="lede">
            Rate how well you recalled the whole deck. Your next review date is set from this
            (gaps: {LADDER.join(', ')} days).
          </p>
          <div className="rates">
            {RATINGS.map(({ r, label, note }) => (
              <button key={r} className={'rate ' + r} onClick={() => rate(r)}>
                <strong>{label}</strong>
                <span>{note}</span>
              </button>
            ))}
          </div>
          <div className="row left"><button className="btn ghost" onClick={() => setI(cards.length - 1)}>← Back to cards</button></div>
        </>
      )}
    </Shell>
  )
}
