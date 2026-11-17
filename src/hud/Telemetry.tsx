import { useEffect, useState } from 'react'
import { useHud } from '../state/store'
import { marsSol } from '../lib/marsTime'
import { PROFILE } from '../data/profile'

const wib = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

const deg = (v: number) => `${v < 0 ? '−' : '+'}${String(Math.abs(Math.round(v))).padStart(3, '0')}°`

/** Top bar: callsign, Jakarta time, Mars sol, and live gyro angles (or the cursor when there is no gyro). */
export function TelemetryBar() {
  const [now, setNow] = useState(() => new Date())
  const orientation = useHud((s) => s.orientation)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    let last = 0
    const onMove = (e: PointerEvent) => {
      const t = performance.now()
      if (t - last < 80) return
      last = t
      setCursor({ x: Math.round(e.clientX), y: Math.round(e.clientY) })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      clearInterval(id)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <header className="telemetry landing-fade" style={{ "--d": 0.05 } as React.CSSProperties}>
      <a className="callsign" href="#top" aria-label="Back to top">
        <span className="blip" aria-hidden />
        {PROFILE.callsign} <span className="muted">· Mars orbit</span>
      </a>
      <div className="readouts" aria-hidden>
        <span>WIB {wib.format(now)}</span>
        <span>SOL {marsSol(now)}</span>
        {orientation ? (
          <span className="gyro-read">
            α{deg(orientation.a)} β{deg(orientation.b)} γ{deg(orientation.g)}
          </span>
        ) : (
          <span className="hide-sm">
            X {String(cursor.x).padStart(4, '0')} Y {String(cursor.y).padStart(4, '0')}
          </span>
        )}
      </div>
    </header>
  )
}

/** Corner brackets, faint grid and scanlines over the whole viewport. */
export function HudFrame() {
  return (
    <div className="hud-frame landing-fade" aria-hidden>
      <span className="corner tl" />
      <span className="corner tr" />
      <span className="corner bl" />
      <span className="corner br" />
      <span className="scan" />
    </div>
  )
}
