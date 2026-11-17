import {
  AdditiveBlending,
  AmbientLight,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  NoToneMapping,
  OctahedronGeometry,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  Sphere,
  WebGLRenderer,
  type MeshStandardMaterial,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import type { ProbeModel } from '../data/missions'
import { REDUCED_MOTION } from '../lib/device'

/**
 * NASA probes in HUD boxes. Each box is an ordinary 2D <canvas> inside the card, so it scrolls with the page exactly
 * (a fixed WebGL overlay always trails the DOM by a frame or more, badly on phones). One shared, off-DOM WebGL
 * renderer draws every visible probe in turn into the corner of its buffer, and each frame is copied into the
 * card's canvas with drawImage.
 */

const MAX_W = 720
const MAX_H = 480
const TEAL = new Color('#4fe3d6')

let renderer: WebGLRenderer | null = null
function getRenderer(): WebGLRenderer {
  if (!renderer) {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(1)
    renderer.setSize(MAX_W, MAX_H, false)
    renderer.toneMapping = NoToneMapping
    renderer.setClearColor(0x000000, 0)
  }
  return renderer
}

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
const cache = new Map<ProbeModel, Promise<Object3D>>()

function normalise(obj: Object3D): Group {
  // every probe framed the same way: bounding sphere radius 1 at the origin
  const sphere = new Box3().setFromObject(obj).getBoundingSphere(new Sphere())
  obj.position.sub(sphere.center)
  const wrap = new Group()
  wrap.add(obj)
  wrap.scale.setScalar(0.92 / sphere.radius)
  return wrap
}

function loadPrototype(model: ProbeModel): Promise<Object3D> {
  let p = cache.get(model)
  if (!p) {
    p =
      model === 'sky-hologram'
        ? Promise.resolve(buildSky())
        : loader.loadAsync(`/models/hud/${model}.glb`).then((gltf) => {
            gltf.scene.traverse((o) => {
              const mesh = o as Mesh
              if (!mesh.isMesh) return
              // the HUD build drops flat normals so meshes could be simplified; rebuild smooth ones
              if (!mesh.geometry.getAttribute('normal')) mesh.geometry.computeVertexNormals()
              const mat = mesh.material as MeshStandardMaterial
              if ('emissive' in mat) {
                mat.emissive = TEAL
                mat.emissiveIntensity = 0.06
              }
            })
            return normalise(gltf.scene)
          })
    cache.set(model, p)
  }
  return p
}

/** M-05: no spacecraft; an illustrative all-sky survey sphere banded in spectrum colours. */
function buildSky(): Object3D {
  const n = 1400
  const pos = new Float32Array(n * 3)
  const col = new Float32Array(n * 3)
  const c = new Color()
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n
    const r = Math.sqrt(1 - y * y)
    const th = i * 2.39996323
    pos.set([Math.cos(th) * r, y, Math.sin(th) * r], i * 3)
    c.setHSL(0.72 - ((y + 1) / 2) * 0.72, 0.9, 0.62)
    col.set([c.r, c.g, c.b], i * 3)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('color', new BufferAttribute(col, 3))
  const group = new Group()
  group.add(new Points(g, new PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false })))
  group.add(new Mesh(new IcosahedronGeometry(1.02, 2), new MeshBasicMaterial({ color: '#4fe3d6', wireframe: true, transparent: true, opacity: 0.18 })))
  group.scale.setScalar(0.8)
  return group
}

interface Entry {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  scene: Scene
  camera: PerspectiveCamera
  pivot: Group
  placeholder: Mesh
  hot: boolean
  visible: boolean
  model: ProbeModel
  requested: boolean
}

const entries = new Set<Entry>()
let raf = 0
let last = 0

function loop(now: number) {
  raf = requestAnimationFrame(loop)
  const dt = Math.min(0.05, (now - (last || now)) / 1000)
  last = now
  if (document.hidden) return
  let r: WebGLRenderer | null = null
  for (const e of entries) {
    if (!e.visible) continue
    const w = e.canvas.width
    const h = e.canvas.height
    if (!w || !h) continue
    r ??= getRenderer()
    if (!REDUCED_MOTION) e.pivot.rotation.y += dt * (e.hot ? 1.4 : 0.45)
    e.placeholder.rotation.y += dt * 2
    const aspect = w / h
    if (Math.abs(e.camera.aspect - aspect) > 1e-3) {
      e.camera.aspect = aspect
      e.camera.updateProjectionMatrix()
    }
    r.setViewport(0, 0, w, h)
    r.setScissor(0, 0, w, h)
    r.setScissorTest(true)
    r.clear()
    r.render(e.scene, e.camera)
    // WebGL draws bottom-up: the probe sits in the bottom-left w×h corner of the shared buffer
    e.ctx.clearRect(0, 0, w, h)
    e.ctx.drawImage(r.domElement, 0, MAX_H - h, w, h, 0, 0, w, h)
  }
}

function ensureLoop() {
  if (!raf && entries.size) {
    last = 0
    raf = requestAnimationFrame(loop)
  }
}

function makeScene(): Pick<Entry, 'scene' | 'camera' | 'pivot' | 'placeholder'> {
  const scene = new Scene()
  scene.add(new AmbientLight(0xffffff, 0.7))
  const key = new DirectionalLight(0xffffff, 2.4)
  key.position.set(3, 4, 5)
  scene.add(key)
  const rim = new PointLight(0x4fe3d6, 6)
  rim.position.set(-3, -1, -3)
  scene.add(rim)
  const camera = new PerspectiveCamera(34, 1.6, 0.1, 50)
  camera.position.set(0, 0.9, 3.4)
  camera.lookAt(0, 0, 0)
  const pivot = new Group()
  scene.add(pivot)
  const placeholder = new Mesh(new OctahedronGeometry(0.5, 0), new MeshBasicMaterial({ color: '#00d9ff', wireframe: true, transparent: true, opacity: 0.6 }))
  scene.add(placeholder)
  return { scene, camera, pivot, placeholder }
}

export interface ProbeHandle {
  setHot(hot: boolean): void
  dispose(): void
}

/** Starts drawing `model` into `canvas` whenever the canvas is on screen. */
export function attachProbe(canvas: HTMLCanvasElement, model: ProbeModel): ProbeHandle {
  const ctx = canvas.getContext('2d')
  if (!ctx) return { setHot() {}, dispose() {} }
  const entry: Entry = { canvas, ctx, ...makeScene(), hot: false, visible: false, model, requested: false }

  const fit = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const w = Math.min(MAX_W, Math.round(canvas.clientWidth * dpr))
    const h = Math.min(MAX_H, Math.round(canvas.clientHeight * dpr))
    if (canvas.width !== w) canvas.width = w
    if (canvas.height !== h) canvas.height = h
  }
  const ro = new ResizeObserver(fit)
  ro.observe(canvas)
  fit()

  const io = new IntersectionObserver(
    ([e]) => {
      entry.visible = e.isIntersecting
      if (entry.visible && !entry.requested) {
        entry.requested = true
        loadPrototype(model)
          .then((proto) => {
            if (!entries.has(entry)) return
            entry.pivot.add(proto.clone(true))
            entry.placeholder.visible = false
          })
          .catch(() => {
            // keep the spinning placeholder: the card still reads fine without its probe
          })
      }
    },
    { rootMargin: '160px' },
  )
  io.observe(canvas)

  entries.add(entry)
  ensureLoop()

  return {
    setHot(hot) {
      entry.hot = hot
    },
    dispose() {
      io.disconnect()
      ro.disconnect()
      entries.delete(entry)
      if (!entries.size && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    },
  }
}
