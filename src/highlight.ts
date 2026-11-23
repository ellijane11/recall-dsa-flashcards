import type { HighlighterCore } from 'shiki/core'

/** VS Code's own grammars and its Dark+ / Light+ themes, loaded on demand. */
export const LANGS: Record<string, { label: string; load: () => Promise<unknown> }> = {
  python: { label: 'Python', load: () => import('shiki/langs/python.mjs') },
  javascript: { label: 'JavaScript', load: () => import('shiki/langs/javascript.mjs') },
  typescript: { label: 'TypeScript', load: () => import('shiki/langs/typescript.mjs') },
  java: { label: 'Java', load: () => import('shiki/langs/java.mjs') },
  cpp: { label: 'C++', load: () => import('shiki/langs/cpp.mjs') },
  c: { label: 'C', load: () => import('shiki/langs/c.mjs') },
  csharp: { label: 'C#', load: () => import('shiki/langs/csharp.mjs') },
  go: { label: 'Go', load: () => import('shiki/langs/go.mjs') },
  rust: { label: 'Rust', load: () => import('shiki/langs/rust.mjs') },
  kotlin: { label: 'Kotlin', load: () => import('shiki/langs/kotlin.mjs') },
  swift: { label: 'Swift', load: () => import('shiki/langs/swift.mjs') },
  sql: { label: 'SQL', load: () => import('shiki/langs/sql.mjs') },
  json: { label: 'JSON', load: () => import('shiki/langs/json.mjs') },
  bash: { label: 'Bash', load: () => import('shiki/langs/bash.mjs') },
}

const ALIASES: Record<string, string> = {
  py: 'python', python3: 'python', js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  'c++': 'cpp', cc: 'cpp', cxx: 'cpp', 'c#': 'csharp', cs: 'csharp', golang: 'go', rs: 'rust', kt: 'kotlin',
  sh: 'bash', shell: 'bash', zsh: 'bash',
}

export function normLang(lang?: string) {
  const l = (lang ?? '').trim().toLowerCase()
  const n = ALIASES[l] ?? l
  return n in LANGS ? n : undefined
}

let corePromise: Promise<HighlighterCore> | null = null
function core() {
  corePromise ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
    ])
    return createHighlighterCore({
      themes: [import('shiki/themes/dark-plus.mjs'), import('shiki/themes/light-plus.mjs')],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return corePromise
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Plain, unhighlighted fallback shown until the grammar has loaded. */
export const plainCode = (code: string) => `<pre class="shiki plain"><code>${escapeHtml(code)}</code></pre>`

/** Returns VS Code-coloured HTML (a <pre class="shiki">). Falls back to plain text. */
export async function highlight(code: string, lang: string | undefined, dark: boolean): Promise<string> {
  const l = normLang(lang)
  if (!l) return plainCode(code)
  try {
    const h = await core()
    if (!h.getLoadedLanguages().includes(l)) await h.loadLanguage(LANGS[l].load() as never)
    return h.codeToHtml(code, { lang: l, theme: dark ? 'dark-plus' : 'light-plus' })
  } catch {
    return plainCode(code)
  }
}
