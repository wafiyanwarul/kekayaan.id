"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AlertTriangle, Clock, X, Wrench } from "lucide-react"

export function MaintenanceListener({ userId }: { userId: string | null }) {
  const [maintenance, setMaintenance] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [elapsedTime, setElapsedTime] = useState("00:00:00")
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // 1. Fetch user role and initial maintenance settings
  useEffect(() => {
    if (!userId) return

    async function checkRole() {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle()
      if (data) {
        setIsAdmin(data.role === "admin" || data.role === "super_admin")
      }
    }

    checkRole()
  }, [userId])

  // 2. Poll maintenance status every 15 seconds
  useEffect(() => {
    async function fetchMaintenanceStatus() {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "maintenance")
        .maybeSingle()

      if (data && data.value) {
        setMaintenance(data.value)
      }
    }

    fetchMaintenanceStatus()
    const interval = setInterval(fetchMaintenanceStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  // 3. React to maintenance status changes (redirect normal users)
  useEffect(() => {
    if (!maintenance || isAdmin) return

    const nowMs = Date.now()
    const isMaintenanceActive = maintenance.is_active || (
      maintenance.type === "scheduled" &&
      maintenance.scheduled_start &&
      maintenance.scheduled_end &&
      nowMs >= new Date(maintenance.scheduled_start).getTime() &&
      nowMs <= new Date(maintenance.scheduled_end).getTime()
    )

    if (isMaintenanceActive && pathname !== "/maintenance") {
      router.push("/maintenance")
    }
  }, [maintenance, isAdmin, pathname, router])

  // 4. Timer ticking logic for Admins when maintenance is active
  useEffect(() => {
    if (!maintenance || !isAdmin) return

    const nowMs = Date.now()
    const isMaintenanceActiveNow = maintenance.is_active || (
      maintenance.type === "scheduled" &&
      maintenance.scheduled_start &&
      maintenance.scheduled_end &&
      nowMs >= new Date(maintenance.scheduled_start).getTime() &&
      nowMs <= new Date(maintenance.scheduled_end).getTime()
    )

    if (!isMaintenanceActiveNow) {
      setElapsedTime("00:00:00")
      return
    }

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
  }, [maintenance, isAdmin])

  if (!maintenance) return null

  const nowMs = Date.now()
  const isMaintenanceActiveNow = maintenance.is_active || (
    maintenance.type === "scheduled" &&
    maintenance.scheduled_start &&
    maintenance.scheduled_end &&
    nowMs >= new Date(maintenance.scheduled_start).getTime() &&
    nowMs <= new Date(maintenance.scheduled_end).getTime()
  )

  // Render Red Warning Banner for Admins/Super Admins when maintenance is actively running
  if (isAdmin && isMaintenanceActiveNow) {
    return (
      <div className="relative w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-2.5 px-4 flex items-center justify-between shadow-md z-50 border-b border-red-500/20">
        <div className="flex items-center gap-2.5 mx-auto text-xs sm:text-sm font-semibold tracking-wide">
          <Wrench className="h-4.5 w-4.5 text-red-100 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
          <span>
            <strong className="text-red-100 uppercase tracking-wider">[DANGER ZONE / MODE PEMELIHARAAN AKTIF]</strong>: Akses saat ini diblokir untuk pengguna biasa. Durasi berjalan: <strong className="font-mono bg-red-800/40 px-2 py-0.5 rounded text-white tracking-widest text-xs sm:text-sm mx-1">{elapsedTime}</strong>.
          </span>
        </div>
      </div>
    )
  }

  // Check if scheduled in the future
  const isScheduledFuture = 
    maintenance.type === "scheduled" &&
    maintenance.scheduled_start &&
    nowMs < new Date(maintenance.scheduled_start).getTime()

  if (!isScheduledFuture || isMaintenanceActiveNow || dismissed) return null

  const formattedStart = new Date(maintenance.scheduled_start).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  })

  const formattedEnd = maintenance.scheduled_end
    ? new Date(maintenance.scheduled_end).toLocaleString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      })
    : ""

  return (
    <div className="relative w-full bg-gradient-to-r from-amber-500/90 to-orange-600/90 text-white py-2 px-4 flex items-center justify-between shadow-md z-50">
      <div className="flex items-center gap-2.5 mx-auto text-xs sm:text-sm font-semibold tracking-wide">
        <AlertTriangle className="h-4.5 w-4.5 text-amber-100 animate-pulse shrink-0" />
        <span>
          <span className="underline decoration-amber-200 underline-offset-2">Pengumuman Pemeliharaan</span>: Sistem akan dinonaktifkan sementara untuk pemeliharaan terjadwal pada <strong className="text-amber-100">{formattedStart}</strong> s.d. <strong className="text-amber-100">{formattedEnd} WIB</strong>.
        </span>
      </div>
      <button 
        type="button" 
        onClick={() => setDismissed(true)} 
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-amber-100 hover:bg-white/10 hover:text-white transition cursor-pointer"
        title="Tutup pengumuman"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

