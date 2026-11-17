import { useEffect } from 'react'
import { useHud } from './state/store'
import { Scene } from './three/Scene'
import { IntroOverlay } from './intro/IntroOverlay'
import { HudFrame, TelemetryBar } from './hud/Telemetry'
import { PilotCard } from './hud/PilotCard'
import { MissionPanel, MissionsSection } from './hud/Missions'
import { Credits, StatusDock, Toast } from './hud/Chrome'
import { MissionDetail } from './hud/MissionDetail'
import { useGyroParallax } from './lib/useGyro'
import { useReturnGesture } from './lib/useReturnGesture'

export function App() {
  const phase = useHud((s) => s.phase)
  const brief = useHud((s) => s.activeMission)
  useGyroParallax()
  useReturnGesture()

  useEffect(() => {
    document.documentElement.dataset.phase = phase
  }, [phase])

  useEffect(() => {
    document.documentElement.dataset.brief = brief ? 'open' : ''
  }, [brief])

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
            <MissionPanel />
          </div>
          <MissionsSection />
          <Credits />
        </main>
        <StatusDock />
        <MissionDetail />
        <Toast />
      </div>
    </>
  )
}
