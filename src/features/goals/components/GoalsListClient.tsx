"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatRupiah, formatCompact } from "@/lib/utils"
import { GoalFormModal } from "./GoalFormModal"
import {
  Target,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Plane,
  Wallet,
  Calendar,
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  Sparkles,
  Percent,
} from "lucide-react"

interface Goal {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_amount: number
  target_date: string
  goal_type: string
  created_at: string
}

interface Props {
  initialGoals: Goal[]
  userId: string
  averageSurplus: number
}

const TYPE_ICONS: Record<string, any> = {
  savings: PiggyBank,
  investment: TrendingUp,
  purchase: ShoppingBag,
  debt_reduction: CreditCard,
  travel: Plane,
  other: Target,
}

const TYPE_LABELS: Record<string, string> = {
  savings: "Tabungan",
  investment: "Investasi",
  purchase: "Pembelian Barang",
  debt_reduction: "Pelunasan Utang",
  travel: "Liburan & Travel",
  other: "Lainnya",
}

export function GoalsListClient({ initialGoals, userId, averageSurplus }: Props) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null)

  // Calculate global stats
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0)
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  async function handleDelete(goal: Goal) {
    setDeleting(goal.id)
    const supabase = createClient()
    await supabase.from("goals").delete().eq("id", goal.id)
    setGoals(prev => prev.filter(g => g.id !== goal.id))
    setDeleting(null)
    setPendingDelete(null)
  }

  function handleSaved(goal: Goal, isEdit: boolean) {
    if (isEdit) {
      setGoals(prev => prev.map(g => (g.id === goal.id ? goal : g)))
    } else {
      setGoals(prev => [goal, ...prev])
    }
    setShowModal(false)
    setEditingGoal(null)
  }

  // Calculate remaining months helper
  function getRemainingMonths(targetDateStr: string): number {
    const target = new Date(targetDateStr)
    const now = new Date()
    const diffTime = target.getTime() - now.getTime()
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.4)
    return diffMonths > 0 ? diffMonths : 0
  }

  // Format date helper
  function formatDateIndonesian(dateStr: string): string {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Target Keuangan",
            value: formatCompact(totalTarget),
            sub: `${goals.length} target aktif`,
            color: "text-indigo-400",
            icon: Target,
          },
          {
            label: "Total Terkumpul",
            value: formatCompact(totalSaved),
            sub: `Alokasi target aktif`,
            color: "text-emerald-400",
            icon: PiggyBank,
          },
          {
            label: "Sisa Kekurangan",
            value: formatCompact(Math.max(0, totalTarget - totalSaved)),
            sub: `Dana yang perlu dicari`,
            color: "text-amber-400",
            icon: Wallet,
          },
          {
            label: "Progres Kumulatif",
            value: `${overallProgress.toFixed(1)}%`,
            sub: "Dari seluruh target",
            color: "text-purple-400",
            icon: Percent,
          },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-[#1e2235] bg-[#1a1d2e] p-4 flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</p>
                <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500">{s.sub}</p>
              </div>
              <div className="p-2 bg-[#0f1117] rounded-lg border border-[#1e2235] text-slate-400">
                <Icon className="h-4 w-4" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Rata-rata Surplus Info Banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-[#2e3660]/40 bg-[#181d30]/20 text-slate-300">
        <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
        <p className="text-xs sm:text-sm">
          Rata-rata surplus arus kas bulanan Anda saat ini adalah{" "}
          <span className="text-emerald-400 font-bold">{formatRupiah(averageSurplus)}</span>. Angka ini digunakan di bawah untuk memproyeksikan estimasi waktu pencapaian target tabungan Anda.
        </p>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white tracking-tight">Daftar Target Keuangan</h2>
        <button
          onClick={() => {
            setEditingGoal(null)
            setShowModal(true)
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition cursor-pointer"
        >
          + Tambah Target
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1e2235] p-16 text-center space-y-4">
          <div className="text-5xl">🎯</div>
          <div className="space-y-1">
            <p className="text-slate-300 text-sm font-semibold">Belum ada target keuangan aktif</p>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Tentukan target impian Anda, mulai dari dana darurat, liburan, investasi, hingga pembelian barang besar untuk memantau kemajuannya secara visual.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingGoal(null)
              setShowModal(true)
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Mulai Buat Target Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const Icon = TYPE_ICONS[goal.goal_type] || Target
            const progress = Math.min(100, Math.max(0, (Number(goal.current_amount) / Number(goal.target_amount)) * 100))
            const isCompleted = progress >= 100
            const remainingMonths = getRemainingMonths(goal.target_date)
            const remainingDays = Math.ceil(remainingMonths * 30.4)

            // Smart Projections
            let projectionText = ""
            let projectionStatus: "success" | "warning" | "info" = "info"

            const sisaKekurangan = Number(goal.target_amount) - Number(goal.current_amount)

            if (isCompleted) {
              projectionText = "Target ini telah tercapai! Selamat atas kedisiplinan keuangan Anda! 🎉"
              projectionStatus = "success"
            } else if (averageSurplus > 0) {
              const monthsNeeded = sisaKekurangan / averageSurplus
              if (monthsNeeded <= remainingMonths) {
                projectionText = `Proyeksi: Tepat waktu! Selesai dalam ~${Math.ceil(monthsNeeded)} bulan (Target sisa: ${Math.ceil(remainingMonths - monthsNeeded)} bulan)`
                projectionStatus = "success"
              } else {
                const deficitSurplus = (sisaKekurangan / remainingMonths) - averageSurplus
                projectionText = `Proyeksi: Terlambat ~${Math.ceil(monthsNeeded - remainingMonths)} bulan. Perlu tambahan surplus Rp ${formatCompact(deficitSurplus)}/bulan.`
                projectionStatus = "warning"
              }
            } else {
              projectionText = "Proyeksi: Masukkan surplus kas bulanan (pemasukan > pengeluaran) untuk melihat estimasi waktu pencapaian."
              projectionStatus = "info"
            }

            return (
              <div
                key={goal.id}
                className="rounded-2xl border border-[#1e2440] bg-[#181d30]/40 backdrop-blur-md p-5 space-y-4 hover:border-indigo-500/30 transition flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Goal Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-500/15 text-indigo-300 rounded-xl">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight group-hover:text-indigo-200 transition">
                          {goal.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {TYPE_LABELS[goal.goal_type]}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                      <button
                        onClick={() => {
                          setEditingGoal(goal)
                          setShowModal(true)
                        }}
                        className="p-1.5 text-xs bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-md transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setPendingDelete(goal)}
                        className="p-1.5 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-md transition cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  {/* Date information */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>Target: {formatDateIndonesian(goal.target_date)}</span>
                    {!isCompleted && (
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        {remainingDays > 0 ? `${remainingDays} hari lagi` : "Sudah Lewat Target"}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar & percentage */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs font-semibold">
                      <span className="text-slate-400">Progres Tabungan</span>
                      <span className={isCompleted ? "text-emerald-400" : "text-white"}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-[#0f1117] rounded-full overflow-hidden border border-[#1e2235]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : "bg-gradient-to-r from-indigo-500 to-purple-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs pt-0.5">
                      <span className="font-bold text-slate-300">
                        {formatRupiah(Number(goal.current_amount))}
                      </span>
                      <span className="text-slate-500">
                        dari {formatRupiah(Number(goal.target_amount))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Projection Message */}
                <div
                  className={`mt-4 p-3 rounded-xl border text-[11px] font-medium leading-relaxed flex items-start gap-2.5 ${
                    projectionStatus === "success"
                      ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                      : projectionStatus === "warning"
                      ? "bg-rose-500/5 border-rose-500/10 text-rose-300"
                      : "bg-[#0f1117]/80 border-[#1e2235] text-slate-400"
                  }`}
                >
                  {projectionStatus === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  )}
                  <span>{projectionText}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* GoalFormModal */}
      {showModal && (
        <GoalFormModal
          userId={userId}
          goal={editingGoal}
          onClose={() => {
            setShowModal(false)
            setEditingGoal(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e2235] bg-[#1a1d2e] p-6 space-y-5 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Hapus Target?</h2>
              <p className="text-sm text-slate-400">
                Target <span className="text-slate-200 font-medium">{pendingDelete.title}</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting === pendingDelete.id}
                className="flex-1 rounded-lg border border-[#1e2235] py-2.5 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(pendingDelete)}
                disabled={deleting === pendingDelete.id}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting === pendingDelete.id ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
