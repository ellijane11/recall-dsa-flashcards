import { useRef, useState } from 'react'
import { hexToHsv, hsvToHex } from './theme'

/** Hue wheel (angle = hue, distance from centre = saturation) plus a brightness slider. */
export function ColorWheel({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(value))
  const wheel = useRef<HTMLDivElement>(null)
  const [h, s, v] = hsv

  function emit(next: [number, number, number]) {
    setHsv(next)
    onChange(hsvToHex(...next))
  }

  function pick(e: React.PointerEvent) {
    const r = wheel.current!.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360 + 90) % 360 // 0° at the top
    const sat = Math.min(1, Math.hypot(dx, dy) / (r.width / 2))
    emit([hue, sat, v])
  }

  const angle = ((h - 90) * Math.PI) / 180
  const knob = { left: `${50 + Math.cos(angle) * s * 50}%`, top: `${50 + Math.sin(angle) * s * 50}%` }

  return (
    <div className="wheel-wrap">
      <div className="wheel-box">
      <div
        ref={wheel}
        className="wheel"
        style={{ filter: `brightness(${0.25 + v * 0.75})` }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          pick(e)
        }}
        onPointerMove={(e) => e.buttons && pick(e)}
      />
      <div className="wheel-knob" style={{ ...knob, background: hsvToHex(h, s, v) }} />
      </div>
      <label className="pixel wheel-v">
        Brightness
        <input type="range" min={0} max={100} value={Math.round(v * 100)} onChange={(e) => emit([h, s, Number(e.target.value) / 100])} />
      </label>
    </div>
  )
}
