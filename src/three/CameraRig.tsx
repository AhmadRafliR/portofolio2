import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { live, useHud } from '../state/store'
import { REDUCED_MOTION } from '../lib/device'
import { Vector3 } from 'three'
import { CAMERA_FOV, CAMERA_Z, useLayout } from './layout'
import { MISSION_BY_ID } from '../data/missions'
import { latLonToVector } from './SurfaceSites'

/**
 * Parallax rig: the camera drifts with the mouse (desktop) or the phone's tilt (gyro), and backs off a little as
 * the page scrolls past the hero. Also spins Mars and keeps the FPS readout and quality tier honest.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const setDpr = useThree((s) => s.setDpr)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / innerWidth) * 2 - 1
      const y = -((e.clientY / innerHeight) * 2 - 1)
      live.ndc.x = x
      live.ndc.y = y
      if (!useHud.getState().gyroEnabled) live.parallaxTarget = { x, y }
    }
    const onLeave = () => {
      live.ndc.x = 9
      live.ndc.y = 9
    }
    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const perf = useRef({ frames: 0, time: 0, slow: 0 }).current
  const layout = useLayout()
  const size = useThree((s) => s.size)
  const siteVec = useRef(new Vector3()).current
  const fly = useRef({
    restPos: new Vector3(),
    restLook: new Vector3(),
    target: new Vector3(),
    mars: new Vector3(),
    dir: new Vector3(),
    lift: new Vector3(),
    flyPos: new Vector3(),
    flyLook: new Vector3(),
    fwd: new Vector3(),
    right: new Vector3(),
    up: new Vector3(),
    camUp: new Vector3(),
    look: new Vector3(),
  })
  useFrame((_, dt) => {
    // Mars spin (shared with the intro's particle sphere)
    // a landed mission's brief turns its site toward the camera; otherwise Mars spins slowly
    const activeId = useHud.getState().activeMission
    const site = activeId ? MISSION_BY_ID[activeId].landing : undefined
    if (site) {
      const n = latLonToVector(site.lat, site.lon, siteVec)
      const want = Math.atan2(-n.x, n.z)
      let d = (want - live.marsSpin) % (Math.PI * 2)
      if (d > Math.PI) d -= Math.PI * 2
      if (d < -Math.PI) d += Math.PI * 2
      live.marsSpin += d * (1 - Math.exp(-dt * 2.2))
    } else if (!REDUCED_MOTION) live.marsSpin += dt * 0.07

    // parallax easing
    const k = 1 - Math.exp(-dt * (useHud.getState().gyroEnabled ? 8 : 4))
    const p = live.parallax
    const tgt = REDUCED_MOTION ? { x: 0, y: 0 } : live.parallaxTarget
    p.x += (tgt.x - p.x) * k
    p.y += (tgt.y - p.y) * k
    const scroll = Math.min(1, scrollY / Math.max(1, innerHeight))
    const v = fly.current
    v.restPos.set(p.x * 0.45, p.y * 0.3 - scroll * 0.6, CAMERA_Z + scroll * 2.2)
    v.restLook.set(0, -scroll * 0.25, 0)

    // fly-to: with a mission brief open the camera eases out to that mission's beacon, framing it beside the
    // drawer (desktop: drawer on the right, so the beacon sits left of centre; phone: bottom sheet, beacon up top)
    const active = useHud.getState().activeMission
    const beacon = active ? live.beacons[active] : undefined
    if (beacon) v.target.copy(beacon)
    live.focus += ((beacon ? 1 : 0) - live.focus) * (1 - Math.exp(-dt * 2.6))
    const f = live.focus * live.focus * (3 - 2 * live.focus)
    if (f > 0.001) {
      const landed = Boolean(site)
      const dist = landed ? 0.32 + layout.marsR * 0.3 : 0.9 + layout.marsR * 0.55
      v.dir.subVectors(v.target, v.mars.set(...layout.marsPos)).normalize()
      if (landed) {
        // surface rig: come in low from the south so the pump jack stands in profile against the horizon
        v.lift.set(0, -1, 0).addScaledVector(v.dir, v.dir.y).normalize()
        v.flyPos.copy(v.target).addScaledVector(v.dir, dist * 0.45).addScaledVector(v.lift, dist * 0.9)
      } else {
        v.flyPos.copy(v.target).addScaledVector(v.dir, dist).add(v.lift.set(0, dist * 0.22, 0))
      }
      v.fwd.subVectors(v.target, v.flyPos).normalize()
      v.right.crossVectors(v.fwd, v.up.set(0, 1, 0)).normalize()
      v.camUp.crossVectors(v.right, v.fwd)
      const halfH = dist * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180)
      const halfW = halfH * (size.width / size.height)
      v.flyLook.copy(v.target)
      if (layout.wide) v.flyLook.addScaledVector(v.right, halfW * 0.34)
      else v.flyLook.addScaledVector(v.camUp, -halfH * 0.56)
      camera.position.lerpVectors(v.restPos, v.flyPos, f)
      v.look.lerpVectors(v.restLook, v.flyLook, f)
      camera.lookAt(v.look)
    } else {
      camera.position.copy(v.restPos)
      camera.lookAt(v.restLook)
    }

    // FPS + adaptive quality (only judged once the landing is up)
    perf.frames++
    perf.time += dt
    if (perf.time >= 1) {
      const fps = Math.round(perf.frames / perf.time)
      const s = useHud.getState()
      s.setFps(fps)
      // background tabs are throttled; only judge frames the visitor can actually see
      if (s.phase === 'landing' && fps < 38 && document.visibilityState === 'visible' && document.hasFocus()) {
        perf.slow++
        if (perf.slow >= 3 && s.tier !== 'low') {
          const next = s.tier === 'high' ? 'mid' : 'low'
          s.setTier(next)
          setDpr(next === 'mid' ? 1.25 : 1)
          perf.slow = 0
        }
      } else perf.slow = 0
      perf.frames = 0
      perf.time = 0
    }
  })
  return null
}
