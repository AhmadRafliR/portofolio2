import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { AdditiveBlending, Color, FrontSide, SRGBColorSpace, ShaderMaterial, Vector2, type Mesh, type MeshStandardMaterial } from 'three'
import { live, useHud } from '../state/store'
import { MARS_TILT, useLayout } from './layout'

const ATMO_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`
const ATMO_FRAG = /* glsl */ `
uniform vec3 uInner;
uniform vec3 uOuter;
uniform float uOpacity;
varying vec3 vN;
varying vec3 vV;
void main() {
  float rim = pow(1.0 - max(dot(vN, vV), 0.0), 2.6);
  vec3 c = mix(uInner, uOuter, smoothstep(0.35, 1.0, rim));
  gl_FragColor = vec4(c, rim * uOpacity);
}`

/** Mars: NASA colour mosaic + normal map (from the SPHEREx project), axial tilt, slow spin, rim-glow atmosphere. */
export function Mars() {
  const layout = useLayout()
  const tier = useHud((s) => s.tier)
  const [map, normal] = useTexture([
    '/textures/mars.jpg',
    tier === 'high' && layout.wide ? '/textures/mars_normal_2k.png' : '/textures/mars_normal_1k.png',
  ])
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 8

  const body = useRef<Mesh>(null)
  const atmo = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: FrontSide,
        uniforms: {
          uInner: { value: new Color('#ff9a6b') },
          uOuter: { value: new Color('#4fe3d6') },
          uOpacity: { value: 0 },
        },
      }),
    [],
  )

  useFrame(() => {
    const k = live.landingIn
    if (body.current) {
      body.current.rotation.y = live.marsSpin
      const mat = body.current.material as MeshStandardMaterial
      mat.opacity = k
      mat.transparent = k < 1
      body.current.visible = k > 0.001
    }
    atmo.uniforms.uOpacity.value = 0.9 * k
  })

  return (
    <group position={layout.marsPos} scale={layout.marsR}>
      <group rotation={[0, 0, MARS_TILT]}>
        <mesh ref={body} renderOrder={1}>
          <sphereGeometry args={[1, tier === 'low' ? 64 : 128, tier === 'low' ? 32 : 96]} />
          <meshStandardMaterial map={map} normalMap={normal} normalScale={new Vector2(0.9, 0.9)} roughness={1} metalness={0} transparent opacity={0} />
        </mesh>
      </group>
      <mesh scale={1.045} material={atmo} renderOrder={2}>
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
    </group>
  )
}
