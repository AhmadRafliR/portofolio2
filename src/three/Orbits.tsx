import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import { BufferAttribute, BufferGeometry, Color, LineBasicMaterial, Vector3, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import { MISSIONS, type Mission } from '../data/missions'
import { live, useHud } from '../state/store'
import { REDUCED_MOTION } from '../lib/device'
import { useLayout } from './layout'

/** drei <Html> would portal into #root (the canvas event source), which is not clipped; use the label layer */
const LABELS = { current: document.getElementById('labels') as HTMLElement }

const TEAL = new Color('#4fe3d6')
const AMBER = new Color('#ffb54a')

const RINGS = {
  inner: { radius: 1.75, rotation: [1.22, 0, 0.3] as [number, number, number], speed: 0.05 },
  outer: { radius: 2.35, rotation: [1.32, 0, -0.22] as [number, number, number], speed: -0.032 },
}

function circleGeometry(radius: number, segments = 256, ticks = 0, tickLen = 0.04) {
  const pts: number[] = []
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2
    const a1 = ((i + 1) / segments) * Math.PI * 2
    pts.push(Math.cos(a0) * radius, 0, Math.sin(a0) * radius, Math.cos(a1) * radius, 0, Math.sin(a1) * radius)
  }
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2
    const r0 = radius - tickLen / 2
    const r1 = radius + tickLen / 2
    pts.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a) * r1, 0, Math.sin(a) * r1)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3))
  return g
}

/** Orbit rings with tick marks, the mission beacons that ride them, and a target reticle around Mars. */
export function Orbits() {
  const layout = useLayout()
  const R = layout.marsR
  const mats = useMemo(
    () => ({
      ring: new LineBasicMaterial({ color: '#8fb4ff', transparent: true, opacity: 0, depthWrite: false }),
      reticle: new LineBasicMaterial({ color: '#00d9ff', transparent: true, opacity: 0, depthWrite: false }),
    }),
    [],
  )
  const geos = useMemo(
    () => ({
      inner: circleGeometry(RINGS.inner.radius * R, 256, 72, 0.035 * R),
      outer: circleGeometry(RINGS.outer.radius * R, 256, 36, 0.05 * R),
      reticle: circleGeometry(1.14 * R, 128, 4, 0.16 * R),
    }),
    [R],
  )
  const reticle = useRef<Group>(null)

  useFrame((_, dt) => {
    // orbit furniture clears away while the camera is down on the surface
    const k = live.landingIn * (1 - live.surfaceIn)
    mats.ring.opacity = 0.32 * k
    mats.reticle.opacity = 0.55 * k
    if (reticle.current && !REDUCED_MOTION) reticle.current.rotation.z += dt * 0.08
  })

  return (
    <group position={layout.marsPos}>
      {(['inner', 'outer'] as const).map((ring) => (
        <group key={ring} rotation={RINGS[ring].rotation}>
          <lineSegments geometry={geos[ring]} material={mats.ring} />
          {MISSIONS.filter((m) => m.orbit.ring === ring && !m.landing).map((m) => (
            <Beacon key={m.id} mission={m} radius={RINGS[ring].radius * R} speed={RINGS[ring].speed} scale={R} labelled={layout.wide} />
          ))}
        </group>
      ))}
      <Billboard>
        <group ref={reticle} rotation={[Math.PI / 2, 0, 0]}>
          <lineSegments geometry={geos.reticle} material={mats.reticle} />
        </group>
        {layout.wide && (
        <Html position={[1.2 * R, 1.05 * R, 0]} className="reticle-label" zIndexRange={[5, 0]} pointerEvents="none" portal={LABELS}>
          <span className="landing-fade">
            TARGET · MARS
            <br />
            R 3,389.5 km · TILT 25.19°
            <br />
            <b className="land-hint">▾ Click Mars to land</b>
          </span>
        </Html>
        )}
      </Billboard>
    </group>
  )
}

function Beacon({ mission, radius, speed, scale, labelled }: { mission: Mission; radius: number; speed: number; scale: number; labelled: boolean }) {
  const group = useRef<Group>(null)
  const core = useRef<Mesh>(null)
  const halo = useRef<Mesh>(null)
  const label = useRef<HTMLSpanElement>(null)
  const angle = useRef(mission.orbit.phase * Math.PI * 2)
  const world = useMemo(() => new Vector3(), [])
  const color = mission.status === 'deployed' ? TEAL : AMBER
  const marsPos = useLayout().marsPos

  useFrame((state, dt) => {
    const { hoverMission, activeMission } = useHud.getState()
    const hot = hoverMission === mission.id || activeMission === mission.id
    if (!REDUCED_MOTION) angle.current += dt * speed * (activeMission === mission.id ? 0 : hot ? 0.2 : 1)
    const a = angle.current
    if (group.current) {
      group.current.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius)
      group.current.getWorldPosition(live.beacons[mission.id] ??= new Vector3())
    }
    // orbit furniture clears away while the camera is down on the surface
    const k = live.landingIn * (1 - live.surfaceIn)
    const pulse = 1 + 0.35 * Math.sin(state.clock.elapsedTime * 3 + mission.orbit.phase * 10)
    // the camera flies right up to the active beacon, so it stays small; hover enlarges it from afar
    const focused = activeMission === mission.id
    if (core.current) {
      core.current.scale.setScalar(focused ? 0.8 : hot ? 1.9 : 1)
      ;(core.current.material as MeshBasicMaterial).opacity = k
    }
    if (halo.current) {
      halo.current.scale.setScalar((focused ? 0.9 : hot ? 2.2 : 1.3) * pulse)
      ;(halo.current.material as MeshBasicMaterial).opacity = (hot ? 0.45 : 0.22) * k
    }
    // labels dim when the beacon passes behind Mars
    if (group.current && label.current) {
      group.current.getWorldPosition(world)
      const behind = world.z < marsPos[2] - 0.1 * scale
      label.current.style.opacity = String(k * (behind ? 0.25 : hot ? 1 : 0.75))
      label.current.classList.toggle('hot', hot)
    }
  })

  const select = () => useHud.getState().setActive(mission.id)

  return (
    <group ref={group}>
      <mesh
        ref={core}
        onPointerOver={(e) => {
          // hidden while on the surface, but three still raycasts invisible meshes
          if (useHud.getState().surface != null) return
          e.stopPropagation()
          useHud.getState().setHover(mission.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          useHud.getState().setHover(null)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          if (useHud.getState().surface != null) return
          e.stopPropagation()
          select()
        }}
      >
        <sphereGeometry args={[0.035 * scale, 16, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0} toneMapped={false} />
      </mesh>
      <Billboard>
        <mesh ref={halo}>
          <ringGeometry args={[0.05 * scale, 0.062 * scale, 40]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      </Billboard>
      {labelled && (
      <Html center position={[0, 0.11 * scale, 0]} zIndexRange={[6, 0]} pointerEvents="none" portal={LABELS}>
        <span ref={label} className={`beacon-label ${mission.status}`} style={{ opacity: 0 }}>
          {mission.code}
        </span>
      </Html>
      )}
    </group>
  )
}
