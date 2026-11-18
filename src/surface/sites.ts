import type { SiteTerrain } from './terrain'
import type { MissionId, ProbeModel } from '../data/missions'

/**
 * Walkable landing sites (surface mode). Terrain, spawn, sun and haze come from the SPHEREx XR project's site files
 * (arvr/content/sites/*.json); what stands on the ground is this portfolio: a pump-jack oil field around the site's
 * engineering mission, and every other mission parked nearby as its NASA probe model.
 */
export interface WalkSite {
  id: 'gale' | 'meridiani'
  region: string
  terrain: SiteTerrain
  spawn: { x: number; z: number; lookAt: { x: number; z: number } }
  sun: { azimuthDeg: number; elevationDeg: number }
  fogDensity: number
  credit: string
}

export const WALK_SITES: Record<WalkSite['id'], WalkSite> = {
  gale: {
    id: 'gale',
    region: 'Gale Crater floor · Mount Sharp on the horizon',
    terrain: {
      url: '/terrain/gale.dat',
      gridW: 512,
      gridH: 375,
      widthUnits: 761.3,
      depthUnits: 558.021,
      zMinUnits: 0,
      zMaxUnits: 34.181,
      metersPerUnit: 481,
      verticalMetersPerUnit: 195,
      detailAmplitude: 0.5,
      viewRadius: 200000,
    },
    spawn: { x: 14756, z: -13905, lookAt: { x: 1075, z: 23683 } },
    sun: { azimuthDeg: 150, elevationDeg: 25 },
    fogDensity: 0.000022,
    credit: 'Terrain: NASA 3D Resources “Curiosity Landing Site” elevation model of Gale Crater. Oil field, rocks, colours and sky are artistic.',
  },
  meridiani: {
    id: 'meridiani',
    region: 'Meridiani Planum · Opportunity’s plains',
    terrain: {
      url: '/terrain/meridiani.dat',
      gridW: 384,
      gridH: 384,
      widthUnits: 76860.9,
      depthUnits: 76905.3,
      zMinUnits: -1980.415,
      zMaxUnits: -1279.08,
      metersPerUnit: 1,
      verticalMetersPerUnit: 1,
      detailAmplitude: 0.45,
      viewRadius: 120000,
    },
    spawn: { x: -6, z: -0.5, lookAt: { x: 760, z: 60 } },
    sun: { azimuthDeg: 160, elevationDeg: 40 },
    fogDensity: 0.00003,
    credit: 'Terrain: NASA MGS MOLA topography around Opportunity’s landing site (NASA Planetary Data System). Oil field, rocks, colours and sky are artistic.',
  },
}

/** Placement relative to the spawn: `ahead` metres toward the spawn's look-at, `right` metres to its right. */
export interface Spot {
  ahead: number
  right: number
}

/** The site's own engineering mission stands at the main rig; the rest of the field is unlabelled rigs. */
export const MAIN_RIG: Spot = { ahead: 40, right: 18 }
export const FIELD: (Spot & { scale: number; yaw: number })[] = [
  { ahead: 58, right: -34, scale: 0.9, yaw: 0.6 },
  { ahead: 96, right: 41, scale: 1, yaw: -0.4 },
  { ahead: 142, right: -76, scale: 0.85, yaw: 1.4 },
  { ahead: 190, right: 18, scale: 1.1, yaw: 0.2 },
  { ahead: 250, right: -150, scale: 0.9, yaw: -1.1 },
]

/** Real-world size (longest horizontal side, metres) and resting height of each probe parked on the ground. */
export const GROUND_MODELS: Partial<Record<ProbeModel, { sizeM: number; lift: number }>> = {
  curiosity: { sizeM: 2.9, lift: 0 },
  perseverance: { sizeM: 2.9, lift: 0 },
  opportunity: { sizeM: 1.6, lift: 0 },
  'lunar-module': { sizeM: 9.4, lift: 0 },
  ingenuity: { sizeM: 1.2, lift: 2.2 },
}

/** Where the other missions wait around the landing spot: a loose arc in front of the visitor. */
// (the site panel covers the bottom-left on desktop, so the arc leans right)
export const MISSION_SPOTS: Spot[] = [
  { ahead: 11, right: 3 },
  { ahead: 16, right: 11 },
  { ahead: 62, right: -34 }, // M-03's lunar module is 9 m across: it stands further out
  { ahead: 27, right: 25 },
  { ahead: 33, right: 5 },
  { ahead: 19, right: -16 },
  { ahead: 50, right: 36 },
]

export function missionSpots(siteMission: MissionId, all: MissionId[]): { id: MissionId; spot: Spot }[] {
  return all.filter((id) => id !== siteMission).map((id, i) => ({ id, spot: MISSION_SPOTS[i % MISSION_SPOTS.length] }))
}
