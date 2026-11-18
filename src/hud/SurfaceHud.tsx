import { useEffect, useRef, useState } from 'react'
import { SURFACE_SITES, formatLatLon } from '../data/missions'
import { WALK_SITES } from '../surface/sites'
import { walkInput, walker } from '../surface/input'
import { useHud } from '../state/store'
import { IS_TOUCH } from '../lib/device'

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

/**
 * Surface mode, on foot: where you landed, the site's mission, hop to the other site, lift off. Phones get a
 * hold-to-walk pad (dragging the scene looks around).
 */
export function SurfaceHud() {
  const surface = useHud((s) => s.surface)
  const walking = useHud((s) => s.walking)
  const [shown, setShown] = useState(surface ?? 0)
  // keep the last site rendered while the panel fades out
  useEffect(() => {
    if (surface != null) setShown(surface)
  }, [surface])

  useEffect(() => {
    if (surface == null) return
    const onKey = (e: KeyboardEvent) => {
      const s = useHud.getState()
      // Esc closes the brief or the terminal first
      if (e.key === 'Escape' && !s.activeMission && !s.terminalOpen) s.takeOff()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [surface])

  const readout = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!walking) return
    const id = setInterval(() => {
      if (readout.current)
        readout.current.textContent = walker.landed ? `${Math.round(walker.dist)} m from touchdown · heading ${COMPASS[Math.round(walker.heading / 45) % 8]}` : 'Descending…'
    }, 250)
    return () => clearInterval(id)
  }, [walking])

  const site = SURFACE_SITES[shown]
  const ws = WALK_SITES[site.terrain]
  const n = SURFACE_SITES.length
  const open = surface != null && walking
  const { land, takeOff, setActive } = useHud.getState()
  const hold = (on: boolean) => () => {
    walkInput.forward = on
  }

  return (
    <>
      <section className={`surface-hud panel ${open ? 'open' : ''}`} aria-hidden={!open} inert={!open} aria-label="Surface landing site">
        <p className="eyebrow">
          <i className="status-dot offline-archive" /> On foot · site {shown + 1}/{n}
        </p>
        <h2 className="surface-name">{site.name}</h2>
        <p className="surface-coords">
          {formatLatLon(site.lat, site.lon)} <em>· {ws.region}</em>
        </p>
        <p className="surface-field">
          <span>{site.mission.code}</span> {site.mission.name} runs the oil field here. Every other mission is parked nearby: walk up to a
          beacon, or click it, for its brief.
        </p>
        <div className="actions">
          <button className="btn primary" type="button" onClick={() => setActive(site.mission.id)}>
            {site.mission.code} brief
          </button>
          {n > 1 && (
            <button className="btn" type="button" onClick={() => land((shown + 1) % n)} aria-label={`Fly to ${SURFACE_SITES[(shown + 1) % n].name}`}>
              <span className="long">Fly to {SURFACE_SITES[(shown + 1) % n].name}</span>
              <span className="short">Next site</span> ▸
            </button>
          )}
          <button className="btn ghost" type="button" onClick={takeOff}>
            ▴ Back to orbit
          </button>
        </div>
        <p className="hint">
          <span ref={readout} />
          <br className="long" />
          {IS_TOUCH ? 'Drag to look · hold Walk to move' : 'WASD / arrows to walk · drag to look · Shift runs · Space jumps · Esc lifts off'}
        </p>
        <p className="surface-credit">{ws.credit}</p>
      </section>
      {open && IS_TOUCH && (
        <button
          type="button"
          className="walk-pad"
          aria-label="Hold to walk forward"
          onPointerDown={hold(true)}
          onPointerUp={hold(false)}
          onPointerCancel={hold(false)}
          onPointerLeave={hold(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          ▲<span>Walk</span>
        </button>
      )}
    </>
  )
}
