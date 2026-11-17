// assets/models-src/*.glb → public/models/hud/*.glb, small enough for ~200 px HUD viewports.
// Untextured meshes drop their (flat) normals so vertices can weld and simplify; the HUD recomputes normals.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, weld, simplify, textureCompress, meshopt, resample } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import draco3d from 'draco3dgltf'
import { readdirSync, mkdirSync, statSync } from 'node:fs'

const IN = 'assets/models-src'
const OUT = 'public/models/hud'
/** target fraction of triangles kept */
const RATIO = { 'curiosity.glb': 0.45, 'bennu.glb': 0.25, 'osiris-rex.glb': 0.12, 'perseverance.glb': 0.3, 'lunar-module.glb': 0.5 }

await MeshoptEncoder.ready
await MeshoptSimplifier.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
  'draco3d.decoder': await draco3d.createDecoderModule(),
})
mkdirSync(OUT, { recursive: true })

for (const f of readdirSync(IN).filter((f) => f.endsWith('.glb'))) {
  const doc = await io.read(`${IN}/${f}`)
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const textured = prim.getMaterial()?.getNormalTexture() || prim.getMaterial()?.getBaseColorTexture()
      if (!textured && prim.getAttribute('NORMAL')) prim.setAttribute('NORMAL', null)
    }
  // sources may be Draco-compressed; output uses meshopt only
  doc.getRoot().listExtensionsUsed().find((e) => e.extensionName === 'KHR_draco_mesh_compression')?.dispose()
  await doc.transform(
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: RATIO[f] ?? 0.6, error: 0.004 }),
    resample(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512] }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  )
  await io.write(`${OUT}/${f}`, doc)
  console.log(`${f.padEnd(20)} ${(statSync(`${IN}/${f}`).size / 1024).toFixed(0)} KB → ${(statSync(`${OUT}/${f}`).size / 1024).toFixed(0)} KB`)
}
