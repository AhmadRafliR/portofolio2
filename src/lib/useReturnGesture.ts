import { useEffect } from 'react'
import { useHud } from '../state/store'

/**
 * Mirror of the intro's launch gesture: at the very top of the landing, scrolling up, swiping down or pressing
 * ↑ / PageUp takes the visitor back to the pilot portrait.
 */
export function useReturnGesture() {
  const phase = useHud((s) => s.phase)
  useEffect(() => {
    if (phase !== 'landing') return
    let acc = 0
    let y0: number | null = null
    // ignore the tail of the gesture that launched the landing
    const armedAt = performance.now() + 900
    const back = () => {
      if (performance.now() > armedAt && scrollY <= 0) useHud.getState().returnToPilot()
    }
    const onWheel = (e: WheelEvent) => {
      if (scrollY > 0 || e.deltaY >= 0) {
        acc = 0
        return
      }
      acc += e.deltaY
      if (acc < -90) back()
    }
    const onTouchStart = (e: TouchEvent) => {
      y0 = scrollY <= 0 ? (e.touches[0]?.clientY ?? null) : null
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY
      if (y0 != null && y != null && y - y0 > 90) back()
    }
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && /input|textarea|select/i.test(t.tagName)) return
      if (e.key === 'ArrowUp' || e.key === 'PageUp') back()
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [phase])
}
