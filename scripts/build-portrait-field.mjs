// Portrait photo → particle field for the intro (see implementasi.md §2.1.3).
// Output public/intro/portrait-field.bin:
//   header (16 B): "RPF1", count u32, aspect f32 (width / height), reserved u32
//   per particle (8 B): x i16, y i16 (−1..1, y up, fit to height), angle u8 (0..π), len u8, tone u8, seed u8
// Particles are shuffled, so any prefix is an even sample: the app picks a tier by reading the first N.
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'

const SRC = process.argv[2] ?? 'assets/source/rafli-portrait.png'
const COUNT = 32000
const SIZE = 512

const img = sharp(SRC).resize(SIZE, SIZE, { fit: 'inside' }).ensureAlpha()
const { data, info } = await img.clone().raw().toBuffer({ resolveWithObject: true })
const W = info.width
const H = info.height

// luminance + alpha
const L = new Float32Array(W * H)
const A = new Float32Array(W * H)
for (let i = 0; i < W * H; i++) {
  const r = data[i * 4] / 255
  const g = data[i * 4 + 1] / 255
  const b = data[i * 4 + 2] / 255
  L[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b
  A[i] = data[i * 4 + 3] / 255
}

function blur(src, radius) {
  // separable box blur ×2 ≈ gaussian
  let a = src.slice()
  const tmp = new Float32Array(W * H)
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let s = 0
        let n = 0
        for (let k = -radius; k <= radius; k++) {
          const xx = x + k
          if (xx < 0 || xx >= W) continue
          s += a[y * W + xx]
          n++
        }
        tmp[y * W + x] = s / n
      }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let s = 0
        let n = 0
        for (let k = -radius; k <= radius; k++) {
          const yy = y + k
          if (yy < 0 || yy >= H) continue
          s += tmp[yy * W + x]
          n++
        }
        a[y * W + x] = s / n
      }
  }
  return a
}

function sobel(src) {
  const gx = new Float32Array(W * H)
  const gy = new Float32Array(W * H)
  const at = (x, y) => src[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))]
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      gx[y * W + x] = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1)
      gy[y * W + x] = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)
    }
  return { gx, gy }
}

const Lsharp = blur(L, 1)
const Lsoft = blur(L, 4)
const edges = sobel(Lsharp)
const flow = sobel(Lsoft) // smoother field for strand direction

let gmax = 0
const G = new Float32Array(W * H)
for (let i = 0; i < W * H; i++) {
  G[i] = Math.hypot(edges.gx[i], edges.gy[i]) * A[i]
  gmax = Math.max(gmax, G[i])
}

// sampling weight: everything inside the silhouette, denser on contours and dark detail
const weight = new Float32Array(W * H)
let wmax = 0
for (let i = 0; i < W * H; i++) {
  if (A[i] < 0.5) continue
  const e = Math.min(1, (G[i] / gmax) * 2.2)
  weight[i] = 0.35 + 1.3 * e + 0.35 * (1 - L[i])
  wmax = Math.max(wmax, weight[i])
}

// deterministic PRNG so rebuilds are stable
let s = 1337
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)

const out = []
const scale = 2 / H
while (out.length < COUNT) {
  const x = rnd() * W
  const y = rnd() * H
  const i = (y | 0) * W + (x | 0)
  if (rnd() * wmax > weight[i]) continue
  const fx = flow.gx[i]
  const fy = flow.gy[i]
  const fm = Math.hypot(fx, fy)
  // strand runs along the contour (perpendicular to the gradient); flat areas get a gentle swirl
  let ang = fm > 0.02 ? Math.atan2(fy, fx) + Math.PI / 2 : Math.atan2(y - H / 2, x - W / 2) + Math.PI / 2 + (rnd() - 0.5) * 0.8
  ang = ((ang % Math.PI) + Math.PI) % Math.PI
  const dark = 1 - L[i]
  const hairish = dark > 0.55 ? 1 : 0
  const len = Math.min(1, 0.25 + 0.45 * dark + 0.3 * hairish * rnd())
  out.push({
    x: (x - W / 2) * scale,
    y: -(y - H / 2) * scale,
    ang,
    len,
    tone: Math.pow(L[i], 0.9),
    seed: rnd(),
  })
}

const buf = Buffer.alloc(16 + COUNT * 8)
buf.write('RPF1', 0, 'ascii')
buf.writeUInt32LE(COUNT, 4)
buf.writeFloatLE(W / H, 8)
out.forEach((p, k) => {
  const o = 16 + k * 8
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, p.x)) * 32767), o)
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, p.y)) * 32767), o + 2)
  buf.writeUInt8(Math.round((p.ang / Math.PI) * 255), o + 4)
  buf.writeUInt8(Math.round(p.len * 255), o + 5)
  buf.writeUInt8(Math.round(p.tone * 255), o + 6)
  buf.writeUInt8(Math.round(p.seed * 255), o + 7)
})

mkdirSync('public/intro', { recursive: true })
writeFileSync('public/intro/portrait-field.bin', buf)
// static fallback (reduced motion / no WebGL)
await sharp(SRC).resize(480).grayscale().linear(1.15, -10).webp({ quality: 82 }).toFile('public/intro/portrait.webp')
console.log(`portrait-field.bin: ${COUNT} particles, ${(buf.length / 1024).toFixed(0)} KB, aspect ${(W / H).toFixed(3)}`)
