import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, Lock, AlertTriangle, ArrowLeft, Heart, Server } from "lucide-react"

export const metadata: Metadata = {
  title: "Kebijakan Privasi & Keamanan Data",
  description: "Informasi transparan mengenai bagaimana data Anda dilindungi, komitmen keamanan, serta kepatuhan penggunaan di kekayaan.id.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[20%] w-[35%] aspect-square rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[-10%] right-[20%] w-[30%] aspect-square rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      {/* Header Bar */}
      <header className="relative border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shadow-md">
              <Image
                src="/android-chrome-192x192.png"
                alt="kekayaan.id logo"
                width={20}
                height={20}
                className="rounded"
              />
            </div>
            <span className="text-sm font-semibold tracking-wider text-white">kekayaan.id</span>
          </div>

          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex-grow max-w-3xl mx-auto px-4 py-12 z-10">
        {/* Page Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/5">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Kebijakan Privasi & Keamanan Data
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl mx-auto">
            Pelajari bagaimana data Anda dikelola secara privat, protokol keamanan yang kami terapkan, serta aturan hukum kepatuhan penggunaan sistem.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Terakhir diperbarui: 15 Juni 2026
          </div>
        </div>

        {/* Content Card container */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xl backdrop-blur-sm">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base sm:text-lg">
              <Server className="h-5 w-5 shrink-0" />
              <h2>1. Manajemen & Penggunaan Data</h2>
            </div>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>
                Seluruh data keuangan, transaksi, aset, dan sasaran (goals) yang Anda masukkan disimpan secara aman menggunakan database PostgreSQL pihak ketiga yang dihosting di platform cloud <strong>Supabase</strong>.
              </p>
              <p>
                Kami menerapkan kebijakan <strong>Row Level Security (RLS)</strong> yang sangat ketat di tingkat database. Hal ini memastikan bahwa data Anda diisolasi secara penuh dan hanya dapat dibaca, ditambah, diubah, atau dihapus oleh Anda sendiri selaku pemilik sah yang terotentikasi melalui token JWT (JSON Web Token) dinamis setiap kali mengakses aplikasi.
              </p>
            </div>
          </section>

          <hr className="border-slate-800/60" />

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base sm:text-lg">
              <Lock className="h-5 w-5 shrink-0" />
              <h2>2. Protokol Keamanan & Privasi</h2>
            </div>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>
                Aplikasi <strong>kekayaan.id</strong> menggunakan enkripsi SSL/TLS tingkat tinggi untuk melindung seluruh lalu lintas data antara peranti Anda dan server kami. Informasi kredensial sensitif seperti kata sandi dienkripsi menggunakan hashing kriptografi satu arah yang kuat sebelum disimpan ke dalam database.
              </p>
              <p>
                Kami memegang teguh prinsip <strong>kedaulatan data finansial pribadi</strong>. Kami berkomitmen untuk <strong>tidak pernah menjual, membagikan, menyewakan, atau menyalahgunakan</strong> data finansial Anda kepada pihak ketiga manapun untuk kebutuhan periklanan, pemasaran komersial, profiling pasar, atau analisis eksternal lainnya.
              </p>
            </div>
          </section>

          <hr className="border-slate-800/60" />

          {/* Section 3 (Alert/Caution style) */}
          <section className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-3">
            <div className="flex items-center gap-2.5 text-red-400 font-bold text-base">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h2>3. Larangan Penyalahgunaan & Kepatuhan Hukum</h2>
            </div>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>
                Penggunaan aplikasi kekayaan.id beserta seluruh fiturnya (seperti pelacakan finansial pribadi, pengelolaan target keuangan, kalkulator portofolio, dan ekstraksi mutasi bank otomatis) <strong>hanya ditujukan untuk pencatatan dan pengelolaan keuangan pribadi secara sah</strong>.
              </p>
              <ul className="space-y-2 list-disc list-inside text-slate-300 text-xs sm:text-sm pl-1">
                <li>
                  <strong className="text-red-200">Anti-Pemalsuan:</strong> Dilarang keras mengunggah atau memanipulasi berkas mutasi bank atau dokumen eksternal lainnya untuk tujuan pemalsuan, penipuan, manipulasi data keuangan, atau tindakan ilegal lainnya.
                </li>
                <li>
                  <strong className="text-red-200">Anti-Pencucian Uang:</strong> Dilarang menggunakan sistem ini untuk memfasilitasi, mencatat, atau menyamarkan aktivitas transaksi keuangan hasil kejahatan, pendanaan terorisme, pencucian uang (money laundering), atau penghindaran pajak ilegal.
                </li>
                <li>
                  <strong className="text-red-200">Hak Penangguhan:</strong> Platform berhak mengambil tindakan tegas berupa penonaktifan akun secara permanen tanpa pemberitahuan sebelumnya jika ditemukan indikasi kuat pelanggaran hukum atau tindakan penyalahgunaan sistem yang merugikan.
                </li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-800/60" />

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base sm:text-lg">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <h2>4. Keamanan Integrasi AI (Ekstraktor PDF)</h2>
            </div>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>
                Saat Anda mengunggah berkas mutasi rekening bank untuk diekstraksi menggunakan fitur AI extractor kami, berkas tersebut ditransmisikan secara aman melalui REST API terenkripsi.
              </p>
              <p>
                Kami <strong>tidak menyimpan salinan fisik berkas PDF mutasi bank Anda secara permanen</strong> di penyimpanan cloud setelah proses pemindaian dan ekstraksi teks selesai dilakukan. Hasil pemrosesan segera diubah menjadi catatan angka transaksi biasa dan diklasifikasikan ke dalam kategori yang sesuai demi kenyamanan dan perlindungan privasi optimal Anda.
              </p>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <p>Dengan membuat akun atau menggunakan layanan kekayaan.id, Anda menyetujui syarat & ketentuan di atas.</p>
          <p>
            Jika Anda memiliki pertanyaan seputar perlindungan privasi data, silakan hubungi tim keamanan kami di{" "}
            <a href="mailto:support@kekayaan.id" className="text-indigo-400 hover:text-indigo-300 transition underline">
              support@kekayaan.id
            </a>
          </p>
        </div>
      </main>

      {/* Footer Bottom */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-6 text-center text-xs text-slate-500 z-10">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 kekayaan.id — Personal Wealth OS. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for complete financial privacy
          </p>
        </div>
      </footer>
    </div>
  )
}
