// Ported from the SPHEREx XR project (arvr/src/xr/device.ts, arSupport.ts).
type DOEWithPermission = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> }

export const IS_TOUCH = typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches)
export const HAS_ORIENTATION = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
export const REDUCED_MOTION = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
export const IS_IN_APP_BROWSER = typeof navigator !== 'undefined' && /FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|Snapchat|; wv\)/i.test(navigator.userAgent)

/** Must be called from a user gesture on iOS. */
export async function requestGyroPermission(): Promise<boolean> {
  const DOE = (window as unknown as { DeviceOrientationEvent?: DOEWithPermission }).DeviceOrientationEvent
  if (!DOE) return false
  if (typeof DOE.requestPermission !== 'function') return true
  try {
    return (await DOE.requestPermission()) === 'granted'
  } catch {
    return false
  }
}
