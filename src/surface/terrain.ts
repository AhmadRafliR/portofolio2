import { BufferAttribute, BufferGeometry, CanvasTexture, Color, RepeatWrapping, SRGBColorSpace } from 'three'

/**
 * Walkable Mars ground, ported from the SPHEREx XR project (arvr/src/xr/surface/terrain.ts): a NASA elevation model
 * (16-bit grid) sampled bilinearly, plus procedural fine relief near the viewer, meshed as a radial "clipmap".
 */

export interface SiteTerrain {
  url: string
  gridW: number
  gridH: number
  widthUnits: number
  depthUnits: number
  zMinUnits: number
  zMaxUnits: number
  metersPerUnit: number
  verticalMetersPerUnit: number
  /** amplitude (m) of procedural fine relief added near the viewer */
  detailAmplitude: number
  /** how far (m) the terrain mesh, fog and far plane reach */
  viewRadius: number
}

/** Ground height in metres at world (x east, z south), terrain centred on the origin. */
export interface HeightField {
  width: number
  depth: number
  /** raw elevation-model height (bilinear), no added detail */
  baseAt(x: number, z: number): number
  /** elevation + procedural fine relief; `detail` (0..1) fades the relief out with distance */
  heightAt(x: number, z: number, detail?: number): number
}

// ---- deterministic value noise -------------------------------------------------------------
function hash(i: number, j: number) {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
export function vnoise(x: number, z: number) {
  const i = Math.floor(x)
  const j = Math.floor(z)
  const fx = x - i
  const fz = z - j
  const u = fx * fx * (3 - 2 * fx)
  const v = fz * fz * (3 - 2 * fz)
  const a = hash(i, j)
  const b = hash(i + 1, j)
  const c = hash(i, j + 1)
  const d = hash(i + 1, j + 1)
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1
}
/** fbm in roughly [-1, 1]: wavelengths from ~14 m down to ~1 m */
export function fbm(x: number, z: number) {
  let s = 0
  let amp = 0.5
  let f = 1 / 14
  for (let o = 0; o < 5; o++) {
    s += amp * vnoise(x * f + o * 17.3, z * f - o * 9.1)
    amp *= 0.5
    f *= 2.03
  }
  return s / 0.97
}

export function makeHeightField(t: SiteTerrain, data: Uint16Array): HeightField {
  const W = t.gridW
  const H = t.gridH
  const width = t.widthUnits * t.metersPerUnit
  const depth = t.depthUnits * t.metersPerUnit
  const range = ((t.zMaxUnits - t.zMinUnits) * t.verticalMetersPerUnit) / 65535
  const baseAt = (x: number, z: number) => {
    const fx = Math.min(W - 1, Math.max(0, (x / width + 0.5) * (W - 1)))
    const fz = Math.min(H - 1, Math.max(0, (z / depth + 0.5) * (H - 1)))
    const i = Math.min(W - 2, Math.floor(fx))
    const j = Math.min(H - 2, Math.floor(fz))
    const u = fx - i
    const v = fz - j
    const k = j * W + i
    const a = data[k]
    const b = data[k + 1]
    const c = data[k + W]
    const d = data[k + W + 1]
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * range
  }
  return {
    width,
    depth,
    baseAt,
    heightAt: (x, z, detail = 1) => baseAt(x, z) + (detail > 0 ? fbm(x, z) * t.detailAmplitude * detail : 0),
  }
}

const hfCache = new Map<string, Promise<HeightField>>()
export function loadHeightField(t: SiteTerrain): Promise<HeightField> {
  let p = hfCache.get(t.url)
  if (!p) {
    p = fetch(t.url)
      .then((r) => {
        if (!r.ok) throw new Error(`terrain ${t.url}: ${r.status}`)
        return r.arrayBuffer()
      })
      .then((buf) => {
        if (buf.byteLength < t.gridW * t.gridH * 2) throw new Error(`terrain ${t.url}: short read (${buf.byteLength} B)`)
        return makeHeightField(t, new Uint16Array(buf, 0, t.gridW * t.gridH))
      })
    p.catch(() => hfCache.delete(t.url))
    hfCache.set(t.url, p)
  }
  return p
}

// ---- meshes -------------------------------------------------------------------------------
const DUST = new Color('#b8714a')
const DARK = new Color('#5b3324')
const ROCK = new Color('#7a432c')

const detailFade = (r: number) => 1 - Math.min(1, Math.max(0, (r - 120) / 280))

/**
 * Radial "clipmap": rings get exponentially wider away from the viewer, so ground near your feet is finely detailed
 * while the same mesh reaches the horizon (tens of km). Rebuilt (in a worker) when you walk away.
 */
export function buildRadialTerrain(hf: HeightField, cx: number, cz: number, rMax: number, rings = 170, segs = 256): BufferGeometry {
  const r0 = 0.35
  const k = Math.pow(rMax / r0, 1 / (rings - 1))
  const count = 1 + rings * segs
  const pos = new Float32Array(count * 3)
  const uv = new Float32Array(count * 2)
  const put = (idx: number, x: number, z: number, r: number) => {
    pos[idx * 3] = x
    pos[idx * 3 + 1] = hf.heightAt(x, z, detailFade(r))
    pos[idx * 3 + 2] = z
    uv[idx * 2] = x / 3
    uv[idx * 2 + 1] = z / 3
  }
  put(0, cx, cz, 0)
  for (let i = 0; i < rings; i++) {
    const r = r0 * Math.pow(k, i)
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2 + (i % 2) * (Math.PI / segs) // stagger rings for nicer triangles
      put(1 + i * segs + s, cx + r * Math.cos(a), cz + r * Math.sin(a), r)
    }
  }
  const index = new Uint32Array(segs * 3 + (rings - 1) * segs * 6)
  let n = 0
  for (let s = 0; s < segs; s++) {
    index[n++] = 0
    index[n++] = 1 + ((s + 1) % segs)
    index[n++] = 1 + s
  }
  for (let i = 0; i < rings - 1; i++) {
    for (let s = 0; s < segs; s++) {
      const p00 = 1 + i * segs + s
      const p01 = 1 + i * segs + ((s + 1) % segs)
      const p10 = 1 + (i + 1) * segs + s
      const p11 = 1 + (i + 1) * segs + ((s + 1) % segs)
      index[n++] = p00
      index[n++] = p01
      index[n++] = p10
      index[n++] = p01
      index[n++] = p11
      index[n++] = p10
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('uv', new BufferAttribute(uv, 2))
  g.setIndex(new BufferAttribute(index, 1))
  g.computeVertexNormals()
  colorize(g, hf)
  g.computeBoundingSphere()
  return g
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Mars vertex colours with baked ambient occlusion (hollows darker, ridges brighter), plus a 'mask' attribute
 * (x = fine dust cover, y = bare rock on slopes) for the ground material.
 */
function colorize(g: BufferGeometry, hf: HeightField) {
  const p = g.attributes.position
  const nrm = g.attributes.normal
  const col = new Float32Array(p.count * 3)
  const mask = new Float32Array(p.count * 2)
  const c = new Color()
  const R = [3, 9, 24]
  for (let i = 0; i < p.count; i++) {
    const slope = 1 - nrm.getY(i)
    const x = p.getX(i)
    const z = p.getZ(i)
    const patch = vnoise(x / 37, z / 37) * 0.5 + 0.5
    const rock = smooth(0.12, 0.4, slope)
    c.copy(DUST).lerp(DARK, patch * 0.45).lerp(ROCK, Math.min(1, slope * 2.2))
    let shade = 0.92 + vnoise(x / 5.3, z / 5.3) * 0.08
    const h0 = hf.baseAt(x, z)
    let occ = 0
    for (const r of R) {
      const avg = (hf.baseAt(x + r, z) + hf.baseAt(x - r, z) + hf.baseAt(x, z + r) + hf.baseAt(x, z - r)) / 4
      occ += (avg - h0) / r
    }
    shade *= Math.min(1.08, Math.max(0.62, 1 - occ * 0.9))
    col[i * 3] = c.r * shade
    col[i * 3 + 1] = c.g * shade
    col[i * 3 + 2] = c.b * shade
    mask[i * 2] = smooth(0.45, 0.75, patch + vnoise(x / 9, z / 9) * 0.15) * (1 - rock)
    mask[i * 2 + 1] = rock
  }
  g.setAttribute('color', new BufferAttribute(col, 3))
  g.setAttribute('mask', new BufferAttribute(mask, 2))
}

let groundTex: CanvasTexture | null = null
/** Tiling grey "regolith" detail texture, used until (or instead of) the scanned ground textures. */
export function getGroundTexture(): CanvasTexture {
  if (groundTex) return groundTex
  const N = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = N
  const ctx = cv.getContext('2d')!
  const img = ctx.createImageData(N, N)
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const a = (x / N) * Math.PI * 2
      const b = (y / N) * Math.PI * 2
      const tx = Math.cos(a) * 6
      const ty = Math.sin(a) * 6
      const tz = Math.cos(b) * 6
      const tw = Math.sin(b) * 6
      const n1 = vnoise(tx + tz * 1.7, ty + tw * 1.3) * 0.5 + vnoise(tx * 3 + tw * 2.1, ty * 3 - tz * 1.9) * 0.3
      const speck = hash(x, y) > 0.985 ? -0.35 : hash(x + 7, y) > 0.99 ? 0.25 : 0
      const v = Math.max(0, Math.min(255, 205 + (n1 + speck) * 60))
      const k = (y * N + x) * 4
      img.data[k] = img.data[k + 1] = img.data[k + 2] = v
      img.data[k + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
  groundTex = new CanvasTexture(cv)
  groundTex.wrapS = groundTex.wrapT = RepeatWrapping
  groundTex.colorSpace = SRGBColorSpace
  groundTex.anisotropy = 8
  return groundTex
}

/** Sun direction from azimuth (deg clockwise from north) and elevation (deg). North = −Z. */
export function sunDirection(azimuthDeg: number, elevationDeg: number): [number, number, number] {
  const az = (azimuthDeg * Math.PI) / 180
  const el = (elevationDeg * Math.PI) / 180
  return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)]
}
