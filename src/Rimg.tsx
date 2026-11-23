import { useRef } from 'react'

/**
 * A picture with an optional corner handle: drag it to resize.
 * `width` is a percentage of the card width (0 or undefined = automatic size).
 */
export function Rimg({
  src,
  alt,
  width,
  onResize,
}: {
  src: string
  alt: string
  width?: number
  onResize?: (percent: number) => void
}) {
  const box = useRef<HTMLDivElement>(null)

  function start(e: React.PointerEvent<HTMLButtonElement>) {
    const el = box.current
    if (!el || !onResize) return
    e.preventDefault()
    e.stopPropagation()
    const handle = e.currentTarget
    const parentW = el.parentElement?.clientWidth || el.clientWidth
    const startX = e.clientX
    const startPct = (el.clientWidth / parentW) * 100
    handle.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) => {
      const pct = startPct + ((ev.clientX - startX) / parentW) * 100
      onResize(Math.round(Math.min(100, Math.max(10, pct))))
    }
    const up = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      handle.removeEventListener('pointercancel', up)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
    handle.addEventListener('pointercancel', up)
  }

  return (
    <div ref={box} className={'rimg' + (width ? ' sized' : '')} style={width ? { width: `${width}%` } : undefined}>
      <img src={src} alt={alt} draggable={false} />
      {onResize && (
        <button className="rimg-h" aria-label="Drag to resize" title="Drag to resize" onPointerDown={start}>
          ◢
        </button>
      )}
    </div>
  )
}
