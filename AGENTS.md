# AGENTS.md — RAFLI // MARS MISSION CONTROL

Static portfolio SPA: particle-portrait intro → 3D Mars with 8 orbiting "missions" (projects) → land & walk on the
Mars surface → phone AR. No backend, no router. Site copy is English; human docs (`docs/*.md`) are Indonesian.

**Token budget rule:** don't explore. Use the routing table → open only the named file(s) → read only the section you
need. `docs/agent/codemap.md` describes every source file in one line; `src/styles.css` (2000 L) and
`src/surface/SurfaceWalk.tsx` (770 L) are big — grep, don't read whole. Never read `package-lock.json`, `dist/`,
`node_modules/`, `public/**` binaries, or `implementasi.md` (55 KB historical plan) unless the task is about them.

## Commands

| | |
|---|---|
| dev | `npm run dev` (:5173) · phone/HTTPS on LAN: `npm run dev:phone` |
| verify | `npm run build` (tsc strict + vite) then `npm run smoke` (18 Playwright checks on `dist/`, needs system Chrome/Edge) |
| docs check | `npm run docs:check` (every file in `src/` + `scripts/` must appear in `docs/agent/codemap.md`) |
| assets | `assets:copy` · `assets:models` · `assets:portrait` · `assets:shots` (see `docs/aset.md`) |

No unit tests, no ESLint/Prettier. Windows dev machine; scripts are Node ESM.

## Routing table (task → where)

| Task | Go to |
|---|---|
| Change text: bio, log, crew, skills, contact | `src/data/record.ts` |
| Name, roles, socials, CV link | `src/data/profile.ts` |
| Add/edit a project ("mission") | `src/data/missions.ts` → recipe in `docs/agent/recipes.md#add-a-mission` |
| Page structure / section order | `src/App.tsx` |
| Global UI state & actions | `src/state/store.ts` (`useHud`, `live`) |
| Styling | `src/styles.css` — grep the `/* ---------- <area> ---------- */` banners (list in codemap) |
| Intro timing / particles | `src/intro/timeline.ts` (T, L), `ParticlePortrait.tsx`, `shaders.ts` |
| Mars, orbits, beacons, camera moves | `src/three/` (`CameraRig.tsx` owns every camera move + FPS/tier) |
| Where Mars sits on screen | `src/three/layout.ts` `computeLayout()` (pixel edges mirror `.hero` CSS) |
| HUD probe models in cards | `src/three/probeRenderer.ts` (+ `ProbeView.tsx`) |
| Walkable surface | `src/surface/` (`sites.ts` = data/placement, `SurfaceWalk.tsx` = scene, `terrain*.ts` = mesh) |
| Surface HUD / landing panel | `src/hud/SurfaceHud.tsx` |
| AR View | `src/ar/ArView.tsx` (lazy) |
| Terminal commands | `src/hud/Terminal.tsx` `run()` + `COMMANDS` |
| Mission brief drawer | `src/hud/MissionDetail.tsx` |
| SEO / meta / OG / JSON-LD | `index.html` |
| Caching / MIME on Vercel | `vercel.json` |

Deeper context only if needed: `docs/arsitektur.md` (state machine, render pipeline), `docs/fitur.md` (features +
controls), `docs/konten.md` (content schema), `docs/aset.md`, `docs/qa-deploy.md`.

## Mental model (read this instead of the code)

- `useHud.phase`: `'intro' | 'landing'`. On landing, orthogonal modes: `activeMission` (brief), `surface` (site index,
  descent) → `walking` (on foot), `arOpen`, `terminalOpen`, `lite`.
- `live` (plain mutable object in `store.ts`) = per-frame values read in `useFrame` (`marsSpin`, `parallax`, `beacons`,
  `focus`, `surfaceIn`, `landingIn`). Never put per-frame values in zustand. Same pattern: `introClock`,
  `walkInput`/`walker`, `arMotion`.
- Scene ↔ CSS bridge on `<html>`: vars `--landing`, `--launch`, `--dive`; attrs `data-phase`, `data-brief`,
  `data-surface`, `data-walk`; class `no-webgl`.
- One `<Canvas>` (`three/Scene.tsx`) behind DOM HUD. All content is DOM (SEO/a11y). Label layers: `#labels`
  (index.html) and `#walk-labels` (App.tsx).
- Surface sites = missions with `landing` (M-06 → Gale Crater, M-08 → Meridiani Planum). `SURFACE_SITES` derives from
  `MISSIONS`.

## Invariants — do not break

1. **Binary assets use `.dat`, never `.bin`** (headless Chrome returns empty 204 for `.bin`).
2. **Probe models render via the shared off-DOM renderer + 2D `<canvas>` copy** (`probeRenderer.ts`). Don't switch to
   drei `<View>`/fixed overlay canvas — it lags scroll on phones.
3. Intro particle sphere and Mars mesh share transform, tilt (`MARS_TILT`), UVs and `live.marsSpin`. Change one → change both.
4. `computeLayout()` constants (`freeLeft` 450, `freeRight` = width − 390, 1100 px breakpoint) approximate the `.hero`
   grid in `styles.css` (`minmax(300px,400px) 1fr minmax(280px,330px)` + padding, `@media (max-width: 1100px)`).
   Change one → change the other.
5. iOS motion permission must be requested inside a click handler (`requestGyroPermission`).
6. Smoke test depends on selectors: `.mission-row .detail-title .detail.open .term-overlay .term-screen .ar .walk-pin
   .landing-note`. Rename → update `scripts/smoke.mjs`.
7. Content must be true (from CV/GitHub/live sites). No invented stats or skill percentages. Only public repos as `repo`.
8. No NASA/Space Apps logos as branding; keep the non-affiliation disclaimer and asset credits.
9. `MissionId` is a literal union `'m-01'…'m-08'`; adding a mission means widening it.
10. `tsconfig` has `noUnusedLocals/Parameters` — remove dead imports or the build fails.

## Conventions

- TypeScript strict, function components, named exports (except `ArView` default for `React.lazy`).
- Style: no semicolons, single quotes, 2-space indent, long lines OK (~120–160). Match neighbours.
- Comments explain *why*; JSDoc `/** */` on exported things. Reference `implementasi.md §x` where a decision came from.
- CSS: plain CSS, tokens in `:root` (`--hud #00d9ff`, `--teal #4fe3d6`, `--amber #ffb54a`, `--mars #c1440e`,
  `--mono` Share Tech Mono, `--sans` Space Grotesk, `--chamfer`). No Tailwind, no CSS-in-JS.
- Commits: imperative, sentence case, no prefix (e.g. "Float the flight record in zero-g").
- Don't push or deploy without the owner's OK.

## When you change the code

- Added/removed/renamed a file in `src/` or `scripts/` → update its line in `docs/agent/codemap.md`
  (`npm run docs:check` enforces it).
- Changed behaviour/controls → update `docs/fitur.md`; changed state/render flow → `docs/arsitektur.md`.
- Run `npm run build`; for UI/behaviour changes also `npm run smoke`.
