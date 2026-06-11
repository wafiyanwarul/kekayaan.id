"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn, formatRupiah } from "@/lib/utils"
import { DatePicker } from "./DatePicker"
import type { FinanceCategory, FinanceTransaction, ParsedTransaction } from "../types"

interface Props {
  categories: FinanceCategory[]
  userId: string
  onClose: () => void
  onImported: (transactions: FinanceTransaction[]) => void
}

type Step = "upload" | "processing" | "preview" | "success"

const MAX_FILE_MB = 10
const DAILY_LIMIT = 3

export function MutasiImportModal({ categories, userId, onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>("upload")
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processingMsg, setProcessingMsg] = useState("Membaca file PDF...")
  const [rows, setRows] = useState<ParsedTransaction[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const expenseCategories = categories.filter((c) => c.type === "expense")
  const incomeCategories = categories.filter((c) => c.type === "income")

  // --- Drag & Drop ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) validateAndSetFile(dropped)
  }, [])

  function validateAndSetFile(f: File) {
    setError(null)
    if (f.type !== "application/pdf") {
      setError("Hanya file PDF yang diterima.")
      return
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Ukuran file terlalu besar. Maksimum ${MAX_FILE_MB} MB.`)
      return
    }
    setFile(f)
  }

  // --- Upload & Extract ---
  async function handleExtract() {
    if (!file) return
    setError(null)
    setStep("processing")
    setProcessingMsg("Membaca file PDF...")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bank", "bca")

      setTimeout(() => setProcessingMsg("Menganalisis transaksi..."), 1200)
      setTimeout(() => setProcessingMsg("Menyarankan kategori dengan AI..."), 2400)

      const res = await fetch("/api/mutasi/extract", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan saat ekstraksi.")
        setStep("upload")
        return
      }

      setRows(data.transactions as ParsedTransaction[])
      setRemaining(data.remaining)
      setStep("preview")
    } catch (err) {
      console.error("Extract error:", err)
      setError("Gagal terhubung ke server. Periksa koneksi internet kamu.")
      setStep("upload")
    }
  }

  // --- Row editing ---
  function updateRow(id: string, field: keyof ParsedTransaction, value: string | number | null) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  function toggleSelectAll() {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)))
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function deleteSelectedRows() {
    setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)))
    setSelectedIds(new Set())
  }

  // --- Import to Supabase ---
  async function handleImport() {
    if (importing) return
    setImporting(true)
    setError(null)

    const toImport = rows
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)

    const payload = toImport.map((r) => ({
      user_id: userId,
      title: r.title || r.raw_description.slice(0, 80),
      amount: r.amount,
      type: r.type,
      category_id: r.category_id || null,
      transaction_date: r.date || today,
      notes: "[Import BCA]",

    }))

    const { data, error: insertError } = await supabase
      .from("transactions")
      .insert(payload)
      .select("*, category:transaction_categories(*)")

    if (insertError) {
      console.error("Import error:", insertError)
      setError("Gagal menyimpan transaksi. Coba lagi.")
      setImporting(false)
      return
    }

    const saved = (data ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      amount: Number(t.amount),
    })) as FinanceTransaction[]

    setImportedCount(saved.length)
    onImported(saved)
    setStep("success")
    setImporting(false)
  }

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const uncategorisedCount = rows.filter((r) => !r.category_id).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#1e2235] bg-[#0f1117] shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2235] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15">
              <FileText className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import Mutasi Rekening</h2>
              <p className="text-xs text-slate-400">
                {step === "upload" && "Upload file PDF mutasi BCA"}
                {step === "processing" && "Mengekstraksi data..."}
                {step === "preview" && `${rows.length} transaksi ditemukan`}
                {step === "success" && "Import berhasil!"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 border-b border-[#1e2235] px-6 py-2">
          {(["upload", "processing", "preview", "success"] as Step[]).map((s, idx) => {
            const steps = ["upload", "processing", "preview", "success"] as Step[]
            const currentIdx = steps.indexOf(step)
            const isActive = s === step
            const isDone = steps.indexOf(s) < currentIdx
            return (
              <div key={s} className="flex items-center">
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded",
                    isActive && "text-indigo-400",
                    isDone && "text-emerald-400",
                    !isActive && !isDone && "text-slate-600"
                  )}
                >
                  {idx + 1}. {s === "upload" ? "Upload" : s === "processing" ? "Proses" : s === "preview" ? "Review" : "Selesai"}
                </span>
                {idx < 3 && <span className="text-slate-700 text-xs px-1">›</span>}
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ERROR BANNER */}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          {/* ===== STEP 1: UPLOAD ===== */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition",
                  dragOver
                    ? "border-indigo-400 bg-indigo-500/10"
                    : file
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-[#2a2f45] bg-[#0a0c14] hover:border-indigo-500/50 hover:bg-indigo-500/5"
                )}
              >
                {file ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{file.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {(file.size / 1024).toFixed(0)} KB · Klik untuk ganti
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-slate-500" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-300">
                        Drag & drop PDF mutasi di sini
                      </p>
                      <p className="mt-1 text-xs text-slate-500">atau klik untuk pilih file</p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) validateAndSetFile(f)
                }}
              />

              {/* Info row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-lg border border-[#1e2235] bg-[#1a1d2e] p-3">
                  <span className="text-base">🏦</span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bank</p>
                    <p className="text-xs font-semibold text-white">BCA (mBCA)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-[#1e2235] bg-[#1a1d2e] p-3">
                  <span className="text-base">📄</span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Format</p>
                    <p className="text-xs font-semibold text-white">PDF · Maks {MAX_FILE_MB} MB</p>
                  </div>
                </div>
                {remaining !== null && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#1e2235] bg-[#1a1d2e] p-3">
                    <span className="text-base">⚡</span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kuota</p>
                      <p className="text-xs font-semibold text-white">{remaining}/{DAILY_LIMIT} hari ini</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy notice */}
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-xs leading-5 text-emerald-300">
                  <strong>Privasi terjaga:</strong> File PDF kamu <strong>tidak disimpan</strong> di mana pun.
                  Data hanya diproses sesaat di server dan langsung dihapus setelah ekstraksi selesai.
                </p>
              </div>

              <button
                type="button"
                disabled={!file}
                onClick={handleExtract}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Ekstrak Transaksi →
              </button>
            </div>
          )}

          {/* ===== STEP 2: PROCESSING ===== */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center gap-6 py-16">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-indigo-500/20" />
                <Loader2 className="absolute inset-0 m-auto h-10 w-10 animate-spin text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-white">{processingMsg}</p>
                <p className="mt-1 text-sm text-slate-400">Mohon tunggu, jangan tutup halaman ini.</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#1e2235] bg-[#1a1d2e] px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <p className="text-xs text-slate-400">File tidak disimpan — hanya diproses di memory</p>
              </div>
            </div>
          )}

          {/* ===== STEP 3: PREVIEW ===== */}
          {step === "preview" && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-300">
                    {rows.length} transaksi
                  </span>
                  {uncategorisedCount > 0 && (
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                      ⚠️ {uncategorisedCount} belum berkategori
                    </span>
                  )}
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={deleteSelectedRows}
                      className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      Hapus {selectedIds.size} terpilih
                    </button>
                  )}
                </div>
                {remaining !== null && (
                  <span className="text-xs text-slate-500">Sisa kuota: {remaining}/{DAILY_LIMIT}</span>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-[#1e2235]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e2235] bg-[#1a1d2e]">
                      <th className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === rows.length && rows.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-600 bg-transparent accent-indigo-500"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Tanggal</th>
                      <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Keterangan</th>
                      <th className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Nominal</th>
                      <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Tipe</th>
                      <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Kategori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2235]">
                    {rows.map((row) => {
                      const filteredCats = row.type === "income" ? incomeCategories : expenseCategories
                      const isSelected = selectedIds.has(row.id)

                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            "transition",
                            isSelected ? "bg-rose-500/5" : "hover:bg-white/[0.02]"
                          )}
                        >
                          {/* Checkbox */}
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRow(row.id)}
                              className="rounded border-slate-600 bg-transparent accent-rose-500"
                            />
                          </td>

                          {/* Date */}
                          <td className="px-3 py-2.5">
                            {editingCell?.id === row.id && editingCell?.field === "date" ? (
                              <div className="w-40">
                                <DatePicker
                                  value={row.date}
                                  onChange={(val) => {
                                    updateRow(row.id, "date", val)
                                    setEditingCell(null)
                                  }}
                                  required
                                />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingCell({ id: row.id, field: "date" })}
                                className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition cursor-pointer"
                              >
                                {row.date}
                              </button>
                            )}
                          </td>

                          {/* Title */}
                          <td className="max-w-[200px] px-3 py-2.5">
                            {editingCell?.id === row.id && editingCell?.field === "title" ? (
                              <input
                                type="text"
                                value={row.title}
                                autoFocus
                                onChange={(e) => updateRow(row.id, "title", e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                className="w-full rounded bg-[#1a1d2e] px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingCell({ id: row.id, field: "title" })}
                                title={row.raw_description}
                                className="truncate max-w-[180px] text-left text-xs text-slate-200 hover:text-white transition cursor-pointer block"
                              >
                                {row.title || <span className="text-slate-500 italic">Klik untuk edit</span>}
                              </button>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="px-3 py-2.5 text-right">
                            {editingCell?.id === row.id && editingCell?.field === "amount" ? (
                              <input
                                type="number"
                                value={row.amount}
                                autoFocus
                                min={0}
                                onChange={(e) => updateRow(row.id, "amount", parseFloat(e.target.value) || 0)}
                                onBlur={() => setEditingCell(null)}
                                className="w-28 rounded bg-[#1a1d2e] px-2 py-1 text-right text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingCell({ id: row.id, field: "amount" })}
                                className={cn(
                                  "text-xs font-semibold transition cursor-pointer hover:underline",
                                  row.type === "income" ? "text-emerald-400" : "text-rose-400"
                                )}
                              >
                                {formatRupiah(row.amount)}
                              </button>
                            )}
                          </td>

                          {/* Type */}
                          <td className="px-3 py-2.5">
                            <select
                              value={row.type}
                              onChange={(e) => updateRow(row.id, "type", e.target.value)}
                              className="rounded-md border border-[#1e2235] bg-[#0f1117] px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              <option value="expense">Pengeluaran</option>
                              <option value="income">Pemasukan</option>
                            </select>
                          </td>

                          {/* Category */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={row.category_id ?? ""}
                                onChange={(e) => updateRow(row.id, "category_id", e.target.value || null)}
                                className={cn(
                                  "min-w-[130px] rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer",
                                  row.category_id
                                    ? "border-[#1e2235] bg-[#0f1117] text-slate-300"
                                    : "border-amber-500/40 bg-amber-500/5 text-amber-300"
                                )}
                              >
                                <option value="">— Pilih kategori —</option>
                                {filteredCats.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                    {row.suggested_category === cat.name ? " ✨" : ""}
                                  </option>
                                ))}
                              </select>
                              {row.suggested_category && !row.category_id && (
                                <span
                                  title={`Saran AI: ${row.suggested_category}`}
                                  className="shrink-0 rounded bg-indigo-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-400"
                                >
                                  AI
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {rows.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-500">
                  Semua baris telah dihapus.
                </div>
              )}

              {/* Action row */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setStep("upload"); setRows([]); setFile(null); setError(null) }}
                  className="text-sm text-slate-400 transition hover:text-white cursor-pointer"
                >
                  ← Upload ulang
                </button>
                <button
                  type="button"
                  disabled={rows.length === 0 || importing}
                  onClick={handleImport}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {importing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <>Import {rows.length} Transaksi →</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 4: SUCCESS ===== */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center gap-6 py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">Import Berhasil! 🎉</p>
                <p className="mt-2 text-sm text-slate-400">
                  <span className="font-semibold text-emerald-300">{importedCount} transaksi</span> berhasil ditambahkan ke Expense Tracker.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 cursor-pointer"
              >
                Selesai
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
