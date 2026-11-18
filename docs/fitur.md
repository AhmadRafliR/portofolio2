# Fitur & Kontrol

Konsep: pengunjung = kru yang melihat "pilot" (Rafli) mengorbit Mars. Tiap project = **misi** (`M-01…M-08`) yang
mengorbit sebagai beacon, atau **mendarat** sebagai rig pump jack (misi engineering).

## 1. Intro — potret partikel

File: `src/intro/` (`ParticlePortrait.tsx`, `shaders.ts`, `timeline.ts`, `IntroOverlay.tsx`).

- **Bagian 1** (otomatis, ±4,9 dtk): helai partikel berputar (vortex) → membentuk potret → potret tajam muncul,
  mata menyala. **Berhenti** di sini.
- **Bagian 2** (setelah aksi pengunjung): potret luruh, partikel menyusun bola yang identik dengan mesh Mars, lalu
  Mars + HUD masuk (`--landing`).
- Jumlah partikel per tier: high 32k · mid 18k · low 9k (prefix dari `portrait-field.dat`, sudah diacak).
- Diputar **sekali per sesi** (`sessionStorage['rafli.intro.seen']`). `?intro` di URL memaksa replay; tombol replay ada
  di footer Credits. Reduced-motion / tanpa WebGL → langsung landing.
- Timing di `T` (bagian 1) dan `L` (bagian 2) di `timeline.ts`.

| Aksi | Hasil |
|---|---|
| Scroll ke bawah, swipe ke atas, `↓` `PageDown` `Space` `Enter`, tombol cue | Luncurkan bagian 2 |
| `Esc`, tombol **Skip** | Luncurkan versi cepat |

## 2. Landing — Mars & HUD

- Mars (`three/Mars.tsx`): mosaik warna NASA + normal map, tilt 25,19°, putaran lambat, atmosfer rim-glow.
- Orbit (`three/Orbits.tsx`): 2 ring (inner/outer) dengan tick, 8 beacon, reticle "▾ Click Mars to land".
- HUD: `TelemetryBar` (callsign, jam WIB, Sol Mars, α/β/γ gyro atau posisi kursor, navigasi section), `HudFrame`
  (bracket sudut, grid, scanline), `PilotCard` (nama, role berganti-ganti, tombol), `MissionPanel` (desktop ≥1100 px,
  4 misi/halaman, probe NASA berputar), `StatusDock` (maskot Opportunity, Lite, FPS, terminal).
- Tombol pilot card: **Enable gyro** (HP; izin iOS diminta di dalam tap), **Land on Mars**, **AR View**.

| Aksi | Hasil |
|---|---|
| Gerak mouse / miringkan HP (gyro ±14°) | Parallax kamera |
| `↑` / `PageUp` / scroll ke atas / swipe ke bawah di puncak halaman, tombol **◂ Pilot** | Kembali ke potret (intro mundur) |
| `/` | Buka terminal overlay |
| Klik bola Mars | Mendarat di situs permukaan terdekat dari titik klik |

## 3. Misi & brief

- Data: `src/data/missions.ts`. Section `#missions` (`hud/Missions.tsx`) dengan filter All / Web / AI-ML /
  Engineering / XR.
- Brief (`hud/MissionDetail.tsx`): drawer kanan (desktop) / bottom sheet (HP). Kamera terbang ke beacon misi;
  misi yang mendarat → Mars berputar menghadapkan situsnya dan kamera turun rendah dari selatan.
- Isi brief: screenshot desktop/mobile, tab **Live feed** (iframe sandbox, dimuat hanya saat diklik), stack, probe
  + alasan pemilihannya, Launch/Source, prev/next.

| Aksi | Hasil |
|---|---|
| Klik beacon / baris panel / kartu / `open m-0x` di terminal | Buka brief |
| `←` `→` | Misi sebelumnya/berikutnya |
| `Esc` | Tutup brief |

## 4. Permukaan Mars — mendarat & berjalan

File: `src/surface/`, `three/SurfaceSites.tsx`, `hud/SurfaceHud.tsx`.

- Situs = misi yang punya `landing`: **M-06 HMS Simulation → Gale Crater**, **M-08 Mud Monitor → Meridiani Planum**.
  Terrain dari model elevasi NASA; ladang minyak, batu, warna, dan langit bersifat artistik.
- Alur: `land(i)` → Mars berputar, kamera turun (`live.surfaceIn`) → debu (`--dive`) → `walking=true` →
  `SurfaceWalk` (jatuh dari ±250 m, mendarat lembut 3,2 dtk).
- Di tanah: ladang pump jack (rig utama dengan hotspot + rig lain), misi lain diparkir sebagai model NASA/beacon;
  klik pin/label → brief terbuka di atas medan. Panel situs: brief, **Next site**, kembali ke orbit, jarak + arah.

| Desktop | HP |
|---|---|
| `W A S D` / panah = jalan · drag = lihat · `Shift` = lari · `Space` = lompat (0,38 g) · `Q`/`E` = belok · `Esc` = ke orbit | drag = lihat · tahan tombol **▲ Walk** |

Kualitas medan per tier (`QUALITY` di `SurfaceWalk.tsx`): high 150×224 ring, tekstur 1k, bayangan 1024; low 84×128,
512, tanpa bayangan.

## 5. AR View

File: `src/ar/` (lazy chunk). Dibuka dari tombol **AR View** atau perintah `ar`.

- Kamera belakang di belakang canvas transparan; Mars melayang ±1,6 m di arah HP saat AR dibuka; rotasi dilacak
  (bukan posisi). Drag memutar Mars, pinch/scroll zoom. Tombol Recenter, kamera on/off.
- Fallback: kamera ditolak → latar bintang; tanpa gyro (laptop) → drag untuk melihat.
- iOS: **AR Quick Look** `public/ar/mars.usdz` dan `pump-jack.usdz` (`QUICK_LOOK` di `arSupport.ts`).
- Butuh HTTPS (`npm run dev:phone` atau produksi). Belum dites di HP asli (lihat `implementasi.md` Fase 3).
- `Esc` menutup AR.

## 6. Section konten

Urutan di `App.tsx`: Missions (02) · Profile/Pilot dossier (03) · Mission log/Flight record (04, kapsul zero-g,
filter) · Crew record (05) · Tech arsenal (06, tanpa persentase karangan) · Terminal (07) · Comms (08) · Credits.
Isi dari `src/data/record.ts` dan `profile.ts`.

## 7. Terminal

`hud/Terminal.tsx` — embedded di section #terminal dan overlay (`/`). Riwayat `↑/↓`, `Tab` completion, `Esc` tutup overlay.

Perintah: `help` `whoami` `status` `objective` `missions` `open <m-01…m-08>` `skills` `contact` `cv` `ar`
`sample bennu` (buka M-06) `pilot` `clear` `exit`.

## 8. Mode ringan & fallback

| Kondisi | Perilaku |
|---|---|
| Lite mode (tombol di dock) | Scene render on-demand (gambar diam), probe berhenti berputar; disimpan di `localStorage` |
| `prefers-reduced-motion` | Tanpa intro, tanpa auto-rotate/parallax berlebih |
| Tanpa WebGL | `html.no-webgl` → planet CSS, tanpa intro |
| FPS < 38 selama 3 dtk | Tier turun `high → mid → low` + DPR turun |
| Tier awal | ≤4 core → `low`; layar sentuh → `mid`; lainnya `high` (`main.tsx`) |
| In-app browser (IG, LINE, …) | Terdeteksi `IS_IN_APP_BROWSER` (gyro/kamera sering diblokir) |
