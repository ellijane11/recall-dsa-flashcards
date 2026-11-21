import Dexie, { type EntityTable } from 'dexie'

export interface Deck {
  id: number
  title: string
  subtitle: string
  cover?: string // data URL
  color: string
  createdAt: number
  stage?: number // successful reviews in a row, drives the interval
  nextReview?: number // start-of-day timestamp
  lastReviewed?: number
  reviews?: { at: number; rating: string }[]
}

export interface Card {
  id: number
  deckId: number
  front: string // markdown
  back: string // markdown (code fences + ```mermaid diagrams)
  sketches?: string[] // PNG data URLs shown under the back
  title?: string // heading shown on top of the card
  color?: string // front colour; falls back to the deck colour
  frontImages?: string[] // pictures on the question side
  backImages?: string[] // pictures on the answer side
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
