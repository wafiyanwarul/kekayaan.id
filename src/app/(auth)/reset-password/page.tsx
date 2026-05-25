"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    // Check if user has a valid session (set by auth/callback after token exchange)
    const supabase = createClient()

    const checkSession = async () => {
      // Handle hash fragment tokens (legacy Supabase implicit flow)
      // This handles the case where the URL has #access_token=...
      const hash = window.location.hash
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1))
        const access_token = params.get("access_token")
        const refresh_token = params.get("refresh_token")

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })
          if (!error) {
            setSessionReady(true)
            setCheckingSession(false)
            // Clean the URL
            window.history.replaceState({}, "", "/reset-password")
            return
          }
        }
      }

      // Check normal session (set by PKCE callback)
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setSessionReady(true)
      } else {
        // No valid session, redirect to forgot-password
        setError("Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link baru.")
      }
      setCheckingSession(false)
    }

    checkSession()

    // Also listen for auth state changes (triggered by hash fragment exchange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true)
        setCheckingSession(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Password tidak cocok!")
      return
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Sign out after password reset so user can login fresh
    await supabase.auth.signOut()

    setTimeout(() => {
      router.push("/login")
    }, 2500)
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Memverifikasi link...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 mb-2">
            <span className="text-3xl">✅</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Password Berhasil Diubah!</h2>
            <p className="text-slate-400 text-sm">
              Kamu akan diarahkan ke halaman login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 mb-3">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Buat Password Baru</h1>
          <p className="text-sm text-slate-400">
            Pilih password baru yang kuat untuk akunmu.
          </p>
        </div>

        {/* Error state when no valid session */}
        {!sessionReady && error ? (
          <div className="space-y-4">
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-center">
              {error}
            </div>
            <Link
              href="/forgot-password"
              className="block w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition text-center"
            >
              Minta Link Reset Baru
            </Link>
          </div>
        ) : (
          /* Reset Form */
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Password Baru
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1a1d2e] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1a1d2e] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Password strength hint */}
            {password && (
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= (i + 1) * 3
                        ? password.length >= 12
                          ? "bg-green-500"
                          : password.length >= 8
                          ? "bg-yellow-500"
                          : "bg-red-500"
                        : "bg-[#1e2235]"
                    }`}
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !sessionReady}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
            >
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-400">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            ← Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  )
}
