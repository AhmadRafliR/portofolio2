import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import {
  AdditiveBlending,
  BackSide,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  Matrix4,
  NormalBlending,
  Quaternion,
  ShaderMaterial,
  Vector3,
  type DirectionalLight,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type Object3D,
  type PerspectiveCamera,
} from 'three'
import { MISSIONS, MISSION_BY_ID, SURFACE_SITES, type MissionId } from '../data/missions'
import { useHud, type Tier } from '../state/store'
import { REDUCED_MOTION } from '../lib/device'
import { usePumpJack } from '../three/SurfaceSites'
import { loadHeightField, sunDirection, vnoise, type HeightField } from './terrain'
import type { TerrainBuildRequest, TerrainBuildResult } from './terrain.worker'
import { useGroundMaterial, useRockMaterial, type TexSize } from './materials'
import { FIELD, GROUND_MODELS, MAIN_RIG, WALK_SITES, missionSpots, type Spot, type WalkSite } from './sites'
import { EYE_HEIGHT, MARS_G, releaseWalkInput, walkInput, walker } from './input'

/** walk labels live inside .page (so they take clicks and stack under the HUD panels); resolved when drawn */
const LABELS = {
  get current() {
    return document.getElementById('walk-labels') as HTMLElement
  },
}
const HUD_SELECTOR = 'a, button, input, textarea, .panel, .detail, .dock, .telemetry, .term-overlay, .surface-hud, .walk-pad'

const QUALITY: Record<Tier, { rings: number; segs: number; tex: TexSize; rocks: number; dust: number; shadow: number }> = {
  high: { rings: 150, segs: 224, tex: '1k', rocks: 700, dust: 1400, shadow: 1024 },
  mid: { rings: 120, segs: 176, tex: '512', rocks: 500, dust: 900, shadow: 1024 },
  low: { rings: 84, segs: 128, tex: '512', rocks: 260, dust: 400, shadow: 0 },
}

/** Landing: a short drop from ~250 m onto the spot, easing to a soft touchdown. */
const LANDING_SECONDS = 3.2
const LANDING_HEIGHT = 250

const SKY = {
  zenith: new Color('#8f5f43'),
  horizon: new Color('#c99a76'),
  glow: new Color('#9db8e6'),
  light: new Color('#fff0dc'),
}

function setDive(v: number) {
  document.documentElement.style.setProperty('--dive', v.toFixed(3))
}

/** Spawn frame: unit vectors toward the look-at (`f`) and to its right (`r`), x east / z south. */
function frameOf(site: WalkSite) {
  const dx = site.spawn.lookAt.x - site.spawn.x
  const dz = site.spawn.lookAt.z - site.spawn.z
  const L = Math.hypot(dx, dz) || 1
  const f = { x: dx / L, z: dz / L }
  const r = { x: -f.z, z: f.x }
  const at = (s: Spot) => ({ x: site.spawn.x + f.x * s.ahead + r.x * s.right, z: site.spawn.z + f.z * s.ahead + r.z * s.right })
  return { f, r, at, yaw: Math.atan2(-dx, -dz) }
}

/**
 * Surface mode, on foot (ported from the SPHEREx XR project's SurfaceScene): a NASA elevation model under a dusty
 * Mars sky, rocks and drifting dust. On it, this portfolio: the site's engineering mission as a working pump-jack
 * oil field, and every other mission parked nearby as its NASA probe, each a hotspot that opens the mission brief.
 * Desktop: WASD / arrows + drag to look. Phone: drag to look + hold-to-walk.
 */
export function SurfaceWalk({ siteIndex }: { siteIndex: number }) {
  const site = SURFACE_SITES[siteIndex]
  const ws = WALK_SITES[site.terrain]
  const tier = useHud((s) => s.tier)
  const q = QUALITY[tier]
  const [hf, setHf] = useState<HeightField | null>(null)
  const frame = useMemo(() => frameOf(ws), [ws])

  useLayoutEffect(() => {
    walker.ready = false
    walker.landed = false
    setDive(1)
  }, [ws])

  useEffect(() => {
    let alive = true
    loadHeightField(ws.terrain)
      .then((h) => alive && setHf(h))
      .catch(() => {
        if (!alive) return
        useHud.getState().showToast('Could not load the terrain. Back to orbit.')
        useHud.getState().takeOff()
      })
    return () => {
      alive = false
    }
  }, [ws])

  return (
    <>
      <Environment site={ws} shadow={q.shadow} />
      {hf && (
        <>
          <Terrain site={ws} rings={q.rings} segs={q.segs} tex={q.tex} />
          <Rocks site={ws} hf={hf} count={q.rocks} tex={q.tex} frame={frame} />
          <DustField count={q.dust} />
          <OilField site={ws} hf={hf} frame={frame} mission={site.mission.id} shadows={q.shadow > 0} />
          <MissionPark hf={hf} frame={frame} siteMission={site.mission.id} shadows={q.shadow > 0} />
          <Walker site={ws} hf={hf} frame={frame} />
        </>
      )}
    </>
  )
}

// ---------- sky, haze, sun ----------
function Environment({ site, shadow }: { site: WalkSite; shadow: number }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const far = site.terrain.viewRadius * 1.2
  const sunDir = useMemo(() => sunDirection(site.sun.azimuthDeg, site.sun.elevationDeg), [site])
  const sun = useRef<DirectionalLight>(null)
  const span = 40

  // on foot: a human field of view (the orbit's 38° tele lens hides everything beside the path)
  const tall = useThree((s) => s.size.height > s.size.width)
  useEffect(() => {
    const prev = { near: camera.near, far: camera.far, fov: camera.fov }
    camera.near = 0.05
    camera.far = far
    camera.fov = tall ? 72 : 60
    camera.updateProjectionMatrix()
    return () => {
      camera.near = prev.near
      camera.far = prev.far
      camera.fov = prev.fov
      camera.updateProjectionMatrix()
    }
  }, [camera, far, tall])

  // the sun's shadow box follows the visitor, snapped to its texel grid so shadows don't shimmer
  useFrame(() => {
    const l = sun.current
    if (!l) return
    const texel = (span * 2) / Math.max(1, shadow)
    const cx = Math.round(camera.position.x / texel) * texel
    const cz = Math.round(camera.position.z / texel) * texel
    const cy = camera.position.y - EYE_HEIGHT
    l.target.position.set(cx, cy, cz)
    l.position.set(cx + sunDir[0] * 200, cy + sunDir[1] * 200, cz + sunDir[2] * 200)
    l.target.updateMatrixWorld()
  })

  return (
    <>
      <fogExp2 attach="fog" args={[SKY.horizon, site.fogDensity]} />
      <MarsSky sunDir={sunDir} radius={far * 0.8} />
      <hemisphereLight args={['#d9b08c', '#5e3522', 0.85]} />
      {/* the landing faces into the sun at Gale: a soft sky fill from behind the visitor keeps the rigs readable */}
      <directionalLight position={[-sunDir[0] * 100, 60, -sunDir[2] * 100]} intensity={0.7} color="#e8c4a2" />
      <directionalLight
        key={shadow}
        ref={sun}
        intensity={2.3}
        color={SKY.light}
        castShadow={shadow > 0}
        shadow-mapSize={[shadow || 1, shadow || 1]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
        shadow-camera-near={10}
        shadow-camera-far={420}
      />
    </>
  )
}

/** Butterscotch day sky with the blue forward-scatter glow around the sun that NASA's rovers photograph. */
function MarsSky({ sunDir, radius }: { sunDir: [number, number, number]; radius: number }) {
  const ref = useRef<Mesh>(null)
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
        uniforms: {
          sunDir: { value: new Vector3(...sunDir) },
          zenith: { value: SKY.zenith },
          horizon: { value: SKY.horizon },
          glow: { value: SKY.glow },
          ground: { value: new Color('#7d4a32') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 sunDir, zenith, horizon, glow, ground;
          varying vec3 vDir;
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 col = h >= 0.0 ? mix(horizon, zenith, pow(h, 0.45)) : mix(horizon, ground, min(1.0, -h * 8.0));
            float s = max(dot(d, normalize(sunDir)), 0.0);
            col = mix(col, glow, clamp(pow(s, 24.0) * 0.55, 0.0, 0.9));
            col += vec3(1.0, 0.96, 0.9) * pow(s, 600.0) * 0.6;
            col = mix(col, vec3(1.0, 0.99, 0.95), smoothstep(0.99994, 0.99997, s));
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [sunDir],
  )
  useEffect(() => () => material.dispose(), [material])
  // follows the viewer, so the sky is "infinitely" far away
  useFrame(({ camera }) => {
    ref.current?.position.copy(camera.position)
  })
  return (
    <mesh ref={ref} material={material} renderOrder={-1000} frustumCulled={false} scale={radius}>
      <sphereGeometry args={[1, 48, 24]} />
    </mesh>
  )
}

// ---------- ground ----------
function geometryFromArrays(r: TerrainBuildResult): BufferGeometry {
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(r.position, 3))
  g.setAttribute('normal', new BufferAttribute(r.normal, 3))
  g.setAttribute('uv', new BufferAttribute(r.uv, 2))
  g.setAttribute('color', new BufferAttribute(r.color, 3))
  g.setAttribute('mask', new BufferAttribute(r.mask, 2))
  g.setIndex(new BufferAttribute(r.index, 1))
  g.computeBoundingSphere()
  return g
}

/** Built in a Web Worker and swapped in when ready; re-centred on the visitor after they walk 40 m. */
function Terrain({ site, rings, segs, tex }: { site: WalkSite; rings: number; segs: number; tex: TexSize }) {
  const camera = useThree((s) => s.camera)
  const [center, setCenter] = useState<[number, number]>([site.spawn.x, site.spawn.z])
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null)
  const material = useGroundMaterial(tex)
  const [worker, setWorker] = useState<Worker | null>(null)
  const requestId = useRef(0)

  // created in an effect (not useMemo) so StrictMode's mount/unmount/mount ends with a live worker
  useEffect(() => {
    const w = new Worker(new URL('./terrain.worker.ts', import.meta.url), { type: 'module' })
    w.onerror = () => {
      useHud.getState().showToast('Could not build the terrain. Back to orbit.')
      useHud.getState().takeOff()
    }
    setWorker(w)
    return () => w.terminate()
  }, [])

  useEffect(() => {
    if (!worker) return
    const id = ++requestId.current
    worker.onmessage = (e: MessageEvent<TerrainBuildResult>) => {
      if (e.data.id !== requestId.current) return
      const g = geometryFromArrays(e.data)
      setGeometry((old) => {
        old?.dispose()
        return g
      })
      walker.ready = true
    }
    const req: TerrainBuildRequest = { id, terrain: site.terrain, cx: center[0], cz: center[1], rMax: site.terrain.viewRadius, rings, segs }
    worker.postMessage(req)
  }, [worker, site, center, rings, segs])
  useEffect(() => () => setGeometry((old) => (old?.dispose(), null)), [])

  useFrame(() => {
    if (walker.ready && Math.hypot(camera.position.x - center[0], camera.position.z - center[1]) > 40) setCenter([camera.position.x, camera.position.z])
  })

  return geometry ? <mesh geometry={geometry} material={material} receiveShadow /> : null
}

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

type Frame = ReturnType<typeof frameOf>

/** Scattered basalt rocks around the landing spot (kept clear of the rigs and the parked probes). */
function Rocks({ site, hf, count, tex, frame }: { site: WalkSite; hf: HeightField; count: number; tex: TexSize; frame: Frame }) {
  const material = useRockMaterial(tex)
  const ref = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => {
    const g = new IcosahedronGeometry(1, 2)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const y = p.getY(i)
      const z = p.getZ(i)
      const d = 1 + 0.28 * vnoise(x * 2.3 + 11, y * 2.1 + z * 1.7) + 0.08 * vnoise(x * 7.1 - 3, z * 6.3 + y * 5.2)
      p.setXYZ(i, x * d, y * d, z * d)
    }
    g.computeVertexNormals()
    return g
  }, [])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const keepClear = [MAIN_RIG, ...FIELD, ...missionSpots('m-01', MISSIONS.map((x) => x.id)).map((s) => s.spot), { ahead: 10, right: 9 }].map(frame.at)
    const rnd = seeded(site.id.length * 7919 + 17)
    const mat = new Matrix4()
    const quat = new Quaternion()
    const pos = new Vector3()
    const scl = new Vector3()
    const axis = new Vector3()
    for (let i = 0; i < count; i++) {
      let x = 0
      let z = 0
      for (let tries = 0; tries < 6; tries++) {
        const r = 2.5 + 150 * Math.sqrt(rnd())
        const a = rnd() * Math.PI * 2
        x = site.spawn.x + r * Math.cos(a)
        z = site.spawn.z + r * Math.sin(a)
        if (keepClear.every((c) => Math.hypot(x - c.x, z - c.z) > 6)) break
      }
      const size = 0.03 + 0.75 * Math.pow(rnd(), 5)
      axis.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize()
      quat.setFromAxisAngle(axis, rnd() * Math.PI * 2)
      pos.set(x, hf.heightAt(x, z) + size * 0.15, z)
      scl.set(size, size * (0.5 + rnd() * 0.4), size * (0.8 + rnd() * 0.5))
      m.setMatrixAt(i, mat.compose(pos, quat, scl))
    }
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingSphere()
  }, [site, hf, geometry, count, frame])
  return <instancedMesh key={count} ref={ref} args={[geometry, material, count]} castShadow receiveShadow />
}

/** Fine dust drifting on the wind in the lowest few metres around the visitor. */
function DustField({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const r = seeded(7)
    const seed = new Float32Array(count * 3)
    const size = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      seed[i * 3] = r()
      seed[i * 3 + 1] = r()
      seed[i * 3 + 2] = r()
      size[i] = r() < 0.04 ? 0.06 + r() * 0.05 : 0.012 + r() * 0.02
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3))
    g.setAttribute('seed', new BufferAttribute(seed, 3))
    g.setAttribute('size', new BufferAttribute(size, 1))
    return g
  }, [count])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uCam: { value: new Vector3() },
          uBox: { value: 80 },
          uWind: { value: new Vector3(2.2, 0, 0.9) },
          uScale: { value: 500 },
          uColor: { value: new Color('#d9a77f') },
        },
        vertexShader: /* glsl */ `
          attribute vec3 seed;
          attribute float size;
          uniform float uTime, uBox, uScale;
          uniform vec3 uCam, uWind;
          varying float vAlpha;
          void main() {
            vec3 p = seed * uBox + uWind * uTime * (0.6 + seed.y);
            p.xz = mod(p.xz - uCam.xz + uBox * 0.5, uBox) + uCam.xz - uBox * 0.5;
            p.y = uCam.y - 1.6 + mod(seed.y * 7.0 + sin(uTime * 0.4 + seed.x * 40.0) * 0.4, 7.0) * (0.3 + seed.z);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = clamp(size * uScale / -mv.z, 0.0, 24.0);
            float dist = length(p - uCam);
            vAlpha = smoothstep(uBox * 0.5, uBox * 0.25, dist) * smoothstep(0.4, 2.0, -mv.z) * (size > 0.05 ? 0.55 : 0.32);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d) * vAlpha;
            if (a < 0.01) discard;
            gl_FragColor = vec4(uColor, a);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  useFrame(({ camera, size }, dt) => {
    if (!REDUCED_MOTION) material.uniforms.uTime.value += dt
    material.uniforms.uCam.value.copy(camera.position)
    material.uniforms.uScale.value = size.height * 0.9
  })
  return <points geometry={geometry} material={material} frustumCulled={false} />
}

// ---------- the portfolio on the ground ----------
const RIG_M = 9
const smooth01 = (x: number) => x * x * (3 - 2 * x)

/** The engineering mission's working rig (with its hotspot) plus a few more pump jacks out on the plain. */
function OilField({ site, hf, frame, mission, shadows }: { site: WalkSite; hf: HeightField; frame: Frame; mission: MissionId; shadows: boolean }) {
  const main = frame.at(MAIN_RIG)
  return (
    <Suspense fallback={null}>
      <PumpJack x={main.x} z={main.z} hf={hf} height={RIG_M * 1.15} yaw={frame.yaw + 1.2} shadows={shadows} />
      <Hotspot id={mission} x={main.x} z={main.z} hf={hf} lift={RIG_M * 1.15 + 1.6} rig />
      {FIELD.map((s, i) => {
        const p = frame.at(s)
        return <PumpJack key={`${site.id}-${i}`} x={p.x} z={p.z} hf={hf} height={RIG_M * s.scale} yaw={frame.yaw + s.yaw} shadows={shadows} phase={i * 1.7} />
      })}
    </Suspense>
  )
}

/** A pump jack standing on the terrain; the whole rig nods gently like a working well (the model is one piece). */
function PumpJack({ x, z, hf, height, yaw, shadows, phase = 0 }: { x: number; z: number; hf: HeightField; height: number; yaw: number; shadows: boolean; phase?: number }) {
  const proto = usePumpJack()
  const obj = useMemo(() => {
    const c = proto.clone(true)
    c.traverse((o) => {
      o.castShadow = shadows
      o.receiveShadow = shadows
    })
    return c
  }, [proto, shadows])
  // sit on the lowest corner of its footprint so no leg floats on a slope
  const y = useMemo(() => {
    const r = height * 0.45
    return Math.min(hf.heightAt(x, z), hf.heightAt(x + r, z), hf.heightAt(x - r, z), hf.heightAt(x, z + r), hf.heightAt(x, z - r))
  }, [hf, x, z, height])
  const lamp = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (lamp.current) (lamp.current.material as MeshBasicMaterial).opacity = 0.35 + 0.65 * Math.round((Math.sin(clock.elapsedTime * 2.4 + phase) + 1) / 2)
  })
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <primitive object={obj} scale={height} />
      <mesh ref={lamp} position={[0, height * 1.04, 0]}>
        <sphereGeometry args={[0.18, 12, 10]} />
        <meshBasicMaterial color="#ffb54a" transparent fog={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[height * 0.62, 40]} />
        <meshStandardMaterial color="#6b4a36" roughness={1} transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Every other mission waits near the landing spot as its NASA probe (or just a beacon when it has no ground model). */
function MissionPark({ hf, frame, siteMission, shadows }: { hf: HeightField; frame: Frame; siteMission: MissionId; shadows: boolean }) {
  const spots = useMemo(() => missionSpots(siteMission, MISSIONS.map((m) => m.id)), [siteMission])
  return (
    <>
      {spots.map(({ id, spot }) => {
        const p = frame.at(spot)
        const model = MISSION_BY_ID[id].model
        const ground = GROUND_MODELS[model]
        return (
          <group key={id}>
            {ground && (
              <Suspense fallback={null}>
                <GroundModel model={model} x={p.x} z={p.z} hf={hf} sizeM={ground.sizeM} lift={ground.lift} yaw={frame.yaw + Math.PI + spot.right * 0.04} shadows={shadows} />
              </Suspense>
            )}
            <Hotspot id={id} x={p.x} z={p.z} hf={hf} lift={ground ? Math.max(2.4, ground.lift + 1.6) : 0} />
          </group>
        )
      })}
    </>
  )
}

function GroundModel({ model, x, z, hf, sizeM, lift, yaw, shadows }: { model: string; x: number; z: number; hf: HeightField; sizeM: number; lift: number; yaw: number; shadows: boolean }) {
  const { scene } = useGLTF(`/models/hud/${model}.glb`)
  const obj = useMemo(() => {
    const c = scene.clone(true) as Object3D
    c.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      // the HUD build drops flat normals so meshes could be simplified; rebuild smooth ones
      if (!mesh.geometry.getAttribute('normal')) mesh.geometry.computeVertexNormals()
      mesh.castShadow = shadows
      mesh.receiveShadow = shadows
      const mat = mesh.material as MeshStandardMaterial
      if ('metalness' in mat) mesh.material = Object.assign(mat.clone(), { metalness: Math.min(mat.metalness, 0.35) })
    })
    const size = new Box3().setFromObject(c).getSize(new Vector3())
    c.scale.setScalar(sizeM / Math.max(size.x, size.z))
    const b = new Box3().setFromObject(c)
    c.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2)
    const g = new Group()
    g.add(c)
    return g
  }, [scene, sizeM, shadows])
  const group = useRef<Group>(null)
  const base = hf.heightAt(x, z) + lift
  useFrame(({ clock }) => {
    // Ingenuity hovers
    if (group.current && lift > 0 && !REDUCED_MOTION) {
      group.current.position.y = base + Math.sin(clock.elapsedTime * 1.3) * 0.25
      group.current.rotation.y = yaw + clock.elapsedTime * 0.3
    }
  })
  return (
    <group ref={group} position={[x, base, z]} rotation={[0, yaw, 0]}>
      <primitive object={obj} />
    </group>
  )
}

const tmpV = new Vector3()

/** Glowing pin over a mission: stays a readable size at any distance; click (or its label) opens the brief. */
function Hotspot({ id, x, z, hf, lift, rig = false }: { id: MissionId; x: number; z: number; hf: HeightField; lift: number; rig?: boolean }) {
  const m = MISSION_BY_ID[id]
  const base = useMemo(() => new Vector3(x, hf.heightAt(x, z), z), [x, z, hf])
  const inner = useRef<Group>(null)
  const glow = useRef<Mesh>(null)
  const dist = useRef<HTMLSpanElement>(null)
  const last = useRef(0)
  const hover = useHud((s) => s.hoverMission === id)
  const color = rig || m.status !== 'deployed' ? '#ffb54a' : '#4fe3d6'
  const pole = lift === 0
  // a lifted pin floats at `lift`; only the pin itself scales with distance, not its height
  const orbY = pole ? 1.8 : 0

  useFrame(({ camera, clock }) => {
    const d = camera.position.distanceTo(tmpV.copy(base).setY(base.y + lift + orbY))
    if (inner.current) inner.current.scale.setScalar(Math.max(1, d / 14))
    if (glow.current) glow.current.scale.setScalar((hover ? 1.6 : 1) * (1 + 0.15 * Math.sin(clock.elapsedTime * 3)))
    if (dist.current && clock.elapsedTime - last.current > 0.4) {
      last.current = clock.elapsedTime
      dist.current.textContent = d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`
    }
  })

  const open = () => useHud.getState().setActive(id)
  // R3F hears every click that bubbles to #root: one on a HUD button above the pin is not a click on the pin
  const onHud = (e: { nativeEvent: Event }) => Boolean((e.nativeEvent.target as HTMLElement | null)?.closest?.(HUD_SELECTOR))
  const events = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (onHud(e)) return
      e.stopPropagation()
      useHud.getState().setHover(id)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      useHud.getState().setHover(null)
      document.body.style.cursor = ''
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (onHud(e) || useHud.getState().activeMission) return
      e.stopPropagation()
      open()
    },
  }

  return (
    <group position={[base.x, base.y + lift, base.z]}>
      <group ref={inner}>
        {pole && (
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.02, 0.03, 1.6, 6]} />
            <meshBasicMaterial color={color} fog={false} toneMapped={false} />
          </mesh>
        )}
        <mesh position={[0, orbY, 0]} {...events}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color={hover ? '#ffffff' : color} fog={false} toneMapped={false} />
        </mesh>
        <mesh ref={glow} position={[0, orbY, 0]}>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} blending={AdditiveBlending} fog={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, orbY - (pole ? 0.4 : 0), 0]} {...events}>
          <sphereGeometry args={[pole ? 0.6 : 0.45, 10, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <Html position={[0, orbY + 0.35, 0]} center zIndexRange={[6, 0]} portal={LABELS}>
          <button type="button" className={`walk-pin ${rig ? 'rig' : m.status} ${hover ? 'hot' : ''}`} onClick={open} onPointerEnter={() => useHud.getState().setHover(id)} onPointerLeave={() => useHud.getState().setHover(null)}>
            <b>
              {m.code} · {m.name}
            </b>
            <span>
              {rig ? 'Oil field · ' : ''}
              <span ref={dist}>—</span>
            </span>
          </button>
        </Html>
      </group>
    </group>
  )
}

// ---------- on foot ----------
const KEYS: Record<string, keyof typeof walkInput> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  Space: 'jump',
  KeyQ: 'turnLeft',
  KeyE: 'turnRight',
}

function Walker({ site, hf, frame }: { site: WalkSite; hf: HeightField; frame: Frame }) {
  const camera = useThree((s) => s.camera)
  const pitch0 = useMemo(() => {
    const { x, z, lookAt } = site.spawn
    const rise = hf.baseAt(lookAt.x, lookAt.z) - (hf.baseAt(x, z) + EYE_HEIGHT)
    return Math.max(-0.35, Math.min(0.1, Math.atan2(rise, Math.hypot(lookAt.x - x, lookAt.z - z))))
  }, [site, hf])
  const st = useRef({ x: site.spawn.x, z: site.spawn.z, yaw: frame.yaw, pitch: pitch0, vy: 0, jy: 0, descent: LANDING_SECONDS, fade: 1 })

  useEffect(() => {
    st.current = { x: site.spawn.x, z: site.spawn.z, yaw: frame.yaw, pitch: pitch0, vy: 0, jy: 0, descent: LANDING_SECONDS, fade: 1 }
  }, [site, frame, pitch0])

  useEffect(() => {
    let drag: number | null = null
    let lx = 0
    let ly = 0
    const blocked = () => {
      const s = useHud.getState()
      return Boolean(s.activeMission || s.terminalOpen)
    }
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.(HUD_SELECTOR) || blocked()) return
      drag = e.pointerId
      lx = e.clientX
      ly = e.clientY
    }
    const move = (e: PointerEvent) => {
      if (drag !== e.pointerId) return
      const s = st.current
      s.yaw -= (e.clientX - lx) * 0.0045
      s.pitch = Math.max(-1.35, Math.min(1.35, s.pitch - (e.clientY - ly) * 0.0045))
      lx = e.clientX
      ly = e.clientY
    }
    const up = (e: PointerEvent) => {
      if (drag === e.pointerId) drag = null
    }
    const key = (on: boolean) => (e: KeyboardEvent) => {
      const k = KEYS[e.code]
      const t = e.target as HTMLElement | null
      if (!k || (t && /input|textarea|select/i.test(t.tagName))) return
      if (on && blocked()) return
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault()
      if (k === 'jump') {
        if (on) walkInput.jump = true
      } else walkInput[k] = on
    }
    const kd = key(true)
    const ku = key(false)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('blur', releaseWalkInput)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      window.removeEventListener('blur', releaseWalkInput)
      releaseWalkInput()
    }
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = st.current
    // hold in the dust cloud until the ground mesh arrives, then clear it and drop in
    if (!walker.ready) {
      setDive(1)
      camera.position.set(s.x, hf.heightAt(s.x, s.z) + EYE_HEIGHT + LANDING_HEIGHT, s.z)
      return
    }
    if (s.fade > 0) {
      s.fade = Math.max(0, s.fade - dt / 0.9)
      setDive(smooth01(s.fade))
    }
    if (s.descent > 0) s.descent = REDUCED_MOTION ? 0 : Math.max(0, s.descent - dt)
    const landing = s.descent > 0
    walker.landed = !landing
    const fx = -Math.sin(s.yaw)
    const fz = -Math.cos(s.yaw)
    s.yaw += ((walkInput.turnLeft ? 1 : 0) - (walkInput.turnRight ? 1 : 0)) * 1.6 * dt
    const mf = landing ? 0 : (walkInput.forward ? 1 : 0) - (walkInput.back ? 1 : 0)
    const mr = landing ? 0 : (walkInput.right ? 1 : 0) - (walkInput.left ? 1 : 0)
    if (mf || mr) {
      const speed = walkInput.run ? 6 : 2.2
      const L = Math.hypot(mf, mr)
      s.x += ((fx * mf - fz * mr) / L) * speed * dt
      s.z += ((fz * mf + fx * mr) / L) * speed * dt
      const mx = hf.width / 2 - 5
      const mz = hf.depth / 2 - 5
      s.x = Math.max(-mx, Math.min(mx, s.x))
      s.z = Math.max(-mz, Math.min(mz, s.z))
    }
    // low-gravity jump: an Earth-strength push, but Mars pulls only 38% as hard
    if (walkInput.jump && s.jy === 0 && !landing) s.vy = 2.6
    walkInput.jump = false
    if (s.vy !== 0 || s.jy > 0) {
      s.vy -= MARS_G * dt
      s.jy += s.vy * dt
      if (s.jy <= 0) {
        s.jy = 0
        s.vy = 0
      }
    }
    const ground = hf.heightAt(s.x, s.z)
    const k = s.descent / LANDING_SECONDS
    const drop = landing ? LANDING_HEIGHT * k * k * k : 0
    camera.position.set(s.x, ground + EYE_HEIGHT + s.jy + drop, s.z)
    camera.rotation.order = 'YXZ'
    camera.rotation.set(s.pitch, s.yaw, 0)
    walker.dist = Math.hypot(s.x - site.spawn.x, s.z - site.spawn.z)
    walker.heading = ((Math.atan2(fx, -fz) * 180) / Math.PI + 360) % 360
  })
  return null
}
