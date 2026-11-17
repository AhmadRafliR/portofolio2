# implementasi.md — Portofolio "RAFLI // MARS MISSION CONTROL"

> Web portofolio interaktif Ahmad Rafli Ramadhan dengan gaya HUD mission-control, Mars 3D sebagai pusat landing page, mode **AR Gyroscope** (kamera HP + sensor gerak), dan model 3D NASA dari project SPHEREx (NASA Space Apps 2026) yang tampil sebagai elemen HUD.
>
> Status dokumen: **rencana, belum ada kode**. Prioritas #1 = **landing page**.

---

## 0. Ringkasan Keputusan

| Hal | Keputusan |
|---|---|
| Konsep | Kamu = "pilot" yang mengorbit Mars. Tiap project = **misi** (satelit/beacon yang mengorbit Mars). Seluruh UI = HUD kokpit. |
| Hero / landing | Mars 3D (tekstur NASA + normal map) di tengah, starfield, beacon project mengorbit, frame HUD di atasnya. |
| Model NASA | **Tidak** jadi objek utama di scene. Tampil kecil, berputar, di dalam panel HUD (ikon misi, widget status, loader). |
| AR Gyroscope | 3 level: (1) parallax gyro di landing, (2) **Camera AR** = kamera belakang + Mars melayang di ruangan, disetir gyro, (3) iOS AR Quick Look `mars.usdz`. WebXR Android = opsional (stretch). |
| Stack | Vite 6 + React 19 + TypeScript + React Three Fiber 9 + drei 10 + three 0.186 + zustand 5 + Tailwind CSS v4 + motion (framer-motion). **Versi disamakan dengan `arvr/`** supaya kode bisa di-port langsung. |
| Konten | Semua teks ada di DOM (bukan di canvas) → SEO, screen reader, dan "Mode Ringan" tetap jalan. |
| Bahasa situs | **English** (seluruh UI & copy). Dokumen ini tetap Bahasa Indonesia. |
| Jumlah misi | **8**: IPFEST 2027, CarbonCapex, Wispril 2026, Pantra, SPHEREx XR (Helios), HMS Simulation, KaryaSupply, Automated Mud Monitor. |
| Deploy | Vercel (HTTPS wajib: kamera & gyro iOS hanya jalan di secure context). |

---

## 1. Sumber yang Dipakai

### 1.1 CV (konten utama)
- Mahasiswa **Teknik Perminyakan ITB** (2025–sekarang), SMAN 14 Bekasi (2022–2025), Bandung.
- Kontak publik: email di CV, LINE `@kinantibs_`, GitHub `@AhmadRafliR`.
- Organisasi inti:
  - **IATMI SM ITB** — Web Development Staff (2026–sekarang): web resmi, UI/UX + FE responsif landing page event, CMS, integrasi pendaftaran event.
  - **BFA FTTM ITB** — Staff Divisi Kreatif (Mar–Mei 2026): UI/UX Figma, visual design system angkatan.
  - **IT CLUB SMAN 14 Bekasi** — Pendiri & Ketua Umum Pertama (2023–2024).
  - **LAKNAT 164** — Staff Logistik (2025–2026).
  - Lainnya: Staff WebDev IPFEST 2027, Staff IT Wisuda April ITB 2026, Staff IT OGG ITB 2026, Web Developer FOURTEEN CUP 5.0, Staff Kreatif PEMIRA HTMM "PATRA", dll.
- Prestasi & kompetisi: NASA Space Apps Challenge SPHEREx 2026, Pilot Project GarudaHacks 7.0 2026, FE & UI/UX Itechno 2026, Semifinalis National Business Plan Competition 2025, Perunggu Fisika Dewa Edu 2024, Perunggu Biologi OPN ke-2 2022, OSN-K Fisika 2023 & 2024, Case Connect 2026, CBF 2026 UM, LOGIKA UI 2025, Lulusan Terbaik (L) SMPN 21 Bekasi 2022.
- Sertifikasi: Intro to Data Analytics (RevoU 2026), AI for Work & Career Readiness (Hacktiv8 2026).
- Skill: HTML, CSS, Tailwind, React, JavaScript, Bootstrap 5, AI/ML, AI Workflow, Figma, GitHub, VS Code, Office, Google Workspace. Bahasa: Indonesia, English, Japanese.

### 1.2 README GitHub (tone & copy)
Dipakai untuk vibe & copy: "Neural Profile", "Core Matrix", "Tech Arsenal", "Current Operations", "Terminal Mode", warna cyan `#00D9FF`, font **Share Tech Mono**. Project tambahan dari README: **HMS Simulation** (Python, Darcy's Law, advection-diffusion), **KaryaSupply** (B2B supply chain), **Automated Mud Monitor** (deteksi kick).

### 1.3 Misi (project) — stack terverifikasi
Sumber: repo publik https://github.com/AhmadRafliR (README + `package.json`), plus HTML/bundle situs live. Dicek **2026-11-18**: semua URL live merespons `HTTP 200`, dan **tidak ada** `X-Frame-Options` / CSP `frame-ancestors` → iframe "LIVE FEED" boleh (tetap dicek ulang sebelum deploy).

| # | Project | URL / Repo | Peran | Stack (terverifikasi) | Highlight untuk copy |
|---|---|---|---|---|---|
| M-01 | **IPFEST 2027** | https://ipfest2027.com/ · repo `WebDevIPFEST2027` (fork dari `fdefary/WebDevIPFEST2027`) | Web Dev Staff (FE) | HTML, CSS/SCSS, JavaScript, Bootstrap, Webpack + Babel, Firebase (Auth, Firestore, Storage, Hosting, Cloud Functions), Chart.js; ada Three.js di halaman | Situs event lengkap: landing, auth peserta, info kompetisi, halaman admin/operasional |
| M-02 | **CarbonCapex** | https://carboncapex.vercel.app/ · repo `carboncapex` | Builder (lomba) | Next.js 16, React 19, TypeScript, Tailwind v4, Zustand, lucide-react; AI advisor via **Gemini API** (`/api/chat`) | Decarbonization capital allocation: Scope 1/2 baseline, NPV/payback/CRF, optimizer kombinatorial 2ⁿ, 11 self-test, label data Actual/Estimate/Simulated; AI chat advisor dengan fallback engine analitis lokal kalau API key tidak ada |
| M-03 | **Wispril 2026** | https://wispril2026.wisudaitb.id/ | Design + FE | React (Vite build), React Router, Supabase | Web Parade Wisuda April ITB 2026 |
| M-04 | **Pantra** | https://pantra-inky.vercel.app/ | Builder (lomba) | Next.js; Edge AI computer vision (kamera HP warung) + LLM assistant, QR ID | Deposit-refund botol plastik: botol dipindai AI, saldo rupiah masuk instan ke warga & komisi ke warung; kalkulator insentif |
| M-05 | **SPHEREx XR — AR Cosmic Expedition (Helios)** | https://helios-cosmic-explorer.vercel.app/explorer | NASA Space Apps Challenge 2026 | React 19, Vite, TypeScript, React Three Fiber, drei, @react-three/xr (WebXR), three.js, Zustand | Eksplorasi tata surya & data SPHEREx dalam WebXR/AR, gyro "magic window", Camera AR, AR Quick Look iOS |
| M-06 | **HMS Simulation** | _belum ada repo publik_ | Solo | Python; Darcy's Law + advection-diffusion | Simulasi 2D modular migrasi minyak & gas |
| M-07 | **KaryaSupply** | https://karya-supply-dummy.vercel.app/ · repo `KaryaSupplyDummy` | Web architecture + business design | HTML + Tailwind (prototype) | "B2B Local Procurement OS" — supply chain berbasis klaster; roles + value proposition canvas |
| M-08 | **Automated Mud Monitor** | _belum ada repo/URL publik_ | Solo | HTML visualization + prototype | Deteksi *well kick* di operasi hulu migas |

Catatan:
- **Pantra**: `<title>` situsnya masih "Create Next App" — sebaiknya diganti di repo Pantra (di luar scope portofolio). Angka statistik di landing Pantra (Rp5 M, 519.450 botol, dll.) **jangan** dikutip di portofolio kecuali itu data nyata.
- **CarbonCapex AI agent**: kode memanggil Gemini dengan `GEMINI_API_KEY`; aku tidak memanggil endpoint-nya, jadi status "AI aktif" belum dibuktikan. Copy portofolio: "Gemini-powered advisor with a deterministic local fallback".
- **M-06 & M-08** tanpa link: tampil sebagai misi `STATUS: OFFLINE ARCHIVE` dengan deskripsi + screenshot/diagram (minta aset ke kamu, lihat §13).
- Repo lain yang layak masuk **Mission Log** (bukan misi utama, kecuali kamu mau): **BantuCepat** (GarudaHacks 7.0 — TypeScript, Bun monorepo, Gemini, Supabase, PostGIS, Leaflet) dan **Choke Size Imputation ML** (Python/Jupyter, Linear Regression, Random Forest, XGBoost, data lapangan Volve).

### 1.4 Project SPHEREx (`C:\projek\integrasi spherex\mainProjectSPHRX\arvr`)
Sudah dicek. Aset & kode yang relevan:

**Aset (`arvr/public/`)**
| File | Ukuran | Dipakai untuk |
|---|---|---|
| `textures/mars.jpg` | 950 KB | Tekstur warna Mars (credit: NASA 3D Resources, Viking-era global colour mosaic, public domain — dari `provenance.json`) |
| `textures/mars_normal_1k.png` / `_2k.png` | 987 KB / 3.7 MB | Relief Mars (1k mobile, 2k desktop) |
| `textures/mars_elevation.jpg` | 296 KB | Opsional: displacement halus / topografi HUD |
| `textures/space/starmap_1k/2k/4k.jpg` | 59 KB / 320 KB / 1.7 MB | Skybox bintang |
| `ar/mars.usdz` | 1.2 MB | iOS AR Quick Look |
| `models/perseverance.glb` | 4.9 MB | HUD M-04 Pantra |
| `models/curiosity.glb` | 4.2 MB | HUD M-01 IPFEST |
| `models/ingenuity.glb` | 2.0 MB | HUD M-02 CarbonCapex |
| `models/osiris-rex.glb` | 1.3 MB | HUD M-07 KaryaSupply |
| `models/lunar-module.glb` | 0.7 MB | HUD M-03 Wispril |
| `models/opportunity.glb` | 36 KB | HUD M-08 Mud Monitor + maskot status/loader (paling ringan) |
| `models/bennu.glb` | 3.5 MB | HUD M-06 HMS + easter egg terminal (lazy) |

**Kode yang di-port (bukan di-copy mentah — disederhanakan untuk portofolio)**
| File asal (`arvr/src/xr/`) | Isi | Jadi apa di portofolio |
|---|---|---|
| `GyroControls.tsx` | Quaternion "magic window" dari `DeviceOrientationEvent`, heading awal = forward, fallback ke touch 2 dtk tanpa data | `src/ar/GyroCamera.tsx` (mode AR) + basis `useGyroParallax` |
| `device.ts` | `detectCaps()`, `requestGyroPermission()` (iOS butuh gesture) | `src/ar/device.ts` (hampir 1:1) |
| `cameraAr.ts` | start/stop Camera AR | `src/ar/cameraAr.ts` |
| `CameraFeed.tsx` | `getUserMedia` kamera belakang, stop saat unmount | `src/ar/CameraFeed.tsx` (hampir 1:1) |
| `arSupport.ts` | deteksi iOS/Android/in-app browser, `quickLookUrl()` | `src/ar/arSupport.ts` |
| `holo.tsx` | palet & shader "holographic mission-control" (`teal #4fe3d6`, `amber #ffb54a`, `violet #8f7cff`) | inspirasi shader rim-glow & orbit ring |
| `marsTime.ts` | waktu Mars | widget **SOL** di telemetry bar (cek isi file saat port) |
| `quality.ts` / `QualityGovernor.tsx` | tier kualitas | versi ringkas: `src/three/quality.ts` |

**Design token dari `arvr/src/styles.css`** (supaya "mirip-mirip" dengan app AR/VR-nya):
```
--bg #05060f · --panel rgba(11,16,32,.92) · --line rgba(143,180,255,.25)
--text #eef2ff · --muted #aab4cc · --accent #2f6fed · --fact #4fd1ff
--ease-out cubic-bezier(.16,1,.3,1) · --dur-fast 160ms · --dur-mid 280ms · --dur-slow 520ms
--glow 0 0 0 1px rgba(79,227,214,.35), 0 8px 28px rgba(79,227,214,.18)
```

---

## 2. Konsep Pengalaman (User Journey)

```
[INTRO · PARTICLE PORTRAIT]  ±6 dtk, skip-able, sekali per sesi  (detail §2.1)
   Pusaran ribuan "helai" partikel (gaya shinigami.gg) → menyusun WAJAH RAFLI
   → wajah terurai jadi bola → bola berwarna Mars → diganti mesh Mars asli.
   Teks bawah-kiri: "Mission Pilot / Ahmad Rafli Ramadhan." + progress UPLINK (loading aset nyata).
   Terminal boot lama dilebur ke sini sebagai 2–3 baris log kecil.
        │  (partikel → Mars: transisi tanpa potong)
        ▼
[LANDING / ORBIT]  ← fokus utama
   Mars berputar pelan, 8 beacon misi mengorbit, HUD terpasang.
   Desktop: mouse = parallax kamera. Mobile: tombol "ENABLE GYRO" → miringkan HP = parallax.
   CTA: [ VIEW MISSIONS ]  [ AR VIEW ]  [ DOWNLOAD CV ]
        │ scroll / klik beacon
        ▼
[MISSIONS]  kamera terbang ke beacon → panel HUD detail (screenshot, peran, stack, LAUNCH ↗)
        ▼
[PILOT PROFILE] [MISSION LOG] [CREW RECORD] [TECH ARSENAL] [TERMINAL] [COMMS] [CREDITS]
   Canvas tetap fixed di belakang (redup), kamera berpindah "chapter" sesuai section aktif.

[AR VIEW] (overlay full-screen)
   Kamera belakang HP jadi background, Mars melayang ±1.5 m di depan, HP digerakkan = lihat sekeliling.
   iPhone: tombol tambahan "Lihat di ruanganmu" → AR Quick Look mars.usdz.
```

### 2.1 Intro — Particle Portrait (referensi gaya: shinigami.gg)

Yang diambil dari referensi **hanya tekniknya**: ribuan goresan halus seperti bulu/kuas yang mengalir di flow field, latar hitam pekat, aksen warna pada sebagian kecil helai, sticker tag kecil, blok teks + angka besar di kiri bawah. Bentuk, logo, tag, dan teks shinigami **tidak** ditiru. Bentuk utamanya wajahmu, lalu berubah jadi Mars.

**Sumber gambar:** `assets/source/rafli-portrait.png` (foto yang kamu kirim, sudah disalin ke project, 324×318 px, latar putih, crop lingkaran).
> Resolusi 324 px masih cukup untuk ±25k partikel, tapi detail mata/rambut akan lebih tajam dengan foto asli ≥1024 px (lihat §13). Pipeline-nya sama, tinggal ganti file.

#### 2.1.1 Storyboard (timeline ±6 dtk, total bisa di-skip)
| t (dtk) | Fase | Yang terlihat | Uniform utama |
|---|---|---|---|
| 0.0–0.4 | `VOID` | Hitam, 1 titik cahaya amber di tengah, teks kiri bawah fade-in | — |
| 0.4–1.8 | `VORTEX` | Helai meledak keluar → pusaran bola berputar (mirip referensi), putih-abu dengan ±8% helai amber `#ffb54a` dan ±3% cyan `#00d9ff` | `uChaos=1` |
| 1.8–3.2 | `FORM` | Helai mengalir ke posisi wajah; arah tiap helai mengikuti kontur (rambut jadi goresan panjang, kulit goresan pendek) | `uMorph 0→1` (ease-in-out, tiap partikel ada delay acak 0–0.4 dtk) |
| 3.2–4.4 | `HOLD` | Wajah "bernapas" (noise kecil), kursor/jari mendorong helai (repulsi), tag `火星` (Mars, bahasa Jepang) menempel di kanan bawah | `uPointer`, `uBreath` |
| 4.4–5.4 | `TO MARS` | Helai terurai melingkar ke permukaan bola, warna berubah ke warna tekstur `mars.jpg` di titik itu | `uSphere 0→1` |
| 5.4–6.0 | `HANDOFF` | Mesh Mars asli fade-in di posisi & ukuran yang sama, partikel fade-out, HUD "lock-on" masuk → landing | `uFade 1→0` |

- Sekali per sesi (`sessionStorage`), tombol `SKIP INTRO ▸` + klik/Enter/Esc → langsung ke `HANDOFF`.
- Kalau aset landing belum selesai dimuat saat `HOLD` berakhir, `HOLD` diperpanjang (maks 3 dtk). Progress UPLINK = progress loading **nyata** (`useProgress` drei), bukan angka palsu.
- `prefers-reduced-motion` → tanpa animasi: potret statis (versi titik, sudah dirender) fade 400 ms ke landing.

> **Revisi 2026-11-18 (feedback):** intro tidak lagi pindah otomatis. Part 1 berakhir di potret tajam (duotone, muncul lewat dissolve dengan tepi amber) dengan **mata menyala** dan helai sisa jadi percikan emas/cyan, lalu **diam menunggu**. Part 2 baru jalan saat pengunjung scroll/swipe ke bawah (atau ↓/Space/Enter/klik "Scroll to launch"): potret ter-dissolve → helai jadi bola Mars → Mars + HUD muncul bertahap (telemetri → pilot card → mission panel → dock). Ikon GitHub, LinkedIn, WhatsApp ada di kanan bawah intro, di dock, dan (mobile) di pilot card.

#### 2.1.2 Layout intro
```
┌──────────────────────────────────────────┐
│                                [SKIP ▸]  │
│          ░▒▓ helai partikel ▓▒░          │
│        ▒▓   membentuk WAJAH   ▓▒         │
│        ▓▒                      ▒▓  ┌──┐  │
│          ▒▓▒░             ░▒▓▒     │火│  │ ← tag amber, rotasi -6°
│              ░▒▓▓▓▓▓▓▓▒░           │星│  │
│                                    └──┘  │
│ Mission Pilot                            │ ← serif kecil, amber, letter-spacing
│ Ahmad Rafli Ramadhan.                    │ ← H1 tebal, titik warna amber
│ Frontend developer · UI/UX · Petroleum   │
│ Engineering @ ITB.                       │
│ UPLINK · MARS ORBIT                      │
│ 087 %   TX 12.4 MB   SOL 54xxx   T-02    │ ← angka besar tabular, angka terakhir amber
└──────────────────────────────────────────┘
```
Mobile: wajah di 55% atas layar, blok teks di bawah (persis susunan referensi di tablet).

#### 2.1.3 Pipeline data wajah (offline, sekali build)
Script `scripts/build-portrait-field.mjs` (Node + `sharp`), input `assets/source/rafli-portrait.png`:
1. Resize ke 512 px, grayscale, sedikit blur (σ 0.8).
2. **Mask**: buang piksel latar (luminance > 0.92 **atau** di luar lingkaran crop). Hasil = siluet kepala + bahu.
3. **Sobel** → besar gradien `g` dan arah `θ`. Arah helai = tegak lurus gradien (sejajar kontur).
4. **Sampling berbobot**: peluang dipilih ∝ `0.55·(1−luminance) + 0.45·g` → rambut/jaket gelap & garis wajah dapat lebih banyak helai, pipi terang lebih jarang (seperti sketsa).
5. Per partikel simpan: `x, y` (dinormalisasi −1..1), `tone` (0..1), `angle`, `len` (rambut/jaket = panjang, area wajah = pendek), `seed`.
6. Output: `public/intro/portrait-field.dat` (Int16 terkuantisasi, 3 tier: 30k / 18k / 9k partikel; ±180 KB untuk tier terbesar) + `portrait-dots.webp` (render statis untuk reduced-motion / fallback).
7. Target bola Mars: titik dibagi rata di permukaan bola (Fibonacci sphere), warnanya diambil dari `mars.jpg` (UV equirectangular) → masuk ke file yang sama.

#### 2.1.4 Render (GPU, tanpa update per partikel di CPU)
- `InstancedBufferGeometry`: 1 quad tipis per helai (lebar 1–1.5 px, panjang `len`), attribute dari file `.bin`.
- **Vertex shader** menghitung posisi dari waktu (deterministik):
  `p = mix(vortex(seed, t), facePos, uMorph)` → `mix(p, spherePos, uSphere)` + `curlNoise(p, t)·(1 − 0.85·uMorph)` + repulsi pointer.
  Quad diputar sesuai `angle` (fase FORM/HOLD) atau arah kecepatan (fase VORTEX) → kesan goresan mengalir.
- **Fragment**: gradien alpha di sepanjang helai (ujung memudar), warna = `tone` (putih→abu), helai aksen amber/cyan berdasarkan `seed`; fase `TO MARS` → `mix(warnaTone, marsColor, uSphere)`.
- Blending normal + sedikit additive untuk helai aksen; bloom ringan hanya tier `high`.
- Kamera & posisi bola akhir **sama persis** dengan Mars di landing (§3.4) → handoff mulus tanpa potong.
- Dijalankan di `<Canvas>` yang sama dengan landing (satu WebGL context); komponen intro di-unmount setelah `HANDOFF` supaya memori lepas.

#### 2.1.5 Interaksi intro
| Input | Efek |
|---|---|
| Mouse/jari bergerak | Helai di sekitar kursor terdorong lalu kembali (radius ±0.15 layar) |
| Gyro (kalau sudah diizinkan sebelumnya di sesi ini) | Wajah sedikit miring/parallax |
| Klik / tap wajah | Riak gelombang dari titik tap |
| `SKIP ▸`, Enter, Esc | Lompat ke `HANDOFF` |

#### 2.1.6 Budget & tier
| Tier | Partikel | Catatan |
|---|---|---|
| high (desktop GPU bagus) | 30k | bloom aktif |
| mid (laptop/HP flagship) | 18k | tanpa bloom |
| low (HP menengah/bawah, `PerformanceMonitor` turun) | 9k | aksen cyan dimatikan |
| reduced-motion / WebGL gagal | 0 | gambar `portrait-dots.webp` statis |

Target: intro mulai bergerak < 1 dtk setelah HTML tampil (shader + `.bin` ±180 KB dimuat duluan, aset landing menyusul di belakang).

---

## 3. Landing Page — Spesifikasi Detail

### 3.1 Wireframe desktop (≥1024px)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◤ RAFLI-01 · MARS ORBIT      WIB 14:22:07 · SOL 54xxx · α 012° β 004° γ -02° ◥│ ← TelemetryBar
│                                                                              │
│ ┌─ PILOT ─────────────┐                               ┌─ ACTIVE MISSIONS 8 ┐ │
│ │ AHMAD RAFLI RAMADHAN│            . ·  ✦    ◉M-06      │ [model] M-01 IPFEST│ │
│ │ > Frontend Developer│        ·   ╭───────╮   ◉M-02    │ [model] M-02 Carbon│ │
│ │   (typing rotator)  │   ◉M-01  ╱  MARS   ╲            │ [model] M-03 Wispr │ │
│ │ Petroleum Eng · ITB │  ◉M-07│  (3D)  ⌖  │  ◉M-03     │ [model] M-04 Pantra│ │
│ │ [VIEW MISSIONS]     │        ╲         ╱      ◉M-08   │  ‹ 1/2 ›  next 4   │ │
│ │ [AR VIEW] [CV ↓]    │    ◉M-05 ╰───────╯  ◉M-04       └────────────────────┘ │
│ └─────────────────────┘                                                      │
│ ◣ [opportunity] SYS NOMINAL · FPS 60 · GYRO OFF     scroll ▼ ·  > _ terminal ◢│ ← StatusDock
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Wireframe mobile (<768px)
```
┌──────────────────────────┐
│ RAFLI-01    WIB 14:22 ◥  │
│                          │
│        ╭───────╮  ◉      │  Mars ~70% lebar layar
│   ◉   │  MARS  │         │
│        ╰───────╯   ◉     │
│                          │
│ AHMAD RAFLI RAMADHAN     │
│ > UI/UX Designer_        │
│ [ENABLE GYRO] [AR VIEW]  │
│ [VIEW MISSIONS ▼]        │
│ ◣ SYS NOMINAL · GYRO ON ◢│
└──────────────────────────┘
Panel "ACTIVE MISSIONS" pindah ke section bawah sebagai carousel horizontal (snap).
```

### 3.3 Elemen HUD (DOM, di atas canvas)
| Komponen | Isi | Detail |
|---|---|---|
| `HudFrame` | Corner bracket 4 sudut, garis grid tipis, scanline CSS (opacity 0.04), noise | `pointer-events:none`; bracket animasi "lock-on" saat load |
| `TelemetryBar` | Callsign `RAFLI-01`, jam WIB (live), **SOL** Mars, α/β/γ gyro (atau koordinat mouse kalau desktop) | Font Share Tech Mono, angka `tabular-nums` |
| `Reticle` | Crosshair di tengah Mars + label `TARGET: MARS · 3389.5 km` | Berputar lambat; mengecil saat hover beacon |
| `PilotCard` | Nama, typing rotator (4 role dari README), kampus, 3 CTA | Typing pakai komponen sendiri (bukan readme-typing-svg) |
| `MissionList` | 8 misi (4 per halaman), masing-masing ada **viewport 3D mini** model NASA | Hover baris = beacon di scene ikut highlight (state zustand bersama) |
| `StatusDock` | Maskot Opportunity mini, `SYS NOMINAL`, FPS, status gyro, tombol terminal | Kalau quality turun → `SYS DEGRADED · LITE MODE` |
| `BeaconLabel` | Label tiap beacon (drei `<Html>` atau DOM projected) | Garis leader dari beacon ke label |

### 3.4 Scene 3D landing (`<Canvas>` fixed full-screen)
- **Mars**: `SphereGeometry(1, 128, 128)` (64 di mobile), `MeshStandardMaterial` map=`mars.jpg`, normalMap=`mars_normal_1k/2k`, roughness 1. Rotasi sumbu 25.19° (kemiringan sumbu Mars asli), putaran lambat.
- **Atmosfer**: sphere kedua scale 1.04, shader fresnel additive warna `#ff9a6b → #4fe3d6` di tepi (gabungan "Mars dust" + teal HUD).
- **Orbit ring**: 1–2 `Line` lingkaran tipis dengan tick marks (gaya `holo.tsx`), miring ±15°.
- **Beacon misi (8)**: titik bercahaya (sprite + pulse ring) di 2 ring orbit — ring dalam = M-01…M-05, ring luar = M-06…M-08 (HMS, KaryaSupply, Mud Monitor). Warna: deployed = teal, offline archive = amber. Klik/tap → `focusMission(id)`.
- **Starfield**: sphere besar BackSide dengan `starmap_2k.jpg` (1k di mobile) + ±800 partikel bintang twinkle.
- **Cahaya**: 1 directional (matahari) dari kiri-atas + ambient rendah → sisi malam Mars gelap, dramatis.
- **Post-processing**: Bloom ringan (hanya desktop tier tinggi). Tidak wajib di MVP.
- **Kamera**: `PerspectiveCamera fov 40`, posisi `[0, 0.3, 4.2]` desktop, `[0, 0.2, 5.4]` mobile. Mars digeser ke kanan sedikit di desktop supaya PilotCard punya ruang.

### 3.5 Interaksi landing
| Input | Efek |
|---|---|
| Mouse move (desktop) | Parallax kamera ±6° (lerp 0.06), HUD bracket bergeser 4–8 px berlawanan arah (depth) |
| Tilt HP (gyro on) | Parallax yang sama dari β/γ, clamp ±12°, smoothing; angka α/β/γ tampil di TelemetryBar |
| Drag | Putar Mars manual (inersia), lepas → kembali auto-rotate |
| Hover/tap beacon atau baris misi | Highlight + label + beacon membesar |
| Klik beacon | Kamera fly-to (0.9 s, ease-out) → scroll ke `#missions` dan buka detail misi itu |
| Scroll | Section berikutnya muncul; canvas tetap, Mars mengecil & bergeser (lihat §5) |
| Ketik `/` | Buka terminal overlay |

### 3.6 Copy landing (English, draft)
- Eyebrow: `PILOT // RAFLI-01 · MARS ORBIT`
- H1: **Ahmad Rafli Ramadhan**
- Rotator: `Frontend Web Developer` · `UI/UX Designer & Figma Explorer` · `Python Simulation Builder` · `Petroleum Engineering Student @ ITB`
- Sub: "Bridging complex physical systems and interactive digital experiences."
- Stat strip: `8 MISSIONS` · `NASA SPACE APPS 2026` · `ITB · PETROLEUM ENG.`
- CTA: `VIEW MISSIONS` · `AR VIEW` · `DOWNLOAD CV`
- Gyro prompt (mobile): "Tilt your phone to steer the orbit." → tombol `ENABLE GYRO`
- AR prompt: "Point your camera at the room. Mars will appear in front of you."

---

## 4. Model NASA sebagai HUD

### 4.1 Pemetaan model ↔ misi
Ada 8 misi dan 7 model `.glb`. SPHEREx XR tidak memakai `.glb` — misi itu memakai hologram **all-sky survey** prosedural (bola langit + pita spektrum), cocok karena SPHEREx adalah teleskop survei seluruh langit (diberi label "illustrative").

| Misi | Model | Alasan (tooltip "why this probe", English di situs) |
|---|---|---|
| M-01 IPFEST 2027 | **Curiosity** | Geology rover with a rock drill → petroleum festival |
| M-02 CarbonCapex | **Ingenuity** | Autonomous flyer → AI advisor that reasons on its own |
| M-03 Wispril 2026 | **Lunar Module** | A landing → graduation day |
| M-04 Pantra | **Perseverance** | Camera-driven inspection + caches sample tubes → AI bottle check & deposit |
| M-05 SPHEREx XR | _procedural all-sky hologram_ | SPHEREx maps the whole sky in 102 colours |
| M-06 HMS Simulation | **Bennu** | Porous rubble-pile rock → fluid migration through porous media |
| M-07 KaryaSupply | **OSIRIS-REx** | Pick-up & return logistics → B2B procurement |
| M-08 Mud Monitor | **Opportunity** | Long-lived monitoring rover → continuous kick detection |
| StatusDock / loader | **Opportunity** (36 KB, aset sama dengan M-08, cached) | Ringan, aman dimuat duluan |
| Terminal easter egg `$ sample bennu` | **Bennu** (aset sama dengan M-06) | Membuka misi HMS |

### 4.2 Teknik render (penting untuk performa)
- **Satu WebGL context saja.** Semua viewport mini di panel HUD pakai `@react-three/drei` `<View>` + `<View.Port />` di canvas utama. Jangan bikin `<Canvas>` per kartu (HP bisa kehabisan context / lag).
- Tiap viewport: `<Stage>`-like lighting sederhana, model di-`Center` + `Bounds fit`, auto-rotate 0.4 rad/s, wireframe overlay tipis teal (gaya hologram) via material override opsional.
- Model dimuat **lazy**: hanya saat panel terlihat (IntersectionObserver) — kecuali Opportunity.
- Dengan 8 misi: desktop menampilkan **4 viewport model sekaligus** (list scroll/paging 4+4); mobile carousel hanya me-render model kartu aktif ±1. Maksimal 4 `<View>` aktif bersamaan.
- Fallback: kalau WebGL mati / Lite Mode → gambar `.webp` hasil render model (dibuat sekali via script, §7.3).

### 4.3 Optimasi model (wajib sebelum dipakai)
Model asli 0.7–4.9 MB terlalu berat untuk HUD kecil. Target **≤ 600 KB per model**, tekstur maks 512–1024 px.
```bash
npx @gltf-transform/cli inspect public/models/perseverance.glb
npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 1024 --simplify-ratio 0.5
```
- drei `useGLTF` sudah support Meshopt decoder → tidak perlu setup Draco.
- Cek visual setelah simplify; turunkan `--simplify-ratio` kalau rusak.
- Simpan hasil ke `public/models/hud/*.glb`, sumber asli tidak dibawa ke repo portofolio.

---

## 5. Section di Bawah Landing (scroll)

Canvas tetap `position: fixed`; tiap section punya "camera chapter" (posisi target kamera + skala Mars), dipicu IntersectionObserver.

| # | id | Judul HUD | Isi | Chapter kamera |
|---|---|---|---|---|
| 1 | `#orbit` | — (landing) | §3 | Mars penuh |
| 2 | `#missions` | `ACTIVE MISSIONS` | Grid/carousel 8 misi (filter: `ALL` · `WEB` · `AI/ML` · `ENGINEERING`) + detail panel | Kamera dekat beacon misi yang aktif |
| 3 | `#profile` | `NEURAL PROFILE` | Bio (dari README + CV), Core Matrix 4 poin, pendidikan | Mars kecil kanan, sisi siang |
| 4 | `#log` | `MISSION LOG` | Timeline prestasi & kompetisi (CV), filter: Kompetisi / Olimpiade / Sertifikasi | Mars di belakang, redup |
| 5 | `#crew` | `CREW RECORD` | Organisasi (IATMI, BFA, IT CLUB, LAKNAT, lainnya) dengan bullet ringkas | idem |
| 6 | `#arsenal` | `TECH ARSENAL` | Skill grid ikon (HTML, CSS, JS, React, Tailwind, Bootstrap, Python, Figma, Git, AI/ML) + bahasa | Starfield saja |
| 7 | `#terminal` | `TERMINAL MODE` | Terminal interaktif | idem |
| 8 | `#comms` | `COMMS` | Email, LINE, GitHub, LinkedIn (kalau ada), tombol CV | Mars kembali, zoom out |
| 9 | footer | `CREDITS` | Atribusi NASA + disclaimer | — |

### 5.1 Detail panel misi (`MissionDetail`)
```
┌─ M-02 · CARBONCAPEX ────────────── STATUS: DEPLOYED · 2026-11-18 ─┐
│ [viewport Ingenuity]   [screenshot desktop | mobile toggle]        │
│ ROLE     Builder · competition entry                               │
│ STACK    Next.js 16 · React 19 · TypeScript · Tailwind v4 ·        │
│          Zustand · Gemini API                                      │
│ BRIEF    Decarbonization capital allocation: compare CAPEX,        │
│          savings, payback and tCO2e before the budget is locked.   │
│ HIGHLIGHT ▸ Gemini-powered advisor chat with local fallback        │
│           ▸ Exact 2ⁿ portfolio optimizer · 11 built-in self-tests  │
│ [ LAUNCH ↗ ]  [ LIVE FEED ▸ ]  [ SOURCE ↗ ]                         │
└────────────────────────────────────────────────────────────────────┘
```
- **Screenshot** dibuat via Playwright script (§7.3), bukan hotlink.
- **LIVE FEED (iframe)**: per 2026-11-18 keenam URL live tidak mengirim `X-Frame-Options`/CSP → diizinkan. Tetap: iframe dimuat hanya setelah diklik, `loading="lazy"`, `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"`, dan cek ulang header sebelum deploy.
- **SOURCE ↗**: hanya untuk repo publik (CarbonCapex, KaryaSupplyDummy; IPFEST adalah fork organisasi — tanya dulu boleh ditautkan atau tidak).
- **Status**: field `status` + `checkedAt` diisi manual. M-06 & M-08 = `offline-archive` (tidak ada tombol LAUNCH, diganti `VIEW BRIEF`).

### 5.1a Copy misi (English, draft)
| Misi | One-liner |
|---|---|
| M-01 IPFEST 2027 | "Front-end for an international petroleum festival — event pages, participant auth and admin tools on Firebase." |
| M-02 CarbonCapex | "Decarbonization capital planner with an auditable optimizer and a Gemini-powered advisor." |
| M-03 Wispril 2026 | "Design and front-end for ITB's April 2026 graduation parade site." |
| M-04 Pantra | "Bottle-deposit platform: edge-AI scans plastic bottles at partner shops and pays out rupiah instantly." |
| M-05 SPHEREx XR | "NASA Space Apps 2026: explore the Solar System and SPHEREx sky data in WebXR and phone AR." |
| M-06 HMS Simulation | "Modular 2D oil and gas migration simulator in Python using Darcy's Law and advection-diffusion." |
| M-07 KaryaSupply | "B2B local procurement OS for cluster-based supply chains — architecture, roles and value proposition." |
| M-08 Mud Monitor | "Interactive visualization and prototype that flags well kicks during drilling." |

Peran persis di M-02 & M-04 (solo/tim, posisi) dan nama lombanya masih perlu kamu isi (§13).

### 5.2 Terminal Mode (`#terminal` + overlay `/`)
Perintah:
```
help            daftar perintah
whoami          ahmad_rafli — frontend developer | ui/ux explorer | engineering student
status          learning & building | merging engineering mechanics with web tech
objective       code, design, simulate, innovate.
missions        list 8 misi → `open m-02` membuka detail
skills          tech arsenal versi teks
contact         info komunikasi
cv              unduh CV
ar              buka AR VIEW
sample bennu    easter egg: model Bennu muncul di HUD → membuka misi HMS
clear / exit
```
History ↑/↓, autocomplete Tab, fokus trap saat overlay, `Esc` untuk tutup.

---

## 6. AR Gyroscope — Spesifikasi Teknis

### 6.1 Deteksi kemampuan
Port `device.ts` → `useDeviceCaps()` mengembalikan `{ gyro, gyroNeedsPermission, ar (WebXR), secure, camera }`. Tombol yang tidak didukung disembunyikan / diberi alasan ("Butuh HTTPS", "Buka di Chrome/Safari, bukan in-app browser" — pakai `IS_IN_APP_BROWSER`).

### 6.2 Level 1 — Gyro Parallax (landing)
- Tombol `ENABLE GYRO` (wajib dari tap; iOS 13+ pakai `DeviceOrientationEvent.requestPermission()`).
- Ambil β/γ awal sebagai baseline; offset = (β−β0, γ−γ0), clamp ±12°, smoothing exponential (`k = 1 - exp(-dt*6)`).
- Terapkan ke rig kamera (bukan ke Mars) + offset HUD bracket. Kompensasi `screen.orientation.angle` untuk landscape.
- Tanpa data 2 dtk → kembali ke mode touch + toast (perilaku sama dengan `GyroControls.tsx`).

```ts
// src/ar/useGyroParallax.ts (sketsa)
export function useGyroParallax(enabled: boolean, maxDeg = 12) {
  const target = useRef({ x: 0, y: 0 })
  const base = useRef<{ b: number; g: number } | null>(null)
  useEffect(() => {
    if (!enabled) return
    const on = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return
      base.current ??= { b: e.beta, g: e.gamma }
      const clamp = (v: number) => Math.max(-maxDeg, Math.min(maxDeg, v))
      target.current = { x: clamp(e.gamma - base.current.g), y: clamp(e.beta - base.current.b) }
      useHud.getState().setOrientation(e.alpha ?? 0, e.beta, e.gamma) // untuk TelemetryBar
    }
    window.addEventListener('deviceorientation', on)
    return () => window.removeEventListener('deviceorientation', on)
  }, [enabled, maxDeg])
  return target // dibaca di useFrame rig kamera
}
```

### 6.3 Level 2 — Camera AR (`AR VIEW`)
Overlay full-screen `ArView`:
1. Tap `AR VIEW` → `requestGyroPermission()` + `getUserMedia({ video: { facingMode: 'environment' } })` (port `CameraFeed.tsx`).
2. `<video>` full-screen di belakang, `<Canvas gl={{ alpha: true }}>` transparan di depan (scene tanpa background/starfield).
3. Kamera 3D disetir penuh oleh orientasi HP (port matematika quaternion `GyroControls.tsx`: Euler YXZ dari α/β/γ, kali `q1` (−90° di X), kompensasi orientasi layar, heading awal = forward).
4. Mars ditaruh di `(0, 0, -1.6)` relatif heading awal, radius visual ±0.35 m. Pinch = skala, drag = rotasi Mars.
5. HUD AR minimal: reticle, label `MARS · 1:20.000.000` (sesuaikan skala), tombol `RECENTER`, `CAPTURE` (screenshot canvas+video ke PNG, opsional), `EXIT`.
6. Model NASA tetap tampil kecil di pojok HUD (misal Perseverance) sebagai "companion".
7. Fallback berjenjang: kamera ditolak → background starfield + gyro; gyro ditolak → drag/OrbitControls; desktop → webcam opsional + mouse.
8. `stopCameraAr()` saat keluar: matikan semua track kamera.

> Catatan jujur: Camera AR ini **bukan** AR dengan tracking ruang (tidak ada deteksi lantai/posisi). Mars "menempel" di arah pandang awal, hanya rotasi yang dilacak. Untuk portofolio ini cukup dan jalan di hampir semua HP termasuk iPhone.

### 6.4 Level 3 — iOS AR Quick Look
Kalau `quickLookUrl('mars')` tidak null → tombol `LIHAT DI RUANGANMU` berupa:
```html
<a rel="ar" href="/ar/mars.usdz"><img src="/shots/mars-ar-thumb.webp" alt="Mars AR" /></a>
```
(iOS butuh `<img>` sebagai child langsung dari `<a rel="ar">`.)

### 6.5 Level 4 (stretch) — WebXR immersive-ar Android
Port `ARPlacement.tsx` + `@react-three/xr` (hit-test, tap untuk menaruh Mars di lantai). Dikerjakan hanya setelah MVP stabil.

### 6.6 Syarat & testing
- HTTPS wajib → dev pakai `@vitejs/plugin-basic-ssl` + `vite --host`, buka `https://<ip-laptop>:5173` dari HP di Wi-Fi sama.
- Wajib tes di device asli: 1 Android (Chrome) + 1 iPhone (Safari). Emulator desktop tidak cukup untuk gyro/kamera.

---

## 7. Arsitektur & Struktur Folder

### 7.1 Struktur
```
Portofolio/
├─ implementasi.md
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ vercel.json
├─ assets/source/rafli-portrait.png   # foto sumber intro (tidak ikut di-deploy)
├─ public/
│  ├─ textures/ mars.jpg, mars_normal_1k.png, mars_normal_2k.png, starmap_1k.jpg, starmap_2k.jpg
│  ├─ models/hud/ opportunity.glb, curiosity.glb, ingenuity.glb, lunar-module.glb, osiris-rex.glb, perseverance.glb, bennu.glb
│  ├─ ar/ mars.usdz
│  ├─ intro/ portrait-field.dat, portrait-dots.webp
│  ├─ shots/ ipfest-desktop.webp, ipfest-mobile.webp, … , models/*.webp (fallback)
│  ├─ cv/Ahmad-Rafli-Ramadhan-CV.pdf
│  └─ og.jpg, favicon.svg
├─ scripts/
│  ├─ copy-nasa-assets.mjs   # salin aset terpilih dari folder SPHEREx → public/
│  ├─ build-portrait-field.mjs # foto → data partikel wajah + target bola Mars (§2.1.3)
│  ├─ optimize-models.mjs    # gltf-transform optimize semua model HUD
│  └─ capture-shots.mjs      # Playwright: screenshot 6 situs live + render fallback model
└─ src/
   ├─ main.tsx, App.tsx
   ├─ styles/ tokens.css, hud.css, globals.css
   ├─ data/
   │  ├─ profile.ts      # nama, role, bio, kontak, pendidikan
   │  ├─ missions.ts     # 8 misi (schema §7.2)
   │  ├─ log.ts          # prestasi & sertifikasi
   │  ├─ crew.ts         # organisasi
   │  ├─ skills.ts
   │  └─ credits.ts      # atribusi NASA
   ├─ state/ useHud.ts   # zustand: activeMission, gyro, orientation, quality, chapter, liteMode
   ├─ three/
   │  ├─ SceneRoot.tsx   # Canvas fixed + View.Port + quality
   │  ├─ Mars.tsx, Atmosphere.tsx, Starfield.tsx, OrbitRings.tsx, Beacons.tsx
   │  ├─ CameraRig.tsx   # parallax mouse/gyro + chapter transitions + fly-to
   │  ├─ HudModel.tsx    # model NASA di dalam <View>
   │  └─ quality.ts
   ├─ ar/
   │  ├─ device.ts, arSupport.ts, cameraAr.ts
   │  ├─ useGyroParallax.ts, GyroCamera.tsx, CameraFeed.tsx
   │  └─ ArView.tsx
   ├─ hud/
   │  ├─ HudFrame.tsx, TelemetryBar.tsx, Reticle.tsx, StatusDock.tsx
   │  ├─ PilotCard.tsx, TypingRotator.tsx, MissionList.tsx, MissionDetail.tsx
   │  ├─ Terminal.tsx, Toast.tsx
   ├─ intro/
   │  ├─ ParticlePortrait.tsx   # instanced strands + timeline fase
   │  ├─ portrait.vert.glsl, portrait.frag.glsl, curlNoise.glsl
   │  ├─ loadField.ts           # baca .bin per tier
   │  └─ IntroOverlay.tsx       # teks kiri bawah, UPLINK %, tag 火星, SKIP
   └─ sections/
      ├─ Landing.tsx, Missions.tsx, Profile.tsx, MissionLog.tsx
      ├─ Crew.tsx, Arsenal.tsx, TerminalSection.tsx, Comms.tsx, Credits.tsx
```

### 7.2 Schema data misi
```ts
export interface Mission {
  id: `m-0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`
  code: string            // "M-02"
  name: string            // "CarbonCapex"
  category: ('web' | 'ai-ml' | 'engineering' | 'xr')[]
  url?: string            // live site
  repo?: string           // hanya repo publik yang boleh ditautkan
  role: string            // English: "Front-end developer" / "Design & front-end" / "Builder"
  context: string         // "IPFEST 2027 · IATMI SM ITB", "NASA Space Apps Challenge 2026", ...
  year: number
  stack: string[]         // dari §1.3 (terverifikasi)
  brief: string           // one-liner §5.1a + 1–2 kalimat
  highlights: string[]
  model: 'curiosity' | 'ingenuity' | 'lunar-module' | 'osiris-rex' | 'perseverance' | 'opportunity' | 'bennu' | 'sky-hologram'
  modelReason: string
  shots?: { desktop: string; mobile: string }
  iframeAllowed: boolean  // true untuk 6 URL live per 2026-11-18
  status: 'deployed' | 'offline-archive'
  checkedAt: string       // "2026-11-18"
  orbit: { ring: 'inner' | 'outer'; tilt: number; phase: number; speed: number } // posisi beacon
}
```

### 7.3 Script aset
- `copy-nasa-assets.mjs`: daftar file eksplisit (allowlist) dari `C:\projek\integrasi spherex\mainProjectSPHRX\arvr\public\…` → `public/`. Path sumber lewat env `SPHEREX_DIR` supaya tidak hard-code.
- `optimize-models.mjs`: loop `public/models/hud/*.glb` → `gltf-transform optimize` (§4.3), print ukuran sebelum/sesudah.
- `capture-shots.mjs`: Playwright (`playwright-core` + Chromium) buka 6 URL live (5 misi web + KaryaSupply) di 1440×900 dan 390×844, tunggu `networkidle`, simpan `.webp` (via `sharp`). Juga render tiap model HUD ke webp transparan untuk fallback.

### 7.4 State (zustand `useHud`)
`activeMission`, `hoverMission`, `chapter`, `gyroEnabled`, `orientation {a,b,g}`, `arOpen`, `quality ('high'|'mid'|'low')`, `liteMode`, `terminalOpen`, `bootDone`, `toast`.

---

## 8. Visual Design System

| Token | Nilai | Pakai untuk |
|---|---|---|
| `--bg` | `#05060f` | background |
| `--panel` | `rgba(11,16,32,.72)` + `backdrop-filter: blur(10px)` | panel HUD (glassmorphism, sesuai README) |
| `--line` | `rgba(143,180,255,.25)` | border panel, grid |
| `--hud` | `#00d9ff` | warna utama HUD (cyan README) |
| `--teal` | `#4fe3d6` | glow, status nominal (dari `holo.tsx`) |
| `--amber` | `#ffb54a` | warning, highlight Mars |
| `--violet` | `#8f7cff` | aksen sekunder |
| `--mars` | `#c1440e` | aksen Mars (dari `bodies.ts`) |
| `--text` / `--muted` | `#eef2ff` / `#aab4cc` | teks |
| Font HUD | **Share Tech Mono** (self-host via `@fontsource`) | label, angka, terminal |
| Font konten | **Space Grotesk** (atau Inter) | paragraf, judul besar |
| Motion | `--ease-out cubic-bezier(.16,1,.3,1)`, 160/280/520 ms | semua transisi |

Detail gaya HUD: panel bertepi chamfer (clip-path sudut terpotong), label section format `// 02 · ACTIVE MISSIONS`, angka bergerak (count-up), garis leader 1px, efek "glitch" hanya saat masuk section (sekali, ≤300 ms).

---

## 9. Performa & Kualitas

| Target | Nilai |
|---|---|
| LCP (4G, HP menengah) | < 2.5 s (teks hero tampil dulu, canvas menyusul) |
| Initial JS (gzip) | < 350 KB (three + r3f ±250 KB; section lain lazy) |
| Initial aset 3D | Intro: `portrait-field.dat` ±180 KB dimuat pertama. Landing: < 1.5 MB (mars.jpg dikompres ±400 KB, normal 1k, starmap 1k, opportunity), dimuat selama intro berjalan |
| FPS | 60 desktop, ≥ 30 Android menengah |

Teknik:
- `dpr={[1, 1.75]}`; `PerformanceMonitor` drei → turunkan tier (matikan bloom, segmen sphere, normal map 2k→1k, kurangi partikel).
- Pause render saat tab hidden (`frameloop="demand"` + invalidate, atau stop di `visibilitychange`).
- Code-split: `ArView`, `Terminal`, model HUD, Bennu → `React.lazy`.
- Konversi tekstur besar: `mars.jpg` → 2048×1024 webp; `mars_normal_2k.png` (3.7 MB) → webp/ktx2 atau pakai 1k saja.
- `prefers-reduced-motion`: intro partikel diganti potret statis, tanpa auto-rotate, tanpa parallax.
- **Lite Mode** toggle (dan otomatis jika WebGL gagal): ganti canvas dengan gambar statis Mars + fallback webp model.

---

## 10. Aksesibilitas & SEO
- Semua konten = HTML semantik (`header`, `main`, `section[aria-labelledby]`, `footer`); canvas `aria-hidden`.
- Tombol keyboard-accessible, fokus terlihat (outline cyan), skip link "Lewati ke konten".
- Kontras teks ≥ 4.5:1 di atas panel (cek dengan Lighthouse).
- Intro partikel bisa di-skip (klik/Enter/Esc) dan tidak memblokir crawler (konten ada di DOM sejak awal).
- Meta: `<title>Ahmad Rafli Ramadhan — Frontend Developer & UI/UX</title>`, description, OG image (screenshot hero), `lang="en"`.
- Semua copy UI dalam English; nama organisasi Indonesia tetap ditulis asli + terjemahan singkat (mis. "IATMI SM ITB — Indonesian Petroleum Engineers Association, ITB Student Chapter").
- JSON-LD `Person` (nama, jobTitle, alumniOf ITB, sameAs GitHub).

---

## 11. Credits & Legal (NASA)
- Tekstur Mars: "NASA 3D Resources (Viking-era global colour mosaic), public domain" (dari `arvr/public/textures/provenance.json`). Starmap: ambil credit dari file provenance yang sama.
- Model `.glb`: catat sumber tiap model dari dokumentasi SPHEREx (`HANDOFF.md` / `README.md` / docs) ke `credits.ts`. **Belum aku verifikasi per model** — wajib dicek saat implementasi.
- Jangan pakai logo NASA ("meatball"/"worm") atau logo Space Apps sebagai branding portofolio; tulis disclaimer: *"Not affiliated with or endorsed by NASA. NASA imagery and models used under NASA media guidelines."*
- Mars di portofolio = visual dekoratif; tidak mengklaim data ilmiah.

---

## 12. Rencana Kerja (Fase)

### Fase 0 — Setup (½ hari) — ✅ selesai 2026-11-18
- [x] Vite + React 19 + TS di `C:\projek\Portofolio`, `git init`.
- [x] Install three 0.186, R3F 9, drei 10, zustand 5, @fontsource (Share Tech Mono, Space Grotesk); dev: basic-ssl, gltf-transform, meshoptimizer, sharp.
- [x] Styling: **plain CSS dengan design token** (`src/styles.css`) — Tailwind/motion tidak dipakai karena hampir semua gaya HUD custom; ESLint/Prettier belum.
- [x] `copy-nasa-assets.mjs` + `optimize-models.mjs` (weld → simplify → meshopt → webp). Hasil: curiosity 4.2 MB→89 KB, bennu 3.5 MB→44 KB, ingenuity 210 KB, lunar-module 439 KB, osiris-rex 380 KB, opportunity 19 KB, **perseverance 1.1 MB (masih di atas target 600 KB)**.
- **DoD**: dev server jalan (HP via LAN + HTTPS: `npm run dev:phone`); aset ada di `public/`. Perseverance belum memenuhi ≤ 600 KB.

### Fase 1 — Intro partikel + Landing page — ✅ dibangun 2026-11-18 (belum dites di HP asli)
- [x] `Scene` + `Mars` (atmosfer rim-glow) + `Starfield` + `Orbits` (2 ring, 8 beacon, reticle).
- [x] `CameraRig`: parallax mouse, mundur saat scroll, FPS + quality tier adaptif.
- [x] HUD: `HudFrame`, `TelemetryBar` (WIB + SOL + α/β/γ atau kursor), `PilotCard` + `TypingRotator`, `StatusDock` (Opportunity), `Toast`, `Credits`.
- [x] `MissionPanel` (4/halaman) + `MissionsSection` (8 kartu, filter) dengan model NASA lazy.
- [x] **Intro Particle Portrait**: `build-portrait-field.mjs` (32k partikel, 250 KB) → `ParticlePortrait` (VORTEX → FORM → HOLD → TO MARS → HANDOFF) → `IntroOverlay` (UPLINK %, SOL, T-minus, tag 火星, Skip/Esc/Enter); sekali per sesi, `?intro` untuk replay; reduced-motion langsung ke landing.
- [x] Handoff: bola partikel memakai transform, UV tekstur & rotasi yang sama dengan mesh Mars.
- [x] Layout responsif dicek di 1440, 1200, 800 dan 375 px (Chromium emulasi).
- [x] Tombol `ENABLE GYRO` + permission iOS + parallax ±14° (kode jadi, **belum dites di device asli**).
- [ ] Uji di Android & iPhone asli; Lighthouse.
- **Penyimpangan dari rencana**:
  - Model HUD: tiap kotak probe adalah `<canvas>` 2D biasa di dalam kartu (ikut scroll persis dengan bingkainya); satu renderer WebGL off-DOM menggambar semua probe yang terlihat lalu disalin dengan `drawImage` (`src/three/probeRenderer.ts`). Menggantikan drei `<View>` + canvas overlay yang tertinggal saat scroll di HP.
  - Label beacon (drei `<Html>`) dirender ke layer `#labels` tersendiri supaya tidak melebarkan viewport mobile.
  - Tombol `AR VIEW` masih placeholder (toast "next build") sampai Fase 3.
  - JS bundle 361 KB gzip (target 350 KB) — code-split di Fase 5.

### Fase 1b — Revisi intro & navigasi — ✅ 2026-11-18
- [x] Intro berhenti di potret tajam + mata menyala; lanjut hanya lewat scroll/swipe/↓/Space/Enter/cue.
- [x] Tombol **◂ Pilot** + scroll ke atas di puncak landing → transisi dijalankan mundur kembali ke potret (§2.1).
- [x] Model probe digambar di `<canvas>` 2D per kartu (renderer WebGL bersama, `probeRenderer.ts`) → menempel di bingkai saat scroll.
- [x] Ikon GitHub, LinkedIn, WhatsApp (intro kanan bawah, dock, pilot card di HP).

### Fase 2 — Missions — ✅ 2026-11-18
- [x] `capture-shots.mjs` → screenshot 6 situs live (desktop + mobile, `public/shots/*.webp`), pakai Chrome/Edge sistem via playwright-core.
- [x] Cek header iframe tiap URL (2026-11-18: semua mengizinkan).
- [x] `missions.ts` berisi 8 misi dari §1.3 + §5.1a.
- [x] `MissionDetail` (drawer kanan desktop / bottom sheet HP): screenshot desktop/mobile, **Live feed** iframe (sandbox, dimuat saat diklik), stack, probe, Launch/Source, prev/next, Esc/←/→.
- [x] Fly-to kamera ke beacon misi aktif; beacon berhenti; panel hero meredup.
- [x] Hologram all-sky prosedural untuk M-05.

### Fase 2b — Rig pump jack di permukaan Mars — ✅ 2026-11-18
- [x] `Oil_Pump_Jack.usdz` (dari kamu) → GLB lewat `tools/convert-usdz.html` (USDLoader + GLTFExporter di browser, endpoint simpan dev-only) → dioptimasi jadi **72 KB**.
- [x] Misi engineering **mendarat**: M-06 HMS di Valles Marineris, M-08 Mud Monitor di Arabia Terra (lokasi ilustratif) + 4 rig tanpa label membentuk ladang minyak kecil. Rig ikut berputar dengan Mars.
- [x] Buka brief misi yang mendarat → Mars berputar menghadapkan situsnya, kamera turun rendah dari selatan sehingga pump jack terlihat dari samping.
- [x] iOS: AR Quick Look pump jack (`public/ar/pump-jack.usdz`).

### Fase 3 — AR VIEW — ✅ dibangun 2026-11-18 (belum dites di HP asli)
- [x] Port `device.ts`, `arSupport.ts`, `CameraFeed.tsx`, matematika `GyroControls` → `GyroCamera` (`src/ar/`).
- [x] `ArView` (chunk lazy 4 KB gzip): kamera belakang + Mars melayang ±1.6 m, pinch/scroll zoom, Recenter, kamera on/off, companion Perseverance.
- [x] Fallback: kamera diblokir → bintang; gyro ditolak/tak ada → drag untuk melihat. Izin gyro diminta di dalam tap tombol AR (syarat iOS).
- [x] iOS Quick Look: Mars + pump jack.
- [x] Scene utama berhenti render selama AR terbuka.
- [ ] **DoD di HP asli** (kamera + gyro + indikator kamera mati saat keluar) — belum bisa dites di sini (browser pane memblokir kamera).
- [ ] (Stretch) WebXR immersive-ar Android dengan hit-test — tidak dikerjakan.

### Fase 4 — Section konten — ✅ 2026-11-18
- [x] Neural Profile, Mission Log (filter), Crew Record (+ "Also on deck"), Tech Arsenal (tanpa persentase karangan), Comms, Credits — isi dari CV + README.
- [x] Terminal (section + overlay `/`): history, Tab completion, `open m-0x`, `ar`, `sample bennu`, `pilot`, `cv`…
- [x] Nav section di telemetry bar; scrim yang meredupkan Mars saat scroll ke section konten (pengganti "camera chapters" penuh).

### Fase 5 — Polish & QA — ✅ 2026-11-18 (deploy belum)
- [x] Lite mode (tombol di dock, tersimpan per pengunjung): scene jadi gambar diam, probe berhenti berputar.
- [x] Reduced motion → langsung ke landing; tanpa WebGL → planet CSS, tanpa intro.
- [x] Quality tier adaptif (FPS < 38 tiga detik berturut-turut → turun tier + DPR).
- [x] SEO: meta, OG image (`public/og.jpg`, dibuat oleh smoke test), Twitter card, canonical, JSON-LD Person (GitHub + LinkedIn), favicon.
- [x] `npm run smoke`: 14 pengecekan di build produksi (intro diam, scroll launch, brief, terminal, AR buka/tutup, ◂ Pilot, mobile overflow, brief misi mendarat, tanpa error console) — **14/14 lulus**.
- [x] `vercel.json`: cache header untuk aset + MIME `.usdz`.
- [x] Ditemukan & diperbaiki: Chrome headless membalas fetch file `.bin` dengan 204 kosong → field partikel kini `portrait-field.dat`.
- [ ] Deploy Vercel + tes AR di URL produksi (HTTPS) — **menunggu kamu** (tidak push/deploy tanpa izin).
- [ ] Lighthouse, toggle bahasa ID/EN, GitHub stats — belum.
- Bundle JS utama: 393 KB gzip (three.js + R3F mendominasi); AR terpisah.

---

## 13. Hal yang Perlu Kamu Konfirmasi / Isi

Sudah dijawab (2026-11-18):
- ✅ Stack → diambil dari GitHub + situs live (§1.3).
- ✅ URL SPHEREx XR → https://helios-cosmic-explorer.vercel.app/explorer
- ✅ HMS, KaryaSupply, Mud Monitor → jadi misi M-06, M-07, M-08.
- ✅ Bahasa situs → English.

Masih terbuka:
1. **Nama lomba & hasil** CarbonCapex dan Pantra (juara/finalis?), dan kamu solo atau tim (posisimu apa).
2. **HMS Simulation & Mud Monitor**: ada repo/screenshot/video? Kalau tidak, misi tampil sebagai `OFFLINE ARCHIVE` dengan deskripsi saja.
3. **IPFEST**: repo-nya fork organisasi — boleh ditautkan sebagai SOURCE atau link situs saja?
4. **BantuCepat (GarudaHacks 7.0)** dan **Choke Size ML** — cukup di Mission Log, atau jadi misi ke-9/10?
5. ✅ Kontak: GitHub, LinkedIn, WhatsApp (dari kamu) + email & LINE dari CV di section Comms.
6. ✅ Foto → dipakai untuk intro partikel (§2.1). Masih terbuka: kirim foto resolusi asli (≥1024 px) supaya wajah partikel lebih tajam; dan apakah Pilot Card juga pakai versi mini potret partikel?
7. Domain: meta OG/canonical memakai `https://ahmadrafliporto.vercel.app/` (dari screenshot-mu) — ganti di `index.html` kalau domainnya lain.

---

## 14. Risiko & Mitigasi
| Risiko | Mitigasi |
|---|---|
| Model NASA terlalu berat → landing lambat | Optimasi gltf-transform, lazy per panel, satu WebGL context (`<View>`), fallback webp |
| Gyro/kamera tidak jalan (HTTP, in-app browser IG/LINE, izin ditolak) | Deteksi + pesan jelas + fallback touch/mouse; tombol "Buka di browser" |
| iOS: izin gyro harus dari gesture | Semua permission dipanggil dari onClick tombol |
| Iframe situs live diblokir | Screenshot sebagai default, iframe hanya jika header mengizinkan |
| HUD terlalu ramai di mobile | Panel misi pindah ke carousel bawah; telemetry diringkas |
| Situs lomba mati di masa depan | Screenshot tersimpan + status `archived` di data |
| Lisensi aset | Credits lengkap, tanpa logo NASA, disclaimer non-affiliation |
