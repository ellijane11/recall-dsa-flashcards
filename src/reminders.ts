import { db } from './db'
import { isDue, projection, startOfDay } from './schedule'

export const notificationsSupported = () => 'Notification' in window && 'serviceWorker' in navigator

/** Shows one "decks due" notification per day, when the app is opened and permission was granted. */
export async function notifyIfDue() {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  const key = 'recall:lastNotified'
  const today = String(startOfDay(Date.now()))
  if (localStorage.getItem(key) === today) return
  const decks = (await db.decks.toArray()).filter((d) => isDue(d))
  if (!decks.length) return
  localStorage.setItem(key, today)
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification('Time to recall', {
    body: decks.map((d) => d.title).join(', ') + ' — due for review today.',
    icon: 'icon-192.png',
    tag: 'recall-due',
  })
}

const pad = (n: number) => String(n).padStart(2, '0')
const stamp = (t: number, hour: number, min = 0) => {
  const d = new Date(t)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hour)}${pad(min)}00`
}
const esc = (s: string) => s.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n')

/** Calendar file with every upcoming review (and an alarm at the event time) for Google/Apple Calendar. */
export async function buildIcs(hour = 9) {
  const decks = await db.decks.toArray()
  const url = location.href.split('#')[0]
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Recall//DSA flashcards//EN', 'CALSCALE:GREGORIAN']
  for (const d of decks) {
    const dates = [Math.max(d.nextReview ?? startOfDay(d.createdAt), startOfDay(Date.now())), ...projection(d)]
    dates.forEach((t, i) => {
      lines.push(
        'BEGIN:VEVENT',
        `UID:recall-${d.id}-${stamp(t, hour)}@recall.local`,
        `DTSTAMP:${stamp(Date.now(), 0)}`,
        `DTSTART:${stamp(t, hour)}`,
        `DTEND:${stamp(t, hour, 30)}`,
        `SUMMARY:${esc(`Recall: ${d.title}`)}`,
        `DESCRIPTION:${esc(`${i === 0 ? 'Due' : 'Planned'} review of ${d.title}. ${url}`)}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${esc(`Review ${d.title}`)}`,
        'TRIGGER:PT0S',
        'END:VALARM',
        'END:VEVENT',
      )
    })
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function download(name: string, text: string, type: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export async function exportBackup() {
  const data = { app: 'recall', version: 1, exportedAt: Date.now(), decks: await db.decks.toArray(), cards: await db.cards.toArray() }
  download(`recall-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data), 'application/json')
}

export async function importBackup(file: File) {
  const data = JSON.parse(await file.text())
  if (data?.app !== 'recall' || !Array.isArray(data.decks) || !Array.isArray(data.cards)) throw new Error('Not a Recall backup file')
  await db.transaction('rw', db.decks, db.cards, async () => {
    await db.decks.clear()
    await db.cards.clear()
    await db.decks.bulkAdd(data.decks)
    await db.cards.bulkAdd(data.cards)
  })
  return { decks: data.decks.length, cards: data.cards.length }
}

