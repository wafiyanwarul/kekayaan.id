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
    <svg viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-2xl mx-auto drop-shadow-2xl">
      {/* Background card / dashboard mockup */}
      <rect x="60" y="60" width="360" height="240" rx="18" fill="#181d30" stroke="#2a3150" strokeWidth="1.5" />
      {/* Title bar dots */}
      <circle cx="84" cy="82" r="5" fill="#ef4444" opacity="0.7" />
      <circle cx="100" cy="82" r="5" fill="#f59e0b" opacity="0.7" />
      <circle cx="116" cy="82" r="5" fill="#10b981" opacity="0.7" />

      {/* Mini chart bars */}
      <rect x="90" y="200" width="28" height="60" rx="4" fill="#6366f1" opacity="0.5" />
      <rect x="128" y="170" width="28" height="90" rx="4" fill="#6366f1" opacity="0.65" />
      <rect x="166" y="140" width="28" height="120" rx="4" fill="#6366f1" opacity="0.8" />
      <rect x="204" y="160" width="28" height="100" rx="4" fill="#818cf8" opacity="0.7" />
      <rect x="242" y="120" width="28" height="140" rx="4" fill="#818cf8" opacity="0.85" />
      <rect x="280" y="145" width="28" height="115" rx="4" fill="#a5b4fc" opacity="0.7" />
      <rect x="318" y="110" width="28" height="150" rx="4" fill="#a5b4fc" opacity="0.9" />
      <rect x="356" y="130" width="28" height="130" rx="4" fill="#c7d2fe" opacity="0.6" />

      {/* Stat card top-left */}
      <rect x="86" y="100" width="130" height="52" rx="10" fill="#1e2440" stroke="#2e3660" strokeWidth="1" />
      <text x="98" y="120" fill="#94a3b8" fontSize="9" fontFamily="system-ui">Total Kekayaan</text>
      <text x="98" y="140" fill="#a5b4fc" fontSize="16" fontWeight="700" fontFamily="system-ui">Rp 248,5 jt</text>

      {/* Stat card top-right */}
      <rect x="230" y="100" width="120" height="52" rx="10" fill="#1e2440" stroke="#2e3660" strokeWidth="1" />
      <text x="242" y="120" fill="#94a3b8" fontSize="9" fontFamily="system-ui">Goals Tercapai</text>
      <text x="242" y="140" fill="#34d399" fontSize="16" fontWeight="700" fontFamily="system-ui">12 / 15</text>

      {/* Floating coin */}
      <g className="animate-bounce" style={{ animationDuration: '3s' }}>
        <circle cx="400" cy="50" r="26" fill="url(#coinGrad)" />
        <text x="400" y="56" textAnchor="middle" fill="#1e1b4b" fontSize="22" fontWeight="800" fontFamily="system-ui">₹</text>
      </g>

      {/* Floating wallet */}
      <g className="animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
        <rect x="48" y="170" width="40" height="30" rx="6" fill="#4f46e5" />
        <rect x="52" y="176" width="18" height="8" rx="3" fill="#818cf8" />
        <circle cx="78" cy="185" r="5" fill="#a5b4fc" />
      </g>

      {/* Growth line / arrow */}
      <path d="M100 280 L180 250 L260 270 L340 220 L390 200" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
      <polygon points="390,196 398,204 386,206" fill="#6366f1" opacity="0.6" />

      {/* Bottom wave / platform */}
      <ellipse cx="240" cy="330" rx="200" ry="22" fill="#6366f1" opacity="0.08" />
      <ellipse cx="240" cy="340" rx="160" ry="14" fill="#6366f1" opacity="0.05" />

      {/* Decorative circles */}
      <circle cx="420" cy="300" r="40" fill="#6366f1" opacity="0.04" />
      <circle cx="60" cy="340" r="30" fill="#818cf8" opacity="0.05" />

      {/* Gradient defs */}
      <defs>
        <linearGradient id="coinGrad" x1="374" y1="24" x2="426" y2="76">
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

/* ─────────────────── Login Page ─────────────────── */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function getLoginErrorMessage(errorMsg: string): string {
    const msg = errorMsg.toLowerCase()
    if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
      return "Email belum terdaftar atau password salah. Periksa kembali, atau daftar akun baru jika belum memiliki akun."
    }
    if (msg.includes("email not confirmed")) {
      return "Email belum diverifikasi. Kami akan mengarahkanmu ke halaman verifikasi."
    }
    if (msg.includes("too many requests") || msg.includes("rate limit")) {
      return "Terlalu banyak percobaan login. Silakan tunggu beberapa menit sebelum mencoba lagi."
    }
    if (msg.includes("network") || msg.includes("fetch")) {
      return "Koneksi gagal. Periksa internet kamu dan coba lagi."
    }
    if (msg.includes("user not found")) {
      return "Akun dengan email ini tidak ditemukan. Silakan daftar terlebih dahulu."
    }
    if (msg.includes("email rate limit exceeded")) {
      return "Batas pengiriman email tercapai. Tunggu beberapa saat sebelum mencoba lagi."
    }
    return errorMsg
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const isEmailNotConfirmed =
        error.message.toLowerCase().includes("email not confirmed") ||
        ("code" in error && (error as unknown as Record<string, unknown>).code === "email_not_confirmed")

      if (isEmailNotConfirmed) {
        window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`
        return
      }

      // Check if email is actually registered via Supabase RPC
      try {
        const { data: isRegistered, error: rpcError } = await supabase.rpc("check_email_registered", { p_email: email })
        if (!rpcError && isRegistered === false) {
          setError("Email belum terdaftar. Periksa kembali email Anda, atau daftar akun baru.")
          setLoading(false)
          return
        }
      } catch (err) {
        console.error("Failed to check email registration status:", err)
      }

      setError(getLoginErrorMessage(error.message))
      setLoading(false)
      return
    }
    window.location.href = "/dashboard"
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Masuk ke akun kamu</h1>
            <p className="text-sm text-slate-400">Pantau kekayaan & raih tujuan finansialmu.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-slate-300">Email</label>
              <input
                id="login-email"
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
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="h-4 w-4 rounded border border-[#1e2440] bg-[#151829] peer-checked:bg-indigo-600 peer-checked:border-indigo-500 transition flex items-center justify-center">
                  {rememberMe && (
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition">Ingat saya</span>
            </label>

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
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#1e2440]" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">atau</span>
            <div className="flex-1 h-px bg-[#1e2440]" />
          </div>

          {/* Google (disabled) */}
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#1e2440] bg-[#151829] text-slate-400 font-medium text-sm cursor-not-allowed opacity-50 transition"
            title="Segera hadir"
          >
            <GoogleIcon />
            Masuk dengan Google
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full ml-auto">Segera</span>
          </button>

          {/* Register link */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Belum punya akun?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition">Daftar</Link>
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
          {/* Radial glow top-right */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-600/8 blur-3xl" />
          {/* Radial glow bottom-left */}
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-3xl" />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />
          {/* Diagonal accent line */}
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl w-full px-8 space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Semua Kekayaanmu,{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Satu Kendali Penuh.
              </span>
            </h2>
            <p className="text-base text-slate-400 leading-relaxed">
              Lacak aset, pantau pengeluaran, dan wujudkan tujuan finansialmu — semua dalam satu dashboard cerdas yang bekerja untukmu 24/7.
            </p>
          </div>

          {/* Illustration */}
          <HeroIllustration />

          {/* Trust badges */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xs text-slate-500">Enkripsi End-to-End</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs text-slate-500">Realtime Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs text-slate-500">Smart Analytics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
