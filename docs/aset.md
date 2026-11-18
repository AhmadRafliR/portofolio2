# Aset

Semua yang di-deploy ada di `public/` (di-commit). Sumber mentah ada di `assets/` (sebagian di-gitignore:
`assets/models-src/`, `assets/source/oil-pump-jack.usdz`).

## Peta `public/`

| Path | Isi | Dipakai oleh |
|---|---|---|
| `textures/mars.jpg` | Mosaik warna Mars (NASA, ±950 KB) | `three/Mars.tsx`, `ar/ArView.tsx`, `intro` (bola partikel) |
| `textures/mars_normal_1k.png` / `_2k.png` | Normal map; 2k hanya tier `high` + layout lebar | `three/Mars.tsx` |
| `textures/starmap_2k.jpg` | Langit bintang | `three/Starfield.tsx` |
| `textures/provenance.json` | Kredit, sumber, sha256 tiap tekstur (disalin dari SPHEREx) | dokumentasi |
| `textures/ground/{gravel,dust,rock}_{albedo,normal,rough}_{1k,512}.jpg` | Pindaian CC0 Poly Haven (grayscale) | `surface/materials.ts` |
| `terrain/gale.dat`, `meridiani.dat` | Heightmap 16-bit (grid di `WALK_SITES`) | `surface/terrain.ts` |
| `models/hud/*.glb` | 7 probe NASA + `pump-jack.glb`, terkompresi meshopt | `three/probeRenderer.ts`, `SurfaceSites.tsx`, `SurfaceWalk.tsx` |
| `intro/portrait-field.dat` | Data partikel potret (±250 KB) | `intro/ParticlePortrait.tsx` |
| `intro/portrait-reveal.webp` | Potret tajam yang "terbakar" di akhir bagian 1 | `intro/ParticlePortrait.tsx` |
| `intro/portrait.webp` | Potret grayscale 480 px, dihasilkan `build-portrait-field.mjs` (tidak direferensikan di `src/`) | — |
| `shots/m-0x-{desktop,mobile}.webp` | Screenshot situs live (M-01…05, M-07) | `hud/MissionDetail.tsx` via `shotsFor()` |
| `ar/mars.usdz`, `ar/pump-jack.usdz`, `ar/mars-thumb.webp` | iOS AR Quick Look | `ar/arSupport.ts` |
| `cv/Ahmad-Rafli-Ramadhan-CV.pdf` | CV | `PROFILE.cv`, terminal `cv` |
| `og.jpg` | Gambar OG 1200×630 (dibuat `npm run smoke -- --og`) | `index.html` |
| `favicon.svg` | Favicon | `index.html` |

Ukuran model saat ini: perseverance 1,0 MB (masih di atas target 600 KB), lunar-module 440 KB, osiris-rex 380 KB,
ingenuity 212 KB, curiosity 92 KB, pump-jack 76 KB, bennu 48 KB, opportunity 20 KB.

## Pemetaan probe ↔ misi

| Misi | Probe | Alasan singkat |
|---|---|---|
| M-01 IPFEST 2027 | Curiosity | Rover geologi berbor batu, untuk festival perminyakan |
| M-02 CarbonCapex | Ingenuity | Penerbang otonom, untuk AI advisor |
| M-03 Wispril 2026 | Lunar Module | — |
| M-04 Pantra | Perseverance | — |
| M-05 SPHEREx XR | `sky-hologram` | Bola survei langit prosedural (`buildSky()` di `probeRenderer.ts`) |
| M-06 HMS Simulation | Bennu | Batuan berpori → simulasi media berpori (juga easter egg `sample bennu`) |
| M-07 KaryaSupply | OSIRIS-REx | — |
| M-08 Mud Monitor | Opportunity | Juga maskot dock |

Alasan lengkap ada di `modelReason` tiap misi (`src/data/missions.ts`).

## Script pipeline (`scripts/`, Node ESM)

| Script | Input → Output | Catatan |
|---|---|---|
| `copy-nasa-assets.mjs` (`assets:copy`) | `$SPHEREX_DIR` → `public/` | Allowlist eksplisit. Default `SPHEREX_DIR` = checkout lokal SPHEREx `arvr/public`. Model mentah → `assets/models-src/`. `.bin` terrain diganti nama `.dat` |
| `optimize-models.mjs` (`assets:models`) | `assets/models-src/*.glb` → `public/models/hud/` | dedup → prune → weld → simplify (rasio per model di `RATIO`) → tekstur webp 512 → meshopt |
| `build-portrait-field.mjs` (`assets:portrait`) | `assets/source/rafli-portrait.png` (atau arg pertama) → `public/intro/portrait-field.dat` + `portrait.webp` | Format di bawah |
| `capture-shots.mjs` (`assets:shots`) | URL dari `missions.ts` → `public/shots/*.webp` | Chrome/Edge sistem via playwright-core; arg = id misi tertentu |
| `smoke.mjs` (`smoke`) | `dist/` | Lihat [qa-deploy.md](qa-deploy.md); `--og` menulis `public/og.jpg` |
| `tools/convert-usdz.html` | `assets/source/oil-pump-jack.usdz` → `assets/models-src/pump-jack.glb` | Buka lewat `npm run dev` (`/tools/convert-usdz.html`); menyimpan via endpoint dev `/__save-asset` |

### Format `portrait-field.dat`

```
header 16 B : "RPF1" · count u32 · aspect f32 (w/h) · reserved u32
per partikel 8 B : x i16 · y i16 (−1..1, y ke atas, fit tinggi) · angle u8 (0..π) · len u8 · tone u8 · seed u8
```
Partikel sudah diacak, jadi prefix N mana pun = sampel merata; tier memilih N pertama.

### Kenapa `.dat`, bukan `.bin`

Chrome headless (dan sebagian build Chrome) membalas fetch file `.bin` dengan **204 kosong**. Semua data biner
memakai ekstensi `.dat`. Jangan ganti kembali ke `.bin`.

## Kredit & lisensi

- Mars: NASA 3D Resources (mosaik warna era Viking), public domain. Detail per file di `textures/provenance.json`.
- Terrain Gale: NASA 3D Resources "Curiosity Landing Site". Meridiani: NASA MGS MOLA (PDS). Kredit tampil di panel situs.
- Model probe: NASA 3D Resources lewat project SPHEREx XR.
- Tanah: pindaian CC0 Poly Haven. Pump jack: aset `Oil_Pump_Jack.usdz` dari pemilik.
- **Jangan** memakai logo NASA/Space Apps sebagai branding. Disclaimer non-afiliasi ada di footer Credits.
- Ladang minyak, batu, warna, dan langit di permukaan bersifat artistik; lokasi rig ilustratif.
