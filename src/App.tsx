import { Suspense, lazy, useEffect } from 'react'
import { useHud } from './state/store'
import { Scene } from './three/Scene'
import { IntroOverlay } from './intro/IntroOverlay'
import { HudFrame, TelemetryBar } from './hud/Telemetry'
import { PilotCard } from './hud/PilotCard'
import { MissionPanel, MissionsSection } from './hud/Missions'
import { Credits, StatusDock, Toast } from './hud/Chrome'
import { MissionDetail } from './hud/MissionDetail'
import { Arsenal, Comms, CrewRecord, MissionLog, ProfileSection, TerminalSection } from './hud/Sections'
import { TerminalOverlay } from './hud/Terminal'
import { SurfaceHud } from './hud/SurfaceHud'
import { useGyroParallax } from './lib/useGyro'
import { useReturnGesture } from './lib/useReturnGesture'

const ArView = lazy(() => import('./ar/ArView'))

export function App() {
  const phase = useHud((s) => s.phase)
  const brief = useHud((s) => s.activeMission)
  const ar = useHud((s) => s.arOpen)
  const surface = useHud((s) => s.surface)
  useGyroParallax()
  useReturnGesture()

  useEffect(() => {
    document.documentElement.dataset.phase = phase
  }, [phase])

  useEffect(() => {
    document.documentElement.dataset.brief = brief ? 'open' : ''
  }, [brief])

  const walking = useHud((s) => s.walking)
  useEffect(() => {
    document.documentElement.dataset.surface = surface != null ? 'on' : ''
  }, [surface])
  useEffect(() => {
    document.documentElement.dataset.walk = walking ? 'on' : ''
  }, [walking])

  return (
    <>
      <Scene paused={ar} />
      {ar && (
        <Suspense fallback={<div className="ar ar-loading">Opening AR…</div>}>
          <ArView />
        </Suspense>
      )}
      {phase === 'intro' && <IntroOverlay />}
      <div className="scrim" aria-hidden />
      <div className="dive" aria-hidden />
      <div className="page" id="top">
        <a className="skip-link" href="#missions">
          Skip to missions
        </a>
        <div id="walk-labels" className="walk-labels" aria-label="Missions on the surface" />
        <HudFrame />
        <TelemetryBar />
        <main>
          <div className="hero">
            <PilotCard />
            <MissionPanel />
          </div>
          <MissionsSection />
          <ProfileSection />
          <MissionLog />
          <CrewRecord />
          <Arsenal />
          <TerminalSection />
          <Comms />
          <Credits />
        </main>
        <StatusDock />
        <SurfaceHud />
        <MissionDetail />
        <TerminalOverlay />
        <Toast />
      </div>
    </>
  )
}
