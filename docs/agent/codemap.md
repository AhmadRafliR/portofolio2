# Codemap

One line per file: purpose · key exports · notes. `~L` = approximate line count (read cost). Keep in sync:
`npm run docs:check` fails if a file in `src/` or `scripts/` is missing here.

## Root

- `index.html` ~40L — meta/OG/Twitter/canonical/JSON-LD Person, `#labels` layer, `#root`, noscript.
- `vite.config.ts` ~40L — react plugin; dev-only `devAssetSave()` (`POST /__save-asset`); basic-ssl in `--mode phone`.
- `vercel.json` — cache headers + `.usdz` MIME.
- `tsconfig.json` — strict, `noUnusedLocals/Parameters`, `include: ["src"]`.
- `.claude/launch.json` — preview configs `portfolio` (:5173), `portfolio-prod` (:4173).
- `implementasi.md` ~740L (ID) — original plan + phase log 0–6. Historical; decisions referenced as `§x`.

## src/ (entry, state, data)

- `src/main.tsx` ~40L — fonts + CSS import; initial `tier` from cores/touch; WebGL probe → `html.no-webgl`; skip intro → `setPhase('landing')`.
- `src/App.tsx` ~80L — page composition (Scene, ArView lazy, IntroOverlay, scrim, dive, HUD, sections, overlays); mirrors state to `<html data-*>`.
- `src/state/store.ts` ~155L — `useHud` zustand (phase, launch/return, brief, surface/walking, AR, terminal, lite→localStorage, gyro, fps, tier, toast) + `live` per-frame object. Types `Phase`, `Tier`.
- `src/data/missions.ts` ~225L — `Mission` schema, `MissionId`, `ProbeModel`, `Category`, `MISSIONS` (8), `FIELD_RIGS`, `shotsFor`, `canFrame`, `MISSION_BY_ID`, `SURFACE_SITES`, `formatLatLon`, `neighbour`.
- `src/data/profile.ts` ~13L — `PROFILE` (name, callsign, roles, tagline, campus, cv, links).
- `src/data/record.ts` ~125L — `BIO`, `LOG`/`LogKind`, `CREW`, `ALSO_ON_DECK`, `ARSENAL`, `CONTACT`.
- `src/styles.css` ~2010L — all CSS. Banners to grep: `canvas` · `shared panel / buttons` · `HUD chrome` · `hero` · `mission side panel` · `probe viewports` · `beacon + reticle labels` · `bottom dock` · `sections` · `intro overlay` · `responsive` · `intro: launch cue + contact` · `back to pilot` · `mission brief drawer` · `AR view` · `section nav` · `content sections` · `no WebGL` · `surface mode` · `dust-out` · `hotspot labels` · `Flight record in zero-g`. Tokens in `:root` at top.

## src/intro/

- `src/intro/timeline.ts` ~80L — storyboard `T` (part 1) / `L` (part 2), `EYES`, `PORTRAIT_ASPECT`, `introClock`, `span`, `introUniforms`, `shouldPlayIntro` (`?intro`, sessionStorage), `markIntroSeen`.
- `src/intro/ParticlePortrait.tsx` ~270L — `ParticlePortrait`: loads `portrait-field.dat` (`COUNT_BY_TIER` 32k/18k/9k), instanced strands, reveal plane, sphere handoff to Mars, reverse on return; `finishIntro()` sets `--landing/--launch` + phase.
- `src/intro/shaders.ts` ~200L — GLSL: `vertexShader`, `fragmentShader` (strands), `revealVertex`, `revealFragment` (portrait burn-in + eye glow).
- `src/intro/IntroOverlay.tsx` ~100L — DOM intro: text, uplink %, sol, 火星 tag, socials, Skip, launch cue; wheel/touch/keys launch part 2.

## src/three/ (orbit scene)

- `src/three/Scene.tsx` ~55L — the `<Canvas>`: frameloop (never/demand/always), dpr, lights, Starfield/Mars/Orbits, lazy `SurfaceWalk`, `ParticlePortrait` during intro.
- `src/three/layout.ts` ~55L — `CAMERA_Z`, `CAMERA_FOV`, `VIEW_H`, `MARS_TILT`, `SUN_DIR`, `computeLayout()`/`useLayout()` (Mars position/radius, face placement).
- `src/three/CameraRig.tsx` ~230L — every camera move: parallax, scroll back-off, brief fly-to (`live.focus`), surface descent (`live.surfaceIn`, `--dive`, sets `walking`), Mars spin, FPS + adaptive tier/DPR.
- `src/three/Mars.tsx` ~170L — Mars mesh (mosaic + normal 1k/2k, ground detail GLSL), atmosphere shader (teal → dust), click-to-land (`nearestSite`), hosts `SurfaceSites`.
- `src/three/Orbits.tsx` ~180L — two rings with ticks, `Beacon` per orbiting mission (hover/active, labels in `#labels`), reticle; writes `live.beacons`.
- `src/three/SurfaceSites.tsx` ~170L — pump-jack rigs on the globe: `latLonToVector`, `usePumpJack` (GLB clone), `SurfaceSites`, `RIG_HEIGHT`, `SURFACE_RIG_SCALE`.
- `src/three/Starfield.tsx` ~50L — NASA starmap sky sphere + bright star points; fade in at handoff.
- `src/three/probeRenderer.ts` ~250L — shared off-DOM WebGLRenderer drawing visible probes into 2D canvases; GLTF+meshopt cache, `buildSky()` for M-05, `attachProbe()`.
- `src/three/ProbeView.tsx` ~30L — `<ProbeView model hot>`: 2D canvas wired to `attachProbe`.

## src/surface/ (walkable Mars, ported from SPHEREx XR)

- `src/surface/sites.ts` ~105L — `WalkSite`, `WALK_SITES` (gale, meridiani: terrain grid, spawn, sun, fog, credit), `Spot`, `MAIN_RIG`, `FIELD`, `GROUND_MODELS`, `MISSION_SPOTS`, `missionSpots()`.
- `src/surface/SurfaceWalk.tsx` ~770L — on-foot scene: `QUALITY` per tier, landing drop, `Environment` (sky/fog/sun shadows), `MarsSky`, `Terrain` (worker), `Rocks`, `DustField`, `OilField`, parked probes + hotspots (`#walk-labels`), walker physics + `KEYS` (WASD/arrows/Shift/Space/Q/E).
- `src/surface/terrain.ts` ~255L — `SiteTerrain`, `HeightField`, noise (`vnoise`, `fbm`), `makeHeightField`, `loadHeightField` (`.dat`), `buildRadialTerrain` (clipmap + vertex colours/mask), `getGroundTexture`, `sunDirection`.
- `src/surface/terrain.worker.ts` ~25L — Web Worker building terrain geometry; `TerrainBuildRequest`/`TerrainBuildResult`.
- `src/surface/materials.ts` ~125L — PBR ground/rock materials from Poly Haven scans (`useGroundMaterial`, `useRockMaterial`, `TexSize`).
- `src/surface/input.ts` ~20L — `walkInput` (keys + phone Walk button), `releaseWalkInput`, `walker` readout, `EYE_HEIGHT`, `MARS_G`.

## src/hud/ (DOM UI)

- `src/hud/Telemetry.tsx` ~80L — `TelemetryBar` (callsign, WIB clock, Mars sol, gyro/cursor readout, section nav), `HudFrame` (brackets, grid, scanlines).
- `src/hud/PilotCard.tsx` ~100L — `PilotCard` (name, `TypingRotator` roles, stats, Enable gyro / Land on Mars / AR View, socials on phone).
- `src/hud/Missions.tsx` ~150L — `MissionPanel` (hero side panel, 4/page, probes) + `MissionsSection` (#missions, category filter, cards).
- `src/hud/MissionDetail.tsx` ~175L — brief drawer/bottom sheet: shots desktop/mobile, Live feed iframe (`LiveFeed`), stack, probe, links, prev/next, Esc/←/→.
- `src/hud/Sections.tsx` ~200L — `ProfileSection` (03), `MissionLog` (04, filter, zero-g capsules), `CrewRecord` (05), `Arsenal` (06), `TerminalSection` (07), `Comms` (08).
- `src/hud/Terminal.tsx` ~175L — `COMMANDS`, `run()`, `Terminal` (history, Tab completion), `TerminalOverlay` (`/` key).
- `src/hud/SurfaceHud.tsx` ~105L — landing-site panel (brief, next site, lift off, distance/heading), phone hold-to-walk pad, Esc → `takeOff`.
- `src/hud/Chrome.tsx` ~70L — `StatusDock` (Opportunity mascot, Lite toggle, FPS, terminal), `Toast`, `Credits` (footer, NASA disclaimer, replay intro).
- `src/hud/Socials.tsx` ~30L — `Socials`: GitHub/LinkedIn/WhatsApp icon buttons.

## src/ar/ (lazy chunk)

- `src/ar/ArView.tsx` ~270L — default export `ArView`: camera feed + transparent canvas, `GyroCamera`, `DragCamera` fallback, `FloatingMars` (drag spin, pinch/wheel zoom), Recenter, camera toggle, Quick Look links, Esc.
- `src/ar/CameraFeed.tsx` ~45L — rear-camera `<video>` via getUserMedia; stops tracks on unmount.
- `src/ar/arSupport.ts` ~20L — `IS_IOS`, `supportsQuickLook`, `QUICK_LOOK` (mars.usdz, pump-jack.usdz).

## src/lib/

- `src/lib/device.ts` ~20L — `IS_TOUCH`, `HAS_ORIENTATION`, `REDUCED_MOTION`, `IS_IN_APP_BROWSER`, `requestGyroPermission` (user gesture), `arMotion`.
- `src/lib/useGyro.ts` ~50L — `useGyroParallax`: deviceorientation → `live.parallaxTarget` (±14°), 2 s no-data fallback toast.
- `src/lib/useReturnGesture.ts` ~55L — `useReturnGesture`: scroll-up/swipe-down/↑/PageUp at top → `returnToPilot`.
- `src/lib/marsTime.ts` ~10L — `marsSol()` (Mars24 formula).

## scripts/ (Node ESM)

- `scripts/copy-nasa-assets.mjs` ~40L — allowlisted copy from `$SPHEREX_DIR` → `public/` (+ raw models → `assets/models-src/`).
- `scripts/optimize-models.mjs` ~45L — gltf-transform: dedup/prune/weld/simplify(`RATIO`)/webp 512/meshopt → `public/models/hud/`.
- `scripts/build-portrait-field.mjs` ~145L — portrait PNG → `public/intro/portrait-field.dat` (RPF1 format) + `portrait.webp`.
- `scripts/capture-shots.mjs` ~50L — Playwright screenshots of mission URLs → `public/shots/<id>-{desktop,mobile}.webp`.
- `scripts/smoke.mjs` ~150L — 18-check smoke test on `vite preview :4179`; `--og` writes `public/og.jpg`.
- `scripts/check-codemap.mjs` ~30L — `npm run docs:check`: fails if a `src/`/`scripts/` file is not listed in this codemap.

## tools/

- `tools/convert-usdz.html` — browser USDZ→GLB converter (USDLoader + GLTFExporter), saves via dev endpoint.
