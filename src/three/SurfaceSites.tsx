import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import { Box3, Color, Group, Quaternion, Vector3, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial, type Object3D } from 'three'
import { FIELD_RIGS, MISSIONS, type Mission } from '../data/missions'
import { live, useHud } from '../state/store'

/** Rig height relative to the Mars radius (exaggerated so a pump jack reads from orbit). */
export const RIG_HEIGHT = 0.12
/** on the ground the exaggeration falls away: rigs shrink to this fraction so the planet reads as a planet */
export const SURFACE_RIG_SCALE = 0.35
const AMBER = new Color('#ffb54a')
const UP = new Vector3(0, 1, 0)
const LABELS = { current: document.getElementById('labels') as HTMLElement }

/**
 * Lat/lon → point on the unit Mars sphere, matching three's SphereGeometry UVs and the NASA mosaic (centred on
 * 0° longitude), so a site lands on the right spot of the texture.
 */
export function latLonToVector(lat: number, lon: number, out = new Vector3()): Vector3 {
  const theta = ((90 - lat) * Math.PI) / 180
  const phi = (((lon + 180) / 360) * 2 * Math.PI) % (2 * Math.PI)
  return out.set(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta))
}

export function usePumpJack(): Object3D {
  const { scene } = useGLTF('/models/hud/pump-jack.glb')
  return useMemo(() => {
    // stand it on its base, centred, one unit tall (a clone: the cached GLTF scene must never be re-parented)
    const model = scene.clone(true)
    const box = new Box3().setFromObject(model)
    const size = box.getSize(new Vector3())
    const c = box.getCenter(new Vector3())
    model.position.set(-c.x, -box.min.y, -c.z)
    model.scale.setScalar(1 / size.y)
    model.position.multiplyScalar(1 / size.y)
    // no environment map in this scene: tone the metal down so the rig reads under one sun
    model.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      const mat = (mesh.material as MeshStandardMaterial).clone()
      mat.metalness = 0.15
      mat.roughness = 0.65
      mat.emissive = AMBER
      mat.emissiveIntensity = 0.05
      mesh.material = mat
    })
    const wrap = new Group()
    wrap.add(model)
    return wrap
  }, [scene])
}

/**
 * Pump-jack rigs on the Mars surface: one per engineering mission's landing site (selectable, like a beacon) plus a
 * few unlabelled rigs around them. Rendered inside Mars's spinning frame, so they turn with the planet.
 */
export function SurfaceSites({ wide }: { wide: boolean }) {
  const proto = usePumpJack()
  const landed = MISSIONS.filter((m) => m.landing)
  return (
    <group>
      {landed.map((m) => (
        <Rig key={m.id} proto={proto} lat={m.landing!.lat} lon={m.landing!.lon} mission={m} labelled={wide} />
      ))}
      {FIELD_RIGS.map(([lat, lon]) => (
        <Rig key={`${lat},${lon}`} proto={proto} lat={lat} lon={lon} scale={0.75} />
      ))}
    </group>
  )
}

function Rig({ proto, lat, lon, mission, labelled = false, scale = 1 }: { proto: Object3D; lat: number; lon: number; mission?: Mission; labelled?: boolean; scale?: number }) {
  const group = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const lamp = useRef<Mesh>(null)
  const label = useRef<HTMLSpanElement>(null)
  const { position, quaternion, rig } = useMemo(() => {
    const n = latLonToVector(lat, lon)
    return {
      position: n.clone().multiplyScalar(1.0),
      quaternion: new Quaternion().setFromUnitVectors(UP, n),
      rig: proto.clone(true),
    }
  }, [lat, lon, proto])
  const world = useMemo(() => new Vector3(), [])
  const normal = useMemo(() => new Vector3(), [])
  const toCam = useMemo(() => new Vector3(), [])

  useFrame((state) => {
    const k = live.landingIn
    if (group.current) group.current.visible = k > 0.01
    if (inner.current) inner.current.scale.setScalar(1 - (1 - SURFACE_RIG_SCALE) * live.surfaceIn)
    const { hoverMission, activeMission } = useHud.getState()
    const hot = !!mission && (hoverMission === mission.id || activeMission === mission.id)
    const t = state.clock.elapsedTime
    if (ring.current) {
      const p = (t * 0.6 + lat * 0.01) % 1
      ring.current.scale.setScalar(0.4 + p * (hot ? 1.6 : 1.1))
      ;(ring.current.material as MeshBasicMaterial).opacity = (1 - p) * 0.6 * k * (1 - 0.6 * live.surfaceIn)
    }
    if (lamp.current) {
      ;(lamp.current.material as MeshBasicMaterial).opacity = k * (0.55 + 0.45 * Math.round((Math.sin(t * 3 + lon) + 1) / 2))
      // the beacon lamp is sized to read from orbit; up close it shrinks to a warning light
      lamp.current.scale.setScalar(1 - 0.75 * live.surfaceIn)
    }
    if (mission && group.current && inner.current) {
      // the camera flies to the top of the rig
      inner.current.localToWorld(world.set(0, RIG_HEIGHT * scale, 0))
      ;(live.beacons[mission.id] ??= new Vector3()).copy(world)
      if (label.current) {
        // dim the label when the site has rotated to the far side
        group.current.getWorldPosition(toCam)
        normal.copy(toCam).sub(group.current.parent!.getWorldPosition(new Vector3())).normalize()
        toCam.subVectors(state.camera.position, toCam).normalize()
        const facing = normal.dot(toCam)
        label.current.style.opacity = String(k * (1 - live.surfaceIn) * (facing < 0.05 ? 0 : hot ? 1 : 0.8))
        label.current.classList.toggle('hot', hot)
      }
    }
  })

  const events = mission
    ? {
        onPointerOver: (e: { stopPropagation: () => void }) => {
          if (useHud.getState().surface != null) return
          e.stopPropagation()
          useHud.getState().setHover(mission.id)
          document.body.style.cursor = 'pointer'
        },
        onPointerOut: () => {
          useHud.getState().setHover(null)
          document.body.style.cursor = ''
        },
        onClick: (e: { stopPropagation: () => void }) => {
          if (useHud.getState().surface != null) return
          e.stopPropagation()
          useHud.getState().setActive(mission.id)
        },
      }
    : {}

  return (
    <group ref={group} position={position} quaternion={quaternion} {...events}>
      <group ref={inner}>
      <primitive object={rig} scale={RIG_HEIGHT * scale} />
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.03, 0.036, 40]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={lamp} position={[0, RIG_HEIGHT * scale * 1.05, 0]}>
        <sphereGeometry args={[0.006 * scale, 10, 8]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0} toneMapped={false} />
      </mesh>
      </group>
      {mission && labelled && (
        <Html center position={[0, RIG_HEIGHT * scale * 1.6, 0]} zIndexRange={[6, 0]} pointerEvents="none" portal={LABELS}>
          <span ref={label} className="beacon-label offline-archive surface" style={{ opacity: 0 }}>
            {mission.code} · {mission.landing!.site}
          </span>
        </Html>
      )}
    </group>
  )
}

useGLTF.preload('/models/hud/pump-jack.glb')
