import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import {
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix3,
  Matrix4,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  type Texture,
} from 'three'
import { fragmentShader, vertexShader } from './shaders'
import { T, introClock, introUniforms, markIntroSeen } from './timeline'
import { live, useHud, type Tier } from '../state/store'
import { MARS_TILT, SUN_DIR, useLayout } from '../three/layout'

const COUNT_BY_TIER: Record<Tier, number> = { high: 32000, mid: 18000, low: 9000 }

interface Field {
  count: number
  face: Float32Array
  meta: Float32Array
}

async function loadField(url: string, want: number): Promise<Field> {
  const buf = await (await fetch(url)).arrayBuffer()
  const view = new DataView(buf)
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
  if (magic !== 'RPF1') throw new Error('portrait-field.bin: bad header')
  const count = Math.min(want, view.getUint32(4, true))
  const face = new Float32Array(count * 2)
  const meta = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    const o = 16 + i * 8
    face[i * 2] = view.getInt16(o, true) / 32767
    face[i * 2 + 1] = view.getInt16(o + 2, true) / 32767
    meta[i * 4] = (view.getUint8(o + 4) / 255) * Math.PI
    meta[i * 4 + 1] = view.getUint8(o + 5) / 255
    meta[i * 4 + 2] = view.getUint8(o + 6) / 255
    meta[i * 4 + 3] = view.getUint8(o + 7) / 255
  }
  return { count, face, meta }
}

/**
 * The intro (implementasi.md §2.1): strands swirl into a vortex, settle into the portrait, then unravel onto a
 * sphere that matches the Mars mesh exactly, which fades in to take over.
 */
export function ParticlePortrait() {
  const tier = useHud((s) => s.tier)
  const [field, setField] = useState<Field | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    loadField('/intro/portrait-field.bin', COUNT_BY_TIER[tier])
      .then((f) => alive && setField(f))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
    // the tier is read once: the intro does not rebuild mid-play
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (failed) finishIntro()
  }, [failed])

  return field ? <Strands field={field} /> : null
}

function finishIntro() {
  live.landingIn = 1
  document.documentElement.style.setProperty('--landing', '1')
  markIntroSeen()
  useHud.getState().setPhase('landing')
}

function Strands({ field }: { field: Field }) {
  const layout = useLayout()
  const size = useThree((s) => s.size)
  const active = useProgress((s) => s.active)
  const loading = useRef(active)
  loading.current = active

  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(1, 1)
    const g = new InstancedBufferGeometry()
    g.index = plane.index
    g.setAttribute('position', plane.getAttribute('position'))
    g.setAttribute('uv', plane.getAttribute('uv'))
    const idx = new Float32Array(field.count)
    for (let i = 0; i < field.count; i++) idx[i] = i
    g.setAttribute('aFace', new InstancedBufferAttribute(field.face, 2))
    g.setAttribute('aMeta', new InstancedBufferAttribute(field.meta, 4))
    g.setAttribute('aIdx', new InstancedBufferAttribute(idx, 1))
    g.instanceCount = field.count
    return g
  }, [field])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTime: { value: 0 },
          uSpread: { value: 0 },
          uMorph: { value: 0 },
          uSphere: { value: 0 },
          uFade: { value: 1 },
          uCount: { value: field.count },
          uPx: { value: 0.01 },
          uFaceScale: { value: 1 },
          uFaceCenter: { value: new Vector2() },
          uPointer: { value: new Vector2(99, 99) },
          uPointerAmt: { value: 0 },
          uMarsPos: { value: new Vector3() },
          uMarsR: { value: 1 },
          uMarsRot: { value: new Matrix3() },
          uSun: { value: new Vector3(...SUN_DIR).normalize() },
          uMarsTex: { value: null as Texture | null },
          uHasTex: { value: 0 },
        },
      }),
    [field],
  )

  // Mars colours for the sphere phase: loaded on the side, the intro never waits for it
  useEffect(() => {
    const tex = new TextureLoader().load('/textures/mars.jpg', () => {
      material.uniforms.uMarsTex.value = tex
      material.uniforms.uHasTex.value = 1
    })
    tex.colorSpace = SRGBColorSpace
    return () => tex.dispose()
  }, [material])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useEffect(() => {
    introClock.t = 0
    introClock.extension = 0
  }, [])

  const rot = useMemo(() => ({ m4: new Matrix4(), tilt: new Matrix4() }), [])
  const pointerAmt = useRef(0)

  useFrame((_, dt) => {
    const step = Math.min(dt, 1 / 20) * (useHud.getState().skipIntro ? 4 : 1)
    const c = introClock
    // hold the face while landing assets are still loading (bounded)
    if (c.t >= T.holdEnd && c.t < T.holdEnd + 0.05 && loading.current && c.extension < T.maxExtension && !useHud.getState().skipIntro) {
      c.extension += step
    } else {
      c.t += step
    }
    const u = introUniforms(c.t)
    const U = material.uniforms
    U.uTime.value += step
    U.uSpread.value = u.spread
    U.uMorph.value = u.morph
    U.uSphere.value = u.sphere
    U.uFade.value = 1 - u.handoff
    U.uPx.value = layout.px
    U.uFaceScale.value = layout.faceScale
    U.uFaceCenter.value.set(...layout.faceCenter)
    U.uMarsPos.value.set(...layout.marsPos)
    U.uMarsR.value = layout.marsR
    rot.tilt.makeRotationZ(MARS_TILT)
    rot.m4.makeRotationY(live.marsSpin).premultiply(rot.tilt)
    U.uMarsRot.value.setFromMatrix4(rot.m4)

    // pointer in world units at z = 0
    const wantPointer = live.ndc.x < 2 ? 1 : 0
    pointerAmt.current += (wantPointer - pointerAmt.current) * Math.min(1, dt * 4)
    U.uPointerAmt.value = pointerAmt.current
    if (wantPointer) U.uPointer.value.set((live.ndc.x * layout.viewW) / 2, (live.ndc.y * (layout.px * size.height)) / 2)

    live.landingIn = u.handoff
    document.documentElement.style.setProperty('--landing', u.handoff.toFixed(3))
    if (c.t >= T.handoffEnd) finishIntro()
  })

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={10} />
}
