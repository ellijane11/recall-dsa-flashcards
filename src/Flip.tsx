import { useEffect, useState } from 'react'
import { Md } from './Md'
import { BackBlocks } from './Blocks'
import type { Card } from './db'
import { readableOn } from './theme'

export function FlipCard({ card, color: deckColor }: { card: Card; color: string }) {
  const [flipped, setFlipped] = useState(false)
  useEffect(() => setFlipped(false), [card.id])
  const color = card.color ?? deckColor
  const title = card.title?.trim()

  return (
    <div className="flip" onClick={() => setFlipped((f) => !f)}>
      <div className={'flip-inner' + (flipped ? ' flipped' : '')}>
        <div className="face front" style={{ background: color, color: readableOn(color) }}>
          <span className="tag">Problem</span>
          <div className="scroll">
            <div className="center">
              {title && <h2 className="card-title">{title}</h2>}
              <Md text={card.front} />
              {card.frontImages?.map((s, i) => <img key={i} className="card-img" src={s} alt={`Question image ${i + 1}`} />)}
            </div>
          </div>
          <span className="hint">tap to flip</span>
        </div>
        <div className="face back" style={{ borderTop: `8px solid ${color}` }}>
          <span className="tag">Solution{title ? ` · ${title}` : ''}</span>
          <div className="scroll" onClick={(e) => e.stopPropagation()}>
            <BackBlocks card={card} />
            {card.backImages?.map((s, i) => <img key={i} className="card-img" src={s} alt={`Answer image ${i + 1}`} />)}
            {card.sketches?.map((s, i) => <img key={i} className="sketch-img" src={s} alt={`Sketch ${i + 1}`} />)}
          </div>
          <span className="hint" onClick={() => setFlipped(false)}>tap to flip back</span>
        </div>
      </div>
    </div>
  )
}
