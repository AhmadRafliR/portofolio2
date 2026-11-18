import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { AdditiveBlending, Color, FrontSide, SRGBColorSpace, ShaderMaterial, Vector2, Vector3, type Group, type Mesh, type MeshStandardMaterial, type WebGLProgramParametersWithUniforms } from 'three'
import { live, useHud } from '../state/store'
import { SURFACE_SITES } from '../data/missions'
import { MARS_TILT, useLayout } from './layout'
import { SurfaceSites, latLonToVector } from './SurfaceSites'

/** Ground-level detail for surface mode: the 1440 px mosaic is ~15 km a texel, so close up it gets fbm grain. */
const DETAIL_GLSL = /* glsl */ `
uniform float uDetail;
varying vec3 vObj;
float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s / 0.97; }
`

const OUTER = new Color('#4fe3d6')
const DUST = new Color('#d89a62')

/** "Click to land": a click on the globe lands at the surface site nearest to the point clicked. */
const HUD_SELECTOR = 'a, button, input, .panel, .detail, .dock, .telemetry, .term-overlay'
function nearestSite(local: Vector3): number {
  let best = 0
  let bestDot = -2
  const v = new Vector3()
  SURFACE_SITES.forEach((s, i) => {
    const d = latLonToVector(s.lat, s.lon, v).dot(local)
    if (d > bestDot) {
      bestDot = d
      best = i
    }
  })
  return best
}
const canLand = () => {
  const s = useHud.getState()
  return s.phase === 'landing' && !s.activeMission && s.surface == null && !s.arOpen && scrollY < innerHeight * 0.4
}

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
  const spin = useRef<Group>(null)
  const detail = useMemo(() => ({ value: 0 }), [])
  const addDetail = useMemo(
    () => (shader: WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uDetail = detail
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${DETAIL_GLSL}`)
        .replace(
          '#include <map_fragment>',
          '#include <map_fragment>\nif (uDetail > 0.001) { float g = fbm(vObj * 70.0); diffuseColor.rgb *= mix(1.0, 0.62 + 0.76 * g, uDetail); }',
        )
    },
    [detail],
  )
  const hover = useRef(false)
  const events = {
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      const over = canLand() && !(e.nativeEvent.target as HTMLElement | null)?.closest?.(HUD_SELECTOR)
      if (over !== hover.current) {
        hover.current = over
        document.body.style.cursor = over ? 'pointer' : ''
      }
    },
    onPointerOut: () => {
      if (hover.current) document.body.style.cursor = ''
      hover.current = false
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (!canLand() || (e.nativeEvent.target as HTMLElement | null)?.closest?.(HUD_SELECTOR) || !spin.current) return
      e.stopPropagation()
      document.body.style.cursor = ''
      hover.current = false
      useHud.getState().land(nearestSite(spin.current.worldToLocal(e.point.clone()).normalize()))
    },
  }
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
          uOuter: { value: OUTER.clone() },
          uOpacity: { value: 0 },
        },
      }),
    [],
  )

  useFrame(() => {
    const k = live.landingIn
    if (spin.current) spin.current.rotation.y = live.marsSpin
    if (body.current) {
      const mat = body.current.material as MeshStandardMaterial
      mat.opacity = k
      mat.transparent = k < 1
      body.current.visible = k > 0.001
    }
    // from the ground the teal orbital rim turns into a low, dusty butterscotch haze
    const g = live.surfaceIn
    atmo.uniforms.uOpacity.value = 0.9 * k * (1 - 0.8 * g)
    atmo.uniforms.uOuter.value.copy(OUTER).lerp(DUST, g)
    detail.value = live.surfaceIn
  })

  return (
    <group position={layout.marsPos} scale={layout.marsR}>
      <group rotation={[0, 0, MARS_TILT]}>
        <group ref={spin}>
          <mesh ref={body} renderOrder={1} {...events}>
            <sphereGeometry args={[1, tier === 'low' ? 64 : tier === 'mid' ? 96 : 128, tier === 'low' ? 32 : tier === 'mid' ? 64 : 96]} />
            <meshStandardMaterial map={map} normalMap={normal} normalScale={new Vector2(0.9, 0.9)} roughness={1} metalness={0} transparent opacity={0} onBeforeCompile={addDetail} />
          </mesh>
          <SurfaceSites wide={layout.wide} />
        </group>
      </group>
      <mesh scale={1.045} material={atmo} renderOrder={2}>
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
    </group>
  )
}
