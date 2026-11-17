import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { live, useHud } from '../state/store'
import { REDUCED_MOTION } from '../lib/device'
import { CAMERA_Z } from './layout'

/**
 * Parallax rig: the camera drifts with the mouse (desktop) or the phone's tilt (gyro), and backs off a little as
 * the page scrolls past the hero. Also spins Mars and keeps the FPS readout and quality tier honest.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const setDpr = useThree((s) => s.setDpr)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / innerWidth) * 2 - 1
      const y = -((e.clientY / innerHeight) * 2 - 1)
      live.ndc.x = x
      live.ndc.y = y
      if (!useHud.getState().gyroEnabled) live.parallaxTarget = { x, y }
    }
    const onLeave = () => {
      live.ndc.x = 9
      live.ndc.y = 9
    }
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const perf = useRef({ frames: 0, time: 0, slow: 0 }).current
  useFrame((_, dt) => {
    // Mars spin (shared with the intro's particle sphere)
    if (!REDUCED_MOTION) live.marsSpin += dt * 0.07

    // parallax easing
    const k = 1 - Math.exp(-dt * (useHud.getState().gyroEnabled ? 8 : 4))
    const p = live.parallax
    const tgt = REDUCED_MOTION ? { x: 0, y: 0 } : live.parallaxTarget
    p.x += (tgt.x - p.x) * k
    p.y += (tgt.y - p.y) * k
    const scroll = Math.min(1, scrollY / Math.max(1, innerHeight))
    camera.position.set(p.x * 0.45, p.y * 0.3 - scroll * 0.6, CAMERA_Z + scroll * 2.2)
    camera.lookAt(0, -scroll * 0.25, 0)

    // FPS + adaptive quality (only judged once the landing is up)
    perf.frames++
    perf.time += dt
    if (perf.time >= 1) {
      const fps = Math.round(perf.frames / perf.time)
      const s = useHud.getState()
      s.setFps(fps)
      // background tabs are throttled; only judge frames the visitor can actually see
      if (s.phase === 'landing' && fps < 38 && document.visibilityState === 'visible' && document.hasFocus()) {
        perf.slow++
        if (perf.slow >= 3 && s.tier !== 'low') {
          const next = s.tier === 'high' ? 'mid' : 'low'
          s.setTier(next)
          setDpr(next === 'mid' ? 1.25 : 1)
          perf.slow = 0
        }
      } else perf.slow = 0
      perf.frames = 0
      perf.time = 0
    }
  })
  return null
}
