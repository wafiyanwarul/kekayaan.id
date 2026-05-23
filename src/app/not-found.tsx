"use client"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function NotFound() {
  const [dots, setDots] = useState("")
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".")
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Animated number */}
        <div className="relative">
          <div className="text-[120px] font-black leading-none select-none"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            404
          </div>
          <div className="absolute inset-0 text-[120px] font-black leading-none blur-2xl opacity-20 select-none"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            404
          </div>
        </div>

        {/* Icon */}
        <div className="text-5xl animate-bounce">🔍</div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Halaman tidak ditemukan</h2>
          <p className="text-slate-400 text-sm">
            Kayaknya kamu nyasar{dots} Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          </p>
        </div>

        {/* Fun financial quote */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-5 py-4">
          <p className="text-indigo-300 text-sm italic">
            "Diversifikasi portofolio itu penting, tapi jangan sampai nyasar ke halaman yang salah juga." 😄
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition text-sm">
            🏠 Ke Dashboard
          </Link>
          <button onClick={() => window.history.back()}
            className="px-6 py-2.5 bg-[#1a1d2e] hover:bg-[#1e2235] border border-[#1e2235] text-slate-300 font-semibold rounded-lg transition text-sm">
            ← Kembali
          </button>
        </div>
      </div>
    </div>
  )
}
