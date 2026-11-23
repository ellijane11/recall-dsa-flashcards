import { useRef } from 'react'

const TEXT_COLORS = ['#E2552F', '#E8834A', '#C99700', '#2F9E5B', '#2E8B8B', '#3E6FB0', '#7A5BD0', '#C2547A']
const HILITES = ['#FFE066', '#FFC9A8', '#B8F0C8', '#B5E3F5', '#D9C8FF', '#FFC2DA']
const TINT = /\[\[[ch]:#[0-9a-fA-F]{3,8}\|([^\]]*)\]\]/g

/** A textarea with a small toolbar: select text, then tap a colour to recolour or highlight it. */
export function RichText({
  value,
  onChange,
  onPaste,
  placeholder,
  className = 'editor',
}: {
  value: string
  onChange: (v: string) => void
  onPaste?: (e: React.ClipboardEvent) => void
  placeholder?: string
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function edit(fn: (sel: string) => string) {
    const t = ref.current
    if (!t) return
    const a = t.selectionStart
    const b = t.selectionEnd
    const sel = value.slice(a, b)
    if (!sel) {
      t.focus()
      return
    }
    const out = fn(sel)
    onChange(value.slice(0, a) + out + value.slice(b))
    requestAnimationFrame(() => {
      t.focus()
      t.setSelectionRange(a, a + out.length)
    })
  }

  const tint = (kind: 'c' | 'h', color: string) => edit((s) => `[[${kind}:${color}|${s.replace(TINT, '$1')}]]`)
  // Keep the text selection when tapping toolbar buttons.
  const keep = (e: React.MouseEvent | React.PointerEvent) => e.preventDefault()

  return (
    <div className="rich">
      <div className="rich-bar" onMouseDown={keep}>
        <button className="rt-b" title="Bold" onClick={() => edit((s) => `**${s}**`)}><b>B</b></button>
        <span className="rt-label">Text</span>
        {TEXT_COLORS.map((c) => (
          <button key={c} aria-label={`Text colour ${c}`} className="rt-dot" style={{ background: c }} onClick={() => tint('c', c)} />
        ))}
        <label className="rt-dot custom" title="Any text colour">
          <input type="color" defaultValue="#E2552F" onChange={(e) => tint('c', e.target.value)} />
        </label>
        <span className="rt-label">Highlight</span>
        {HILITES.map((c) => (
          <button key={c} aria-label={`Highlight ${c}`} className="rt-dot" style={{ background: c }} onClick={() => tint('h', c)} />
        ))}
        <label className="rt-dot custom" title="Any highlight colour">
          <input type="color" defaultValue="#FFE066" onChange={(e) => tint('h', e.target.value)} />
        </label>
        <button className="rt-b" title="Remove colour and highlight from the selection" onClick={() => edit((s) => s.replace(TINT, '$1'))}>Clear</button>
      </div>
      <textarea
        ref={ref}
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  )
}
