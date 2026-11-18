import { useEffect, useState } from 'react'
import { PROFILE } from '../data/profile'
import { MISSIONS } from '../data/missions'
import { useHud } from '../state/store'
import { Socials } from './Socials'
import { HAS_ORIENTATION, IS_IN_APP_BROWSER, IS_TOUCH, REDUCED_MOTION, arMotion, requestGyroPermission } from '../lib/device'

function TypingRotator({ lines }: { lines: string[] }) {
  const [i, setI] = useState(0)
  const [n, setN] = useState(REDUCED_MOTION ? lines[0].length : 0)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    if (REDUCED_MOTION) return
    const line = lines[i]
    const delay = deleting ? 28 : n === line.length ? 1700 : 55
    const id = setTimeout(() => {
      if (!deleting && n === line.length) setDeleting(true)
      else if (deleting && n === 0) {
        setDeleting(false)
        setI((i + 1) % lines.length)
      } else setN(n + (deleting ? -1 : 1))
    }, delay)
    return () => clearTimeout(id)
  }, [i, n, deleting, lines])
  return (
    <p className="typing" aria-label={lines.join(', ')}>
      <span aria-hidden>
        <span className="prompt">&gt;</span> {lines[i].slice(0, n)}
        <span className="caret" />
      </span>
    </p>
  )
}

/** Hero copy and the primary actions. */
export function PilotCard() {
  const gyro = useHud((s) => s.gyroEnabled)
  const showToast = useHud((s) => s.showToast)

  const toggleGyro = async () => {
    if (gyro) return useHud.getState().setGyro(false)
    if (!window.isSecureContext) return showToast('Motion sensors need a secure (https://) link.')
    if (IS_IN_APP_BROWSER) return showToast('Open this page in Chrome or Safari to use the motion sensors.')
    const ok = await requestGyroPermission()
    if (ok) useHud.getState().setGyro(true)
    else showToast('Motion access was declined. Drag or move the mouse instead.')
  }

  const openAr = async () => {
    if (IS_IN_APP_BROWSER) showToast('For the camera and motion sensors, open this page in Chrome or Safari.')
    // ask for motion access inside this tap: iOS only shows the prompt from a user gesture
    arMotion.granted = IS_TOUCH && HAS_ORIENTATION ? await requestGyroPermission() : false
    useHud.getState().setArOpen(true)
  }

  return (
    <section className="pilot panel landing-fade" style={{ "--d": 0.2 } as React.CSSProperties} aria-labelledby="pilot-name">
      <p className="eyebrow">// Pilot · {PROFILE.callsign}</p>
      <h1 id="pilot-name" className="pilot-name">
        {PROFILE.name}
        <span className="dot">.</span>
      </h1>
      <TypingRotator lines={PROFILE.roles} />
      <p className="tagline">{PROFILE.tagline}</p>
      <ul className="stat-strip" aria-label="Highlights">
        <li>
          <b>{MISSIONS.length}</b> missions
        </li>
        <li>
          <b>NASA</b> Space Apps 2026
        </li>
        <li>
          <b>ITB</b> Petroleum Eng.
        </li>
      </ul>
      <div className="actions">
        <a className="btn primary" href="#missions">
          View missions
        </a>
        {IS_TOUCH && HAS_ORIENTATION && (
          <button className={`btn ${gyro ? 'on' : ''}`} type="button" onClick={toggleGyro} aria-pressed={gyro}>
            {gyro ? 'Gyro on' : 'Enable gyro'}
          </button>
        )}
        <button className="btn" type="button" onClick={() => useHud.getState().land(0)}>
          Land on Mars
        </button>
        <button className="btn" type="button" onClick={openAr}>
          AR view
        </button>
        <a className="btn ghost" href={PROFILE.cv} download>
          Download CV
        </a>
      </div>
      {IS_TOUCH && HAS_ORIENTATION && !gyro && <p className="hint">Tilt your phone to steer the orbit.</p>}
      <Socials className="pilot-socials" />
    </section>
  )
}
