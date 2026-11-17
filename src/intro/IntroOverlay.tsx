import { useEffect, useRef } from 'react'
import { useProgress } from '@react-three/drei'
import { useHud } from '../state/store'
import { marsSol } from '../lib/marsTime'
import { PROFILE } from '../data/profile'
import { T, introClock } from './timeline'

/** Text block, uplink readout, 火星 tag and skip control over the particle intro (implementasi.md §2.1.2). */
export function IntroOverlay() {
  const progress = useProgress((s) => s.progress)
  const loaded = useProgress((s) => s.loaded)
  const total = useProgress((s) => s.total)
  const countdown = useRef<HTMLSpanElement>(null)
  const requestSkip = useHud((s) => s.requestSkip)

  // T-minus readout follows the WebGL clock without re-rendering React every frame
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const left = Math.max(0, T.handoffEnd - introClock.t)
      if (countdown.current) countdown.current.textContent = String(Math.ceil(left)).padStart(2, '0')
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') requestSkip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [requestSkip])

  const pct = total === 0 ? 100 : Math.round(progress)

  return (
    <div className="intro" aria-live="polite">
      <button className="intro-skip" type="button" onClick={requestSkip}>
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
        <p className="intro-sub">Frontend developer · UI/UX · Petroleum Engineering at ITB.</p>
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
          <div className="accent">
            <dt>T-minus</dt>
            <dd>
              <span ref={countdown}>06</span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
