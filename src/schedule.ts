import type { Deck } from './db'

/** Gaps in days between reviews: the 2-3-5-7 method, then longer spacing as it sticks. */
export const LADDER = [2, 3, 5, 7, 14, 30, 60]

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const addDays = (t: number, n: number) => {
  const d = new Date(t)
  d.setDate(d.getDate() + n)
  return startOfDay(d.getTime())
}

/** When the deck is next due (a deck never reviewed is due the day it was made). */
export const dueOf = (d: Deck) => d.nextReview ?? startOfDay(d.createdAt)

/** Overdue decks are shown as due today. */
export const effectiveDue = (d: Deck, now = Date.now()) => Math.max(dueOf(d), startOfDay(now))

export const isDue = (d: Deck, now = Date.now()) => dueOf(d) <= startOfDay(now)

export function applyRating(d: Deck, rating: Rating, now = Date.now()) {
  const stage = d.stage ?? 0
  const newStage = rating === 'again' ? 0 : rating === 'hard' ? stage : rating === 'good' ? stage + 1 : stage + 2
  const gap = rating === 'again' ? 1 : LADDER[Math.min(Math.max(newStage - 1, 0), LADDER.length - 1)]
  const today = startOfDay(now)
  return {
    stage: newStage,
    nextReview: addDays(today, gap),
    lastReviewed: now,
    reviews: [...(d.reviews ?? []), { at: now, rating }],
  }
}

/** Future due dates if every review from now on goes "Good". */
export function projection(d: Deck, count = 4, now = Date.now()) {
  const out: number[] = []
  let date = effectiveDue(d, now)
  let stage = d.stage ?? 0
  for (let i = 0; i < count; i++) {
    date = addDays(date, LADDER[Math.min(stage, LADDER.length - 1)])
    stage++
    out.push(date)
  }
  return out
}

export function dueLabel(d: Deck, now = Date.now()) {
  const diff = Math.round((dueOf(d) - startOfDay(now)) / 86400000)
  if (diff <= 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `Due in ${diff} days`
}
