# Panduan Handover Ekspansi Seluler & Kebijakan Privasi
`kekayaan.id` — Branch: `feat/mobile-capacitor`

Dokumen ini ditujukan untuk mempermudah kelanjutan pengembangan di perangkat/laptop rumah Anda. Seluruh perubahan kode saat ini telah dideploy, dikomit, dan dipush ke branch `feat/mobile-capacitor`.

---

## 🚀 Cara Menjalankan & Membangun Project

### 1. Prasyarat Awal (Setelah Pull Branch)
Pastikan Anda menginstal dependency baru yang digunakan untuk Capacitor:
```bash
npm install
```

### 2. Membangun Aplikasi untuk Web/Vercel (Dynamic SSR)
Gunakan perintah standar Next.js untuk memverifikasi kecocokan deploy server:
```bash
npm run build
```
*Hasil*: Aplikasi akan ter-compile dengan route `/api/*` yang dinamis dan file layout/page pendukung SSR.

### 3. Membangun & Sinkronisasi Aplikasi untuk Android/iOS (Static SPA Export)
Gunakan perintah kustom mobile build:
```bash
npm run build:mobile
```
*Mekanisme Kerja*:
1. Script [scripts/build-mobile.js](file:///c:/Users/MGTI251106/Downloads/Wafiy%20Anwarul/Projects/kekayaan.id/scripts/build-mobile.js) akan membersihkan direktori `.next` (untuk membuang tipe TypeScript lama dari API routes).
2. Memindahkan sementara folder `src/app/api` dan `src/app/auth` ke root agar Next.js tidak membaca file route handler dinamis.
3. Menjalankan kompilasi statis dengan environment variable `EXPORT_MOBILE=true` (`next build` menghasilkan output static html/js di folder `out/`).
4. Mengembalikan direktori `api` dan `auth` ke lokasi semula secara aman (`finally` block).
5. Menjalankan `npx cap sync` untuk menyalin aset web terbaru dari `/out` ke folder aset native `/android`.

### 4. Membuka Android Studio untuk Running Aplikasi Mobile
Untuk menjalankan emulator/simulator Android:
1. Buka Android Studio.
2. Pilih **Open an Existing Project** dan arahkan ke folder `/android` di dalam project ini.
3. Tunggu Gradle sync selesai.
4. Jalankan aplikasi di emulator atau device Android Anda melalui tombol Run di Android Studio.

---

## 🔒 Fitur Keamanan & Privasi yang Telah Diimplementasikan

1. **Checkbox Persetujuan Registrasi**:
   - Diimplementasikan pada berkas [register/page.tsx](file:///c:/Users/MGTI251106/Downloads/Wafiy%20Anwarul/Projects/kekayaan.id/src/app/\(auth\)/register/page.tsx). Pengguna wajib mencentang persetujuan sebelum tombol daftar aktif.
2. **Modal Kebijakan & Larangan Kriminal (Anti-Abuse Modal)**:
   - Menjelaskan manajemen data aman dengan Supabase RLS (Row Level Security), transmisi SSL, serta larangan keras memanipulasi mutasi bank/laporan keuangan atau melakukan tindakan pencucian uang (money laundering).
   - Dapat diakses dari halaman pendaftaran dan dari kartu setelan di [SettingsPanel.tsx](file:///c:/Users/MGTI251106/Downloads/Wafiy%20Anwarul/Projects/kekayaan.id/src/components/settings/SettingsPanel.tsx) (operational control center).

---

## 🗺️ Rencana Lanjutan: App Tour (Fase 5)
Roadmap telah diperbarui di berkas [next_development_phase.md](file:///c:/Users/MGTI251106/Downloads/Wafiy%20Anwarul/Projects/kekayaan.id/next_development_phase.md).
- Rencana implementasi menggunakan tutorial popover langkah demi langkah (misal memakai library lightweight `driver.js` atau custom React portals) untuk memandu menu transaksi, target finansial, dan impor mutasi AI.
- Pemicu manual disiapkan di menu Pengaturan (Settings) agar user dapat memutar kembali tour guide jika lupa.
