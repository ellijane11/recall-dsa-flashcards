import { useEffect, useMemo, useRef } from 'react'
import { Marked } from 'marked'
import { useIsDark } from './theme'
import { highlight, plainCode } from './highlight'
import { upgradeTint } from './tint'

const marked = new Marked({
  gfm: true,
  breaks: true,
  // ⟦c:#hex|text⟧ recolours text, ⟦h:#hex|text⟧ highlights it (written by the editor toolbar).
  extensions: [
    {
      name: 'tint',
      level: 'inline',
      start: (src: string) => src.indexOf('⟦'),
      tokenizer(this: any, src: string) {
        const m = /^⟦([ch]):(#[0-9a-fA-F]{3,8})\|([^⟧]*)⟧/.exec(src)
        if (m) return { type: 'tint', raw: m[0], kind: m[1], color: m[2], tokens: this.lexer.inlineTokens(m[3]) }
      },
      renderer(this: any, t: any) {
        const inner = this.parser.parseInline(t.tokens)
        return t.kind === 'h'
          ? `<mark class="hl" style="background:${t.color}">${inner}</mark>`
          : `<span style="color:${t.color}">${inner}</span>`
      },
    },
  ],
  renderer: {
    code({ text, lang }) {
      if (lang === 'mermaid') {
        return `<div class="mermaid-box" data-code="${encodeURIComponent(text)}"></div>`
      }
      return `<div class="code-box" data-lang="${(lang ?? '').replace(/[^\w+#-]/g, '')}" data-code="${encodeURIComponent(text)}">${plainCode(text)}</div>`
    },
    // Raw HTML typed into notes is shown as text, not executed.
    html({ text }) {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    },
  },
})

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null
function loadMermaid() {
  mermaidPromise ??= import('mermaid').then((m) => m.default)
  return mermaidPromise
}

let uid = 0

export function Md({ text }: { text: string }) {
  const html = useMemo(() => marked.parse(upgradeTint(text || '')) as string, [text])
  const ref = useRef<HTMLDivElement>(null)
  const dark = useIsDark()

  useEffect(() => {
    const codes = ref.current?.querySelectorAll<HTMLElement>('.code-box')
    if (!codes?.length) return
    let cancelled = false
    codes.forEach(async (box) => {
      const out = await highlight(decodeURIComponent(box.dataset.code ?? ''), box.dataset.lang, dark)
      if (!cancelled) box.innerHTML = out
    })
    return () => {
      cancelled = true
    }
  }, [html, dark])

  useEffect(() => {
    const boxes = ref.current?.querySelectorAll<HTMLElement>('.mermaid-box')
    if (!boxes?.length) return
    let cancelled = false
    loadMermaid().then(async (mermaid) => {
      mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'neutral', securityLevel: 'strict' })
      for (const box of boxes) {
        const code = decodeURIComponent(box.dataset.code ?? '')
        try {
          const { svg } = await mermaid.render(`mmd-${uid++}`, code)
          if (!cancelled) box.innerHTML = svg
        } catch (e) {
          if (!cancelled) box.innerHTML = `<pre class="mm-err">Diagram error: ${String((e as Error).message ?? e).replace(/</g, '&lt;')}</pre>`
          document.querySelectorAll('[id^="dmmd-"]').forEach((n) => n.remove())
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [html, dark])

  return <div ref={ref} className="md" dangerouslySetInnerHTML={{ __html: html }} />
}
