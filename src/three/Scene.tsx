import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { NoToneMapping } from 'three'
import { useHud } from '../state/store'
import { IS_TOUCH } from '../lib/device'
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
      // phones have 3× screens; 1.5 keeps the strands crisp without tripling the fill cost
      dpr={IS_TOUCH ? [1, 1.5] : [1, 1.75]}
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
