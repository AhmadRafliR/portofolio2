// Intro storyboard (implementasi.md §2.1.1), in seconds.
export const T = {
  spreadStart: 0.4,
  spreadEnd: 1.6,
  morphStart: 1.8,
  morphEnd: 3.3,
  holdEnd: 4.4,
  sphereEnd: 5.4,
  handoffEnd: 6.0,
  /** the hold may stretch this long while landing assets are still loading */
  maxExtension: 3,
}

/** Mutable intro clock, shared by the WebGL intro and its DOM overlay. */
export const introClock = {
  t: 0,
  /** extra seconds spent holding the face while assets finish loading */
  extension: 0,
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))

export function introUniforms(t: number) {
  return {
    spread: span(t, T.spreadStart, T.spreadEnd),
    morph: span(t, T.morphStart, T.morphEnd),
    sphere: span(t, T.holdEnd, T.sphereEnd),
    handoff: span(t, T.sphereEnd, T.handoffEnd),
  }
}

const SEEN_KEY = 'rafli.intro.seen'

/** The intro plays once per browser session; `?intro` in the URL forces it. */
export function shouldPlayIntro(reducedMotion: boolean): boolean {
  if (reducedMotion) return false
  if (new URLSearchParams(location.search).has('intro')) return true
  try {
    return sessionStorage.getItem(SEEN_KEY) !== '1'
  } catch {
    return true
  }
}

export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // private mode: the intro will simply play again next visit
  }
}
