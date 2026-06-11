<div align="center">

# kekayaan.id — Personal Wealth Cockpit

**Aplikasi manajemen keuangan pribadi berbasis Next.js dengan siklus billing 25–24, ekstraksi mutasi rekening otomatis, dan laporan PDF profesional.**

---

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge&logo=groq&logoColor=white)

</div>

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Dashboard Keuangan** | Ringkasan aset, tujuan, dan cashflow dalam satu tampilan |
| **Expense Tracker** | Pencatatan pemasukan & pengeluaran dengan kategori |
| **🆕 Ekstraksi Mutasi BCA** | Import transaksi otomatis dari PDF mutasi mBCA dengan AI |
| **Siklus 25–24** | Timeline billing dari tanggal 25 tiap bulan sampai 24 bulan berikutnya |
| **Pilih Periode** | Filter siklus berdasarkan bulan & tahun, navigasi antar periode |
| **Grafik Arus Kas** | Bar chart harian pemasukan vs pengeluaran |
| **Kategori Pie Chart** | Persentase kategori pemasukan & pengeluaran |
| **Pengeluaran Harian Pokok** | Rata-rata harian kategori Makanan & Transportasi + proyeksi mingguan/bulanan |
| **Riwayat Transaksi** | List & group view dengan filter tipe + pencarian |
| **Export PDF** | Laporan cashflow bulanan bergaya profesional (A4, light theme) dengan satu klik |
| **Manajemen Aset** | Pencatatan aset dengan valuasi |
| **Goals / Tujuan Keuangan** | Target tabungan dengan progress tracking |
| **Pengaturan** | Ubah password, maintenance mode, system upgrade toggle |
| **Auth** | Login, Register, Lupa Password, Reset Password via Supabase |

---

## 🏦 Ekstraksi Mutasi Rekening (Baru!)

Upload PDF mutasi rekening BCA langsung dari halaman Finance. Transaksi diekstraksi otomatis menggunakan AI dan ditampilkan sebagai tabel review interaktif sebelum diimport.

**Alur kerja:**
1. Klik **"Import Mutasi"** di halaman Finance
2. Upload PDF mutasi mBCA (drag & drop atau pilih file)
3. Review tabel preview — edit tanggal, keterangan, nominal, kategori
4. Hapus baris yang tidak perlu
5. Klik **"Import X Transaksi"** — data langsung masuk ke Expense Tracker

**Bank yang didukung:**
| Bank | Format | Status |
|---|---|---|
| BCA | mBCA e-Statement PDF | ✅ Aktif |
| Mandiri | - | 🔜 Segera |
| BRI | - | 🔜 Segera |

---

## 🔒 Privacy & Security

Keamanan data kamu adalah prioritas utama:

- **File PDF tidak pernah disimpan** — hanya diproses di memory server sesaat, langsung dihapus setelah ekstraksi selesai
- **AI category suggestion** menggunakan Groq API (server-side only) — file PDF tidak dikirim ke Groq; hanya teks deskripsi transaksi yang dikirim untuk klasifikasi kategori
- **Rate limiting** — maksimum 3x ekstraksi per hari per akun
- **Auth required** — semua endpoint API dilindungi Supabase session
- **RLS (Row Level Security)** — user hanya bisa akses dan insert data milik sendiri
- **API key server-only** — tidak pernah terekspos ke browser/client

---

## 🛠 Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Auth & Database** | [Supabase](https://supabase.com/) (PostgreSQL + RLS) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **PDF Export** | [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) |
| **PDF Parsing** | [unpdf](https://github.com/unjs/unpdf) (serverless-safe) |
| **AI Suggestion** | [Groq API](https://groq.com/) (Llama 3.3 70B) — server-only |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Date Utils** | [date-fns](https://date-fns.org/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm / pnpm
- Supabase project
- Groq API Key (gratis di [console.groq.com](https://console.groq.com))

### Setup

```bash
# 1. Clone repository
git clone https://github.com/wafiyanwarul/kekayaan.id.git
cd kekayaan.id

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_connection_string

# Untuk fitur Ekstraksi Mutasi (AI category suggestion)
GROQ_API_KEY=your_groq_api_key
```

```bash
# 4. Generate Prisma client
npx prisma generate

# 5. Run Supabase migrations (termasuk tabel mutasi_usage)
# Jalankan SQL dari: src/lib/supabase/migrations/add_mutasi_usage.sql
# di Supabase SQL Editor

# 6. Run development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── (auth)/          # Login, Register, Forgot/Reset Password
│   ├── (dashboard)/     # Dashboard, Finance, Assets, Goals, Settings
│   ├── api/
│   │   ├── mutasi/
│   │   │   └── extract/ # POST — Ekstraksi PDF mutasi (auth + rate limit)
│   │   └── dashboard/   # History chart data
│   └── auth/            # Supabase auth callback
├── components/
│   ├── providers/       # AppPreferences, Supabase providers
│   ├── settings/        # SettingsPanel
│   └── ui/              # shadcn/ui components
├── features/
│   └── finance/
│       ├── components/  # FinanceClient, PdfExportModal, MutasiImportModal
│       ├── parsers/
│       │   └── bca-parser.ts  # Regex parser untuk mutasi BCA
│       ├── pdf-export.ts
│       ├── types.ts     # FinanceTransaction, ParsedTransaction, ...
│       └── utils.ts
└── lib/
    ├── supabase/
    │   ├── migrations/  # SQL migration: mutasi_usage table
    │   └── ...
    └── utils/
```

---

## 📄 Laporan PDF

Klik **"Laporan PDF"** di halaman Keuangan → pilih tahun & siklus → **Unduh PDF**.

Isi laporan:
- Header dengan nama app + periode
- 4 summary cards (Pemasukan / Pengeluaran / Surplus / Savings Rate)
- Tabel kategori pemasukan & pengeluaran berdampingan
- Box pengeluaran harian pokok (Makanan + Transportasi)
- Tabel detail pemasukan + total footer
- Tabel detail pengeluaran + total footer
- Footer halaman dengan nomor halaman

---

## 🔐 Authentication Flow

1. **Register** &rarr; konfirmasi email
2. **Login** &rarr; dengan show/hide password & "Ingat saya"
3. **Lupa Password** &rarr; kirim email reset via Supabase (di halaman login) atau gunakan **Lupa Password via OTP** langsung di halaman Pengaturan
4. **Reset Password** &rarr; klik link email &rarr; form password baru
5. **Ubah Password** &rarr; di halaman Pengaturan (re-auth + update)
6. **Lupa Password via OTP** &rarr; di halaman Pengaturan:
   - Klik "Lupa password?" di kartu Ubah Password
   - Kirim kode OTP/reset ke email yang terdaftar
   - Masukkan kode OTP secara langsung di halaman Pengaturan untuk verifikasi
   - Setelah diverifikasi, atur password baru secara instan tanpa perlu memasukkan password saat ini

---

## ⚙️ Mode Pemeliharaan & Jalur Darurat (Bypass Lockout)

Aplikasi dilengkapi dengan sistem **Mode Pemeliharaan (Maintenance Mode)** global. Ketika diaktifkan oleh Administrator:
- Seluruh pengguna biasa akan langsung dialihkan ke halaman pemeliharaan secara real-time.
- Untuk mencegah administrator terkunci di luar sistem (**lockout**) jika tidak sengaja keluar/logout saat pemeliharaan aktif, terdapat rute pengecualian otentikasi di `src/proxy.ts` dan **Jalur Login Darurat (Admin Backdoor Login)** langsung di halaman pemeliharaan untuk mengamankan akses administratif.

---

## 📅 Siklus Billing 25–24

Timeline keuangan berjalan dari tanggal **25** suatu bulan sampai **24** bulan berikutnya. Ini memungkinkan:
- Tracking pengeluaran lebih akurat sesuai siklus gajian
- Pilih dan bandingkan siklus-siklus lampau
- Filter berdasarkan tahun untuk navigasi multi-tahun

---

## 📜 Lisensi

Wafiy Anwarul Hikam — © 2026 kekayaan.id
