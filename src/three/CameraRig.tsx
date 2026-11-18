import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { live, useHud } from '../state/store'
import { REDUCED_MOTION } from '../lib/device'
import { PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { CAMERA_FOV, CAMERA_Z, MARS_TILT, SUN_DIR, useLayout } from './layout'
import { MISSION_BY_ID, SURFACE_SITES } from '../data/missions'
import { RIG_HEIGHT, SURFACE_RIG_SCALE, latLonToVector } from './SurfaceSites'

const Y = new Vector3(0, 1, 0)
const Z = new Vector3(0, 0, 1)
const QTILT = new Quaternion().setFromAxisAngle(Z, MARS_TILT)
const SUN = new Vector3(...SUN_DIR).normalize()
const smooth = (x: number) => x * x * (3 - 2 * x)

/**
 * Parallax rig: the camera drifts with the mouse (desktop) or the phone's tilt (gyro), and backs off a little as
 * the page scrolls past the hero. Also spins Mars and keeps the FPS readout and quality tier honest.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const setDpr = useThree((s) => s.setDpr)
  const invalidate = useThree((s) => s.invalidate)

  // Lite mode draws on demand: wake the loop when a camera move starts (it keeps itself awake while easing)
  useEffect(() => useHud.subscribe((s, prev) => (s.surface !== prev.surface || s.activeMission !== prev.activeMission) && invalidate()), [invalidate])

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
  const lastScroll = useRef(-1)
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
    n: new Vector3(),
    sunT: new Vector3(),
    east: new Vector3(),
    camRight: new Vector3(),
    ground: new Vector3(),
    q: new Quaternion(),
    sPos: new Vector3(),
    sLook: new Vector3(),
    sUp: new Vector3(),
    camPos: new Vector3(),
    camLook: new Vector3(),
    /** last surface site, kept while lifting off so the camera rises from where it was */
    lastSite: 0,
    /** seconds on the ground, drives a slow look-around sway */
    yaw: 0,
  })
  useFrame((_, dt) => {
    // Mars spin (shared with the intro's particle sphere)
    // a landed mission's brief turns its site toward the camera; otherwise Mars spins slowly
    const { activeMission: activeId, surface, lite } = useHud.getState()
    if (surface != null && surface !== fly.current.lastSite) {
      fly.current.lastSite = surface
      fly.current.yaw = 0
    }
    const surfaceSite = surface != null ? SURFACE_SITES[surface] : undefined
    const site = surfaceSite ?? (activeId ? MISSION_BY_ID[activeId].landing : undefined)
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
    // past the hero the scene steps back behind a scrim so section text stays readable
    if (Math.abs(scroll - lastScroll.current) > 0.002) {
      lastScroll.current = scroll
      document.documentElement.style.setProperty('--scrolled', scroll.toFixed(3))
    }
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
      v.camPos.lerpVectors(v.restPos, v.flyPos, f)
      v.camLook.lerpVectors(v.restLook, v.flyLook, f)
    } else {
      v.camPos.copy(v.restPos)
      v.camLook.copy(v.restLook)
    }

    // surface mode: descend to the site and stand a few rig-heights away, horizon level, looking at the pump jack.
    // The camera eases toward the site after Mars has turned it to face us, so the path never cuts through the planet.
    live.surfaceIn += ((surfaceSite ? 1 : 0) - live.surfaceIn) * (1 - Math.exp(-dt * 1.4))
    if (!surfaceSite && live.surfaceIn < 1e-3) live.surfaceIn = 0
    const g = smooth(live.surfaceIn)
    // touchdown: hand the camera to the walkable terrain (SurfaceWalk), through a short dust-out
    const walking = useHud.getState().walking
    if (surfaceSite && !walking && live.surfaceIn > 0.985) useHud.getState().setWalking(true)
    if (!walking) {
      const dive = Math.min(1, Math.max(0, (live.surfaceIn - 0.72) / 0.28))
      document.documentElement.style.setProperty('--dive', smooth(dive).toFixed(3))
    }
    if (walking) {
      // SurfaceWalk drives the camera
    } else if (g > 0) {
      const s = SURFACE_SITES[v.lastSite]
      if (!REDUCED_MOTION && !lite && surfaceSite) v.yaw += dt
      const R = layout.marsR
      v.mars.set(...layout.marsPos)
      v.q.setFromAxisAngle(Y, live.marsSpin).premultiply(QTILT)
      latLonToVector(s.lat, s.lon, v.n).applyQuaternion(v.q)
      // stand on the sun's side of the rig (the scene has one key light), a little off-axis so it reads in 3/4 view
      v.sunT.copy(SUN).addScaledVector(v.n, -SUN.dot(v.n))
      if (v.sunT.lengthSq() < 1e-4) v.sunT.copy(Y).applyQuaternion(QTILT).addScaledVector(v.n, -v.n.y)
      v.sunT.normalize()
      v.east.crossVectors(v.n, v.sunT)
      // slow sway plus look-around with the mouse / phone tilt
      const yaw = 0.6 + Math.sin(v.yaw * 0.12) * 0.35 + p.x * 0.75
      v.lift.copy(v.sunT).multiplyScalar(Math.cos(yaw)).addScaledVector(v.east, Math.sin(yaw))
      const rigH = RIG_HEIGHT * SURFACE_RIG_SCALE * R
      v.ground.copy(v.mars).addScaledVector(v.n, R)
      v.sPos.copy(v.ground).addScaledVector(v.n, rigH * (1.05 + p.y * 0.55)).addScaledVector(v.lift, rigH * 3.4)
      v.sLook.copy(v.ground).addScaledVector(v.n, rigH * 0.5)
      v.sUp.subVectors(v.sPos, v.mars).normalize()
      // desktop: the site panel sits bottom-left, so frame the rig right of centre
      if (layout.wide) {
        v.camRight.subVectors(v.sLook, v.sPos).cross(v.sUp).normalize()
        v.sLook.addScaledVector(v.camRight, -rigH * 0.9)
      }
      v.camPos.lerp(v.sPos, g)
      v.camLook.lerp(v.sLook, g)
      camera.up.copy(Y).lerp(v.sUp, g).normalize()
    } else camera.up.copy(Y)
    if (!walking) {
      camera.position.copy(v.camPos)
      camera.lookAt(v.camLook)
      // close to the ground the default near plane would clip the rig
      const near = 0.1 - 0.096 * g
      if (Math.abs(camera.near - near) > 1e-4 || camera.far !== 200) {
        camera.near = near
        camera.far = 200
        camera.updateProjectionMatrix()
      }
    }
    // keep drawing while a camera move eases in or out (Lite mode renders on demand)
    if (lite && (Math.abs((beacon ? 1 : 0) - live.focus) > 1e-3 || (live.surfaceIn > 0 && live.surfaceIn < 0.999))) invalidate()

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
