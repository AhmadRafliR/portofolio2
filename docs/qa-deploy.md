# QA, Performa & Deploy

## Gerbang kualitas

```powershell
npm run build      # tsc --noEmit (strict, noUnused*) + vite build
npm run smoke      # 18 cek di dist/ lewat vite preview :4179, Chrome/Edge sistem
```

Tidak ada unit test / linter. Setiap perubahan perilaku harus lolos keduanya.

### Isi smoke test (`scripts/smoke.mjs`)

Desktop: intro tampil · intro berhenti di potret (tidak auto-lanjut) · scroll meluncurkan landing · panel misi 4
baris · brief terbuka (CarbonCapex) · `Esc` menutup brief · terminal menjawab `whoami` · AR terbuka (kamera diblokir →
bintang) · AR tertutup · permukaan: mendarat + hotspot · WASD berjalan · brief terbuka di atas medan · `Esc` tutup brief
lalu lepas landas · ◂ Pilot kembali ke potret · tanpa error halaman.
HP (emulasi): tanpa overflow horizontal · brief misi mendarat menyebut "Gale Crater" · tanpa error halaman.

Selektor yang diandalkan smoke test (jangan ganti nama class tanpa memperbarui script): `.mission-row`, `.detail-title`,
`.detail.open`, `.term-overlay .term-screen`, `.ar`, `.walk-pin`, `.landing-note`.

## Preview di agen / Claude desktop

`.claude/launch.json`: `portfolio` (dev, :5173) dan `portfolio-prod` (vite preview, :4173 — jalankan `npm run build` dulu).

## Tes di HP asli

1. `npm run dev:phone` → buka `https://<IP-LAN>:5173` di HP, terima sertifikat self-signed.
2. Cek: Enable gyro (iOS meminta izin), AR View (kamera + gyro, indikator kamera mati setelah keluar), Quick Look di
   iOS, berjalan di permukaan dengan tombol Walk, FPS di dock.
3. Status: AR, gyro, dan performa permukaan **belum** dites di device asli (lihat `implementasi.md` Fase 1, 3, 6).

## Budget performa

| Target | Nilai |
|---|---|
| FPS | 60 desktop, ≥30 Android menengah |
| JS utama | ±390 KB gzip (target awal 350 KB); AR & SurfaceWalk chunk terpisah |
| LCP 4G | < 2,5 dtk (teks DOM tampil dulu, canvas menyusul) |

Knob: tier awal (`main.tsx`), turun tier adaptif (`CameraRig.tsx`, FPS < 38 × 3 dtk), partikel intro per tier
(`ParticlePortrait.tsx` `COUNT_BY_TIER`), kualitas medan (`SurfaceWalk.tsx` `QUALITY`), DPR (`Scene.tsx`).

## Deploy (Vercel)

- Static build: framework Vite, output `dist/`. Folder `.vercel/` dan `.env*` di-gitignore.
- `vercel.json`: cache immutable 1 tahun untuk `/assets/*` (hash Vite), 7 hari untuk `models|textures|intro|shots|ar`,
  dan `Content-Type: model/vnd.usdz+zip` untuk `.usdz` (wajib agar Quick Look jalan).
- HTTPS wajib untuk kamera & gyro iOS.
- Domain dipakai di `index.html` (canonical, `og:url`, `og:image`): `https://ahmadrafliporto.vercel.app/`. Ganti di
  sana jika domain berubah.
- Setelah deploy: buka URL produksi di HP, ulangi checklist "Tes di HP asli".

## Checklist sebelum commit

- [ ] `npm run build` lolos
- [ ] `npm run smoke` 18/18 (untuk perubahan perilaku/UI)
- [ ] `npm run docs:check` lolos (file baru/terhapus di `src/` atau `scripts/` → perbarui `docs/agent/codemap.md`)
- [ ] Layout dicek di ±1440, 1100, 800, 375 px bila menyentuh CSS hero/panel
