// Intro storyboard (implementasi.md §2.1.1), in seconds.
// Part 1 plays on its own and ends on the revealed portrait with glowing eyes. Part 2 starts only when the visitor
// scrolls (or swipes, presses ↓/Space/Enter, or taps the cue): the portrait dissolves into Mars and the HUD comes in.
export const T = {
  spreadStart: 0.4,
  spreadEnd: 1.6,
  morphStart: 1.8,
  morphEnd: 3.3,
  revealStart: 3.2,
  revealEnd: 4.5,
  eyesStart: 4.0,
  eyesEnd: 4.9,
  /** part 1 rests here until the visitor launches */
  rest: 4.9,
}

/** Part 2, in seconds after launch. */
export const L = {
  unreveal: 0.8,
  eyesOut: 0.45,
  sphereStart: 0.35,
  sphereEnd: 1.7,
  handoffEnd: 3.1,
  /** the sphere may wait this long for Mars textures that are still loading */
  maxWait: 3,
}

/** Eye centres in portrait-field coordinates (x, y in −1..1 of the photo height; measured on the source photo). */
export const EYES: [number, number][] = [
  [-0.091, 0.19],
  [0.145, 0.182],
]
export const PORTRAIT_ASPECT = 324 / 318

/** Mutable intro clock, shared by the WebGL intro and its DOM overlay. */
export const introClock = {
  t: 0,
  /** seconds since launch, −1 before it */
  lt: -1,
  waited: 0,
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))

export function introUniforms(t: number, lt: number) {
  const launched = lt >= 0 ? lt : -1
  const out = (a: number, b: number) => (launched < 0 ? 0 : span(launched, a, b))
  return {
    spread: span(t, T.spreadStart, T.spreadEnd),
    morph: span(t, T.morphStart, T.morphEnd),
    reveal: span(t, T.revealStart, T.revealEnd) * (1 - out(0, L.unreveal)),
    eyes: span(t, T.eyesStart, T.eyesEnd) * (1 - out(0, L.eyesOut)),
    sphere: out(L.sphereStart, L.sphereEnd),
    handoff: out(L.sphereEnd, L.handoffEnd),
    launch: out(0, 1),
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
