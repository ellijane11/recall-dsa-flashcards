import Dexie, { type EntityTable } from 'dexie'

export interface Deck {
  id: number
  title: string
  subtitle: string
  cover?: string // data URL
  color: string
  createdAt: number
  scheduled?: boolean // in the revision schedule? (missing = yes)
  stage?: number // successful reviews in a row, drives the interval
  nextReview?: number // start-of-day timestamp
  lastReviewed?: number
  reviews?: { at: number; rating: string }[]
}

export interface Block {
  id: string
  label: string // e.g. "Thought process"
  color: string
  kind: 'text' | 'code'
  text: string // markdown for text blocks, raw source for code blocks
  lang?: string // code blocks only
}

export const BLOCK_COLORS = ['#3E6FB0', '#7A5BD0', '#6B8F71', '#E6B450', '#E8834A', '#C2547A', '#2E8B8B', '#93402B']

export const BLOCK_PRESETS: { name: string; kind: Block['kind']; color: string; text: string; lang?: string }[] = [
  { name: 'Thought process', kind: 'text', color: BLOCK_COLORS[0], text: '- ' },
  { name: 'Logic', kind: 'text', color: BLOCK_COLORS[1], text: '- ' },
  { name: 'Key insight', kind: 'text', color: BLOCK_COLORS[3], text: '- ' },
  { name: 'Code', kind: 'code', color: BLOCK_COLORS[2], text: 'def solve():\n    pass\n', lang: 'python' },
  { name: 'Complexity', kind: 'text', color: BLOCK_COLORS[5], text: '**Time:** O()  **Space:** O()' },
  { name: 'Diagram', kind: 'text', color: BLOCK_COLORS[6], text: '```mermaid\ngraph TD\n  A[Start] --> B[Next]\n```' },
  { name: 'Notes', kind: 'text', color: BLOCK_COLORS[4], text: '' },
]

export const newBlock = (p: (typeof BLOCK_PRESETS)[number]): Block => ({
  id: Math.random().toString(36).slice(2, 9),
  label: p.name,
  color: p.color,
  kind: p.kind,
  text: p.text,
  lang: p.lang,
})

/** The back side as blocks; older cards (one markdown blob) become a single block. */
export function blocksOf(c: Pick<Card, 'blocks' | 'back'>): Block[] {
  if (c.blocks) return c.blocks
  return c.back?.trim() ? [{ id: 'legacy', label: 'Solution', color: BLOCK_COLORS[0], kind: 'text', text: c.back }] : []
}

/** Plain-text copy of the blocks, kept in card.back. */
export const blocksToText = (bs: Block[]) =>
  bs
    .map((b) => `## ${b.label}\n` + (b.kind === 'code' ? '```' + (b.lang ?? '') + '\n' + b.text + '\n```' : b.text))
    .join('\n\n')

export interface Card {
  id: number
  deckId: number
  front: string // markdown
  back: string // plain-text copy of the back (see blocks)
  blocks?: Block[] // the back side, as coloured blocks
  sketches?: string[] // PNG data URLs shown under the back
  title?: string // heading shown on top of the card
  color?: string // front colour; falls back to the deck colour
  frontImages?: string[] // pictures on the question side
  backImages?: string[] // pictures on the answer side
  frontImageW?: number[] // picture widths in % of the card (0 = automatic), same order as frontImages
  backImageW?: number[]
  createdAt: number
}

/** Heading if set, otherwise the first meaningful line of the question. */
export function cardLabel(c: Card) {
  return (
    c.title?.trim() ||
    c.front.split('\n').map((l) => l.replace(/[#*`>_\-\[\]!()]/g, '').trim()).find(Boolean) ||
    'Untitled card'
  )
}

export const CARD_COLORS = ['#E8834A', '#93402B', '#F2492F', '#E6B450', '#6B8F71', '#3E6FB0', '#7A5BD0', '#C2547A', '#2E8B8B', '#2B2824']

export const db = new Dexie('recall') as Dexie & {
  decks: EntityTable<Deck, 'id'>
  cards: EntityTable<Card, 'id'>
}

db.version(1).stores({
  decks: '++id, title, createdAt',
  cards: '++id, deckId, createdAt',
})

db.version(2).stores({
  decks: '++id, title, createdAt',
  cards: '++id, deckId, createdAt',
})

export const DECK_COLORS = ['#E8834A', '#93402B', '#F2492F', '#E6B450', '#6B8F71', '#3E6FB0']

/** Downscale an uploaded image to keep IndexedDB small. */
export function fileToCover(file: File, max = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = url
  })
}
