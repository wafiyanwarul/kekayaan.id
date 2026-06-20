"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatRupiah, formatCompact } from "@/lib/utils"
import { AnimatedCounter } from "@/components/shared/AnimatedCounter"
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

  // Quick Save States
  const [quickSaveGoal, setQuickSaveGoal] = useState<Goal | null>(null)
  const [quickSaveAmount, setQuickSaveAmount] = useState("")
  const [quickSaveLoading, setQuickSaveLoading] = useState(false)
  const [quickSaveError, setQuickSaveError] = useState("")
  const [showInfo, setShowInfo] = useState(false)

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

  async function handleQuickSaveSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!quickSaveGoal) return
    setQuickSaveLoading(true)
    setQuickSaveError("")

    try {
      const addedAmount = parseFloat(quickSaveAmount)
      if (isNaN(addedAmount) || addedAmount <= 0) {
        throw new Error("Nominal tabungan tidak valid")
      }

      const newAmount = Number(quickSaveGoal.current_amount) + addedAmount
      const supabase = createClient()

      const { data, error } = await supabase
        .from("goals")
        .update({ current_amount: newAmount })
        .eq("id", quickSaveGoal.id)
        .select()
        .single()

      if (error) throw error

      setGoals(prev => prev.map(g => (g.id === quickSaveGoal.id ? (data as Goal) : g)))
      setQuickSaveGoal(null)
      setQuickSaveAmount("")
    } catch (err: any) {
      setQuickSaveError(err.message || "Gagal menambahkan tabungan")
    } finally {
      setQuickSaveLoading(false)
    }
  }

  // Calculate remaining months helper
  function getRemainingMonths(targetDateStr: string): number {
    const target = new Date(targetDateStr)
    const now = new Date()
    const diffTime = target.getTime() - now.getTime()
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.4)
    return diffMonths > 0 ? diffMonths : 0
  }

  // Human readable remaining time formatter
  function formatRemainingTime(days: number): string {
    if (days <= 0) return "Sudah Lewat Tanggal Target"
    if (days >= 365) {
      const years = Math.floor(days / 365)
      const months = Math.floor((days % 365) / 30.4)
      if (months === 0) return `${years} tahun lagi`
      return `${years} tahun ${months} bulan lagi`
    }
    if (days >= 30) {
      const months = Math.floor(days / 30.4)
      return `${months} bulan lagi`
    }
    return `${days} hari lagi`
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Total Target Keuangan",
            value: <AnimatedCounter value={totalTarget} formatter={formatCompact} />,
            sub: `${goals.length} target aktif`,
            color: "text-indigo-400",
            icon: Target,
          },
          {
            label: "Total Terkumpul",
            value: <AnimatedCounter value={totalSaved} formatter={formatCompact} />,
            sub: `Alokasi target aktif`,
            color: "text-emerald-400",
            icon: PiggyBank,
          },
          {
            label: "Sisa Kekurangan",
            value: <AnimatedCounter value={Math.max(0, totalTarget - totalSaved)} formatter={formatCompact} />,
            sub: `Dana yang perlu dicari`,
            color: "text-amber-400",
            icon: Wallet,
          },
          {
            label: "Progres Kumulatif",
            value: <AnimatedCounter value={overallProgress} formatter={(v) => `${v.toFixed(1)}%`} />,
            sub: "Dari seluruh target",
            color: "text-teal-400",
            icon: Percent,
          },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-[#1e2235] bg-[#1a1d2e] p-3 sm:p-4 flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide leading-tight">{s.label}</p>
                <p className={`text-base sm:text-lg md:text-xl font-extrabold ${s.color} whitespace-nowrap`}>{s.value}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 leading-none">{s.sub}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-[#0f1117] rounded-lg border border-[#1e2235] text-slate-400 shrink-0">
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>

          )
        })}
      </div>

      {/* Rata-rata Surplus Info Banner */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl goals-surplus-banner">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 goals-surplus-sparkles shrink-0" />
            <p className="text-xs sm:text-sm">
              Surplus arus kas bulanan aktif Anda saat ini adalah{" "}
              <span className="goals-surplus-amount font-bold">{formatRupiah(averageSurplus)}</span>.
            </p>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-xs font-semibold goals-surplus-link transition cursor-pointer self-start sm:self-auto"
          >
            {showInfo ? "🔒 Sembunyikan Detail & Rumus" : "🔍 Rumus & Transparansi Data"}
          </button>
        </div>

        {showInfo && (
          <div className="p-5 rounded-xl goals-formula-container text-xs space-y-4 leading-relaxed">
            <div className="space-y-1.5">
              <h4 className="font-bold goals-formula-title text-sm">📐 Rumus Perhitungan Target & Proyeksi:</h4>
              <ul className="list-disc pl-5 space-y-1 goals-formula-bullets">
                <li>
                  <span className="goals-formula-highlight font-medium">Sisa Kekurangan</span> = Target Nominal − Dana Terkumpul
                </li>
                <li>
                  <span className="goals-formula-highlight font-medium">Target Tabungan Bulanan</span> = Sisa Kekurangan ÷ Sisa Bulan s.d. Tanggal Target
                </li>
                <li>
                  <span className="goals-formula-highlight font-medium">Surplus Bulanan Aktif</span> = Diambil dari pencatatan transaksi di <strong>Arus Kas (Expense Tracker)</strong>. Kami hanya menghitung rata-rata dari bulan yang memiliki aktivitas transaksi agar kalkulasi pengguna baru tidak ter-dilusi oleh bulan kosong di masa lalu.
                </li>
              </ul>
            </div>

            <div className="space-y-1.5 border-t goals-formula-divider pt-3">
              <h4 className="font-bold goals-formula-title text-sm">💡 Hubungan dengan Expense Tracker & Aset:</h4>
              <p className="goals-formula-bullets">
                Jika Anda mencatat alokasi tabungan target (misalnya membeli Reksa Dana Bibit atau Emas) sebagai kategori <strong>&quot;Investasi&quot;</strong> yang bertipe <strong>Pengeluaran (Expense)</strong> di Expense Tracker, maka hal tersebut secara alami akan mengurangi nilai surplus kas bulanan Anda di sistem.
              </p>
              <p className="goals-formula-bullets mt-1">
                Namun, hal ini sepenuhnya aman! Anda dapat melacak kemajuannya secara transparan dengan memperbarui dana target di halaman ini melalui tombol <strong>+ Tabung Dana</strong> di setiap kartu untuk mencatat dana investasi/tabungan riil yang berhasil Anda sisihkan untuk goal tersebut.
              </p>
            </div>
          </div>
        )}
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

            const sisaKekurangan = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount))

            // Realistic required monthly savings
            // Note: remainingMonths defaults to a minimum of 0.1 to avoid division by zero
            const calculatedRemainingMonths = remainingMonths > 0 ? remainingMonths : 0.1
            const requiredMonthly = sisaKekurangan / calculatedRemainingMonths

            // Smart Projections
            let projectionText = ""
            let projectionStatus: "success" | "warning" | "info" = "info"

            if (isCompleted) {
              projectionText = "Target ini telah tercapai! Selamat atas kedisiplinan keuangan Anda! 🎉"
              projectionStatus = "success"
            } else if (averageSurplus > 0) {
              if (averageSurplus >= requiredMonthly) {
                projectionText = `Proyeksi: On track! Surplus bulanan Anda (${formatCompact(averageSurplus)}) mencukupi target tabungan bulanan (${formatCompact(requiredMonthly)}/bulan).`
                projectionStatus = "success"
              } else {
                const deficit = requiredMonthly - averageSurplus
                projectionText = `Proyeksi: Kurang surplus. Target tabungan adalah ${formatCompact(requiredMonthly)}/bulan, sedangkan surplus Anda baru ${formatCompact(averageSurplus)}/bulan (kurang ${formatCompact(deficit)}/bulan).`
                projectionStatus = "warning"
              }
            } else {
              projectionText = `Proyeksi: Untuk mencapai target tepat waktu, Anda perlu menyisihkan ${formatCompact(requiredMonthly)}/bulan.`
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
                      <span className="text-[10px] goals-countdown-badge px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        {formatRemainingTime(remainingDays)}
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
                            : "bg-gradient-to-r from-teal-500 to-cyan-500"
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

                {/* Card Actions Footer */}
                <div className="space-y-3 pt-2">
                  {!isCompleted && (
                    <button
                      onClick={() => {
                        setQuickSaveGoal(goal)
                        setQuickSaveAmount("")
                        setQuickSaveError("")
                      }}
                      className="w-full py-2 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/20 transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <PiggyBank className="h-3.5 w-3.5" />
                      + Tabung Dana
                    </button>
                  )}

                  {/* Projection Message */}
                  <div
                    className={`p-3 rounded-xl border text-[11px] font-medium leading-relaxed flex items-start gap-2.5 ${
                      projectionStatus === "success"
                        ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                        : projectionStatus === "warning"
                        ? "bg-rose-500/5 border-rose-500/10 text-rose-300"
                        : "bg-[#0f1117]/85 border-[#1e2235] text-slate-400"
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

      {/* Quick Save Modal */}
      {quickSaveGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e2235] bg-[#1a1d2e] p-6 space-y-5 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Tabung untuk Target</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Masukkan nominal yang ingin Anda tambahkan ke target <span className="text-indigo-300 font-semibold">{quickSaveGoal.title}</span>.
              </p>
            </div>

            <form onSubmit={handleQuickSaveSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nominal Tabungan (Rp)</label>
                <input
                  type="number"
                  value={quickSaveAmount}
                  onChange={e => setQuickSaveAmount(e.target.value)}
                  placeholder="cth: 500000"
                  required
                  min="1"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {quickSaveError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {quickSaveError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setQuickSaveGoal(null)
                    setQuickSaveAmount("")
                    setQuickSaveError("")
                  }}
                  disabled={quickSaveLoading}
                  className="flex-1 rounded-lg border border-[#1e2235] py-2.5 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={quickSaveLoading}
                  className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {quickSaveLoading ? "Menyimpan..." : "Tabung"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#1e2235] bg-[#1a1d2e] p-6 space-y-5 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Hapus Target?</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
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
