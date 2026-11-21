import { Link, NavLink } from 'react-router-dom'
import { toggleDark, useIsDark } from './theme'

/** Pixel + goo filters give headings the blobby pixel look. Block sizes match the heading sizes in CSS. */
function BlobFilters() {
  const sizes: Record<string, number> = { xs: 3, s: 4, m: 6, l: 9, xl: 12 }
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {Object.entries(sizes).map(([k, px]) => (
          <filter key={k} id={`blob-${k}`} x="-2%" y="-5%" width="104%" height="110%" colorInterpolationFilters="sRGB">
            <feFlood x={px / 2 - 1} y={px / 2 - 1} width="2" height="2" />
            <feComposite width={px} height={px} />
            <feTile result="grid" />
            <feComposite in="SourceGraphic" in2="grid" operator="in" />
            <feMorphology operator="dilate" radius={px / 2} />
            <feGaussianBlur stdDeviation={px / 4} />
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
          </filter>
        ))}
      </defs>
    </svg>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  const dark = useIsDark()
  return (
    <div className="shell">
      <BlobFilters />
      <header className="top">
        <Link to="/" className="logo">Recall</Link>
        <button className="icon-btn" onClick={toggleDark} aria-label="Toggle dark mode" title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? '☀' : '☾'}
        </button>
      </header>
      {children}
      <p className="byline">by Ellie</p>
      <nav className="dock">
        <NavLink to="/" end>Decks</NavLink>
        <NavLink to="/calendar">Calendar</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
    </div>
  )
}

export function Tabs() {
  return (
    <div className="tabs">
      <NavLink to="/" end className="tab">Decks</NavLink>
      <NavLink to="/calendar" className="tab">Calendar</NavLink>
    </div>
  )
}
