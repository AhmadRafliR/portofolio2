import { useEffect } from 'react'
import { live, useHud } from '../state/store'

const MAX_DEG = 14

/**
 * Gyro parallax (implementasi.md §6.2): the first reading becomes neutral, tilt is clamped to ±14° and fed to the
 * camera rig. If no reading arrives within 2 s the gyro is switched back off with a toast (as in the SPHEREx app).
 */
export function useGyroParallax() {
  const enabled = useHud((s) => s.gyroEnabled)
  useEffect(() => {
    if (!enabled) {
      useHud.getState().setOrientation(null)
      return
    }
    let base: { b: number; g: number } | null = null
    let got = false
    let lastUi = 0
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return
      got = true
      // landscape: swap axes so "tilt right" still means right
      const angle = (screen.orientation?.angle ?? 0) as number
      const b = angle === 90 ? -e.gamma : angle === 270 || angle === -90 ? e.gamma : e.beta
      const g = angle === 90 ? e.beta : angle === 270 || angle === -90 ? -e.beta : e.gamma
      base ??= { b, g }
      const clamp = (v: number) => Math.max(-1, Math.min(1, v / MAX_DEG))
      live.parallaxTarget = { x: clamp(g - base.g), y: clamp(-(b - base.b)) }
      const now = performance.now()
      if (now - lastUi > 120) {
        lastUi = now
        useHud.getState().setOrientation({ a: e.alpha ?? 0, b: e.beta, g: e.gamma })
      }
    }
    window.addEventListener('deviceorientation', onOrient)
    const timeout = setTimeout(() => {
      if (!got) {
        const s = useHud.getState()
        s.setGyro(false)
        s.showToast('No motion-sensor data on this device, so the view follows touch instead.')
      }
    }, 2000)
    return () => {
      window.removeEventListener('deviceorientation', onOrient)
      clearTimeout(timeout)
      live.parallaxTarget = { x: 0, y: 0 }
    }
  }, [enabled])
}
