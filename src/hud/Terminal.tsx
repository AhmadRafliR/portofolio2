import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MISSIONS, MISSION_BY_ID, type MissionId } from '../data/missions'
import { ARSENAL, CONTACT } from '../data/record'
import { PROFILE } from '../data/profile'
import { useHud } from '../state/store'

type Line = { kind: 'in' | 'out' | 'err'; text: ReactNode }

const COMMANDS = ['help', 'whoami', 'status', 'objective', 'missions', 'open', 'skills', 'contact', 'cv', 'ar', 'sample', 'pilot', 'clear', 'exit']

const BOOT: Line[] = [{ kind: 'out', text: 'RAFLI-OS uplink ready. Type `help` for commands.' }]

function run(raw: string, overlay: boolean): Line[] | 'clear' {
  const [cmd, ...args] = raw.trim().split(/\s+/)
  const s = useHud.getState()
  switch ((cmd ?? '').toLowerCase()) {
    case '':
      return []
    case 'help':
      return [
        { kind: 'out', text: 'whoami · status · objective · missions · open <m-01…m-08> · skills · contact · cv · ar · sample bennu · pilot · clear' + (overlay ? ' · exit' : '') },
      ]
    case 'whoami':
      return [{ kind: 'out', text: 'ahmad_rafli — full stack developer | ui/ux explorer | engineering student' }]
    case 'status':
      return [{ kind: 'out', text: 'learning & building | merging engineering mechanics with web tech | designing clean UI' }]
    case 'objective':
      return [{ kind: 'out', text: 'code, design, simulate, innovate.' }]
    case 'missions':
      return MISSIONS.map((m) => ({ kind: 'out' as const, text: `${m.code.toLowerCase()}  ${m.name.padEnd(16, ' ')} ${m.status === 'deployed' ? 'deployed' : 'archive'}` }))
    case 'open': {
      const id = (args[0] ?? '').toLowerCase() as MissionId
      if (!MISSION_BY_ID[id]) return [{ kind: 'err', text: 'usage: open m-01 … m-08' }]
      s.setActive(id)
      return [{ kind: 'out', text: `opening ${MISSION_BY_ID[id].name} brief…` }]
    }
    case 'skills':
      return ARSENAL.map((g) => ({ kind: 'out' as const, text: `${g.group.toLowerCase()}: ${g.items.join(', ')}` }))
    case 'contact':
      return [
        { kind: 'out', text: `email    ${CONTACT.email}` },
        { kind: 'out', text: `github   ${PROFILE.links.github}` },
        { kind: 'out', text: `linkedin ${PROFILE.links.linkedin}` },
        { kind: 'out', text: `whatsapp ${PROFILE.links.whatsapp}` },
      ]
    case 'cv': {
      const a = document.createElement('a')
      a.href = PROFILE.cv
      a.download = ''
      a.click()
      return [{ kind: 'out', text: 'downloading CV…' }]
    }
    case 'ar':
      s.setArOpen(true)
      return [{ kind: 'out', text: 'opening AR view…' }]
    case 'sample':
      if ((args[0] ?? '').toLowerCase() !== 'bennu') return [{ kind: 'err', text: 'usage: sample bennu' }]
      s.setActive('m-06')
      return [{ kind: 'out', text: 'sample acquired: Bennu → porous media → HMS Simulation (M-06).' }]
    case 'pilot':
      s.returnToPilot()
      return [{ kind: 'out', text: 'returning to the pilot portrait…' }]
    case 'clear':
      return 'clear'
    case 'exit':
      if (overlay) s.setTerminal(false)
      return []
    default:
      return [{ kind: 'err', text: `command not found: ${cmd}. Try \`help\`.` }]
  }
}

/** Terminal mode (implementasi.md §5.2): history (↑/↓), Tab completion, commands that drive the page. */
export function Terminal({ overlay = false }: { overlay?: boolean }) {
  const [lines, setLines] = useState<Line[]>(BOOT)
  const [value, setValue] = useState('')
  const history = useRef<string[]>([])
  const cursor = useRef(-1)
  const input = useRef<HTMLInputElement>(null)
  const screen = useRef<HTMLDivElement>(null)

  useEffect(() => {
    screen.current?.scrollTo({ top: screen.current.scrollHeight })
  }, [lines])
  useEffect(() => {
    if (overlay) input.current?.focus()
  }, [overlay])

  const submit = () => {
    const raw = value
    setValue('')
    if (raw.trim()) history.current.unshift(raw)
    cursor.current = -1
    const out = run(raw, overlay)
    if (out === 'clear') return setLines([])
    setLines((l) => [...l, { kind: 'in' as const, text: raw }, ...out].slice(-80))
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation() // keep ↑/↓/Space away from the page gestures
    if (e.key === 'Enter') submit()
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      cursor.current = Math.min(history.current.length - 1, cursor.current + 1)
      setValue(history.current[cursor.current] ?? value)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      cursor.current = Math.max(-1, cursor.current - 1)
      setValue(cursor.current < 0 ? '' : history.current[cursor.current])
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const hit = COMMANDS.filter((c) => c.startsWith(value.trim().toLowerCase()))
      if (hit.length === 1) setValue(hit[0] + ' ')
      else if (hit.length > 1) setLines((l) => [...l, { kind: 'out' as const, text: hit.join('  ') }])
    } else if (e.key === 'Escape' && overlay) useHud.getState().setTerminal(false)
  }

  return (
    <div className={`terminal panel ${overlay ? 'overlay' : ''}`} onClick={() => input.current?.focus()}>
      <div className="term-bar" aria-hidden>
        <span>rafli@mars-orbit: ~</span>
        <span className="muted">{overlay ? 'esc to close' : '/ opens anywhere'}</span>
      </div>
      <div className="term-screen" ref={screen} role="log" aria-live="polite">
        {lines.map((l, i) => (
          <p key={i} className={`term-${l.kind}`}>
            {l.kind === 'in' ? <span className="term-prompt">$ </span> : l.kind === 'out' ? '> ' : '! '}
            {l.text}
          </p>
        ))}
      </div>
      <label className="term-input">
        <span className="term-prompt">$</span>
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="Terminal command"
          placeholder="help"
        />
      </label>
    </div>
  )
}

/** The terminal as an overlay, toggled with / anywhere on the landing. */
export function TerminalOverlay() {
  const open = useHud((s) => s.terminalOpen)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && /input|textarea/i.test(t.tagName)) return
      if (e.key === '/' && useHud.getState().phase === 'landing') {
        e.preventDefault()
        useHud.getState().setTerminal(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (!open) return null
  return (
    <div className="term-overlay" role="dialog" aria-modal="true" aria-label="Terminal" onClick={() => useHud.getState().setTerminal(false)}>
      <div onClick={(e) => e.stopPropagation()}>
        <Terminal overlay />
      </div>
    </div>
  )
}
