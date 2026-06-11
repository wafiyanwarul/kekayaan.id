"use client"

import { useMemo, useState } from "react"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toDateInputValue } from "../utils"
import { DatePicker } from "./DatePicker"
import { StyledSelect } from "./StyledSelect"
import type { FinanceCategory, FinanceTransaction, TransactionType } from "../types"

interface Props {
  categories: FinanceCategory[]
  transaction: FinanceTransaction | null
  userId: string
  onClose: () => void
  onSaved: (transaction: FinanceTransaction, isEdit: boolean) => void
}

export function TransactionFormModal({ categories, transaction, userId, onClose, onSaved }: Props) {
  const isEdit = !!transaction
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense")
  const [title, setTitle] = useState(transaction?.title ?? "")
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? "")
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "")
  const [transactionDate, setTransactionDate] = useState(transaction?.transaction_date ?? toDateInputValue())
  const [notes, setNotes] = useState(transaction?.notes ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  )

  const categoryOptions = useMemo(() => [
    { value: "", label: "Tanpa kategori" },
    ...filteredCategories.map((c) => ({ value: c.id, label: c.name })),
  ], [filteredCategories])

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType)
    const nextCategory = categories.find((category) => category.type === nextType)
    setCategoryId(nextCategory?.id ?? "")
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return

    setLoading(true)
    setError("")

    const supabase = createClient()
    const payload = {
      amount: Number(amount),
      category_id: categoryId || null,
      notes: notes || null,
      title,
      transaction_date: transactionDate,
      type,
      user_id: userId,
    }

    const query = isEdit
      ? supabase
          .from("transactions")
          .update(payload)
          .eq("id", transaction.id)
          .select("*, category:transaction_categories(*)")
          .single()
      : supabase
          .from("transactions")
          .insert(payload)
          .select("*, category:transaction_categories(*)")
          .single()

    const { data, error } = await query

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    onSaved({ ...(data as FinanceTransaction), amount: Number(data.amount) }, isEdit)
  }

  const inputCls = "w-full rounded-lg border border-[#1e2235] bg-[#0f1117] px-3 py-2 text-sm text-white placeholder:text-slate-500 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-500/60"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <div className="w-full max-w-[400px] rounded-2xl border border-[#1e2235] bg-[#1a1d2e] p-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">{isEdit ? "Edit Transaksi" : "Tambah Transaksi"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-red-500/15 hover:text-red-200 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-[#0f1117] p-1">
            {(["expense", "income"] as TransactionType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleTypeChange(option)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition cursor-pointer ${
                  type === option
                    ? option === "income"
                      ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200"
                      : "bg-rose-500/15 dark:bg-rose-500/20 text-rose-700 dark:text-rose-200"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {option === "income" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Sumber / Deskripsi</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "income" ? "cth: Gaji, freelance" : "cth: Makan siang, bensin"}
              required
              className={inputCls}
            />
          </div>

          {/* Amount + Date — 2-column */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Nominal (Rp)</label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="45000"
                required
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Tanggal</label>
              <DatePicker
                value={transactionDate}
                onChange={setTransactionDate}
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Kategori</label>
            <StyledSelect
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">
              Catatan <span className="text-slate-500">(opsional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="cth: dari rekening BCA, cash, e-wallet"
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-[#1e2235] py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
