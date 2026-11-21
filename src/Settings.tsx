import { useState } from 'react'
import { Shell } from './Shell'
import { ColorWheel } from './ColorWheel'
import { currentBg, resetBg, setBg, setMode, useTheme } from './theme'
import { buildIcs, download, exportBackup, importBackup, notificationsSupported, notifyIfDue } from './reminders'

export function SettingsPage() {
  const theme = useTheme()
  const [msg, setMsg] = useState('')
  const [resetN, setResetN] = useState(0)
  const [hour, setHour] = useState(9)
  const [perm, setPerm] = useState(notificationsSupported() ? Notification.permission : 'unsupported')

  async function enable() {
    const p = await Notification.requestPermission()
    setPerm(p)
    if (p === 'granted') {
      localStorage.removeItem('recall:lastNotified')
      await notifyIfDue()
      setMsg('Reminders on. You will get a notification when you open the app and decks are due.')
    }
  }

  return (
    <Shell>
      <h1 className="hero small">Settings</h1>

      <section className="panel">
        <h2>Appearance</h2>
        <div className="seg">
          {(['light', 'dark', 'auto'] as const).map((m) => (
            <button key={m} className={theme.mode === m ? 'on' : ''} onClick={() => setMode(m)}>
              {m === 'auto' ? 'Match phone' : m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <p>Background colour. Pick any colour on the wheel; the text switches between light and dark to stay readable. Light and dark mode each remember their own colour.</p>
        <div className="bg-pick">
          <ColorWheel key={theme.mode + resetN} value={currentBg()} onChange={setBg} />
          <div className="bg-side">
            <span className="swatch-lg" style={{ background: currentBg() }} />
            <code>{currentBg().toUpperCase()}</code>
            <button className="btn ghost small" onClick={() => {
              resetBg()
              setResetN(resetN + 1)
            }}>Reset colour</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Reminders</h2>
        <p>
          <strong>Calendar reminders (works everywhere, even when the app is closed).</strong> Download a
          calendar file with every upcoming review and open it on your phone. Google Calendar or
          Apple Calendar then alerts you at the time you pick. Re-download it after reviewing, since
          your dates shift.
        </p>
        <div className="row left">
          <label className="pixel">
            Remind me at{' '}
            <select value={hour} onChange={(e) => setHour(Number(e.target.value))}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </label>
          <button
            className="btn"
            onClick={async () => {
              download('recall-reviews.ics', await buildIcs(hour), 'text/calendar')
              setMsg('Calendar file downloaded. Open it to add the reviews to your calendar.')
            }}
          >
            Download calendar (.ics)
          </button>
        </div>
        <p>
          <strong>In-app notification.</strong> Shows once a day when you open the app with decks due.
          It cannot wake your phone while the app is closed. That needs a paid push server, so use the
          calendar file for that.
        </p>
        <div className="row left">
          {perm === 'unsupported' ? (
            <span className="pixel">Notifications are not supported in this browser.</span>
          ) : perm === 'denied' ? (
            <span className="pixel">Blocked. Allow notifications for this site in your browser settings.</span>
          ) : perm === 'granted' ? (
            <span className="pixel">In-app notifications are on ✓</span>
          ) : (
            <button className="btn ghost" onClick={enable}>Turn on notifications</button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Backup</h2>
        <p>
          Your data lives only on this device. Export a file to back it up or to move it between your
          phone and laptop. Importing replaces everything on this device.
        </p>
        <div className="row left">
          <button className="btn" onClick={exportBackup}>Export backup</button>
          <label className="btn ghost">
            Import backup
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                if (!confirm('Importing replaces all decks and cards on this device. Continue?')) return
                try {
                  const r = await importBackup(f)
                  setMsg(`Imported ${r.decks} decks and ${r.cards} cards.`)
                } catch (err) {
                  setMsg('Import failed: ' + (err as Error).message)
                }
              }}
            />
          </label>
        </div>
      </section>

      {msg && <p className="soon">{msg}</p>}
    </Shell>
  )
}
