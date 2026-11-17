// Ported from the SPHEREx XR project (arvr/src/xr/arSupport.ts).
const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent

/** iPhone, iPod, iPad (iPadOS reports itself as a Mac with a touch screen). */
export const IS_IOS =
  typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

/** Safari lists `ar` in <a>.relList when it can open AR Quick Look. */
export function supportsQuickLook(): boolean {
  if (typeof document === 'undefined') return false
  try {
    return document.createElement('a').relList?.supports?.('ar') === true
  } catch {
    return false
  }
}

/** Models iOS can place in the room through AR Quick Look. */
export const QUICK_LOOK = [
  { id: 'mars', label: 'Mars in your room', href: '/ar/mars.usdz', thumb: '/ar/mars-thumb.webp' },
  { id: 'pump-jack', label: 'Pump jack in your room', href: '/ar/pump-jack.usdz', thumb: '/ar/mars-thumb.webp' },
] as const
