import { useEffect, useRef, useState } from 'react'
import { MISSION_BY_ID, canFrame, neighbour, shotsFor, type Mission } from '../data/missions'
import { useHud } from '../state/store'
import { ProbeView } from '../three/ProbeView'

type Media = 'shot' | 'live'
type Device = 'desktop' | 'mobile'
const FRAME: Record<Device, { w: number; h: number }> = { desktop: { w: 1280, h: 800 }, mobile: { w: 390, h: 844 } }

/**
 * Mission brief drawer (implementasi.md §5.1). Opens from a beacon, a mission-panel row or a card; the camera flies
 * to the mission's beacon behind it. Desktop: panel on the right. Phone: bottom sheet.
 */
export function MissionDetail() {
  const id = useHud((s) => s.activeMission)
  const [shown, setShown] = useState(id)
  // keep the last mission rendered while the drawer slides out
  useEffect(() => {
    if (id) setShown(id)
  }, [id])

  useEffect(() => {
    if (!id) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useHud.getState().setActive(null)
      if (e.key === 'ArrowRight') useHud.getState().setActive(neighbour(id, 1))
      if (e.key === 'ArrowLeft') useHud.getState().setActive(neighbour(id, -1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id])

  const m = shown ? MISSION_BY_ID[shown] : null
  return (
    <aside className={`detail ${id ? 'open' : ''}`} aria-hidden={!id} aria-label={m ? `${m.name} mission brief` : undefined} inert={!id}>
      {m && <Brief key={m.id} m={m} />}
    </aside>
  )
}

function Brief({ m }: { m: Mission }) {
  const shots = shotsFor(m)
  const [media, setMedia] = useState<Media>('shot')
  const [device, setDevice] = useState<Device>('desktop')
  const close = () => useHud.getState().setActive(null)
  const go = (step: 1 | -1) => useHud.getState().setActive(neighbour(m.id, step))

  return (
    <div className="detail-inner">
      <header className="detail-head">
        <span className="row-code">
          <i className={`status-dot ${m.status}`} /> {m.code}
        </span>
        <span className={`status ${m.status}`}>{m.status === 'deployed' ? `Deployed · ${m.checkedAt}` : 'Offline archive'}</span>
        <div className="detail-nav">
          <button type="button" aria-label="Previous mission" onClick={() => go(-1)}>
            ‹
          </button>
          <button type="button" aria-label="Next mission" onClick={() => go(1)}>
            ›
          </button>
          <button type="button" aria-label="Close mission brief" onClick={close}>
            ✕
          </button>
        </div>
      </header>

      <h2 className="detail-title">{m.name}</h2>
      <p className="card-meta">
        {m.role} · {m.context} · {m.year}
      </p>
      {m.landing && (
        <p className="landing-note">
          <span>Landed</span> {m.landing.site} · {Math.abs(m.landing.lat)}°{m.landing.lat < 0 ? 'S' : 'N'} {Math.abs(m.landing.lon)}°{m.landing.lon < 0 ? 'W' : 'E'}{' '}
          <em>(illustrative site, pump-jack rig)</em>
        </p>
      )}

      {shots ? (
        <>
          <div className="media-tabs" role="tablist" aria-label="Preview">
            <button type="button" role="tab" aria-selected={media === 'shot'} onClick={() => setMedia('shot')}>
              Screenshot
            </button>
            {canFrame(m) && (
              <button type="button" role="tab" aria-selected={media === 'live'} onClick={() => setMedia('live')}>
                Live feed
              </button>
            )}
            <span className="tabs-gap" />
            <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}>
              Desktop
            </button>
            <button type="button" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}>
              Mobile
            </button>
          </div>
          <div className={`media ${device}`}>
            {media === 'shot' ? (
              <img src={shots[device]} alt={`${m.name} ${device} screenshot`} loading="lazy" decoding="async" />
            ) : (
              <LiveFeed url={m.url!} name={m.name} device={device} />
            )}
          </div>
        </>
      ) : (
        <div className="media archive">
          <ProbeView model={m.model} className="probe-detail" hot />
          <p className="archive-note">No public build of this mission yet: the brief below is the record.</p>
        </div>
      )}

      <p className="card-brief">{m.brief}</p>
      <ul className="highlights">
        {m.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <ul className="stack" aria-label="Stack">
        {m.stack.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <div className="probe-row">
        {shots && <ProbeView model={m.model} className="probe-mini" hot />}
        <p className="probe-note">
          <span>Probe</span> {m.modelName}: {m.modelReason}
        </p>
      </div>
      <div className="card-actions">
        {m.url && (
          <a className="btn primary" href={m.url} target="_blank" rel="noopener noreferrer">
            Launch ↗
          </a>
        )}
        {m.repo && (
          <a className="btn ghost" href={m.repo} target="_blank" rel="noopener noreferrer">
            Source ↗
          </a>
        )}
      </div>
    </div>
  )
}

/** The real site in a scaled iframe; mounted only when the visitor asks for it. */
function LiveFeed({ url, name, device }: { url: string; name: string; device: Device }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  const [loaded, setLoaded] = useState(false)
  const f = FRAME[device]
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(Math.min(el.clientWidth / f.w, el.clientHeight / f.h)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [f.w, f.h])
  return (
    <div ref={box} className="live">
      {!loaded && <span className="live-wait">Establishing uplink…</span>}
      <iframe
        key={device}
        src={url}
        title={`${name} (live site)`}
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={() => setLoaded(true)}
        style={{ width: f.w, height: f.h, transform: `translate(-50%, 0) scale(${scale})` }}
      />
    </div>
  )
}
