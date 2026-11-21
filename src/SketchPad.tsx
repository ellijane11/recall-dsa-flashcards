import { useEffect, useRef, useState } from 'react'

const COLORS = ['#1a1816', '#F2492F', '#3E6FB0', '#6B8F71', '#E8834A']
const W = 900
const H = 600

export function SketchPad({ onSave, onClose }: { onSave: (png: string) => void; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const history = useRef<ImageData[]>([])
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(4)
  const [eraser, setEraser] = useState(false)

  const ctx = () => canvas.current!.getContext('2d')!

  useEffect(() => {
    const c = ctx()
    c.fillStyle = '#fffaf0'
    c.fillRect(0, 0, W, H)
    c.lineCap = 'round'
    c.lineJoin = 'round'
  }, [])

  function pos(e: React.PointerEvent) {
    const r = canvas.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }
  }

  function down(e: React.PointerEvent) {
    canvas.current!.setPointerCapture(e.pointerId)
    history.current.push(ctx().getImageData(0, 0, W, H))
    if (history.current.length > 30) history.current.shift()
    drawing.current = true
    last.current = pos(e)
    move(e)
  }

  function move(e: React.PointerEvent) {
    if (!drawing.current || !last.current) return
    const p = pos(e)
    const c = ctx()
    c.strokeStyle = eraser ? '#fffaf0' : color
    c.lineWidth = eraser ? size * 4 : size
    c.beginPath()
    c.moveTo(last.current.x, last.current.y)
    c.lineTo(p.x + 0.01, p.y)
    c.stroke()
    last.current = p
  }

  function up() {
    drawing.current = false
    last.current = null
  }

  function undo() {
    const prev = history.current.pop()
    if (prev) ctx().putImageData(prev, 0, 0)
  }

  function clear() {
    history.current.push(ctx().getImageData(0, 0, W, H))
    ctx().fillStyle = '#fffaf0'
    ctx().fillRect(0, 0, W, H)
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <h2>Sketch</h2>
        <div className="tools">
          {COLORS.map((c) => (
            <button
              key={c}
              aria-label={c}
              className={'swatch' + (!eraser && c === color ? ' on' : '')}
              style={{ background: c }}
              onClick={() => {
                setColor(c)
                setEraser(false)
              }}
            />
          ))}
          <button className={'btn small' + (eraser ? ' active' : '')} onClick={() => setEraser(!eraser)}>Eraser</button>
          <input type="range" min={2} max={14} value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Brush size" />
          <button className="btn small" onClick={undo}>Undo</button>
          <button className="btn small" onClick={clear}>Clear</button>
        </div>
        <canvas
          ref={canvas}
          width={W}
          height={H}
          className="sketch"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
        <div className="row">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => onSave(canvas.current!.toDataURL('image/png'))}>Add to card</button>
        </div>
      </div>
    </div>
  )
}
