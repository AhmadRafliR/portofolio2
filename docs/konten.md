# Mengubah Konten

Semua teks situs ada di `src/data/` (bahasa **English**). Komponen hanya membaca data ini, jadi sebagian besar
perubahan konten tidak menyentuh komponen. Aturan isi: **jangan mengarang** — data berasal dari CV, README GitHub, dan
situs live yang dicek (lihat komentar di atas `record.ts` dan `missions.ts`).

| Mau mengubah | File | Ekspor |
|---|---|---|
| Nama, callsign, role yang berganti-ganti, tagline, kampus, link CV, GitHub/LinkedIn/WhatsApp | `src/data/profile.ts` | `PROFILE` |
| Bio, core matrix, pendidikan, bahasa | `src/data/record.ts` | `BIO` |
| Prestasi / lomba / sertifikat (Flight record) | `src/data/record.ts` | `LOG` (`kind`: competition · olympiad · academic · certification) |
| Organisasi | `src/data/record.ts` | `CREW`, `ALSO_ON_DECK` |
| Skill | `src/data/record.ts` | `ARSENAL` |
| Email, LINE | `src/data/record.ts` | `CONTACT` |
| Project / misi | `src/data/missions.ts` | `MISSIONS`, `FIELD_RIGS` |
| Teks terminal | `src/hud/Terminal.tsx` | fungsi `run()` |
| Judul, meta, OG, JSON-LD, canonical | `index.html` | — |
| File CV | `public/cv/Ahmad-Rafli-Ramadhan-CV.pdf` | path di `PROFILE.cv` |

## Skema misi (`Mission`)

| Field | Catatan |
|---|---|
| `id` / `code` | `'m-01'` / `'M-01'`. `MissionId` adalah union literal — misi baru wajib menambah union-nya |
| `category` | `web` · `ai-ml` · `engineering` · `xr` (dipakai filter) |
| `url?`, `repo?` | Hanya repo **publik**. Ada `url` → screenshot + Live feed iframe aktif (`shotsFor`, `canFrame`) |
| `role`, `context`, `year`, `stack`, `brief`, `highlights` | Copy brief |
| `model`, `modelName`, `modelReason` | Probe NASA di HUD: `curiosity` `ingenuity` `lunar-module` `osiris-rex` `perseverance` `opportunity` `bennu` `sky-hologram` (prosedural) |
| `status` | `deployed` atau `offline-archive` (tanpa link) |
| `checkedAt` | Tanggal URL/stack terakhir dicek |
| `orbit` | `{ ring: 'inner' \| 'outer', phase: 0..1 }` — posisi beacon. Hindari phase yang sama di ring yang sama |
| `landing?` | `{ lat, lon, site, terrain: 'gale' \| 'meridiani' }` → misi **mendarat** (rig pump jack) dan jadi situs permukaan |

## Menambah misi baru (checklist)

1. `src/data/missions.ts`: tambah `'m-09'` ke `MissionId`, tambah objek di `MISSIONS` (urutan array = urutan tampil).
2. Model probe baru? Tambah ke `ProbeModel`, taruh `.glb` teroptimasi di `public/models/hud/` (lihat
   [aset.md](aset.md)). Kalau akan diparkir di permukaan, tambah ukurannya di `GROUND_MODELS` (`src/surface/sites.ts`).
3. Ada `url`: jalankan `node scripts/capture-shots.mjs m-09` → `public/shots/m-09-{desktop,mobile}.webp`. Cek juga
   header `X-Frame-Options`/CSP situsnya; `canFrame` saat ini menganggap semua URL boleh di-iframe.
4. Teks yang menyebut rentang `m-01…m-08`: `help` dan `open` di `src/hud/Terminal.tsx`; copy "Eight missions" di
   `index.html` (meta description & OG).
5. Lebih dari 7 misi lain di permukaan → `MISSION_SPOTS` (`src/surface/sites.ts`) akan berulang; tambah spot.
6. `npm run build && npm run smoke`.

## Menambah situs pendaratan

Situs permukaan = misi dengan `landing`. Medan yang tersedia hanya `gale` dan `meridiani` (`WALK_SITES` di
`src/surface/sites.ts`, file `public/terrain/*.dat`). Medan baru perlu: heightmap 16-bit `.dat` + entri `WalkSite`
(grid, skala, spawn, matahari, fog, kredit) + menambah union `terrain`.

## Gaya penulisan copy

- English, kalimat pendek, nada HUD ("Missions flown", "Open a channel").
- Nama organisasi Indonesia tetap asli + terjemahan singkat (`orgNote`).
- Tanpa persentase skill karangan; tanpa angka statistik yang tidak terverifikasi (mis. statistik landing Pantra).
- Label section memakai format `// 02 · Active missions`.
