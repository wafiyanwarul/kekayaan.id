"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

/* ─────────────────── Inline SVG Illustration ─────────────────── */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-2xl mx-auto drop-shadow-2xl">
      {/* Central phone/app mockup */}
      <rect x="140" y="30" width="200" height="310" rx="22" fill="#181d30" stroke="#2a3150" strokeWidth="1.5" />
      <rect x="155" y="50" width="170" height="270" rx="10" fill="#10131f" />

      {/* Phone top bar */}
      <rect x="195" y="38" width="90" height="6" rx="3" fill="#2a3150" />

      {/* Balance section */}
      <text x="175" y="85" fill="#64748b" fontSize="9" fontFamily="system-ui">Saldo Total</text>
      <text x="175" y="108" fill="#e2e8f0" fontSize="18" fontWeight="700" fontFamily="system-ui">Rp 156,8 jt</text>
      <text x="175" y="125" fill="#34d399" fontSize="10" fontFamily="system-ui">↑ +12.4% bulan ini</text>

      {/* Mini donut chart */}
      <circle cx="205" cy="185" r="40" fill="none" stroke="#1e2440" strokeWidth="12" />
      <circle cx="205" cy="185" r="40" fill="none" stroke="#6366f1" strokeWidth="12"
        strokeDasharray="126 126" strokeDashoffset="0" strokeLinecap="round" />
      <circle cx="205" cy="185" r="40" fill="none" stroke="#818cf8" strokeWidth="12"
        strokeDasharray="63 189" strokeDashoffset="-126" strokeLinecap="round" />
      <circle cx="205" cy="185" r="40" fill="none" stroke="#a5b4fc" strokeWidth="12"
        strokeDasharray="42 210" strokeDashoffset="-189" strokeLinecap="round" />

      {/* Donut center text */}
      <text x="205" y="183" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="system-ui">Aset</text>
      <text x="205" y="196" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="700" fontFamily="system-ui">5 Jenis</text>

      {/* Legend items */}
      <circle cx="175" cy="245" r="4" fill="#6366f1" />
      <text x="184" y="248" fill="#94a3b8" fontSize="8" fontFamily="system-ui">Tabungan 50%</text>
      <circle cx="175" cy="262" r="4" fill="#818cf8" />
      <text x="184" y="265" fill="#94a3b8" fontSize="8" fontFamily="system-ui">Investasi 25%</text>
      <circle cx="175" cy="279" r="4" fill="#a5b4fc" />
      <text x="184" y="282" fill="#94a3b8" fontSize="8" fontFamily="system-ui">Properti 17%</text>

      {/* Goal progress card - floating right */}
      <g className="animate-bounce" style={{ animationDuration: '5s' }}>
        <rect x="310" y="80" width="140" height="70" rx="12" fill="#181d30" stroke="#2a3150" strokeWidth="1" />
        <text x="325" y="100" fill="#94a3b8" fontSize="8" fontFamily="system-ui">🎯 Goal: MacBook Pro</text>
        <rect x="325" y="110" width="110" height="6" rx="3" fill="#1e2440" />
        <rect x="325" y="110" width="77" height="6" rx="3" fill="#6366f1" />
        <text x="325" y="132" fill="#a5b4fc" fontSize="10" fontWeight="600" fontFamily="system-ui">70% tercapai</text>
        <text x="325" y="143" fill="#64748b" fontSize="7" fontFamily="system-ui">Rp 21 jt / Rp 30 jt</text>
      </g>

      {/* Notification card - floating left */}
      <g className="animate-bounce" style={{ animationDuration: '4s', animationDelay: '1.5s' }}>
        <rect x="30" y="160" width="120" height="55" rx="12" fill="#181d30" stroke="#2a3150" strokeWidth="1" />
        <text x="45" y="180" fill="#94a3b8" fontSize="8" fontFamily="system-ui">📊 Pengeluaran</text>
        <text x="45" y="198" fill="#f87171" fontSize="13" fontWeight="700" fontFamily="system-ui">- Rp 2,4 jt</text>
        <text x="45" y="210" fill="#64748b" fontSize="7" fontFamily="system-ui">Minggu ini</text>
      </g>

      {/* Floating coins */}
      <g className="animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>
        <circle cx="80" cy="80" r="18" fill="url(#coinGradReg)" />
        <text x="80" y="85" textAnchor="middle" fill="#1e1b4b" fontSize="16" fontWeight="800" fontFamily="system-ui">$</text>
      </g>

      <g className="animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '2s' }}>
        <circle cx="400" cy="280" r="14" fill="url(#coinGradReg)" opacity="0.7" />
        <text x="400" y="284" textAnchor="middle" fill="#1e1b4b" fontSize="12" fontWeight="800" fontFamily="system-ui">¥</text>
      </g>

      {/* Decorative elements */}
      <circle cx="420" cy="50" r="50" fill="#6366f1" opacity="0.04" />
      <circle cx="50" cy="320" r="35" fill="#818cf8" opacity="0.04" />

      <defs>
        <linearGradient id="coinGradReg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ─────────────────── Google Icon ─────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/* ─────────────────── Register Page ─────────────────── */
export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      const isRateLimited =
        error.status === 429 ||
        error.message.toLowerCase().includes("rate limit")

      setError(
        isRateLimited
          ? "Limit email konfirmasi Supabase sedang habis. Tunggu sekitar 1 jam, atau matikan email confirmation saat development."
          : error.message
      )
      setLoading(false)
      return
    }

    // Redirect to Verify OTP page
    window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError("")
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      setError("Konfigurasi Google Client ID tidak ditemukan di .env.")
      setLoading(false)
      return
    }
    const redirectUri = `${window.location.origin}/api/auth/callback/google`
    const scope = "openid email profile"
    const responseType = "code"
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
    window.location.href = googleAuthUrl
  }

  return (
    <div className="min-h-screen flex bg-[#0a0c14]">

      {/* ── Left Column: Form ── */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-between px-6 sm:px-10 lg:px-14 py-8 bg-[#0f1117] relative z-10">

        {/* Logo */}
        <div className="flex items-center gap-3 max-w-sm mx-auto w-full">
          <Image
            src="/android-chrome-192x192.png"
            alt="kekayaan.id logo"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-lg font-bold text-white tracking-tight">kekayaan.id</span>
        </div>

        {/* Form Section */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="space-y-1 mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Buat akun baru</h1>
            <p className="text-sm text-slate-400">Mulai kelola dan pantau kekayaanmu sekarang.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="text-sm font-medium text-slate-300">Email</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="kamu@email.com"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#151829] border border-[#1e2440] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="register-password" className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 karakter"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-[#151829] border border-[#1e2440] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">Minimal 8 karakter, kombinasi huruf besar, kecil, angka & simbol</p>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#1e2440]" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">atau</span>
            <div className="flex-1 h-px bg-[#1e2440]" />
          </div>

          {/* Google login button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#1e2440] bg-[#151829] hover:bg-[#1f233a] hover:text-white text-slate-300 font-medium text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            Daftar dengan Google
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">Masuk</Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-600 text-center max-w-sm mx-auto w-full">
          © {new Date().getFullYear()} kekayaan.id — Personal Wealth OS
        </p>
      </div>

      {/* ── Right Column: Hero / Visual Panel ── */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden bg-[#0a0c14]">

        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-violet-500/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl w-full px-8 space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Mulai Sekarang,{" "}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                Wujudkan Masa Depan Finansialmu.
              </span>
            </h2>
            <p className="text-base text-slate-400 leading-relaxed">
              Gabung dengan kekayaan.id — pantau seluruh aset, atur anggaran harian, dan capai setiap goal finansialmu lebih cepat dari yang kamu bayangkan.
            </p>
          </div>

          {/* Illustration */}
          <HeroIllustration />

          {/* Feature highlights */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs text-slate-500">Gratis Selamanya</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-xs text-slate-500">Data Privat & Aman</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className="text-xs text-slate-500">Setup 2 Menit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
