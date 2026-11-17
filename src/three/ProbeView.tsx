import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, useGLTF, View } from '@react-three/drei'
import { AdditiveBlending, Box3, BufferAttribute, BufferGeometry, Color, Group, Sphere, type Mesh, type MeshStandardMaterial, type Object3D } from 'three'
import type { ProbeModel } from '../data/missions'
import { REDUCED_MOTION } from '../lib/device'

const TEAL = new Color('#4fe3d6')

/**
 * A NASA model in a small HUD viewport. Every viewport shares the page's one WebGL context through drei <View>,
 * and only mounts while its box is on screen, so at most a handful of models render at once.
 */
export function ProbeView({ model, className, hot = false }: { model: ProbeModel; className?: string; hot?: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const visible = useOnScreen(box)
  return (
    <div ref={box} className={`probe ${className ?? ''}`} aria-hidden>
      <span className="probe-corners" />
      {visible && (
        <View className="probe-view">
          <PerspectiveCamera makeDefault position={[0, 0.9, 3.4]} fov={34} onUpdate={(c) => c.lookAt(0, 0, 0)} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 5]} intensity={2.4} />
          <pointLight position={[-3, -1, -3]} intensity={6} color="#4fe3d6" />
          <Suspense fallback={<Acquiring />}>
            <Spinner hot={hot}>
              <Fit>{model === 'sky-hologram' ? <SkyHologram /> : <Probe model={model} />}</Fit>
            </Spinner>
          </Suspense>
        </View>
      )}
    </div>
  )
}

function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return on
}

function Spinner({ children, hot }: { children: React.ReactNode; hot: boolean }) {
  const g = useRef<Group>(null)
  useFrame((_, dt) => {
    if (g.current && !REDUCED_MOTION) g.current.rotation.y += dt * (hot ? 1.4 : 0.45)
  })
  return <group ref={g}>{children}</group>
}

function Probe({ model }: { model: Exclude<ProbeModel, 'sky-hologram'> }) {
  const { scene } = useGLTF(`/models/hud/${model}.glb`)
  const obj = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o: Object3D) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      // the HUD build drops flat normals so meshes could be simplified; rebuild smooth ones
      if (!mesh.geometry.getAttribute('normal')) mesh.geometry.computeVertexNormals()
      const mat = (mesh.material as MeshStandardMaterial).clone()
      if ('emissive' in mat) {
        mat.emissive = TEAL
        mat.emissiveIntensity = 0.06
      }
      mesh.material = mat
    })
    // normalise every probe to the same on-screen size (bounding sphere radius 1)
    const sphere = new Box3().setFromObject(c).getBoundingSphere(new Sphere())
    c.position.sub(sphere.center)
    const wrap = new Group()
    wrap.add(c)
    wrap.scale.setScalar(1 / sphere.radius)
    return wrap
  }, [scene])
  return <primitive object={obj} />
}

function Fit({ children }: { children: React.ReactNode }) {
  // camera at distance 3.2 with a 32° fov frames a unit sphere with a little margin
  return <group scale={0.92}>{children}</group>
}

/** M-05: no spacecraft model; an illustrative all-sky survey sphere banded in spectrum colours. */
function SkyHologram() {
  const geo = useMemo(() => {
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
    return g
  }, [])
  return (
    <group scale={0.85}>
      <points geometry={geo}>
        <pointsMaterial size={0.045} vertexColors transparent opacity={0.9} blending={AdditiveBlending} depthWrite={false} />
      </points>
      <mesh>
        <icosahedronGeometry args={[1.02, 2]} />
        <meshBasicMaterial color="#4fe3d6" wireframe transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

function Acquiring() {
  const m = useRef<Mesh>(null)
  useFrame((_, dt) => {
    if (m.current) m.current.rotation.y += dt * 2
  })
  return (
    <mesh ref={m}>
      <octahedronGeometry args={[0.5, 0]} />
      <meshBasicMaterial color="#00d9ff" wireframe transparent opacity={0.6} />
    </mesh>
  )
}
