/** Walk input shared by the keyboard handler (Walker) and the phone's hold-to-walk button (SurfaceHud). */
export const walkInput = {
  forward: false,
  back: false,
  left: false,
  right: false,
  run: false,
  jump: false,
  turnLeft: false,
  turnRight: false,
}

export function releaseWalkInput() {
  for (const k of Object.keys(walkInput) as (keyof typeof walkInput)[]) walkInput[k] = false
}

/** Readout for the HUD (metres walked from the landing spot, heading), written by the Walker every frame. */
export const walker = { dist: 0, heading: 0, ready: false, landed: false }

export const EYE_HEIGHT = 1.7
export const MARS_G = 3.71
