"use client"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-2">
            <span className="text-3xl">📬</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Cek email kamu!</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Kami kirim link reset password ke{" "}
              <span className="text-indigo-400 font-medium">{email}</span>.
              <br />
              Klik link di email untuk membuat password baru.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Tidak ada email? Cek folder Spam atau{" "}
            <button
              onClick={() => { setSent(false) }}
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            >
              kirim ulang
            </button>
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-slate-400 hover:text-white transition"
          >
            ← Kembali ke Login
          </Link>
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
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Lupa Password?</h1>
          <p className="text-sm text-slate-400">
            Masukkan emailmu dan kami akan kirim link reset.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[#1a1d2e] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
          >
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Ingat passwordmu?{" "}
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
