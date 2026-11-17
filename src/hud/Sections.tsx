import { useState } from 'react'
import { ALSO_ON_DECK, ARSENAL, BIO, CONTACT, CREW, LOG, type LogKind } from '../data/record'
import { PROFILE } from '../data/profile'
import { Socials } from './Socials'
import { Terminal } from './Terminal'

function SectionHead({ index, eyebrow, title, id }: { index: string; eyebrow: string; title: string; id: string }) {
  return (
    <header className="section-head">
      <p className="eyebrow">
        // {index} · {eyebrow}
      </p>
      <h2 id={id}>{title}</h2>
    </header>
  )
}

/** 03 · Neural profile: bio, core matrix, education, languages. */
export function ProfileSection() {
  return (
    <section id="profile" className="section" aria-labelledby="profile-title">
      <SectionHead index="03" eyebrow="Neural profile" title="Pilot dossier" id="profile-title" />
      <div className="profile-grid">
        <div className="panel profile-bio">
          <p className="lead">{BIO.lead}</p>
          <p>{BIO.body}</p>
          <dl className="edu">
            {BIO.education.map((e) => (
              <div key={e.school}>
                <dt>{e.school}</dt>
                <dd>
                  {e.detail} <span className="muted">· {e.years}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="langs">
            <span>Languages</span> {BIO.languages.join(' · ')}
          </p>
        </div>
        <ol className="matrix">
          {BIO.matrix.map((m, i) => (
            <li key={m.title} className="panel">
              <span className="matrix-i">0{i + 1}</span>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const LOG_FILTERS: { id: 'all' | LogKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'competition', label: 'Competitions' },
  { id: 'olympiad', label: 'Olympiads' },
  { id: 'certification', label: 'Certifications' },
  { id: 'academic', label: 'Academic' },
]

/** 04 · Mission log: achievements, competitions and certificates as a timeline. */
export function MissionLog() {
  const [filter, setFilter] = useState<'all' | LogKind>('all')
  const list = LOG.filter((l) => filter === 'all' || l.kind === filter)
  return (
    <section id="log" className="section" aria-labelledby="log-title">
      <SectionHead index="04" eyebrow="Mission log" title="Flight record" id="log-title" />
      <div className="filters" role="group" aria-label="Filter the log">
        {LOG_FILTERS.map((f) => (
          <button key={f.id} type="button" className={filter === f.id ? 'on' : ''} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <ol className="timeline">
        {list.map((l) => (
          <li key={l.title} className={`log-${l.kind}`}>
            <span className="t-year">{l.year}</span>
            <span className="t-dot" aria-hidden />
            <div className="t-body">
              <h3>{l.title}</h3>
              <p className="t-result">{l.result}</p>
              {l.note && <p className="t-note">{l.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** 05 · Crew record: organisations and roles. */
export function CrewRecord() {
  return (
    <section id="crew" className="section" aria-labelledby="crew-title">
      <SectionHead index="05" eyebrow="Crew record" title="Crews I flew with" id="crew-title" />
      <div className="crew-grid">
        {CREW.map((c) => (
          <article key={c.org} className="panel crew-card">
            <header>
              <p className="crew-years">{c.years}</p>
              <h3>{c.org}</h3>
              {c.orgNote && <p className="muted crew-note">{c.orgNote}</p>}
              <p className="crew-role">{c.role}</p>
            </header>
            <ul className="highlights">
              {c.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <h3 className="deck-title">Also on deck</h3>
      <ul className="stack deck">
        {ALSO_ON_DECK.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </section>
  )
}

/** 06 · Tech arsenal: grouped skills (no made-up proficiency percentages). */
export function Arsenal() {
  return (
    <section id="arsenal" className="section" aria-labelledby="arsenal-title">
      <SectionHead index="06" eyebrow="Tech arsenal" title="Loadout" id="arsenal-title" />
      <div className="arsenal-grid">
        {ARSENAL.map((g) => (
          <div key={g.group} className="panel arsenal-group">
            <h3>{g.group}</h3>
            <ul className="stack">
              {g.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

/** 07 · Terminal mode, embedded (the same terminal also opens as an overlay with the / key). */
export function TerminalSection() {
  return (
    <section id="terminal" className="section" aria-labelledby="terminal-title">
      <SectionHead index="07" eyebrow="Terminal mode" title="Talk to the ship" id="terminal-title" />
      <Terminal />
    </section>
  )
}

/** 08 · Comms: how to reach the pilot. */
export function Comms() {
  return (
    <section id="comms" className="section" aria-labelledby="comms-title">
      <SectionHead index="08" eyebrow="Comms" title="Open a channel" id="comms-title" />
      <div className="panel comms">
        <p className="lead">Open to internships, freelance front-end and UI/UX work, and competition teams.</p>
        <ul className="comms-list">
          <li>
            <span>Email</span>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </li>
          <li>
            <span>WhatsApp</span>
            <a href={PROFILE.links.whatsapp} target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp ↗
            </a>
          </li>
          <li>
            <span>LinkedIn</span>
            <a href={PROFILE.links.linkedin} target="_blank" rel="noopener noreferrer">
              Ahmad Rafli Ramadhan ↗
            </a>
          </li>
          <li>
            <span>GitHub</span>
            <a href={PROFILE.links.github} target="_blank" rel="noopener noreferrer">
              @AhmadRafliR ↗
            </a>
          </li>
          <li>
            <span>LINE</span>
            {CONTACT.line}
          </li>
        </ul>
        <div className="actions">
          <a className="btn primary" href={PROFILE.cv} download>
            Download CV
          </a>
          <Socials />
        </div>
      </div>
    </section>
  )
}
