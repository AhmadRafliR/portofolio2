import { create } from 'zustand'
import type { MissionId } from '../data/missions'

export type Phase = 'intro' | 'landing'
export type Tier = 'high' | 'mid' | 'low'

interface HudState {
  phase: Phase
  /** 0..1 during the intro → landing handoff, 1 once the landing is fully in */
  landingIn: number
  skipIntro: boolean
  hoverMission: MissionId | null
  activeMission: MissionId | null
  gyroEnabled: boolean
  /** device orientation in degrees, throttled for display */
  orientation: { a: number; b: number; g: number } | null
  /** pointer position −1..1, throttled for display */
  pointer: { x: number; y: number }
  fps: number
  tier: Tier
  toast: string | null
  setPhase: (p: Phase) => void
  setLandingIn: (v: number) => void
  requestSkip: () => void
  setHover: (id: MissionId | null) => void
  setActive: (id: MissionId | null) => void
  setGyro: (on: boolean) => void
  setOrientation: (o: { a: number; b: number; g: number } | null) => void
  setPointer: (p: { x: number; y: number }) => void
  setFps: (f: number) => void
  setTier: (t: Tier) => void
  showToast: (msg: string) => void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useHud = create<HudState>((set) => ({
  phase: 'intro',
  landingIn: 0,
  skipIntro: false,
  hoverMission: null,
  activeMission: null,
  gyroEnabled: false,
  orientation: null,
  pointer: { x: 0, y: 0 },
  fps: 60,
  tier: 'high',
  toast: null,
  setPhase: (phase) => set({ phase }),
  setLandingIn: (landingIn) => set({ landingIn }),
  requestSkip: () => set({ skipIntro: true }),
  setHover: (hoverMission) => set({ hoverMission }),
  setActive: (activeMission) => set({ activeMission }),
  setGyro: (gyroEnabled) => set({ gyroEnabled }),
  setOrientation: (orientation) => set({ orientation }),
  setPointer: (pointer) => set({ pointer }),
  setFps: (fps) => set({ fps }),
  setTier: (tier) => set({ tier }),
  showToast: (toast) => {
    clearTimeout(toastTimer)
    set({ toast })
    toastTimer = setTimeout(() => set({ toast: null }), 3600)
  },
}))

/**
 * Per-frame values shared between the scene parts, kept out of React state on purpose
 * (written every frame, read in useFrame).
 */
export const live = {
  /** Mars spin angle (rad) — the intro's particle sphere and the Mars mesh read the same value */
  marsSpin: 0,
  /** 0..1 while the intro hands over to the landing (Mars mesh, stars and HUD fade in) */
  landingIn: 0,
  /** smoothed parallax input −1..1 from mouse or gyro */
  parallax: { x: 0, y: 0 },
  /** raw target the parallax eases toward */
  parallaxTarget: { x: 0, y: 0 },
  /** pointer in normalized device coords, for the intro's strand repulsion */
  ndc: { x: 9, y: 9 },
}
