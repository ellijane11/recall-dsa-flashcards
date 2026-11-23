import { useEffect, useState } from 'react'
import { db } from './db'
import { importCards, parseCards } from './cardParser'
import sample from './samples/hashing.md?raw'

export function ImportCards({ deckId, onClose }: { deckId: number; onClose: () => void }) {
  const [text, setText] = useState('')
  const [titles, setTitles] = useState<Set<string>>(new Set())
  const [done, setDone] = useState<number | null>(null)
  const cards = parseCards(text)
  const dupes = cards.filter((c) => titles.has(c.title.toLowerCase())).length

  useEffect(() => {
    db.cards.where('deckId').equals(deckId).toArray().then((cs) => setTitles(new Set(cs.map((c) => c.title?.trim().toLowerCase() ?? ''))))
  }, [deckId])

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <h2>Import cards</h2>
        {done === null ? (
          <>
            <p className="lede" style={{ margin: 0 }}>
              Paste cards written as <code>## 1. Title (Easy)</code>, <code>**Front**</code>, <code>**Back**</code> with a code block, separated by <code>---</code>.
            </p>
            <div className="row left">
              <button className="btn small" onClick={() => setText(sample)}>Use the LeetCode Hashing set (12 cards)</button>
              <label className="btn small">
                Choose a .md / .txt file
                <input
                  type="file"
                  accept=".md,.txt,text/markdown,text/plain"
                  hidden
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (f) setText(await f.text())
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            <textarea className="editor" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your cards here…" spellCheck={false} />
            {text.trim() && (
              <p className="soon" style={{ margin: 0 }}>
                {cards.length === 0
                  ? 'No cards found yet. Each one needs a ## heading, a **Front** and a **Back**.'
                  : `Found ${cards.length} card${cards.length === 1 ? '' : 's'}` + (dupes ? ` (${dupes} already in this deck will be skipped)` : '') + '.'}
              </p>
            )}
            <div className="row">
              <button className="btn ghost" onClick={onClose}>Cancel</button>
              <button className="btn" disabled={cards.length === 0 || dupes === cards.length} onClick={async () => setDone(await importCards(deckId, cards))}>
                Import {cards.length - dupes || ''} card{cards.length - dupes === 1 ? '' : 's'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="soon">Added {done} card{done === 1 ? '' : 's'} to this deck.</p>
            <div className="row"><button className="btn" onClick={onClose}>Done</button></div>
          </>
        )}
      </div>
    </div>
  )
}
