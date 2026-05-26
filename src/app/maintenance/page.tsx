"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CloudAlert, Clock, Sparkles } from "lucide-react"

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [elapsedTime, setElapsedTime] = useState("00:00:00")
  const supabase = createClient()

  // Fetch status on load
  useEffect(() => {
    async function fetchStatus() {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "maintenance")
        .maybeSingle()
      if (data && data.value) {
        setMaintenance(data.value)
      }
      setLoading(false)
    }
    fetchStatus()
  }, [])

  // Timer logic for active_since
  useEffect(() => {
    if (!maintenance) return
    
    // If it's a scheduled maintenance, activeSince could be scheduled_start (or active_since)
    const baseTime = maintenance.active_since || maintenance.scheduled_start
    if (!baseTime) return

    const start = new Date(baseTime).getTime()

    const interval = setInterval(() => {
      const diff = Date.now() - start
      if (diff < 0) {
        setElapsedTime("00:00:00")
        return
      }

      const hrs = Math.floor(diff / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      const secs = Math.floor((diff % 60000) / 1000)

      setElapsedTime(
        `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [maintenance])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090e]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  const isScheduled = maintenance?.type === "scheduled"
  const formattedStart = maintenance?.scheduled_start
    ? new Date(maintenance.scheduled_start).toLocaleString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : ""
  const formattedEnd = maintenance?.scheduled_end
    ? new Date(maintenance.scheduled_end).toLocaleString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      })
    : ""

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07090e] p-4 overflow-hidden">
      {/* Decorative blurred blobs */}
      <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-rose-500/10 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg rounded-2xl border border-[#1e2235] bg-[#0f111a]/85 p-8 text-center shadow-2xl backdrop-blur-md relative z-10">
        
        {/* Favicon Logo */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/5 ring-1 ring-indigo-500/10 overflow-hidden shadow-inner">
          <img src="/android-chrome-512x512.png" alt="kekayaan.id logo" className="h-16 w-16 object-contain" />
        </div>

        {/* Brand Tagline */}
        <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>kekayaan.id — Personal Wealth OS</span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          Sistem Sedang Dalam Pemeliharaan
        </h1>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Kami sedang melakukan peningkatan kapasitas server dan pemeliharaan database secara menyeluruh demi kenyamanan analisis finansial Anda yang lebih cepat dan aman.
        </p>

        {/* Live Timer Section */}
        <div className="mt-6 rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Durasi Pemeliharaan Berjalan</p>
          <div className="mt-1 font-mono text-3xl font-bold text-white tracking-widest sm:text-4xl">
            {elapsedTime}
          </div>
          <p className="mt-1.5 text-[10px] text-indigo-300">Jam : Menit : Detik</p>
        </div>

        {/* Scheduled Info Box */}
        {isScheduled && formattedStart && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-[#1e2235] bg-[#0b0c12] p-4 text-left">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
            <div>
              <p className="text-xs font-bold text-white">Jadwal Pemeliharaan Resmi</p>
              <p className="mt-1 text-[11px] text-slate-400 leading-normal">
                {formattedStart} - {formattedEnd} WIB.
              </p>
            </div>
          </div>
        )}

        {/* Alert note */}
        <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 p-3 text-left">
          <CloudAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-[11px] text-amber-300 leading-normal">
            Akses masuk akan otomatis dipulihkan setelah proses pemeliharaan selesai. Terima kasih atas kesabaran Anda.
          </p>
        </div>

      </div>
    </div>
  )
}
