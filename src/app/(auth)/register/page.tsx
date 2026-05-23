"use client"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
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
    setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-5xl">📬</div>
        <h2 className="text-xl font-bold text-white">Cek email kamu!</h2>
        <p className="text-slate-400 text-sm">Kami kirim link konfirmasi ke <span className="text-indigo-400">{email}</span>. Klik link itu untuk aktivasi akun.</p>
        <Link href="/login" className="inline-block text-sm text-indigo-400 hover:text-indigo-300">← Kembali ke Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 mb-3">
            <span className="text-2xl">💰</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Buat akun baru</h1>
          <p className="text-sm text-slate-400">Mulai kelola kekayaanmu</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kamu@email.com" required
              className="w-full px-4 py-2.5 rounded-lg bg-[#1a1d2e] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 karakter" required minLength={6}
              className="w-full px-4 py-2.5 rounded-lg bg-[#1a1d2e] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          </div>

          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg transition">
            {loading ? "Mendaftar..." : "Daftar Sekarang"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
