import { useEffect, useState } from 'react'
import { blocksOf, type Block, type Card } from './db'
import { LANGS, highlight, normLang, plainCode } from './highlight'
import { Md } from './Md'
import { useIsDark } from './theme'

/** Read-only highlighted code, coloured like VS Code (Dark+ / Light+). */
export function CodeView({ code, lang }: { code: string; lang?: string }) {
  const dark = useIsDark()
  const [html, setHtml] = useState(() => plainCode(code))
  useEffect(() => {
    let off = false
    highlight(code, lang, dark).then((h) => !off && setHtml(h))
    return () => {
      off = true
    }
  }, [code, lang, dark])
  return <div className="code-box" dangerouslySetInnerHTML={{ __html: html }} />
}

/** A textarea laid over its own highlighted copy, so code is coloured while you type. */
export function CodeEdit({ value, lang, onChange }: { value: string; lang?: string; onChange: (v: string) => void }) {
  const dark = useIsDark()
  const [html, setHtml] = useState(() => plainCode(value + '\n'))
  useEffect(() => {
    let off = false
    highlight(value + '\n', lang, dark).then((h) => !off && setHtml(h))
    return () => {
      off = true
    }
  }, [value, lang, dark])

  return (
    <div className="code-edit">
      <div className="code-box" dangerouslySetInnerHTML={{ __html: html }} />
      <textarea
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Tab') return
          e.preventDefault()
          const t = e.currentTarget
          const { selectionStart: a, selectionEnd: b } = t
          onChange(value.slice(0, a) + '    ' + value.slice(b))
          requestAnimationFrame(() => t.setSelectionRange(a + 4, a + 4))
        }}
      />
    </div>
  )
}

export function langLabel(lang?: string) {
  const l = normLang(lang)
  return l ? LANGS[l].label : lang || ''
}

/** The coloured blocks shown on the back of a card. */
export function BackBlocks({ card }: { card: Pick<Card, 'blocks' | 'back'> }) {
  return (
    <>
      {blocksOf(card).map((b) => (
        <BlockView key={b.id} block={b} />
      ))}
    </>
  )
}

export function BlockView({ block }: { block: Block }) {
  return (
    <section className="blk" style={{ ['--bc' as string]: block.color }}>
      <header className="blk-head">
        <span>{block.label || (block.kind === 'code' ? 'Code' : 'Notes')}</span>
        {block.kind === 'code' && <span className="blk-lang">{langLabel(block.lang)}</span>}
      </header>
      <div className="blk-body">
        {block.kind === 'code' ? <CodeView code={block.text} lang={block.lang} /> : <Md text={block.text} />}
      </div>
    </section>
  )
}
