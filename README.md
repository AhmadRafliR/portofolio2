# RAFLI // MARS MISSION CONTROL

Portofolio interaktif **Ahmad Rafli Ramadhan** (full stack developer & UI/UX, Teknik Perminyakan ITB) bergaya HUD
mission-control: intro potret partikel → Mars 3D dengan 8 "misi" (project) yang mengorbit → mendarat dan berjalan di
permukaan Mars → AR View di HP. Seluruh UI & copy situs dalam **English**; dokumentasi proyek dalam Bahasa Indonesia.

- Produksi: <https://ahmadrafliporto.vercel.app/> (dari `index.html` canonical/OG)
- Stack: Vite 6 · React 19 · TypeScript (strict) · three 0.186 · React Three Fiber 9 · drei 10 · zustand 5 · CSS biasa
- Tanpa backend. Semua konten statis di `src/data/`.

## Mulai cepat

```powershell
npm install
npm run dev          # http://localhost:5173
```

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server Vite (port 5173) |
| `npm run dev:phone` | Dev server HTTPS di LAN (`--host`, sertifikat self-signed) — gyro & kamera HP butuh secure context |
| `npm run build` | `tsc --noEmit` lalu `vite build` → `dist/` |
| `npm run preview` | Sajikan `dist/` (port 4173) |
| `npm run smoke` | Smoke test 18 cek di build produksi (butuh Chrome/Edge sistem). Jalankan **setelah** `build` |
| `npm run docs:check` | Pastikan setiap file `src/` & `scripts/` tercatat di peta kode agen |
| `npm run assets:copy` | Salin tekstur/model/terrain NASA dari project SPHEREx (`SPHEREX_DIR`) |
| `npm run assets:models` | Optimasi `.glb` → `public/models/hud/` |
| `npm run assets:portrait` | Foto → `public/intro/portrait-field.dat` (data partikel intro) |
| `npm run assets:shots` | Screenshot situs live tiap misi → `public/shots/` |

Tidak ada unit test, ESLint, atau Prettier. Gerbang kualitas = `npm run build` (type-check) + `npm run smoke`.

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [docs/arsitektur.md](docs/arsitektur.md) | Lapisan aplikasi, state machine (intro → landing → surface/AR), state `useHud` vs `live`, pipeline render |
| [docs/fitur.md](docs/fitur.md) | Setiap fitur & kontrolnya: intro, landing, brief misi, permukaan, AR, terminal, lite/fallback |
| [docs/konten.md](docs/konten.md) | Cara mengubah teks, menambah misi, mengganti kontak/CV |
| [docs/aset.md](docs/aset.md) | Pipeline aset (NASA, model, potret, screenshot), format file, kredit & lisensi |
| [docs/qa-deploy.md](docs/qa-deploy.md) | Build, smoke test, tes di HP, performa/tier, deploy Vercel |
| [implementasi.md](implementasi.md) | Rencana awal + log fase 0–6 (historis; sumber keputusan desain) |

**Untuk agen AI** (Claude Code, Codex, Cursor, dll.): mulai dari [AGENTS.md](AGENTS.md). Peta kode per file ada di
[docs/agent/codemap.md](docs/agent/codemap.md) dan resep tugas di [docs/agent/recipes.md](docs/agent/recipes.md).

## Struktur singkat

```
src/
  main.tsx, App.tsx     boot (tier awal, deteksi WebGL, skip intro) + susunan halaman
  state/store.ts        zustand useHud (state UI) + objek `live` (nilai per-frame)
  data/                 SEMUA konten: missions.ts, profile.ts, record.ts
  intro/                potret partikel (shader GLSL) + overlay DOM
  three/                scene orbit: Mars, starfield, orbit/beacon, rig kamera, renderer probe HUD
  surface/              medan Mars yang bisa dijelajahi (worker terrain, material PBR)
  ar/                   AR View (kamera + gyro), di-lazy-load
  hud/                  semua panel DOM: telemetry, pilot card, misi, brief, section, terminal, dock
  lib/                  deteksi device, gyro, gesture kembali, waktu Mars
  styles.css            satu file CSS dengan design token
scripts/                pipeline aset + smoke test (Node ESM)
public/                 aset yang di-deploy (model, tekstur, terrain, shots, CV, AR .usdz)
tools/convert-usdz.html konverter USDZ→GLB berbasis browser (dev only)
```

## Kredit

Tekstur, model, dan elevasi Mars dari NASA (lihat [docs/aset.md](docs/aset.md)). Tidak berafiliasi atau didukung oleh
NASA. Tekstur tanah: pindaian CC0 Poly Haven.
