import { useEffect, useRef } from 'react'
import type { ProbeModel } from '../data/missions'
import { attachProbe, type ProbeHandle } from './probeRenderer'

/** A NASA probe spinning in a HUD box (see probeRenderer.ts for why this is a plain 2D canvas). */
export function ProbeView({ model, className, hot = false }: { model: ProbeModel; className?: string; hot?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const handle = useRef<ProbeHandle | null>(null)

  useEffect(() => {
    if (!canvas.current) return
    const h = attachProbe(canvas.current, model)
    handle.current = h
    return () => {
      h.dispose()
      handle.current = null
    }
  }, [model])

  useEffect(() => {
    handle.current?.setHot(hot)
  }, [hot])

  return (
    <div className={`probe ${className ?? ''}`} aria-hidden>
      <span className="probe-corners" />
      <canvas ref={canvas} className="probe-canvas" />
    </div>
  )
}
