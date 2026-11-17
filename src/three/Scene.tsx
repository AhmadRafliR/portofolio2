import { Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { View } from '@react-three/drei'
import { NoToneMapping } from 'three'
import { useHud } from '../state/store'
import { ParticlePortrait } from '../intro/ParticlePortrait'
import { CameraRig } from './CameraRig'
import { Mars } from './Mars'
import { Orbits } from './Orbits'
import { Starfield } from './Starfield'
import { CAMERA_FOV, CAMERA_Z, SUN_DIR } from './layout'

/** Background canvas: intro particles and the Mars system, behind the HUD. */
export function Scene() {
  const phase = useHud((s) => s.phase)
  return (
    <Canvas
      className="scene"
      eventSource={document.getElementById('root')!}
      eventPrefix="client"
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV, near: 0.1, far: 200 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: NoToneMapping }}
    >
      <color attach="background" args={['#040408']} />
      <ambientLight intensity={0.06} />
      <directionalLight position={SUN_DIR} intensity={2.6} />
      <CameraRig />
      <Suspense fallback={null}>
        <Starfield />
        <Mars />
        <Orbits />
      </Suspense>
      {phase === 'intro' && <ParticlePortrait />}
    </Canvas>
  )
}

/**
 * drei <View> boxes draw through positive-priority frame callbacks with autoClear off, so this transparent overlay
 * clears itself once per frame (restoring the full viewport the views leave shrunk) before they draw.
 */
function ClearPass() {
  useFrame((state) => {
    state.gl.setScissorTest(false)
    state.gl.setViewport(0, 0, state.size.width, state.size.height)
    state.gl.clear(true, true, true)
  }, 0.5)
  return null
}

/**
 * Foreground canvas for the NASA probe viewports. It sits above the glass HUD panels (whose backdrop blur would
 * otherwise smear models drawn behind them) and ignores the pointer, so the page underneath stays clickable.
 */
export function ProbeLayer() {
  return (
    <Canvas
      className="probe-layer"
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, toneMapping: NoToneMapping }}
      style={{ pointerEvents: 'none' }}
    >
      <ClearPass />
      <View.Port />
    </Canvas>
  )
}
