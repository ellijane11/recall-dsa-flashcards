import { useEffect, useMemo, useRef } from 'react'
import { Marked } from 'marked'
import { useIsDark } from './theme'
import hljs from 'highlight.js/lib/common'

const marked = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }) {
      if (lang === 'mermaid') {
        return `<div class="mermaid-box" data-code="${encodeURIComponent(text)}"></div>`
      }
      const language = lang && hljs.getLanguage(lang) ? lang : undefined
      const html = language ? hljs.highlight(text, { language }).value : hljs.highlightAuto(text).value
      return `<pre><code class="hljs">${html}</code></pre>`
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
  const html = useMemo(() => marked.parse(text || '') as string, [text])
  const ref = useRef<HTMLDivElement>(null)
  const dark = useIsDark()

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
