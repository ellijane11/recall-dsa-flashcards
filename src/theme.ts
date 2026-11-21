import { useSyncExternalStore } from 'react'

export type Mode = 'light' | 'dark' | 'auto'
interface Theme {
  mode: Mode
  bgLight?: string
  bgDark?: string
}

export const DEFAULT_LIGHT = '#F1EBDF'
export const DEFAULT_DARK = '#17150F'
const KEY = 'recall:theme'

function load(): Theme {
  try {
    return { mode: 'auto', ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { mode: 'auto' }
  }
}

let theme = load()
const listeners = new Set<() => void>()

/* ---------- colour helpers ---------- */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(v, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
/** Black or cream text, whichever reads better on this colour. */
export const readableOn = (hex: string) => (luminance(hex) > 0.4 ? '#1b1813' : '#f5efe3')

export function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}
export function hsvToHex(h: number, s: number, v: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return rgbToHex(f(5) * 255, f(3) * 255, f(1) * 255)
}
export function hexToHsv(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((x) => x / 255)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  return [(h * 60 + 360) % 360, max ? d / max : 0, max]
}

/* ---------- apply ---------- */
export function isDarkSystem() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}
export function resolvedMode(t = theme): 'light' | 'dark' {
  return t.mode === 'auto' ? (isDarkSystem() ? 'dark' : 'light') : t.mode
}
export function currentBg(t = theme) {
  return resolvedMode(t) === 'dark' ? t.bgDark ?? DEFAULT_DARK : t.bgLight ?? DEFAULT_LIGHT
}

export function applyTheme() {
  const bg = currentBg()
  const root = document.documentElement
  // Text colour follows the background's brightness, so any colour you pick stays readable.
  const dark = luminance(bg) < 0.4
  root.style.setProperty('--bg', bg)
  root.style.setProperty('--ink', dark ? '#f5efe3' : '#1b1813')
  root.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
}

function set(next: Theme) {
  theme = next
  localStorage.setItem(KEY, JSON.stringify(theme))
  applyTheme()
  listeners.forEach((l) => l())
}

export const setMode = (mode: Mode) => set({ ...theme, mode })
export const setBg = (hex: string) =>
  set(resolvedMode() === 'dark' ? { ...theme, bgDark: hex } : { ...theme, bgLight: hex })
export const resetBg = () =>
  set(resolvedMode() === 'dark' ? { ...theme, bgDark: undefined } : { ...theme, bgLight: undefined })
export function toggleDark() {
  setMode(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
}

window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (theme.mode === 'auto') {
    applyTheme()
    listeners.forEach((l) => l())
  }
})

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const useTheme = () => useSyncExternalStore(subscribe, () => theme)
/** 'light' | 'dark' as actually shown (depends on the background colour). */
export const useIsDark = () => {
  useTheme()
  return document.documentElement.dataset.theme === 'dark'
}
