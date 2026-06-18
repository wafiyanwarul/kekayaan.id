# Rencana Handover Ekspansi Seluler & Kebijakan Privasi
`kekayaan.id` — Branch: `feat/mobile-capacitor`

Dokumen ini mempermudah kelanjutan pengembangan di perangkat/laptop rumah Anda. Seluruh perubahan kode saat ini telah dideploy, dikomit, dan dipush ke branch `feat/mobile-capacitor`.

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

## 📱 Fitur Native Mobile Terintegrasi Baru

### A. Kontrol Status Bar Native
- Menggunakan `@capacitor/status-bar` di dalam [MobileNativeProvider.tsx](file:///c:/Users/MGTI251106/Downloads/Wafiy%20Anwarul/Projects/kekayaan.id/src/components/providers/MobileNativeProvider.tsx).
- Mengubah warna latar belakang Status Bar pada ponsel menjadi gelap sesuai tema aplikasi (`#0f1117`) dan menetapkan ikon/teks menjadi warna terang (`Style.Dark`) agar readable dan premium.

### B. Deep Linking (Pencegahan Masalah Auth Redirect)
Untuk mengantisipasi masalah redirect login dengan Google, e-mail verification, maupun link reset password di platform WebView mobile:
- **Intent Filters Android**: Mendaftarkan intent-filter skema URL kustom di [AndroidManifest.xml](file:///c:/Users/MGTI251106/Downloads/Wafiy%20Anwarul/Projects/kekayaan.id/android/app/src/main/AndroidManifest.xml) dengan skema:
  - `com.kekayaan.app`
  - `kekayaan`
- **Listener Deep Link**: Menambahkan event listener `@capacitor/app` pada [MobileNativeProvider.tsx](file:///c:/Users/MGTI251106/Downloads/Wafiy%20Anwarul/Projects/kekayaan.id/src/components/providers/MobileNativeProvider.tsx). Ketika ponsel memicu URL redirect (misal dari e-mail atau proses Google Sign-In), listener ini otomatis mengarahkan user secara mulus ke rute internal aplikasi Next.js (SPA).

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

---

## 📦 5. Cara Build File APK & App Bundle (.aab) Rilis

Setelah aplikasi diuji coba pada emulator/device debug dan siap dirilis ke publik, Anda perlu mem-build berkas **Android App Bundle (.aab)** atau **APK** yang ditandatangani secara resmi (Signed) menggunakan Android Studio:

### Langkah-langkah:
1. **Jalankan Sinkronisasi Kode Statis**:
   Di terminal project, pastikan Anda mem-build SPA versi terbaru dan menyinkronkannya ke folder native:
   ```bash
   npm run build:mobile
   ```
2. **Buka Project Android di Android Studio**:
   Buka Android Studio, lalu arahkan/open ke direktori `/android` di dalam project ini.
3. **Pilih Menu Build**:
   Pada bilah menu atas Android Studio, pilih **Build** > **Generate Signed Bundle / APK...**
4. **Pilih Format Output**:
   - **Android App Bundle (.aab)**: *Sangat direkomendasikan* untuk diunggah langsung ke Google Play Store karena Google akan mengoptimalkan ukuran download bagi masing-masing tipe peranti pengguna secara otomatis.
   - **APK**: Berguna jika Anda ingin mentransfer langsung file `.apk` mentah untuk diinstal langsung ke handphone/penguji di luar Play Store.
   - Klik **Next**.
5. **Konfigurasi Key Store (Kunci Tanda Tangan)**:
   Jika Anda belum memiliki Key Store sebelumnya, pilih **Create new...** dan lengkapi detail berikut:
   - **Key store path**: Tentukan lokasi penyimpanan berkas `.jks` (misal simpan sebagai `kekayaan-release-key.jks` di luar folder project agar tidak tidak sengaja ter-commit ke git publik).
   - **Passwords**: Buat kata sandi aman untuk Key Store dan Key alias.
   - **Alias**: Masukkan nama alias (biasanya `key0` atau `kekayaan-app`).
   - **Certificate**: Isi minimal bagian *First and Last Name* (misal nama Anda) dan organisasi pendukung.
   - Klik **OK**.
6. **Proses Penandatanganan (Signing)**:
   - Masukkan kata sandi Key Store dan Key yang baru saja Anda buat di wizard.
   - Klik **Next**.
7. **Pilih Build Variant**:
   - Pilih **release** pada pilihan Build Variants.
   - Klik **Finish**.
8. **Lokasi Hasil Build**:
   - Tunggu hingga Gradle selesai mengompilasi (biasanya memerlukan waktu 1-3 menit).
   - Setelah selesai, pemberitahuan akan muncul di kanan bawah Android Studio. Klik **Locate** atau temukan berkas di folder berikut:
     - **AAB**: `android/app/release/app-release.aab` (atau di bawah subfolder `outputs/bundle/release/`)
     - **APK**: `android/app/release/app-release.apk` (atau di bawah subfolder `outputs/apk/release/`)

---

## 📋 6. Persiapan Pendaftaran ke Google Play Store

Sebelum mengunggah berkas `.aab` ke Google Play Console, pastikan Anda telah mempersiapkan hal-hal administratif dan materi pemasaran berikut:

### 1. Akun Developer
- Miliki akun Google Play Console Developer aktif (memerlukan biaya pendaftaran sekali bayar sebesar $25 USD).

### 2. Informasi Listing Aplikasi (Store Listing)
- **Nama Aplikasi (App Name)**: `kekayaan.id` (Maksimal 30 karakter).
- **Deskripsi Singkat (Short Description)**: `Pantau kekayaan, transaksi harian, dan tujuan finansial secara aman.` (Maksimal 80 karakter).
- **Deskripsi Lengkap (Full Description)**: Deskripsi detail mengenai manfaat aplikasi, cara impor mutasi rekening cerdas menggunakan AI, pemantauan target finansial (goals), serta komitmen privasi penuh tanpa iklan.
- **Ikon Aplikasi (App Icon)**: Ukuran tepat **512 x 512 piksel**, format PNG 32-bit (maksimal 1 MB), tanpa sudut membulat (masking dilakukan otomatis oleh Google).
- **Gambar Unggulan (Feature Graphic)**: Ukuran tepat **1024 x 500 piksel**, format PNG atau JPG. Gambar ini akan tampil di bagian atas halaman aplikasi Anda di Google Play Store.
- **Tangkapan Layar (Screenshots)**:
  - Minimal 2-4 gambar tangkapan layar antarmuka aplikasi dengan rasio aspek 16:9 atau 9:16 (minimal resolusi 320px hingga 3840px). Pastikan menampilkan visual premium dashboard keuangan, grafik target finansial, dan pengelola transaksi.

### 3. Kebijakan Privasi Publik (Privacy Policy)
- Google mewajibkan tautan URL Kebijakan Privasi yang valid untuk aplikasi yang menangani data pengguna.
- Tautan publik yang telah kita siapkan dan siap diakses langsung di internet:
  **`https://kekayaan-id.vercel.app/privacy`** (atau sesuaikan dengan domain utama production Vercel Anda).
- Tempelkan URL tersebut ke kolom **App Content** > **Privacy Policy** di dashboard Google Play Console Anda.

---

## 🔗 7. Konfigurasi Deep Linking & Asset Links untuk Auth

Agar transisi rute seperti redirect OAuth Google Sign-In, verifikasi e-mail baru, atau link reset password dari peranti seluler berjalan mulus (membuka langsung aplikasi `kekayaan.id` dan bukan lewat tab browser eksternal):

1. **Unduh SHA-256 App Signing Certificate**:
   Setelah mengunggah aplikasi pertama kali ke Google Play Console, masuk ke menu **Setup > App Integrity** di Play Console Anda, lalu salin **SHA-256 certificate fingerprint** yang diberikan oleh Google App Signing.
2. **Perbarui Digital Asset Links**:
   Buka file [public/.well-known/assetlinks.json](file:///c:/Users/MGTI251106/Downloads/Wafiy%20Anwarul/Projects/kekayaan.id/public/.well-known/assetlinks.json) pada codebase ini, lalu gantikan array `sha256_cert_fingerprints` dengan nilai fingerprint SHA-256 yang valid dari langkah di atas.
3. **Deploy Web Server**:
   Push perubahan tersebut ke branch utama production agar file `assetlinks.json` dapat diakses secara publik pada path `https://kekayaan-id.vercel.app/.well-known/assetlinks.json` dengan header Content-Type `application/json`.
