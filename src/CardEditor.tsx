import { useState } from 'react'
import { CARD_COLORS, db, fileToCover, type Card } from './db'
import { Md } from './Md'
import { SketchPad } from './SketchPad'

const BACK_TEMPLATE = `## Thought process
-

## Key insight
-

## Code
\`\`\`python
def solve():
    pass
\`\`\`

**Time:** O()  **Space:** O()
`

export function CardEditor({ deckId, card, onClose }: { deckId: number; card?: Card; onClose: () => void }) {
  const [title, setTitle] = useState(card?.title ?? '')
  const [color, setColor] = useState<string | undefined>(card?.color)
  const [front, setFront] = useState(card?.front ?? '')
  const [back, setBack] = useState(card?.back ?? BACK_TEMPLATE)
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [preview, setPreview] = useState(false)
  const [frontImages, setFrontImages] = useState<string[]>(card?.frontImages ?? [])
  const [backImages, setBackImages] = useState<string[]>(card?.backImages ?? [])
  const [sketches, setSketches] = useState<string[]>(card?.sketches ?? [])
  const [sketching, setSketching] = useState(false)

  const text = side === 'front' ? front : back
  const setText = side === 'front' ? setFront : setBack
  const images = side === 'front' ? frontImages : backImages
  const setImages = side === 'front' ? setFrontImages : setBackImages

  async function addImages(files: FileList | File[]) {
    const added: string[] = []
    for (const f of Array.from(files)) if (f.type.startsWith('image/')) added.push(await fileToCover(f, 1400))
    if (added.length) setImages((prev) => [...prev, ...added])
  }

  async function save() {
    if (!front.trim() && !frontImages.length) return
    const data = { title: title.trim(), color, front, back, frontImages, backImages, sketches }
    if (card) await db.cards.update(card.id, data)
    else await db.cards.add({ deckId, ...data, createdAt: Date.now() } as Card)
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <h2>{card ? 'Edit card' : 'New card'}</h2>

        <input placeholder="Heading (e.g. Two Sum)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="swatches" aria-label="Card colour">
          <button className={'btn small' + (color === undefined ? ' active' : '')} onClick={() => setColor(undefined)}>Deck colour</button>
          {CARD_COLORS.map((c) => (
            <button
              key={c}
              aria-label={c}
              className={'swatch' + (c === color ? ' on' : '')}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="seg">
          <button className={side === 'front' ? 'on' : ''} onClick={() => setSide('front')}>Front · problem</button>
          <button className={side === 'back' ? 'on' : ''} onClick={() => setSide('back')}>Back · solution</button>
        </div>
        <div className="seg">
          <button className={!preview ? 'on' : ''} onClick={() => setPreview(false)}>Write</button>
          <button className={preview ? 'on' : ''} onClick={() => setPreview(true)}>Preview</button>
        </div>

        {preview ? (
          <div className="editor preview">
            <Md text={text} />
            {images.map((s, i) => <img key={i} className="card-img" src={s} alt={`Image ${i + 1}`} />)}
          </div>
        ) : (
          <textarea
            className="editor"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'))
              if (files.length) {
                e.preventDefault()
                addImages(files)
              }
            }}
            placeholder={side === 'front' ? 'Write the problem… (you can paste a picture here too)' : 'Markdown: thoughts, ```code``` blocks, lists… (paste a picture too)'}
            spellCheck={false}
          />
        )}

        <div className="row left">
          <label className="btn small">
            + Picture
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) addImages(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
          {side === 'back' && (
            <>
              <button className="btn small" onClick={() => setText(text + '\n```mermaid\ngraph TD\n  A[Start] --> B[Next]\n```\n')}>+ Mermaid diagram</button>
              <button className="btn small" onClick={() => setSketching(true)}>+ Sketch</button>
            </>
          )}
        </div>

        {(images.length > 0 || (side === 'back' && sketches.length > 0)) && (
          <div className="thumbs">
            {images.map((s, i) => (
              <div key={'p' + i} className="thumb">
                <img src={s} alt={`Picture ${i + 1}`} />
                <button aria-label="Remove picture" onClick={() => setImages(images.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            {side === 'back' &&
              sketches.map((s, i) => (
                <div key={'s' + i} className="thumb">
                  <img src={s} alt={`Sketch ${i + 1}`} />
                  <button aria-label="Remove sketch" onClick={() => setSketches(sketches.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
          </div>
        )}

        <div className="row">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save} disabled={!front.trim() && !frontImages.length}>Save</button>
        </div>
      </div>
      {sketching && (
        <div onClick={(e) => e.stopPropagation()}>
          <SketchPad
            onClose={() => setSketching(false)}
            onSave={(png) => {
              setSketches([...sketches, png])
              setSketching(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
