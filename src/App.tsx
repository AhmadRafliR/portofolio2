import { useEffect } from 'react'
import { useHud } from './state/store'
import { ProbeLayer, Scene } from './three/Scene'
import { IntroOverlay } from './intro/IntroOverlay'
import { HudFrame, TelemetryBar } from './hud/Telemetry'
import { PilotCard } from './hud/PilotCard'
import { MissionPanel, MissionsSection } from './hud/Missions'
import { Credits, StatusDock, Toast } from './hud/Chrome'
import { useGyroParallax } from './lib/useGyro'

export function App() {
  const phase = useHud((s) => s.phase)
  useGyroParallax()

  useEffect(() => {
    document.documentElement.dataset.phase = phase
  }, [phase])

  return (
    <>
      <Scene />
      {phase === 'intro' && <IntroOverlay />}
      <div className="page" id="top">
        <a className="skip-link" href="#missions">
          Skip to missions
        </a>
        <HudFrame />
        <TelemetryBar />
        <main>
          <div className="hero">
            <PilotCard />
            {phase === 'landing' && <MissionPanel />}
          </div>
          <MissionsSection />
          <Credits />
        </main>
        {phase === 'landing' && <StatusDock />}
        <Toast />
      </div>
      {/* no probe is on screen during the intro, and the extra layer was seen to hide the particles there */}
      {phase === 'landing' && <ProbeLayer />}
    </>
  )
}
