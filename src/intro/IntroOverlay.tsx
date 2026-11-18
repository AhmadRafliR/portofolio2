import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useHud } from '../state/store'
import { marsSol } from '../lib/marsTime'
import { PROFILE } from '../data/profile'
import { Socials } from '../hud/Socials'

/**
 * DOM layer of the intro (implementasi.md §2.1.2): text block, uplink readout, 火星 tag, contact links, skip control,
 * and the gesture that launches part 2 — scrolling down, swiping up, ↓ / PageDown / Space / Enter, or the cue.
 */
export function IntroOverlay() {
  const progress = useProgress((s) => s.progress)
  const loaded = useProgress((s) => s.loaded)
  const total = useProgress((s) => s.total)
  const launched = useHud((s) => s.launched)
  const launch = useHud((s) => s.launch)
  // after a return from the landing the overlay should not replay its slow first-visit entrance
  const [returned] = useState(() => useHud.getState().returning)
  const wheel = useRef(0)

  useEffect(() => {
    if (launched) return
    wheel.current = 0
    const go = () => useHud.getState().launch()
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY <= 0) return
      wheel.current += e.deltaY
      if (wheel.current > 40) go()
    }
    let y0: number | null = null
    const onTouchStart = (e: TouchEvent) => {
      y0 = e.touches[0]?.clientY ?? null
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY
      if (y0 != null && y != null && y0 - y > 40) go()
    }
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault()
        go()
      } else if (e.key === 'Escape') useHud.getState().launch(true)
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [launched])

  const pct = total === 0 ? 100 : Math.round(progress)

  return (
    <div className={`intro ${returned ? 'returned' : ''}`} aria-live="polite">
      <button className="intro-skip" type="button" onClick={() => launch(true)}>
        Skip intro <span aria-hidden>▸</span>
      </button>
      <div className="intro-tag" aria-hidden>
        火<br />星
      </div>
      <div className="intro-copy">
        <p className="intro-eyebrow">Mission Pilot</p>
        <h1 className="intro-title">
          {PROFILE.name}
          <span className="dot">.</span>
        </h1>
        <p className="intro-sub">Full stack developer · UI/UX · Petroleum Engineering at ITB.</p>
        <p className="intro-label">Uplink · Mars orbit</p>
        <dl className="intro-readout">
          <div>
            <dt>Uplink</dt>
            <dd>{String(pct).padStart(3, '0')}%</dd>
          </div>
          <div>
            <dt>Assets</dt>
            <dd>
              {loaded}/{total}
            </dd>
          </div>
          <div>
            <dt>Sol</dt>
            <dd>{marsSol()}</dd>
          </div>
        </dl>
      </div>
      <button className="intro-cue" type="button" onClick={() => launch()} disabled={launched}>
        <span className="cue-label">{!launched ? 'Scroll to launch' : useHud.getState().returning ? 'Returning' : 'Launching'}</span>
        <span className="cue-line" aria-hidden />
      </button>
      <Socials className="intro-socials" />
    </div>
  )
}
