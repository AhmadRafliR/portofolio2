import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/share-tech-mono/400.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import './styles.css'
import { App } from './App'
import { live, useHud } from './state/store'
import { IS_TOUCH, REDUCED_MOTION } from './lib/device'
import { shouldPlayIntro } from './intro/timeline'

// Pick a starting quality tier from the device; CameraRig steps it down further if frames drop.
const cores = navigator.hardwareConcurrency ?? 4
useHud.getState().setTier(cores <= 4 ? 'low' : IS_TOUCH ? 'mid' : 'high')

// Returning visitors (same session) and reduced-motion users go straight to the landing.
if (!shouldPlayIntro(REDUCED_MOTION)) {
  live.landingIn = 1
  document.documentElement.style.setProperty('--landing', '1')
  useHud.getState().setPhase('landing')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
