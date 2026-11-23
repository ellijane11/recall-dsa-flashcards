import { useState } from 'react'
import { BLOCK_COLORS, BLOCK_PRESETS, blocksOf, blocksToText, CARD_COLORS, db, fileToCover, newBlock, type Block, type Card } from './db'
import { BlockView, CodeEdit } from './Blocks'
import { RichText } from './RichText'
import { LANGS, normLang } from './highlight'
import { Md } from './Md'
import { SketchPad } from './SketchPad'

export function CardEditor({ deckId, card, onClose }: { deckId: number; card?: Card; onClose: () => void }) {
  const [title, setTitle] = useState(card?.title ?? '')
  const [color, setColor] = useState<string | undefined>(card?.color)
  const [front, setFront] = useState(card?.front ?? '')
  const [blocks, setBlocks] = useState<Block[]>(() =>
    card ? blocksOf(card) : ['Thought process', 'Logic', 'Code', 'Complexity'].map((n) => newBlock(BLOCK_PRESETS.find((p) => p.name === n)!)),
  )
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null) // block whose colour/language strip is open
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [preview, setPreview] = useState(false)
  const [frontImages, setFrontImages] = useState<string[]>(card?.frontImages ?? [])
  const [backImages, setBackImages] = useState<string[]>(card?.backImages ?? [])
  const [sketches, setSketches] = useState<string[]>(card?.sketches ?? [])
  const [sketching, setSketching] = useState(false)

  const images = side === 'front' ? frontImages : backImages
  const setImages = side === 'front' ? setFrontImages : setBackImages

  async function addImages(files: FileList | File[]) {
    const added: string[] = []
    for (const f of Array.from(files)) if (f.type.startsWith('image/')) added.push(await fileToCover(f, 1400))
    if (added.length) setImages((prev) => [...prev, ...added])
  }

  const patch = (id: string, p: Partial<Block>) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...p } : b)))
  const move = (i: number, d: number) =>
    setBlocks((bs) => {
      const c = [...bs]
      ;[c[i], c[i + d]] = [c[i + d], c[i]]
      return c
    })
  const pasteImages = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'))
    if (files.length) {
      e.preventDefault()
      addImages(files)
    }
  }

  async function save() {
    if (!front.trim() && !frontImages.length) return
    const data = { title: title.trim(), color, front, back: blocksToText(blocks), blocks, frontImages, backImages, sketches }
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
            {side === 'front' ? <Md text={front} /> : blocks.map((b) => <BlockView key={b.id} block={b} />)}
            {images.map((s, i) => <img key={i} className="card-img" src={s} alt={`Image ${i + 1}`} />)}
          </div>
        ) : side === 'front' ? (
          <RichText
            value={front}
            onChange={setFront}
            onPaste={pasteImages}
            placeholder="Write the problem… (you can paste a picture here too)"
          />
        ) : (
          <div className="eblocks">
            {blocks.map((b, i) => (
              <div key={b.id} className="eb" style={{ ['--bc' as string]: b.color }}>
                <div className="eb-head">
                  <input
                    className="eb-label"
                    value={b.label}
                    placeholder="Block name"
                    onChange={(e) => patch(b.id, { label: e.target.value })}
                  />
                  <div className="eb-tools">
                    <button className={'icon' + (openId === b.id ? ' on' : '')} aria-label="Block options" onClick={() => setOpenId(openId === b.id ? null : b.id)}>⋯</button>
                    <button className="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                    <button className="icon" aria-label="Move down" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>↓</button>
                    <button className="icon" aria-label="Delete block" onClick={() => setBlocks(blocks.filter((x) => x.id !== b.id))}>×</button>
                  </div>
                </div>
                {openId === b.id && <div className="swatches small hstrip">
                  {BLOCK_COLORS.map((c) => (
                    <button
                      key={c}
                      aria-label={c}
                      className={'swatch' + (c === b.color ? ' on' : '')}
                      style={{ background: c }}
                      onClick={() => patch(b.id, { color: c })}
                    />
                  ))}
                  <label className={'swatch custom' + (BLOCK_COLORS.includes(b.color) ? '' : ' on')} style={{ background: b.color }} title="Pick any colour">
                    <input type="color" value={b.color} onChange={(e) => patch(b.id, { color: e.target.value })} />
                  </label>
                  {b.kind === 'code' && (
                    <select className="lang" value={normLang(b.lang) ?? ''} onChange={(e) => patch(b.id, { lang: e.target.value })}>
                      {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  )}
                </div>}
                {b.kind === 'code' ? (
                  <CodeEdit value={b.text} lang={b.lang} onChange={(v) => patch(b.id, { text: v })} />
                ) : (
                  <RichText
                    className="editor eb-text"
                    value={b.text}
                    onChange={(v) => patch(b.id, { text: v })}
                    onPaste={pasteImages}
                    placeholder="Markdown works here: lists, **bold**, ```code```… Select text to colour or highlight it."
                  />
                )}
              </div>
            ))}
            <div className="add-block">
              <button className="btn small" onClick={() => setAdding(!adding)}>+ Add block</button>
              {adding && (
                <div className="presets">
                  {BLOCK_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      className="chip"
                      onClick={() => {
                        setBlocks([...blocks, newBlock(p)])
                        setAdding(false)
                      }}
                    >
                      <span className="dot" style={{ background: p.color }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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
          {side === 'back' && <button className="btn small" onClick={() => setSketching(true)}>+ Sketch</button>}
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
