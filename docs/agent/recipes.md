# Recipes

Step lists for common tasks. Each names exactly what to touch, so no exploration is needed. Finish every recipe with
`npm run build` (and `npm run smoke` when UI/behaviour changed).

## Edit copy

Text lives only in `src/data/{profile,record,missions}.ts`, `src/hud/Terminal.tsx` (`run()`), section headings in
`src/hud/Sections.tsx` / `Missions.tsx`, intro text in `src/intro/IntroOverlay.tsx`, and meta in `index.html`.
Grep the exact current string, edit in place. English only. Don't invent facts.

## Add a mission

1. `src/data/missions.ts`: widen `MissionId` (`| 'm-09'`); append to `MISSIONS` with every required field
   (`id code name category role context year stack brief highlights model modelName modelReason status checkedAt orbit`).
   Pick an `orbit.phase` not used on that ring. Optional `url`, `repo` (public only), `landing`.
2. New probe model → widen `ProbeModel`; put optimized GLB at `public/models/hud/<model>.glb` (recipe below); if it
   should stand on the surface add `GROUND_MODELS[<model>]` in `src/surface/sites.ts`.
3. Has `url` → `node scripts/capture-shots.mjs m-09`.
4. Update range text: `src/hud/Terminal.tsx` (`help` line, `open` usage `m-01 … m-08`), `index.html` ("Eight missions").
5. More than 8 non-site missions on the ground → add entries to `MISSION_SPOTS` (`src/surface/sites.ts`).

## Make a mission land (surface site)

Add `landing: { lat, lon, site, terrain: 'gale' | 'meridiani' }` to the mission. It automatically joins
`SURFACE_SITES`, gets a rig on the globe and a walkable site. A new terrain needs a `.dat` heightmap in
`public/terrain/`, a `WALK_SITES` entry, and widening the `terrain` union in both `missions.ts` and `sites.ts`.

## Add a terminal command

`src/hud/Terminal.tsx`: add the name to `COMMANDS` (Tab completion), add a `case` in `run()` returning
`Line[]` (`kind: 'out' | 'err'`), mention it in the `help` text. Drive the page via `useHud.getState()` actions.
Update the command list in `docs/fitur.md` §7.

## Add a content section

1. Component in `src/hud/Sections.tsx` using `SectionHead index eyebrow title id`; wrap in
   `<section id=… className="section" aria-labelledby=…>`.
2. Mount it in `src/App.tsx` `<main>` in order; add a nav link in `src/hud/Telemetry.tsx`.
3. Data in `src/data/record.ts`. Styles under the `content sections` banner in `src/styles.css`.

## Add / replace a NASA probe model

1. Raw GLB → `assets/models-src/<name>.glb` (gitignored).
2. Optional per-model simplify ratio in `RATIO` (`scripts/optimize-models.mjs`).
3. `npm run assets:models` → `public/models/hud/<name>.glb`. Target ≤ 600 KB.
4. Wire it: `ProbeModel` union + mission `model`.

## Change the portrait

`npm run assets:portrait -- path/to/photo.png` (default `assets/source/rafli-portrait.png`, transparent background
works best). If face proportions change, re-measure `EYES` and `PORTRAIT_ASPECT` in `src/intro/timeline.ts`.
`public/intro/portrait-reveal.webp` is separate (crisp reveal image) — replace by hand.

## Tune performance

| Knob | File |
|---|---|
| Start tier | `src/main.tsx` |
| Auto downgrade threshold (FPS < 38 × 3 s) & DPR steps | `src/three/CameraRig.tsx` (end of `useFrame`) |
| Canvas DPR | `src/three/Scene.tsx` |
| Intro particle counts | `COUNT_BY_TIER` in `src/intro/ParticlePortrait.tsx` |
| Surface mesh/tex/rocks/dust/shadow | `QUALITY` in `src/surface/SurfaceWalk.tsx` |
| Normal map 2k vs 1k | `src/three/Mars.tsx` |

## Change where Mars sits / HUD panel widths

Edit `computeLayout()` in `src/three/layout.ts` **and** the `.hero` / mission side panel rules in `src/styles.css`
together: `freeLeft` 450 / `freeRight` width − 390 approximate the `.hero` grid columns
(`minmax(300px,400px) 1fr minmax(280px,330px)` + padding); the 1100 px breakpoint matches `@media (max-width: 1100px)`;
`wide` = aspect ≥ 0.95 and width > 760.
Check at 1440, 1100, 800, 375 px.

## Change domain / SEO

`index.html`: `<title>`, description, `og:*`, `twitter:card`, `canonical`, JSON-LD `sameAs`. OG image:
`npm run build && npm run smoke -- --og`.

## Verify in a browser (agent)

Start preview `portfolio` (dev) or `portfolio-prod` (after build) from `.claude/launch.json`. Useful URL flag:
`?intro` forces the intro. Camera/gyro can't be tested in desktop panes — AR falls back to stars.
