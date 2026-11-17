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
