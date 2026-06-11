"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

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
  userId: string
  goal: Goal | null
  onClose: () => void
  onSaved: (goal: Goal, isEdit: boolean) => void
}

export const GOAL_TYPES = [
  { value: "savings", label: "Tabungan 💰" },
  { value: "investment", label: "Investasi 📈" },
  { value: "purchase", label: "Pembelian Barang 🛒" },
  { value: "debt_reduction", label: "Pelunasan Utang 💳" },
  { value: "travel", label: "Liburan & Travel ✈️" },
  { value: "other", label: "Lainnya 🎯" },
]

export function GoalFormModal({ userId, goal, onClose, onSaved }: Props) {
  const isEdit = !!goal
  const [title, setTitle] = useState(goal?.title ?? "")
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() ?? "")
  const [currentAmount, setCurrentAmount] = useState(goal?.current_amount?.toString() ?? "0")
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "")
  const [goalType, setGoalType] = useState(goal?.goal_type ?? "savings")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const payload = {
      user_id: userId,
      title,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount) || 0,
      target_date: targetDate,
      goal_type: goalType,
    }

    if (isEdit) {
      const { data, error } = await supabase
        .from("goals")
        .update(payload)
        .eq("id", goal.id)
        .select()
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      onSaved(data as Goal, true)
    } else {
      const { data, error } = await supabase
        .from("goals")
        .insert(payload)
        .select()
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      onSaved(data as Goal, false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[400px] bg-[#1a1d2e] border border-[#1e2235] rounded-2xl p-4 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{isEdit ? "Edit Target Keuangan" : "Tambah Target Baru"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-red-300 text-xl leading-none transition cursor-pointer"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Nama Target</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="cth: DP Rumah Kontrakan"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Tipe Target</label>
              <select
                value={goalType}
                onChange={e => setGoalType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                {GOAL_TYPES.map(g => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Target Tanggal</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Target Nominal (Rp)</label>
            <input
              type="number"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              placeholder="cth: 25000000"
              required
              min="1"
              className="w-full px-4 py-2.5 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Dana Terkumpul Saat Ini (Rp)</label>
            <input
              type="number"
              value={currentAmount}
              onChange={e => setCurrentAmount(e.target.value)}
              placeholder="cth: 5000000"
              required
              min="0"
              className="w-full px-4 py-2.5 rounded-lg bg-[#0f1117] border border-[#1e2235] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#1e2235] text-slate-300 hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-200 text-sm font-medium transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition cursor-pointer"
            >
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Target"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
