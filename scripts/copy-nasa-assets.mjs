// Copies the allow-listed NASA textures/models from the SPHEREx project into public/.
// Source folder: SPHEREX_DIR env, default to the local SPHEREx checkout.
import { copyFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SRC = process.env.SPHEREX_DIR ?? 'C:/projek/integrasi spherex/mainProjectSPHRX/arvr/public'
const FILES = [
  ['textures/mars.jpg', 'textures/mars.jpg'],
  ['textures/mars_normal_1k.png', 'textures/mars_normal_1k.png'],
  ['textures/mars_normal_2k.png', 'textures/mars_normal_2k.png'],
  ['textures/space/starmap_2k.jpg', 'textures/starmap_2k.jpg'],
  ['textures/provenance.json', 'textures/provenance.json'],
  ['ar/mars.usdz', 'ar/mars.usdz'],
  // walkable surface (surface mode): NASA elevation models + CC0 Poly Haven ground scans (greyscale detail)
  // .dat, not .bin: some Chrome builds answer .bin fetches with an empty 204 (same fix as the intro's portrait field)
  ['terrain/gale.bin', 'terrain/gale.dat'],
  ['terrain/meridiani.bin', 'terrain/meridiani.dat'],
  ...['gravel', 'dust', 'rock'].flatMap((n) =>
    ['albedo', 'normal', 'rough'].flatMap((k) => ['1k', '512'].map((s) => [`textures/ground/${n}_${k}_${s}.jpg`, `textures/ground/${n}_${k}_${s}.jpg`])),
  ),
  ...['curiosity', 'ingenuity', 'lunar-module', 'osiris-rex', 'perseverance', 'opportunity', 'bennu'].map((m) => [
    `models/${m}.glb`,
    `../assets/models-src/${m}.glb`,
  ]),
]

for (const [from, to] of FILES) {
  const src = join(SRC, from)
  const dst = join('public', to)
  if (!existsSync(src)) {
    console.warn('missing', src)
    continue
  }
  mkdirSync(dirname(dst), { recursive: true })
  copyFileSync(src, dst)
  console.log(`${to.padEnd(40)} ${(statSync(dst).size / 1024).toFixed(0)} KB`)
}
