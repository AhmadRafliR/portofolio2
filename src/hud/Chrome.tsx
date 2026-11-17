import { useHud } from '../state/store'
import { ProbeView } from '../three/ProbeView'
import { MISSIONS } from '../data/missions'
import { Socials } from './Socials'

/** Bottom dock: Opportunity as the system mascot, quality state, FPS and gyro status. */
export function StatusDock() {
  const fps = useHud((s) => s.fps)
  const tier = useHud((s) => s.tier)
  const gyro = useHud((s) => s.gyroEnabled)
  const lite = useHud((s) => s.lite)
  const degraded = tier === 'low'
  return (
    <footer className="dock landing-fade" style={{ "--d": 0.5 } as React.CSSProperties}>
      <ProbeView model="opportunity" className="probe-xs" />
      <span aria-hidden className={degraded ? 'warn' : 'ok'}>{degraded ? 'SYS DEGRADED · LITE' : 'SYS NOMINAL'}</span>
      <span>FPS {String(fps).padStart(2, '0')}</span>
      <span>GYRO {gyro ? 'ON' : 'OFF'}</span>
      <button type="button" className={`dock-lite ${lite ? 'on' : ''}`} aria-pressed={lite} onClick={() => useHud.getState().setLite(!lite)} title="Lite mode: a still scene for slow devices or battery saving">
        LITE {lite ? 'ON' : 'OFF'}
      </button>
      <span className="hide-sm">MISSIONS {MISSIONS.length}</span>
      <button type="button" className="dock-term hide-sm" onClick={() => useHud.getState().setTerminal(true)} title="Terminal (press /)">
        &gt;_ Terminal
      </button>
      <Socials className="dock-socials" />
      <a className="scroll-cue" href="#missions">
        Scroll ▾
      </a>
    </footer>
  )
}

export function Toast() {
  const toast = useHud((s) => s.toast)
  return (
    <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
      {toast}
    </div>
  )
}

export function Credits() {
  const replay = () => {
    try {
      sessionStorage.removeItem('rafli.intro.seen')
    } catch {
      // ignore
    }
    location.href = '/?intro'
  }
  return (
    <footer className="credits section" aria-label="Credits">
      <p className="eyebrow">// Credits</p>
      <p>
        Mars texture: NASA 3D Resources (public domain). Star map: NASA SVS Deep Star Maps 2020 (public domain). Spacecraft models and
        asteroid Bennu: NASA 3D Resources (public domain), simplified for this page. Assets prepared in the author&apos;s SPHEREx XR
        project for NASA Space Apps 2026. Mars clock: NASA GISS Mars24 algorithm.
      </p>
      <p className="muted">Not affiliated with or endorsed by NASA. The SPHEREx sky hologram is illustrative, not mission data.</p>
      <p>
        <button type="button" className="btn ghost" onClick={replay}>
          Replay intro
        </button>
      </p>
      <p className="muted">© 2026 Ahmad Rafli Ramadhan</p>
    </footer>
  )
}
