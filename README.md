# kekayaan.id — Personal Wealth Cockpit

> Aplikasi manajemen keuangan pribadi berbasis Next.js dengan siklus billing 25–24 dan laporan PDF otomatis.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Dashboard Keuangan** | Ringkasan aset, tujuan, dan cashflow dalam satu tampilan |
| **Expense Tracker** | Pencatatan pemasukan & pengeluaran dengan kategori |
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

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Auth & Database**: [Supabase](https://supabase.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Export**: [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Utils**: [date-fns](https://date-fns.org/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm / pnpm
- Supabase project
- PostgreSQL (via Supabase or local)

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
```

```bash
# 4. Generate Prisma client
npx prisma generate

# 5. Run development server
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
│   └── auth/            # Supabase auth callback
├── components/
│   ├── providers/       # AppPreferences, Supabase providers
│   ├── settings/        # SettingsPanel (termasuk Change Password)
│   └── ui/              # shadcn/ui components
├── features/
│   └── finance/
│       ├── components/  # FinanceClient, PdfExportModal, dll
│       ├── pdf-export.ts # Generator PDF laporan cashflow
│       ├── types.ts
│       └── utils.ts     # Cycle calculation, summarize transactions
└── lib/
    ├── supabase/        # Client & Server helpers
    └── utils.ts
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

1. **Register** → konfirmasi email
2. **Login** → dengan show/hide password & "Ingat saya"
3. **Lupa Password** → kirim email reset via Supabase
4. **Reset Password** → klik link email → form password baru
5. **Ubah Password** → di halaman Pengaturan (re-auth + update)

---

## 📅 Siklus Billing 25–24

Timeline keuangan berjalan dari tanggal **25** suatu bulan sampai **24** bulan berikutnya. Ini memungkinkan:
- Tracking pengeluaran lebih akurat sesuai siklus gajian
- Pilih dan bandingkan siklus-siklus lampau
- Filter berdasarkan tahun untuk navigasi multi-tahun

---

## 📜 Lisensi

Private project — © 2026 kekayaan.id
