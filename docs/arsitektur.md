# Arsitektur

Aplikasi satu halaman (SPA) tanpa router dan tanpa backend. Satu `<Canvas>` R3F fixed full-screen di belakang, semua
teks/panel di DOM di atasnya (SEO, screen reader, dan lite mode tetap jalan).

## Lapisan halaman (urutan z, bawah → atas)

```
<Canvas class="scene">     src/three/Scene.tsx        intro partikel, Mars, orbit, medan permukaan
<ArView>  (lazy, opsional) src/ar/ArView.tsx           menutupi semuanya; scene utama di-pause (frameloop 'never')
<IntroOverlay>             src/intro/IntroOverlay.tsx  hanya saat phase === 'intro'
.scrim                     redupkan Mars saat scroll ke section konten
.dive                      "dust-out" saat turun ke permukaan (CSS var --dive)
#labels                    index.html — layer label 3D (drei <Html>) agar tidak melebarkan viewport HP
.page                      HUD DOM: telemetry, hero, section, dock, SurfaceHud, MissionDetail, terminal, toast
  #walk-labels             label hotspot di permukaan (di dalam .page agar bisa diklik)
```

Susunan lengkap ada di `src/App.tsx`.

## State machine

```
            scroll/↓/Space/Enter/Esc            klik Mars / "Land on Mars"        CameraRig: surfaceIn>0.985
 [intro] ───────────────────────────▶ [landing] ─────────────────────────▶ [descent] ──────────────▶ [walking]
    ▲   (ParticlePortrait part 2,         │  ▲                                  surface≠null            SurfaceWalk
    │    finishIntro() → setPhase)        │  │ takeOff() / Esc                  walking=false            mengendalikan kamera
    └──── returnToPilot() ◀───────────────┘  └──────────────────────────────────────────────────────────┘
          (↑/PageUp/scroll-up di puncak, tombol ◂ Pilot)
 Dari landing juga: setArOpen(true) → AR View   ·  setActive(id) → brief misi  ·  setTerminal(true) / tombol `/`
```

| Field `useHud` | Arti |
|---|---|
| `phase: 'intro' \| 'landing'` | Fase utama. `main.tsx` langsung set `landing` bila tanpa WebGL, reduced-motion, atau intro sudah dilihat sesi ini |
| `launched`, `launchFast`, `returning` | Intro bagian 2 sedang jalan / dipercepat (Skip) / diputar mundur (kembali ke potret) |
| `activeMission`, `hoverMission` | Brief misi yang terbuka / beacon yang di-hover (`'m-01'…'m-08'`) |
| `surface: number \| null` | Index ke `SURFACE_SITES` (mode permukaan). `null` = di orbit |
| `walking` | Turun sudah selesai, pengunjung berjalan di medan (`SurfaceWalk` ter-mount) |
| `arOpen`, `terminalOpen` | Overlay AR / terminal |
| `lite` | Lite mode (disimpan di `localStorage['rafli.lite']`) |
| `tier: 'high'\|'mid'\|'low'`, `fps` | Kualitas adaptif |
| `gyroEnabled`, `orientation`, `pointer` | Input parallax (orientation/pointer di-throttle untuk tampilan) |
| `toast` | Pesan singkat, hilang otomatis 3,6 dtk |

Aturan penting di action:
- `setActive(id)` saat **di orbit** membatalkan pendaratan (`surface: null`); saat **berjalan** brief dibuka di atas medan.
- `setArOpen()` menutup brief, terminal, dan permukaan.
- `land()` / `returnToPilot()` hanya berlaku di `phase === 'landing'` dan scroll ke atas.

## `useHud` vs `live`

- **`useHud`** (zustand): state yang memicu render React. Jangan ditulis tiap frame.
- **`live`** (objek biasa di `src/state/store.ts`): nilai per-frame yang dibaca di `useFrame` — `marsSpin`,
  `landingIn`, `parallax`/`parallaxTarget`, `ndc`, posisi world tiap beacon (`beacons`), `focus` (fly-to),
  `surfaceIn` (progres turun). Ditulis/dibaca tanpa re-render.
- Objek mutable lain dengan pola sama: `introClock` (`src/intro/timeline.ts`), `walkInput`/`walker`
  (`src/surface/input.ts`), `arMotion` (`src/lib/device.ts`).

## Jembatan 3D → CSS

Scene menulis ke `document.documentElement`, CSS yang bereaksi:

| Ditulis | Oleh | Dipakai CSS untuk |
|---|---|---|
| `--landing` (0..1) | `ParticlePortrait`, `main.tsx` | HUD muncul bertahap saat handoff intro → landing |
| `--launch` (0..1) | `ParticlePortrait`, `main.tsx` | overlay intro memudar |
| `--dive` (0..1) | `CameraRig` (turun), `SurfaceWalk` (mendarat) | layer debu `.dive` |
| `data-phase` | `App.tsx` | `intro` / `landing` |
| `data-brief="open"` | `App.tsx` | panel hero mundur saat brief terbuka |
| `data-surface="on"`, `data-walk="on"` | `App.tsx` | sembunyikan section, tampilkan HUD permukaan |
| class `no-webgl` | `main.tsx` | planet CSS pengganti scene |

## Pipeline render

- **Canvas utama** (`Scene.tsx`): `frameloop` = `never` saat AR terbuka, `demand` saat lite mode di orbit, selain itu
  `always`. DPR `[1,1.5]` di HP, `[1,1.75]` di desktop. Tanpa tone mapping. Grup orbit tetap ter-mount (disembunyikan)
  saat berjalan supaya lepas landas instan; `SurfaceWalk` di-lazy-load.
- **Layout** (`three/layout.ts`): `computeLayout()` menghitung posisi & radius Mars dari ukuran viewport supaya Mars
  pas di celah antar panel HUD (tepi piksel mengikuti `.hero` di `styles.css` — ubah keduanya bersamaan).
  Bola partikel intro dan mesh Mars memakai transform, tilt (25,19°), UV, dan `live.marsSpin` yang sama → handoff mulus.
- **CameraRig** (`three/CameraRig.tsx`): parallax mouse/gyro, mundur saat scroll, fly-to beacon misi aktif
  (`live.focus`), turun ke situs permukaan (`live.surfaceIn`), putaran Mars, FPS + turun tier otomatis
  (FPS < 38 selama 3 dtk beruntun → `high→mid→low`, DPR 1,25 → 1).
- **Probe HUD** (`three/probeRenderer.ts`): satu `WebGLRenderer` off-DOM menggambar semua model NASA yang terlihat,
  lalu `drawImage` ke `<canvas>` 2D di tiap kartu. Alasannya: overlay WebGL fixed selalu tertinggal saat scroll di HP.
  Jangan ganti dengan drei `<View>`.
- **Medan permukaan** (`surface/`): heightmap NASA 16-bit → mesh radial "clipmap" dibangun di Web Worker
  (`terrain.worker.ts`), dibangun ulang setelah berjalan 40 m. Kualitas per tier di `QUALITY` (`SurfaceWalk.tsx`).
- **AR** (`ar/ArView.tsx`): canvas transparan di atas `<video>` kamera belakang; kamera disetir orientasi device
  (rotasi saja, bukan posisi). Fallback: kamera ditolak → bintang; tanpa gyro → drag.

## Code splitting

`React.lazy`: `ArView` (chunk sendiri) dan `SurfaceWalk`. Model `.glb` & tekstur dimuat saat dibutuhkan. Bundle utama
didominasi three + R3F (~390 KB gzip); `vite.config.ts` menaikkan `chunkSizeWarningLimit` ke 1400 KB.

## Vite config

- `devAssetSave()` — endpoint dev-only `POST /__save-asset?name=x.glb` untuk `tools/convert-usdz.html` menulis ke
  `assets/models-src/`. Tidak ikut build produksi.
- Mode `phone` (`npm run dev:phone`) menambahkan `@vitejs/plugin-basic-ssl` (HTTPS di LAN).
