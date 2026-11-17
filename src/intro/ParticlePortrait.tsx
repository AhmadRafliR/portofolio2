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
import { fragmentShader, revealFragment, revealVertex, vertexShader } from './shaders'
import { EYES, L, PORTRAIT_ASPECT, T, introClock, introUniforms, markIntroSeen } from './timeline'
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
 * The intro (implementasi.md §2.1). Part 1: strands swirl into a vortex, settle into the portrait, and the crisp
 * portrait burns in with glowing eyes; it rests there. Part 2 runs once the visitor scrolls: the portrait dissolves,
 * the strands unravel onto a sphere that matches the Mars mesh exactly, and Mars plus the HUD fade in.
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

function setVar(name: string, v: number) {
  document.documentElement.style.setProperty(name, v.toFixed(3))
}

function finishIntro() {
  live.landingIn = 1
  setVar('--landing', 1)
  setVar('--launch', 1)
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
          uReveal: { value: 0 },
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

  const reveal = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: revealVertex,
        fragmentShader: revealFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTex: { value: null as Texture | null },
          uReveal: { value: 0 },
          uEyes: { value: 0 },
          uTime: { value: 0 },
          // eye centres in the plane's UV space (the plane spans x ∈ ±aspect, y ∈ ±1 of the portrait field)
          uEyeL: { value: new Vector2((EYES[0][0] / PORTRAIT_ASPECT + 1) / 2, (EYES[0][1] + 1) / 2) },
          uEyeR: { value: new Vector2((EYES[1][0] / PORTRAIT_ASPECT + 1) / 2, (EYES[1][1] + 1) / 2) },
        },
      }),
    [],
  )
  const revealReady = useRef(false)

  // textures loaded on the side; the intro never waits for them
  useEffect(() => {
    const loader = new TextureLoader()
    const mars = loader.load('/textures/mars.jpg', () => {
      material.uniforms.uMarsTex.value = mars
      material.uniforms.uHasTex.value = 1
    })
    mars.colorSpace = SRGBColorSpace
    const portrait = loader.load('/intro/portrait-reveal.webp', () => {
      reveal.uniforms.uTex.value = portrait
      revealReady.current = true
    })
    portrait.colorSpace = SRGBColorSpace
    return () => {
      mars.dispose()
      portrait.dispose()
    }
  }, [material, reveal])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      reveal.dispose()
    },
    [geometry, material, reveal],
  )

  useEffect(() => {
    // coming back from the landing: start at the end of the launch and run it backwards
    const back = useHud.getState().returning
    introClock.t = back ? T.rest : 0
    introClock.lt = back ? L.handoffEnd : -1
    introClock.waited = 0
  }, [])

  const rot = useMemo(() => ({ m4: new Matrix4(), tilt: new Matrix4() }), [])
  const pointerAmt = useRef(0)

  useFrame((_, dt) => {
    const { launched, launchFast, returning } = useHud.getState()
    const step = Math.min(dt, 1 / 20) * (launchFast ? 2.2 : 1)
    const c = introClock
    c.t = Math.min(T.rest, c.t + step)
    if (returning) {
      c.lt -= step * 1.15
      if (c.lt <= 0) {
        c.lt = -1
        useHud.getState().finishReturn()
      }
    } else if (launched) {
      if (c.lt < 0) c.lt = 0
      // Mars textures still loading: the sphere waits (bounded) before handing over
      if (c.lt >= L.sphereEnd && c.lt < L.sphereEnd + 0.05 && loading.current && c.waited < L.maxWait) c.waited += step
      else c.lt += step
    }
    const u = introUniforms(c.t, c.lt)
    const U = material.uniforms
    U.uTime.value += step
    U.uSpread.value = u.spread
    U.uMorph.value = u.morph
    U.uSphere.value = u.sphere
    U.uReveal.value = u.reveal
    U.uFade.value = 1 - u.handoff
    U.uPx.value = layout.px
    U.uFaceScale.value = layout.faceScale
    U.uFaceCenter.value.set(...layout.faceCenter)
    U.uMarsPos.value.set(...layout.marsPos)
    U.uMarsR.value = layout.marsR
    rot.tilt.makeRotationZ(MARS_TILT)
    rot.m4.makeRotationY(live.marsSpin).premultiply(rot.tilt)
    U.uMarsRot.value.setFromMatrix4(rot.m4)

    const R = reveal.uniforms
    R.uReveal.value = revealReady.current ? u.reveal : 0
    R.uEyes.value = revealReady.current ? u.eyes : 0
    R.uTime.value = U.uTime.value

    // pointer in world units at z = 0
    const wantPointer = live.ndc.x < 2 ? 1 : 0
    pointerAmt.current += (wantPointer - pointerAmt.current) * Math.min(1, dt * 4)
    U.uPointerAmt.value = pointerAmt.current
    if (wantPointer) U.uPointer.value.set((live.ndc.x * layout.viewW) / 2, (live.ndc.y * (layout.px * size.height)) / 2)

    live.landingIn = u.handoff
    setVar('--landing', u.handoff)
    setVar('--launch', u.launch)
    if (!returning && c.lt >= L.handoffEnd) finishIntro()
  })

  const fs = layout.faceScale
  return (
    <>
      <mesh
        material={reveal}
        position={[layout.faceCenter[0], layout.faceCenter[1], -0.01]}
        scale={[2 * fs * PORTRAIT_ASPECT, 2 * fs, 1]}
        frustumCulled={false}
        renderOrder={9}
      >
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={10} />
    </>
  )
}
