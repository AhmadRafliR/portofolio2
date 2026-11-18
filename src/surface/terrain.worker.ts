/// <reference lib="webworker" />
// Builds the radial terrain mesh off the main thread, so landing and re-centring never freeze a frame.
import { buildRadialTerrain, loadHeightField, type HeightField, type SiteTerrain } from './terrain'

export type TerrainBuildRequest = { id: number; terrain: SiteTerrain; cx: number; cz: number; rMax: number; rings: number; segs: number }
export type TerrainBuildResult = { id: number; position: Float32Array; normal: Float32Array; uv: Float32Array; color: Float32Array; mask: Float32Array; index: Uint32Array }

let hf: { url: string; field: Promise<HeightField> } | null = null

self.onmessage = async (e: MessageEvent<TerrainBuildRequest>) => {
  const { id, terrain, cx, cz, rMax, rings, segs } = e.data
  if (!hf || hf.url !== terrain.url) hf = { url: terrain.url, field: loadHeightField({ ...terrain, url: new URL(terrain.url, self.location.origin).href }) }
  const g = buildRadialTerrain(await hf.field, cx, cz, rMax, rings, segs)
  const out: TerrainBuildResult = {
    id,
    position: g.attributes.position.array as Float32Array,
    normal: g.attributes.normal.array as Float32Array,
    uv: g.attributes.uv.array as Float32Array,
    color: g.attributes.color.array as Float32Array,
    mask: g.attributes.mask.array as Float32Array,
    index: g.index!.array as Uint32Array,
  }
  ;(self as unknown as Worker).postMessage(out, [out.position.buffer, out.normal.buffer, out.uv.buffer, out.color.buffer, out.mask.buffer, out.index.buffer])
}
