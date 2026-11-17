import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'

export const CAMERA_Z = 6
export const CAMERA_FOV = 38
/** world height visible at z = 0 from the resting camera */
export const VIEW_H = 2 * CAMERA_Z * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180)
/** Mars axial tilt (25.19°) — the mesh and the intro's particle sphere share it */
export const MARS_TILT = (25.19 * Math.PI) / 180
/** direction of the key light; the particle sphere is shaded with the same one */
export const SUN_DIR: [number, number, number] = [-4, 2, 3]

export interface SceneLayout {
  wide: boolean
  viewW: number
  marsPos: [number, number, number]
  marsR: number
  faceCenter: [number, number]
  faceScale: number
  /** world units per CSS pixel at z = 0 */
  px: number
}

/**
 * Where Mars and the intro portrait sit. Computed from the resting camera (not the parallaxed one), so the intro's
 * particle sphere lands exactly where the Mars mesh is.
 */
export function computeLayout(width: number, height: number): SceneLayout {
  const aspect = width / height
  const viewW = VIEW_H * aspect
  const wide = aspect >= 0.95 && width > 760
  const px = VIEW_H / height
  // wide: Mars sits in the gap the HUD panels leave free (pilot card on the left, mission panel on the right from
  // 1100 px up; below that the gap is everything right of the card). Pixel edges follow styles.css .hero.
  const freeLeft = 450
  const freeRight = width >= 1100 ? width - 390 : width
  const freeCenter = (freeLeft + freeRight) / 2
  const marsR = wide
    ? Math.min(1.02, VIEW_H * 0.245, ((freeRight - freeLeft) / 2) * px * 0.95)
    : Math.min(viewW * 0.34, VIEW_H * 0.16)
  return {
    wide,
    viewW,
    marsPos: wide ? [(freeCenter - width / 2) * px, 0.12, 0] : [0, VIEW_H * 0.2, 0],
    marsR,
    faceCenter: wide ? [0, 0.28] : [0, VIEW_H * 0.17],
    faceScale: wide ? VIEW_H * 0.3 : Math.min(viewW * 0.44, VIEW_H * 0.19),
    px,
  }
}

export function useLayout(): SceneLayout {
  const size = useThree((s) => s.size)
  return useMemo(() => computeLayout(size.width, size.height), [size.width, size.height])
}
