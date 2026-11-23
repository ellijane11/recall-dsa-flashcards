import { BLOCK_COLORS, blocksToText, db, newBlock, type Block, type Card } from './db'

/*
 * Reads cards written as text:
 *
 *   ## 1. Two Sum (Easy)
 *   **Front**
 *   the problem…
 *   **Back**
 *   notes…, an "O(n) time" line, and a ```python code fence
 *   ---
 */

export interface ParsedCard {
  title: string
  color?: string
  front: string
  blocks: Block[]
}

const DIFFICULTY: Record<string, string> = { easy: '#6B8F71', medium: '#E6B450', hard: '#F2492F' }
const COMPLEXITY = /^(average\s+)?O\(/i

export function parseCards(md: string): ParsedCard[] {
  const out: ParsedCard[] = []
  for (const chunk of md.split(/^[ \t]*---[ \t]*$/m)) {
    const h = /^##\s+(.+)$/m.exec(chunk)
    const f = /^\*\*Front\*\*[ \t]*$/m.exec(chunk)
    const b = /^\*\*Back\*\*[ \t]*$/m.exec(chunk)
    if (!h || !f || !b || b.index < f.index) continue

    const front = chunk.slice(f.index + f[0].length, b.index).trim()
    const back = chunk.slice(b.index + b[0].length).trim()

    const m = /^(\d+)\.\s*(.+?)\s*\((Easy|Medium|Hard)\)\s*$/i.exec(h[1].trim())
    const title = m ? `${m[1]}. ${m[2]}` : h[1].trim()
    const color = m ? DIFFICULTY[m[3].toLowerCase()] : undefined

    const fence = /```(\w*)[ \t]*\n([\s\S]*?)\n```/.exec(back)
    const prose = (fence ? back.slice(0, fence.index) + back.slice(fence.index + fence[0].length) : back)
      .split('\n')
      .map((l) => l.trimEnd())
    const complexity = prose.filter((l) => COMPLEXITY.test(l.trim())).join('\n').trim()
    const approach = prose.filter((l) => !COMPLEXITY.test(l.trim())).join('\n').trim()

    const blocks: Block[] = []
    if (approach) blocks.push(newBlock({ name: 'Approach', kind: 'text', color: BLOCK_COLORS[0], text: approach }))
    if (fence) blocks.push(newBlock({ name: 'Code', kind: 'code', color: BLOCK_COLORS[2], text: fence[2].replace(/\s+$/, ''), lang: fence[1] || 'python' }))
    if (complexity) blocks.push(newBlock({ name: 'Complexity', kind: 'text', color: BLOCK_COLORS[5], text: complexity }))

    out.push({ title, color, front, blocks })
  }
  return out
}

/** Adds the cards to a deck, skipping ones whose heading is already there. Returns how many were added. */
export async function importCards(deckId: number, cards: ParsedCard[]) {
  const have = new Set((await db.cards.where('deckId').equals(deckId).toArray()).map((c) => c.title?.trim().toLowerCase()))
  const fresh = cards.filter((c) => !have.has(c.title.toLowerCase()))
  const now = Date.now()
  await db.cards.bulkAdd(
    fresh.map(
      (c, i) =>
        ({
          deckId,
          title: c.title,
          color: c.color,
          front: c.front,
          back: blocksToText(c.blocks),
          blocks: c.blocks,
          createdAt: now + i, // keeps the order they were written in
        }) as Card,
    ),
  )
  return fresh.length
}
