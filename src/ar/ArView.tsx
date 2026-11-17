import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, useTexture } from '@react-three/drei'
import { Euler, MathUtils, NoToneMapping, Quaternion, SRGBColorSpace, Vector2, Vector3, type Group } from 'three'
import { useHud } from '../state/store'
import { IS_TOUCH, arMotion } from '../lib/device'
import { IS_IOS, QUICK_LOOK, supportsQuickLook } from './arSupport'
import { CameraFeed } from './CameraFeed'
import { ProbeView } from '../three/ProbeView'
import { MARS_TILT } from '../three/layout'

/** Mars sits this far in front of where the phone pointed when AR opened (metres, roughly). */
const DISTANCE = 1.6
const RADIUS = 0.34
/** scale between real Mars (3389.5 km) and the floating one */
const SCALE_LABEL = `1 : ${Math.round(3389.5e3 / RADIUS / 1e6)} million`

/** Shared gyro reading, written by the orientation listener and read every frame. */
const gyro = { reading: null as { a: number; b: number; g: number } | null, alpha0: null as number | null }

/**
 * Camera AR (implementasi.md §6.3): rear camera behind a transparent canvas, the view steered by the phone's motion
 * sensors (ported from the SPHEREx project's GyroControls), Mars floating in the room. Rotation is tracked, not
 * position: Mars stays in the direction the phone faced when AR opened. Drag spins Mars, pinch resizes it.
 * Without motion sensors (laptops) dragging orbits the view instead.
 */
export default function ArView() {
  const close = () => useHud.getState().setArOpen(false)
  const showToast = useHud((s) => s.showToast)
  const [camera, setCamera] = useState<'on' | 'off' | 'error'>('on')
  const [motion, setMotion] = useState<'pending' | 'on' | 'off'>(IS_TOUCH ? 'pending' : 'off')
  const quickLook = IS_IOS && supportsQuickLook()

  useEffect(() => {
    gyro.reading = null
    gyro.alpha0 = null
    if (!IS_TOUCH) return
    let got = false
    // permission was asked from the AR button tap (the user gesture iOS requires)
    if (!arMotion.granted) {
      setMotion('off')
      showToast('Motion access was declined, so drag to look around.')
      return
    }
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha == null) return
      got = true
      gyro.reading = { a: e.alpha, b: e.beta ?? 0, g: e.gamma ?? 0 }
      if (gyro.alpha0 == null) gyro.alpha0 = e.alpha
      setMotion((m) => (m === 'on' ? m : 'on'))
    }
    window.addEventListener('deviceorientation', onOrient)
    const t = setTimeout(() => {
      if (!got) {
        setMotion('off')
        showToast('No motion-sensor data, so drag to look around.')
      }
    }, 2500)
    return () => {
      window.removeEventListener('deviceorientation', onOrient)
      clearTimeout(t)
    }
  }, [showToast])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    document.documentElement.dataset.ar = 'open'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.dataset.ar = ''
    }
  }, [])

  return (
    <div className="ar" role="dialog" aria-modal="true" aria-label="AR view: Mars in your room">
      {camera === 'on' && (
        <CameraFeed
          onError={(msg) => {
            setCamera('error')
            showToast(msg)
          }}
        />
      )}
      <Canvas
        className="ar-canvas"
        camera={{ position: [0, 0, 0], fov: 60, near: 0.05, far: 100 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, toneMapping: NoToneMapping }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[-3, 2, 2]} intensity={2.8} />
        {camera !== 'on' && <Stars radius={40} depth={20} count={2500} factor={3} fade speed={0.4} />}
        {motion === 'on' ? <GyroCamera /> : <DragCamera />}
        <Suspense fallback={null}>
          <FloatingMars />
        </Suspense>
      </Canvas>

      <div className="ar-hud">
        <header className="ar-top">
          <span className="eyebrow">// AR view · Mars</span>
          <button type="button" className="btn ghost" onClick={close}>
            Exit ✕
          </button>
        </header>
        <div className="ar-reticle" aria-hidden />
        <div className="ar-companion">
          <ProbeView model="perseverance" className="probe-sm" />
          <span>
            MARS · {SCALE_LABEL}
            <br />
            {motion === 'on' ? 'Move your phone to look around' : 'Drag to look around · pinch or scroll to zoom'}
          </span>
        </div>
        <footer className="ar-bottom">
          {motion === 'on' && (
            <button type="button" className="btn" onClick={() => (gyro.alpha0 = gyro.reading?.a ?? null)}>
              Recenter
            </button>
          )}
          <button type="button" className="btn" onClick={() => setCamera(camera === 'on' ? 'off' : 'on')}>
            {camera === 'on' ? 'Camera off' : 'Camera on'}
          </button>
          {quickLook &&
            QUICK_LOOK.map((q) => (
              <a key={q.id} className="btn primary ql" rel="ar" href={q.href}>
                <img src={q.thumb} alt="" width={1} height={1} />
                {q.label}
              </a>
            ))}
        </footer>
      </div>
    </div>
  )
}

/** Phone "magic window": the camera follows device orientation; the first heading becomes forward. */
function GyroCamera() {
  const camera = useThree((s) => s.camera)
  const tmp = useMemo(
    () => ({
      euler: new Euler(),
      q0: new Quaternion(),
      q1: new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), // camera looks out of the back of the device
      zee: new Vector3(0, 0, 1),
    }),
    [],
  )
  useFrame(() => {
    const r = gyro.reading
    if (!r) return
    const orient = MathUtils.degToRad((screen.orientation?.angle ?? 0) as number)
    tmp.euler.set(MathUtils.degToRad(r.b), MathUtils.degToRad(r.a - (gyro.alpha0 ?? 0)), -MathUtils.degToRad(r.g), 'YXZ')
    camera.quaternion.setFromEuler(tmp.euler)
    camera.quaternion.multiply(tmp.q1)
    camera.quaternion.multiply(tmp.q0.setFromAxisAngle(tmp.zee, -orient))
  })
  return null
}

/** No motion sensors: drag to turn the view (yaw/pitch around the viewer). */
function DragCamera() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const look = useRef({ yaw: 0, pitch: 0, tYaw: 0, tPitch: 0 })
  useEffect(() => {
    const el = gl.domElement
    let last: { x: number; y: number } | null = null
    const down = (e: PointerEvent) => {
      if (e.isPrimary) last = { x: e.clientX, y: e.clientY }
    }
    const move = (e: PointerEvent) => {
      if (!last || !e.isPrimary) return
      look.current.tYaw += (e.clientX - last.x) * 0.004
      look.current.tPitch = MathUtils.clamp(look.current.tPitch + (e.clientY - last.y) * 0.004, -1.2, 1.2)
      last = { x: e.clientX, y: e.clientY }
    }
    const up = () => (last = null)
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [gl])
  useFrame((_, dt) => {
    const l = look.current
    const k = 1 - Math.exp(-dt * 8)
    l.yaw += (l.tYaw - l.yaw) * k
    l.pitch += (l.tPitch - l.pitch) * k
    camera.rotation.set(l.pitch, l.yaw, 0, 'YXZ')
  })
  return null
}

/** Mars in front of the viewer: slow spin, drag-free pinch / wheel zoom. */
function FloatingMars() {
  const [map, normal] = useTexture(['/textures/mars.jpg', '/textures/mars_normal_1k.png'])
  map.colorSpace = SRGBColorSpace
  const spin = useRef<Group>(null)
  const zoom = useRef({ s: 1, t: 1 })
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const el = gl.domElement
    const pts = new Map<number, { x: number; y: number }>()
    let d0 = 0
    let s0 = 1
    const dist = () => {
      const [a, b] = [...pts.values()]
      return Math.hypot(a.x - b.x, a.y - b.y)
    }
    const down = (e: PointerEvent) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.size === 2) {
        d0 = dist()
        s0 = zoom.current.t
      }
    }
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.size === 2 && d0 > 0) zoom.current.t = MathUtils.clamp((s0 * dist()) / d0, 0.4, 3)
    }
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId)
      d0 = 0
    }
    const wheel = (e: WheelEvent) => {
      zoom.current.t = MathUtils.clamp(zoom.current.t * Math.exp(-e.deltaY * 0.001), 0.4, 3)
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    el.addEventListener('wheel', wheel, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl])

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.15
    const z = zoom.current
    z.s += (z.t - z.s) * (1 - Math.exp(-dt * 8))
  })
  const outer = useRef<Group>(null)
  useFrame(() => outer.current?.scale.setScalar(RADIUS * zoom.current.s))

  return (
    <group ref={outer} position={[0, 0, -DISTANCE]}>
      <group rotation={[0, 0, MARS_TILT]}>
        <group ref={spin}>
          <mesh>
            <sphereGeometry args={[1, 96, 64]} />
            <meshStandardMaterial map={map} normalMap={normal} normalScale={new Vector2(0.9, 0.9)} roughness={1} metalness={0} />
          </mesh>
        </group>
      </group>
      <mesh scale={1.04}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshBasicMaterial color="#ff9a6b" transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  )
}
