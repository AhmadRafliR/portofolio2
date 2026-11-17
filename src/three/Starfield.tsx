import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, SRGBColorSpace, type Group, type MeshBasicMaterial, type PointsMaterial } from 'three'
import { live } from '../state/store'

/** NASA star map sky sphere plus a sparse layer of brighter stars for depth; both fade in at the handoff. */
export function Starfield() {
  const sky = useTexture('/textures/starmap_2k.jpg')
  sky.colorSpace = SRGBColorSpace
  const skyMat = useRef<MeshBasicMaterial>(null)
  const ptsMat = useRef<PointsMaterial>(null)

  const points = useMemo(() => {
    const n = 900
    const pos = new Float32Array(n * 3)
    let s = 7
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1
      const th = rnd() * Math.PI * 2
      const r = 30 + rnd() * 20
      const q = Math.sqrt(1 - u * u)
      pos.set([Math.cos(th) * q * r, u * r, Math.sin(th) * q * r], i * 3)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    return g
  }, [])

  const group = useRef<Group>(null)
  useFrame((_, dt) => {
    const k = live.landingIn
    if (skyMat.current) skyMat.current.opacity = 0.55 * k
    if (ptsMat.current) ptsMat.current.opacity = 0.8 * k
    if (group.current) group.current.rotation.y += dt * 0.004
  })

  return (
    <group ref={group}>
      <mesh renderOrder={-10}>
        <sphereGeometry args={[80, 48, 32]} />
        <meshBasicMaterial ref={skyMat} map={sky} side={BackSide} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <points geometry={points}>
        <pointsMaterial ref={ptsMat} size={0.09} color="#dfe9ff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </points>
    </group>
  )
}
