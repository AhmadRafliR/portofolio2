import { useState } from 'react'
import { MISSIONS, type Category, type Mission } from '../data/missions'
import { useHud } from '../state/store'
import { ProbeView } from '../three/ProbeView'

const PAGE = 4

function focusMission(m: Mission) {
  useHud.getState().setActive(m.id)
}

/** Hero side panel (desktop): four missions per page, each with its probe spinning in a HUD viewport. */
export function MissionPanel() {
  const [page, setPage] = useState(0)
  const hover = useHud((s) => s.hoverMission)
  const pages = Math.ceil(MISSIONS.length / PAGE)
  const list = MISSIONS.slice(page * PAGE, page * PAGE + PAGE)
  return (
    <aside className="mission-panel panel landing-fade" style={{ "--d": 0.35 } as React.CSSProperties} aria-label="Active missions">
      <header className="panel-head">
        <span>// Active missions</span>
        <span className="muted">{String(MISSIONS.length).padStart(2, '0')}</span>
      </header>
      <ul>
        {list.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              className={`mission-row ${hover === m.id ? 'hot' : ''}`}
              onMouseEnter={() => useHud.getState().setHover(m.id)}
              onMouseLeave={() => useHud.getState().setHover(null)}
              onFocus={() => useHud.getState().setHover(m.id)}
              onBlur={() => useHud.getState().setHover(null)}
              onClick={() => focusMission(m)}
            >
              <ProbeView model={m.model} className="probe-sm" hot={hover === m.id} />
              <span className="row-text">
                <span className="row-code">
                  <i className={`status-dot ${m.status}`} /> {m.code}
                </span>
                <span className="row-name">{m.name}</span>
                <span className="row-meta">{m.role}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <footer className="pager">
        <button type="button" aria-label="Previous missions" onClick={() => setPage((page + pages - 1) % pages)}>
          ‹
        </button>
        <span>
          {page + 1}/{pages}
        </span>
        <button type="button" aria-label="Next missions" onClick={() => setPage((page + 1) % pages)}>
          ›
        </button>
      </footer>
    </aside>
  )
}

const FILTERS: { id: 'all' | Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'web', label: 'Web' },
  { id: 'ai-ml', label: 'AI / ML' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'xr', label: 'XR' },
]

/** Full mission list below the hero: filterable cards with stack, probe and launch links. */
export function MissionsSection() {
  const [filter, setFilter] = useState<'all' | Category>('all')
  const active = useHud((s) => s.activeMission)
  const hover = useHud((s) => s.hoverMission)
  const list = MISSIONS.filter((m) => filter === 'all' || m.category.includes(filter))
  return (
    <section id="missions" className="section" aria-labelledby="missions-title">
      <header className="section-head">
        <p className="eyebrow">// 02 · Active missions</p>
        <h2 id="missions-title">Missions flown</h2>
        <div className="filters" role="group" aria-label="Filter missions">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className={filter === f.id ? 'on' : ''} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </header>
      <div className="mission-grid">
        {list.map((m) => (
          <article
            key={m.id}
            id={`mission-${m.id}`}
            className={`mission-card panel ${active === m.id ? 'active' : ''}`}
            onMouseEnter={() => useHud.getState().setHover(m.id)}
            onMouseLeave={() => useHud.getState().setHover(null)}
          >
            <header className="card-head">
              <span className="row-code">
                <i className={`status-dot ${m.status}`} /> {m.code}
              </span>
              <span className={`status ${m.status}`}>{m.status === 'deployed' ? `Deployed · ${m.checkedAt}` : 'Offline archive'}</span>
            </header>
            <ProbeView model={m.model} className="probe-lg" hot={hover === m.id || active === m.id} />
            <h3>{m.name}</h3>
            <p className="card-meta">
              {m.role} · {m.context}
            </p>
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
            <p className="probe-note">
              <span>Probe</span> {m.modelName}: {m.modelReason}
            </p>
            <div className="card-actions">
              <button type="button" className="btn" onClick={() => focusMission(m)}>
                Brief
              </button>
              {m.url ? (
                <a className="btn primary" href={m.url} target="_blank" rel="noopener noreferrer">
                  Launch ↗
                </a>
              ) : (
                <span className="btn disabled" aria-disabled>
                  No public link
                </span>
              )}
              {m.repo && (
                <a className="btn ghost" href={m.repo} target="_blank" rel="noopener noreferrer">
                  Source ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
